// Builds assets/streak.svg: total contributions, most contributions in a day and longest streak,
// from the GitHub contribution calendar. Run `node assets/build-streak.js`; it uses
// GITHUB_TOKEN when set (the daily workflow), otherwise `gh auth token`.
// Days are UTC calendar days, as the GitHub API returns them.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { baseCss, defs, countUp, cardFrame, COUNT_MS } = require("./card-theme");

const LOGIN = process.env.GH_LOGIN || "MSaadSohail";
const TOKEN = process.env.GITHUB_TOKEN || execSync("gh auth token").toString().trim();

async function graphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`GitHub API: ${JSON.stringify(body.errors || body)}`);
  return body.data;
}

async function fetchDays() {
  const { user } = await graphql(`query($login:String!){ user(login:$login){ createdAt } }`, { login: LOGIN });
  const created = new Date(user.createdAt);
  const now = new Date();
  const days = [];
  for (let y = created.getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
    const from = new Date(Math.max(created, Date.UTC(y, 0, 1)));
    const to = new Date(Math.min(now, Date.UTC(y, 11, 31, 23, 59, 59)));
    const data = await graphql(
      `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`,
      { login: LOGIN, from: from.toISOString(), to: to.toISOString() }
    );
    for (const w of data.user.contributionsCollection.contributionCalendar.weeks) days.push(...w.contributionDays);
  }
  const first = created.toISOString().slice(0, 10), today = now.toISOString().slice(0, 10);
  const byDate = new Map(days.filter((d) => d.date >= first && d.date <= today).map((d) => [d.date, d.contributionCount]));
  return { created, days: [...byDate].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count })) };
}

function streaks(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let longest = { len: 0 }, run = { len: 0 };
  for (const d of days) {
    run = d.count > 0 ? { len: run.len + 1, start: run.len ? run.start : d.date, end: d.date } : { len: 0 };
    if (run.len > longest.len) longest = run;
  }
  const bestDay = days.reduce((best, d) => (d.count > best.count ? d : best), { count: 0 });
  return { total, longest, bestDay };
}

const thisYear = new Date().getUTCFullYear();
function fmtDate(iso, withYear) {
  const d = new Date(`${iso}T00:00:00Z`);
  const opts = { month: "short", day: "numeric", timeZone: "UTC" };
  if (withYear || d.getUTCFullYear() !== thisYear) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts);
}
const range = (r) => (r.len ? (r.start === r.end ? fmtDate(r.start) : `${fmtDate(r.start)} - ${fmtDate(r.end)}`) : "No streak yet");

