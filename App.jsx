import { useState, useEffect } from "react";

// ---- Brand ----
const GREEN = "#15643a";
const GREEN_DK = "#0e4427";
const YELLOW = "#F4C20D";
const CREAM = "#FBF8EF";
const CARD = "#ffffff";
const INK = "#1a1a1a";
const RED = "#b23a30";
const LINE = "#e6dfca";
const MUTE = "#6b6450";

// shared layout styles
const ROW = { display: "flex", alignItems: "center" };
const ROW_BETWEEN = { display: "flex", alignItems: "center", justifyContent: "space-between" };

// ---- Trash catalog (event / manual taps) ----
// bonus bucket: pts === 1 -> single ; pts > 1 -> multi
const TRASH = [
  { k: "woody", label: "Woody", pts: 1, multi: true },
  { k: "sandie", label: "Sandie", pts: 1, multi: true },
  { k: "skippie", label: "Skippie", pts: 3, multi: true },
  { k: "rockie", label: "Rockie", pts: 2, multi: true },
  { k: "willie", label: "Willie", pts: 2, multi: true },
  { k: "jerrie", label: "Jerrie", pts: 1, multi: true },
  { k: "seve", label: "Seve", pts: 1, multi: true },
  { k: "drinkie", label: "Drinkie", pts: 3, multi: true },
  { k: "rico", label: "Rico", pts: 1, multi: true },
  { k: "skandie", label: "Skandie", pts: 1, multi: true },
  { k: "greenie", label: "Greenie", pts: 1, multi: false },
  { k: "sgreenie", label: "Super Greenie", pts: 3, multi: false },
  { k: "stiffie", label: "Stiffie", pts: 3, multi: false },
  { k: "sstiffie", label: "Super Stiffie", pts: 5, multi: false },
  { k: "watson", label: "Watson", pts: 3, multi: false },
  { k: "swatson", label: "Super Watson", pts: 5, multi: false },
  { k: "otis", label: "Otis", pts: 1, multi: false },
  { k: "polie", label: "Polie", pts: 1, multi: false },
  { k: "daly", label: "Daly", pts: 2, multi: false },
  { k: "billie", label: "Billie", pts: 2, multi: false },
];

// City of Aspen default par 71 — CONFIRM against the card at the 1st tee
const DEFAULT_COURSE = [
  { par: 4, si: 7 }, { par: 4, si: 3 }, { par: 3, si: 17 }, { par: 5, si: 1 },
  { par: 4, si: 11 }, { par: 4, si: 5 }, { par: 3, si: 15 }, { par: 4, si: 9 },
  { par: 5, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 4 }, { par: 3, si: 18 },
  { par: 4, si: 2 }, { par: 5, si: 6 }, { par: 4, si: 12 }, { par: 3, si: 16 },
  { par: 4, si: 10 }, { par: 4, si: 14 },
];

const DEFAULT_PLAYERS = [
  { name: "Player 1", hcp: 0 },
  { name: "Player 2", hcp: 0 },
  { name: "Player 3", hcp: 0 },
  { name: "Player 4", hcp: 0 },
];

const STORE_KEY = "tm-round";
const sKey = (h, p) => `${h}-${p}`;
const emptyEntry = () => ({ gross: null, trash: {}, boonie: false });

function loadSaved() {
  try {
    const r = localStorage.getItem(STORE_KEY);
    if (r) return JSON.parse(r);
  } catch (e) { /* ignore */ }
  return null;
}

function strokesOn(hcp, si) {
  const h = Math.max(0, Math.floor(hcp || 0));
  return Math.floor(h / 18) + (si <= h % 18 ? 1 : 0);
}

function scoreAward(gross, par, strokes) {
  if (gross == null || gross <= 0) return null;
  if (gross === 1) return { label: "Arnie (Ace)", pts: 13, single: false };
  const g = gross - par;
  const n = gross - strokes - par;
  let best = null;
  const consider = (label, pts) => {
    if (!best || pts > best.pts) best = { label, pts, single: pts === 1 };
  };
  if (g === -1) consider("Gross Birdie", 2);
  if (g === -2) consider("Gross Eagle", 5);
  if (g === -3) consider("Gross Genie", 10);
  if (g <= -4) consider("Gross Super Genie", 15);
  if (n === -1) consider("Net Birdie", 1);
  if (n === -2) consider("Net Eagle", 3);
  if (n === -3) consider("Net Genie", 7);
  if (n <= -4) consider("Net Super Genie", 13);
  return best;
}

