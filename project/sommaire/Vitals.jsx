/* global React, useStore, Sheet, DlgHead, Seg, Star, toast, bmi, bsa, fmtDate, fmtShort, todayISO */
// =========================================================
// Vitals.jsx — add observation, grid drawer, edit, chart
// =========================================================
const VITAL_ROWS = [
  { key: "ta",   label: "Tension artérielle", star: "ta",   get: (v) => v.sys && v.dia ? `${v.sys}/${v.dia}` : "—", unit: "mmHg", chart: (v) => v.sys },
  { key: "fc",   label: "Fréquence cardiaque", star: "fc",   get: (v) => v.fc || "—", unit: "/min", chart: (v) => v.fc },
  { key: "temp", label: "Température",          star: "temp", get: (v) => v.temp || "—", unit: "°C", chart: (v) => v.temp },
  { key: "spo2", label: "Saturation O₂",        star: "spo2", get: (v) => v.spo2 || "—", unit: "%", chart: (v) => v.spo2 },
  { key: "poids",label: "Poids",                star: "poids",get: (v) => v.poids || "—", unit: "kg", chart: (v) => v.poids },
  { key: "taille",label:"Taille",               star: null,   get: (v) => v.taille || "—", unit: "cm", chart: (v) => v.taille },
  { key: "imc",  label: "IMC",                  star: "imc",  get: (v) => { const b = bmi(v.poids, v.taille); return b ? b.toFixed(1) : "—"; }, unit: "kg/m²", chart: (v) => { const b = bmi(v.poids, v.taille); return b ? +b.toFixed(1) : null; } },
  { key: "tour", label: "Tour de taille",       star: "tour", get: (v) => v.tour || "—", unit: "cm", chart: (v) => v.tour }
];

const LB = 2.2046226, INCH = 2.54;

function VitalsAdd({ onClose }) {
  const { update } = useStore();
  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="monitor_heart" overline="Signes vitaux" title="Ajouter une observation" onClose={close} />
          <VitalsFormInner close={close} onSubmit={(obs) => {
            update((s) => { s.vitals.unshift({ id: "v" + Date.now(), ...obs }); s.vitals.sort((a, b2) => (b2.date + (b2.time || "")).localeCompare(a.date + (a.time || ""))); return s; });
            toast("Observation ajoutée", { icon: "monitor_heart" });
          }} />
        </>)}
    </Sheet>);
}

function VitalsEdit({ id, onClose }) {
  const { state, update } = useStore();
  const obs = state.vitals.find((v) => v.id === id);
  if (!obs) return null;
  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="edit" overline={"Observation · " + fmtDate(obs.date)} title="Modifier une observation" onClose={close} />
          <VitalsFormInner close={close} initial={obs}
            onSubmit={(o) => { update((s) => { const t = s.vitals.find((v) => v.id === id); if (t) Object.assign(t, o); return s; }); toast("Observation modifiée"); }}
            onDelete={() => { update((s) => { s.vitals = s.vitals.filter((v) => v.id !== id); return s; }); toast("Observation supprimée"); close(); }} />
        </>)}
    </Sheet>);
}

