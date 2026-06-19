// =========================================================
// popover.jsx — Chip popover + slash menu
// =========================================================
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

function ChipPopover({ chip, anchorRect, onClose, onSave, onRevert, onDelete }) {
  const [draft, setDraft] = useStateP(chip.entity);
  const ref = useRefP(null);
  useEffectP(() => { setDraft(chip.entity); }, [chip.id]);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.chip')) onClose(); }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  if (!anchorRect) return null;
  const top = anchorRect.bottom + 8;
  let left = anchorRect.left;
  if (left + 380 > window.innerWidth - 16) left = window.innerWidth - 396;
  const meta = window.NOTE_DATA.ENTITY_TYPES[draft.type] || {};
  function up(f, v) { setDraft(d => ({ ...d, details: { ...d.details, [f]: v } })); }
  return (
    <div className="popover" ref={ref} style={{ top, left }} role="dialog">
      <div className="popover-head">
        <span className="ic"><span className="material-symbols-outlined">{meta.icon}</span></span>
        <div className="grow">
          <div className="ttl">{meta.label}</div>
          <div className="sub">Modifier les détails structurés</div>
        </div>
        <button className="close" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="popover-body">
        {draft.type === 'prescription' && <RxFields d={draft.details} up={up} />}
        {draft.type === 'lab' && <LabFields d={draft.details} up={up} />}
        {draft.type === 'imaging' && <ImgFields d={draft.details} up={up} />}
        {draft.type === 'problem' && <PbFields d={draft.details} up={up} />}
        {draft.type === 'instructions' && <InsFields d={draft.details} up={up} />}
        {draft.type === 'referral' && <RefFields d={draft.details} up={up} />}
      </div>
      <div className="popover-footer">
        <button className="btn btn-t btn-sm" onClick={() => onRevert(chip.id)}>
          <span className="material-symbols-outlined">undo</span>Reconvertir en texte
        </button>
        <span className="grow" />
        <button className="btn btn-o btn-sm" onClick={() => onDelete(chip.id)}>
          <span className="material-symbols-outlined">delete</span>
        </button>
        <button className="btn btn-p btn-sm" onClick={() => onSave(chip.id, draft)}>Confirmer</button>
      </div>
    </div>
  );
}

