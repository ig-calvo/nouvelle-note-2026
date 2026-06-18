/* global React */
const NOTE_ITEMS_TEMPLATE = [
  {
    date: "8 DÉCEMBRE 2025 09:15",
    author: "%%DOCTOR%%",
    clinic: "Clinique du Centre-ville",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Infection urinaire",
    icons: ["graphic_eq", "link"],
    details: "Motif : Brûlures mictionnelles depuis 3 jours.\nSubjectif : Dysurie, pollakiurie, urgence mictionnelle. Pas de fièvre, pas de douleur lombaire, pas d'hématurie macroscopique. Premier épisode. Pas d'antécédent gynécologique pertinent. Pas enceinte.\nObjectif : Apyrétique. Abdomen souple, sensibilité sus-pubienne légère. Loges rénales indolores. Bandelette urinaire : Leu+++, Nit+, Sang trace.",
    conclusion: "Impression : Cystite aiguë non compliquée.\nPlan : Nitrofurantoïne 100 mg BID × 5 jours. Culture d'urine envoyée. Conseils d'hydratation. Retour si fièvre, douleur lombaire ou non-amélioration après 48h.",
    files: [
      { name: "Bandelette urinaire.jpg", size: "200KB" },
      { name: "Culture d'urine.pdf", size: "220KB" },
    ],
  },
  {
    date: "5 JUIN 2025 10:30",
    author: "%%DOCTOR%%",
    clinic: "Clinique du Centre-ville",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Examen annuel",
    icons: ["graphic_eq", "pan_tool", "link", "hub"],
    details: "Subjectif : Patiente sans plainte particulière. Se dit en bonne santé. Pas de symptôme cardiovasculaire, respiratoire ou digestif. Sommeil satisfaisant. Énergie correcte. Stress professionnel modéré lié au travail en milieu scolaire. Contraception orale bien tolérée, pas d'oubli. Objectif : TA 116/72. Pouls 70 bpm. Poids 61 kg. IMC 22,4. Examen physique général sans anomalie. Auscultation cardio-pulmonaire normale. Abdomen souple, indolore. Pas d'adénopathie. Examen gynécologique non effectué (refusé par la patiente, à reprendre). Impression : Bonne santé générale.",
    conclusion: "Pas de problème actif identifié. Plan : Renouvellement contraceptif oral pour 1 an. Rappel dépistage col utérin à planifier. Conseils hygiéno-diététiques généraux. Retour au besoin.",
    files: [
      { name: "Exempleimage.jpg", size: "200KB" },
      { name: "Exempledocument.pdf", size: "220KB" },
    ],
  },
];

