export function Rainbow() {
  return (
    <svg className="rainbow" viewBox="0 0 240 155" aria-hidden="true">
      <path
        d="M30 127a90 90 0 0 1 180 0"
        fill="none"
        stroke="#f49c97"
        strokeWidth="22"
      />
      <path
        d="M53 127a67 67 0 0 1 134 0"
        fill="none"
        stroke="#f8d16d"
        strokeWidth="21"
      />
      <path
        d="M76 127a44 44 0 0 1 88 0"
        fill="none"
        stroke="#80c8b5"
        strokeWidth="20"
      />
      <g fill="white">
        <ellipse cx="36" cy="132" rx="33" ry="19" />
        <circle cx="30" cy="117" r="19" />
        <ellipse cx="207" cy="132" rx="31" ry="19" />
        <circle cx="207" cy="116" r="19" />
      </g>
    </svg>
  );
}
export function Sun() {
  return (
    <svg className="happy-sun" viewBox="0 0 140 140" aria-hidden="true">
      <g stroke="#f3bc53" strokeWidth="7" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M70 8v10" transform={`rotate(${i * 45} 70 70)`} />
        ))}
      </g>
      <circle cx="70" cy="70" r="39" fill="#ffd67e" />
      <circle cx="57" cy="65" r="3.5" fill="#755136" />
      <circle cx="83" cy="65" r="3.5" fill="#755136" />
      <path
        d="M60 79q10 12 20 0"
        fill="none"
        stroke="#755136"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="77" rx="6" ry="4" fill="#f7aa83" />
      <ellipse cx="92" cy="77" rx="6" ry="4" fill="#f7aa83" />
    </svg>
  );
}
export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${i * 0.13}s`,
            background: ["#f6b85c", "#ef9aa4", "#81c8af", "#a69bd5"][i % 4],
            transform: `rotate(${i * 27}deg)`,
          }}
        />
      ))}
    </div>
  );
}
