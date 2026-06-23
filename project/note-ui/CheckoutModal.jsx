/* global React */
// =========================================================
// CheckoutModal — « Envoi » / complétion de la note
// Liste les prescriptions, requêtes et consignes patient à
// transmettre, regroupées par destination. Permet de choisir
// un destinataire, de suggérer des pièces jointes et d'ajouter
// un commentaire par section. À la confirmation, l'envoi est
// simulé (transparent) puis une confirmation est affichée avant
// de finaliser la note.
// =========================================================

// Métadonnées par type de destination. La clé correspond au `key`
// des groupes calculés dans NoteEditor (pharmacie / laboratoire / …).
const CM_GROUPS = {
  pharmacie: {
    title: 'Pharmacie',
    icon: 'local_pharmacy',
    accent: '#1975d1',
    itemIcon: 'medication',
    recipients: [
      'PJC Jean-coutu Centre-ville',
      'Pharmacie Brunet — Wellington Sud',
      'Uniprix — King Ouest',
      'Remettre au patient (papier)',
    ],
    attachments: [
      { label: 'Ordonnance (PDF)', on: true },
      { label: 'Liste de médicaments active', on: false },
      { label: 'Note clinique', on: false },
    ],
    commentPh: 'Note pour le pharmacien (optionnel)…',
  },
  laboratoire: {
    title: 'Laboratoire',
    icon: 'science',
    accent: '#2e9b7a',
    itemIcon: 'science',
    recipients: [
      'CIUSSS de l’Estrie — CHUS',
      'Biron Groupe Santé',
      'Dynacare',
      'Au centre hospitalier le plus proche',
    ],
    attachments: [
      { label: 'Requête de laboratoire (PDF)', on: true },
      { label: 'Note clinique pertinente', on: false },
    ],
    commentPh: 'Renseignements cliniques pour le laboratoire (optionnel)…',
  },
  imagerie: {
    title: 'Imagerie médicale',
    icon: 'radiology',
    accent: '#7a5cc0',
    itemIcon: 'radiology',
    recipients: [
      'Radiologie CHUS — Hôpital Fleurimont',
      'Clinique de radiologie de Sherbrooke',
      'Centre d’imagerie médicale de l’Estrie',
    ],
    attachments: [
      { label: 'Requête d’imagerie (PDF)', on: true },
      { label: 'Note clinique pertinente', on: false },
      { label: 'Imagerie antérieure', on: false },
    ],
    commentPh: 'Indication clinique pour le radiologiste (optionnel)…',
  },
  specialiste: {
    title: 'Référence — spécialiste',
    icon: 'person_add',
    accent: '#c0693c',
    itemIcon: 'person_add',
    recipients: [
      'CRDS Estrie — Centre de répartition des demandes de service',
      'Cardiologie — CHUS',
      'Orthopédie — CHUS',
      'Dermatologie — Clinique privée',
    ],
    attachments: [
      { label: 'Lettre de référence (PDF)', on: true },
      { label: 'Note clinique', on: true },
      { label: 'Résultats de laboratoire récents', on: false },
      { label: 'Imagerie récente', on: false },
    ],
    commentPh: 'Question de consultation / motif (optionnel)…',
  },
  patient: {
    title: 'Patient',
    icon: 'person',
    accent: '#1975d1',
    itemIcon: 'menu_book',
    recipients: [
      'Portail patient — julie.tremblay.test@example.com',
      'Courriel sécurisé',
      'Imprimer et remettre en main propre',
    ],
    attachments: [
      { label: 'Consignes au patient (PDF)', on: true },
      { label: 'Feuille de route', on: false },
      { label: 'Résumé de la visite', on: false },
    ],
    commentPh: 'Message personnel au patient (optionnel)…',
  },
};

