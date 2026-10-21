/** Illustrations for the first-run intro slides, as SVG strings (SvgXml). 280 x 240, ChowBuy orange with a fresh-green accent. */
export interface IntroPalette { orange: string; orangeDark: string; orangeLight: string; soft: string; ink: string; white: string; green: string; cream: string; shadow: string }

export const introLight: IntroPalette = { orange: '#FF5A1F', orangeDark: '#E2430C', orangeLight: '#FF8A4C', soft: '#FFE3D2', ink: '#171B2B', white: '#FFFFFF', green: '#00A86B', cream: '#FFF6EE', shadow: '#F2C9B1' };
export const introDark: IntroPalette = { orange: '#FF6A00', orangeDark: '#E2430C', orangeLight: '#FF9A55', soft: '#2B1B0F', ink: '#F3F5F9', white: '#FFFFFF', green: '#00C070', cream: '#1D2536', shadow: '#0B0F19' };

const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">${inner}</svg>`;

export function foodArt(p: IntroPalette): string {
  return wrap(`
  <defs><linearGradient id="rice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.orangeLight}"/><stop offset="1" stop-color="${p.orange}"/></linearGradient></defs>
  <circle cx="140" cy="122" r="104" fill="${p.soft}"/>
  <ellipse cx="140" cy="196" rx="86" ry="10" fill="${p.shadow}" opacity="0.7"/>
  <path d="M60 138 H220 Q216 196 140 198 Q64 196 60 138 Z" fill="${p.white}" stroke="${p.ink}" stroke-opacity="0.12" stroke-width="2"/>
  <path d="M66 152 H214" stroke="${p.orange}" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 140 Q80 78 140 74 Q200 78 206 140 Z" fill="url(#rice)"/>
  <g fill="${p.white}" opacity="0.85"><ellipse cx="112" cy="104" rx="5" ry="2.6" transform="rotate(-20 112 104)"/><ellipse cx="146" cy="92" rx="5" ry="2.6" transform="rotate(10 146 92)"/><ellipse cx="170" cy="118" rx="5" ry="2.6" transform="rotate(-30 170 118)"/><ellipse cx="128" cy="124" rx="5" ry="2.6" transform="rotate(20 128 124)"/><ellipse cx="96" cy="126" rx="5" ry="2.6"/></g>
  <circle cx="186" cy="102" r="10" fill="${p.orangeDark}"/><path d="M186 92 q3 -7 9 -7" stroke="${p.green}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M104 74 q-8 -14 0 -26 q8 -12 0 -24" stroke="${p.orange}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>
  <path d="M140 66 q-8 -14 0 -26 q8 -12 0 -24" stroke="${p.orange}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M176 74 q-8 -14 0 -26 q8 -12 0 -24" stroke="${p.orange}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>
  <g transform="translate(226 176) rotate(18)"><rect x="-4" y="-30" width="8" height="60" rx="4" fill="${p.ink}" opacity="0.8"/><path d="M-10 -34 v16 q0 6 6 6 h8 q6 0 6 -6 v-16" fill="none" stroke="${p.ink}" stroke-opacity="0.8" stroke-width="3"/></g>`);
}

export function groceryArt(p: IntroPalette): string {
  return wrap(`
  <circle cx="140" cy="122" r="104" fill="${p.soft}"/>
  <ellipse cx="140" cy="206" rx="80" ry="9" fill="${p.shadow}" opacity="0.7"/>
  <g>
    <path d="M118 96 q-22 -34 -6 -54 q14 8 12 30 z" fill="${p.green}"/><path d="M138 90 q-6 -42 18 -58 q10 26 -10 58 z" fill="${p.green}" opacity="0.85"/>
    <circle cx="176" cy="92" r="17" fill="${p.orangeDark}"/><path d="M176 76 q4 -8 11 -8" stroke="${p.green}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="94" y="62" width="24" height="52" rx="10" fill="${p.white}" stroke="${p.orange}" stroke-width="3"/><rect x="98" y="78" width="16" height="14" rx="3" fill="${p.orange}"/>
    <path d="M190 112 q4 -34 28 -34 q8 22 -8 40 z" fill="${p.orangeLight}"/>
  </g>
  <path d="M76 108 H204 L194 200 Q193 206 187 206 H93 Q87 206 86 200 Z" fill="${p.orange}"/>
  <path d="M76 108 H204 L201 128 H79 Z" fill="${p.orangeDark}"/>
  <path d="M104 108 q36 -30 72 0" stroke="${p.orangeDark}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g fill="none" stroke="${p.white}" stroke-linecap="round" stroke-linejoin="round" transform="translate(140 164) scale(1.15)"><path d="M9 -6 A12 12 0 1 0 9 8" stroke-width="5"/><path d="M-2 1 H14 M9 -5 L15 1 L9 7" stroke-width="4.5"/><path d="M-22 -6 H-15 M-25 2 H-14" stroke-width="3.2"/></g>`);
}

export function pharmacyArt(p: IntroPalette): string {
  return wrap(`
  <circle cx="140" cy="122" r="104" fill="${p.soft}"/>
  <ellipse cx="140" cy="208" rx="82" ry="9" fill="${p.shadow}" opacity="0.7"/>
  <rect x="68" y="92" width="144" height="112" rx="22" fill="${p.white}" stroke="${p.ink}" stroke-opacity="0.1" stroke-width="2"/>
  <rect x="68" y="92" width="144" height="30" rx="22" fill="${p.orange}"/><rect x="68" y="106" width="144" height="16" fill="${p.orange}"/>
  <rect x="116" y="130" width="48" height="48" rx="12" fill="${p.orange}"/>
  <path d="M140 140 v28 M126 154 h28" stroke="${p.white}" stroke-width="9" stroke-linecap="round"/>
  <g transform="translate(206 70) rotate(28)"><rect x="-12" y="-30" width="24" height="60" rx="12" fill="${p.white}" stroke="${p.ink}" stroke-opacity="0.12" stroke-width="2"/><path d="M-12 0 V-18 a12 12 0 0 1 24 0 V0 Z" fill="${p.orange}"/></g>
  <g transform="translate(70 70) rotate(-24)"><circle r="17" fill="${p.white}" stroke="${p.ink}" stroke-opacity="0.12" stroke-width="2"/><path d="M-17 0 H17" stroke="${p.orangeLight}" stroke-width="4"/></g>
  <g transform="translate(206 176)"><path d="M0 -26 L22 -18 V2 Q22 18 0 28 Q-22 18 -22 2 V-18 Z" fill="${p.green}"/><path d="M-9 1 L-2 8 L11 -7" stroke="${p.white}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`);
}
