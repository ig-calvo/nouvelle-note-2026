/* global React */
function NoteEditor({ isOpen, onOpen, smartActive }) {
  const [detail, setDetail] = React.useState('');
  const [conclusion, setConclusion] = React.useState('');
  const [chips, setChips] = React.useState({});
  const [popover, setPopover] = React.useState(null);
  const [linkedChipId, setLinkedChipId] = React.useState(null);

  const [everOpened, setEverOpened] = React.useState(false);
  const [toolOpen, setToolOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerAnchor, setPickerAnchor] = React.useState(null);
  const [noteDate, setNoteDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [noteTime, setNoteTime] = React.useState(() => new Date().toTimeString().slice(0, 5));
  const [visitType, setVisitType] = React.useState('Visite en clinique');
  const [showTags, setShowTags] = React.useState(false);
  const [tags, setTags] = React.useState([]);

  // --- drag-to-place tool state
  const [detailTop, setDetailTop] = React.useState('');
  const [detailBot, setDetailBot] = React.useState('');
  const [conclusionTop, setConclusionTop] = React.useState('');
  const [conclusionBot, setConclusionBot] = React.useState('');
  const [toolLoc, setToolLoc] = React.useState('default'); // 'default' | 'detail' | 'conclusion'
  const [dragging, setDragging] = React.useState(false);
  const [drop, setDrop] = React.useState(null);            // null | {type:'default'} | {type:'gap',field,k,y}
  const detailWrapRef = React.useRef(null);
  const conclusionWrapRef = React.useRef(null);
  const defaultZoneRef = React.useRef(null);
  const dragRef = React.useRef({ on: false });
  const dropRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen && !everOpened) setEverOpened(true);
  }, [isOpen]);

  React.useEffect(() => {
    function onPickerOpen(e) {
      setPickerAnchor(e.detail.rect);
      setPickerOpen(true);
    }
    window.addEventListener('ct-picker-open', onPickerOpen);
    return () => window.removeEventListener('ct-picker-open', onPickerOpen);
  }, []);

  function deriveLabel(entity) {
    const d = entity.details || {};
    if (entity.type === 'prescription') {
      const head = [d.molecule, d.dose ? d.dose + ' ' + d.unit : ''].filter(Boolean).join(' ');
      const qty = d.form === 'comprimé' ? '1 co' : d.form === 'aérosol-doseur' ? '2 inh' : '1 dose';
      const tail = [qty, d.route, d.frequency, d.duration ? '× ' + d.duration + ' ' + (d.durationUnit || 'jours') : ''].filter(Boolean).join(' ');
      return [head, tail].filter(Boolean).join(' — ') || entity.label;
    }
    if (entity.type === 'lab') return d.tests && d.tests[0] ? d.tests.join(', ').slice(0, 40) : entity.label;
    if (entity.type === 'imaging') return [d.modality, d.region].filter(Boolean).join(' ') || entity.label;
    if (entity.type === 'problem') return d.name || entity.label;
    if (entity.type === 'instructions') return d.title || entity.label;
    return entity.label;
  }

  function onAddChip(fieldId, { chipId, entity, openAfter, storedOverride }) {
    const set = fieldId === 'detail' ? setDetail : fieldId === 'detail-top' ? setDetailTop : fieldId === 'detail-bot' ? setDetailBot : fieldId === 'conclusion-top' ? setConclusionTop : fieldId === 'conclusion-bot' ? setConclusionBot : setConclusion;
    if (storedOverride != null) set(storedOverride);
    setChips(function (cs) {return Object.assign({}, cs, { [chipId]: { entity } });});
    if (openAfter) {
      setTimeout(function () {
        const node = document.querySelector('[data-cid="' + chipId + '"]');
        if (node) setPopover({ chipId, anchorRect: node.getBoundingClientRect() });
      }, 80);
    }
  }

  function onChipClick(chipId, rect) {
    setPopover({ chipId, anchorRect: rect });
    setLinkedChipId(chipId);
  }

  function savePopover(chipId, draft) {
    setChips(function (cs) {
      const ent = Object.assign({}, draft, { label: deriveLabel(draft) });
      if (ent.type === 'prescription' && ent.rx) ent.rx = window.NOTE_DATA.deriveRx(ent.details || {}, ent.rx);
      else if (ent.type === 'lab' && ent.rx) ent.rx = window.NOTE_DATA.deriveLabRx(ent.details || {});
      else if (ent.type === 'imaging' && ent.rx) ent.rx = window.NOTE_DATA.deriveImgRx(ent.details || {});
      return Object.assign({}, cs, { [chipId]: { entity: ent } });
    });
    setPopover(null);
  }

  function revertChip(chipId) {
    const chip = chips[chipId];if (!chip) return;
    const txt = chip.entity.text || chip.entity.label || '';
    const marker = '{{CHIP:' + chipId + '}}';
    setDetail(function (v) {return v.split(marker).join(txt);});
    setDetailTop(function (v) {return v.split(marker).join(txt);});
    setDetailBot(function (v) {return v.split(marker).join(txt);});
    setConclusion(function (v) {return v.split(marker).join(txt);});
    setConclusionTop(function (v) {return v.split(marker).join(txt);});
    setConclusionBot(function (v) {return v.split(marker).join(txt);});
    setChips(function (cs) {const n = Object.assign({}, cs);delete n[chipId];return n;});
    setPopover(null);
  }

  function deleteChip(chipId) {
    const marker = '{{CHIP:' + chipId + '}}';
    setDetail(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setDetailTop(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setDetailBot(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setConclusion(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setConclusionTop(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setConclusionBot(function (v) {return v.split(marker + ' ').join('').split(marker).join('');});
    setChips(function (cs) {const n = Object.assign({}, cs);delete n[chipId];return n;});
    setPopover(null);
  }

  const popoverChip = popover && chips[popover.chipId] ?
  { id: popover.chipId, entity: chips[popover.chipId].entity } :
  null;

  // ----- drag-to-place helpers -----
  function combinedDetail() {
    return toolLoc === 'detail' ? (detailTop + (detailTop && detailBot ? '\n' : '') + detailBot) : detail;
  }
  function combinedConclusion() {
    return toolLoc === 'conclusion' ? (conclusionTop + (conclusionTop && conclusionBot ? '\n' : '') + conclusionBot) : conclusion;
  }
  function blockGaps(wrap, field, out) {
    if (!wrap) return;
    let blocks = [];
    wrap.querySelectorAll('.ql-editor').forEach(function (ed) {
      blocks = blocks.concat([].slice.call(ed.children).filter(function (n) { return n.nodeType === 1; }));
    });
    blocks.forEach(function (b, i) { out.push({ field: field, k: i, vy: b.getBoundingClientRect().top }); });
    if (blocks.length) out.push({ field: field, k: blocks.length, vy: blocks[blocks.length - 1].getBoundingClientRect().bottom });
  }
  function onHandleDown(e) {
    e.preventDefault();
    dragRef.current = { on: true };
    setDragging(true);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
  }
  function onDragMove(e) {
    if (!dragRef.current.on) return;
    const dz = defaultZoneRef.current;
    if (dz) {
      const r = dz.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) { dropRef.current = { type: 'default' }; setDrop({ type: 'default' }); return; }
    }
    const cands = [];
    blockGaps(detailWrapRef.current, 'detail', cands);
    blockGaps(conclusionWrapRef.current, 'conclusion', cands);
    if (!cands.length) { dropRef.current = { type: 'default' }; setDrop({ type: 'default' }); return; }
    let best = cands[0], bd = Math.abs(e.clientY - cands[0].vy);
    for (let i = 1; i < cands.length; i++) { const d = Math.abs(e.clientY - cands[i].vy); if (d < bd) { bd = d; best = cands[i]; } }
    const ref = best.field === 'detail' ? detailWrapRef : conclusionWrapRef;
    const top = ref.current.getBoundingClientRect().top;
    const res = { type: 'gap', field: best.field, k: best.k, y: best.vy - top };
    dropRef.current = res; setDrop(res);
  }
  function recombineCurrent() {
    if (toolLoc === 'detail') setDetail(combinedDetail());
    else if (toolLoc === 'conclusion') setConclusion(combinedConclusion());
  }
  function onDragUp() {
    dragRef.current = { on: false };
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    const t = dropRef.current;
    if (t && t.type === 'default') {
      recombineCurrent(); setToolLoc('default');
    } else if (t && t.type === 'gap') {
      recombineCurrent();
      if (t.field === 'detail') {
        const P = combinedDetail().split('\n');
        setDetailTop(P.slice(0, t.k).join('\n'));
        setDetailBot(P.slice(t.k).join('\n'));
        setToolLoc('detail');
      } else {
        const P = combinedConclusion().split('\n');
        setConclusionTop(P.slice(0, t.k).join('\n'));
        setConclusionBot(P.slice(t.k).join('\n'));
        setToolLoc('conclusion');
      }
    }
    dropRef.current = null;
    setDragging(false); setDrop(null);
  }
  function closeTool() {
    recombineCurrent(); setToolLoc('default');
    setToolOpen(false);
  }
  function toggleTool() {
    if (toolOpen) { closeTool(); } else { setToolOpen(true); }
  }
  function handleToolSelect(tool) {
    setPickerOpen(false);
    if (tool.hasTool) setToolOpen(true);
  }
  function onWrapKey(field) {
    return function (e) {
      if (e.defaultPrevented) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const topEl = document.querySelector('[data-field-id="' + field + '-top"]');
      const botEl = document.querySelector('[data-field-id="' + field + '-bot"]');
      if (!topEl || !botEl || !window.Quill) return;
      const topQ = Quill.find(topEl), botQ = Quill.find(botEl);
      if (!topQ || !botQ) return;
      const inTop = e.target.closest && e.target.closest('[data-field-id="' + field + '-top"]');
      const inBot = e.target.closest && e.target.closest('[data-field-id="' + field + '-bot"]');
      if (inTop && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        const sel = topQ.getSelection();
        if (sel && sel.index >= topQ.getLength() - 1) { e.preventDefault(); botQ.focus(); botQ.setSelection(0, 0); }
      } else if (inBot && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        const sel = botQ.getSelection();
        if (sel && sel.index === 0) { e.preventDefault(); const len = topQ.getLength(); topQ.focus(); topQ.setSelection(Math.max(0, len - 1), 0); }
      }
    };
  }

  return (
    <div style={neStyles.card}>
      <div style={neStyles.topRow}>
        <div>
          <div style={neStyles.overline}>CLINIQUE DU CENTRE VILLE</div>
          <div style={neStyles.titleRow}>
            <span style={neStyles.title}>Note Clinique</span>
            {smartActive && <span style={neStyles.statusBadge}>En cours</span>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {smartActive
          ? (
            <div style={neStyles.assistRow}>
              <span className="material-icons-outlined" style={neStyles.docIcon}>insert_drive_file</span>
              <span style={neStyles.assistChip}>
                <span className="material-icons" style={{ fontSize: 20, color: '#5b54b8' }}>check</span>
                Rédaction assistée
              </span>
            </div>
          )
          : <span className="material-icons-outlined" style={neStyles.docIcon}>insert_drive_file</span>
        }
      </div>

      {/* Fields */}
      <div style={neStyles.fieldsRow}>
        <FloatField label="Raison de consultation" flex input onValueChange={function (v) {if (v.length > 0 && onOpen) onOpen();}} />
        <FloatField label="Date" width={210} input type="date" value={noteDate} onValueChange={setNoteDate} />
        <FloatField label="Heure" width={170} input type="time" value={noteTime} onValueChange={setNoteTime} />
        <FloatField label="Type de visite" width={260} select value={visitType} onValueChange={setVisitType} options={['Visite en clinique', 'Appel téléphonique', 'Mise à jour']} />
        <button
          type="button"
          title={showTags ? "Masquer les étiquettes" : "Ajouter des étiquettes"}
          aria-pressed={showTags}
          onClick={function () { setShowTags(function (v) { return !v; }); }}
          style={{ ...neStyles.tagToggle, ...(showTags ? neStyles.tagToggleOn : {}) }}>
          <span className="material-icons-outlined" style={{ fontSize: 22 }}>sell</span>
        </button>
      </div>

      {/* Étiquettes */}
      {showTags &&
        <TagInput tags={tags} onChange={setTags} />}

      {/* Assistant IA */}
      <AIBox onAddToNote={function (text) {
        if (onOpen) onOpen();
        setDetail(function (v) { return v && v.trim() ? v.replace(/\n*$/, '') + '\n\n' + text : text; });
      }} />

      {/* Expanding content */}
      {isOpen &&
      <div style={{ marginTop: 20, animation: 'note-expand 300ms ease-in-out' }}>

          {/* Détails */}
          <div style={neStyles.secHead}>
            <span style={neStyles.sectionLabel}>Détails</span>
          </div>
<div ref={detailWrapRef} onKeyDown={onWrapKey('detail')} style={{ position: "relative" }}>
            {toolLoc === "detail" ? (
              <React.Fragment>
                {detailTop.trim() !== "" && <EditorField id="detail-top" placeholder="Appuyer sur « / » pour afficher les commandes" value={detailTop} chips={chips} onChange={setDetailTop} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />}
                {toolOpen && <ClinicalTool onClose={closeTool} onHandleDown={onHandleDown} dragging={dragging} />}
                <EditorField id="detail-bot" placeholder="Appuyer sur « / » pour afficher les commandes" value={detailBot} chips={chips} onChange={setDetailBot} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />
              </React.Fragment>
            ) : (
              <EditorField id="detail" placeholder="Appuyer sur « / » pour afficher les commandes" value={detail} chips={chips} onChange={setDetail} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />
            )}
            {dragging && drop && drop.type === "gap" && drop.field === "detail" && <div className="ct-dropline" style={{ top: drop.y }} />}
          </div>
          

          <div style={neStyles.divider} />

          {/* Outils cliniques + position par défaut de l'outil */}
          <div ref={defaultZoneRef} className={'ct-default-zone' + (dragging && drop && drop.type === 'default' ? ' is-target' : '')}>
            <div style={neStyles.chipsRow}>
              <button
                className="ct-toolsbtn"
                title="Outils cliniques"
                style={pickerOpen ? { background: '#eef1fb', color: 'var(--brand-primary, #1a5fd4)' } : undefined}
                onClick={function (e) {
                  const r = e.currentTarget.getBoundingClientRect();
                  if (pickerOpen) { setPickerOpen(false); } else { setPickerAnchor(r); setPickerOpen(true); }
                }}>
                <span className="material-icons-outlined">handyman</span>
              </button>
              {toolOpen &&
                <button className="ct-chip" onClick={toggleTool}>
                  <span className="material-icons-outlined">medical_information</span>
                  Feuille de route - Symptômes urinaires
                </button>
              }
              {!toolOpen && ['Assurance privée', 'Cardiologie', 'CNESST', 'Examen physique simple'].map(function (label) {
                return (
                  <button key={label} className="ct-chip">
                    <span className="material-icons-outlined">description</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {toolOpen && toolLoc === "default" &&
              <ClinicalTool onClose={closeTool} onHandleDown={onHandleDown} dragging={dragging} />}
          </div>

          <div style={neStyles.divider} />

          {/* Conclusion */}
          <div style={neStyles.secHead}>
            <span style={neStyles.sectionLabel}>Conclusion</span>
          </div>
<div ref={conclusionWrapRef} onKeyDown={onWrapKey('conclusion')} style={{ position: "relative" }}>
            {toolLoc === "conclusion" ? (
              <React.Fragment>
                {conclusionTop.trim() !== "" && <EditorField id="conclusion-top" placeholder="Appuyer sur « / » pour afficher les commandes" value={conclusionTop} chips={chips} onChange={setConclusionTop} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />}
                {toolOpen && <ClinicalTool onClose={closeTool} onHandleDown={onHandleDown} dragging={dragging} />}
                <EditorField id="conclusion-bot" placeholder="Appuyer sur « / » pour afficher les commandes" value={conclusionBot} chips={chips} onChange={setConclusionBot} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />
              </React.Fragment>
            ) : (
              <EditorField id="conclusion" placeholder="Appuyer sur « / » pour afficher les commandes" value={conclusion} chips={chips} onChange={setConclusion} onAddChip={onAddChip} onChipClick={onChipClick} linkedChipId={linkedChipId} />
            )}
            {dragging && drop && drop.type === "gap" && drop.field === "conclusion" && <div className="ct-dropline" style={{ top: drop.y }} />}
          </div>
          

          </div>
      }

      {/* Clinical tool picker */}
      {pickerOpen &&
        <ClinicalToolPicker
          anchorRect={pickerAnchor}
          onClose={function () { setPickerOpen(false); }}
          onSelect={handleToolSelect} />
      }

      {/* Chip popover */}
      {popoverChip &&
      <ChipPopover
        chip={popoverChip}
        anchorRect={popover.anchorRect}
        onClose={function () {setPopover(null);setLinkedChipId(null);}}
        onSave={savePopover}
        onRevert={revertChip}
        onDelete={deleteChip} />

      }
    </div>);

}

function FloatField({ label, children, width, flex, error, input, type, select, options, value: controlledValue, onValueChange }) {
  const [focused, setFocused] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const isBuiltIn = input || select;
  const alwaysFloated = type === 'date' || type === 'time' || select;
  const floated = !isBuiltIn || alwaysFloated || focused || (value && value.length > 0);

  function handleChange(e) {
    const v = e.target.value;
    if (controlledValue === undefined) setInternalValue(v);
    if (onValueChange) onValueChange(v);
  }

  return (
    <div style={{
      ...neFieldStyles.wrap,
      ...(flex ? { flex: 1, minWidth: 200 } : { width }),
      ...(error ? { borderColor: '#d32f2f' } : {}),
      ...(isBuiltIn && focused ? neFieldStyles.wrapFocused : {})
    }}>
      {label &&
      <span style={{
        ...neFieldStyles.label,
        ...(floated ? neFieldStyles.labelFloating : neFieldStyles.labelResting),
        ...(isBuiltIn && focused ? { color: '#6967d1' } : {})
      }}>{label}</span>}
      <div style={neFieldStyles.inner}>
        {select ? (
          <React.Fragment>
            <select
              style={{ ...neFieldStyles.input, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              value={value}
              onChange={handleChange}
              onFocus={function () { setFocused(true); }}
              onBlur={function () { setFocused(false); }}>
              {(options || []).map(function (o) { return <option key={o} value={o}>{o}</option>; })}
            </select>
            <span className="material-icons-outlined" style={neStyles.fieldIcon}>arrow_drop_down</span>
          </React.Fragment>
        ) : input ? (
          <input
            style={{ ...neFieldStyles.input, colorScheme: 'light' }}
            type={type || 'text'}
            value={value}
            onChange={handleChange}
            onFocus={function () { setFocused(true); }}
            onBlur={function () { setFocused(false); }} />
        ) : children}
      </div>
    </div>);

}

const neFieldStyles = {
  wrap: { position: 'relative', border: '1px solid #c4c4c4', borderRadius: 6, height: 52, display: 'flex', alignItems: 'center', padding: '0 14px', background: '#fff' },
  wrapFocused: { borderColor: '#6967d1', boxShadow: '0 0 0 1px #6967d1' },
  label: { position: 'absolute', left: 12, padding: '0 5px', background: '#fff', color: 'rgba(0,0,0,0.6)', fontFamily: "'Inter', sans-serif", pointerEvents: 'none', transformOrigin: 'left center', transition: 'top 0.16s ease, font-size 0.16s ease, color 0.16s ease' },
  labelFloating: { top: -8, fontSize: 12 },
  labelResting: { top: 15, fontSize: 16, color: 'rgba(0,0,0,0.55)' },
  inner: { display: 'flex', alignItems: 'center', width: '100%', gap: 8 },
  input: { border: 'none', outline: 'none', background: 'transparent', width: '100%', font: "400 15px 'Inter', sans-serif", color: 'rgba(0,0,0,0.85)', padding: 0 }
};

const neStyles = {
  card: { background: '#fff', borderRadius: 8, padding: '16px 20px 18px', boxShadow: '0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)', fontFamily: "'Inter', sans-serif" },
  topRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 },
  statusBadge: { background: '#e8e6f5', color: '#4b3fa6', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, padding: '4px 12px', borderRadius: 8 },
  assistRow: { display: 'flex', alignItems: 'center', gap: 14 },
  assistChip: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8e6f5', color: '#3a3370', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 16, padding: '9px 18px', borderRadius: 10 },
  overline: { fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' },
  title: { fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22, color: 'rgba(0,0,0,0.88)', marginTop: 2 },
  docIcon: { fontSize: 24, color: 'rgba(0,0,0,0.45)', marginTop: 6 },
  fieldsRow: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 },
  tagToggle: { width: 46, height: 52, flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 8, color: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease, color .15s ease' },
  tagToggleOn: { background: '#e8e6f5', color: '#4b3fa6' },
  fieldValue: { fontSize: 15, color: 'rgba(0,0,0,0.82)' },
  fieldIcon: { marginLeft: 'auto', fontSize: 20, color: 'rgba(0,0,0,0.5)' },
  aiBox: { position: 'relative', border: '1px solid #c9c9e8', borderRadius: 10, padding: '18px 16px 14px', marginTop: 6 },
  aiLegend: { position: 'absolute', top: -11, left: 14, display: 'flex', alignItems: 'center', gap: 5, background: '#fff', padding: '0 6px' },
  aiSparkle: { fontSize: 18, color: '#6967d1' },
  aiLabel: { fontSize: 14, fontWeight: 600, color: '#6967d1' },
  aiRow: { display: 'flex', alignItems: 'center', gap: 12 },
  gabaritBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '9px 10px 9px 16px', cursor: 'pointer', minWidth: 180, font: "400 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.7)', justifyContent: 'space-between' },
  gabaritCaret: { fontSize: 22, color: 'rgba(0,0,0,0.6)' },
  aiActionBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '9px 16px', cursor: 'pointer', font: "500 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.8)' },
  aiActionIcon: { fontSize: 20, color: 'rgba(0,0,0,0.6)' },
  infoIcon: { fontSize: 22, color: 'rgba(0,0,0,0.4)', cursor: 'pointer' },
  secHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 4 },
  sectionLabel: { fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif", color: 'rgba(0,0,0,0.6)' },
  secTools: { display: 'flex', gap: 2 },
  tbtn: { width: 28, height: 28, border: 0, background: 'transparent', borderRadius: 6, color: 'rgba(0,0,0,0.45)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, background: '#eee', margin: '12px 0' },
  chipsRow: { display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 },
  toolsIconBtn: { width: 36, height: 36, border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip: { display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', font: "500 13px 'Inter', sans-serif", color: 'rgba(0,0,0,0.72)', background: '#fff', flexShrink: 0 }
};

window.NoteEditor = NoteEditor;

// ---------------------------------------------------------
// TagInput — « Étiquettes » chips field
// ---------------------------------------------------------
const TAG_SUGGESTIONS = ['Visite en clinique', 'Appel téléphonique', 'Assurance privée', 'CNESST', 'Cardiologie', 'Suivi', 'Sans rendez-vous', 'Urgent', 'Télémédecine'];

function TagInput({ tags, onChange }) {
  const [input, setInput] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef(null);

  function addTag(raw) {
    const t = (raw || '').trim();
    if (!t) return;
    if (tags.some(function (x) { return x.toLowerCase() === t.toLowerCase(); })) { setInput(''); return; }
    onChange(tags.concat([t]));
    setInput('');
  }
  function removeTag(i) { onChange(tags.filter(function (_, k) { return k !== i; })); }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && input === '' && tags.length) { e.preventDefault(); removeTag(tags.length - 1); }
  }

  const suggestions = TAG_SUGGESTIONS.filter(function (s) {
    return !tags.some(function (t) { return t.toLowerCase() === s.toLowerCase(); }) &&
      (input.trim() === '' || s.toLowerCase().includes(input.trim().toLowerCase()));
  }).slice(0, 6);

  return (
    <div style={tagStyles.row}>
      <div
        style={{ ...tagStyles.wrap, ...(focused ? tagStyles.wrapFocused : {}) }}
        onMouseDown={function (e) { if (e.target === e.currentTarget || e.target.dataset.tagshell) { inputRef.current && inputRef.current.focus(); } }}>
        <span style={{ ...neFieldStyles.label, ...neFieldStyles.labelFloating, ...(focused ? { color: '#6967d1' } : {}) }}>Étiquettes</span>
        <div style={tagStyles.inner} data-tagshell="1">
          <span className="material-icons-outlined" style={tagStyles.icon}>sell</span>
          {tags.map(function (t, i) {
            return (
              <span key={t + i} style={tagStyles.chip}>
                {t}
                <button type="button" style={tagStyles.chipX} title="Retirer" onClick={function () { removeTag(i); }}>
                  <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                </button>
              </span>);
          })}
          <input
            ref={inputRef}
            style={tagStyles.input}
            value={input}
            placeholder={tags.length ? 'Ajouter…' : 'Ajouter une étiquette…'}
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={onKeyDown}
            onFocus={function () { setFocused(true); }}
            onBlur={function () { setTimeout(function () { setFocused(false); }, 120); }} />
        </div>
        {focused && suggestions.length > 0 &&
          <div style={tagStyles.menu}>
            {suggestions.map(function (s) {
              return (
                <div key={s} style={tagStyles.menuItem}
                  onMouseEnter={function (e) { e.currentTarget.style.background = '#f3f2fb'; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; }}
                  onMouseDown={function (e) { e.preventDefault(); addTag(s); inputRef.current && inputRef.current.focus(); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, color: 'rgba(0,0,0,0.4)' }}>sell</span>
                  {s}
                </div>);
            })}
          </div>}
      </div>
    </div>);
}

const tagStyles = {
  row: { marginTop: -6, marginBottom: 22 },
  wrap: { position: 'relative', border: '1px solid #c4c4c4', borderRadius: 6, minHeight: 52, display: 'flex', alignItems: 'center', padding: '7px 12px', background: '#fff' },
  wrapFocused: { borderColor: '#6967d1', boxShadow: '0 0 0 1px #6967d1' },
  inner: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' },
  icon: { fontSize: 22, color: 'rgba(0,0,0,0.45)', marginRight: 2 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #d2d2dd', borderRadius: 6, padding: '4px 4px 4px 12px', font: "500 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.82)', background: '#fff' },
  chipX: { border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2, borderRadius: 4 },
  input: { border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 120, font: "400 15px 'Inter', sans-serif", color: 'rgba(0,0,0,0.85)', padding: '4px 0' },
  menu: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 240, background: '#fff', border: '1px solid #e3e3ea', borderRadius: 8, boxShadow: '0 8px 20px rgba(37,36,94,0.16)', padding: '4px 0', zIndex: 30 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', fontSize: 14, color: 'rgba(0,0,0,0.8)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }
};