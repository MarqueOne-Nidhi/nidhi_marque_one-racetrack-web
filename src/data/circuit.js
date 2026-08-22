// ─── Circuit specification ─── Single source of truth ───
// Consumed by: §3 Circuit, §13 FAQ, About page
// Change a figure here → it updates everywhere.

export const CIRCUIT = {
  lap: { value: 5.5, unit: 'km', label: 'lap' },
  strip: { value: 1000, unit: 'm', label: 'drag strip' },
  elevation: { value: 25, unit: 'm', label: 'elevation', prefix: '±' },
  speed: { value: 300, unit: 'km/h', label: 'rated beyond' },
};

export const CIRCUIT_GRADE = 'FIA-graded';
export const CIRCUIT_DESIGNER = 'Driven International';
export const CIRCUIT_ACREAGE = '300+';
