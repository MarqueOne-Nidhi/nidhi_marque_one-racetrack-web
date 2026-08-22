import React, { useEffect, useRef } from 'react';

/**
 * The circuit, drawn as a line, with a red marker lapping it and dragging a
 * glowing beam behind.
 *
 * THE ONE IDEA THAT MAKES IT WORK
 * The trail is NOT built from the marker's recent positions. A position
 * history lags, and lag on a closed circuit means the beam cuts the corners
 * and leaves the tarmac on every hairpin. Instead the dot AND every point of
 * the trail come from a single number — `head`, a distance in path-length
 * units. The dot sits at `head`; the trail is sampled at head, head−1step,
 * head−2step … back along the path itself. Every sample is therefore exactly
 * on the racing line, and the tail is anchored to its own head by
 * construction rather than by two timers agreeing.
 *
 * Tuning lives in `src/index.css`: `--lap-trail` (beam length as a share of a
 * lap) and `--lap-trail-steps` (beam smoothness) are read from `.lap-marker`
 * at mount; LAP_DUR below sets the lap time.
 *
 * The element IDs are static because SVG `filter:` and `stroke:` references
 * are document-global and the CSS has to name them. Only one of these renders
 * at a time — one circuit, one route.
 */

const TRACE_ID = 'm1-circuit-trace';
const GLOW_ID = 'm1-lap-glow';
const FADE_ID = 'm1-lap-fade';

const LAP_DUR = 16000; // one lap, in ms. Lower = faster.

/**
 * Which way round the marker runs. -1 reverses it.
 *
 * The direction is a property of the path, not of this constant: the marker
 * simply walks CIRCUIT_D in the order it is written, and that order came out
 * of the trace arbitrarily. CIRCUIT_D as drawn runs clockwise on screen, so
 * -1 gives anticlockwise.
 *
 * If the path is ever replaced, work the new one out rather than guessing.
 * Sum x1*y2 - x2*y1 around its points: positive is clockwise here, because
 * SVG's y axis grows downward and inverts the usual sign. The current path
 * measures +373812.
 */
const DIRECTION = -1;
const LUT_STEPS = 1800; // resolution of the path lookup table

/**
 * The lookup table, built from the path data rather than from the browser.
 *
 * `getPointAtLength` is the obvious way to sample a path and it cannot be used
 * in bulk. This layout is 260-odd cubic segments, and the browser walks all of
 * them to answer every call: one call costs the better part of a millisecond,
 * so the 1800 the beam wants cost nine seconds on a throttled phone. The
 * section sat there, unlooked-at, while the main thread was busy.
 *
 * Evaluating the cubics here costs a couple of milliseconds for the same
 * table, because the walk happens once instead of 1800 times. It reads only
 * the M, C and Z that CIRCUIT_D is written in; anything else returns null and
 * the caller falls back to the browser, slowly but correctly, so replacing the
 * path with one drawn some other way still works.
 */