function bonusPoints(m, s) {
  if (m === 0) {
    if (s >= 5) return 5;
    if (s === 4) return 3;
    if (s === 3) return 2;
    if (s === 2) return 1;
    return 0;
  }
  if (m === 1) {
    if (s >= 3) return 4;
    if (s === 2) return 3;
    if (s === 1) return 2;
    return 0;
  }
  return s >= 1 ? 4 : 3; // m >= 2
}

function holeRaw(entry, par, strokes) {
  if (!entry || entry.gross == null || entry.gross <= 0) return { pts: 0, eligible: null };
  const eligible = entry.gross - strokes <= par; // net par or better
  if (!eligible) return { pts: 0, eligible: false };
  const items = [];
  const aw = scoreAward(entry.gross, par, strokes);
  if (aw && aw.pts > 0) items.push({ pts: aw.pts, single: aw.single });
  for (const t of TRASH) {
    const c = entry.trash[t.k] || 0;
    for (let i = 0; i < c; i++) items.push({ pts: t.pts, single: t.pts === 1 });
  }
  const base = items.reduce((a, b) => a + b.pts, 0);
  const m = items.filter((i) => !i.single).length;
  const s = items.filter((i) => i.single).length;
  return { pts: base + bonusPoints(m, s), eligible: true };
}

function playerHoleTotals(scores, course, pIdx, players) {
  const raw = [];
  for (let h = 1; h <= 18; h++) {
    const e = scores[sKey(h, pIdx)];
    const c = course[h - 1];
    const st = strokesOn(players[pIdx].hcp, c.si);
    raw[h] = holeRaw(e, c.par, st).pts;
  }
  const adj = raw.slice();
  for (let h = 1; h <= 18; h++) {
    const e = scores[sKey(h, pIdx)];
    if (e && e.boonie && h > 1) {
      adj[h - 1] = raw[h] >= 1 ? raw[h - 1] * 2 : 0;
    }
  }
  let total = 0;
  for (let h = 1; h <= 18; h++) total += adj[h] || 0;
  return { raw, adj, total };
}

function Stepper({ value, onDown, onUp, color }) {
  const btn = {
    width: 40, height: 40, borderRadius: 9, border: "none", color: "#fff",
    fontSize: 22, fontWeight: 800, lineHeight: "1", cursor: "pointer", background: color,
  };
  return (
    <div style={{ ...ROW, gap: 8 }}>
      <button style={btn} onClick={onDown}>−</button>
      <div style={{ minWidth: 34, textAlign: "center", fontSize: 22, fontWeight: 800, color: INK }}>
        {value == null ? "–" : value}
      </div>
      <button style={btn} onClick={onUp}>+</button>
    </div>
  );
}