function VitalsFormInner({ close, initial, onSubmit, onDelete }) {
  const [unit, setUnit] = React.useState("metric");
  const [f, setF] = React.useState(() => ({
    date: initial?.date || todayISO(), time: initial?.time || "",
    poids: initial?.poids || "", taille: initial?.taille || "",
    sys: initial?.sys || "", dia: initial?.dia || "", fc: initial?.fc || "",
    temp: initial?.temp || "", spo2: initial?.spo2 || "", tour: initial?.tour || ""
  }));
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const dispW = unit === "imperial" && f.poids ? (parseFloat(f.poids) * LB).toFixed(1) : f.poids;
  const dispH = unit === "imperial" && f.taille ? (parseFloat(f.taille) / INCH).toFixed(1) : f.taille;
  const dispTour = unit === "imperial" && f.tour ? (parseFloat(f.tour) / INCH).toFixed(1) : f.tour;
  const setW = (e) => setF((p) => ({ ...p, poids: unit === "imperial" ? (e.target.value ? (parseFloat(e.target.value) / LB).toFixed(2) : "") : e.target.value }));
  const setH = (e) => setF((p) => ({ ...p, taille: unit === "imperial" ? (e.target.value ? (parseFloat(e.target.value) * INCH).toFixed(1) : "") : e.target.value }));
  const setTour = (e) => setF((p) => ({ ...p, tour: unit === "imperial" ? (e.target.value ? (parseFloat(e.target.value) * INCH).toFixed(1) : "") : e.target.value }));
  const b = bmi(f.poids, f.taille), sc = bsa(f.poids, f.taille);

  const submit = () => {
    onSubmit({
      date: f.date, time: f.time,
      poids: f.poids ? +parseFloat(f.poids).toFixed(1) : null,
      taille: f.taille ? +parseFloat(f.taille).toFixed(0) : null,
      sys: f.sys ? +f.sys : null, dia: f.dia ? +f.dia : null, fc: f.fc ? +f.fc : null,
      temp: f.temp ? +f.temp : null, spo2: f.spo2 ? +f.spo2 : null, tour: f.tour ? +parseFloat(f.tour).toFixed(0) : null
    });
    close();
  };

  return (
    <>
      <div className="dlg-body">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Seg options={[{ value: "metric", label: "Métrique" }, { value: "imperial", label: "Impérial" }]} value={unit} onChange={setUnit} />
          <span style={{ flex: 1 }} />
          <input className="input" style={{ width: 140 }} type="date" value={f.date} onChange={set("date")} />
          <input className="input" style={{ width: 110 }} type="time" value={f.time} onChange={set("time")} placeholder="hh:mm (optionnel)" />
        </div>

        {(b || sc) &&
          <div className="calc-box">
            <div className="cb"><span className="cb-k">IMC</span><span className="cb-v">{b ? b.toFixed(1) : "—"}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--s-ink-4)" }}> kg/m²</span></span></div>
            <div className="cb"><span className="cb-k">Surface corporelle</span><span className="cb-v">{sc ? sc.toFixed(2) : "—"}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--s-ink-4)" }}> m²</span></span></div>
            <div className="cb" style={{ marginLeft: "auto", alignSelf: "center" }}><span className="cb-k">Calculé auto.</span></div>
          </div>}

        <div className="field-row">
          <div className="field"><label>Poids ({unit === "imperial" ? "lb" : "kg"})</label><input className="input" type="number" value={dispW} onChange={setW} placeholder="0" /></div>
          <div className="field"><label>Taille ({unit === "imperial" ? "po" : "cm"})</label><input className="input" type="number" value={dispH} onChange={setH} placeholder="0" /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>TA systolique</label><input className="input" type="number" value={f.sys} onChange={set("sys")} placeholder="mmHg" /></div>
          <div className="field"><label>TA diastolique</label><input className="input" type="number" value={f.dia} onChange={set("dia")} placeholder="mmHg" /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Fréquence cardiaque</label><input className="input" type="number" value={f.fc} onChange={set("fc")} placeholder="/min" /></div>
          <div className="field"><label>Température (°C)</label><input className="input" type="number" step="0.1" value={f.temp} onChange={set("temp")} placeholder="°C" /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Saturation O₂ (%)</label><input className="input" type="number" value={f.spo2} onChange={set("spo2")} placeholder="%" /></div>
          <div className="field"><label>Tour de taille ({unit === "imperial" ? "po" : "cm"})</label><input className="input" type="number" value={dispTour} onChange={setTour} placeholder="0" /></div>
        </div>
      </div>
      <div className="dlg-foot">
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><span className="material-icons-outlined">delete_outline</span>Supprimer</button>}
        <span className="foot-spacer" />
        <button className="btn btn-ghost" onClick={close}>Annuler</button>
        <button className="btn btn-primary" onClick={submit}><span className="material-icons-outlined">check</span>{initial ? "Enregistrer" : "Ajouter cette observation"}</button>
      </div>
    </>);
}