export function tabulate(d, steps) {
  const tokens = d.match(/[MCZmcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return null;

  // Every point the path passes through, and how far along it each one is.
  const pts = [];
  const at = [];
  let total = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const push = (px, py) => {
    if (pts.length) {
      total += Math.hypot(px - x, py - y);
    }
    pts.push([px, py]);
    at.push(total);
    x = px;
    y = py;
  };

  // Eight points per cubic. The segments here are around 18 units long, so
  // the chord this measures and the curve it stands for differ by less than
  // the width of the line drawn over them.
  const PER_CURVE = 8;
  let i = 0;
  let cmd = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MCZmcz]/.test(t)) {
      cmd = t;
      i += 1;
      if (cmd === 'Z' || cmd === 'z') {
        // Back to the start, the long way: the closing line has length too.
        const fromX = x;
        const fromY = y;
        for (let k = 1; k <= PER_CURVE; k++) {
          const u = k / PER_CURVE;
          push(fromX + (startX - fromX) * u, fromY + (startY - fromY) * u);
        }
        continue;
      }
    }
    if (cmd === 'M' || cmd === 'm') {
      startX = x = parseFloat(tokens[i]);
      startY = y = parseFloat(tokens[i + 1]);
      pts.push([x, y]);
      at.push(total);
      i += 2;
      cmd = 'L-implied';
    } else if (cmd === 'C' || cmd === 'c') {
      const x1 = parseFloat(tokens[i]);
      const y1 = parseFloat(tokens[i + 1]);
      const x2 = parseFloat(tokens[i + 2]);
      const y2 = parseFloat(tokens[i + 3]);
      const ex = parseFloat(tokens[i + 4]);
      const ey = parseFloat(tokens[i + 5]);
      const sx = x;
      const sy = y;
      for (let k = 1; k <= PER_CURVE; k++) {
        const u = k / PER_CURVE;
        const v = 1 - u;
        push(
          v * v * v * sx + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * ex,
          v * v * v * sy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * ey
        );
      }
      i += 6;
    } else {
      // A command this does not read. Let the browser do it instead.
      return null;
    }
  }

  if (total <= 0) return null;

  // Resample it evenly, which is what the beam walks.
  const lut = new Array(steps);
  let seg = 0;
  for (let k = 0; k < steps; k++) {
    const want = (k / steps) * total;
    while (seg < at.length - 2 && at[seg + 1] < want) seg += 1;
    const span = at[seg + 1] - at[seg];
    const u = span > 0 ? (want - at[seg]) / span : 0;
    const p0 = pts[seg];
    const p1 = pts[seg + 1] || p0;
    lut[k] = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
  }
  return { lut, length: total };
}

// How long the line takes to draw itself, and how far through that the marker
// is let out. The beam catching up with the pen is the point of the sequence:
// the circuit is drawn, and then it is driven. Redrawing a dashed line this
// long is the most expensive thing on the phone's frame while it runs, so it
// runs for as short a time as still reads as drawing.
const DRAW_DUR = 1400;
const MARKER_IN = 0.7;

