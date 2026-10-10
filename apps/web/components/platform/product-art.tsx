import type { Product } from '@oliveira/schemas';

/**
 * The art on a product card (design S03): the ERP is a ledger of records, the
 * FSM a route with stops. Drawn in the product's own 300 step on the dark shell
 * ground — these are illustrations, so they read palette values directly, the one
 * place that is allowed (handoff § 2). Decorative: `aria-hidden`.
 */
const GRID_STEP = 28;
const WIDTH = 560;
const HEIGHT = 172;

function GridLines() {
  const verticals = Array.from(
    { length: Math.ceil(WIDTH / GRID_STEP) },
    (_, index) => index * GRID_STEP,
  );
  const horizontals = Array.from(
    { length: Math.ceil(HEIGHT / GRID_STEP) + 1 },
    (_, index) => index * GRID_STEP,
  );

  return (
    <g stroke="#ffffff" strokeOpacity="0.04">
      {verticals.map((x) => (
        <path key={`v${x}`} d={`M${x} 0V${HEIGHT}`} />
      ))}
      {horizontals.map((y) => (
        <path key={`h${y}`} d={`M0 ${y}H${WIDTH}`} />
      ))}
    </g>
  );
}

function ErpArt() {
  const rows = Array.from({ length: 6 }, (_, index) => ({
    y: 34 + index * 20,
    wide: index % 2 === 0,
    active: index === 2,
  }));

  return (
    <g style={{ color: 'var(--olv-olive-300)' }}>
      <GridLines />
      <circle cx="150" cy="80" r="4" fill="currentColor" />
      <path d="M154 80H168" stroke="currentColor" strokeWidth="1.5" />
      {rows.map((row) => (
        <g key={row.y}>
          <rect
            x="168"
            y={row.y}
            width="224"
            height="12"
            rx="3"
            fill="currentColor"
            fillOpacity={row.active ? 0.22 : 0.08}
            stroke="currentColor"
            strokeOpacity={row.active ? 0.95 : 0.38}
          />
          <rect
            x="178"
            y={row.y + 4}
            width="34"
            height="4"
            rx="2"
            fill="currentColor"
            fillOpacity={row.active ? 0.95 : 0.38}
          />
          <rect
            x="224"
            y={row.y + 4}
            width={row.wide ? 101 : 78}
            height="4"
            rx="2"
            fill="currentColor"
            fillOpacity={row.active ? 0.76 : 0.3}
          />
          <rect
            x="347"
            y={row.y + 4}
            width="28"
            height="4"
            rx="2"
            fill="currentColor"
            fillOpacity={row.active ? 0.76 : 0.3}
          />
        </g>
      ))}
    </g>
  );
}

function FsmArt() {
  return (
    <g style={{ color: 'var(--olv-terracotta-300)' }}>
      <GridLines />
      {[60, 94, 128, 162, 196].map((rx, index) => (
        <ellipse
          key={rx}
          cx="347"
          cy="95"
          rx={rx}
          ry={Math.round(rx * 0.44)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1 - index * 0.018}
        />
      ))}
      <path
        d="M101 124 C 168 34, 235 146, 308 77 S 414 31, 459 65"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <circle cx="101" cy="124" r="5" fill="#12151b" stroke="currentColor" strokeWidth="2" />
      <circle cx="308" cy="77" r="5" fill="#12151b" stroke="currentColor" strokeWidth="2" />
      <g transform="translate(459 65)">
        <circle r="14" fill="currentColor" fillOpacity="0.16" />
        <circle r="6" fill="currentColor" />
      </g>
    </g>
  );
}

export function ProductArt({ product }: { product: Product }) {
  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="block transition-[opacity,filter] duration-200 group-aria-disabled/prod:opacity-40 group-aria-disabled/prod:grayscale"
    >
      {product === 'ERP' ? <ErpArt /> : <FsmArt />}
    </svg>
  );
}