function NotesList({ doctorName = "Véronique Charland" }) {
  const NOTE_ITEMS = NOTE_ITEMS_TEMPLATE.map(n => ({ ...n, author: n.author === "%%DOCTOR%%" ? doctorName : n.author }));
  const [openNotes, setOpenNotes] = React.useState({});

  const toggle = (i) => setOpenNotes((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div style={nlStyles.card}>
      <div style={nlStyles.title}>Liste de notes cliniques</div>

      <div style={nlStyles.filterRow}>
        <Filter label="Voir" value="Toutes les notes" width={190} />
        <Filter label="triées par" value="Date d'entrée en vigueur" width={250} />
        <Filter label="Du" value="15/10/2023" width={150} cal />
        <Filter label="Au" value="15/10/2023" width={150} cal />
      </div>

      <div style={nlStyles.chipRow}>
        <AuthorChip name={doctorName} icon="person" />
        <AuthorChip name="Examen annuel" icon="description" />
      </div>

      {NOTE_ITEMS.map((n, i) => {
        const isOpen = !!openNotes[i];
        return (
          <div key={i} style={{ ...nlStyles.note, ...(i > 0 ? nlStyles.noteBorder : {}) }}>
            {/* Left meta column */}
            <div style={nlStyles.metaCol}>
              <div style={nlStyles.dateRow}>
                <span className="material-icons-outlined" style={nlStyles.noteFileIcon}>description</span>
                <span style={nlStyles.dateText}>{n.date}</span>
              </div>
              <div style={nlStyles.author}>{n.author}</div>
              <div style={nlStyles.clinic}>{n.clinic}</div>
              <div style={nlStyles.role}>{n.role}</div>
            </div>

            {/* Body */}
            <div style={nlStyles.body}>
              {/* Header row */}
              <div style={nlStyles.bodyHead}>
                <div>
                  <div style={nlStyles.mode}>{n.mode}</div>
                  <div style={nlStyles.noteTitle}>{n.title}</div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={nlStyles.actionIcons}>
                  {n.icons.map((ic) => (
                    <span key={ic} className="material-icons-outlined" style={nlStyles.actionIcon}>{ic}</span>
                  ))}
                  <button style={nlStyles.checkoutBtn}>Checkout</button>
                  <button style={nlStyles.caretBtn} onClick={() => toggle(i)} aria-label={isOpen ? "Fermer" : "Ouvrir"}>
                    {isOpen
                      ? <span className="material-icons" style={nlStyles.caretIcon}>unfold_less</span>
                      : <span className="material-icons" style={nlStyles.caretIcon}>unfold_more</span>
                    }
                  </button>
                </div>
              </div>

              {/* Expanded: Détails de la note */}
              {isOpen && (
                <div style={nlStyles.detailsSection}>
                  <div style={nlStyles.detailsLabel}>Détails de la note</div>
                  <div style={nlStyles.detailsText}>
                    {n.details.split("\n").map((line, j) => (
                      <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              <div style={nlStyles.conclLabelWrap}>
                {isOpen
                  ? <div style={nlStyles.conclLabelOpen}>Conclusion</div>
                  : <div style={nlStyles.conclLabel}>CONCLUSION</div>
                }
              </div>
              <div style={nlStyles.conclText}>
                {n.conclusion.split("\n").map((line, j) => (
                  <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                ))}
              </div>

              {/* Files */}
              <div style={nlStyles.fileRow}>
                {n.files.map((f) => (
                  <span key={f.name} style={nlStyles.fileChip}>
                    <span className="material-icons-outlined" style={nlStyles.clipIcon}>attach_file</span>
                    <span style={nlStyles.fileName}>{f.name}</span>
                    <span style={nlStyles.fileSize}>{f.size}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Filter({ label, value, width, cal }) {
  return (
    <div style={nlStyles.filterField}>
      <span style={nlStyles.filterLabel}>{label}</span>
      <div style={{ ...nlStyles.filterBox, width }}>
        <span style={nlStyles.filterValue}>{value}</span>
        <span className="material-icons" style={nlStyles.filterIcon}>
          {cal ? "calendar_today" : "arrow_drop_down"}
        </span>
      </div>
    </div>
  );
}

function AuthorChip({ name, icon }) {
  return (
    <span style={nlStyles.authorChip}>
      {icon && <span className="material-icons-outlined" style={nlStyles.chipIcon}>{icon}</span>}
      <span>{name}</span>
      <span className="material-icons" style={nlStyles.chipClose}>close</span>
    </span>
  );
}

const nlStyles = {
  card: {
    background: "#fff", borderRadius: 8, padding: "18px 22px 22px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22,
    color: "rgba(0,0,0,0.88)", marginBottom: 16,
  },
  filterRow: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 },
  filterField: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 13, color: "rgba(0,0,0,0.55)" },
  filterBox: {
    display: "flex", alignItems: "center",
    border: "1px solid #c4c4c4", borderRadius: 6,
    height: 40, padding: "0 8px 0 12px",
  },
  filterValue: { fontSize: 14, color: "rgba(0,0,0,0.78)" },
  filterIcon: { marginLeft: "auto", fontSize: 20, color: "rgba(0,0,0,0.5)" },
  chipRow: { display: "flex", gap: 12, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid #eee" },
  authorChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #c9c9e0", borderRadius: 20, padding: "5px 8px 5px 12px",
    fontSize: 14, color: "rgba(0,0,0,0.78)", cursor: "pointer",
  },
  chipIcon: { fontSize: 16, color: "rgba(0,0,0,0.5)" },
  chipClose: { fontSize: 16, color: "rgba(0,0,0,0.4)" },
  note: { display: "flex", gap: 28, padding: "18px 0" },
  noteBorder: { borderTop: "1px solid #eee" },
  metaCol: { width: 220, flexShrink: 0 },
  dateRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  noteFileIcon: { fontSize: 18, color: "rgba(0,0,0,0.45)" },
  dateText: { fontSize: 12, color: "rgba(0,0,0,0.5)", letterSpacing: 0.4, fontWeight: 500 },
  author: { fontSize: 15, fontWeight: 600, color: "rgba(0,0,0,0.85)" },
  clinic: { fontSize: 14, color: "rgba(0,0,0,0.7)", marginTop: 2 },
  role: { fontSize: 14, color: "#1975d1", fontWeight: 500, marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  bodyHead: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  mode: { fontSize: 11, fontWeight: 500, letterSpacing: 0.8, color: "rgba(0,0,0,0.5)" },
  noteTitle: { fontSize: 17, fontWeight: 600, color: "rgba(0,0,0,0.85)", marginTop: 2 },
  actionIcons: { display: "flex", alignItems: "center", gap: 10 },
  actionIcon: { fontSize: 20, color: "rgba(0,0,0,0.5)", cursor: "pointer" },
  checkoutBtn: {
    background: "#e8f0fb", border: 0, borderRadius: 6, color: "#1975d1",
    padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13,
    fontFamily: "'Inter', sans-serif",
  },
  caretBtn: {
    width: 28, height: 28, border: 0, background: "transparent", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  caretIcon: { fontSize: 20, color: "rgba(0,0,0,0.45)" },
  detailsSection: { marginBottom: 16 },
  detailsLabel: {
    fontSize: 14, fontWeight: 400, color: "rgba(0,0,0,0.7)",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 15, color: "rgba(0,0,0,0.82)", lineHeight: 1.6,
  },
  conclLabelWrap: { marginTop: 4, marginBottom: 4 },
  conclLabel: {
    fontSize: 11, fontWeight: 500, letterSpacing: 0.8,
    color: "rgba(0,0,0,0.45)", marginBottom: 4,
  },
  conclLabelOpen: {
    fontSize: 14, fontWeight: 500, color: "rgba(0,0,0,0.75)",
    marginBottom: 8, marginTop: 12,
  },
  conclText: { fontSize: 15, color: "rgba(0,0,0,0.82)", lineHeight: 1.5, marginBottom: 14 },
  fileRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  fileChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #d8d8e4", borderRadius: 20, padding: "5px 14px 5px 10px",
  },
  clipIcon: { fontSize: 16, color: "rgba(0,0,0,0.5)" },
  fileName: { fontSize: 13, color: "#1975d1", fontWeight: 500 },
  fileSize: { fontSize: 12, color: "rgba(0,0,0,0.45)" },
};

window.NotesList = NotesList;