export default function App() {
  const saved = loadSaved();
  const [players, setPlayers] = useState(() => saved?.players || DEFAULT_PLAYERS);
  const [course, setCourse] = useState(() => saved?.course || DEFAULT_COURSE);
  const [scores, setScores] = useState(() => saved?.scores || {});
  const [hole, setHole] = useState(() => saved?.hole || 1);
  const [view, setView] = useState("play");
  const [showRules, setShowRules] = useState(false);

  // autosave
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ players, course, scores, hole }));
    } catch (e) { /* ignore */ }
  }, [players, course, scores, hole]);

  const getEntry = (h, p) => scores[sKey(h, p)] || emptyEntry();

  const update = (h, p, fn) => {
    setScores((prev) => {
      const cur = prev[sKey(h, p)] || emptyEntry();
      return { ...prev, [sKey(h, p)]: fn({ ...cur, trash: { ...cur.trash } }) };
    });
  };

  const setGross = (h, p, dir) =>
    update(h, p, (e) => {
      const par = course[h - 1].par;
      if (e.gross == null) return { ...e, gross: par };
      return { ...e, gross: Math.max(1, e.gross + dir) };
    });

  const tapTrash = (h, p, t) =>
    update(h, p, (e) => {
      const c = e.trash[t.k] || 0;
      return { ...e, trash: { ...e.trash, [t.k]: t.multi ? c + 1 : 1 } };
    });

  const downTrash = (h, p, t) =>
    update(h, p, (e) => {
      const c = Math.max(0, (e.trash[t.k] || 0) - 1);
      const nt = { ...e.trash };
      if (c === 0) delete nt[t.k]; else nt[t.k] = c;
      return { ...e, trash: nt };
    });

  const toggleBoonie = (h, p) => update(h, p, (e) => ({ ...e, boonie: !e.boonie }));

  const totals = players.map((_, p) => playerHoleTotals(scores, course, p, players).total);
  const totalPar = course.reduce((a, c) => a + c.par, 0);

  const wrap = { maxWidth: 720, margin: "0 auto", background: CREAM, minHeight: "100vh", color: INK };

  return (
    <div style={wrap}>
      <div style={{ background: GREEN, color: "#fff", padding: "calc(14px + env(safe-area-inset-top)) 16px 14px" }}>
        <div style={ROW_BETWEEN}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: YELLOW, fontWeight: 800 }}>
              GOLF'S LITTLE BOOK OF TRASH
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>Trashmasters Scorekeeper</div>
            <div style={{ fontSize: 12, color: "#cfe6d6" }}>City of Aspen Golf Course · 4 players</div>
          </div>
          <div style={{ fontSize: 34 }}>🗑️</div>
        </div>
      </div>

      <div style={{ display: "flex", background: GREEN_DK, position: "sticky", top: 0, zIndex: 5 }}>
        {[["play", "Play"], ["board", "Leaderboard"], ["setup", "Setup"]].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: "13px 0", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14,
            background: view === k ? YELLOW : "transparent", color: view === k ? INK : "#bcd3c3",
          }}>{label}</button>
        ))}
      </div>

      {view === "play" && (
        <PlayView {...{ hole, setHole, players, course, getEntry, setGross, tapTrash, downTrash, toggleBoonie, totals }} />
      )}
      {view === "board" && <Board {...{ players, course, scores, totals, totalPar }} />}
      {view === "setup" && (
        <Setup {...{ players, setPlayers, course, setCourse, showRules, setShowRules, setScores }} />
      )}

      <div style={{ padding: "14px 16px", fontSize: 11, color: MUTE, textAlign: "center" }}>
        Trash counts only on a hole made at net par or better. Your round saves in this browser.
      </div>
    </div>
  );
}

// ---------------- Play ----------------
function PlayView({ hole, setHole, players, course, getEntry, setGross, tapTrash, downTrash, toggleBoonie, totals }) {
  const c = course[hole - 1];
  return (
    <div style={{ padding: 12 }}>
      <div style={{ ...ROW_BETWEEN, marginBottom: 10 }}>
        <button onClick={() => setHole(Math.max(1, hole - 1))} style={navBtn(hole === 1)}>‹ Prev</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: MUTE, fontWeight: 700 }}>HOLE</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{hole}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Par {c.par} · SI {c.si}</div>
        </div>
        <button onClick={() => setHole(Math.min(18, hole + 1))} style={navBtn(hole === 18)}>Next ›</button>
      </div>

      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {course.map((_, i) => (
          <button key={i} onClick={() => setHole(i + 1)} style={{
            minWidth: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13,
            background: hole === i + 1 ? GREEN : "#e9e2cf", color: hole === i + 1 ? "#fff" : MUTE,
          }}>{i + 1}</button>
        ))}
      </div>

      {players.map((pl, p) => (
        <PlayerCard key={p} {...{ pl, p, hole, c, getEntry, setGross, tapTrash, downTrash, toggleBoonie, total: totals[p] }} />
      ))}
    </div>
  );
}

function navBtn(disabled) {
  return {
    background: disabled ? "#d8d1bd" : GREEN, color: "#fff", border: "none", padding: "10px 16px",
    borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
  };
}