// Closed path of the circuit. Swap this `d` for any closed path and everything
// else adapts — every length here is measured, never hardcoded.
// Traced from the surveyed layout rather than drawn by hand: the aerial was
// thresholded, the dashed line bridged, thinned to a one pixel skeleton and
// walked to give an ordered centreline, then resampled to 260 points and
// fitted with Catmull-Rom. Every length below is measured off this at
// runtime, so replacing it is the only edit a new layout needs.
export const CIRCUIT_D =
  'M621.6 21.6C625.6 23.0 629.0 25.4 631.6 28.5C634.2 31.5 635.3 35.4 637.1 40.0C638.8 44.6 641.1 50.1 642.0 56.1C643.0 62.1 643.0 69.3 642.9 76.1C642.7 82.9 641.7 90.1 641.1 97.1C640.5 104.0 639.9 111.0 639.3 118.0C638.6 125.0 638.0 132.0 637.4 139.0C636.8 145.9 636.2 153.0 635.6 159.9C635.1 166.9 634.5 173.8 634.2 180.7C633.9 187.6 633.8 194.6 633.8 201.5C633.8 208.4 634.3 215.5 634.2 222.2C634.1 228.9 634.1 235.7 633.3 241.6C632.5 247.6 631.3 253.6 629.2 258.1C627.1 262.7 624.3 266.3 620.9 269.1C617.5 271.8 613.6 273.6 608.9 274.5C604.2 275.4 598.3 275.2 592.6 274.5C587.0 273.7 580.6 272.1 574.8 270.1C568.9 268.1 563.1 265.2 557.5 262.4C552.0 259.7 546.7 256.8 541.6 253.6C536.5 250.4 531.7 246.9 527.2 243.1C522.7 239.2 518.9 234.9 514.9 230.5C510.8 226.1 507.1 221.3 503.0 216.9C499.0 212.5 494.9 207.9 490.4 204.1C485.9 200.3 481.0 196.5 475.9 194.0C470.8 191.6 465.4 189.9 459.8 189.4C454.3 189.0 448.3 189.6 442.6 191.1C436.8 192.6 430.8 195.3 425.3 198.3C419.8 201.3 414.6 205.2 409.7 209.2C404.9 213.1 400.6 217.7 396.3 222.2C392.0 226.6 387.9 231.3 383.9 235.8C380.0 240.4 376.3 244.9 372.6 249.4C368.9 253.9 365.3 258.4 361.8 262.8C358.2 267.3 354.8 271.7 351.2 276.3C347.7 280.8 344.1 285.5 340.5 290.0C336.9 294.6 333.3 299.0 329.5 303.5C325.7 307.9 321.6 312.4 317.6 316.8C313.5 321.1 309.4 325.5 305.2 329.7C301.0 333.9 296.7 338.1 292.4 342.1C288.1 346.2 283.7 350.0 279.2 353.8C274.8 357.5 270.3 361.1 265.8 364.6C261.3 368.1 256.8 371.5 252.2 374.8C247.7 378.2 242.9 381.3 238.3 384.7C233.8 388.1 229.2 391.6 224.8 395.4C220.4 399.2 215.9 403.3 211.8 407.6C207.7 411.8 203.6 416.1 200.3 420.8C197.0 425.5 194.1 430.5 192.1 435.8C190.1 441.0 189.0 446.7 188.3 452.3C187.6 458.0 187.2 464.2 188.1 469.7C188.9 475.1 190.7 480.4 193.4 485.0C196.0 489.6 200.0 493.7 204.2 497.1C208.5 500.5 213.6 503.3 218.9 505.4C224.3 507.5 230.2 508.9 236.5 509.6C242.8 510.3 250.0 510.0 256.8 509.6C263.5 509.3 270.5 508.4 277.2 507.5C283.9 506.6 290.5 505.5 297.1 504.3C303.6 503.2 310.2 502.0 316.7 500.7C323.3 499.5 329.8 498.2 336.3 496.7C342.7 495.3 349.0 493.5 355.4 491.9C361.8 490.2 368.3 488.5 374.8 486.9C381.3 485.3 387.9 483.9 394.4 482.3C400.8 480.8 407.3 479.0 413.7 477.4C420.1 475.7 426.4 473.7 432.8 472.4C439.2 471.1 445.7 470.1 452.1 469.5C458.4 468.9 464.6 468.6 471.0 468.6C477.4 468.6 484.2 468.6 490.3 469.4C496.5 470.2 502.3 471.7 508.1 473.5C513.9 475.3 519.8 477.6 525.1 480.3C530.5 483.0 535.7 486.2 540.1 489.8C544.4 493.4 548.4 497.7 551.1 502.1C553.8 506.4 555.4 511.7 556.0 516.1C556.6 520.6 556.4 524.9 554.7 528.9C553.1 532.8 550.0 536.8 546.1 539.7C542.2 542.7 536.9 544.8 531.4 546.6C525.9 548.3 519.4 549.3 512.9 550.2C506.4 551.1 499.0 551.2 492.3 551.9C485.6 552.5 478.9 553.0 472.6 554.0C466.3 555.0 460.0 556.3 454.3 558.1C448.5 559.9 443.1 562.1 438.1 564.9C433.0 567.6 428.1 570.8 424.2 574.6C420.2 578.4 417.0 582.9 414.4 587.6C411.8 592.3 409.6 597.5 408.5 602.8C407.3 608.1 407.0 613.8 407.3 619.4C407.6 625.0 408.8 630.9 410.5 636.6C412.1 642.3 414.7 648.2 417.3 653.7C419.9 659.3 423.1 664.7 426.2 670.1C429.3 675.4 432.9 680.5 436.1 685.8C439.4 691.1 442.8 696.4 445.6 701.9C448.5 707.5 451.3 713.5 453.4 719.4C455.5 725.3 457.3 731.4 458.3 737.5C459.4 743.6 460.0 749.7 459.9 755.7C459.8 761.8 459.1 768.0 457.7 773.7C456.3 779.4 454.2 785.1 451.3 789.9C448.4 794.7 444.4 799.1 440.3 802.5C436.2 805.9 431.3 808.5 426.5 810.2C421.7 811.9 416.3 812.9 411.3 812.8C406.2 812.8 401.0 811.8 396.3 809.9C391.5 808.1 386.7 805.1 382.6 801.7C378.5 798.2 375.0 793.7 371.8 789.2C368.6 784.6 366.0 779.4 363.5 774.2C361.0 768.9 358.8 763.3 356.6 757.6C354.5 751.9 352.4 745.9 350.3 740.0C348.2 734.1 346.2 728.1 344.1 722.3C342.0 716.4 340.0 710.5 337.7 704.8C335.4 699.1 333.0 693.5 330.4 688.0C327.8 682.5 325.1 677.0 322.0 671.9C319.0 666.7 315.5 661.9 312.1 657.2C308.6 652.4 305.1 647.9 301.3 643.4C297.5 638.9 293.6 634.6 289.5 630.3C285.4 625.9 281.0 621.7 276.9 617.3C272.8 612.9 269.1 608.4 265.0 604.0C260.8 599.6 256.5 595.3 252.2 591.1C247.9 586.8 243.7 582.4 239.1 578.7C234.4 575.0 229.5 571.5 224.5 568.7C219.4 565.9 214.3 563.5 208.7 561.8C203.1 560.2 196.8 559.4 190.7 558.8C184.6 558.2 178.4 558.0 172.0 558.1C165.5 558.3 158.6 559.1 151.9 560.0C145.2 560.8 138.2 561.7 131.8 563.0C125.3 564.2 118.8 565.4 113.3 567.5C107.7 569.5 102.6 572.0 98.3 575.3C94.0 578.6 90.4 582.5 87.6 587.0C84.7 591.6 82.8 596.9 81.1 602.5C79.4 608.0 78.2 614.0 77.3 620.4C76.4 626.7 75.9 633.7 75.6 640.4C75.2 647.0 75.3 653.6 75.1 660.2C75.0 666.8 74.9 673.4 74.7 680.1C74.4 686.7 73.6 693.4 73.8 700.1C73.9 706.8 74.6 713.7 75.6 720.2C76.6 726.6 78.0 733.0 79.8 738.9C81.5 744.8 83.2 750.7 86.0 755.6C88.9 760.4 92.4 764.6 96.6 768.0C100.9 771.4 106.2 773.9 111.6 776.1C117.0 778.3 123.0 779.8 129.0 781.4C135.1 783.0 141.6 784.0 147.7 785.6C153.8 787.1 160.0 788.3 165.5 790.6C170.9 792.8 176.0 795.6 180.3 799.1C184.6 802.6 188.2 806.9 191.2 811.7C194.2 816.6 196.2 822.5 198.3 828.2C200.3 834.0 201.6 840.2 203.5 846.2C205.4 852.1 207.2 858.3 209.6 863.9C212.1 869.5 214.6 875.0 218.1 879.7C221.5 884.4 225.4 888.7 230.1 892.1C234.8 895.4 240.5 897.7 246.3 899.6C252.1 901.4 258.6 902.5 265.0 903.1C271.5 903.7 278.2 903.4 284.9 903.1C291.5 902.8 298.2 902.1 305.0 901.5C311.7 900.9 318.5 900.0 325.2 899.7C331.9 899.3 338.4 899.2 345.1 899.5C351.8 899.7 358.4 900.3 365.2 901.0C371.9 901.7 378.6 902.8 385.4 903.7C392.2 904.6 399.1 905.7 405.9 906.3C412.7 907.0 419.5 907.6 426.3 907.7C433.1 907.8 439.9 907.5 446.5 907.0C453.2 906.5 459.8 905.7 466.4 904.6C472.9 903.6 479.4 901.9 485.9 900.7C492.4 899.4 498.9 897.9 505.2 897.1C511.5 896.4 517.7 895.7 523.7 896.1C529.6 896.4 535.6 897.3 540.9 899.2C546.1 901.1 551.2 903.7 555.3 907.3C559.4 910.9 563.1 915.8 565.4 920.7C567.8 925.7 569.1 931.5 569.3 937.0C569.5 942.5 568.6 948.5 566.7 953.5C564.8 958.6 561.5 963.5 557.8 967.3C554.0 971.1 549.2 974.2 544.2 976.3C539.1 978.4 533.3 979.5 527.5 980.0C521.7 980.5 515.4 979.9 509.3 979.2C503.1 978.4 496.8 977.0 490.6 975.5C484.5 974.1 478.4 972.2 472.4 970.4C466.3 968.5 460.6 966.4 454.5 964.7C448.3 963.0 442.0 961.5 435.7 960.2C429.3 958.9 422.9 957.8 416.4 957.0C409.8 956.2 403.3 955.6 396.6 955.2C389.9 954.8 383.0 954.6 376.1 954.7C369.1 954.9 362.0 955.6 354.9 956.1C347.9 956.6 341.0 957.3 334.0 957.9C327.0 958.5 320.0 959.1 313.0 959.7C306.0 960.3 299.1 961.0 292.1 961.5C285.1 962.1 278.0 962.6 270.9 962.9C263.9 963.2 256.9 963.2 249.9 963.1C242.9 963.0 235.8 962.8 228.9 962.2C222.0 961.7 215.3 960.9 208.5 960.0C201.8 959.0 195.1 957.5 188.3 956.3C181.6 955.1 174.8 953.6 168.1 952.7C161.4 951.7 154.7 951.1 148.0 950.6C141.4 950.2 134.9 950.0 128.3 950.2C121.6 950.4 114.9 951.4 108.3 952.0C101.7 952.6 94.9 953.5 88.8 953.6C82.6 953.6 76.6 953.5 71.5 952.2C66.5 950.8 61.8 948.3 58.5 945.6C55.1 942.8 52.8 939.5 51.6 935.6C50.4 931.7 50.2 926.9 51.0 922.4C51.9 917.9 54.1 913.0 56.9 908.6C59.6 904.2 63.5 899.8 67.5 896.0C71.6 892.1 76.7 888.9 81.1 885.3C85.5 881.6 90.1 878.1 93.8 874.2C97.5 870.2 100.8 865.9 103.0 861.7C105.2 857.5 106.8 853.1 107.0 849.1C107.2 845.1 106.3 841.2 104.1 837.7C101.9 834.2 98.2 831.1 93.9 828.2C89.6 825.3 83.7 822.6 78.3 820.1C72.9 817.6 66.9 815.6 61.4 813.1C55.8 810.5 49.8 808.3 45.1 805.0C40.3 801.7 36.1 797.8 32.8 793.2C29.4 788.6 26.8 783.2 24.9 777.6C23.0 771.9 22.2 765.7 21.4 759.4C20.6 753.1 20.0 746.6 20.0 740.0C20.0 733.3 20.9 726.2 21.4 719.6C21.9 712.9 22.2 706.3 23.0 700.1C23.7 693.8 25.1 688.1 25.9 682.1C26.7 676.1 27.1 670.1 27.7 664.0C28.4 657.8 29.3 651.6 29.9 645.3C30.5 639.0 30.8 632.8 31.3 626.3C31.7 619.8 32.2 613.2 32.4 606.3C32.6 599.4 32.3 592.1 32.4 585.0C32.5 577.8 32.5 570.5 32.9 563.4C33.2 556.3 33.6 549.2 34.4 542.3C35.1 535.5 36.2 528.7 37.5 522.2C38.8 515.7 40.4 509.3 42.2 503.1C44.1 497.0 46.1 491.0 48.7 485.4C51.2 479.8 54.3 474.5 57.5 469.4C60.7 464.3 64.1 459.5 67.8 454.9C71.5 450.2 75.6 445.9 79.7 441.5C83.8 437.2 88.1 433.0 92.4 428.8C96.8 424.7 101.4 420.7 105.9 416.7C110.5 412.7 115.1 408.8 119.8 404.8C124.5 400.8 129.3 396.7 133.9 392.7C138.5 388.7 142.9 384.8 147.5 380.9C152.1 377.0 156.8 373.2 161.3 369.3C165.9 365.5 170.5 361.6 175.0 357.8C179.6 353.9 184.1 350.0 188.6 346.2C193.1 342.4 197.6 338.7 202.1 334.9C206.6 331.1 211.1 327.2 215.6 323.3C220.2 319.4 224.8 315.6 229.3 311.7C233.8 307.9 238.1 304.1 242.6 300.4C247.1 296.6 251.6 292.8 256.0 289.0C260.5 285.2 264.9 281.4 269.3 277.6C273.8 273.8 278.3 270.0 282.8 266.2C287.4 262.3 292.1 258.5 296.8 254.5C301.5 250.5 306.3 246.5 311.1 242.4C315.9 238.3 320.5 234.0 325.5 229.9C330.4 225.7 335.6 221.5 340.6 217.3C345.7 213.1 350.8 208.9 355.8 204.6C360.7 200.3 365.4 196.0 370.3 191.8C375.1 187.5 380.0 183.2 384.9 179.1C389.7 174.9 394.6 170.9 399.4 166.8C404.2 162.8 408.9 158.8 413.7 154.8C418.5 150.7 423.5 146.5 428.4 142.4C433.4 138.3 438.4 134.3 443.5 130.1C448.5 126.0 453.5 121.7 458.6 117.4C463.7 113.2 469.1 108.9 474.2 104.6C479.2 100.3 484.1 95.9 489.0 91.7C494.0 87.4 498.9 83.2 503.7 79.1C508.5 75.0 513.2 70.8 517.9 66.8C522.6 62.9 527.3 59.1 532.0 55.5C536.7 51.9 541.1 48.4 546.0 45.2C550.9 41.9 556.0 38.6 561.3 35.9C566.6 33.1 572.8 30.7 577.9 28.6C583.0 26.5 587.0 24.6 591.9 23.2C596.7 21.7 602.2 20.3 607.2 20.0C612.1 19.7 617.5 20.1 621.6 21.6Z';

