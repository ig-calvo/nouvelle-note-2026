/* global React */
const NOTE_ITEMS_TEMPLATE = [
  {
    date: "8 DÉCEMBRE 2025 09:15",
    author: "Dr Marc Lefebvre",
    clinic: "Clinique du Centre-ville",
    role: "Médecine d'urgence",
    mode: "PRÉSENTIEL",
    title: "Infection urinaire",
    icons: ["graphic_eq", "link"],
    diagnostics: ["Cystite aiguë non compliquée"],
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
    diagnostics: [],
    details: "Subjectif : Patiente sans plainte particulière. Se dit en bonne santé. Pas de symptôme cardiovasculaire, respiratoire ou digestif. Sommeil satisfaisant. Énergie correcte. Stress professionnel modéré lié au travail en milieu scolaire. Contraception orale bien tolérée, pas d'oubli. Objectif : TA 116/72. Pouls 70 bpm. Poids 61 kg. IMC 22,4. Examen physique général sans anomalie. Auscultation cardio-pulmonaire normale. Abdomen souple, indolore. Pas d'adénopathie. Examen gynécologique non effectué (refusé par la patiente, à reprendre). Impression : Bonne santé générale.",
    conclusion: "Pas de problème actif identifié. Plan : Renouvellement contraceptif oral pour 1 an. Rappel dépistage col utérin à planifier. Conseils hygiéno-diététiques généraux. Retour au besoin.",
    files: [
      { name: "Exempleimage.jpg", size: "200KB" },
      { name: "Exempledocument.pdf", size: "220KB" },
    ],
  },
];

function roChipLabel(entity) {
  var d = entity.details || {};
  if (entity.type === 'prescription') {
    var rx = entity.rx || {};
    var name = rx.name || d.molecule || entity.label;
    var dose = rx.dose || (d.dose ? d.dose + ' ' + (d.unit || '') : '');
    var freq = d.frequency || rx.sig || '';
    return [name, dose, freq].filter(Boolean).join(' ');
  }
  if (entity.type === 'lab') return d.tests && d.tests.length ? d.tests.join(', ') : entity.label;
  if (entity.type === 'imaging') return [d.modality, d.region].filter(Boolean).join(' ') || entity.label;
  if (entity.type === 'referral') return d.specialty || entity.label;
  if (entity.type === 'problem') return d.name || entity.label;
  if (entity.type === 'instructions') return d.title || entity.label;
  return entity.label;
}

function roChipStyle(type) {
  var isRx = type === 'prescription';
  var isLab = type === 'lab';
  var isImg = type === 'imaging';
  var isRef = type === 'referral';
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: isRx || isLab || isImg || isRef ? '2px 8px 2px 6px' : '2px 9px 2px 7px',
    borderRadius: isRx || isLab || isImg || isRef ? 7 : 6,
    background: isRx || isLab || isImg || isRef ? '#fff' : 'var(--brand-primary-container, #e8e8ff)',
    border: isRx || isLab || isImg || isRef ? '1px solid #b9b9d0' : '1px solid var(--brand-primary, #3f3ec8)',
    color: isRx || isLab || isImg || isRef ? 'rgba(0,0,0,0.8)' : 'var(--brand-primary, #3f3ec8)',
    fontSize: 13, fontWeight: 500, verticalAlign: 'baseline',
    whiteSpace: 'nowrap', margin: '0 2px', lineHeight: 1.5,
    boxShadow: '0 1px 2px rgba(37,36,94,0.06)',
  };
}