function RxFields({ d, up }) {
  return (<>
    <div className="field"><label>Molécule</label><input value={d.molecule} onChange={e => up('molecule', e.target.value)} /></div>
    <div className="row3">
      <div className="field"><label>Dose</label><input value={d.dose} onChange={e => up('dose', e.target.value)} /></div>
      <div className="field"><label>Unité</label>
        <select value={d.unit} onChange={e => up('unit', e.target.value)}>
          <option>mg</option><option>g</option><option>mcg</option><option>mcg/inh</option><option>mL</option>
        </select></div>
      <div className="field"><label>Forme</label>
        <select value={d.form} onChange={e => up('form', e.target.value)}>
          <option>comprimé</option><option>gélule</option><option>sirop</option><option>aérosol-doseur</option>
        </select></div>
    </div>
    <div className="row">
      <div className="field"><label>Voie</label>
        <select value={d.route} onChange={e => up('route', e.target.value)}>
          <option>PO</option><option>IM</option><option>IV</option><option>SC</option><option>Inhalé</option>
        </select></div>
      <div className="field"><label>Fréquence</label>
        <select value={d.frequency} onChange={e => up('frequency', e.target.value)}>
          <option>DIE</option><option>BID</option><option>TID</option><option>QID</option><option>HS</option><option>q4-6h PRN</option><option>QID PRN</option>
        </select></div>
    </div>
    <div className="row3">
      <div className="field"><label>Durée</label><input value={d.duration} onChange={e => up('duration', e.target.value)} /></div>
      <div className="field"><label>Unité</label>
        <select value={d.durationUnit} onChange={e => up('durationUnit', e.target.value)}>
          <option value="jours">jours</option><option value="semaines">semaines</option><option value="mois">mois</option><option value="">—</option>
        </select></div>
      <div className="field"><label>Renouv.</label><input value={d.refills} onChange={e => up('refills', e.target.value)} /></div>
    </div>
    <div className="row">
      <div className="field"><label>Quantité</label><input value={d.quantity} onChange={e => up('quantity', e.target.value)} /></div>
      <div className="field"><label>Indication</label><input value={d.indication} onChange={e => up('indication', e.target.value)} /></div>
    </div>
    <div className="field"><label>Notes</label><textarea rows={2} value={d.notes} onChange={e => up('notes', e.target.value)} /></div>
  </>);
}
function LabFields({ d, up }) { return (<>
  <div className="field"><label>Analyses</label><textarea rows={2} value={(d.tests||[]).join(', ')} onChange={e => up('tests', e.target.value.split(',').map(s=>s.trim()))} /></div>
  <div className="row">
    <div className="field"><label>Priorité</label><select value={d.priority} onChange={e=>up('priority', e.target.value)}><option>Routine</option><option>Semi-urgent</option><option>Urgent</option></select></div>
    <div className="field"><label>À jeun</label><select value={d.fasting?'oui':'non'} onChange={e=>up('fasting', e.target.value==='oui')}><option value="non">Non</option><option value="oui">Oui</option></select></div>
  </div>
  <div className="field"><label>Contexte</label><input value={d.context} onChange={e=>up('context', e.target.value)} /></div>
</>); }
function ImgFields({ d, up }) { return (<>
  <div className="row">
    <div className="field"><label>Modalité</label><select value={d.modality} onChange={e=>up('modality', e.target.value)}><option>Radiographie</option><option>Échographie</option><option>TDM</option><option>IRM</option></select></div>
    <div className="field"><label>Priorité</label><select value={d.priority} onChange={e=>up('priority', e.target.value)}><option>Routine</option><option>Semi-urgent</option><option>Urgent</option></select></div>
  </div>
  <div className="row">
    <div className="field"><label>Région</label><input value={d.region} onChange={e=>up('region', e.target.value)} /></div>
    <div className="field"><label>Vues</label><input value={d.views} onChange={e=>up('views', e.target.value)} /></div>
  </div>
  <div className="field"><label>Contexte</label><input value={d.context} onChange={e=>up('context', e.target.value)} /></div>
</>); }
function PbFields({ d, up }) { return (<>
  <div className="field"><label>Problème</label><input value={d.name} onChange={e=>up('name', e.target.value)} /></div>
  <div className="row">
    <div className="field"><label>Sévérité</label><select value={d.severity} onChange={e=>up('severity', e.target.value)}><option>Léger</option><option>Modéré</option><option>Sévère</option></select></div>
    <div className="field"><label>Depuis</label><input value={d.since} onChange={e=>up('since', e.target.value)} /></div>
  </div>
  <div className="field"><label>Notes</label><textarea rows={2} value={d.notes} onChange={e=>up('notes', e.target.value)} /></div>
</>); }
function InsFields({ d, up }) { return (<>
  <div className="field"><label>Titre</label><input value={d.title} onChange={e=>up('title', e.target.value)} /></div>
  <div className="field"><label>Contenu</label><textarea rows={4} value={d.body} onChange={e=>up('body', e.target.value)} /></div>
</>); }
function RefFields({ d, up }) { return (<>
  <div className="field"><label>Spécialité</label>
    <select value={d.specialty||''} onChange={e=>up('specialty', e.target.value)}>
      <option value="">— Choisir —</option>
      <option>Cardiologie</option><option>Orthopédie</option><option>Dermatologie</option>
      <option>Gastroentérologie</option><option>Neurologie</option><option>Pneumologie</option>
      <option>Rhumatologie</option><option>Endocrinologie</option><option>Néphrologie</option>
      <option>Urologie</option><option>Gynécologie</option><option>Ophtalmologie</option>
      <option>ORL</option><option>Chirurgie générale</option><option>Chirurgie vasculaire</option>
      <option>Hématologie</option><option>Oncologie</option><option>Psychiatrie</option>
      <option>Gériatrie</option><option>Médecine interne</option>
    </select></div>
  <div className="field"><label>Question clinique</label><textarea rows={2} value={d.question||''} onChange={e=>up('question', e.target.value)} /></div>
  <div className="row">
    <div className="field"><label>Priorité</label>
      <select value={d.priority||'Routine'} onChange={e=>up('priority', e.target.value)}>
        <option>Routine</option><option>Semi-urgent</option><option>Urgent</option><option>STAT</option>
      </select></div>
  </div>
  <div className="field"><label>Indication</label><input value={d.indication||''} onChange={e=>up('indication', e.target.value)} /></div>
  <div className="field"><label>CRDS / guichet</label><input value={d.crds||''} onChange={e=>up('crds', e.target.value)} /></div>
</>); }

