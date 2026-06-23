/* global React, useStore, Sheet, DlgHead, toast, todayISO, appendLog */
// =========================================================
// ConsentModal.jsx — punctual consent logging
// =========================================================

function ConsentModal({ onClose }) {
  const { update } = useStore();
  const [consentGivenBy, setConsentGivenBy] = React.useState("");
  const [onBehalfOf, setOnBehalfOf] = React.useState("");

  const save = (close) => {
    const entry = {
      id: "cons-" + Date.now(),
      timestamp: new Date().toISOString(),
      userId: "usr-001",
      userName: window._currentUser || "Dr Véronique Charland",
      consentGivenByName: consentGivenBy.trim(),
      onBehalfOf: onBehalfOf.trim() || null,
      patientDossier: "12345678",
      gmfConsent: false,
    };
    update((s) => {
      if (!s.consentLog) s.consentLog = [];
      s.consentLog.push(entry);
      return s;
    });
    appendLog("consent", {
      consentGivenBy: entry.consentGivenByName,
      onBehalfOf: entry.onBehalfOf
    });
    toast("Consentement ponctuel enregistré", { icon: "how_to_reg" });
    close();
  };

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="how_to_reg" overline="Consentement ponctuel" title="Enregistrer un consentement" onClose={close} />
          <div className="dlg-body">
            <div className="hint-note" style={{ marginBottom: 16 }}>
              <span className="material-icons-outlined">info</span>
              Le consentement ponctuel est requis lorsque le patient ou son représentant autorise la consultation de son dossier.
            </div>

            <div className="field">
              <label>Consentement donné par <span style={{ color: "var(--s-red)" }}>*</span></label>
              <input
                className="input"
                placeholder="Nom de la personne qui donne le consentement"
                value={consentGivenBy}
                onChange={(e) => setConsentGivenBy(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label>Au nom de (si représentant)</label>
              <input
                className="input"
                placeholder="Laisser vide si la personne est le patient"
                value={onBehalfOf}
                onChange={(e) => setOnBehalfOf(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Intervenant qui reçoit le consentement</label>
              <input
                className="input"
                value={window._currentUser || "Dr Véronique Charland"}
                readOnly
                style={{ background: "var(--s-bg-1)", color: "var(--s-ink-3)" }}
              />
            </div>
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button
              className="btn btn-primary"
              disabled={!consentGivenBy.trim()}
              onClick={() => save(close)}
            >
              <span className="material-icons-outlined">check</span>
              Enregistrer le consentement
            </button>
          </div>
        </>)}
    </Sheet>);
}

Object.assign(window, { ConsentModal });