function PlayerCard({ pl, p, hole, c, getEntry, setGross, tapTrash, downTrash, toggleBoonie, total }) {
  const e = getEntry(hole, p);
  const st = strokesOn(pl.hcp, c.si);
  const raw = holeRaw(e, c.par, st);
  const aw = e.gross != null && e.gross > 0 && raw.eligible ? scoreAward(e.gross, c.par, st) : null;
  const net = e.gross != null ? e.gross - st : null;

  return (
    <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${LINE}` }}>
      <div style={{ ...ROW_BETWEEN, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{pl.name}</div>
          <div style={{ fontSize: 11, color: MUTE }}>Hcp {pl.hcp} · gets {st} stroke{st === 1 ? "" : "s"} here</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: MUTE, fontWeight: 700 }}>TOTAL</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{total}</div>
        </div>
      </div>

      <div style={{ ...ROW_BETWEEN, marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div style={{ ...ROW, gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: MUTE }}>Gross</span>
          <Stepper value={e.gross} onDown={() => setGross(hole, p, -1)} onUp={() => setGross(hole, p, 1)} color={GREEN} />
        </div>
        {e.gross != null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: MUTE }}>Net {net}</div>
            {raw.eligible
              ? <span style={pill(GREEN)}>net par or better · trash counts</span>
              : <span style={pill(RED)}>over net par · BIPSIC · 0 pts</span>}
          </div>
        )}
      </div>

      {aw && (
        <div style={{ ...pill(YELLOW), color: INK, marginBottom: 8, display: "inline-block" }}>
          AUTO · {aw.label} +{aw.pts}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TRASH.map((t) => {
          const ct = e.trash[t.k] || 0;
          const on = ct > 0;
          return (
            <div key={t.k} style={{ ...ROW, borderRadius: 9, overflow: "hidden", border: `1px solid ${on ? GREEN : LINE}` }}>
              <button onClick={() => tapTrash(hole, p, t)} style={{
                border: "none", cursor: "pointer", padding: "8px 9px",
                background: on ? GREEN : "#f4efe1", color: on ? "#fff" : INK, fontSize: 12, fontWeight: 800,
              }}>
                {t.label} <span style={{ opacity: 0.75, fontWeight: 700 }}>+{t.pts}</span>
                {on && <span style={{ marginLeft: 5, background: YELLOW, color: INK, borderRadius: 6, padding: "0 5px" }}>{ct}</span>}
              </button>
              {on && (
                <button onClick={() => downTrash(hole, p, t)} style={{
                  border: "none", cursor: "pointer", padding: "8px", background: GREEN_DK, color: "#fff", fontWeight: 900,
                }}>−</button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...ROW_BETWEEN, marginTop: 10 }}>
        <button onClick={() => toggleBoonie(hole, p)} style={{
          border: `1px solid ${e.boonie ? GREEN : LINE}`, borderRadius: 9, cursor: "pointer", padding: "8px 10px",
          fontSize: 12, fontWeight: 800, background: e.boonie ? GREEN : "#f4efe1", color: e.boonie ? "#fff" : MUTE,
        }}>
          🌺 Boonie {e.boonie ? "ON" : ""} <span style={{ fontWeight: 600 }}>· doubles last hole</span>
        </button>
        <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>
          Hole pts: <span style={{ color: GREEN, fontSize: 18 }}>{raw.pts}</span>
        </div>
      </div>
    </div>
  );
}

function pill(bg) {
  return { background: bg, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999 };
}

// ---------------- Leaderboard ----------------
function Board({ players, course, scores, totals }) {
  const order = players.map((p, i) => ({ i, name: p.name, total: totals[i] })).sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${LINE}` }}>
        {order.map((o, rank) => (
          <div key={o.i} style={{ ...ROW_BETWEEN, padding: "10px 4px", borderBottom: rank < 3 ? `1px solid ${LINE}` : "none" }}>
            <div style={{ ...ROW, gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 999, display: "inline-flex", alignItems: "center",
                justifyContent: "center", fontWeight: 900, background: rank === 0 ? YELLOW : "#eee7d4", color: INK, fontSize: 14,
              }}>{rank + 1}</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{o.name}</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 22, color: GREEN }}>{o.total}</span>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 10, border: `1px solid ${LINE}`, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thCell()}>Hole</th>
              {course.map((_, h) => <th key={h} style={thCell()}>{h + 1}</th>)}
              <th style={{ ...thCell(), color: YELLOW }}>Tot</th>
            </tr>
          </thead>
          <tbody>
            {players.map((pl, p) => {
              const { adj, total } = playerHoleTotals(scores, course, p, players);
              return (
                <tr key={p}>
                  <td style={{ ...tdCell(), textAlign: "left", fontWeight: 800 }}>{pl.name}</td>
                  {course.map((_, h) => <td key={h} style={tdCell()}>{adj[h + 1] ? adj[h + 1] : ""}</td>)}
                  <td style={{ ...tdCell(), fontWeight: 900, color: GREEN }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function thCell() {
  return { background: GREEN, color: "#fff", padding: "6px 6px", fontWeight: 800, position: "sticky", top: 0 };
}
function tdCell() {
  return { border: `1px solid ${LINE}`, padding: "6px 6px", textAlign: "center" };
}

// ---------------- Setup ----------------
function Setup({ players, setPlayers, course, setCourse, showRules, setShowRules, setScores }) {
  const setP = (i, key, val) => setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  const setC = (i, key, val) => setCourse((prev) => prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));

  return (
    <div style={{ padding: 12 }}>
      <div style={{ background: "#fff7df", border: `1px solid ${YELLOW}`, borderRadius: 12, padding: 10, marginBottom: 12, fontSize: 12 }}>
        ⚠️ Men play the white tees, women the forward tees. Par and stroke index below are a par-71 default. Confirm them against the printed card at the first tee, then edit any that are off.
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${LINE}` }}>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>Players & handicaps</div>
        {players.map((pl, i) => (
          <div key={i} style={{ ...ROW, gap: 8, marginBottom: 8 }}>
            <input value={pl.name} onChange={(e) => setP(i, "name", e.target.value)}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 14 }} />
            <div style={{ ...ROW, gap: 4 }}>
              <span style={{ fontSize: 11, color: MUTE, fontWeight: 700 }}>HCP</span>
              <input type="number" inputMode="numeric" value={pl.hcp}
                onChange={(e) => setP(i, "hcp", parseInt(e.target.value || "0", 10) || 0)}
                style={{ width: 56, padding: "9px 8px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 14, textAlign: "center" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${LINE}`, overflowX: "auto" }}>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>Course · par & stroke index</div>
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
          <thead>
            <tr><th style={tdCell()}>Hole</th><th style={tdCell()}>Par</th><th style={tdCell()}>SI</th></tr>
          </thead>
          <tbody>
            {course.map((c, i) => (
              <tr key={i}>
                <td style={{ ...tdCell(), fontWeight: 800 }}>{i + 1}</td>
                <td style={tdCell()}>
                  <input type="number" inputMode="numeric" value={c.par}
                    onChange={(e) => setC(i, "par", parseInt(e.target.value || "0", 10) || 0)}
                    style={{ width: 46, textAlign: "center", border: "none", fontSize: 13 }} />
                </td>
                <td style={tdCell()}>
                  <input type="number" inputMode="numeric" value={c.si}
                    onChange={(e) => setC(i, "si", parseInt(e.target.value || "0", 10) || 0)}
                    style={{ width: 46, textAlign: "center", border: "none", fontSize: 13 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setShowRules((s) => !s)} style={{
        width: "100%", background: GREEN, color: "#fff", border: "none", borderRadius: 12,
        padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 12,
      }}>
        {showRules ? "Hide" : "Show"} point values
      </button>

      {showRules && (
        <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${LINE}`, fontSize: 13 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Bonus trash</div>
          <div style={{ color: MUTE, lineHeight: 1.5, marginBottom: 10 }}>
            Two 1-pt trash = +1 · three = +2 · four = +3 · five+ = +5 · one multi-pt + one 1-pt = +2 · multi + two = +3 · multi + three+ = +4 · two+ multi = +3 · two+ multi + any 1-pt = +4. The app adds these for you.
          </div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Values</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[["Arnie (ace)", 13], ["Gross Super Genie", 15], ["Net Super Genie", 13], ["Gross Genie", 10], ["Net Genie", 7], ["Gross Eagle", 5], ["Net Eagle", 3], ["Gross Birdie", 2], ["Net Birdie", 1], ...TRASH.map((t) => [t.label, t.pts])]
              .map(([l, v], i) => (
                <span key={i} style={{ background: "#f4efe1", borderRadius: 8, padding: "4px 8px", fontWeight: 700 }}>
                  {l} <span style={{ color: GREEN }}>+{v}</span>
                </span>
              ))}
            <span style={{ background: "#f4efe1", borderRadius: 8, padding: "4px 8px", fontWeight: 700 }}>Bipsic <span style={{ color: RED }}>0</span></span>
          </div>
        </div>
      )}

      <button onClick={() => {
        if (window.confirm("Clear all scores for this round? Players and course settings stay.")) setScores({});
      }} style={{
        width: "100%", background: "#fff", color: RED, border: `1px solid ${RED}`, borderRadius: 12,
        padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer",
      }}>
        Reset scores
      </button>
    </div>
  );
}
