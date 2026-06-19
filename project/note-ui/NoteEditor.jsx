/* global React */
function NoteEditor({ isOpen, onOpen, smartActive }) {
  const DEFAULT_SECTIONS = [
    { id: 'sec-details',    title: 'Détails de la consultation', content: '' },
    { id: 'sec-conclusion', title: 'Conclusion',                 content: '' },
  ];

  const [sections, setSections] = React.useState(
    function() { return DEFAULT_SECTIONS.map(function(s) { return Object.assign({}, s); }); }
  );
  // Position de la zone d'outils entre les sections (0 = avant tout, 1 = entre s[0] et s[1], ...)
  const [toolZoneIndex, setToolZoneIndex] = React.useState(1);

  // splits pour drag-to-place: { [sectionId]: { top: '', bot: '' } }
  const [sectionSplits, setSectionSplits] = React.useState({});

  const [chips, setChips] = React.useState({});
  const [popover, setPopover] = React.useState(null);
  const [linkedChipId, setLinkedChipId] = React.useState(null);

  const [everOpened, setEverOpened] = React.useState(false);
  const [toolOpen, setToolOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerAnchor, setPickerAnchor] = React.useState(null);
  const [noteDate, setNoteDate] = React.useState(function() { return new Date().toISOString().slice(0, 10); });
  const [noteTime, setNoteTime] = React.useState(function() { return new Date().toTimeString().slice(0, 5); });
  const [visitType, setVisitType] = React.useState('Visite en clinique');
  const [showTags, setShowTags] = React.useState(false);
  const [tags, setTags] = React.useState([]);

  const [toolBodyCollapsed, setToolBodyCollapsed] = React.useState(false);

  // --- drag-to-place tool state
  // toolLoc: 'default' | sectionId
  const [toolLoc, setToolLoc] = React.useState('default');
  const [dragging, setDragging] = React.useState(false);
  const [drop, setDrop] = React.useState(null);
  const sectionWrapRefs = React.useRef({});
  const defaultZoneRef = React.useRef(null);
  const dragRef = React.useRef({ on: false });
  const dropRef = React.useRef(null);

  React.useEffect(function() {
    if (isOpen && !everOpened) setEverOpened(true);
  }, [isOpen]);

  React.useEffect(function() {
    function onPickerOpen(e) {
      setPickerAnchor(e.detail.rect);
      setPickerOpen(true);
    }
    window.addEventListener('ct-picker-open', onPickerOpen);
    return function() { window.removeEventListener('ct-picker-open', onPickerOpen); };
  }, []);

  // ----- section content helpers -----
  function setSectionContent(sectionId, valOrFn) {
    setSections(function(secs) {
      return secs.map(function(s) {
        if (s.id !== sectionId) return s;
        return Object.assign({}, s, { content: typeof valOrFn === 'function' ? valOrFn(s.content) : valOrFn });
      });
    });
  }
  function setSplitTop(sectionId, valOrFn) {
    setSectionSplits(function(sp) {
      var prev = sp[sectionId] || { top: '', bot: '' };
      return Object.assign({}, sp, { [sectionId]: Object.assign({}, prev, { top: typeof valOrFn === 'function' ? valOrFn(prev.top) : valOrFn }) });
    });
  }
  function setSplitBot(sectionId, valOrFn) {
    setSectionSplits(function(sp) {
      var prev = sp[sectionId] || { top: '', bot: '' };
      return Object.assign({}, sp, { [sectionId]: Object.assign({}, prev, { bot: typeof valOrFn === 'function' ? valOrFn(prev.bot) : valOrFn }) });
    });
  }

  function deriveLabel(entity) {
    var d = entity.details || {};
    if (entity.type === 'prescription') {
      var head = [d.molecule, d.dose ? d.dose + ' ' + d.unit : ''].filter(Boolean).join(' ');
      var qty = d.form === 'comprimé' ? '1 co' : d.form === 'aérosol-doseur' ? '2 inh' : '1 dose';
      var tail = [qty, d.route, d.frequency, d.duration ? '× ' + d.duration + ' ' + (d.durationUnit || 'jours') : ''].filter(Boolean).join(' ');
      return [head, tail].filter(Boolean).join(' — ') || entity.label;
    }
    if (entity.type === 'lab') return d.tests && d.tests[0] ? d.tests.join(', ').slice(0, 40) : entity.label;
    if (entity.type === 'imaging') return [d.modality, d.region].filter(Boolean).join(' ') || entity.label;
    if (entity.type === 'problem') return d.name || entity.label;
    if (entity.type === 'instructions') return d.title || entity.label;
    return entity.label;
  }

  function onAddChip(fieldId, { chipId, entity, openAfter, storedOverride }) {
    var targetSectionId = null, part = null;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (fieldId === s.id) { targetSectionId = s.id; part = null; break; }
      if (fieldId === s.id + '-top') { targetSectionId = s.id; part = 'top'; break; }
      if (fieldId === s.id + '-bot') { targetSectionId = s.id; part = 'bot'; break; }
    }
    if (storedOverride != null && targetSectionId) {
      if (part === 'top') setSplitTop(targetSectionId, storedOverride);
      else if (part === 'bot') setSplitBot(targetSectionId, storedOverride);
      else setSectionContent(targetSectionId, storedOverride);
    }
    setChips(function(cs) { return Object.assign({}, cs, { [chipId]: { entity: entity } }); });
    if (openAfter) {
      setTimeout(function() {
        var node = document.querySelector('[data-cid="' + chipId + '"]');
        if (node) setPopover({ chipId: chipId, anchorRect: node.getBoundingClientRect() });
      }, 80);
    }
  }

  function onChipClick(chipId, rect) {
    setPopover({ chipId: chipId, anchorRect: rect });
    setLinkedChipId(chipId);
  }

  function savePopover(chipId, draft) {
    setChips(function(cs) {
      var ent = Object.assign({}, draft, { label: deriveLabel(draft) });
      if (ent.type === 'prescription' && ent.rx) ent.rx = window.NOTE_DATA.deriveRx(ent.details || {}, ent.rx);
      else if (ent.type === 'lab' && ent.rx) ent.rx = window.NOTE_DATA.deriveLabRx(ent.details || {});
      else if (ent.type === 'imaging' && ent.rx) ent.rx = window.NOTE_DATA.deriveImgRx(ent.details || {});
      return Object.assign({}, cs, { [chipId]: { entity: ent } });
    });
    setPopover(null);
  }

  function revertChip(chipId) {
    var chip = chips[chipId]; if (!chip) return;
    var txt = chip.entity.text || chip.entity.label || '';
    var marker = '{{CHIP:' + chipId + '}}';
    setSections(function(secs) {
      return secs.map(function(s) {
        return Object.assign({}, s, { content: s.content.split(marker).join(txt) });
      });
    });
    setSectionSplits(function(sp) {
      var n = Object.assign({}, sp);
      Object.keys(n).forEach(function(sid) {
        n[sid] = { top: n[sid].top.split(marker).join(txt), bot: n[sid].bot.split(marker).join(txt) };
      });
      return n;
    });
    setChips(function(cs) { var n = Object.assign({}, cs); delete n[chipId]; return n; });
    setPopover(null);
  }

  function deleteChip(chipId) {
    var marker = '{{CHIP:' + chipId + '}}';
    setSections(function(secs) {
      return secs.map(function(s) {
        return Object.assign({}, s, { content: s.content.split(marker + ' ').join('').split(marker).join('') });
      });
    });
    setSectionSplits(function(sp) {
      var n = Object.assign({}, sp);
      Object.keys(n).forEach(function(sid) {
        n[sid] = {
          top: n[sid].top.split(marker + ' ').join('').split(marker).join(''),
          bot: n[sid].bot.split(marker + ' ').join('').split(marker).join(''),
        };
      });
      return n;
    });
    setChips(function(cs) { var n = Object.assign({}, cs); delete n[chipId]; return n; });
    setPopover(null);
  }

  var popoverChip = popover && chips[popover.chipId] ?
    { id: popover.chipId, entity: chips[popover.chipId].entity } : null;

  // ----- drag-to-place helpers -----
  function combinedSection(sectionId) {
    if (toolLoc === sectionId) {
      var sp = sectionSplits[sectionId] || { top: '', bot: '' };
      return sp.top + (sp.top && sp.bot ? '\n' : '') + sp.bot;
    }
    var sec = sections.find(function(s) { return s.id === sectionId; });
    return sec ? sec.content : '';
  }
  function blockGaps(wrap, sectionId, out) {
    if (!wrap) return;
    var blocks = [];
    wrap.querySelectorAll('.ql-editor').forEach(function(ed) {
      blocks = blocks.concat([].slice.call(ed.children).filter(function(n) { return n.nodeType === 1; }));
    });
    blocks.forEach(function(b, i) { out.push({ field: sectionId, k: i, vy: b.getBoundingClientRect().top }); });
    if (blocks.length) out.push({ field: sectionId, k: blocks.length, vy: blocks[blocks.length - 1].getBoundingClientRect().bottom });
  }
  function onHandleDown(e) {
    e.preventDefault();
    dragRef.current = { on: true };
    setDragging(true);
    setToolBodyCollapsed(true);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
  }
  function onDragMove(e) {
    if (!dragRef.current.on) return;
    var dz = defaultZoneRef.current;
    if (dz) {
      var r = dz.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        dropRef.current = { type: 'default' }; setDrop({ type: 'default' }); return;
      }
    }
    var cands = [];
    var refs = sectionWrapRefs.current;
    Object.keys(refs).forEach(function(sid) { blockGaps(refs[sid], sid, cands); });
    if (!cands.length) { dropRef.current = { type: 'default' }; setDrop({ type: 'default' }); return; }
    var best = cands[0], bd = Math.abs(e.clientY - cands[0].vy);
    for (var i = 1; i < cands.length; i++) {
      var d = Math.abs(e.clientY - cands[i].vy);
      if (d < bd) { bd = d; best = cands[i]; }
    }
    var wrapEl = refs[best.field];
    var top = wrapEl ? wrapEl.getBoundingClientRect().top : 0;
    var res = { type: 'gap', field: best.field, k: best.k, y: best.vy - top };
    dropRef.current = res; setDrop(res);
  }
  function recombineCurrent() {
    if (toolLoc !== 'default') {
      var sid = toolLoc;
      setSectionContent(sid, combinedSection(sid));
      setSectionSplits(function(sp) { var n = Object.assign({}, sp); delete n[sid]; return n; });
    }
  }
  function onDragUp() {
    dragRef.current = { on: false };
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    var t = dropRef.current;
    if (t && t.type === 'default') {
      recombineCurrent(); setToolLoc('default');
    } else if (t && t.type === 'gap') {
      recombineCurrent();
      var sid = t.field;
      var P = combinedSection(sid).split('\n');
      setSplitTop(sid, P.slice(0, t.k).join('\n'));
      setSplitBot(sid, P.slice(t.k).join('\n'));
      setToolLoc(sid);
    }
    dropRef.current = null;
    setDragging(false); setDrop(null);
  }
  function closeTool() { recombineCurrent(); setToolLoc('default'); setToolOpen(false); }
  function toggleTool() { if (toolOpen) { closeTool(); } else { setToolOpen(true); } }
  function handleToolSelect(tool) { setPickerOpen(false); if (tool.hasTool) setToolOpen(true); }

  function onWrapKey(sectionId) {
    return function(e) {
      if (e.defaultPrevented) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var topEl = document.querySelector('[data-field-id="' + sectionId + '-top"]');
      var botEl = document.querySelector('[data-field-id="' + sectionId + '-bot"]');
      if (!topEl || !botEl || !window.Quill) return;
      var topQ = Quill.find(topEl), botQ = Quill.find(botEl);
      if (!topQ || !botQ) return;
      var inTop = e.target.closest && e.target.closest('[data-field-id="' + sectionId + '-top"]');
      var inBot = e.target.closest && e.target.closest('[data-field-id="' + sectionId + '-bot"]');
      if (inTop && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        var sel = topQ.getSelection();
        if (sel && sel.index >= topQ.getLength() - 1) { e.preventDefault(); botQ.focus(); botQ.setSelection(0, 0); }
      } else if (inBot && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        var sel2 = botQ.getSelection();
        if (sel2 && sel2.index === 0) { e.preventDefault(); var len = topQ.getLength(); topQ.focus(); topQ.setSelection(Math.max(0, len - 1), 0); }
      }
    };
  }

  // ----- section reordering -----
  function moveSectionUp(idx) {
    if (idx === 0) return;
    setSections(function(secs) {
      var n = secs.slice();
      var tmp = n[idx - 1]; n[idx - 1] = n[idx]; n[idx] = tmp;
      return n;
    });
  }
  function moveSectionDown(idx) {
    setSections(function(secs) {
      if (idx >= secs.length - 1) return secs;
      var n = secs.slice();
      var tmp = n[idx + 1]; n[idx + 1] = n[idx]; n[idx] = tmp;
      return n;
    });
  }

  // ----- tool zone position -----
  function moveToolZoneUp() {
    setToolZoneIndex(function(i) { return Math.max(0, i - 1); });
  }
  function moveToolZoneDown() {
    setToolZoneIndex(function(i) { return Math.min(sections.length, i + 1); });
  }

  // ----- section add/remove -----
  function removeSection(sectionId) {
    var idx = sections.findIndex(function(s) { return s.id === sectionId; });
    setSectionSplits(function(sp) { var n = Object.assign({}, sp); delete n[sectionId]; return n; });
    if (toolLoc === sectionId) setToolLoc('default');
    setSections(function(secs) { return secs.filter(function(s) { return s.id !== sectionId; }); });
    // Ajuster toolZoneIndex si la section supprimée était avant la zone
    if (idx >= 0 && toolZoneIndex > idx) {
      setToolZoneIndex(function(i) { return Math.max(0, i - 1); });
    }
  }
  function addSection() {
    var id = 'sec-' + Date.now();
    setSections(function(secs) { return secs.concat([{ id: id, title: 'Nouvelle section', content: '' }]); });
  }

  // ----- build interleaved items list -----
  // sectionItems: array of { type:'section', sec, idx } | { type:'toolzone' }
  var sectionItems = [];
  for (var _si = 0; _si <= sections.length; _si++) {
    if (_si === toolZoneIndex) sectionItems.push({ type: 'toolzone' });
    if (_si < sections.length) sectionItems.push({ type: 'section', sec: sections[_si], idx: _si });
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
        <FloatField label="Raison de consultation" flex input onValueChange={function(v) { if (v.length > 0 && onOpen) onOpen(); }} />
        <FloatField label="Date" width={210} input type="date" value={noteDate} onValueChange={setNoteDate} />
        <FloatField label="Heure" width={170} input type="time" value={noteTime} onValueChange={setNoteTime} />
        <FloatField label="Type de visite" width={260} select value={visitType} onValueChange={setVisitType} options={['Visite en clinique', 'Appel téléphonique', 'Mise à jour']} />
        <button
          type="button"
          title={showTags ? "Masquer les étiquettes" : "Ajouter des étiquettes"}
          aria-pressed={showTags}
          onClick={function() { setShowTags(function(v) { return !v; }); }}
          style={Object.assign({}, neStyles.tagToggle, showTags ? neStyles.tagToggleOn : {})}>
          <span className="material-icons-outlined" style={{ fontSize: 22 }}>sell</span>
        </button>
      </div>

      {/* Étiquettes */}
      {showTags && <TagInput tags={tags} onChange={setTags} />}

      {/* Assistant IA */}
      <AIBox onAddToNote={function(text) {
        if (onOpen) onOpen();
        setSections(function(secs) {
          return secs.map(function(s, i) {
            if (i !== 0) return s;
            var v = s.content;
            return Object.assign({}, s, { content: v && v.trim() ? v.replace(/\n*$/, '') + '\n\n' + text : text });
          });
        });
      }} />

      {/* Expanding content */}
      {isOpen &&
        <div style={{ marginTop: 20, animation: 'note-expand 300ms ease-in-out' }}>

          {sectionItems.map(function(item, renderIdx) {
            var hasDividerBefore = renderIdx > 0;

            if (item.type === 'toolzone') {
              return (
                React.createElement(React.Fragment, { key: 'toolzone' },
                  hasDividerBefore ? React.createElement('div', { style: neStyles.divider }) : null,

                  React.createElement('div', {
                    ref: defaultZoneRef,
                    className: 'ct-default-zone' + (dragging && drop && drop.type === 'default' ? ' is-target' : '')
                  },
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
                      React.createElement('div', { style: neStyles.chipsRow },
                        React.createElement('button', {
                          className: 'ct-toolsbtn',
                          title: 'Outils cliniques',
                          style: pickerOpen ? { background: '#eef1fb', color: 'var(--brand-primary, #1a5fd4)' } : undefined,
                          onClick: function(e) {
                            var r = e.currentTarget.getBoundingClientRect();
                            if (pickerOpen) { setPickerOpen(false); } else { setPickerAnchor(r); setPickerOpen(true); }
                          }
                        }, React.createElement('span', { className: 'material-icons-outlined' }, 'handyman')),
                        toolOpen
                          ? React.createElement('button', { className: 'ct-chip', onClick: toggleTool },
                              React.createElement('span', { className: 'material-icons-outlined' }, 'medical_information'),
                              'Feuille de route - Symptômes urinaires'
                            )
                          : ['Assurance privée', 'Cardiologie', 'CNESST', 'Examen physique simple'].map(function(label) {
                              return React.createElement('button', { key: label, className: 'ct-chip' },
                                React.createElement('span', { className: 'material-icons-outlined' }, 'description'),
                                label
                              );
                            })
                      ),
                      toolZoneIndex > 0
                        ? React.createElement('button', {
                            style: neStyles.tbtn,
                            title: 'Remonter la zone d\'outils',
                            onClick: moveToolZoneUp
                          }, React.createElement('span', { className: 'material-icons-outlined', style: { fontSize: 16 } }, 'arrow_upward'))
                        : null,
                      toolZoneIndex < sections.length
                        ? React.createElement('button', {
                            style: neStyles.tbtn,
                            title: 'Descendre la zone d\'outils',
                            onClick: moveToolZoneDown
                          }, React.createElement('span', { className: 'material-icons-outlined', style: { fontSize: 16 } }, 'arrow_downward'))
                        : null
                    ),

                    toolOpen && toolLoc === 'default'
                      ? React.createElement(ClinicalTool, {
                          onClose: closeTool,
                          onHandleDown: onHandleDown,
                          dragging: dragging,
                          bodyCollapsed: toolBodyCollapsed,
                          onBodyCollapseChange: setToolBodyCollapsed
                        })
                      : null
                  )
                )
              );
            }

            // Section
            var sec = item.sec;
            var idx = item.idx;
            var sp = sectionSplits[sec.id] || { top: '', bot: '' };
            var isSplit = toolLoc === sec.id;

            return (
              React.createElement(React.Fragment, { key: sec.id },
                hasDividerBefore ? React.createElement('div', { style: neStyles.divider }) : null,

                /* En-tête de section */
                React.createElement('div', { style: neStyles.secHead },
                  React.createElement(SectionTitle, {
                    value: sec.title,
                    onChange: function(newTitle) {
                      setSections(function(secs) {
                        return secs.map(function(s) {
                          return s.id === sec.id ? Object.assign({}, s, { title: newTitle }) : s;
                        });
                      });
                    }
                  }),
                  React.createElement('div', { style: { display: 'flex', gap: 2, alignItems: 'center' } },
                    /* Boutons de réordonnancement */
                    sections.length > 1 && idx > 0
                      ? React.createElement('button', {
                          style: neStyles.tbtn,
                          title: 'Remonter la section',
                          onClick: function() { moveSectionUp(idx); }
                        }, React.createElement('span', { className: 'material-icons-outlined', style: { fontSize: 16 } }, 'arrow_upward'))
                      : null,
                    sections.length > 1 && idx < sections.length - 1
                      ? React.createElement('button', {
                          style: neStyles.tbtn,
                          title: 'Descendre la section',
                          onClick: function() { moveSectionDown(idx); }
                        }, React.createElement('span', { className: 'material-icons-outlined', style: { fontSize: 16 } }, 'arrow_downward'))
                      : null,
                    /* Bouton supprimer */
                    sections.length > 1
                      ? React.createElement('button', {
                          style: neStyles.tbtn,
                          title: 'Supprimer la section',
                          onClick: function() { removeSection(sec.id); }
                        }, React.createElement('span', { className: 'material-icons-outlined', style: { fontSize: 18 } }, 'delete_outline'))
                      : null
                  )
                ),

                /* Éditeur */
                React.createElement('div', {
                  ref: function(el) { sectionWrapRefs.current[sec.id] = el; },
                  onKeyDown: onWrapKey(sec.id),
                  style: { position: 'relative' }
                },
                  isSplit
                    ? React.createElement(React.Fragment, null,
                        sp.top.trim() !== ''
                          ? React.createElement(EditorField, {
                              id: sec.id + '-top',
                              placeholder: 'Appuyer sur « / » pour afficher les commandes',
                              value: sp.top, chips: chips,
                              onChange: function(v) { setSplitTop(sec.id, v); },
                              onAddChip: onAddChip, onChipClick: onChipClick, linkedChipId: linkedChipId
                            })
                          : null,
                        toolOpen
                          ? React.createElement(ClinicalTool, {
                              onClose: closeTool, onHandleDown: onHandleDown,
                              dragging: dragging, bodyCollapsed: toolBodyCollapsed,
                              onBodyCollapseChange: setToolBodyCollapsed
                            })
                          : null,
                        React.createElement(EditorField, {
                          id: sec.id + '-bot',
                          placeholder: 'Appuyer sur « / » pour afficher les commandes',
                          value: sp.bot, chips: chips,
                          onChange: function(v) { setSplitBot(sec.id, v); },
                          onAddChip: onAddChip, onChipClick: onChipClick, linkedChipId: linkedChipId
                        })
                      )
                    : React.createElement(EditorField, {
                        id: sec.id,
                        placeholder: 'Appuyer sur « / » pour afficher les commandes',
                        value: sec.content, chips: chips,
                        onChange: function(v) { setSectionContent(sec.id, v); },
                        onAddChip: onAddChip, onChipClick: onChipClick, linkedChipId: linkedChipId
                      }),
                  dragging && drop && drop.type === 'gap' && drop.field === sec.id
                    ? React.createElement('div', { className: 'ct-dropline', style: { top: drop.y } })
                    : null
                )
              )
            );
          })}

          <div style={neStyles.divider} />

          {/* Ajouter une section */}
          <button style={neStyles.addSectionBtn} onClick={addSection}>
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>add</span>
            Ajouter une section
          </button>

        </div>
      }

      {/* Clinical tool picker */}
      {pickerOpen &&
        <ClinicalToolPicker
          anchorRect={pickerAnchor}
          onClose={function() { setPickerOpen(false); }}
          onSelect={handleToolSelect} />
      }

      {/* Chip popover */}
      {popoverChip &&
        <ChipPopover
          chip={popoverChip}
          anchorRect={popover.anchorRect}
          onClose={function() { setPopover(null); setLinkedChipId(null); }}
          onSave={savePopover}
          onRevert={revertChip}
          onDelete={deleteChip} />
      }
    </div>
  );
}

