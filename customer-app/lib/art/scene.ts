/**
 * ChowBuy motorcycle scene artwork as plain SVG strings (rendered with react-native-svg's SvgXml).
 * Pure functions with no React Native imports so the art can also be previewed or tested in Node.
 * The bike faces right; the wheels are separate so the app can spin them.
 */
export interface ScenePalette {
  sky: string; far: string; near: string; window: string; road: string; roadLine: string;
  orange: string; orangeDark: string; orangeLight: string; ink: string; steel: string; white: string; skin: string;
}

export const sceneLight: ScenePalette = {
  sky: '#FFF1E8', far: '#FFD9C0', near: '#FFC09B', window: '#FFF6EF', road: '#2B3347', roadLine: '#FFFFFF',
  orange: '#FF5A1F', orangeDark: '#E2430C', orangeLight: '#FF8A4C', ink: '#171B2B', steel: '#3A4560', white: '#FFFFFF', skin: '#8A5A3C',
};
export const sceneDark: ScenePalette = {
  sky: '#121829', far: '#1B2338', near: '#26304A', window: '#FFB36B', road: '#0A0E18', roadLine: '#3A4560',
  orange: '#FF6A00', orangeDark: '#E2430C', orangeLight: '#FF9A55', ink: '#0B0F19', steel: '#4A5775', white: '#FFFFFF', skin: '#8A5A3C',
};

export const BIKE_W = 320;
export const BIKE_H = 220;
export const WHEEL_R = 36;
export const REAR_WHEEL = { x: 80, y: 168 };
export const FRONT_WHEEL = { x: 246, y: 168 };