// Slash menu
function SlashMenu({ position, query, onSelect, onClose, activeIndex, items }) {
  const ref = useRefP(null);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  const grouped = {};
  items.forEach(it => { if (!grouped[it.section]) grouped[it.section] = []; grouped[it.section].push(it); });
  return (
    <div className="slash-menu" ref={ref} style={position}>
      {items.length === 0 && <div style={{padding:16, fontSize:12, color:'var(--fg-3)', textAlign:'center'}}>Aucune commande.</div>}
      {Object.entries(grouped).map(([section, list]) => (
        <div key={section}>
          <div className="sm-section">{section}</div>
          {list.map(it => {
            const idx = items.indexOf(it);
            return (
              <div key={it.key} className={'sm-item' + (idx === activeIndex ? ' active' : '')}
                onMouseDown={e => { e.preventDefault(); onSelect(it); }}>
                <span className="ic"><span className="material-symbols-outlined">{it.icon}</span></span>
                <div>
                  <div className="ttl">{it.title}</div>
                  <div className="desc">{it.desc}</div>
                </div>
                <span className="kbd">/{it.kbd}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Functions / "Ajouter" menu — opened from the + button
function AddMenu({ position, orders, onPickOrder, onPickFile, onAddSection, onClose }) {
  const stop = (e) => e.stopPropagation();
  const [showFileSub, setShowFileSub] = useStateP(false);

  return (
    <>
      <div className="addmenu-scrim" onMouseDown={(e) => { e.preventDefault(); onClose(); }} />
      <div className="addmenu" style={position} onMouseDown={stop}>
        <div className="addmenu-sec">Rédaction</div>
        <button className="addmenu-item" style={showFileSub ? { background: '#f5f5fa' } : {}}
          onMouseDown={(e) => { e.preventDefault(); setShowFileSub(s => !s); }}>
          <span className="material-icons-outlined ic">upload_file</span>
          <span className="lbl">Ajouter des fichiers</span>
          <span className="kbd">Alt+A</span>
          <span className="material-icons-outlined arr" style={{ transition: 'transform 0.15s', transform: showFileSub ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
        </button>
        {showFileSub && (
          <div style={{ background: '#f8f8fb', borderLeft: '3px solid #dde0f5', margin: '0 0 4px 18px', borderRadius: '0 6px 6px 0' }}>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onPickFile) onPickFile('computer'); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>laptop</span>
              <span className="lbl">Depuis mon ordinateur</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: "'Inter',sans-serif" }}>PDF · PNG</span>
            </button>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>smartphone</span>
              <span className="lbl">Depuis mon téléphone</span>
            </button>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>person</span>
              <span className="lbl">Depuis le téléphone du patient</span>
            </button>
          </div>
        )}
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); }}>
          <span className="material-icons-outlined ic">bolt</span>
          <span className="lbl">Textes rapides</span>
          <span className="kbd">Ctrl+R</span>
        </button>
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onAddSection) onAddSection(); onClose(); }}>
          <span className="material-icons-outlined ic">add</span>
          <span className="lbl">Ajouter une section</span>
          <span className="kbd">/sec</span>
        </button>

        <div className="addmenu-div" />

        <div className="addmenu-sec">Fonctions</div>
        {(orders || []).map((it) => (
          <button key={it.key} className="addmenu-item"
            onMouseDown={(e) => { e.preventDefault(); if (onPickOrder) onPickOrder(it.kbd); onClose(); }}>
            <span className="material-symbols-outlined ic">{it.icon}</span>
            <span className="lbl">{it.title}</span>
            <span className="kbd">/{it.kbd}</span>
          </button>
        ))}
        <button className="addmenu-item" onMouseDown={(e) => {
          e.preventDefault();
          onClose();
          const rect = e.currentTarget.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent('ct-picker-open', { detail: { rect } }));
        }}>
          <span className="material-icons-outlined ic">handyman</span>
          <span className="lbl">Outils cliniques</span>
          <span className="material-icons-outlined arr">chevron_right</span>
        </button>
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); }}>
          <span className="material-icons-outlined ic">lock</span>
          <span className="lbl">Note confidentielle</span>
        </button>
      </div>
    </>
  );
}