// ---------------------------------------------------------
// SectionTitle — titre de section éditable inline
// ---------------------------------------------------------
function SectionTitle({ value, onChange }) {
  var _s = React.useState(false);
  var editing = _s[0], setEditing = _s[1];
  var _d = React.useState(value);
  var draft = _d[0], setDraft = _d[1];

  function commit() { if (draft.trim()) onChange(draft.trim()); setEditing(false); }

  if (editing) {
    return React.createElement('input', {
      autoFocus: true,
      style: neStyles.secTitleInput,
      value: draft,
      onChange: function(e) { setDraft(e.target.value); },
      onBlur: commit,
      onKeyDown: function(e) {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }
    });
  }

  return React.createElement('span', {
    style: Object.assign({}, neStyles.sectionLabel, neStyles.sectionLabelEditable),
    title: 'Cliquer pour renommer',
    onClick: function() { setDraft(value); setEditing(true); }
  },
    value,
    React.createElement('span', {
      className: 'material-icons-outlined',
      style: { fontSize: 13, marginLeft: 5, opacity: 0.35, verticalAlign: 'middle' }
    }, 'edit')
  );
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
              onFocus={function() { setFocused(true); }}
              onBlur={function() { setFocused(false); }}>
              {(options || []).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
            </select>
            <span className="material-icons-outlined" style={neStyles.fieldIcon}>arrow_drop_down</span>
          </React.Fragment>
        ) : input ? (
          <input
            style={{ ...neFieldStyles.input, colorScheme: 'light' }}
            type={type || 'text'}
            value={value}
            onChange={handleChange}
            onFocus={function() { setFocused(true); }}
            onBlur={function() { setFocused(false); }} />
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
  sectionLabel: { fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif", color: 'rgba(0,0,0,0.6)', cursor: 'default' },
  sectionLabelEditable: { cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  secTitleInput: { fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif", color: 'rgba(0,0,0,0.8)', border: 'none', borderBottom: '1px solid #6967d1', outline: 'none', background: 'transparent', padding: '0 2px', minWidth: 180 },
  secTools: { display: 'flex', gap: 2 },
  tbtn: { width: 28, height: 28, border: 0, background: 'transparent', borderRadius: 6, color: 'rgba(0,0,0,0.38)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, background: '#eee', margin: '12px 0' },
  chipsRow: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 },
  zoneControls: { display: 'flex', gap: 2, marginBottom: 4 },
  toolsIconBtn: { width: 36, height: 36, border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip: { display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', font: "500 13px 'Inter', sans-serif", color: 'rgba(0,0,0,0.72)', background: '#fff', flexShrink: 0 },
  addSectionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', font: "400 13px 'Inter', sans-serif", padding: '4px 0', borderRadius: 6 },
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
    if (tags.some(function(x) { return x.toLowerCase() === t.toLowerCase(); })) { setInput(''); return; }
    onChange(tags.concat([t]));
    setInput('');
  }
  function removeTag(i) { onChange(tags.filter(function(_, k) { return k !== i; })); }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && input === '' && tags.length) { e.preventDefault(); removeTag(tags.length - 1); }
  }

  const suggestions = TAG_SUGGESTIONS.filter(function(s) {
    return !tags.some(function(t) { return t.toLowerCase() === s.toLowerCase(); }) &&
      (input.trim() === '' || s.toLowerCase().includes(input.trim().toLowerCase()));
  }).slice(0, 6);

  return (
    <div style={tagStyles.row}>
      <div
        style={{ ...tagStyles.wrap, ...(focused ? tagStyles.wrapFocused : {}) }}
        onMouseDown={function(e) { if (e.target === e.currentTarget || e.target.dataset.tagshell) { inputRef.current && inputRef.current.focus(); } }}>
        <span style={{ ...neFieldStyles.label, ...neFieldStyles.labelFloating, ...(focused ? { color: '#6967d1' } : {}) }}>Étiquettes</span>
        <div style={tagStyles.inner} data-tagshell="1">
          <span className="material-icons-outlined" style={tagStyles.icon}>sell</span>
          {tags.map(function(t, i) {
            return (
              <span key={t + i} style={tagStyles.chip}>
                {t}
                <button type="button" style={tagStyles.chipX} title="Retirer" onClick={function() { removeTag(i); }}>
                  <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                </button>
              </span>);
          })}
          <input
            ref={inputRef}
            style={tagStyles.input}
            value={input}
            placeholder={tags.length ? 'Ajouter…' : 'Ajouter une étiquette…'}
            onChange={function(e) { setInput(e.target.value); }}
            onKeyDown={onKeyDown}
            onFocus={function() { setFocused(true); }}
            onBlur={function() { setTimeout(function() { setFocused(false); }, 120); }} />
        </div>
        {focused && suggestions.length > 0 &&
          <div style={tagStyles.menu}>
            {suggestions.map(function(s) {
              return (
                <div key={s} style={tagStyles.menuItem}
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#f3f2fb'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                  onMouseDown={function(e) { e.preventDefault(); addTag(s); inputRef.current && inputRef.current.focus(); }}>
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
