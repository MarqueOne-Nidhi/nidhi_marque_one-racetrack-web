import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCATION } from '../data/home';

/**
 * ─── The pin ──────────────────────────────────────────────────────────────
 *
 * Leaflet over Carto's tiles, not a Google frame. The frame was a cross
 * origin document: nothing could read where it had been panned to, so
 * "recentre" and "only offer that when the pin has been lost" were both
 * unbuildable, and its palette could only be approximated by running a filter
 * over the whole thing. This asks for light or dark tiles outright.
 *
 * The credit for the tiles is not here. It is a condition of the OSM licence
 * and CARTO's terms, so it cannot simply be dropped, but both accept it in a
 * credits line rather than on the map itself: it sits in the site footer, with
 * the other colophon lines. Moving it means the map carries no plate and no
 * frame, and the site stays within its licence.
 *
 * Drag is the only gesture. Scroll belongs to the page: a map that swallows
 * the wheel traps a reader who was only scrolling past it, and this one has
 * nothing to zoom to anyway. Double-click zoom, box zoom and keyboard panning
 * go for the same reason, and there are no default controls.
 */

// Carto Positron and Dark Matter. Light is warm-grey and low contrast, which
// is as close to the ivory ground as a tile set gets; dark is near black.
// The filter on each is a nudge to the palette, not the whole disguise the
// Google frame needed.
const TILES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    // Only desaturates. The colour itself comes from the multiply pass below.
    filter: 'saturate(0.55) contrast(0.95)',
    blend: 'multiply',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    filter: 'saturate(0.6) brightness(0.95) contrast(1.05)',
    // Dark tiles are already near black; multiplying a near-black ground into
    // them would flatten the roads out of existence. Screen lifts the ground
    // into them instead, which is the same idea the other way up.
    blend: 'screen',
  },
};

export default function LocationMap({
  tone = 'light',
  className = '',
  aspect = '16/9',
  // Off where the section carries its own Open in Maps button, so the same
  // affordance is not offered twice within a hand's width.
  showLink = true,
}) {
  const { label, lat, lng, zoom, share } = LOCATION.map;

  const holderRef = useRef(null);
  const mapRef = useRef(null);
  const pinRef = useRef(null);
  const [lost, setLost] = useState(false);

  const isDark = tone === 'dark';
  const tiles = TILES[tone] ?? TILES.light;

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || mapRef.current) return;

    const map = L.map(holder, {
      center: [lat, lng],
      zoom,
      // Drag, and nothing else.
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(tiles.url, { maxZoom: 19 }).addTo(map);

    // The pin is the marque, placed by hand rather than added as a Leaflet
    // marker. A marker lives inside the map's own panes, which sit beneath the
    // tint pass and inside the tile filter; both would drain the red out of
    // the logo, which is the whole point of it. Kept outside the map it is a
    // sibling of the tint, above it in the stack and touched by neither, so it
    // holds the brand colour exactly. The cost is placing it ourselves, which
    // is one projection per move.
    const place = () => {
      if (!pinRef.current) return;
      const point = map.latLngToContainerPoint([lat, lng]);
      pinRef.current.style.transform =
        `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
    };

    // Recentre offers itself only once the pin is off the visible map, which
    // is the only moment it is any use.
    const checkPin = () => setLost(!map.getBounds().contains([lat, lng]));

    const onMove = () => {
      place();
      checkPin();
    };

    map.on('move zoom zoomend', onMove);
    onMove();

    // The holder is sized by aspect-ratio, so its height is not known on the
    // frame Leaflet first measures it.
    const resize = new ResizeObserver(() => {
      map.invalidateSize();
      place();
    });
    resize.observe(holder);

    mapRef.current = map;

    return () => {
      resize.disconnect();
      map.off('move zoom zoomend', onMove);
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom, label, tiles.url]);

  const recentre = () => {
    mapRef.current?.setView([lat, lng], zoom, { animate: true, duration: 0.6 });
  };

  return (
    <figure className={`relative overflow-hidden rounded-sm ${className}`}>
      <div className="relative w-full" style={{ aspectRatio: aspect, isolation: 'isolate' }}>
        {/* The filter sits on the holder, so it colours the tiles without
            touching the caption or the reset button above them. */}
        <div
          ref={holderRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          style={{ filter: tiles.filter, background: 'var(--surface)' }}
        />

        {/* Takes the map to the section's own ground. Multiply maps the tiles'
            near-white land onto --surface exactly, while everything darker
            than the land, the roads and the labels, darkens in proportion and
            stays legible. A filter cannot hit a named colour like this; it can
            only push in a direction and be judged by eye.

            It reads --surface, so the map follows whichever ground the section
            it lands in is standing on, with no second value to keep in step. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'var(--surface)', mixBlendMode: tiles.blend }}
        />

        {/* Above the tint, below the caption. Its transform is written by the
            map on every move, so it stays pinned to the coordinates rather
            than to the frame. */}
        <img
          ref={pinRef}
          src="/logo-red.png"
          alt=""
          aria-hidden="true"
          draggable="false"
          className="absolute left-0 top-0 z-[600] w-9 h-auto pointer-events-none select-none"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
        />

        {/* A long, soft wash, not a panel. Two stops give a hard shoulder
            partway up that reads as a block sitting on the map; the middle
            stop carries most of the fade well before the top. Never fully
            opaque, so the map still shows through under the caption. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
          style={{
            // color-mix so the stops can take alpha off --surface. Hardcoding
            // ivory here washed a light-deep section with the wrong colour.
            background:
              'linear-gradient(to top,' +
              ' color-mix(in srgb, var(--surface) 90%, transparent) 0%,' +
              ' color-mix(in srgb, var(--surface) 45%, transparent) 38%,' +
              ' transparent 100%)',
          }}
        />

        {/* Appears only when the pin has been dragged out of the frame. */}
        <button
          type="button"
          onClick={recentre}
          aria-hidden={!lost}
          tabIndex={lost ? 0 : -1}
          // Written out rather than bg-[var(--surface)]/85: Tailwind's opacity
          // modifier cannot take alpha off a CSS variable, and that class
          // compiles to nothing at all, leaving the button with no ground.
          style={{ backgroundColor: isDark ? 'rgba(9,9,9,0.85)' : 'rgba(245,241,232,0.88)' }}
          className={`absolute right-4 top-4 z-[900] px-3 py-2 text-[0.6rem] tracking-widest uppercase border rule backdrop-blur-sm cursor-pointer transition-all duration-300 ${
            lost ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          Recentre
        </button>

        <figcaption className="absolute left-5 bottom-4 right-5 z-[900] flex flex-wrap items-baseline justify-between gap-3 pointer-events-none">
          <span className="font-serif text-[clamp(1rem,1.6vw,1.35rem)] font-light tracking-tight">
            {label}
          </span>
          {showLink && (
            <a
              href={share}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto text-[0.65rem] tracking-widest uppercase ink-faint hover:text-brand transition-colors"
            >
              Open in Google Maps →
            </a>
          )}
        </figcaption>

      </div>
    </figure>
  );
}