// Render one line's content (plain text + inline chip pills) into an array.
function renderInline(text, chips, keyPrefix) {
  var out = [];
  (text || '').split(/(\{\{CHIP:[^}]+\}\})/g).forEach(function(p, i) {
    var m = /^\{\{CHIP:([^}]+)\}\}$/.exec(p);
    if (m) {
      var chip = chips && chips[m[1]];
      if (!chip || !chip.entity) return;
      var ent = chip.entity;
      var type = ent.type;
      var isPrx = type === 'prescription';
      var iconMap = { lab: 'science', imaging: 'radiology', referral: 'person_add', problem: 'flag', instructions: 'menu_book', diagnostic: 'local_hospital', file: 'attach_file' };
      var label = roChipLabel(ent);
      var iconColor = type === 'lab' ? '#1975d1' : type === 'imaging' ? '#7a3ec2' : type === 'referral' ? '#2e7d32' : '#25245E';
      out.push(
        <span key={keyPrefix + '-chip-' + i} style={roChipStyle(type)}>
          {isPrx
            ? <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: '#25245E', lineHeight: 1 }}>℞</span>
            : <span className="material-symbols-outlined" style={{ fontSize: 14, color: iconColor }}>{iconMap[type] || 'bookmark'}</span>
          }
          <span>{label}</span>
        </span>
      );
    } else if (p) {
      out.push(<React.Fragment key={keyPrefix + '-t-' + i}>{p}</React.Fragment>);
    }
  });
  return out;
}

// Render a run of lines (with <br> between) into an array of elements.
function renderLines(lines, chips, keyPrefix) {
  var out = [];
  lines.forEach(function(ln, li) {
    if (li > 0) out.push(<br key={keyPrefix + '-br-' + li} />);
    renderInline(ln, chips, keyPrefix + '-' + li).forEach(function(e) { out.push(e); });
  });
  return out;
}

const RO_DIAG_OPEN = /^\{\{DIAG:([A-Za-z0-9_-]+)\|([^}]*)\}\}$/;