function VitalsGrid({ onClose, onAdd, onEdit }) {
  const { state, update } = useStore();
  const [view, setView] = React.useState("grid");
  const [chartKey, setChartKey] = React.useState("poids");
  const obs = state.vitals;
  const toggleStar = (k) => k && update((s) => { s.vitalsStar[k] = !s.vitalsStar[k]; return s; });

  return (
    <Sheet kind="drawer" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="favorite_border" overline="Signes vitaux" title="Grille des signes vitaux" onClose={close}
            actions={
              <>
                <button className="icon-btn accent" title="Ajouter une observation" onClick={() => onAdd()}><span className="material-icons-outlined">medical_services</span></button>
                <button className="icon-btn" title={view === "grid" ? "Vue graphique" : "Vue grille"} onClick={() => setView(view === "grid" ? "chart" : "grid")}><span className="material-icons-outlined">{view === "grid" ? "show_chart" : "grid_on"}</span></button>
                <button className="icon-btn" title="Aperçu impression (courbes)" onClick={() => toast("Aperçu impression — courbes de croissance")}><span className="material-icons-outlined">print</span></button>
              </>}
          />
          <div className="dlg-body">
            {obs.length === 0 && <div className="empty-state"><span className="material-icons-outlined">monitor_heart</span>Aucune observation enregistrée.</div>}

            {obs.length > 0 && view === "grid" &&
              <div className="vgrid-wrap">
                <table className="vgrid">
                  <thead>
                    <tr>
                      <th>Signe vital</th>
                      {obs.map((v) =>
                        <th key={v.id} className="date-col" title="Modifier cette observation" onClick={() => onEdit(v.id)}>
                          {fmtShort(v.date)}{v.time ? <div style={{ fontWeight: 400, color: "var(--s-ink-4)" }}>{v.time}</div> : null}
                        </th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {VITAL_ROWS.map((row) =>
                      <tr key={row.key}>
                        <td>
                          <span className="vg-name">
                            {row.star && <Star on={!!state.vitalsStar[row.star]} onClick={() => toggleStar(row.star)} />}
                            {!row.star && <span style={{ width: 25 }} />}
                            {row.label} <span style={{ color: "var(--s-ink-4)", fontWeight: 400 }}>({row.unit})</span>
                          </span>
                        </td>
                        {obs.map((v) => <td key={v.id}>{row.get(v)}</td>)}
                      </tr>)}
                  </tbody>
                </table>
              </div>}

            {obs.length > 0 && view === "chart" &&
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--s-ink-2)" }}>Mesure :</label>
                  <select className="select" style={{ width: 220 }} value={chartKey} onChange={(e) => setChartKey(e.target.value)}>
                    {VITAL_ROWS.filter((r) => r.key !== "taille").map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
                <VitalsChart obs={obs} row={VITAL_ROWS.find((r) => r.key === chartKey)} />
              </>}
          </div>
        </>)}
    </Sheet>);
}

function VitalsChart({ obs, row }) {
  const pts = obs.slice().reverse().map((v) => ({ date: v.date, val: row.chart(v) })).filter((p) => p.val != null);
  if (pts.length < 1) return <div className="empty-state">Pas de données pour cette mesure.</div>;
  const W = 640, H = 240, pad = 40;
  const vals = pts.map((p) => p.val);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad2 = (max - min) * 0.15; min -= pad2; max += pad2;
  const x = (i) => pad + (pts.length === 1 ? (W - 2 * pad) / 2 : (i / (pts.length - 1)) * (W - 2 * pad));
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(" ");
  const ticks = 4;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const val = min + (i / ticks) * (max - min);
          const yy = y(val);
          return <g key={i}>
            <line className="axis" x1={pad} y1={yy} x2={W - pad} y2={yy} opacity="0.5" />
            <text className="lbl" x={pad - 6} y={yy + 3} textAnchor="end">{val.toFixed(0)}</text>
          </g>;
        })}
        {pts.length > 1 && <path className="line" d={path} />}
        {pts.map((p, i) =>
          <g key={i}>
            <circle className="dot-pt" cx={x(i)} cy={y(p.val)} r="4" />
            <text className="lbl" x={x(i)} y={H - pad + 16} textAnchor="middle">{fmtShort(p.date)}</text>
            <text className="lbl" x={x(i)} y={y(p.val) - 9} textAnchor="middle" style={{ fill: "var(--s-action)", fontWeight: 700 }}>{p.val}</text>
          </g>)}
      </svg>
      <div style={{ textAlign: "center", fontSize: 12, color: "var(--s-ink-3)", marginTop: 6 }}>{row.label} ({row.unit})</div>
    </div>);
}

Object.assign(window, { VitalsAdd, VitalsEdit, VitalsGrid });
