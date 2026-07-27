export interface InkblotImageRole {
  id: number;
  label: string;
  role: string;
  desc: string;
  step2: string;
  step3: string;
}

export const INKBLOT_IMAGE_ROLES: InkblotImageRole[] = [
  { id: 1, label: 'Image 1 of 5', role: 'Bilateral greyscale', desc: 'Two figures facing / wings spread', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 2, label: 'Image 2 of 5', role: 'Asymmetric greyscale', desc: 'Motion vs stillness', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 3, label: 'Image 3 of 5', role: 'Greyscale + red', desc: 'Colour integration', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 4, label: 'Image 4 of 5', role: 'Dark and heavy', desc: 'Authority and weight', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
  { id: 5, label: 'Image 5 of 5', role: 'Soft colour washes', desc: 'Closure', step2: 'Which part of the image stood out most?', step3: 'What feeling, if any, did this bring up?' },
];

export class InkblotImageGenerator {
  /**
   * Generates deterministic seed number for a given user, cycle, and card index.
   */
  public static hashSeed(userId: string, cycle: number = 1, cardIndex: number = 1): number {
    const str = `${userId}_cycle_${cycle}_exercise_2_card_${cardIndex}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) + 1000;
  }

  /**
   * Generates 5 unique SVG Inkblot Data URLs matching the 5 role specifications.
   */
  public static generateInkblotImageUrls(userId: string, cycle: number = 1): { urls: string[]; seeds: string[] } {
    const urls: string[] = [];
    const seeds: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const numericSeed = this.hashSeed(userId, cycle, i);
      const seedStr = `${numericSeed}`;
      seeds.push(seedStr);
      try {
        const svgUrl = this.createInkblotSvgDataUrl(i, numericSeed);
        urls.push(svgUrl);
      } catch (err) {
        console.warn(`[InkblotImageGenerator] Failed to generate card ${i}, using fallback:`, err);
        urls.push(this.createFallbackSvgDataUrl(i));
      }
    }

    return { urls, seeds };
  }

  /**
   * Public fallback SVG data URL generator.
   */
  public static createFallbackSvgDataUrl(cardId: number): string {
    const bg = '#f0eeea';
    const ink = '#222222';
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" style="background:${bg}">
      <text x="200" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="3" fill="#aaa">CARD ${cardId}</text>
      <circle cx="200" cy="160" r="50" fill="${ink}"/>
      <text x="200" y="308" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#bbb" font-style="italic">what do you see?</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }

  /**
   * Renders procedural high-resolution SVG Inkblot for card 1..5.
   */
  private static createInkblotSvgDataUrl(cardId: number, seed: number): string {
    const rng = (n: number) => {
      const x = Math.sin(seed * 9301 + n * 49297 + cardId * 1234) * 233280;
      return x - Math.floor(x);
    };

    const bg = '#f0eeea';
    const ink = '#111111';
    const red = '#8b1a1a';
    const w = 400;
    const h = 320;
    const cx = 200;
    const cy = 155;

    const label = (n: number) =>
      `<text x="200" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="3" fill="#aaa">CARD ${n}</text>`;
    const prompt = () =>
      `<text x="200" y="308" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#bbb" font-style="italic">what do you see?</text>`;

    let body = '';

    if (cardId === 1) {
      const s = 0.9 + rng(1) * 0.2;
      body = `
        <ellipse cx="${cx - 55 * s}" cy="${cy - 20}" rx="${22 * s}" ry="${26 * s}" fill="${ink}"/>
        <ellipse cx="${cx + 55 * s}" cy="${cy - 20}" rx="${22 * s}" ry="${26 * s}" fill="${ink}"/>
        <ellipse cx="${cx - 40 * s}" cy="${cy + 18}" rx="${28 * s}" ry="${22 * s}" fill="${ink}" transform="rotate(-15,${cx - 40 * s},${cy + 18})"/>
        <ellipse cx="${cx + 40 * s}" cy="${cy + 18}" rx="${28 * s}" ry="${22 * s}" fill="${ink}" transform="rotate(15,${cx + 40 * s},${cy + 18})"/>
        <line x1="${cx - 22 * s}" y1="${cy + 10}" x2="${cx - 8}" y2="${cy + 5}" stroke="${ink}" stroke-width="${10 * s}" stroke-linecap="round"/>
        <line x1="${cx + 22 * s}" y1="${cy + 10}" x2="${cx + 8}" y2="${cy + 5}" stroke="${ink}" stroke-width="${10 * s}" stroke-linecap="round"/>
        <ellipse cx="${cx}" cy="${cy + 2}" rx="${8 * s}" ry="${10 * s}" fill="${ink}" opacity="0.5"/>
        <line x1="${cx - 55 * s}" y1="${cy + 32}" x2="${cx - 65 * s}" y2="${cy + 70}" stroke="${ink}" stroke-width="${9 * s}" stroke-linecap="round"/>
        <line x1="${cx - 55 * s}" y1="${cy + 32}" x2="${cx - 42 * s}" y2="${cy + 72}" stroke="${ink}" stroke-width="${9 * s}" stroke-linecap="round"/>
        <line x1="${cx + 55 * s}" y1="${cy + 32}" x2="${cx + 65 * s}" y2="${cy + 70}" stroke="${ink}" stroke-width="${9 * s}" stroke-linecap="round"/>
        <line x1="${cx + 55 * s}" y1="${cy + 32}" x2="${cx + 42 * s}" y2="${cy + 72}" stroke="${ink}" stroke-width="${9 * s}" stroke-linecap="round"/>
      `;
    } else if (cardId === 2) {
      const h1 = 80 + rng(1) * 25;
      const w1 = 30 + rng(2) * 10;
      body = `
        <rect x="${cx - w1 * 2.4}" y="${cy - h1 * 0.6}" width="${w1 * 1.6}" height="${h1 * 1.4}" rx="14" fill="${ink}"/>
        <rect x="${cx + w1 * 0.8}" y="${cy - h1 * 0.6}" width="${w1 * 1.6}" height="${h1 * 1.4}" rx="14" fill="${ink}"/>
        <ellipse cx="${cx - w1 * 1.6}" cy="${cy - h1 * 0.65}" rx="${w1 * 0.9}" ry="${w1 * 0.7}" fill="${ink}"/>
        <ellipse cx="${cx + w1 * 1.6}" cy="${cy - h1 * 0.65}" rx="${w1 * 0.9}" ry="${w1 * 0.7}" fill="${ink}"/>
        <ellipse cx="${cx}" cy="${cy - 10}" rx="${w1 * 0.55}" ry="${w1 * 0.75}" fill="${ink}" opacity="0.7"/>
        <line x1="${cx - w1 * 2.4}" y1="${cy + h1 * 0.55}" x2="${cx - w1 * 3}" y2="${cy + h1 * 0.85}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
        <line x1="${cx + w1 * 2.4}" y1="${cy + h1 * 0.55}" x2="${cx + w1 * 3}" y2="${cy + h1 * 0.85}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
      `;
    } else if (cardId === 3) {
      const r = 30 + rng(1) * 8;
      body = `
        <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.1}" ry="${r * 1.3}" fill="${ink}"/>
        <ellipse cx="${cx - r * 1.8}" cy="${cy - r * 0.4}" rx="${r * 0.9}" ry="${r * 0.65}" fill="${ink}" transform="rotate(-25,${cx - r * 1.8},${cy - r * 0.4})"/>
        <ellipse cx="${cx + r * 1.8}" cy="${cy - r * 0.4}" rx="${r * 0.9}" ry="${r * 0.65}" fill="${ink}" transform="rotate(25,${cx + r * 1.8},${cy - r * 0.4})"/>
        <ellipse cx="${cx - r * 0.9}" cy="${cy - r * 1.8}" rx="${r * 0.6}" ry="${r * 0.8}" fill="${ink}"/>
        <ellipse cx="${cx + r * 0.9}" cy="${cy - r * 1.8}" rx="${r * 0.6}" ry="${r * 0.8}" fill="${ink}"/>
        <ellipse cx="${cx - r * 0.8}" cy="${cy + r * 1.7}" rx="${r * 0.55}" ry="${r * 0.7}" fill="${ink}"/>
        <ellipse cx="${cx + r * 0.8}" cy="${cy + r * 1.7}" rx="${r * 0.55}" ry="${r * 0.7}" fill="${ink}"/>
        <ellipse cx="${cx}" cy="${cy - r * 0.1}" rx="${r * 0.45}" ry="${r * 0.6}" fill="${red}"/>
        <ellipse cx="${cx - r * 2.6}" cy="${cy + r * 0.3}" rx="${r * 0.42}" ry="${r * 0.28}" fill="${red}"/>
        <ellipse cx="${cx + r * 2.6}" cy="${cy + r * 0.3}" rx="${r * 0.42}" ry="${r * 0.28}" fill="${red}"/>
      `;
    } else if (cardId === 4) {
      const s = 0.9 + rng(1) * 0.2;
      const darkInk = '#080808';
      body = `
        <ellipse cx="${cx}" cy="${cy + 10}" rx="${75 * s}" ry="${28 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx - 90 * s}" cy="${cy + 5}" rx="${32 * s}" ry="${22 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx + 90 * s}" cy="${cy + 5}" rx="${32 * s}" ry="${22 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx - 90 * s}" cy="${cy + 28}" rx="${18 * s}" ry="${12 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx + 90 * s}" cy="${cy + 28}" rx="${18 * s}" ry="${12 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx}" cy="${cy - 22}" rx="${20 * s}" ry="${16 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx - 28 * s}" cy="${cy - 35}" rx="${12 * s}" ry="${9 * s}" fill="${darkInk}"/>
        <ellipse cx="${cx + 28 * s}" cy="${cy - 35}" rx="${12 * s}" ry="${9 * s}" fill="${darkInk}"/>
        <line x1="${cx - 75 * s}" y1="${cy + 35}" x2="${cx - 80 * s}" y2="${cy + 60}" stroke="${darkInk}" stroke-width="${10 * s}" stroke-linecap="round"/>
        <line x1="${cx + 75 * s}" y1="${cy + 35}" x2="${cx + 80 * s}" y2="${cy + 60}" stroke="${darkInk}" stroke-width="${10 * s}" stroke-linecap="round"/>
      `;
    } else {
      const s = 0.9 + rng(1) * 0.2;
      const tealColor = '#2d4a43';
      const irisColor = '#b8a8d4';
      body = `
        <rect x="${cx - 12}" y="${cy - 90}" width="24" height="140" rx="10" fill="${tealColor}"/>
        <ellipse cx="${cx}" cy="${cy - 90}" rx="18" ry="16" fill="${irisColor}"/>
        <ellipse cx="${cx - 42 * s}" cy="${cy - 55}" rx="${28 * s}" ry="${16 * s}" fill="${tealColor}" transform="rotate(-10,${cx - 42 * s},${cy - 55})"/>
        <ellipse cx="${cx + 42 * s}" cy="${cy - 55}" rx="${28 * s}" ry="${16 * s}" fill="${tealColor}" transform="rotate(10,${cx + 42 * s},${cy - 55})"/>
        <ellipse cx="${cx - 35 * s}" cy="${cy - 10}" rx="${22 * s}" ry="${13 * s}" fill="${irisColor}"/>
        <ellipse cx="${cx + 35 * s}" cy="${cy - 10}" rx="${22 * s}" ry="${13 * s}" fill="${irisColor}"/>
        <ellipse cx="${cx - 20 * s}" cy="${cy + 38}" rx="${14 * s}" ry="${10 * s}" fill="${tealColor}"/>
        <ellipse cx="${cx + 20 * s}" cy="${cy + 38}" rx="${14 * s}" ry="${10 * s}" fill="${tealColor}"/>
        <line x1="${cx - 8}" y1="${cy + 50}" x2="${cx - 18}" y2="${cy + 80}" stroke="${tealColor}" stroke-width="9" stroke-linecap="round"/>
        <line x1="${cx + 8}" y1="${cy + 50}" x2="${cx + 18}" y2="${cy + 80}" stroke="${tealColor}" stroke-width="9" stroke-linecap="round"/>
      `;
    }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="background:${bg}">${label(cardId)}${body}${prompt()}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }
}