function render({ created, total, bestDay, longest }) {
  const W = 860, H = 220, PAD = 5, CW = W - 2 * PAD, CH = H - 2 * PAD;
  const cols = [CW / 6, CW / 2, (5 * CW) / 6];
  const R = 50, C = 2 * Math.PI * R, ringY = 92;

  const css = `${baseCss}
  .sub { font-size: 13px; font-weight: 600; }
  .center { text-anchor: middle; }
  .draw { stroke-dasharray: ${C.toFixed(1)}; stroke-dashoffset: ${C.toFixed(1)}; animation: draw ${COUNT_MS + 400}ms cubic-bezier(.2,.8,.2,1) 650ms forwards; }
  .divider { transform-box: fill-box; transform-origin: center; transform: scaleY(0); animation: stretch 900ms cubic-bezier(.2,.8,.2,1) 400ms forwards; }
  .flame { transform-box: fill-box; transform-origin: 50% 90%; animation: flicker 1.6s ease-in-out infinite; }
  .glow { animation: glow 2.4s ease-in-out infinite; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes stretch { to { transform: scaleY(1); } }
  @keyframes flicker { 0%, 100% { transform: scale(1, 1); } 30% { transform: scale(.94, 1.08); } 60% { transform: scale(1.04, .95); } }
  @keyframes glow { 0%, 100% { opacity: .25; } 50% { opacity: .6; } }
  @media (prefers-reduced-motion: reduce) { .draw { animation: none; stroke-dashoffset: 0; } .divider, .flame, .glow { animation: none; transform: none; } }`;

  const side = (x, value, label, note, color, icon, delay) => `
      <g class="card" style="animation-delay:${delay}ms">
        <g transform="translate(${x} 46)">
          <circle class="pulse" r="21" fill="${color}" opacity=".35"/>
          <circle r="18" fill="#0b1222" stroke="${color}" stroke-width="1.5"/>
          <g fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
        </g>
        ${countUp(value, "", `x="${x}" y="118"`, delay + 300, "num center")}
        <text class="label center" x="${x}" y="168">${label}</text>
        <text class="sub center" x="${x}" y="192" fill="${color}">${note}</text>
      </g>`;

  const calendar = `<rect x="-9" y="-8" width="18" height="17" rx="3"/><path d="M-9-2h18M-4-11v5M4-11v5"/>`;
  const trophy = `<path d="M-6-9h12v6a6 6 0 0 1-12 0z"/><path d="M-6-6h-4a4 4 0 0 0 4 5M6-6h4a4 4 0 0 1-4 5M0 3v4M-5 10h10"/>`;
  const cx = cols[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} total contributions, ${bestDay.count} contributions in a single day, longest streak ${longest.len} days">
  <title>Contribution stats</title>
  <style>${css}</style>
  <defs>${defs}
    <linearGradient id="fire" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbbf24"/><stop offset=".55" stop-color="#fb7185"/><stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="flameFill" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#f472b6"/><stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <g class="card" style="animation-delay:100ms">
    <g transform="translate(${PAD} ${PAD})">${cardFrame("streak", CW, CH, "#fb7185", 2600)}
      <line class="divider" x1="${CW / 3}" y1="34" x2="${CW / 3}" y2="176" stroke="#334155" stroke-width="1.2"/>
      <line class="divider" x1="${(2 * CW) / 3}" y1="34" x2="${(2 * CW) / 3}" y2="176" stroke="#334155" stroke-width="1.2"/>
      ${side(cols[0], total, "TOTAL CONTRIBUTIONS", `${fmtDate(created.toISOString().slice(0, 10), true)} - Present`, "#38bdf8", calendar, 250)}
      ${side(cols[2], longest.len, "LONGEST STREAK", range(longest), "#a78bfa", trophy, 550)}
      <g class="card" style="animation-delay:400ms">
        <circle class="glow" cx="${cx}" cy="${ringY}" r="${R}" fill="none" stroke="#fb7185" stroke-width="10" filter="url(#soft)"/>
        <circle cx="${cx}" cy="${ringY}" r="${R}" fill="#0b1222" stroke="#1e293b" stroke-width="7"/>
        <circle class="draw" cx="${cx}" cy="${ringY}" r="${R}" fill="none" stroke="url(#fire)" stroke-width="7" stroke-linecap="round" transform="rotate(-90 ${cx} ${ringY})"/>
        <circle cx="${cx}" cy="${ringY - R}" r="15" fill="#0f1830"/>
        <g transform="translate(${cx} ${ringY - R + 1})">
          <path class="flame" d="M0-12c5 6 9 9 9 15a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 1 5 3 5-1-5 0-9 2-12z" fill="url(#flameFill)"/>
        </g>
        ${countUp(bestDay.count, "", `x="${cx}" y="${ringY + 14}"`, 700, "num center")}
        <text class="label center" x="${cx}" y="168">MOST IN A DAY</text>
        <text class="sub center" x="${cx}" y="192" fill="#fb7185">${bestDay.date ? fmtDate(bestDay.date, true) : ""}</text>
      </g>
    </g>
  </g>
</svg>
`;
}

(async () => {
  const { created, days } = await fetchDays();
  const s = streaks(days);
  fs.writeFileSync(path.join(__dirname, "streak.svg"), render({ created, ...s }));
  console.log(`wrote streak.svg: total ${s.total}, best day ${s.bestDay.count} (${s.bestDay.date}), longest ${s.longest.len} (${range(s.longest)})`);
})().catch((e) => {
  console.error(`streak build failed: ${e.message}`);
  process.exit(1);
});
