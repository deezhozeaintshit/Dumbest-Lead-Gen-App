import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to generate an icon PNG with custom size and safe-zone padding for maskable icons
function generateIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const scale = (isMaskable ? 0.72 : 0.88) * (size / 512);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Coordinate relative to center in 512 scale
      const nx = (x - center) / scale;
      const ny = (y - center) / scale;

      // Background color: deep slate gradient (#020617 to #0f172a to #1e1b4b)
      const gradT = Math.min(1, Math.max(0, (x + y) / (size * 1.6)));
      let r = Math.round(2 + gradT * 26);
      let g = Math.round(6 + gradT * 18);
      let b = Math.round(23 + gradT * 50);
      let a = 255;

      // Squircle background corner radius check (if not maskable, round corners)
      if (!isMaskable) {
        const cornerR = 80 * (size / 512);
        const dx = Math.max(0, Math.abs(x - center) - (center - cornerR));
        const dy = Math.max(0, Math.abs(y - center) - (center - cornerR));
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cornerR) {
          a = 0;
        } else if (dist > cornerR - 1.5) {
          a = Math.round(255 * (cornerR - dist) / 1.5);
        }
      }

      if (a > 0) {
        // Subtle ambient ring
        const distFromCenter = Math.sqrt(nx * nx + ny * ny);
        if (Math.abs(distFromCenter - 180) < 3) {
          const ringAlpha = 0.25;
          r = Math.round(r * (1 - ringAlpha) + 56 * ringAlpha);
          g = Math.round(g * (1 - ringAlpha) + 189 * ringAlpha);
          b = Math.round(b * (1 - ringAlpha) + 248 * ringAlpha);
        }

        // Funnel shape math:
        // Top bar: ny between -120 and -90, nx between -130 and 130
        // Funnel body: ny between -90 and 40, width narrows linearly from 130 to 45
        // Funnel spout: ny between 40 and 120, width 45 (angled spout)
        let inFunnel = false;
        let funnelColor = null;

        if (ny >= -120 && ny <= -90 && Math.abs(nx) <= 135) {
          inFunnel = true;
        } else if (ny > -90 && ny <= 35) {
          const t = (ny - (-90)) / 125;
          const halfWidth = 135 * (1 - t) + 42 * t;
          if (Math.abs(nx) <= halfWidth) {
            inFunnel = true;
          }
        } else if (ny > 35 && ny <= 115) {
          const spoutNx = nx - (ny - 35) * 0.25;
          if (Math.abs(spoutNx) <= 40) {
            inFunnel = true;
          }
        }

        if (inFunnel) {
          const funnelT = Math.min(1, Math.max(0, (ny + 120) / 235));
          // Electric blue gradient (#60a5fa to #2563eb)
          const fr = Math.round(96 * (1 - funnelT) + 37 * funnelT);
          const fg = Math.round(165 * (1 - funnelT) + 99 * funnelT);
          const fb = Math.round(250 * (1 - funnelT) + 235 * funnelT);

          // Lightning bolt highlight inside funnel
          const isBolt =
            (ny >= -80 && ny <= -30 && Math.abs(nx + (ny + 55) * 0.4) <= 12) ||
            (ny >= -35 && ny <= 25 && Math.abs(nx - (ny + 5) * 0.3) <= 10) ||
            (ny >= 20 && ny <= 75 && Math.abs(nx + (ny - 50) * 0.3) <= 8);

          if (isBolt) {
            r = 255;
            g = 255;
            b = 255;
          } else {
            r = fr;
            g = fg;
            b = fb;
          }
        }

        // Top node dots (sky blue, blue, indigo)
        const dot1 = Math.sqrt((nx - (-86)) ** 2 + (ny - (-145)) ** 2);
        const dot2 = Math.sqrt((nx - 0) ** 2 + (ny - (-162)) ** 2);
        const dot3 = Math.sqrt((nx - 86) ** 2 + (ny - (-145)) ** 2);

        if (dot1 <= 15) {
          r = 56; g = 189; b = 248;
        } else if (dot2 <= 17) {
          r = 96; g = 165; b = 250;
        } else if (dot3 <= 15) {
          r = 129; g = 140; b = 248;
        }

        // Bottom gold output node (#fbbf24)
        const goldDot = Math.sqrt((nx - (-10)) ** 2 + (ny - 155) ** 2);
        if (goldDot <= 18) {
          r = 251; g = 191; b = 36;
        } else if (Math.abs(goldDot - 25) <= 2) {
          r = 245; g = 158; b = 11;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

// Generate all required PWA icons
const targets = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon.png', size: 64, maskable: false },
];

for (const target of targets) {
  const png = generateIcon(target.size, target.maskable);
  const buffer = PNG.sync.write(png);
  const outPath = path.join(publicDir, target.file);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${target.file} (${target.size}x${target.size})`);
}
console.log('All icons generated successfully!');
