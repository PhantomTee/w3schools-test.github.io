export function SketchFilter() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {/* Subtle wobble — applied to buttons, cards, borders */}
        <filter id="hand-draw" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.025"
            numOctaves="3"
            seed="12"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Stronger wobble — for larger hero/card outlines */}
        <filter id="hand-draw-lg" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.028 0.02"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
