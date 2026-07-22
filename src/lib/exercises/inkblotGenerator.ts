export interface InkblotRole {
  id: number;
  label: string;
  role: string;
  desc: string;
  step2: string;
  step3: string;
}

export const IMAGE_ROLES: InkblotRole[] = [
  { id: 1, label: 'Image 1 of 5', role: 'Bilateral greyscale', desc: 'Two figures facing / wings spread', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 2, label: 'Image 2 of 5', role: 'Asymmetric greyscale', desc: 'Motion vs stillness', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 3, label: 'Image 3 of 5', role: 'Greyscale + red', desc: 'Colour integration', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 4, label: 'Image 4 of 5', role: 'Dark and heavy', desc: 'Authority and weight', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 5, label: 'Image 5 of 5', role: 'Soft colour washes', desc: 'Open and dissolving', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' }
];

export function generateInkblotSVG(imageId: number, seed: number): string {
  const rng = (n: number) => {
    let x = Math.sin(seed * 9301 + n * 49297 + imageId * 1234) * 233280;
    return x - Math.floor(x);
  };
  const bg = '#f0eeea', ink = '#111', red = '#8b1a1a';
  const w = 400, h = 320, cx = 200, cy = 155;

  function label(n: number) { return `<text x="200" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="3" fill="#aaa">CARD ${n}</text>`; }
  function prompt() { return `<text x="200" y="308" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#bbb" font-style="italic">what do you see?</text>`; }

  let body = '';

  if (imageId === 1) {
    const s = 0.9 + rng(1) * 0.2;
    body = `
      <ellipse cx="${cx-55*s}" cy="${cy-20}" rx="${22*s}" ry="${26*s}" fill="${ink}"/>
      <ellipse cx="${cx+55*s}" cy="${cy-20}" rx="${22*s}" ry="${26*s}" fill="${ink}"/>
      <ellipse cx="${cx-40*s}" cy="${cy+18}" rx="${28*s}" ry="${22*s}" fill="${ink}" transform="rotate(-15,${cx-40*s},${cy+18})"/>
      <ellipse cx="${cx+40*s}" cy="${cy+18}" rx="${28*s}" ry="${22*s}" fill="${ink}" transform="rotate(15,${cx+40*s},${cy+18})"/>
      <line x1="${cx-22*s}" y1="${cy+10}" x2="${cx-8}" y2="${cy+5}" stroke="${ink}" stroke-width="${10*s}" stroke-linecap="round"/>
      <line x1="${cx+22*s}" y1="${cy+10}" x2="${cx+8}" y2="${cy+5}" stroke="${ink}" stroke-width="${10*s}" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${cy+2}" rx="${8*s}" ry="${10*s}" fill="${ink}" opacity="0.5"/>
      <line x1="${cx-55*s}" y1="${cy+32}" x2="${cx-65*s}" y2="${cy+70}" stroke="${ink}" stroke-width="${9*s}" stroke-linecap="round"/>
      <line x1="${cx-55*s}" y1="${cy+32}" x2="${cx-42*s}" y2="${cy+72}" stroke="${ink}" stroke-width="${9*s}" stroke-linecap="round"/>
      <line x1="${cx+55*s}" y1="${cy+32}" x2="${cx+65*s}" y2="${cy+70}" stroke="${ink}" stroke-width="${9*s}" stroke-linecap="round"/>
      <line x1="${cx+55*s}" y1="${cy+32}" x2="${cx+42*s}" y2="${cy+72}" stroke="${ink}" stroke-width="${9*s}" stroke-linecap="round"/>
    `;
  } else if (imageId === 2) {
    const h1 = 80 + rng(1) * 25, w1 = 30 + rng(2) * 10;
    body = `
      <rect x="${cx-w1*2.4}" y="${cy-h1*0.6}" width="${w1*1.6}" height="${h1*1.4}" rx="14" fill="${ink}"/>
      <rect x="${cx+w1*0.8}" y="${cy-h1*0.6}" width="${w1*1.6}" height="${h1*1.4}" rx="14" fill="${ink}"/>
      <ellipse cx="${cx-w1*1.6}" cy="${cy-h1*0.65}" rx="${w1*0.9}" ry="${w1*0.7}" fill="${ink}"/>
      <ellipse cx="${cx+w1*1.6}" cy="${cy-h1*0.65}" rx="${w1*0.9}" ry="${w1*0.7}" fill="${ink}"/>
      <ellipse cx="${cx}" cy="${cy-10}" rx="${w1*0.55}" ry="${w1*0.75}" fill="${ink}" opacity="0.7"/>
      <line x1="${cx-w1*2.4}" y1="${cy+h1*0.55}" x2="${cx-w1*3}" y2="${cy+h1*0.85}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
      <line x1="${cx+w1*2.4}" y1="${cy+h1*0.55}" x2="${cx+w1*3}" y2="${cy+h1*0.85}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
    `;
  } else if (imageId === 3) {
    const r = 30 + rng(1) * 8;
    body = `
      <ellipse cx="${cx}" cy="${cy}" rx="${r*1.1}" ry="${r*1.3}" fill="${ink}"/>
      <ellipse cx="${cx-r*1.8}" cy="${cy-r*0.4}" rx="${r*0.9}" ry="${r*0.65}" fill="${ink}" transform="rotate(-25,${cx-r*1.8},${cy-r*0.4})"/>
      <ellipse cx="${cx+r*1.8}" cy="${cy-r*0.4}" rx="${r*0.9}" ry="${r*0.65}" fill="${ink}" transform="rotate(25,${cx+r*1.8},${cy-r*0.4})"/>
      <ellipse cx="${cx-r*0.9}" cy="${cy-r*1.8}" rx="${r*0.6}" ry="${r*0.8}" fill="${ink}"/>
      <ellipse cx="${cx+r*0.9}" cy="${cy-r*1.8}" rx="${r*0.6}" ry="${r*0.8}" fill="${ink}"/>
      <ellipse cx="${cx-r*0.8}" cy="${cy+r*1.7}" rx="${r*0.55}" ry="${r*0.7}" fill="${ink}"/>
      <ellipse cx="${cx+r*0.8}" cy="${cy+r*1.7}" rx="${r*0.55}" ry="${r*0.7}" fill="${ink}"/>
      <ellipse cx="${cx}" cy="${cy-r*0.1}" rx="${r*0.45}" ry="${r*0.6}" fill="${red}"/>
      <ellipse cx="${cx-r*2.6}" cy="${cy+r*0.3}" rx="${r*0.42}" ry="${r*0.28}" fill="${red}"/>
      <ellipse cx="${cx+r*2.6}" cy="${cy+r*0.3}" rx="${r*0.42}" ry="${r*0.28}" fill="${red}"/>
    `;
  } else if (imageId === 4) {
    const s = 0.9 + rng(1) * 0.2;
    body = `
      <ellipse cx="${cx}" cy="${cy+10}" rx="${75*s}" ry="${28*s}" fill="${ink}"/>
      <ellipse cx="${cx-90*s}" cy="${cy+5}" rx="${32*s}" ry="${22*s}" fill="${ink}"/>
      <ellipse cx="${cx+90*s}" cy="${cy+5}" rx="${32*s}" ry="${22*s}" fill="${ink}"/>
      <ellipse cx="${cx-90*s}" cy="${cy+28}" rx="${18*s}" ry="${12*s}" fill="${ink}"/>
      <ellipse cx="${cx+90*s}" cy="${cy+28}" rx="${18*s}" ry="${12*s}" fill="${ink}"/>
      <ellipse cx="${cx}" cy="${cy-22}" rx="${20*s}" ry="${16*s}" fill="${ink}"/>
      <ellipse cx="${cx-28*s}" cy="${cy-35}" rx="${12*s}" ry="${9*s}" fill="${ink}"/>
      <ellipse cx="${cx+28*s}" cy="${cy-35}" rx="${12*s}" ry="${9*s}" fill="${ink}"/>
      <line x1="${cx-75*s}" y1="${cy+35}" x2="${cx-80*s}" y2="${cy+60}" stroke="${ink}" stroke-width="${10*s}" stroke-linecap="round"/>
      <line x1="${cx+75*s}" y1="${cy+35}" x2="${cx+80*s}" y2="${cy+60}" stroke="${ink}" stroke-width="${10*s}" stroke-linecap="round"/>
    `;
  } else if (imageId === 5) {
    const s = 0.9 + rng(1) * 0.2;
    body = `
      <rect x="${cx-12}" y="${cy-90}" width="24" height="140" rx="10" fill="${ink}"/>
      <ellipse cx="${cx}" cy="${cy-90}" rx="18" ry="16" fill="${ink}"/>
      <ellipse cx="${cx-42*s}" cy="${cy-55}" rx="${28*s}" ry="${16*s}" fill="${ink}" transform="rotate(-10,${cx-42*s},${cy-55})"/>
      <ellipse cx="${cx+42*s}" cy="${cy-55}" rx="${28*s}" ry="${16*s}" fill="${ink}" transform="rotate(10,${cx+42*s},${cy-55})"/>
      <ellipse cx="${cx-35*s}" cy="${cy-10}" rx="${22*s}" ry="${13*s}" fill="${ink}"/>
      <ellipse cx="${cx+35*s}" cy="${cy-10}" rx="${22*s}" ry="${13*s}" fill="${ink}"/>
      <ellipse cx="${cx-20*s}" cy="${cy+38}" rx="${14*s}" ry="${10*s}" fill="${ink}"/>
      <ellipse cx="${cx+20*s}" cy="${cy+38}" rx="${14*s}" ry="${10*s}" fill="${ink}"/>
      <line x1="${cx-8}" y1="${cy+50}" x2="${cx-18}" y2="${cy+80}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
      <line x1="${cx+8}" y1="${cy+50}" x2="${cx+18}" y2="${cy+80}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
    `;
  }

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="background:${bg}">${label(imageId)}${body}${prompt()}</svg>`
  );
}

export function getInkblotImageUrls(userSeed: number): string[] {
  return IMAGE_ROLES.map(img => generateInkblotSVG(img.id, userSeed + img.id));
}
