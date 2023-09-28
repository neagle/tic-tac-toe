export const X = () => {
  const strokeWidth = 20;
  const strokeLinecap = "round";
  const inset = 11;
  const size = 100;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="x">
      <line
        x1={inset}
        y1={inset}
        x2={size - inset}
        y2={size - inset}
        stroke="currentColor"
        strokeLinecap={strokeLinecap}
        strokeWidth={strokeWidth}
      />
      <line
        x1={size - inset}
        y1={inset}
        x2={inset}
        y2={size - inset}
        stroke="currentColor"
        strokeLinecap={strokeLinecap}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export const Y = () => {
  const strokeWidth = 20;
  const strokeLinecap = "round";
  const inset = 2;
  const size = 100;
  const circleSize = size - inset - strokeWidth;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="o">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={circleSize / 2}
        fill="transparent"
        stroke="currentColor"
        strokeLinecap={strokeLinecap}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};
