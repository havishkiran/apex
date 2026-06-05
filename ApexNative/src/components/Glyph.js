import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export function Glyph({ name, size = 24, color = '#F2F2F0', sw = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' };
  const s = { stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (name) {
    case 'track':
      return <Svg {...p}><Path d="M12 2 L20.5 21 L12 16.6 L3.5 21 Z" fill={color} stroke="none" /></Svg>;
    case 'history':
      return <Svg {...p}><Circle cx="12" cy="12" r="8.5" {...s} /><Path d="M12 7.5V12l3 2" {...s} /></Svg>;
    case 'garage':
      return <Svg {...p}><Path d="M3.5 10 L12 4.5 L20.5 10" {...s} /><Path d="M5.5 10.5V20h13V10.5" {...s} /><Path d="M8 14h8M8 17h8" {...s} /></Svg>;
    case 'devices':
      return <Svg {...p}><Path d="M6 7l12 10-6 5V2l6 5L6 17" {...s} /></Svg>;
    case 'settings':
      return <Svg {...p}><Path d="M4 7h11M19 7h1M4 17h7M15 17h5" {...s} /><Circle cx="16.5" cy="7" r="2.2" {...s} /><Circle cx="12.5" cy="17" r="2.2" {...s} /></Svg>;
    case 'satellite':
      return <Svg {...p}><Path d="M4 20a8 8 0 0 1 0-11l2 2a5 5 0 0 0 0 7Z" {...s} /><Path d="M11 6l7 7M14 3a7 7 0 0 1 7 7" {...s} /></Svg>;
    case 'pin':
      return <Svg {...p}><Path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z" {...s} /><Circle cx="12" cy="11" r="2.2" {...s} /></Svg>;
    case 'plus':
      return <Svg {...p}><Path d="M12 5v14M5 12h14" {...s} /></Svg>;
    case 'chevron':
      return <Svg {...p}><Path d="M9 5l7 7-7 7" {...s} /></Svg>;
    case 'back':
      return <Svg {...p}><Path d="M15 5l-7 7 7 7" {...s} /></Svg>;
    case 'shield':
      return <Svg {...p}><Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" {...s} /></Svg>;
    case 'heart':
      return <Svg {...p}><Path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z" {...s} /></Svg>;
    case 'bell':
      return <Svg {...p}><Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" {...s} /><Path d="M10 19a2 2 0 0 0 4 0" {...s} /></Svg>;
    case 'moon':
      return <Svg {...p}><Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" {...s} /></Svg>;
    case 'share':
      return <Svg {...p}><Path d="M12 15V4M8 8l4-4 4 4" {...s} /><Path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" {...s} /></Svg>;
    case 'lock':
      return <Svg {...p}><Rect x="5" y="11" width="14" height="9" rx="2.2" {...s} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" {...s} /></Svg>;
    case 'gauge':
      return <Svg {...p}><Path d="M4 18a8 8 0 1 1 16 0" {...s} /><Path d="M12 18l4-5" {...s} /></Svg>;
    case 'search':
      return <Svg {...p}><Circle cx="11" cy="11" r="6.5" {...s} /><Path d="M16 16l4 4" {...s} /></Svg>;
    case 'calendar':
      return <Svg {...p}><Rect x="4" y="5" width="16" height="16" rx="2.5" {...s} /><Path d="M4 9.5h16M8 3v4M16 3v4" {...s} /></Svg>;
    case 'link-off':
      return <Svg {...p}><Path d="M9 12h6" {...s} /><Path d="M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 4 8" {...s} /><Path d="M3 3l18 18" {...s} /></Svg>;
    case 'trophy':
      return <Svg {...p}><Path d="M7 4h10v4a5 5 0 0 1-10 0z" {...s} /><Path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 18h6M10 14h4l1 4H9z" {...s} /></Svg>;
    default:
      return null;
  }
}
