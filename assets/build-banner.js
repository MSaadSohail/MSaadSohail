// Builds assets/banner.svg: the profile header in a Matrix style, in the profile's blue and purple. Code rain falls
// behind the name, each letter scrambles through random glyphs before it lands,
// the name glitches now and then, and the title types out under it.
// Run `node assets/build-banner.js`. Rain and glyphs come from a seeded PRNG, so
// rebuilding gives the same file.
const fs = require("fs");
const path = require("path");

const NAME = "SAAD SOHAIL";
const TITLE = "> Software Engineer";
const W = 860, H = 220, CX = W / 2;

let seed = 1337;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:=*+<>¦";
const XML_ESC = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
const glyph = () => {
  const g = GLYPHS[Math.floor(rand() * GLYPHS.length)];
  return XML_ESC[g] || g;
};

// Code rain: columns of glyphs, brightest at the falling head, each column on its own speed.
const COL_W = 16, ROWS = 16, ROW_H = 15, FALL = ROWS * ROW_H;
const RAIN_COLORS = ["#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#c084fc"];
const rain = [];
for (let c = 0; c * COL_W < W; c++) {
  const x = c * COL_W + 8;
  const dur = (3.2 + rand() * 4.5).toFixed(2);
  const delay = (-rand() * Number(dur)).toFixed(2);
  const color = RAIN_COLORS[Math.floor(rand() * RAIN_COLORS.length)];
  const spans = [];
  for (let r = 0; r < ROWS; r++) {
    const head = r === ROWS - 1;
    const op = head ? 1 : (0.08 + 0.75 * (r / (ROWS - 1)) ** 1.6).toFixed(2);
    spans.push(`<tspan x="${x}" y="${r * ROW_H}"${head ? ' class="head"' : ""} fill-opacity="${op}">${glyph()}</tspan>`);
  }
  rain.push(`<text class="rain" fill="${color}" style="animation-duration:${dur}s; animation-delay:${delay}s">${spans.join("")}</text>`);
}

// Name: each letter cycles random glyphs, then holds its real character.
const FONT = 54, ADV = 40, NAME_Y = 122, FRAMES = 10, FRAME_MS = 65;
const startX = CX - ((NAME.length - 1) * ADV) / 2;
const letters = [], finals = [];
[...NAME].forEach((ch, i) => {
  if (ch === " ") return;
  const x = startX + i * ADV, start = 300 + i * 110;
  for (let f = 0; f < FRAMES; f++) {
    letters.push(`<text class="nm frame" x="${x}" y="${NAME_Y}" style="animation: show ${FRAME_MS}ms linear ${start + f * FRAME_MS}ms 1">${glyph()}</text>`);
  }
  finals.push(`<text x="${x}" y="${NAME_Y}">${ch}</text>`);
  letters.push(`<text class="nm final" x="${x}" y="${NAME_Y}" style="animation: hold 1ms linear ${start + FRAMES * FRAME_MS}ms 1 backwards">${ch}</text>`);
});
const nameDone = 300 + (NAME.length - 1) * 110 + FRAMES * FRAME_MS;

// Title: typed out after the name lands, with a blinking cursor at the end.
const T_FONT = 17, T_ADV = T_FONT * 0.6, T_Y = 162;
const tWidth = TITLE.length * T_ADV, tX = CX - tWidth / 2;
const typeAt = nameDone + 200, typeMs = TITLE.length * 55;

const css = `
  text { font-family: Consolas, 'Courier New', 'MS Gothic', monospace; text-anchor: middle; }
  .rain { font-size: 14px; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; }
  .head { fill: #eef2ff; }
  .nm { font-size: ${FONT}px; font-weight: 700; fill: url(#nameGrad); }
  .frame { opacity: 0; fill: #a5b4fc; }
  .ghost { font-size: ${FONT}px; font-weight: 700; opacity: 0; animation: glitch 6.5s steps(1) ${nameDone + 1500}ms infinite; }
  .title { font-size: ${T_FONT}px; font-weight: 700; fill: #7dd3fc; text-anchor: start; letter-spacing: 0; }
  .type { transform-box: fill-box; transform-origin: left; animation: type ${typeMs}ms steps(${TITLE.length}) ${typeAt}ms backwards; }
  .caret { animation: hold 1ms linear var(--at) 1 backwards, blink 1s steps(1) var(--at) infinite; }
  .scan { animation: scan 7s linear infinite; }
  @keyframes fall { from { transform: translateY(-${FALL}px); } to { transform: translateY(${H + 10}px); } }
  @keyframes show { 0%, 100% { opacity: 1; } }
  @keyframes hold { 0%, 100% { opacity: 0; } }
  @keyframes type { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes scan { from { transform: translateY(-40px); } to { transform: translateY(${H + 40}px); } }
  @keyframes glitch {
    0%, 88%, 100% { opacity: 0; transform: none; }
    89% { opacity: .85; transform: translate(-5px, 1px); }
    91% { opacity: .85; transform: translate(4px, -2px); }
    93% { opacity: .6; transform: translate(-2px, 0); }
    95% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) { .rain, .frame, .final, .ghost, .type, .caret, .scan { animation: none !important; } .frame, .ghost { opacity: 0; } }
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Saad Sohail, Software Engineer">
  <title>Saad Sohail</title>
  <style>${css}</style>
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <radialGradient id="focus" cx=".5" cy=".55" r=".55">
      <stop offset="0" stop-color="#020617" stop-opacity=".92"/>
      <stop offset=".55" stop-color="#020617" stop-opacity=".55"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="nameGrad" gradientUnits="userSpaceOnUse" x1="${startX - 24}" y1="0" x2="${startX + (NAME.length - 1) * ADV + 24}" y2="0">
      <stop offset="0" stop-color="#bae6fd"/><stop offset=".5" stop-color="#c7d2fe"/><stop offset="1" stop-color="#e9d5ff"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#818cf8" stop-opacity="0"/><stop offset=".5" stop-color="#818cf8" stop-opacity=".09"/><stop offset="1" stop-color="#818cf8" stop-opacity="0"/>
    </linearGradient>
    <pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fill-opacity=".35"/></pattern>
    <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="typed"><rect class="type" x="${tX}" y="${T_Y - T_FONT}" width="${tWidth}" height="${T_FONT + 6}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="#050920"/>
    <g>${rain.join("\n    ")}</g>
    <rect width="${W}" height="${H}" fill="url(#focus)"/>
    <rect class="scan" x="0" y="0" width="${W}" height="40" fill="url(#beam)"/>
    <g filter="url(#glow)">
      ${letters.join("\n      ")}
    </g>
    <g class="ghost" fill="#38bdf8">${finals.join("")}</g>
    <g class="ghost" fill="#a78bfa" style="animation-delay:${nameDone + 1560}ms">${finals.join("")}</g>
    <text class="title" x="${tX}" y="${T_Y}" clip-path="url(#typed)">${TITLE.replace(">", "&gt;")}</text>
    <rect class="caret" x="${tX + tWidth + 3}" y="${T_Y - T_FONT + 3}" width="9" height="${T_FONT}" fill="#a78bfa" style="--at:${typeAt + typeMs}ms"/>
    <rect width="${W}" height="${H}" fill="url(#lines)"/>
    <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="15.5" fill="none" stroke="url(#edge)" stroke-opacity=".5" stroke-width="1.5"/>
  </g>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "banner.svg"), svg);
console.log(`wrote banner.svg (${(svg.length / 1024).toFixed(1)} KB)`);