// Options des listes déroulantes « faire suivre » + signature.
const CM_FORWARD_OPTS = [
  'Ne pas faire suivre',
  'Médecin de famille',
  'Médecin référent',
  'Patient (portail sécurisé)',
  'Autre professionnel de la santé',
];
const CM_OTHER_DOCTORS = ['Dr Marc Lefebvre', 'Dre Sophie Bouchard', 'Dr Julien Gagnon'];
const CM_OTHER_INSTITUTIONS = ['Hôpital Fleurimont — CHUS', 'GMF Sherbrooke-Est', 'Clinique médicale King Ouest'];

function CheckoutModal({ groups, doctorName, institution, note, onCancel, onConfirm }) {
  const cfgGroups = (groups || []).filter(function (g) { return CM_GROUPS[g.key]; });
  const isEmpty = cfgGroups.length === 0;
  const noteInfo = note || {};
  const docName = doctorName || 'Médecin actuel';
  const instName = institution || 'Établissement actuel';
  const doctorOpts = [docName].concat(CM_OTHER_DOCTORS.filter(function (d) { return d !== docName; }));
  const instOpts = [instName].concat(CM_OTHER_INSTITUTIONS.filter(function (i) { return i !== instName; }));

  const [phase, setPhase] = React.useState('review'); // review | sending | done
  const [recipientOpen, setRecipientOpen] = React.useState(null);
  const [forwardIdx, setForwardIdx] = React.useState(0);
  const [doctorIdx, setDoctorIdx] = React.useState(0);
  const [instIdx, setInstIdx] = React.useState(0);

  // recipients[key] = index dans CM_GROUPS[key].recipients
  const [recipients, setRecipients] = React.useState(function () {
    const init = {};
    cfgGroups.forEach(function (g) { init[g.key] = 0; });
    return init;
  });
  // attach[key] = { [label]: bool }
  const [attach, setAttach] = React.useState(function () {
    const init = {};
    cfgGroups.forEach(function (g) {
      const m = {};
      CM_GROUPS[g.key].attachments.forEach(function (a) { m[a.label] = a.on; });
      init[g.key] = m;
    });
    return init;
  });
  const [comments, setComments] = React.useState({});

  React.useEffect(function () {
    function onKey(e) {
      if (e.key === 'Escape' && phase === 'review') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [phase, onCancel]);

  const totalDocs = cfgGroups.reduce(function (n, g) { return n + g.items.length; }, 0);

  function attachCount(key) {
    const m = attach[key] || {};
    return Object.keys(m).filter(function (l) { return m[l]; }).length;
  }
  function recipientLabel(key) {
    return CM_GROUPS[key].recipients[recipients[key] || 0];
  }

  function toggleAttach(key, label) {
    setAttach(function (a) {
      const next = Object.assign({}, a);
      next[key] = Object.assign({}, next[key]);
      next[key][label] = !next[key][label];
      return next;
    });
  }
  function pickRecipient(key, idx) {
    setRecipients(function (r) { const n = Object.assign({}, r); n[key] = idx; return n; });
    setRecipientOpen(null);
  }

  function startSend() {
    if (isEmpty) { setPhase('sending'); }
    else { setPhase('sending'); }
    // Envoi simulé (transparent) : court délai puis confirmation.
    setTimeout(function () { setPhase('done'); }, 1100);
  }

  function overlayDown() { if (phase === 'review') onCancel(); }

  function fmtNoteDate() {
    const parts = (noteInfo.date || '').split('-');
    const human = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : (noteInfo.date || '');
    return [human, noteInfo.time].filter(Boolean).join(' ');
  }

  // Liste déroulante générique — réutilise le style des destinataires.
  function metaDropdown(openKey, value, options, onPick, leadIcon) {
    const open = recipientOpen === openKey;
    return (
      <div style={{ position: 'relative' }}>
        <button style={Object.assign({}, cm.recipientBtn, open ? cm.recipientBtnOpen : {})}
          onClick={function () { setRecipientOpen(open ? null : openKey); }}>
          {leadIcon ? <span className="material-icons-outlined" style={{ fontSize: 18, color: '#6a6a86' }}>{leadIcon}</span> : null}
          <span style={cm.recipientText}>{value}</span>
          <span className="material-icons" style={{ fontSize: 22, color: 'rgba(0,0,0,0.4)' }}>arrow_drop_down</span>
        </button>
        {open &&
          <React.Fragment>
            <div style={cm.ddScrim} onMouseDown={function () { setRecipientOpen(null); }} />
            <div style={cm.ddList}>
              {options.map(function (o, i) {
                const sel = o === value;
                return (
                  <button key={i} style={Object.assign({}, cm.ddOption, sel ? cm.ddOptionSel : {})}
                    onClick={function () { onPick(i); setRecipientOpen(null); }}>
                    <span className="material-icons" style={{ fontSize: 18, color: sel ? '#1975d1' : 'transparent' }}>check</span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        }
      </div>
    );
  }

  // Bloc « faire suivre la note » + signature — affiché dans les deux états.
  function renderMetaSection() {
    return (
      <div style={cm.metaSection}>
        <div style={cm.fieldBlock}>
          <div style={cm.fieldLabel}>Faire suivre la note</div>
          <div style={cm.noteTile}>
            <span style={cm.noteTileIcon}>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: '#25245E' }}>description</span>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={cm.noteTileTitle}>{noteInfo.title || 'Note clinique'}</div>
              <div style={cm.noteTileMeta}>{[fmtNoteDate(), docName, instName].filter(Boolean).join(' · ')}</div>
            </div>
            {noteInfo.visitType ? <span style={cm.noteTileBadge}>{noteInfo.visitType}</span> : null}
          </div>
          <div style={{ marginTop: 8 }}>
            {metaDropdown('forward', CM_FORWARD_OPTS[forwardIdx], CM_FORWARD_OPTS, setForwardIdx, 'send')}
          </div>
        </div>

        <div style={cm.fieldBlock}>
          <div style={cm.fieldLabel}>Signature</div>
          <div style={cm.sigRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={cm.subLabel}>Médecin</div>
              {metaDropdown('doctor', doctorOpts[doctorIdx], doctorOpts, setDoctorIdx, 'badge')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={cm.subLabel}>Établissement</div>
              {metaDropdown('inst', instOpts[instIdx], instOpts, setInstIdx, 'business')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Confirmation (succès) ----
  if (phase === 'done') {
    return (
      <div style={cm.overlay}>
        <div style={cm.dialog} role="dialog" aria-modal="true">
          <div style={cm.doneWrap}>
            <div style={cm.doneCheckCircle}>
              <span className="material-icons" style={{ fontSize: 46, color: '#fff' }}>check</span>
            </div>
            <div style={cm.doneTitle}>Envoi réussi</div>
            <div style={cm.doneSub}>
              {isEmpty
                ? 'La note a été complétée et classée dans le Journal de notes.'
                : totalDocs + ' document' + (totalDocs > 1 ? 's' : '') + ' transmis à ' + cfgGroups.length + ' destination' + (cfgGroups.length > 1 ? 's' : '') + '.'}
            </div>

            {!isEmpty &&
              <div style={cm.doneList}>
                {cfgGroups.map(function (g) {
                  const c = CM_GROUPS[g.key];
                  return (
                    <div key={g.key} style={cm.doneRow}>
                      <span className="material-icons" style={{ fontSize: 18, color: '#2e9b7a', flexShrink: 0 }}>check_circle</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={cm.doneRowTitle}>{c.title} · {g.items.length} document{g.items.length > 1 ? 's' : ''}</div>
                        <div style={cm.doneRowDest}>{recipientLabel(g.key)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }

            <div style={cm.doneMeta}>
              <span className="material-icons-outlined" style={{ fontSize: 17, color: 'rgba(0,0,0,0.45)' }}>draw</span>
              Signé par {doctorOpts[doctorIdx]} · {instOpts[instIdx]}
            </div>
            {forwardIdx > 0 &&
              <div style={cm.doneMeta}>
                <span className="material-icons-outlined" style={{ fontSize: 17, color: 'rgba(0,0,0,0.45)' }}>forward_to_inbox</span>
                Note transmise à {CM_FORWARD_OPTS[forwardIdx]}
              </div>
            }
            <div style={cm.doneNoteSaved}>
              <span className="material-icons-outlined" style={{ fontSize: 18, color: '#1975d1' }}>task_alt</span>
              Note sauvegardée et ajoutée au Journal de notes
            </div>

            <button style={cm.primaryBtn} onClick={onConfirm}>Terminer</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Envoi en cours ----
  if (phase === 'sending') {
    return (
      <div style={cm.overlay}>
        <div style={cm.dialog} role="dialog" aria-modal="true">
          <div style={cm.doneWrap}>
            <span className="material-icons" style={{ fontSize: 48, color: '#1975d1', animation: 'ai-spin 0.8s linear infinite' }}>autorenew</span>
            <div style={cm.doneTitle}>Envoi en cours…</div>
            <div style={cm.doneSub}>Transmission des documents aux destinataires.</div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Révision (état principal) ----
  return (
    <div style={cm.overlay} onMouseDown={overlayDown}>
      <div style={cm.dialog} onMouseDown={function (e) { e.stopPropagation(); }} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={cm.head}>
          <div>
            <div style={cm.title}>Finaliser et envoyer</div>
            <div style={cm.subtitle}>
              {isEmpty
                ? 'Aucun document à transmettre pour cette note.'
                : 'Vérifiez les destinataires avant de compléter la note.'}
            </div>
          </div>
          <button style={cm.closeBtn} onClick={onCancel} aria-label="Fermer">
            <span className="material-icons" style={{ fontSize: 24, color: 'rgba(0,0,0,0.55)' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={cm.body}>
          {isEmpty &&
            <div style={cm.emptyState}>
              <span className="material-icons-outlined" style={{ fontSize: 40, color: '#b9b9cc' }}>outbox</span>
              <div style={{ fontSize: 14.5, color: 'rgba(0,0,0,0.6)', marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
                Cette note ne contient aucune prescription, requête ou consigne à envoyer.<br />
                Vous pouvez la compléter directement.
              </div>
            </div>
          }

          {cfgGroups.map(function (g) {
            const c = CM_GROUPS[g.key];
            const ddOpen = recipientOpen === g.key;
            return (
              <div key={g.key} style={cm.card}>
                {/* Card head */}
                <div style={cm.cardHead}>
                  <span style={Object.assign({}, cm.cardIcon, { background: c.accent + '1a', color: c.accent })}>
                    <span className="material-icons-outlined" style={{ fontSize: 20 }}>{c.icon}</span>
                  </span>
                  <span style={cm.cardTitle}>{c.title}</span>
                  <span style={cm.countBadge}>{g.items.length}</span>
                </div>

                {/* Items */}
                <div style={cm.items}>
                  {g.items.map(function (it) {
                    return (
                      <div key={it.id} style={cm.item}>
                        <span className="material-icons-outlined" style={{ fontSize: 18, color: c.accent, flexShrink: 0, marginTop: 1 }}>{c.itemIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={cm.itemLabel}>{it.label}</div>
                          {it.sub ? <div style={cm.itemSub}>{it.sub}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recipient */}
                <div style={cm.fieldBlock}>
                  <div style={cm.fieldLabel}>Destinataire</div>
                  <div style={{ position: 'relative' }}>
                    <button
                      style={Object.assign({}, cm.recipientBtn, ddOpen ? cm.recipientBtnOpen : {})}
                      onClick={function () { setRecipientOpen(ddOpen ? null : g.key); }}>
                      <span className="material-icons-outlined" style={{ fontSize: 18, color: c.accent }}>send</span>
                      <span style={cm.recipientText}>{recipientLabel(g.key)}</span>
                      <span className="material-icons" style={{ fontSize: 22, color: 'rgba(0,0,0,0.4)' }}>arrow_drop_down</span>
                    </button>
                    {ddOpen &&
                      <React.Fragment>
                        <div style={cm.ddScrim} onMouseDown={function () { setRecipientOpen(null); }} />
                        <div style={cm.ddList}>
                          {c.recipients.map(function (r, idx) {
                            const sel = (recipients[g.key] || 0) === idx;
                            return (
                              <button key={idx} style={Object.assign({}, cm.ddOption, sel ? cm.ddOptionSel : {})}
                                onClick={function () { pickRecipient(g.key, idx); }}>
                                <span className="material-icons" style={{ fontSize: 18, color: sel ? c.accent : 'transparent' }}>check</span>
                                <span>{r}</span>
                              </button>
                            );
                          })}
                        </div>
                      </React.Fragment>
                    }
                  </div>
                </div>

                {/* Attachments */}
                <div style={cm.fieldBlock}>
                  <div style={cm.fieldLabel}>Pièces jointes <span style={cm.fieldHint}>· suggestions</span></div>
                  <div style={cm.attachWrap}>
                    {c.attachments.map(function (a) {
                      const on = !!(attach[g.key] && attach[g.key][a.label]);
                      return (
                        <button key={a.label}
                          style={Object.assign({}, cm.attachChip, on ? Object.assign({}, cm.attachChipOn, { border: '1.5px solid ' + c.accent, color: c.accent }) : {})}
                          onClick={function () { toggleAttach(g.key, a.label); }}>
                          <span className="material-icons" style={{ fontSize: 17, color: on ? c.accent : 'rgba(0,0,0,0.35)' }}>
                            {on ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment */}
                <div style={cm.fieldBlock}>
                  <textarea
                    style={cm.comment}
                    rows={2}
                    placeholder={c.commentPh}
                    value={comments[g.key] || ''}
                    onChange={function (e) {
                      const v = e.target.value;
                      setComments(function (cs) { const n = Object.assign({}, cs); n[g.key] = v; return n; });
                    }} />
                </div>
              </div>
            );
          })}

          {renderMetaSection()}
        </div>

        {/* Footer */}
        <div style={cm.footer}>
          <div style={cm.footerSummary}>
            {!isEmpty &&
              <React.Fragment>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: 'rgba(0,0,0,0.45)' }}>outbox</span>
                {totalDocs} document{totalDocs > 1 ? 's' : ''} · {cfgGroups.length} destination{cfgGroups.length > 1 ? 's' : ''}
              </React.Fragment>
            }
          </div>
          <button style={cm.cancelBtn} onClick={onCancel}>Annuler</button>
          <button style={cm.primaryBtn} onClick={startSend}>
            {isEmpty ? 'Compléter la note' : 'Compléter et envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

const cm = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4000, animation: 'snm-fade 140ms ease-out',
  },
  dialog: {
    width: 640, maxWidth: 'calc(100vw - 40px)', maxHeight: '88vh',
    background: '#fff', borderRadius: 18, boxShadow: '0 18px 48px rgba(20,20,50,0.32)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", animation: 'snm-pop 160ms cubic-bezier(.2,.8,.3,1)',
  },
  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '22px 26px 16px', borderBottom: '1px solid #f0f0f6', flexShrink: 0,
  },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 21, color: 'rgba(0,0,0,0.88)' },
  subtitle: { fontSize: 13.5, color: 'rgba(0,0,0,0.5)', marginTop: 3 },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex', marginTop: 1 },

  body: { padding: '14px 26px 6px', overflowY: 'auto', flex: 1 },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '34px 10px 30px' },

  card: {
    border: '1px solid #ececf2', borderRadius: 14, padding: '14px 16px 16px',
    marginBottom: 14, background: '#fcfcfe',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: {
    width: 34, height: 34, borderRadius: 9, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15.5, color: 'rgba(0,0,0,0.82)', flex: 1 },
  countBadge: {
    minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11, background: '#eef1fb',
    color: '#25245E', fontSize: 12.5, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  items: { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 13, paddingLeft: 2 },
  item: { display: 'flex', alignItems: 'flex-start', gap: 9 },
  itemLabel: { fontSize: 14, color: 'rgba(0,0,0,0.82)', lineHeight: 1.35, fontWeight: 500 },
  itemSub: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 1, lineHeight: 1.3 },

  fieldBlock: { marginTop: 11 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldHint: { fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'rgba(0,0,0,0.38)' },

  recipientBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid #d8d8e4', borderRadius: 9, background: '#fff',
    padding: '9px 10px 9px 12px', cursor: 'pointer', textAlign: 'left',
    font: "500 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.82)',
  },
  recipientBtnOpen: { border: '1.5px solid #1975d1', boxShadow: '0 0 0 3px rgba(25,117,209,0.13)' },
  recipientText: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  ddScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  ddList: {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 11,
    background: '#fff', border: '1px solid #e2e2ec', borderRadius: 10,
    boxShadow: '0 10px 28px rgba(20,20,50,0.16)', padding: '5px 0', maxHeight: 240, overflowY: 'auto',
  },
  ddOption: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
    border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
    padding: '9px 13px', font: "500 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.78)',
  },
  ddOptionSel: { color: '#1975d1', background: '#f5f8fe' },

  attachWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  attachChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1.5px solid #dcdce8', borderRadius: 9, background: '#fff',
    padding: '6px 11px 6px 8px', cursor: 'pointer',
    font: "500 13px 'Inter',sans-serif", color: 'rgba(0,0,0,0.6)',
  },
  attachChipOn: { background: '#f5f8fe' },

  comment: {
    width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 40,
    border: '1.5px solid #e2e2ec', borderRadius: 9, padding: '9px 11px',
    font: "400 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.82)', outline: 'none',
  },

  // « Faire suivre » + signature
  metaSection: { borderTop: '1px solid #f0f0f6', marginTop: 4, paddingTop: 14 },
  subLabel: { fontSize: 11.5, fontWeight: 500, color: 'rgba(0,0,0,0.5)', marginBottom: 5 },
  sigRow: { display: 'flex', gap: 12 },
  noteTile: {
    display: 'flex', alignItems: 'center', gap: 11,
    border: '1px solid #e2e2ec', borderRadius: 10, background: '#f7f9fc', padding: '11px 13px',
  },
  noteTileIcon: {
    width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: '#eef1fb',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  noteTileTitle: { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.82)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileMeta: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileBadge: {
    flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#25245E',
    background: '#eef1fb', borderRadius: 6, padding: '3px 8px', letterSpacing: 0.2,
  },
  doneMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: 500 },

  footer: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 26px', borderTop: '1px solid #f0f0f6', flexShrink: 0,
  },
  footerSummary: { flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: 500 },
  cancelBtn: { border: 0, background: 'transparent', cursor: 'pointer', font: "600 14px 'Inter',sans-serif", color: '#25245E', padding: '9px 14px' },
  primaryBtn: { border: 0, borderRadius: 9, background: '#25245E', cursor: 'pointer', font: "600 14px 'Inter',sans-serif", color: '#fff', padding: '11px 22px' },

  // Confirmation / sending
  doneWrap: { padding: '40px 36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  doneCheckCircle: {
    width: 72, height: 72, borderRadius: '50%', background: '#2e9b7a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    boxShadow: '0 6px 18px rgba(46,155,122,0.35)',
  },
  doneTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 22, color: 'rgba(0,0,0,0.88)' },
  doneSub: { fontSize: 14.5, color: 'rgba(0,0,0,0.55)', marginTop: 6, maxWidth: 420, lineHeight: 1.5 },
  doneList: { width: '100%', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' },
  doneRow: { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f7f9fc', borderRadius: 10, padding: '11px 13px' },
  doneRowTitle: { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.8)' },
  doneRowDest: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  doneNoteSaved: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 22,
    fontSize: 13.5, color: 'rgba(0,0,0,0.6)', fontWeight: 500,
  },
};

window.CheckoutModal = CheckoutModal;