/** The ChowBuy mark: a ring with a forward arrow and speed streaks, drawn small enough for a helmet or box. */
function mark(cx: number, cy: number, s: number, fill: string): string {
  return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${fill}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 -6 A12 12 0 1 0 9 8" stroke-width="5"/>
    <path d="M-2 1 H14 M9 -5 L15 1 L9 7" stroke-width="4.5"/>
    <path d="M-22 -6 H-15 M-25 2 H-14" stroke-width="3.2"/>
  </g>`;
}

/** Rider, bike frame, delivery box, helmet. No wheels. */
export function bikeBody(p: ScenePalette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BIKE_W}" height="${BIKE_H}" viewBox="0 0 ${BIKE_W} ${BIKE_H}">
  <defs>
    <linearGradient id="tank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.orangeLight}"/><stop offset="1" stop-color="${p.orange}"/></linearGradient>
    <linearGradient id="helm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.orangeLight}"/><stop offset="0.55" stop-color="${p.orange}"/><stop offset="1" stop-color="${p.orangeDark}"/></linearGradient>
    <linearGradient id="visor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1B2030"/><stop offset="0.7" stop-color="#3A4256"/><stop offset="1" stop-color="#7C849A"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></linearGradient>
  </defs>
  <!-- headlight beam -->
  <path d="M236 108 L320 90 L320 138 Z" fill="url(#beam)"/>
  <!-- delivery box -->
  <g>
    <rect x="14" y="66" width="86" height="64" rx="9" fill="${p.orange}"/>
    <rect x="14" y="66" width="86" height="15" rx="9" fill="${p.orangeDark}"/>
    <rect x="14" y="74" width="86" height="7" fill="${p.orangeDark}"/>
    ${mark(58, 105, 0.95, p.white)}
    <rect x="24" y="130" width="62" height="7" rx="3.5" fill="${p.steel}"/>
  </g>
  <!-- swingarm, engine, frame -->
  <path d="M80 168 L138 146" stroke="${p.steel}" stroke-width="9" stroke-linecap="round"/>
  <rect x="124" y="130" width="56" height="32" rx="10" fill="${p.ink}"/>
  <rect x="134" y="138" width="30" height="7" rx="3.5" fill="${p.steel}"/>
  <path d="M128 164 L206 160" stroke="${p.steel}" stroke-width="5" stroke-linecap="round"/>
  <!-- exhaust -->
  <path d="M116 158 L70 160" stroke="#9AA3B8" stroke-width="7" stroke-linecap="round"/>
  <!-- seat -->
  <path d="M100 124 Q132 112 176 120 L176 130 L100 132 Z" fill="${p.ink}"/>
  <!-- tank / fairing -->
  <path d="M168 122 Q196 94 228 100 L232 122 Q198 134 170 134 Z" fill="url(#tank)"/>
  <path d="M176 118 Q198 100 222 104" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <!-- fork + front fender + bars -->
  <path d="M246 168 L222 98" stroke="${p.steel}" stroke-width="8" stroke-linecap="round"/>
  <path d="M206 142 Q246 112 286 146 L282 152 Q246 126 210 150 Z" fill="${p.orangeDark}"/>
  <path d="M212 94 L232 88" stroke="${p.ink}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="236" cy="104" r="8" fill="#FFE9A8"/><circle cx="236" cy="104" r="8" fill="none" stroke="${p.steel}" stroke-width="3"/>
  <!-- rider: leg (behind) -->
  <path d="M134 108 L178 120 L170 152" stroke="${p.steel}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="160" y="148" width="26" height="10" rx="5" fill="${p.ink}"/>
  <!-- torso -->
  <path d="M132 112 L174 72" stroke="${p.ink}" stroke-width="30" stroke-linecap="round"/>
  <path d="M146 104 L168 82" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="4" stroke-linecap="round"/>
  <!-- arm -->
  <path d="M176 78 L200 94 L222 94" stroke="${p.ink}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="224" cy="94" r="7" fill="${p.orange}"/>
  <!-- helmet -->
  <g>
    <path d="M160 64 Q158 34 192 31 Q222 30 228 58 L228 68 Q228 74 220 74 L170 74 Q160 74 160 64 Z" fill="url(#helm)"/>
    <path d="M194 49 Q218 47 228 58 L228 68 L200 70 Q190 60 194 49 Z" fill="url(#visor)"/>
    <path d="M200 52 Q214 51 222 57" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M165 40 Q184 28 208 34" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${mark(180, 56, 0.34, p.white)}
    <path d="M162 70 Q190 76 226 70" stroke="${p.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

/** One wheel, centred in a (2*WHEEL_R+8) square so it can be rotated about its middle. */
export function wheel(p: ScenePalette): string {
  const s = WHEEL_R * 2 + 8, c = s / 2;
  const spokes = [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180;
    return `<line x1="${c + Math.cos(r) * 6}" y1="${c + Math.sin(r) * 6}" x2="${c + Math.cos(r) * 25}" y2="${c + Math.sin(r) * 25}" stroke="#C9CFDD" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <circle cx="${c}" cy="${c}" r="${WHEEL_R - 3}" fill="none" stroke="${p.ink}" stroke-width="8"/>
  <circle cx="${c}" cy="${c}" r="${WHEEL_R - 9}" fill="none" stroke="${p.orange}" stroke-width="4"/>
  <circle cx="${c}" cy="${c - (WHEEL_R - 3)}" r="2.6" fill="#FFFFFF"/>
  ${spokes}
  <circle cx="${c}" cy="${c}" r="7" fill="${p.ink}"/><circle cx="${c}" cy="${c}" r="3" fill="${p.orange}"/>
</svg>`;
}

function rng(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }

/** A skyline strip that tiles seamlessly (first and last building edges match). */
export function skyline(p: ScenePalette, w: number, h: number, layer: 'far' | 'near', seed: number): string {
  const r = rng(seed);
  const col = layer === 'far' ? p.far : p.near;
  let x = 0; const parts: string[] = [];
  while (x < w) {
    const bw = Math.min(w - x, (layer === 'far' ? 34 : 46) + Math.floor(r() * 30));
    const bh = h * (layer === 'far' ? 0.45 : 0.3) + r() * h * (layer === 'far' ? 0.5 : 0.35);
    parts.push(`<rect x="${x}" y="${h - bh}" width="${bw + 1}" height="${bh}" rx="3" fill="${col}"/>`);
    if (layer === 'near') {
      for (let wy = h - bh + 10; wy < h - 12; wy += 15) for (let wx = x + 8; wx < x + bw - 8; wx += 13) {
        if (r() > 0.45) parts.push(`<rect x="${wx}" y="${wy}" width="6" height="8" rx="1.5" fill="${p.window}" opacity="0.9"/>`);
      }
    }
    x += bw;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
}

/** Dashed centre line, tiles every 48px. */
export function roadDashes(p: ScenePalette, w: number): string {
  const dashes: string[] = [];
  for (let x = 0; x < w; x += 48) dashes.push(`<rect x="${x}" y="3" width="26" height="4" rx="2" fill="${p.roadLine}" opacity="0.8"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="10" viewBox="0 0 ${w} 10">${dashes.join('')}</svg>`;
}
