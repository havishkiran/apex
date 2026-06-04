import { AX } from '../tokens';

export function Glyph({ name, size = 24, color = 'currentColor', sw = 2, style = {} }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'track': return <svg {...p} fill={color} stroke="none" style={style}><path d="M12 2 L20.5 21 L12 16.6 L3.5 21 Z" /></svg>;
    case 'history': return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case 'garage': return <svg {...p}><path d="M3.5 10 L12 4.5 L20.5 10" /><path d="M5.5 10.5V20h13V10.5" /><path d="M8 14h8M8 17h8" /></svg>;
    case 'devices': return <svg {...p}><path d="M6 7l12 10-6 5V2l6 5L6 17" /></svg>;
    case 'settings': return <svg {...p}><path d="M4 7h11M19 7h1M4 17h7M15 17h5" /><circle cx="16.5" cy="7" r="2.2" /><circle cx="12.5" cy="17" r="2.2" /></svg>;
    case 'satellite': return <svg {...p}><path d="M4 20a8 8 0 0 1 0-11l2 2a5 5 0 0 0 0 7Z" /><path d="M11 6l7 7M14 3a7 7 0 0 1 7 7" /></svg>;
    case 'recenter': return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    case 'chevron': return <svg {...p}><path d="M9 5l7 7-7 7" /></svg>;
    case 'chevron-down': return <svg {...p}><path d="M5 9l7 7 7-7" /></svg>;
    case 'back': return <svg {...p}><path d="M15 5l-7 7 7 7" /></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'speed': return <svg {...p}><path d="M12 14l5-5" /><circle cx="12" cy="13" r="9" /><path d="M12 4v1.5M21 13h-1.5M4.5 13H3" /></svg>;
    case 'elevation': return <svg {...p}><path d="M3 19l6-9 4 5 3-4 5 8z" /></svg>;
    case 'lean': return <svg {...p}><path d="M5 20h14" /><path d="M12 20 L8 7" /><path d="M8 7a4 4 0 0 1 7 1" /></svg>;
    case 'distance': return <svg {...p}><path d="M4 12h16" /><path d="M4 9v6M20 9v6M12 10v4" /></svg>;
    case 'calendar': return <svg {...p}><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9.5h16M8 3v4M16 3v4" /></svg>;
    case 'battery': return <svg {...p}><rect x="3" y="8" width="15" height="9" rx="2" /><path d="M21 11v3" /></svg>;
    case 'check': return <svg {...p}><path d="M5 12.5l4.5 4.5L19 6.5" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>;
    case 'link-off': return <svg {...p}><path d="M9 12h6" /><path d="M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 4 8" /><path d="M3 3l18 18" /></svg>;
    case 'gauge': return <svg {...p}><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 18l4-5" /></svg>;
    case 'fuel': return <svg {...p}><rect x="4" y="4" width="9" height="16" rx="1.5" /><path d="M7 9h3M13 8l3 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6l-3-3" /></svg>;
    case 'helmet': return <svg {...p}><path d="M4 14a8 8 0 0 1 16 0v2a2 2 0 0 1-2 2h-3l-1-2H7a3 3 0 0 1-3-3z" /></svg>;
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>;
    case 'bell': return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
    case 'moon': return <svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>;
    case 'share': return <svg {...p}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>;
    case 'trophy': return <svg {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 18h6M10 14h4l1 4H9z" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case 'unlock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 7.5-1.9" /></svg>;
    case 'm-right': return <svg {...p}><path d="M7 21v-7a4 4 0 0 1 4-4h6" /><path d="M13 6l5 4-5 4" /></svg>;
    case 'm-left': return <svg {...p}><path d="M17 21v-7a4 4 0 0 0-4-4H7" /><path d="M11 6L6 10l5 4" /></svg>;
    case 'm-slight-right': return <svg {...p}><path d="M8 21V14a5 5 0 0 1 1.6-3.6L16 5" /><path d="M11 4.5h6v6" /></svg>;
    case 'm-slight-left': return <svg {...p}><path d="M16 21v-7a5 5 0 0 0-1.6-3.6L8 5" /><path d="M13 4.5H7v6" /></svg>;
    case 'm-straight': return <svg {...p}><path d="M12 21V5" /><path d="M6 11l6-6 6 6" /></svg>;
    case 'm-uturn': return <svg {...p}><path d="M8 21v-9a4 4 0 0 1 8 0v3" /><path d="M12 12l4 4 4-4" /></svg>;
    case 'arrive': return <svg {...p}><path d="M7 21V4" /><path d="M7 5h9l-2.5 3L16 11H7" fill={color} stroke="none" /></svg>;
    default: return null;
  }
}
