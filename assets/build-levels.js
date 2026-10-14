// Builds assets/level-N.svg: the "Featured work" steps. Each image is one level,
// alternating left and right of a shared center path, so stacking them in the
// README draws one zigzag timeline. Edit LEVELS and run `node assets/build-levels.js`.
const fs = require("fs");
const path = require("path");
const { baseCss, defs, cardFrame, iconDataUri } = require("./card-theme");

const LEVELS = [
  {
    name: "Hamieverse",
    years: "2025 - now",
    tagline: "Backend for a live multiplayer card game",
    color: "#38bdf8",
    quest: "Keep a live card game fair while players disconnect, retry and race each other.",
    build: "An event-driven mission rules engine run from a dashboard, plus server-owned PvP reconnects and turn timers.",
    boss: "No reward paid twice: hardening an idempotent grant, transaction, invoice and entitlement pipeline.",
    loot: [["nodejs", "Node.js"], ["postgres", "PostgreSQL"], ["redis", "Redis"], ["si-socketdotio", "Socket.IO"], ["aws", "AWS"]],
  },
  {
    name: "CryoNet",
    years: "2026",
    tagline: "Real-time multiplayer relay service",
    color: "#f472b6",
    quest: "Replace Photon Fusion without touching a single game RPC call.",
    build: "Rooms, a lobby and an RPC relay, where every room change is an atomic Redis Lua script.",
    boss: "Dropped connections: per-room sequence numbers replay every missed message on rejoin.",
    loot: [["ts", "TypeScript"], ["redis", "Redis"], ["lua", "Lua"], ["si-socketdotio", "Socket.IO"], ["unity", "Unity SDK"]],
  },
  {
    name: "TifoXR",
    years: "2025",
    tagline: "Commerce API for an XR platform",
    color: "#a78bfa",
    quest: "Let an XR platform take real payments, safely.",
    build: "A layered ASP.NET Core API with order and payment services over Stripe and PayPal.",
    boss: "Seeing every request end to end: OpenTelemetry, Serilog and Application Insights.",
    loot: [["dotnet", "ASP.NET Core"], ["mysql", "MySQL"], ["si-stripe", "Stripe"], ["si-paypal", "PayPal"], ["si-opentelemetry", "OpenTelemetry"]],
  },
  {
    name: "Crown of Khosrow",
    years: "2024 - 2025",
    tagline: "Historical real-time strategy for iOS and Android",
    color: "#fbbf24",
    quest: "Build an empire across a living world map, on a phone.",
    build: "One scene bootstrap that starts the grid, game state, timer and fog of war in every level.",
    boss: "Moving armies smoothly on mobile: grid pathfinding built on Unity ECS, map areas loaded on demand.",
    loot: [["unity", "Unity"], ["cs", "C#"], ["androidstudio", "Android"], ["apple", "iOS"]],
  },
];

const ROWS = [
  { key: "quest", label: "QUEST", color: "#fbbf24" },
  { key: "build", label: "BUILD", color: "#38bdf8" },
  { key: "boss", label: "BOSS FIGHT", color: "#fb7185" },
];

const W = 860, SPINE = W / 2, NODE_Y = 64, CARD_W = 380, CARD_X = { left: 18, right: W - 18 - 380 };
const TEXT_W = CARD_W - 40, CHAR_W = 6.7, LINE_H = 19;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > maxChars) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines;
}

function logos(items, y, startMs) {
  const slot = Math.min(68, (CARD_W - 40) / items.length);
  const out = items.map(([icon, label], i) => {
    const cx = 20 + slot * i + slot / 2;
    return `<g class="pop" style="animation-delay:${startMs + i * 110}ms">
          <image href="${iconDataUri(icon)}" x="${cx - 18}" y="${y}" width="36" height="36"/>
          <text class="chip" x="${cx}" y="${y + 52}">${esc(label)}</text></g>`;
  });
  return { svg: out.join("\n        "), height: 58 };
}

