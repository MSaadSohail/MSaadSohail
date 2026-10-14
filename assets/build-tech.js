// Builds assets/tech.svg: the "Tech stack" section as animated category cards.
// Edit GROUPS (logo id from assets/icons, label) and run `node assets/build-tech.js`.
const fs = require("fs");
const path = require("path");
const { baseCss, defs, cardFrame, iconDataUri } = require("./card-theme");

const GROUPS = [
  { title: "Languages", color: "#38bdf8", items: [["ts", "TypeScript"], ["js", "JavaScript"], ["cs", "C#"], ["kotlin", "Kotlin"], ["c", "C"], ["lua", "Lua"]] },
  { title: "Backend", color: "#34d399", items: [["nodejs", "Node.js"], ["express", "Express"], ["si-socketdotio", "Socket.IO"], ["dotnet", "ASP.NET"], ["prisma", "Prisma"], ["si-zod", "Zod"]] },
  { title: "Data", color: "#f472b6", items: [["postgres", "PostgreSQL"], ["redis", "Redis"], ["mongodb", "MongoDB"], ["mysql", "MySQL"]] },
  { title: "Cloud & DevOps", color: "#fbbf24", items: [["aws", "AWS"], ["docker", "Docker"], ["githubactions", "Actions"], ["azure", "Azure"], ["git", "Git"], ["linux", "Linux"]] },
  { title: "Frontend & Mobile", color: "#a78bfa", items: [["react", "React"], ["nextjs", "Next.js"], ["vite", "Vite"], ["tailwind", "Tailwind"], ["androidstudio", "Android"], ["si-jetpackcompose", "Compose"]] },
  { title: "Game & XR", color: "#22d3ee", items: [["unity", "Unity"], ["si-meta", "Meta Quest"], ["si-webgl", "WebGL"], ["si-telegram", "Telegram"], ["apple", "iOS"]] },
  { title: "Web3 & Payments", color: "#fb7185", items: [["si-ethereum", "Ethereum"], ["si-stripe", "Stripe"], ["si-paypal", "PayPal"]] },
  { title: "Testing & Observability", color: "#93c5fd", items: [["vitest", "Vitest"], ["si-k6", "k6"], ["postman", "Postman"], ["si-opentelemetry", "OTel"]] },
];

const W = 860, PAD = 5, COLS = 2, GAP_X = 16, GAP_Y = 16;
const CARD_W = (W - 2 * PAD - GAP_X) / COLS, CARD_H = 122;
const ROWS = Math.ceil(GROUPS.length / COLS);
const H = 2 * PAD + ROWS * CARD_H + (ROWS - 1) * GAP_Y;
const SLOT = (CARD_W - 40) / 6;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const css = `${baseCss}
  .gtitle { font-size: 12px; font-weight: 800; letter-spacing: 1.6px; }
  .count { font-size: 11px; font-weight: 600; fill: #64748b; text-anchor: end; }
  .name { font-size: 10.5px; font-weight: 600; fill: #94a3b8; text-anchor: middle; }
  .pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.3,1.6,.5,1) forwards; }
  .bob { animation: bob 5s ease-in-out infinite; }
  @keyframes pop { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @media (prefers-reduced-motion: reduce) { .pop, .bob { animation: none !important; opacity: 1; transform: none; } }`;

const cards = GROUPS.map((g, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = PAD + col * (CARD_W + GAP_X), y = PAD + row * (CARD_H + GAP_Y);
  const appear = 120 + i * 110;
  const logos = g.items.map(([icon, label], k) => {
    const cx = 20 + SLOT * k + SLOT / 2;
    return `<g class="pop" style="animation-delay:${appear + 350 + k * 90}ms"><g class="bob" style="animation-delay:${((i * 6 + k) * 370) % 5000}ms">
          <image href="${iconDataUri(icon)}" x="${(cx - 18).toFixed(1)}" y="46" width="36" height="36"/>
          <text class="name" x="${cx.toFixed(1)}" y="100">${esc(label)}</text>
        </g></g>`;
  });
  return `
  <g class="card" style="animation-delay:${appear}ms">
    <g transform="translate(${x} ${y})">${cardFrame(`t${i}`, CARD_W, CARD_H, g.color, 2400 + i * 380)}
      <rect x="20" y="18" width="4" height="16" rx="2" fill="${g.color}"/>
      <text class="gtitle" x="32" y="31" fill="${g.color}">${esc(g.title.toUpperCase())}</text>
      <text class="count" x="${CARD_W - 20}" y="31">${g.items.length} tools</text>
      ${logos.join("\n      ")}
    </g>
  </g>`;
});

const all = GROUPS.flatMap((g) => g.items.map(([, l]) => l));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`Tech stack: ${all.join(", ")}`)}">
  <title>Tech stack</title>
  <style>${css}</style>
  <defs>${defs}
  </defs>${cards.join("")}
</svg>
`;

fs.writeFileSync(path.join(__dirname, "tech.svg"), svg);
console.log(`wrote tech.svg (${GROUPS.length} groups, ${all.length} tools)`);