// Start/finish — the first point of the path. Parks the dot there when JS
// hasn't run or motion is reduced, so it never renders at 0,0.
const START = { x: 621.6, y: 21.6 };

/**
 * `drawOnView` makes the line draw itself the first time it is scrolled to,
 * rather than being there already. It is asked for by the phone layout of
 * home/Circuit, where the drawing is the section rather than an illustration
 * beside it and so has an entrance to make. Off by default: on the wide
 * layout the circuit is one of two columns and drawing it would pull the eye
 * away from the prose beside it.
 */
export default function CircuitTrace({ className = '', label, drawOnView = false }) {
  const figureRef = useRef(null);
  const lineRef = useRef(null);
  const pathRef = useRef(null);
  const markerRef = useRef(null);
  const trailRef = useRef(null);
  const dotRef = useRef(null);
  const fadeRef = useRef(null);

  useEffect(() => {
    const figure = figureRef.current;
    const path = pathRef.current;
    const line = lineRef.current;
    const marker = markerRef.current;
    const trail = trailRef.current;
    const dot = dotRef.current;
    const fade = fadeRef.current;
    if (!figure || !path || !marker || !trail || !dot || !fade) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lapLen = path.getTotalLength();

    // The two custom properties are the public tuning surface.
    const markerStyle = getComputedStyle(marker);
    const trailLen =
      (parseFloat(markerStyle.getPropertyValue('--lap-trail')) || 0.045) * lapLen;
    const trailSteps =
      parseInt(markerStyle.getPropertyValue('--lap-trail-steps'), 10) || 16;

    // The table is read from the path data at mount, which costs a couple of
    // milliseconds. Only if that fails does the browser get asked, and then it
    // is deferred to the first frame so a section below the fold does not pay
    // for it during page load.
    const tabulated = tabulate(path.getAttribute('d'), LUT_STEPS);
    let lut = tabulated ? tabulated.lut : null;
    const buildLut = () => {
      if (lut) return;
      lut = new Array(LUT_STEPS);
      for (let i = 0; i < LUT_STEPS; i++) {
        const pt = path.getPointAtLength((i / LUT_STEPS) * lapLen);
        lut[i] = [pt.x, pt.y];
      }
    };

    // Linear interpolation between LUT samples is not optional — without it
    // there is visible position quantization stutter at high refresh rates.
    const pointAt = (dist) => {
      let floatIdx = ((dist / lapLen) * LUT_STEPS) % LUT_STEPS;
      if (floatIdx < 0) floatIdx += LUT_STEPS;
      const i0 = Math.floor(floatIdx);
      const i1 = (i0 + 1) % LUT_STEPS;
      const t = floatIdx - i0;
      const p0 = lut[i0];
      const p1 = lut[i1];
      return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
    };

    // Rolled up from the far end. stroke-dasharray and stroke-dashoffset are
    // inherited properties, so setting them on the <use> reaches the path it
    // clones. The marker is held back until the pen is most of the way round:
    // a beam lapping a circuit that is not drawn yet reads as a bug.
    // Not `draw`: that name is taken by the marker's frame function below,
    // and this runs above it in the same scope.
    const drawsItself = drawOnView && !reduce;
    if (drawsItself) {
      line.style.strokeDasharray = `${lapLen}`;
      line.style.strokeDashoffset = `${lapLen}`;
      marker.style.opacity = '0';
    }

    let drawn = false;
    let markerTimer = null;
    const startDrawing = () => {
      if (drawn) return;
      drawn = true;
      // A frame later, so the browser has the undrawn state to animate from.
      requestAnimationFrame(() => {
        line.style.transition = `stroke-dashoffset ${DRAW_DUR}ms cubic-bezier(0.33, 0, 0.15, 1)`;
        line.style.strokeDashoffset = '0';
      });
      markerTimer = setTimeout(() => {
        marker.style.transition = 'opacity 700ms ease';
        marker.style.opacity = '';
      }, DRAW_DUR * MARKER_IN);
    };

    // A phone repaints a filtered group far more slowly than a laptop does,
    // and sixty of those a second is most of a frame budget spent on one
    // ornament: measured on a throttled phone, the marker alone took the
    // section from 57 frames a second to 30. Half the frames is not visible
    // on a beam this soft, and costs half.
    const minFrame = window.matchMedia('(pointer: coarse)').matches ? 32 : 0;
    let lastFrame = 0;

    let visible = false;
    let raf = null;
    const started = performance.now();

    // Wall clock rather than an accumulator: while the loop is stopped
    // off-screen no frames run, and on the way back the marker should be where
    // it would have got to, not where it left off.
    const head = () =>
      reduce
        ? 0
        : DIRECTION * (((performance.now() - started) % LAP_DUR) / LAP_DUR) * lapLen;

    const draw = (now = 0) => {
      raf = null;
      if (minFrame && now && now - lastFrame < minFrame) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      buildLut();
      const h = head();

      // The beam: sampled backwards along the PATH from the head.
      let d = '';
      for (let i = 0; i <= trailSteps; i++) {
        const p = pointAt(h - DIRECTION * (i / trailSteps) * trailLen);
        d += `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      }
      trail.setAttribute('d', d);

      // Same head distance that started the loop above, so the dot cannot sit
      // anywhere but on the end of its own beam.
      const headPt = pointAt(h);
      dot.setAttribute('cx', headPt[0].toFixed(1));
      dot.setAttribute('cy', headPt[1].toFixed(1));

      // Aim the fade down the beam's own tail-to-head axis. The gradient is
      // straight and the beam is not, but over this length the two agree
      // closely enough that the tail still reads as the transparent end.
      const tailPt = pointAt(h - DIRECTION * trailLen);
      fade.setAttribute('x1', tailPt[0].toFixed(1));
      fade.setAttribute('y1', tailPt[1].toFixed(1));
      fade.setAttribute('x2', headPt[0].toFixed(1));
      fade.setAttribute('y2', headPt[1].toFixed(1));

      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };

    // Off-screen the beam still costs a filtered repaint every frame, so the
    // loop only turns over while the circuit is actually in view.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting;
          if (visible && drawsItself) startDrawing();
          if (visible && !reduce && raf === null) {
            raf = requestAnimationFrame(draw);
          } else if (!visible && raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      },
      { threshold: 0 }
    );
    io.observe(figure);

    // Under reduced motion the observer never starts the loop, so draw the
    // parked beam once by hand — otherwise the dot arrives alone.
    if (reduce) draw();

    return () => {
      io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
      if (markerTimer !== null) clearTimeout(markerTimer);
    };
  }, [drawOnView]);

  return (
    <figure ref={figureRef} className={`circuit-figure ${className}`.trim()}>
      <svg
        viewBox="0 0 663 1000"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label || 'Line drawing of the circuit layout'}
      >
        <defs>
          {/* Defined once, referenced by <use> below and measured directly by
              getTotalLength — a <defs> path answers that without painting. */}
          <path ref={pathRef} id={TRACE_ID} d={CIRCUIT_D} />

          {/* Stacking the blur three times under the source is what turns a
              soft edge into something that reads as emitted light rather than
              a drop shadow. The region is widened because the default
              -10%/120% clips a blur this wide and the beam would end in a
              straight cut. */}
          <filter id={GLOW_ID} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="lapBlur" />
            <feMerge>
              <feMergeNode in="lapBlur" />
              <feMergeNode in="lapBlur" />
              <feMergeNode in="lapBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* The fade that makes it a beam and not a worm. userSpaceOnUse is
              mandatory: on the default objectBoundingBox the fade could only
              ever be axis-aligned to the trail's bounding box, where this lets
              the effect aim it straight down the beam's own axis each frame. */}
          <linearGradient ref={fadeRef} id={FADE_ID} gradientUnits="userSpaceOnUse">
            <stop offset="0" className="lap-fade-tail" />
            <stop offset="1" className="lap-fade-head" />
          </linearGradient>
        </defs>

        {/* The line, once. There was a second copy over this one at full
            opacity, dashed so that a 140-unit segment of it lapped the
            circuit every seven seconds. Because it inherited currentColor it
            was drawn in the section's ink, near black against a track set at
            0.42, so it read as a dark scar sliding around the layout rather
            than as a highlight. The laser already says which way the circuit
            runs, and it says it in the brand colour.

            A path of its own rather than a <use> of the one in <defs>, even
            though they carry the same `d`. The drawing-in animates
            stroke-dashoffset, which is an inherited property reaching into a
            <use>'s shadow tree, and that is long-standing thin ice in Safari.
            A path draws its own dashes everywhere. */}
        <path
          ref={lineRef}
          d={CIRCUIT_D}
          className="circuit-trace"
          strokeWidth="7"
          opacity="0.42"
        />

        {/* One filter on the group covers dot and trail together, so they glow
            as a single emitted object — and the filter region stays the size
            of the beam instead of the whole circuit, which is what keeps it
            affordable. The <path> has no `d`; the effect writes it. */}
        <g ref={markerRef} className="lap-marker" aria-hidden="true">
          <path ref={trailRef} className="lap-trail" fill="none" />
          <circle ref={dotRef} className="lap-dot" r="2.6" cx={START.x} cy={START.y} />
        </g>
      </svg>
    </figure>
  );
}
