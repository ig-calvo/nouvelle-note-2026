/* global React */
const SUMMARY_SECTIONS = [
  { id: "tasks", icon: "check_box", label: "Tâches", add: true, rows: [] },
  {
    id: "vitals", icon: "monitor_heart", label: "Signes vitaux", add: true,
    rows: [
      { left: "Poids", mid: "62 kg", flag: true, right: "08/12/2025" },
      { left: "Pression", mid: "118/74 mmHg", flag: true, right: "08/12/2025" },
      { left: "Fréq. cardiaque", mid: "72 bpm", flag: true, right: "08/12/2025" },
      { left: "Taille", mid: "165 cm", flag: true, right: "08/12/2025" },
      { left: "IMC", mid: "22,8", flag: true, right: "08/12/2025" },
    ],
  },
  { id: "problems", icon: "hub", label: "Problèmes", add: true, rows: [] },
  {
    id: "history", icon: "assignment", label: "Antécédents", add: true,
    rows: [{ left: "Infection urinaire (résolue)", right: "08/12/2025" }],
  },
  {
    id: "allergies", icon: "eco", label: "Allergies",
    rows: [{ left: "Aucune allergie connue", muted: true }],
  },
  {
    id: "family", icon: "folder_open", label: "Antécédents familiaux", add: true,
    rows: [
      { left: "Nulligeste", flag: true },
      { left: "Cycles réguliers", flag: true },
      { left: "Contraception…", mid: "depuis 5 ans", flag: true },
      { left: "Antécédents…", mid: "Aucun pertinent", flag: true },
      { left: "Antécédents chirurgi…", mid: "Aucun", flag: true },
    ],
  },
  {
    id: "meds", icon: "medication", label: "Médicaments",
    rows: [
      { left: "Contraceptif…", mid: "1 co DIE — actif", flag: true },
      { left: "Nitrofurantoïne…", mid: "cessée (ITU)", flag: true, right: "12/2025" },
    ],
  },
  {
    id: "immun", icon: "vaccines", label: "Immunisations et vaccins",
    rows: [
      { left: "HPV (Gardasil…", mid: "série complète", flag: true, right: "2010" },
      { left: "dCaT (Tétanos-diphtérie)", flag: true, right: "2022" },
      { left: "Influenza", mid: "à jour", flag: true, right: "2025" },
      { left: "COVID-19", mid: "primaire + rappels", flag: true, right: "2023" },
    ],
  },
  {
    id: "habits", icon: "nutrition", label: "Habitudes de vie",
    rows: [
      { left: "Tabac", mid: "Non-fumeuse", flag: true },
      { left: "Alcool", mid: "Occasionnel (social)", flag: true },
      { left: "Drogues", mid: "Aucune" },
    ],
  },
];

function Summary() {
  return (
    <aside style={suStyles.panel}>
      <div style={suStyles.header}>
        <span style={suStyles.headerTitle}>Sommaire du dossier</span>
        <span className="material-icons-outlined" style={suStyles.headerIcon}>dashboard</span>
      </div>

      {SUMMARY_SECTIONS.map((s) => (
        <div key={s.id} style={suStyles.section}>
          <div style={suStyles.sectionHead}>
            <span className="material-icons-outlined" style={suStyles.secIcon}>{s.icon}</span>
            <span style={suStyles.secLabel}>{s.label}</span>
            {s.add && <span className="material-icons" style={suStyles.plus}>add</span>}
          </div>
          {s.rows.length > 0 && (
            <div style={suStyles.rows}>
              {s.rows.map((r, i) => <Row key={i} r={r} />)}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}

function Row({ r }) {
  return (
    <div style={suStyles.row}>
      <span style={{ ...suStyles.rowLeft, ...(r.muted ? { color: "rgba(0,0,0,0.5)" } : {}) }}>{r.left}</span>
      {r.mid && <span style={suStyles.rowMid}>{r.mid}</span>}

      {r.right && <span style={suStyles.rowRight}>{r.right}</span>}
    </div>
  );
}

const suStyles = {
  panel: {
    width: 300, background: "#fff", borderRadius: 8, overflow: "hidden",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,0.14), 0 0 5px 0 rgba(37,36,94,0.12)",
    fontFamily: "'Inter',sans-serif",
    height: "fit-content", flexShrink: 0,
  },
  header: {
    background: "#262383", color: "#fff", padding: "14px 16px",
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17,
    display: "flex", alignItems: "center",
  },
  headerTitle: { flex: 1 },
  headerIcon: { fontSize: 22, color: "#fff" },
  section: { borderBottom: "1px solid #ededed" },
  sectionHead: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px", minHeight: 44, boxSizing: "border-box",
  },
  secIcon: { fontSize: 20, color: "rgba(0,0,0,0.6)", width: 22 },
  secLabel: {
    fontSize: 15, color: "rgba(0,0,0,0.85)", fontWeight: 600,
    fontFamily: "'Poppins',sans-serif",
  },
  plus: { marginLeft: "auto", fontSize: 22, color: "#1975d1", cursor: "pointer" },
  rows: { padding: "0 16px 12px 50px", display: "flex", flexDirection: "column", gap: 9 },
  row: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  rowLeft: {
    color: "rgba(0,0,0,0.78)", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130,
  },
  rowMid: { color: "rgba(0,0,0,0.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  flag: {
    width: 0, height: 0, marginLeft: "auto", flexShrink: 0,
    borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
    borderBottom: "8px solid #e0455e",
  },
  rowRight: { color: "rgba(0,0,0,0.5)", fontSize: 12, fontVariantNumeric: "tabular-nums", flexShrink: 0 },
};

window.Summary = Summary;
