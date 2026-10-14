// Builds assets/stats.svg: the animated "By the numbers" cards.
// Edit STATS and run `node assets/build-stats.js`.
const fs = require("fs");
const path = require("path");
const { fmt, baseCss, defs, countUp, cardFrame } = require("./card-theme");

const STATS = [
  { value: 6, suffix: "", label: "Organizations", color: "#38bdf8", icon: "org" },
  { value: 90, suffix: "+", label: "Repositories worked on", color: "#a78bfa", icon: "repo" },
  { value: 40, suffix: "+", label: "Projects", color: "#34d399", icon: "grid" },
  { value: 45, suffix: "+", label: "Technologies", color: "#fbbf24", icon: "stack" },
  { value: 1600, suffix: "+", label: "Commits", color: "#f472b6", icon: "commit" },
  { value: 460, suffix: "+", label: "Pull requests", color: "#22d3ee", icon: "pr" },
];

const W = 860, CARD_W = 270, CARD_H = 124, GAP = 25, COLS = 3, PAD = 5;
const H = PAD * 2 + 2 * CARD_H + GAP;

const ICONS = {
  org: `<circle cx="0" cy="-5" r="4"/><circle cx="-8" cy="-2" r="3"/><circle cx="8" cy="-2" r="3"/><path d="M-7 9a7 7 0 0 1 14 0M-14 9a5 5 0 0 1 6-5M14 9a5 5 0 0 0-6-5"/>`,
  repo: `<path d="M-8-10h13a3 3 0 0 1 3 3v17h-13a3 3 0 0 1-3-3z"/><path d="M-8 7a3 3 0 0 1 3-3h13M-3-4h7"/>`,
  grid: `<rect x="-10" y="-10" width="8" height="8" rx="2"/><rect x="2" y="-10" width="8" height="8" rx="2"/><rect x="-10" y="2" width="8" height="8" rx="2"/><rect x="2" y="2" width="8" height="8" rx="2"/>`,
  stack: `<path d="M0-10l11 5-11 5-11-5z"/><path d="M-11 1l11 5 11-5M-11 6l11 5 11-5"/>`,
  commit: `<circle cx="0" cy="0" r="5"/><path d="M-13 0h8M5 0h8"/>`,
  pr: `<circle cx="-7" cy="-8" r="3"/><circle cx="-7" cy="8" r="3"/><circle cx="7" cy="8" r="3"/><path d="M-7-5v10M7 5v-9a3 3 0 0 0-3-3h-4M2-10l-3 3 3 3"/>`,
};

const cards = STATS.map((s, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = PAD + col * (CARD_W + (W - 2 * PAD - COLS * CARD_W) / (COLS - 1));
  const y = PAD + row * (CARD_H + GAP);
  const appear = 150 + i * 140;
  const countStart = appear + 350;

  return `
  <g class="card" style="animation-delay:${appear}ms">
    <g transform="translate(${x} ${y})">${cardFrame(i, CARD_W, CARD_H, s.color, 2200 + i * 450)}
      <g transform="translate(40 46)">
        <circle class="pulse" r="24" fill="${s.color}" opacity=".35"/>
        <circle r="20" fill="#0b1222" stroke="${s.color}" stroke-width="1.5"/>
        <g fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.icon]}</g>
      </g>
      ${countUp(s.value, s.suffix, `x="74" y="64"`, countStart)}
      <text class="label" x="20" y="96">${s.label.toUpperCase()}</text>
      <rect x="20" y="106" width="${CARD_W - 40}" height="4" rx="2" fill="#1e293b"/>
      <rect class="bar" x="20" y="106" width="${CARD_W - 40}" height="4" rx="2" fill="${s.color}" style="animation-delay:${countStart}ms"/>
    </g>
  </g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${STATS.map((s) => `${fmt(s.value)}${s.suffix} ${s.label}`).join(", ")}">
  <title>By the numbers</title>
  <style>${baseCss}</style>
  <defs>${defs}
  </defs>${cards.join("")}
</svg>
`;

fs.writeFileSync(path.join(__dirname, "stats.svg"), svg);
console.log(`wrote stats.svg (${svg.length} bytes)`);
