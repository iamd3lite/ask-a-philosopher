const W = 1080;
const H = 1080;

const TONES = {
  "Marcus Aurelius": "#7c8056",
  "Friedrich Nietzsche": "#8a4e3e",
  Socrates: "#6b6357",
  Epictetus: "#5a6469",
  "Albert Camus": "#9c7a4f",
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load("600 64px 'Cormorant Garamond'"),
      document.fonts.load("italic 26px 'EB Garamond'"),
      document.fonts.load("italic 36px 'EB Garamond'"),
      document.fonts.load("500 18px 'Inter'"),
    ]);
  } catch {
    // best effort
  }
}

function wrapText(ctx, text, maxWidth) {
  const paragraphs = text.split(/\n+/);
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawLaurel(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(111, 117, 72, 0.55)";
  ctx.fillStyle = "rgba(111, 117, 72, 0.55)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.quadraticCurveTo(-50, -16, -8, 0);
  ctx.quadraticCurveTo(-50, 16, -90, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.quadraticCurveTo(50, -16, 8, 0);
  ctx.quadraticCurveTo(50, 16, 90, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPortrait(ctx, img, name, cx, cy, r) {
  ctx.save();
  // soft outer ring shadow
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(60, 45, 25, 0.10)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // background tint behind portrait
  const tone = TONES[name] ?? "#7a6b58";
  ctx.fillStyle = tone;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  if (img) {
    const ar = img.width / img.height;
    let dw, dh;
    if (ar > 1) {
      dh = r * 2;
      dw = dh * ar;
    } else {
      dw = r * 2;
      dh = dw / ar;
    }
    const dx = cx - dw / 2;
    const dy = cy - dh / 2;
    try {
      ctx.filter = "sepia(0.12) saturate(0.92)";
    } catch {}
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";
  } else {
    // fallback: initial letter
    const initial = (name.split(/\s+/).pop() ?? name)[0];
    ctx.fillStyle = "#faf4e0";
    ctx.font = `600 ${Math.round(r * 0.95)}px 'Cormorant Garamond', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, cx, cy + 4);
  }

  ctx.restore();

  // subtle warm ring on top
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(197, 184, 150, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export async function renderShareCard({ philosopher, era, avatar, text }) {
  await ensureFonts();
  const img = await loadImage(avatar);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Parchment background
  ctx.fillStyle = "#f3ecd9";
  ctx.fillRect(0, 0, W, H);

  // Soft top + bottom radial washes
  const topGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 700);
  topGrad.addColorStop(0, "rgba(255, 250, 230, 0.65)");
  topGrad.addColorStop(1, "rgba(255, 250, 230, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H);

  const botGrad = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 700);
  botGrad.addColorStop(0, "rgba(200, 180, 140, 0.18)");
  botGrad.addColorStop(1, "rgba(200, 180, 140, 0)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, 0, W, H);

  // Laurel at top
  drawLaurel(ctx, W / 2, 100);

  // Portrait
  const portraitR = 120;
  const portraitCY = 280;
  drawPortrait(ctx, img, philosopher, W / 2, portraitCY, portraitR);

  // Name
  ctx.fillStyle = "#2c2620";
  ctx.font = "600 56px 'Cormorant Garamond', 'EB Garamond', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(philosopher, W / 2, portraitCY + portraitR + 70);

  // Era
  ctx.fillStyle = "#8b7e6c";
  ctx.font = "italic 22px 'EB Garamond', Georgia, serif";
  ctx.fillText(era, W / 2, portraitCY + portraitR + 105);

  // Divider
  const divY = portraitCY + portraitR + 140;
  ctx.strokeStyle = "rgba(197, 184, 150, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 30, divY);
  ctx.lineTo(W / 2 + 30, divY);
  ctx.stroke();

  // Quote — wrap with progressive font-size shrink
  const quoteText = `“${text}”`;
  const maxQuoteWidth = 860;
  const quoteTop = divY + 50;
  const quoteBottom = H - 100;
  const quoteAvailable = quoteBottom - quoteTop;
  let size = 38;
  let lines = [];
  let lineH;
  while (size >= 22) {
    ctx.font = `italic ${size}px 'EB Garamond', Georgia, serif`;
    lines = wrapText(ctx, quoteText, maxQuoteWidth);
    lineH = Math.round(size * 1.35);
    if (lines.length * lineH <= quoteAvailable) break;
    size -= 2;
  }
  ctx.fillStyle = "#2c2620";
  ctx.font = `italic ${size}px 'EB Garamond', Georgia, serif`;
  const blockH = lines.length * lineH;
  let y = quoteTop + (quoteAvailable - blockH) / 2 + lineH * 0.8;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += lineH;
  }

  // Attribution
  ctx.fillStyle = "#8b7e6c";
  ctx.font = "500 18px 'Inter', sans-serif";
  ctx.textAlign = "center";
  const attrib = "A S K   A   P H I L O S O P H E R";
  ctx.fillText(attrib, W / 2, H - 50);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png", 0.95);
  });
}

export async function copyCanvasToClipboard(canvas) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard images are not supported in this browser.");
  }
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error("Could not encode image.");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export async function downloadCanvas(canvas, filename) {
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error("Could not encode image.");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