// Read-only section renderer: walks lines, grouping {{DIAG:..}}…{{/DIAG}}
// regions into blue callout blocks; everything else is normal text + chips.
function SectionContent({ content, chips }) {
  var lines = (content || '').split('\n');
  var blocks = [];          // {type:'text', lines} | {type:'diag', name, lines}
  var textRun = [];
  var cur = null;
  function flushText() { if (textRun.length) { blocks.push({ type: 'text', lines: textRun }); textRun = []; } }
  lines.forEach(function(line) {
    var mo = RO_DIAG_OPEN.exec(line);
    if (mo) {
      flushText();
      var nm = '';
      try { nm = decodeURIComponent(mo[2]); } catch (e) { nm = mo[2]; }
      cur = { type: 'diag', name: nm, lines: [] };
      blocks.push(cur);
      return;
    }
    if (line === '{{/DIAG}}') { cur = null; return; }
    if (cur) cur.lines.push(line); else textRun.push(line);
  });
  flushText();

  var els = blocks.map(function(b, bi) {
    if (b.type === 'text') {
      var hasContent = b.lines.some(function(l) { return l.trim() || /\{\{CHIP:/.test(l); });
      if (!hasContent) return null;
      return <div key={'tb-' + bi}>{renderLines(b.lines, chips, 'tb' + bi)}</div>;
    }
    return (
      <div key={'db-' + bi} style={nlStyles.roDiag}>
        <div style={nlStyles.roDiagHeader}>
          <span className="material-icons-outlined" style={nlStyles.roDiagIcon}>local_hospital</span>
          <span style={nlStyles.roDiagName}>{b.name}</span>
        </div>
        <div style={nlStyles.roDiagBody}>{renderLines(b.lines, chips, 'db' + bi)}</div>
      </div>
    );
  });
  return <React.Fragment>{els}</React.Fragment>;
}

function NotesList({ doctorName = "Véronique Charland", extraNotes = [] }) {
  const NOTE_ITEMS = [
    ...extraNotes,
    ...NOTE_ITEMS_TEMPLATE.map(n => ({ ...n, author: n.author === "%%DOCTOR%%" ? doctorName : n.author })),
  ];
  const [openNotes, setOpenNotes] = React.useState({});
  const [activeFilters, setActiveFilters] = React.useState(new Set());

  const toggleFilter = (key) => setActiveFilters(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Filter chips derived from the notes: author names first, then specialties.
  const authors = [...new Set(NOTE_ITEMS.map(n => n.author))];
  const specialties = [...new Set(NOTE_ITEMS.map(n => n.role))];

  const filtered = NOTE_ITEMS.filter(n => {
    const authorKeys = [...activeFilters].filter(k => k.startsWith('author:'));
    const specKeys = [...activeFilters].filter(k => k.startsWith('spec:'));
    if (authorKeys.length && !authorKeys.includes('author:' + n.author)) return false;
    if (specKeys.length && !specKeys.includes('spec:' + n.role)) return false;
    return true;
  });

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
        {authors.map(a => (
          <AuthorChip key={'a-' + a} name={a} icon="person" active={activeFilters.has('author:' + a)} onToggle={() => toggleFilter('author:' + a)} />
        ))}
        {specialties.length > 0 && <span style={nlStyles.chipDivider} />}
        {specialties.map(s => (
          <AuthorChip key={'s-' + s} name={s} icon="badge" active={activeFilters.has('spec:' + s)} onToggle={() => toggleFilter('spec:' + s)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>Aucune note ne correspond aux filtres actifs.</div>
      )}
      {filtered.map((n, i) => {
        const origIdx = NOTE_ITEMS.indexOf(n);
        const isOpen = !!openNotes[origIdx];
        const starredSections = (n.sections || []).filter(function(s) { return s.starred; });
        return (
          <div key={origIdx} style={{ ...nlStyles.note, ...(i > 0 ? nlStyles.noteBorder : {}) }}>
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
                  <div style={nlStyles.noteTitle}>
                    {n.title}
                    {starredSections.length > 0 &&
                      <span className="material-icons" style={nlStyles.titleStarIcon} title="Contient une section importante">star</span>}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={nlStyles.actionIcons}>
                  <button style={nlStyles.checkoutBtn}>Checkout</button>
                  <button style={nlStyles.caretBtn} onClick={() => toggle(i)} aria-label={isOpen ? "Fermer" : "Ouvrir"}>
                    {isOpen
                      ? <span className="material-icons" style={nlStyles.caretIcon}>unfold_less</span>
                      : <span className="material-icons" style={nlStyles.caretIcon}>unfold_more</span>
                    }
                  </button>
                </div>
              </div>

              {/* Expanded: sections éditeur (nouvelles notes) ou détails texte (notes template) */}
              {isOpen && n.sections && n.sections.length > 0 ? (
                n.sections.map(function(sec, si) {
                  var hasContent = sec.content && sec.content.trim();
                  if (!hasContent) return null;
                  return (
                    <div key={sec.id || si} style={nlStyles.detailsSection}>
                      {(n.sections.length > 1 || sec.type === 'diagnostic') && (
                        <div style={nlStyles.detailsLabel}>
                          {sec.title}
                          {sec.starred &&
                            <span className="material-icons" style={nlStyles.titleStarIcon} title="Section importante">star</span>}
                        </div>
                      )}
                      <div style={nlStyles.detailsText}>
                        <SectionContent content={sec.content} chips={n.chips} />
                      </div>
                    </div>
                  );
                })
              ) : isOpen && n.details ? (
                <div style={nlStyles.detailsSection}>
                  <div style={nlStyles.detailsLabel}>Détails de la note</div>
                  <div style={nlStyles.detailsText}>
                    {n.details.split("\n").map((line, j) => (
                      <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Section(s) étoilée(s) — signal clinique partagé, visible même
                  repliée. Une fois la note ouverte, la section apparaît déjà
                  dans la liste complète ci-dessus (avec son étoile), donc on
                  évite le doublon. */}
              {!isOpen && starredSections.length > 0 && starredSections.map(function(sec, si) {
                var hasContent = sec.content && sec.content.trim();
                if (!hasContent) return null;
                return (
                  <div key={'star-' + (sec.id || si)} style={nlStyles.starredRow}>
                    <div style={nlStyles.starredHeader}>
                      <span className="material-icons" style={nlStyles.starredIcon}>star</span>
                      <span style={nlStyles.starredLabel}>{sec.title}</span>
                    </div>
                    <div style={nlStyles.starredBody}>
                      <SectionContent content={sec.content} chips={n.chips} />
                    </div>
                  </div>
                );
              })}

              {/* Diagnostics — always visible (collapsed only shows these) */}
              {n.diagnostics && n.diagnostics.length > 0 && (
                <div style={nlStyles.diagRow}>
                  {n.diagnostics.map((d, j) => (
                    <span key={j} style={nlStyles.diagChip}>
                      <span className="material-icons-outlined" style={nlStyles.diagChipIcon}>local_hospital</span>
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Conclusion — uniquement pour les notes template (n.conclusion) */}
              {isOpen && !n.sections && n.conclusion ? (
                <>
                  <div style={nlStyles.conclLabelWrap}>
                    <div style={nlStyles.conclLabelOpen}>Conclusion</div>
                  </div>
                  <div style={nlStyles.conclText}>
                    {n.conclusion.split("\n").map((line, j) => (
                      <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Files — only when expanded */}
              {isOpen && n.files && n.files.length > 0 && (
                <div style={nlStyles.fileRow}>
                  {n.files.map((f) => (
                    <span key={f.name} style={nlStyles.fileChip}>
                      <span className="material-icons-outlined" style={nlStyles.clipIcon}>attach_file</span>
                      <span style={nlStyles.fileName}>{f.name}</span>
                      <span style={nlStyles.fileSize}>{f.size}</span>
                    </span>
                  ))}
                </div>
              )}
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

function AuthorChip({ name, icon, active, onToggle }) {
  return (
    <span
      style={{
        ...nlStyles.authorChip,
        ...(active ? nlStyles.authorChipActive : {}),
      }}
      onClick={onToggle}
    >
      {icon && <span className="material-icons-outlined" style={{ ...nlStyles.chipIcon, color: active ? '#1975d1' : 'rgba(0,0,0,0.5)' }}>{icon}</span>}
      <span>{name}</span>
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
  chipRow: { display: "flex", gap: 12, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid #eee", flexWrap: "wrap", alignItems: "center" },
  chipDivider: { width: 1, height: 22, background: "#d8d8e4", margin: "0 2px" },
  authorChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #c9c9e0", borderRadius: 20, padding: "5px 12px 5px 8px",
    fontSize: 14, color: "rgba(0,0,0,0.78)", cursor: "pointer",
    userSelect: "none", transition: "background 0.12s, border-color 0.12s",
  },
  authorChipActive: {
    background: "#e8f0fb", borderColor: "#1975d1", color: "#1975d1",
  },
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
  titleStarIcon: { fontSize: 16, color: "#f59e0b", marginLeft: 6, verticalAlign: "middle" },
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
  starredRow: { margin: '2px 0 12px', border: '1px solid #f5d896', borderRadius: 10, overflow: 'hidden', background: '#fffaf0' },
  starredHeader: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: '#fef3dd' },
  starredIcon: { fontSize: 15, color: '#f59e0b' },
  starredLabel: { fontSize: 13, fontWeight: 600, color: '#92670c' },
  starredBody: { padding: '8px 12px', fontSize: 14, color: 'rgba(0,0,0,0.8)', lineHeight: 1.5 },
  diagRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, marginTop: 2 },
  diagChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#e8f0fb', border: '1px solid #b3ccf0', borderRadius: 20,
    padding: '4px 12px 4px 8px', fontSize: 13, color: '#1a5fd4', fontWeight: 500,
  },
  diagChipIcon: { fontSize: 14, color: '#1a5fd4' },
  roDiag: { margin: '8px 0', border: '1px solid #b3ccf0', borderRadius: 10, overflow: 'hidden' },
  roDiagHeader: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#e8f0fb', padding: '6px 12px',
  },
  roDiagIcon: { fontSize: 16, color: '#1a5fd4' },
  roDiagName: { fontSize: 14, fontWeight: 600, color: '#1a5fd4' },
  roDiagBody: { background: '#f5f9ff', padding: '8px 12px', fontSize: 15, color: 'rgba(0,0,0,0.82)', lineHeight: 1.6 },
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
