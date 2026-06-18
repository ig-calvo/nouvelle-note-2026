/* global React, useStore, Sheet, DlgHead, Star, toast */
// =========================================================
// Problems.jsx — Problèmes / Antécédents drawer
// =========================================================
function ProblemsPanel({ kind, onClose }) {
  const { state, update } = useStore();
  const [sortMode, setSortMode] = React.useState(false);
  const isProblem = kind === "probleme";
  const title = isProblem ? "Problèmes" : "Antécédents médicaux";
  const list = state.problems.filter((p) => p.kind === kind);

  const toggleStar = (id) => update((s) => { const p = s.problems.find((x) => x.id === id); if (p) p.starred = !p.starred; return s; });
  const flip = (id) => {
    update((s) => { const p = s.problems.find((x) => x.id === id); if (p) p.kind = p.kind === "probleme" ? "antecedent" : "probleme"; return s; });
    toast(isProblem ? "Déplacé vers les antécédents" : "Déplacé vers les problèmes");
  };
  const move = (id, dir) => update((s) => {
    const idsOfKind = s.problems.filter((p) => p.kind === kind).map((p) => p.id);
    const pos = idsOfKind.indexOf(id);
    const swap = pos + dir;
    if (swap < 0 || swap >= idsOfKind.length) return s;
    // find global indexes
    const gi = s.problems.findIndex((p) => p.id === idsOfKind[pos]);
    const gj = s.problems.findIndex((p) => p.id === idsOfKind[swap]);
    const tmp = s.problems[gi]; s.problems[gi] = s.problems[gj]; s.problems[gj] = tmp;
    return s;
  });

  return (
    <Sheet kind="drawer-md" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon={isProblem ? "healing" : "history"} overline="Sommaire" title={title} onClose={close}
            actions={
              <button className={"btn btn-sm " + (sortMode ? "btn-primary" : "btn-outline")} onClick={() => setSortMode((m) => !m)}>
                <span className="material-icons-outlined">{sortMode ? "check" : "swap_vert"}</span>
                {sortMode ? "Terminer le tri" : "Trier la liste"}
              </button>}
          />
          <div className="dlg-body">
            <div className="hint-note" style={{ marginBottom: 12 }}>
              <span className="material-icons-outlined">info</span>
              {sortMode
                ? "Réorganisez avec les flèches. L'ordre est persisté pour tous les intervenants."
                : `L'étoile met l'élément au sommaire. L'icône ${isProblem ? "↔ déplace vers les antécédents" : "↔ déplace vers les problèmes"}.`}
            </div>
            {list.length === 0 && <div className="empty-state"><span className="material-icons-outlined">{isProblem ? "healing" : "history"}</span>Aucun élément.</div>}
            {list.map((p, i) =>
              <div key={p.id} className="list-li">
                {sortMode
                  ? <span style={{ display: "flex", flexDirection: "column" }}>
                      <button className="icon-btn" style={{ height: 22 }} disabled={i === 0} onClick={() => move(p.id, -1)}><span className="material-icons-outlined" style={{ opacity: i === 0 ? .3 : 1 }}>keyboard_arrow_up</span></button>
                      <button className="icon-btn" style={{ height: 22 }} disabled={i === list.length - 1} onClick={() => move(p.id, 1)}><span className="material-icons-outlined" style={{ opacity: i === list.length - 1 ? .3 : 1 }}>keyboard_arrow_down</span></button>
                    </span>
                  : <Star on={p.starred} onClick={() => toggleStar(p.id)} />}
                <div className="ll-main">
                  <div className="ll-title">{p.name}</div>
                  <div className="ll-sub">{p.status !== "—" ? <span className={"tag " + (p.status === "actif" ? "active" : "resolu")} style={{ marginRight: 8 }}>{p.status}</span> : null}Depuis {p.since}</div>
                </div>
                {!sortMode &&
                  <button className="icon-btn" title={isProblem ? "Déplacer vers antécédents" : "Déplacer vers problèmes"} onClick={() => flip(p.id)}>
                    <span className="material-icons-outlined">swap_horiz</span>
                  </button>}
              </div>)}
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

Object.assign(window, { ProblemsPanel });