// =========================================================
// RxMenu — dropdown de recherche de médicaments (commande /rx)
// Sections : Favoris · Traitements fréquemment prescrits · Autres produits trouvés
// =========================================================
function RxNameHighlight({ name, query }) {
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nq = norm((query || '').trim());
  if (!nq || !norm(name).startsWith(nq)) return name;
  return (
    <>
      <span className="rx-match">{name.slice(0, nq.length)}</span>
      {name.slice(nq.length)}
    </>);
}

function RxMenu({ position, kind, def, query, results, activeIndex, onSelect, onHover, onToggleFav, onClose }) {
  const ref = useRefP(null);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const d = def || window.NOTE_DATA.ORDER_DEFS.rx;
  const favSet = d.favs;
  const sections = [
    [d.sections[0], results.favoris],
    [d.sections[1], results.frequents],
    [d.sections[2], results.autres],
  ];
  const total = results.favoris.length + results.frequents.length + results.autres.length;
  let flat = -1;

  return (
    <div className="rx-menu" ref={ref} style={position} role="listbox">
      <div className="rx-menu__scroll">
        {total === 0 &&
          <div className="rx-empty">Aucun {d.emptyNoun} trouvé{query ? <> pour « {query} »</> : null}.</div>
        }
        {sections.map(([ttl, list]) => list.length === 0 ? null : (
          <div key={ttl} className="rx-sec-block">
            <div className="rx-sec">{ttl}</div>
            {list.map((it) => {
              flat += 1;
              const idx = flat;
              const fav = favSet.has(it.key);
              return (
                <div key={it.key} role="option" aria-selected={idx === activeIndex}
                  className={'rx-item' + (idx === activeIndex ? ' is-active' : '')}
                  onMouseEnter={() => onHover(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(it)}>
                  <div className="rx-item__body">
                    <div className="rx-item__name">
                      <RxNameHighlight name={it.name} query={query} /> {it.dose}
                    </div>
                    <div className="rx-item__sig">{it.sig}</div>
                  </div>
                  <div className="rx-item__actions">
                    <button type="button" className={'rx-heart' + (fav ? ' is-fav' : '')}
                      title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => { e.stopPropagation(); onToggleFav(it.key); }}>
                      <span className="material-icons">{fav ? 'favorite' : 'favorite_border'}</span>
                    </button>
                    {it.active &&
                      <span className="rx-active" title="Déjà au dossier">
                        <span className="material-icons">check</span>
                      </span>
                    }
                  </div>
                </div>);
            })}
          </div>
        ))}
      </div>
      <div className="rx-menu__foot">
        <span><kbd>↑ ↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> {d.verb}</span>
        <span><kbd>Esc</kbd> annuler</span>
      </div>
    </div>);
}

Object.assign(window, { ChipPopover, SlashMenu, AddMenu, RxMenu });
