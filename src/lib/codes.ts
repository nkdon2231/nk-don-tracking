import QRCode from "qrcode";

const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

export function barcodeLayout(value: string) {
  const text = `*${value.toUpperCase()}*`;
  const narrow = 2;
  const wide = 5;
  const height = 70;
  let x = 0;
  const rects: { x: number; y: number; width: number; height: number }[] = [];
  for (const char of text) {
    const pattern = CODE39[char];
    if (!pattern) continue;
    pattern.split("").forEach((bar, index) => {
      const width = bar === "w" ? wide : narrow;
      if (index % 2 === 0) rects.push({ x, y: 0, width, height });
      x += width;
    });
    x += narrow;
  }
  return { width: x, height, rects };
}

export function barcodeSvg(value: string) {
  const layout = barcodeLayout(value);
  const rects = layout.rects.map((bar) => `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" />`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="Barcode ${value}">${rects.join("")}</svg>`;
}

export async function qrSvg(value: string) {
  return QRCode.toString(value, {
    type: "svg",
    margin: 0,
    width: 168,
    color: { dark: "#1b1914", light: "#00000000" },
  });
}
