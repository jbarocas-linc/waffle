/**
 * The Waffle mark: a round waffle with a 3×3 grid pressed into it, the center
 * cell glowing, and dashed arrows inviting a swipe in all four directions.
 * SVG recreation of the brand logo so it stays crisp at any size.
 */
export function WaffleLogo({ size = 160, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Waffle logo"
    >
      <defs>
        <clipPath id="wfl-circle">
          <circle cx="254" cy="252" r="228" />
        </clipPath>
        <radialGradient id="wfl-cell" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#E9B54C" />
          <stop offset="100%" stopColor="#D3763F" />
        </radialGradient>
        <radialGradient id="wfl-center" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#FFF6E4" />
          <stop offset="100%" stopColor="#F0C9A0" />
        </radialGradient>
      </defs>

      {/* plate shadow + waffle body */}
      <circle cx="260" cy="260" r="228" fill="#C57B43" />
      <circle cx="254" cy="252" r="228" fill="#D98F58" />

      {/* cream lattice, clipped to the waffle */}
      <g
        clipPath="url(#wfl-circle)"
        fill="none"
        stroke="#EFD9B4"
        strokeWidth="16"
      >
        <circle cx="254" cy="252" r="212" />
        <ellipse cx="254" cy="252" rx="228" ry="96" />
        <ellipse cx="254" cy="252" rx="96" ry="228" />
        <ellipse cx="254" cy="252" rx="228" ry="184" />
        <ellipse cx="254" cy="252" rx="184" ry="228" />
      </g>

      {/* 3×3 grid: darker backdrop shows through the gaps */}
      <rect x="106" y="104" width="296" height="296" rx="26" fill="#C67240" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={116 + col * 96}
            y={114 + row * 96}
            width="84"
            height="84"
            rx="16"
            fill={row === 1 && col === 1 ? "url(#wfl-center)" : "url(#wfl-cell)"}
          />
        ))
      )}

      {/* center bloom */}
      <circle cx="254" cy="252" r="14" fill="#FFF6E4" opacity="0.95" />

      {/* dashed compass arrows */}
      <g
        stroke="#F6E6C4"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <g strokeDasharray="20 15">
          <line x1="254" y1="252" x2="254" y2="158" />
          <line x1="254" y1="252" x2="254" y2="346" />
          <line x1="254" y1="252" x2="160" y2="252" />
          <line x1="254" y1="252" x2="348" y2="252" />
        </g>
        <path d="M 234 160 L 254 136 L 274 160" />
        <path d="M 234 344 L 254 368 L 274 344" />
        <path d="M 162 232 L 138 252 L 162 272" />
        <path d="M 346 232 L 370 252 L 346 272" />
      </g>
    </svg>
  );
}

/** The lowercase wordmark, in the logo's rounded face and amber. */
export function WaffleWordmark({ className = "" }: { className?: string }) {
  return <span className={`font-logo font-bold lowercase text-accent ${className}`}>waffle</span>;
}
