// Run with: node generate-icon.mjs
// Generates a 1024x1024 SVG app icon for iOS/Android
import { writeFileSync } from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="230" fill="#17191D"/>
  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1d1f24"/>
      <stop offset="100%" stop-color="#0E1014"/>
    </radialGradient>
  </defs>
  <!-- A mark -->
  <path d="M164 942 L512 124 L860 942" stroke="#FF6B1A" stroke-width="96"
    stroke-linecap="round" stroke-linejoin="miter" fill="none"/>
  <!-- Racing line crossbar -->
  <path d="M307 676 Q512 532 717 676" stroke="#FF6B1A" stroke-width="96"
    stroke-linecap="round" fill="none"/>
  <!-- Apex dot -->
  <circle cx="512" cy="113" r="72" fill="#F2F2F0"/>
</svg>`;

writeFileSync('public/icon.svg', svg);
console.log('Generated public/icon.svg');
