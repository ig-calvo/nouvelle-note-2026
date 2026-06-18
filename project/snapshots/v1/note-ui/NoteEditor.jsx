/* global React */
function NoteEditor() {
  return (
    <div style={neStyles.card}>
      <div style={neStyles.topRow}>
        <div>
          <div style={neStyles.overline}>CLINIQUE DU CENTRE VILLE</div>
          <div style={neStyles.title}>Note Clinique</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="material-icons-outlined" style={neStyles.docIcon}>insert_drive_file</span>

      </div>

      {/* Fields */}
      <div style={neStyles.fieldsRow}>
        <FloatField label="Raison de consultation" flex input />
        <FloatField label="Date" width={210}>
          <span style={neStyles.fieldValue}>2026/02/10</span>
          <span className="material-icons-outlined" style={neStyles.fieldIcon}>calendar_today</span>
        </FloatField>
        <FloatField label="Heure" width={170}>
          <span style={neStyles.fieldValue}>15 h15</span>
          <span className="material-icons-outlined" style={neStyles.fieldIcon}>schedule</span>
        </FloatField>
        <FloatField label="Type de visite" width={260}>
          <span style={neStyles.fieldValue}>En clinique</span>
          <span className="material-icons-outlined" style={neStyles.fieldIcon}>visibility</span>
        </FloatField>
      </div>

      {/* Assistant IA */}
      <div style={neStyles.aiBox}>
        <div style={neStyles.aiLegend}>
          <span className="material-icons" style={neStyles.aiSparkle}>auto_awesome</span>
          <span style={neStyles.aiLabel}>Assistant IA</span>
        </div>
        <div style={neStyles.aiRow}>
          <button style={neStyles.gabaritBtn}>
            Gabarit de texte
            <span className="material-icons" style={neStyles.gabaritCaret}>arrow_drop_down</span>
          </button>
          <div style={{ flex: 1 }} />
          <button style={neStyles.aiActionBtn}>
            <span className="material-icons-outlined" style={{ ...neStyles.aiActionIcon, color: "#6967d1" }}>mic</span>
            <span style={{ color: "#6967d1", fontWeight: 600 }}>Lancer l'enregistrement</span>
          </button>
          <button style={neStyles.aiActionBtn}>
            <span className="material-icons" style={{ ...neStyles.aiActionIcon, color: "rgba(0,0,0,0.55)" }}>auto_awesome</span>
            Générer une note
          </button>
          <span className="material-icons-outlined" style={neStyles.infoIcon}>info</span>
        </div>
      </div>
    </div>
  );
}

function FloatField({ label, children, width, flex, error, input }) {
  const [focused, setFocused] = React.useState(false);
  const [value, setValue] = React.useState("");

  // Static fields (with children) always show the floated label.
  // Interactive inputs float the label only when focused or filled.
  const floated = !input || focused || value.length > 0;

  return (
    <div style={{
      ...neFieldStyles.wrap,
      ...(flex ? { flex: 1, minWidth: 200 } : { width }),
      ...(error ? { borderColor: "#d32f2f" } : {}),
      ...(input && focused ? neFieldStyles.wrapFocused : {}),
    }}>
      {label &&
        <span style={{
          ...neFieldStyles.label,
          ...(floated ? neFieldStyles.labelFloating : neFieldStyles.labelResting),
          ...(input && focused ? { color: "#6967d1" } : {}),
        }}>{label}</span>}
      <div style={neFieldStyles.inner}>
        {input
          ? <input
              style={neFieldStyles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)} />
          : children}
      </div>
    </div>
  );
}

const neFieldStyles = {
  wrap: {
    position: "relative", border: "1px solid #c4c4c4", borderRadius: 6,
    height: 52, display: "flex", alignItems: "center", padding: "0 14px",
    background: "#fff",
  },
  wrapFocused: { borderColor: "#6967d1", boxShadow: "0 0 0 1px #6967d1" },
  label: {
    position: "absolute", left: 12, padding: "0 5px",
    background: "#fff", color: "rgba(0,0,0,0.6)",
    fontFamily: "'Inter', sans-serif", pointerEvents: "none",
    transformOrigin: "left center",
    transition: "top 0.16s ease, font-size 0.16s ease, color 0.16s ease",
  },
  labelFloating: { top: -8, fontSize: 12 },
  labelResting: { top: 15, fontSize: 16, color: "rgba(0,0,0,0.55)" },
  inner: { display: "flex", alignItems: "center", width: "100%", gap: 8 },
  input: {
    border: "none", outline: "none", background: "transparent", width: "100%",
    font: "400 15px 'Inter', sans-serif", color: "rgba(0,0,0,0.85)", padding: 0,
  },
};

const neStyles = {
  card: {
    background: "#fff", borderRadius: 8, padding: "16px 20px 18px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif",
  },
  topRow: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 },
  overline: {
    fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase",
    color: "rgba(0,0,0,0.5)",
  },
  title: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22,
    color: "rgba(0,0,0,0.88)", marginTop: 2,
  },
  docIcon: { fontSize: 24, color: "rgba(0,0,0,0.45)", marginTop: 6 },
  outlineBtn: {
    border: "1px solid #c9c9d6", borderRadius: 8, background: "#fff",
    padding: "9px 16px", cursor: "pointer", marginTop: 2,
    font: "500 14px 'Inter', sans-serif", color: "rgba(0,0,0,0.78)",
  },
  fieldsRow: { display: "flex", gap: 14, alignItems: "center", marginBottom: 22 },
  requiredText: { color: "#d32f2f", fontSize: 15 },
  fieldPlaceholder: { fontSize: 15, color: "rgba(0,0,0,0.82)" },
  fieldValue: { fontSize: 15, color: "rgba(0,0,0,0.82)" },
  fieldIcon: { marginLeft: "auto", fontSize: 20, color: "rgba(0,0,0,0.5)" },
  aiBox: {
    position: "relative",
    border: "1px solid #c9c9e8",
    borderRadius: 10,
    padding: "18px 16px 14px",
    marginTop: 6,
  },
  aiLegend: {
    position: "absolute",
    top: -11,
    left: 14,
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "#fff",
    padding: "0 6px",
  },
  aiLabelRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  aiSparkle: { fontSize: 18, color: "#6967d1" },
  aiLabel: { fontSize: 14, fontWeight: 600, color: "#6967d1" },
  aiRow: { display: "flex", alignItems: "center", gap: 12 },
  gabaritBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    border: "1px solid #c9c9d6", borderRadius: 8, background: "#fff",
    padding: "9px 10px 9px 16px", cursor: "pointer", minWidth: 180,
    font: "400 14px 'Inter', sans-serif", color: "rgba(0,0,0,0.7)",
    justifyContent: "space-between",
  },
  gabaritCaret: { fontSize: 22, color: "rgba(0,0,0,0.6)" },
  aiActionBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    border: "1px solid #c9c9d6", borderRadius: 8, background: "#fff",
    padding: "9px 16px", cursor: "pointer",
    font: "500 14px 'Inter', sans-serif", color: "rgba(0,0,0,0.8)",
  },
  aiActionIcon: { fontSize: 20, color: "rgba(0,0,0,0.6)" },
  infoIcon: { fontSize: 22, color: "rgba(0,0,0,0.4)", cursor: "pointer" },
};

window.NoteEditor = NoteEditor;
