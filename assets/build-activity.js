// Builds assets/activity.svg: the last year of contributions as an animated heatmap,
// from the GitHub contribution calendar (the same data as the profile graph,
// private contributions included when the profile shows them).
// Run `node assets/build-activity.js`.
const fs = require("fs");
const path = require("path");
const { fmt, baseCss, defs, countUp, cardFrame } = require("./card-theme");
const { LOGIN, graphql } = require("./github-api");

const LEVELS = { NONE: "#1a2336", FIRST_QUARTILE: "#0c4a6e", SECOND_QUARTILE: "#0369a1", THIRD_QUARTILE: "#0ea5e9", FOURTH_QUARTILE: "#7dd3fc" };
const W = 860, PAD = 5, CW = W - 2 * PAD;
const CELL = 11.5, STEP = 14.5, GRID_X = 54, GRID_Y = 110;

async function fetchCalendar() {
  const data = await graphql(
    `query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date weekday contributionCount contributionLevel } } } } } }`,
    { login: LOGIN }
  );
  return data.user.contributionsCollection.contributionCalendar;
}

const esc = (s) => s.replace(/&/g, "&amp;");
const monthOf = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function render({ totalContributions: total, weeks }) {
  const days = weeks.flatMap((w) => w.contributionDays);
  const best = days.reduce((b, d) => (d.contributionCount > b.contributionCount ? d : b), days[0]);
  const activeDays = days.filter((d) => d.contributionCount > 0).length;
  const gridH = 7 * STEP - (STEP - CELL);
  const CH = GRID_Y + gridH + 42, H = CH + 2 * PAD;

  const cells = [], months = [];
  let lastMonth = "", lastLabelWeek = -9;
  weeks.forEach((w, wi) => {
    const m = monthOf(w.contributionDays[0].date);
    if (m !== lastMonth && wi - lastLabelWeek > 2) { months.push(`<text class="axis" x="${GRID_X + wi * STEP}" y="${GRID_Y - 10}">${m}</text>`); lastLabelWeek = wi; }
    lastMonth = m;
    for (const d of w.contributionDays) {
      const x = GRID_X + wi * STEP, y = GRID_Y + d.weekday * STEP;
      const isBest = d.date === best.date && d.contributionCount > 0;
      cells.push(`<rect class="cell" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${LEVELS[d.contributionLevel]}" style="animation-delay:${600 + wi * 22 + d.weekday * 10}ms"/>`);
      if (isBest) cells.push(`<rect class="best" x="${x - 2.5}" y="${y - 2.5}" width="${CELL + 5}" height="${CELL + 5}" rx="4" fill="none" stroke="#7dd3fc" stroke-width="1.5"/>`);
    }
  });

  // Legend sits under the grid, right-aligned: "Less [5 swatches] More".
  const legendY = GRID_Y + gridH + 14, legendX = CW - 20 - 30 - 5 * STEP - 28;
  const legend = Object.values(LEVELS).map((c, i) => `<rect x="${legendX + 28 + i * STEP}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c}"/>`).join("");

  const css = `${baseCss}
  .hnum { font-size: 30px; }
  .axis { font-size: 10.5px; font-weight: 600; fill: #64748b; }
  .meta { font-size: 12px; font-weight: 600; fill: #94a3b8; }
  .cell { opacity: 0; transform-box: fill-box; transform-origin: center; animation: cellin .35s cubic-bezier(.3,1.5,.5,1) forwards; }
  .best { opacity: 0; transform-box: fill-box; transform-origin: center; animation: bestin .4s ease-out 2200ms forwards, ring 2s ease-in-out 2600ms infinite; }
  @keyframes cellin { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: scale(1); } }
  @keyframes bestin { to { opacity: 1; } }
  @keyframes ring { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: .3; } }
  @media (prefers-reduced-motion: reduce) { .cell, .best { animation: none !important; opacity: 1; transform: none; } }`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${fmt(total)} contributions in the last year, ${activeDays} active days, most in a day ${best.contributionCount} on ${longDate(best.date)}">
  <title>Contributions in the last year</title>
  <style>${css}</style>
  <defs>${defs}
  </defs>
  <g class="card" style="animation-delay:100ms">
    <g transform="translate(${PAD} ${PAD})">${cardFrame("activity", CW, CH, "#0ea5e9", 3200)}
      ${countUp(total, "", `x="20" y="48"`, 300, "num hnum")}
      <text class="label" x="20" y="70">CONTRIBUTIONS IN THE LAST YEAR</text>
      <text class="meta" x="${CW - 20}" y="36" text-anchor="end">Best day: <tspan fill="#7dd3fc">${best.contributionCount}</tspan> on ${esc(longDate(best.date))}</text>
      <text class="meta" x="${CW - 20}" y="58" text-anchor="end">Active days: <tspan fill="#7dd3fc">${activeDays}</tspan> of ${days.length}</text>
      <text class="axis" x="${legendX}" y="${legendY + 9.5}">Less</text>${legend}
      <text class="axis" x="${legendX + 28 + 5 * STEP + 2}" y="${legendY + 9.5}">More</text>
      <text class="axis" x="${GRID_X}" y="${legendY + 9.5}">Highlighted square: best day</text>
      ${months.join("\n      ")}
      <text class="axis" x="20" y="${GRID_Y + 1 * STEP + 9}">Mon</text>
      <text class="axis" x="20" y="${GRID_Y + 3 * STEP + 9}">Wed</text>
      <text class="axis" x="20" y="${GRID_Y + 5 * STEP + 9}">Fri</text>
      ${cells.join("\n      ")}
    </g>
  </g>
</svg>
`;
}

(async () => {
  const cal = await fetchCalendar();
  fs.writeFileSync(path.join(__dirname, "activity.svg"), render(cal));
  console.log(`wrote activity.svg: ${cal.totalContributions} contributions over ${cal.weeks.length} weeks`);
})().catch((e) => {
  console.error(`activity build failed: ${e.message}`);
  process.exit(1);
});
