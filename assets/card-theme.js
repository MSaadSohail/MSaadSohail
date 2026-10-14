// Shared look for the animated profile cards (stats.svg, streak.svg).
// GitHub shows SVG through <img>, so animation is CSS and SMIL only (no script),
// and every frame-based effect falls back to the final value without animation.

const fs = require("fs");
const path = require("path");

const fmt = (n) => n.toLocaleString("en-US");
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

const FRAMES = 14;
const COUNT_MS = 1400;

const baseCss = `
  text { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; }
  .num { font-size: 40px; font-weight: 800; fill: #f8fafc; letter-spacing: -0.5px; }
  .label { font-size: 14px; font-weight: 600; fill: #94a3b8; letter-spacing: 0.4px; }
  .card { opacity: 0; animation: rise .7s cubic-bezier(.2,.8,.2,1) forwards; }
  .frame { opacity: 0; }
  .bar { transform-box: fill-box; transform-origin: left; transform: scaleX(0); animation: grow 1.4s cubic-bezier(.2,.8,.2,1) forwards; }
  .shine { animation: sweep 7s ease-in-out infinite; }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-in-out infinite; }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes show { 0%, 100% { opacity: 1; } }
  @keyframes hold { 0%, 100% { opacity: 0; } }
  @keyframes grow { to { transform: scaleX(1); } }
  @keyframes sweep { 0%, 70% { transform: translateX(-160px); } 100% { transform: translateX(var(--sweep-to, 460px)); } }
  @keyframes pulse { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: .8; transform: scale(1.12); } }
  @media (prefers-reduced-motion: reduce) { .card, .bar, .shine, .pulse, .frame, .final { animation: none !important; opacity: 1; transform: none; } .frame { opacity: 0 !important; } }
`;

const defs = `
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111c33"/><stop offset="1" stop-color="#0a0f1e"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38bdf8" stop-opacity=".9"/>
      <stop offset=".5" stop-color="#1e293b" stop-opacity=".6"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity=".9"/>
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="8s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>`;

// Count-up: intermediate frames each show for one step; the final value is
// hidden until the count ends, and is the only thing visible without animation.
function countUp(value, suffix, attrs, startMs, cls = "num") {
  const step = COUNT_MS / FRAMES;
  const frames = [];
  if (value > 0) {
    for (let f = 0; f < FRAMES; f++) {
      const v = Math.round(value * easeOut(f / FRAMES));
      frames.push(
        `<text class="${cls} frame" ${attrs} style="animation: show ${step.toFixed(0)}ms linear ${(startMs + f * step).toFixed(0)}ms 1">${fmt(v)}${suffix}</text>`
      );
    }
  }
  const finalAt = value > 0 ? startMs + COUNT_MS : startMs;
  frames.push(
    `<text class="${cls} final" ${attrs} style="animation: hold 1ms linear ${finalAt.toFixed(0)}ms 1 backwards">${fmt(value)}${suffix}</text>`
  );
  return frames.join("\n      ");
}

// Rounded card background, corner glow, light sweep and rotating border.
function cardFrame(id, w, h, color, shineDelayMs) {
  return `
      <clipPath id="clip${id}"><rect width="${w}" height="${h}" rx="16"/></clipPath>
      <rect width="${w}" height="${h}" rx="16" fill="url(#bg)"/>
      <g clip-path="url(#clip${id})">
        <circle cx="${w - 20}" cy="-10" r="70" fill="${color}" opacity=".10"/>
        <g class="shine" style="--sweep-to:${w + 190}px; animation-delay:${shineDelayMs}ms"><rect x="0" y="-20" width="70" height="${h + 40}" fill="url(#shine)" transform="skewX(-20)"/></g>
      </g>
      <rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="15.5" fill="none" stroke="url(#ring)" stroke-width="1.5"/>`;
}

// Logos live in assets/icons: skillicons tiles as-is, and simple-icons paths
// (si-*) drawn on a matching dark tile in a color that reads on dark.
const SI_COLORS = {
  socketdotio: "#ffffff", stripe: "#8b84ff", paypal: "#3ba7ff", opentelemetry: "#f5a800", zod: "#7aa2ff",
  jetpackcompose: "#6aa2ff", telegram: "#26a5e4", webgl: "#e05252", ethereum: "#a5a5ff", meta: "#3b9bff", k6: "#9a87ff",
};
const iconCache = {};
function iconDataUri(id) {
  if (!iconCache[id]) {
    let svg = fs.readFileSync(path.join(__dirname, "icons", `${id}.svg`), "utf8");
    if (id.startsWith("si-")) {
      const d = svg.match(/ d="([^"]+)"/)[1];
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="#242938"/><path transform="translate(56 56) scale(6)" fill="${SI_COLORS[id.slice(3)]}" d="${d}"/></svg>`;
    }
    iconCache[id] = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return iconCache[id];
}

module.exports = { fmt, baseCss, defs, countUp, cardFrame, iconDataUri, COUNT_MS };
