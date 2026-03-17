import sharp from 'sharp';
import { writeFileSync } from 'fs';

// Cute paw print icon on warm cream/terracotta background
// Matches the Critter app's cozy aesthetic
const size = 512;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#F4845F"/>
      <stop offset="100%" stop-color="#E07A5F"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>

  <!-- Rounded background -->
  <rect width="${size}" height="${size}" rx="112" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="112" fill="url(#glow)"/>

  <!-- Paw pad (main) -->
  <ellipse cx="256" cy="310" rx="75" ry="65" fill="#FFF8F0" opacity="0.95"/>

  <!-- Toe beans -->
  <ellipse cx="175" cy="225" rx="38" ry="42" fill="#FFF8F0" opacity="0.95" transform="rotate(-15 175 225)"/>
  <ellipse cx="256" cy="200" rx="36" ry="44" fill="#FFF8F0" opacity="0.95"/>
  <ellipse cx="337" cy="225" rx="38" ry="42" fill="#FFF8F0" opacity="0.95" transform="rotate(15 337 225)"/>

  <!-- Tiny highlight dots on beans for cuteness -->
  <circle cx="170" cy="215" r="10" fill="white" opacity="0.5"/>
  <circle cx="252" cy="190" r="10" fill="white" opacity="0.5"/>
  <circle cx="332" cy="215" r="10" fill="white" opacity="0.5"/>
  <circle cx="248" cy="298" r="14" fill="white" opacity="0.4"/>

  <!-- Small sparkle -->
  <g transform="translate(380, 140)" fill="#FFF8F0" opacity="0.7">
    <rect x="-2" y="-12" width="4" height="24" rx="2"/>
    <rect x="-12" y="-2" width="24" height="4" rx="2"/>
  </g>
  <g transform="translate(130, 155)" fill="#FFF8F0" opacity="0.5">
    <rect x="-1.5" y="-8" width="3" height="16" rx="1.5"/>
    <rect x="-8" y="-1.5" width="16" height="3" rx="1.5"/>
  </g>
</svg>`;

// Generate multiple sizes
const sizes = [180, 192, 512];
for (const s of sizes) {
  const buf = await sharp(Buffer.from(svg)).resize(s, s).png().toBuffer();
  writeFileSync(`client/public/icon-${s}.png`, buf);
  console.log(`Generated icon-${s}.png`);
}

// Also generate apple-touch-icon (180x180)
const appleBuf = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();
writeFileSync('client/public/apple-touch-icon.png', appleBuf);
console.log('Generated apple-touch-icon.png');