function render(lv, i) {
  const side = i % 2 === 0 ? "left" : "right";
  const num = String(i + 1).padStart(2, "0");
  const cardX = CARD_X[side];
  const maxChars = Math.floor(TEXT_W / CHAR_W);

  // Card body: header, then the three story rows, then the tech chips.
  let y = 112;
  const rows = ROWS.map((r, k) => {
    const lines = wrap(lv[r.key], maxChars);
    const block = `<g class="fade" style="animation-delay:${900 + k * 160}ms">
        <rect x="20" y="${y - 11}" width="3" height="${12 + lines.length * LINE_H}" rx="1.5" fill="${r.color}"/>
        <text class="rowlabel" x="32" y="${y}" fill="${r.color}">${r.label}</text>
        ${lines.map((l, j) => `<text class="body" x="32" y="${y + 20 + j * LINE_H}">${esc(l)}</text>`).join("\n        ")}
      </g>`;
    y += 20 + lines.length * LINE_H + 14;
    return block;
  });
  const loot = logos(lv.loot, y + 4, 1500);
  const CARD_H = y + 4 + loot.height + 16;
  const H = CARD_H + 36;

  const towardCard = side === "left" ? -1 : 1;
  const connFrom = SPINE + towardCard * 24, connTo = side === "left" ? cardX + CARD_W : cardX;
  const ghostX = side === "left" ? W * 0.75 : W * 0.25;
  const first = i === 0, last = i === LEVELS.length - 1;
  const spineTop = first ? NODE_Y : 0, spineBottom = last ? NODE_Y : H;

  const css = `${baseCss}
  .title { font-size: 24px; font-weight: 800; fill: #f8fafc; }
  .tag { font-size: 13px; font-weight: 600; }
  .body { font-size: 13.5px; fill: #cbd5e1; }
  .rowlabel { font-size: 10.5px; font-weight: 800; letter-spacing: 1.4px; }
  .chip { font-size: 10.5px; font-weight: 600; fill: #94a3b8; text-anchor: middle; }
  .levelchip { font-size: 10.5px; font-weight: 800; letter-spacing: 1.4px; }
  .years { font-size: 12px; font-weight: 600; fill: #94a3b8; text-anchor: end; }
  .nodenum { font-size: 15px; font-weight: 800; fill: #f8fafc; text-anchor: middle; }
  .ghost { font-size: 130px; font-weight: 900; text-anchor: middle; }
  .ghostcap { font-size: 12px; font-weight: 800; letter-spacing: 3px; text-anchor: middle; }
  .slide { opacity: 0; animation: slide${side} .8s cubic-bezier(.2,.8,.2,1) 350ms forwards; }
  .fade { opacity: 0; animation: rise .6s cubic-bezier(.2,.8,.2,1) forwards; }
  .pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.3,1.6,.5,1) forwards; }
  .node { transform-box: fill-box; transform-origin: center; transform: scale(0); animation: nodepop .6s cubic-bezier(.3,1.6,.5,1) 150ms forwards; }
  .conn { transform-box: fill-box; transform-origin: ${side === "left" ? "right" : "left"}; transform: scaleX(0); animation: grow .5s ease-out 300ms forwards; }
  .flow { animation: flow 1.2s linear infinite; }
  .float { animation: float 6s ease-in-out infinite; }
  .ghostwrap { opacity: 0; animation: ghostin 1.4s ease-out 600ms forwards; }
  @keyframes slideleft { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
  @keyframes slideright { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
  @keyframes pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
  @keyframes nodepop { to { transform: scale(1); } }
  @keyframes flow { to { stroke-dashoffset: -12; } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes ghostin { to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .slide, .fade, .pop, .node, .conn, .flow, .float, .ghostwrap { animation: none !important; opacity: 1; transform: none; } }`;

  const alt = `Level ${num}, ${lv.name} (${lv.years}): ${lv.tagline}. Quest: ${lv.quest} Build: ${lv.build} Boss fight: ${lv.boss} Tech: ${lv.loot.map(([, l]) => l).join(", ")}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">
  <title>${esc(`Level ${num}: ${lv.name}`)}</title>
  <style>${css}</style>
  <defs>${defs}
    <linearGradient id="spineFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lv.color}" stop-opacity="${first ? 0 : 0.9}"/>
      <stop offset=".5" stop-color="${lv.color}" stop-opacity=".9"/>
      <stop offset="1" stop-color="${lv.color}" stop-opacity="${last ? 0 : 0.9}"/>
    </linearGradient>
  </defs>

  <!-- Path between levels -->
  <line x1="${SPINE}" y1="${spineTop}" x2="${SPINE}" y2="${spineBottom}" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
  <line class="flow" x1="${SPINE}" y1="${spineTop}" x2="${SPINE}" y2="${spineBottom}" stroke="url(#spineFade)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 11"/>

  <!-- Unlocked marker on the empty side -->
  <g class="ghostwrap"><g class="float">
    <text class="ghost" x="${ghostX}" y="${H / 2 + 40}" fill="none" stroke="${lv.color}" stroke-opacity=".22" stroke-width="2">${num}</text>
    <text class="ghostcap" x="${ghostX}" y="${H / 2 + 76}" fill="${lv.color}" fill-opacity=".55">LEVEL UNLOCKED</text>
  </g></g>

  <!-- Connector and node -->
  <line class="conn" x1="${Math.min(connFrom, connTo)}" y1="${NODE_Y}" x2="${Math.max(connFrom, connTo)}" y2="${NODE_Y}" stroke="${lv.color}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="4 5"/>
  <g class="node">
    <circle class="pulse" cx="${SPINE}" cy="${NODE_Y}" r="27" fill="${lv.color}" opacity=".35"/>
    <circle cx="${SPINE}" cy="${NODE_Y}" r="22" fill="#0b1222" stroke="${lv.color}" stroke-width="2.5"/>
    <text class="nodenum" x="${SPINE}" y="${NODE_Y + 5}">${num}</text>
  </g>

  <!-- Level card -->
  <g class="slide">
    <g transform="translate(${cardX} 18)">${cardFrame(`lv${i}`, CARD_W, CARD_H, lv.color, 2400 + i * 600)}
      <g transform="translate(20 22)">
        <rect width="74" height="20" rx="10" fill="${lv.color}" fill-opacity=".16"/>
        <text class="levelchip" x="37" y="14" text-anchor="middle" fill="${lv.color}">LEVEL ${num}</text>
      </g>
      <text class="years" x="${CARD_W - 20}" y="36">${esc(lv.years)}</text>
      <text class="title" x="20" y="72">${esc(lv.name)}</text>
      <text class="tag" x="20" y="92" fill="${lv.color}">${esc(lv.tagline)}</text>
      ${rows.join("\n      ")}
        ${loot.svg}
    </g>
  </g>
</svg>
`;
}

LEVELS.forEach((lv, i) => {
  const file = `level-${i + 1}.svg`;
  fs.writeFileSync(path.join(__dirname, file), render(lv, i));
  console.log(`wrote ${file}`);
});
