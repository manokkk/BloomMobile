import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface BloomRoseSvgProps {
  size?: number;
  withStem?: boolean;
}

/**
 * Layered SVG pink rose emblem for Bloom.
 */
export const BloomRoseSvg: React.FC<BloomRoseSvgProps> = ({
  size = 84,
  withStem = false,
}) => {
  const height = withStem ? size * 1.25 : size;
  const viewBox = withStem ? '0 0 120 150' : '0 0 120 120';

  return (
    <Svg width={size} height={height} viewBox={viewBox}>
      <Defs>
        <RadialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FCE7F3" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FCE7F3" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Soft halo */}
      <Circle cx="60" cy="56" r="52" fill="url(#roseGlow)" />

      {/* Optional stem & leaves */}
      {withStem && (
        <G>
          <Path
            d="M60 86 C60 105, 59 125, 60 144"
            stroke="#4D7C5B"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M58 112 C42 104, 30 108, 28 118 C38 122, 50 120, 58 112 Z"
            fill="#5C946E"
          />
          <Path
            d="M62 118 C78 110, 90 114, 92 124 C82 128, 70 126, 62 118 Z"
            fill="#4D7C5B"
          />
          <Path
            d="M48 84 Q60 94 72 84 Q60 88 48 84 Z"
            fill="#3F6A4D"
          />
        </G>
      )}

      {/* Outer blush petals */}
      <G>
        <Ellipse cx="60" cy="30" rx="20" ry="22" fill="#F9A8D4" />
        <Ellipse
          cx="82"
          cy="44"
          rx="20"
          ry="22"
          transform="rotate(55 82 44)"
          fill="#F9A8D4"
        />
        <Ellipse
          cx="74"
          cy="70"
          rx="20"
          ry="22"
          transform="rotate(120 74 70)"
          fill="#F9A8D4"
        />
        <Ellipse
          cx="46"
          cy="70"
          rx="20"
          ry="22"
          transform="rotate(240 46 70)"
          fill="#F9A8D4"
        />
        <Ellipse
          cx="38"
          cy="44"
          rx="20"
          ry="22"
          transform="rotate(305 38 44)"
          fill="#F9A8D4"
        />
      </G>

      {/* Mid vibrant rose petals */}
      <G>
        <Path
          d="M60 28 C76 28, 84 42, 76 56 C68 64, 52 64, 44 56 C36 42, 44 28, 60 28 Z"
          fill="#F472B6"
        />
        <Path
          d="M38 48 C38 64, 50 76, 62 72 C70 64, 68 48, 56 42 C46 38, 38 42, 38 48 Z"
          fill="#EC4899"
          opacity="0.9"
        />
        <Path
          d="M82 48 C82 64, 70 76, 58 72 C50 64, 52 48, 64 42 C74 38, 82 42, 82 48 Z"
          fill="#EC4899"
          opacity="0.9"
        />
      </G>

      {/* Inner magenta curl */}
      <Circle cx="60" cy="52" r="15" fill="#D23669" />
      <Path
        d="M52 50 C52 43, 68 43, 68 52 C68 59, 55 60, 54 53 C53 49, 62 48, 62 52"
        stroke="#FCE7F3"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="60" cy="52" r="4.5" fill="#FDE68A" />
    </Svg>
  );
};
