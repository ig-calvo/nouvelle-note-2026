// =========================================================
// editor.jsx — Rich-text editor powered by Quill
// - Each field is a Quill instance (snow theme, no toolbar shown)
// - Chips are custom embed blots ('chip') with { cid, type, label, icon }
// - Ghost-text + slash menu driven by Quill's text-change events
// - app.jsx contract preserved: value = string with {{CHIP:id}} markers
// =========================================================
const { useState: useStateE, useEffect: useEffectE, useRef: useRefE } = React;

let _chipSeq = 1;
function newChipId() {return 'c' + _chipSeq++;}

// ---------------------------------------------------------
// Register the chip embed blot with Quill (once, globally)
// ---------------------------------------------------------
(function registerChipBlot() {
  if (window.__chipBlotRegistered) return;
  const Embed = Quill.import('blots/embed');
  class ChipBlot extends Embed {
    static blotName = 'chip';
    static tagName = 'span';
    static className = 'ql-chip';

    static create(data) {
      const node = super.create();
      node.setAttribute('data-cid', data.cid);
      node.setAttribute('data-type', data.type || '');
      node.setAttribute('contenteditable', 'false');
      node.classList.add('chip');
      if (data.rx) {
        // Rich inline order chip: [icon] Name dose | [detail box]
        const kind = data.rx.kind || 'rx';
        node.classList.add('chip--rx');
        node.classList.add('chip--' + kind);
        node.setAttribute('data-rx', JSON.stringify(data.rx));
        node.setAttribute('data-label', data.label || '');
        const ic = document.createElement('span');
        if (kind === 'rx') {
          ic.className = 'chip-rx-icon';
          ic.textContent = '℞';
        } else {
          ic.className = 'material-symbols-outlined chip-rx-glyph';
          ic.textContent = kind === 'lab' ? 'science' : 'radiology';
        }
        node.appendChild(ic);
        const nm = document.createElement('span');
        nm.className = 'chip-rx-name';
        nm.textContent = data.rx.name || '';
        node.appendChild(nm);
        const ds = document.createElement('span');
        ds.className = 'chip-rx-dose';
        ds.textContent = data.rx.dose || '';
        node.appendChild(ds);
        const sg = document.createElement('span');
        sg.className = 'chip-rx-sig';
        sg.textContent = data.rx.sig || '';
        node.appendChild(sg);
        return node;
      }
      // icon
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined chip-icon';
      ic.textContent = data.icon || 'bookmark';
      node.appendChild(ic);
      // label
      const lbl = document.createElement('span');
      lbl.textContent = data.label || '';
      node.appendChild(lbl);
      return node;
    }
    static value(node) {
      if (node.classList.contains('chip--rx')) {
        let rx = {};
        try { rx = JSON.parse(node.getAttribute('data-rx') || '{}'); } catch (e) {}
        return {
          cid: node.getAttribute('data-cid'),
          type: node.getAttribute('data-type'),
          label: node.getAttribute('data-label') || '',
          icon: rx.kind === 'lab' ? 'science' : rx.kind === 'img' ? 'radiology' : 'pill',
          rx
        };
      }
      return {
        cid: node.getAttribute('data-cid'),
        type: node.getAttribute('data-type'),
        label: node.querySelector('span:not(.chip-icon)')?.textContent || '',
        icon: node.querySelector('.chip-icon')?.textContent || ''
      };
    }
    length() {return 1;}
  }
  Quill.register(ChipBlot);
  window.__chipBlotRegistered = true;
})();

// ---------------------------------------------------------
// Inline format used to highlight the live "/command" text while the
// slash menu is open (renders as the rounded pill behind e.g. "/rx").
// ---------------------------------------------------------
(function registerSlashFmt() {
  if (window.__slashFmtRegistered) return;
  const Parchment = Quill.import('parchment');
  const SlashCmd = new Parchment.ClassAttributor('slashcmd', 'ql-slashcmd', {
    scope: Parchment.Scope.INLINE
  });
  Quill.register(SlashCmd, true);
  window.__slashFmtRegistered = true;
})();

// ---------------------------------------------------------
// Transient inline badge shown once an order command (/rx /lab /img) is
// activated: the "/rx " text collapses into a small icon badge while the
// user types the product/analysis/exam name. Never serialized — it only
// exists between activation and chip insertion (or abandonment).
// ---------------------------------------------------------
(function registerOrderBadgeBlot() {
  if (window.__orderBadgeRegistered) return;
  const Embed = Quill.import('blots/embed');
  class OrderBadgeBlot extends Embed {
    static blotName = 'orderbadge';
    static tagName = 'span';
    static className = 'ql-orderbadge';
    static create(data) {
      const node = super.create();
      const kind = (data && data.kind) || 'rx';
      node.setAttribute('data-kind', kind);
      node.setAttribute('contenteditable', 'false');
      node.classList.add('orderbadge', 'orderbadge--' + kind);
      const ic = document.createElement('span');
      if (kind === 'rx') {
        ic.className = 'orderbadge-rx';
        ic.textContent = '℞';
      } else {
        ic.className = 'material-symbols-outlined orderbadge-glyph';
        ic.textContent = kind === 'lab' ? 'science' : 'radiology';
      }
      node.appendChild(ic);
      return node;
    }
    static value(node) {return { kind: node.getAttribute('data-kind') || 'rx' };}
    length() {return 1;}
  }
  Quill.register(OrderBadgeBlot);
  window.__orderBadgeRegistered = true;
})();

// ---------------------------------------------------------
// Convert stored value ("text {{CHIP:cid}} more\n...") to Quill delta
// ---------------------------------------------------------
function storedToDelta(stored, chips) {
  const ops = [];
  const parts = (stored || '').split(/(\{\{CHIP:[^}]+\}\})/g);
  for (const p of parts) {
    const m = /^\{\{CHIP:([^}]+)\}\}$/.exec(p);
    if (m) {
      const chip = chips[m[1]];
      if (chip) {
        const meta = window.NOTE_DATA.ENTITY_TYPES[chip.entity.type] || {};
        ops.push({ insert: { chip: {
              cid: m[1],
              type: chip.entity.type,
              label: chip.entity.label,
              icon: meta.icon || 'bookmark',
              rx: chip.entity.rx || undefined
            } } });
      }
    } else if (p) {
      ops.push({ insert: p });
    }
  }
  if (ops.length === 0 || typeof ops[ops.length - 1].insert !== 'string' || !ops[ops.length - 1].insert.endsWith('\n')) {
    ops.push({ insert: '\n' });
  }
  return { ops };
}

// Caret index implied by a text-change delta (end of the inserted/retained
// region). Used because Quill fires text-change before it settles the live
// selection on native input, so q.getSelection() lags by the inserted length.
function caretFromDelta(delta) {
  let idx = 0;
  for (const op of (delta && delta.ops) || []) {
    if (op.retain != null) idx += (typeof op.retain === 'number' ? op.retain : 1);
    else if (typeof op.insert === 'string') idx += op.insert.length;
    else if (op.insert != null) idx += 1; // embed
    // delete: caret stays at idx
  }
  return idx;
}

// Delta → stored string (with chip markers); preserves newlines.
function deltaToStored(delta) {
  let out = '';
  for (const op of delta.ops || []) {
    if (typeof op.insert === 'string') out += op.insert;else
    if (op.insert && op.insert.chip) out += '{{CHIP:' + op.insert.chip.cid + '}}';
  }
  // Quill always keeps a trailing \n; strip it for storage parity
  if (out.endsWith('\n')) out = out.slice(0, -1);
  return out;
}

// Plain text (for recognizer) — chip = 1 char placeholder
function deltaToPlain(delta) {
  let out = '';
  for (const op of delta.ops || []) {
    if (typeof op.insert === 'string') out += op.insert;else
    if (op.insert && op.insert.chip) out += '\u0000';
  }
  if (out.endsWith('\n')) out = out.slice(0, -1);
  return out;
}

// Highlight the prefix that matches the user's typed query
function MedHighlight({ name, query }) {
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nq = norm(query);
  const nn = norm(name);
  if (!nq || !nn.startsWith(nq)) return name;
  return (
    <>
      <span className="med-menu__match">{name.slice(0, query.length)}</span>
      {name.slice(query.length)}
    </>);

}

// Flatten /rx search results into one keyboard-navigable list
function flattenRxResults(r) {
  return r.favoris.concat(r.frequents, r.autres);
}

// ---------------------------------------------------------
// EditorField — one Quill instance per field
// ---------------------------------------------------------
function EditorField({ id, placeholder, value, chips, onChange, onAddChip, onChipClick, linkedChipId }) {
  const hostRef = useRefE(null);
  const quillRef = useRefE(null);
  const lastStoredRef = useRefE('');
  const silentRef = useRefE(false);
  const [ghost, setGhost] = useStateE(null); // { matched, ghost, entity, caret, pos:{left,top} }
  const [slash, setSlash] = useStateE(null); // { query, activeIndex, pos:{top,left}, startIndex }
  const [funcMenu, setFuncMenu] = useStateE(null); // { top, left } — opened from the + button
  const [, setFavBump] = useStateE(0); // re-render when favorites toggle
  const [addBtnOffset, setAddBtnOffset] = useStateE(null); // null = CSS default (unfocused)
  const addBtnRef = useRefE(null);
  const slashFmtRef = useRefE(null); // {index, length} of the highlighted "/command" run

  // Paint / clear the rounded highlight behind the live "/command" text.
  function clearSlashPaint() {
    const q = quillRef.current;const f = slashFmtRef.current;
    slashFmtRef.current = null;
    if (!q || !f) return;
    silentRef.current = true;
    try { q.formatText(f.index, f.length, 'slashcmd', false, 'silent'); } catch (e) {}
    silentRef.current = false;
  }
  function paintSlash(index, length) {
    const q = quillRef.current;if (!q) return;
    const prev = slashFmtRef.current;
    if (prev && prev.index === index && prev.length === length) return;
    clearSlashPaint();
    if (length > 0) {
      silentRef.current = true;
      try { q.formatText(index, length, 'slashcmd', 'on', 'silent'); } catch (e) {}
      silentRef.current = false;
      slashFmtRef.current = { index, length };
    }
  }
  // Locate the transient order badge embed (if any) and its index.
  function orderBadgeNode() {
    const q = quillRef.current;if (!q) return null;
    return q.root.querySelector('.ql-orderbadge');
  }
  function orderBadgeIndex() {
    const q = quillRef.current;const node = orderBadgeNode();
    if (!q || !node) return -1;
    try { const blot = Quill.find(node); return blot ? q.getIndex(blot) : -1; } catch (e) { return -1; }
  }
  function removeOrderBadge() {
    const q = quillRef.current;const idx = orderBadgeIndex();
    if (q && idx >= 0) {
      silentRef.current = true;
      try { q.deleteText(idx, 1, 'silent'); } catch (e) {}
      silentRef.current = false;
    }
  }
  // Close the slash menu and remove its highlight (text still present).
  function closeSlashMenu() {
    clearSlashPaint();
    if (slashStateRef.current && slashStateRef.current.mode === 'order') removeOrderBadge();
    setSlash(null);slashStateRef.current = null;
  }

  // --- init Quill once
  useEffectE(() => {
    if (!hostRef.current || quillRef.current) return;
    const q = new Quill(hostRef.current, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: false, keyboard: { bindings: {} } },
      formats: ['bold', 'italic', 'underline', 'strike', 'list', 'indent', 'header', 'blockquote', 'code-block', 'link', 'color', 'background', 'chip', 'slashcmd', 'orderbadge']
    });
    quillRef.current = q;

    // Paint initial content
    silentRef.current = true;
    q.setContents(storedToDelta(value, chips), 'silent');
    silentRef.current = false;
    lastStoredRef.current = value || '';

    // Text-change: sync stored, drive recognizer
    q.on('text-change', (_delta, _old, source) => {
      const stored = deltaToStored(q.getContents());
      if (stored !== lastStoredRef.current) {
        lastStoredRef.current = stored;
        if (source === 'user') onChange(stored);
      }
      if (source === 'user') {
        // Pass the caret implied by the delta — q.getSelection() lags by the
        // inserted length during native typing (and may emit no follow-up
        // selection-change), which previously kept "/" from opening the menu.
        const caret = caretFromDelta(_delta);
        updateGhostAndSlash(q, caret);
        updateAddBtnPos(q, caret);
      }
    });

    // Selection-change: re-evaluate ghost/slash position
    q.on('selection-change', (range) => {
      if (!range) {setGhost(null);setAddBtnOffset(null);return;}
      updateAddBtnPos(q, range.index);
      updateGhostAndSlash(q);
    });

    // Chip click handler (delegated on the editor root)
    q.root.addEventListener('mousedown', (e) => {
      const chipEl = e.target.closest('.chip[data-cid]');
      if (chipEl) {
        e.preventDefault();
        onChipClick(chipEl.getAttribute('data-cid'), chipEl.getBoundingClientRect());
      }
    });

    // Keyboard: Tab accepts ghost; slash nav handled on keydown capture
    q.root.addEventListener('keydown', onKeyDownCapture, true);

    function onKeyDownCapture(e) {
      // Slash navigation first — we'll intercept when menu is open
      if (slashStateRef.current) {
        const s0 = slashStateRef.current;
        const isOrder = s0.mode === 'order';
        const listFor = (query) => isOrder
          ? flattenRxResults(window.NOTE_DATA.searchOrder(s0.kind, query || ''))
          : filterSlash(query);
        if (e.key === 'Escape') {e.preventDefault();closeSlashMenu();return;}
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlash((s) => {const items = listFor(s.query);const ns = { ...s, activeIndex: Math.min(items.length - 1, s.activeIndex + 1) };slashStateRef.current = ns;return ns;});
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlash((s) => {const ns = { ...s, activeIndex: Math.max(0, s.activeIndex - 1) };slashStateRef.current = ns;return ns;});
          return;
        }
        if (e.key === 'Enter' || (isOrder && e.key === 'Tab')) {
          e.preventDefault();
          const items = listFor(s0.query);
          const it = items[s0.activeIndex];
          if (it) { isOrder ? insertOrderChip(it) : chooseSlashItem(it); }
          return;
        }
      }
      // Med dropdown keyboard handling (Tab / Enter / Arrow / Esc)
      if (ghostRef.current && ghostRef.current.options && ghostRef.current.options.length) {
        if (e.key === 'Escape') {e.preventDefault();setGhost(null);return;}
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setGhost((g) => {
            if (!g) return g;
            const ni = Math.min(g.options.length - 1, g.activeIndex + 1);
            const ng = { ...g, activeIndex: ni };
            ghostRef.current = ng;
            return ng;
          });
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setGhost((g) => {
            if (!g) return g;
            const ni = Math.max(0, g.activeIndex - 1);
            const ng = { ...g, activeIndex: ni };
            ghostRef.current = ng;
            return ng;
          });
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          acceptGhost();
          return;
        }
      }
    }
  }, []);

  // Live refs so keydown handler (bound once) sees current state
  const ghostRef = useRefE(null);ghostRef.current = ghost;
  const slashStateRef = useRefE(null);slashStateRef.current = slash;

  // --- push external value updates into Quill (e.g. scenario change, toast revert)
  useEffectE(() => {
    const q = quillRef.current;if (!q) return;
    if (value === lastStoredRef.current) return;
    const sel = q.getSelection();
    silentRef.current = true;
    q.setContents(storedToDelta(value, chips), 'silent');
    silentRef.current = false;
    lastStoredRef.current = value || '';
    if (sel) {try {q.setSelection(sel.index, 0, 'silent');} catch {}}
  }, [value]);

  // --- reflect chips-map changes (label edits, linked highlight) without full reset
  useEffectE(() => {
    const q = quillRef.current;if (!q) return;
    // Update chip labels/icons in-place
    q.root.querySelectorAll('.chip[data-cid]').forEach((node) => {
      const cid = node.getAttribute('data-cid');
      const chip = chips[cid];
      if (chip) {
        if (node.classList.contains('chip--rx')) {
          const rx = chip.entity.rx || {};
          const nm = node.querySelector('.chip-rx-name');
          if (nm && nm.textContent !== (rx.name || '')) nm.textContent = rx.name || '';
          const ds = node.querySelector('.chip-rx-dose');
          if (ds && ds.textContent !== (rx.dose || '')) ds.textContent = rx.dose || '';
          const sg = node.querySelector('.chip-rx-sig');
          if (sg && sg.textContent !== (rx.sig || '')) sg.textContent = rx.sig || '';
          node.setAttribute('data-rx', JSON.stringify(rx));
          node.setAttribute('data-label', chip.entity.label || '');
          node.classList.toggle('open', linkedChipId === cid);
          return;
        }
        const labelEl = node.querySelector('span:not(.chip-icon)');
        if (labelEl && labelEl.textContent !== chip.entity.label) labelEl.textContent = chip.entity.label;
        const meta = window.NOTE_DATA.ENTITY_TYPES[chip.entity.type] || {};
        const iconEl = node.querySelector('.chip-icon');
        if (iconEl && iconEl.textContent !== (meta.icon || 'bookmark')) iconEl.textContent = meta.icon || 'bookmark';
        node.classList.toggle('open', linkedChipId === cid);
      }
    });
  }, [chips, linkedChipId]);

  // ---------------------------------------------------------
  // Ghost text + slash detection
  // ---------------------------------------------------------
  function updateGhostAndSlash(q, caretHint) {
    let caret = caretHint;
    if (caret == null) {
      const range = q.getSelection();
      if (!range) {setGhost(null);return;}
      caret = range.index;
    }
    const plainBefore = q.getText(0, caret);

    // Slash detection: `/` opens a command menu when it begins a "word"
    // (start of the field or right after whitespace). While open we keep the
    // query in sync with whatever follows the slash, and dismiss as soon as
    // the command is clearly abandoned.
    const ch = plainBefore.slice(-1);
    if (slashStateRef.current && slashStateRef.current.mode === 'order') {
      // Order mode: command lives as [badge embed][query text]. The query may
      // contain spaces (drug/analysis names), so we only bail when the badge is
      // gone, the caret moves before it, or a newline is typed.
      const s = slashStateRef.current;
      const bIdx = orderBadgeIndex();
      if (bIdx < 0 || caret <= bIdx) {
        closeSlashMenu();
      } else {
        const query = caret > bIdx + 1 ? q.getText(bIdx + 1, caret - (bIdx + 1)) : '';
        if (/\n/.test(query)) {
          closeSlashMenu();
        } else {
          const pos = getBoundsPos(q, caret);
          const ns = { ...s, query, startIndex: bIdx, pos, activeIndex: query === s.query ? s.activeIndex : 0 };
          setSlash(ns);slashStateRef.current = ns;
          paintSlash(bIdx + 1, query.length);
        }
      }
    } else if (slashStateRef.current) {
      const s = slashStateRef.current;
      // Literal text from the slash up to the caret.
      const raw = caret > s.startIndex ? q.getText(s.startIndex, caret - s.startIndex) : '';
      const query = raw.replace(/^\//, '');
      const slashIntact = q.getText(s.startIndex, 1) === '/';
      // "/rx ", "/lab ", "/img " (kind followed by a space) promotes to order
      // mode: the literal text collapses into an icon badge.
      const orderSpace = /^(rx|lab|img)\s/i.exec(query);
      if (caret <= s.startIndex || !slashIntact || /\n/.test(query)) {
        closeSlashMenu();
      } else if (orderSpace) {
        enterOrderMode(orderSpace[1].toLowerCase(), query.slice(orderSpace[0].length));
        return;
      } else if (/\s/.test(query)) {
        // Plain command with whitespace → user moved on to prose.
        closeSlashMenu();
      } else {
        const pos = getBoundsPos(q, caret);
        const ns = { ...s, query, pos, activeIndex: query === s.query ? s.activeIndex : 0 };
        setSlash(ns);slashStateRef.current = ns;
        paintSlash(s.startIndex, query.length + 1);
      }
    } else if (ch === '/') {
      // Open at a WORD BOUNDARY: the start of the field, right after a line
      // break, or right after a space. This covers both the start of a line
      // and a "/" typed mid-sentence after a space — while still keeping dates
      // (12/05), fractions and URLs (prev char is a digit/letter) from firing.
      const prevCh = caret >= 2 ? plainBefore.slice(-2, -1) : '';
      const atBoundary = prevCh === '' || /\s/.test(prevCh);
      if (atBoundary) {
        const pos = getBoundsPos(q, caret);
        const ns = { query: '', activeIndex: 0, pos, startIndex: caret - 1 };
        setSlash(ns);slashStateRef.current = ns;
        paintSlash(caret - 1, 1);
        setGhost(null);
        return;
      }
    }

    // Med dropdown: only if no slash menu open
    if (slashStateRef.current) {setGhost(null);return;}
    let g = null;
    for (const r of window.NOTE_DATA.RECOGNIZERS) {
      const m = r.test(plainBefore.slice(-40));
      if (m) {
        const s = r.suggest(m.matched, m.options || []);
        const pos = getBoundsPos(q, caret);
        g = { matched: m.matched, options: s.options, caret, pos, activeIndex: 0 };
        break;
      }
    }
    setGhost(g);
  }

  function getBoundsPos(q, index) {
    try {
      const b = q.getBounds(index);
      const rect = q.root.getBoundingClientRect();
      const cs = getComputedStyle(q.root);
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      // Quill 2.getBounds returns viewport-ish coords relative to editor ROOT (border box).
      // So rect.top + b.top is the absolute top of the caret's line.
      return {
        caretLeft: rect.left + b.left,
        caretTop: rect.top + b.top,
        caretBottom: rect.top + b.bottom,
        lineHeight: b.height,
        editorLeft: rect.left + padLeft,
        editorRight: rect.right - padRight
      };
    } catch {
      return { caretLeft: 0, caretTop: 0, caretBottom: 0, lineHeight: 20, editorLeft: 0, editorRight: window.innerWidth };
    }
  }

  function updateAddBtnPos(q, index) {
    try {
      const sel = index !== undefined ? { index } : (q.getSelection(true) || { index: 0 });
      const b = q.getBounds(sel.index);
      setAddBtnOffset(Math.max(0, b.top + b.height / 2 - 15));
    } catch {}
  }

  // Measure ghost text width (off-DOM) so we can decide inline vs next-line placement
  function measureGhostWidth(text) {
    let el = document.getElementById('__ghost_measure');
    if (!el) {
      el = document.createElement('span');
      el.id = '__ghost_measure';
      el.style.cssText = 'position:fixed;visibility:hidden;white-space:nowrap;font-family:var(--font-body);font-size:15px;padding:0 4px;';
      document.body.appendChild(el);
    }
    el.textContent = text + '  Tab'; // include Tab chip approx
    return el.getBoundingClientRect().width + 28; // + Tab chip padding/margin
  }

  function acceptGhost() {
    const q = quillRef.current;
    const g = ghostRef.current;
    if (!q || !g || !g.options || !g.options.length) return;
    const picked = g.options[g.activeIndex] || g.options[0];
    const entity = picked.entity;
    const chipId = newChipId();
    // Remove the matched text from quill, insert chip + trailing space
    const removeFrom = g.caret - g.matched.length;
    silentRef.current = true;
    q.deleteText(removeFrom, g.matched.length, 'silent');
    const meta = window.NOTE_DATA.ENTITY_TYPES[entity.type] || {};
    q.insertEmbed(removeFrom, 'chip', {
      cid: chipId, type: entity.type, label: entity.text || entity.label, icon: meta.icon || 'bookmark'
    }, 'silent');
    q.insertText(removeFrom + 1, ' ', 'silent');
    q.setSelection(removeFrom + 2, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    const entityForChip = { ...entity, label: entity.text || entity.label };
    onAddChip(id, { chipId, entity: entityForChip, _prebuilt: true, storedOverride: stored });
    setGhost(null);
  }

  function chooseSlashItem(it) {
    const q = quillRef.current;if (!q) return;
    if (it.rxSearch || it.orderSearch) { enterOrderMode(it.kbd || 'rx'); return; }
    const s = slashStateRef.current;
    const chipId = newChipId();
    silentRef.current = true;
    let insertAt;
    if (s) {
      // triggered by typing "/query" — remove it first
      q.deleteText(s.startIndex, s.query.length + 1, 'silent');
      slashFmtRef.current = null;
      insertAt = s.startIndex;
    } else {
      // triggered by the + button — insert at caret (or end)
      const sel = q.getSelection(true);
      insertAt = sel ? sel.index : Math.max(0, q.getLength() - 1);
    }
    const meta = window.NOTE_DATA.ENTITY_TYPES[it.template.type] || {};
    q.insertEmbed(insertAt, 'chip', {
      cid: chipId, type: it.template.type, label: it.template.label, icon: meta.icon || 'bookmark'
    }, 'silent');
    q.insertText(insertAt + 1, ' ', 'silent');
    q.setSelection(insertAt + 2, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onAddChip(id, {
      chipId,
      entity: JSON.parse(JSON.stringify(it.template)),
      _prebuilt: true,
      storedOverride: stored,
      openAfter: true
    });
    setSlash(null);slashStateRef.current = null;
    setFuncMenu(null);
  }

  function filterSlash(q) {
    const t = (q || '').toLowerCase().trim();
    if (!t) return window.NOTE_DATA.SLASH_ITEMS;
    return window.NOTE_DATA.SLASH_ITEMS.filter((it) => it.title.toLowerCase().includes(t) || it.kbd.includes(t));
  }

  // ---------------------------------------------------------
  // Mode commande (/rx · /lab · /img) — recherche et insertion
  // ---------------------------------------------------------
  function enterOrderMode(kbd, carryQuery) {
    const q = quillRef.current; if (!q) return;
    const kind = window.NOTE_DATA.orderKindForKbd(kbd) || 'rx';
    carryQuery = carryQuery || '';
    const s = slashStateRef.current;
    clearSlashPaint();
    silentRef.current = true;
    let at;
    if (s) {
      // Remove the literal "/…" text from the slash up to the live caret.
      const sel = q.getSelection();
      const end = sel ? sel.index : s.startIndex + (s.query || '').length + 1;
      q.deleteText(s.startIndex, Math.max(0, end - s.startIndex), 'silent');
      at = s.startIndex;
    } else {
      const sel = q.getSelection(true);
      at = sel ? sel.index : Math.max(0, q.getLength() - 1);
    }
    q.insertEmbed(at, 'orderbadge', { kind }, 'silent');
    if (carryQuery) q.insertText(at + 1, carryQuery, 'silent');
    q.setSelection(at + 1 + carryQuery.length, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onChange(stored);
    const pos = getBoundsPos(q, at + 1 + carryQuery.length);
    const ns = { mode: 'order', kind, query: carryQuery, activeIndex: 0, pos, startIndex: at };
    setSlash(ns); slashStateRef.current = ns;
    if (carryQuery) paintSlash(at + 1, carryQuery.length);
    setGhost(null);
    setFuncMenu(null);
  }

  function insertOrderChip(item) {
    const q = quillRef.current;
    const s = slashStateRef.current;
    if (!q || !s || !item) return;
    const kind = s.kind || 'rx';
    const def = window.NOTE_DATA.ORDER_DEFS[kind];
    const chipId = newChipId();
    const label = (item.name + ' ' + (item.dose || '')).trim();
    const rx = { name: item.name, dose: item.dose || '', sig: item.chipSig || item.sig, kind };
    const bIdx = orderBadgeIndex();
    const at = bIdx >= 0 ? bIdx : s.startIndex;
    const removeLen = (bIdx >= 0 ? 1 : 0) + (s.query || '').length;
    clearSlashPaint();
    silentRef.current = true;
    if (removeLen > 0) q.deleteText(at, removeLen, 'silent');
    q.insertEmbed(at, 'chip', { cid: chipId, type: def.type, label, icon: def.icon, rx }, 'silent');
    q.insertText(at + 1, ' ', 'silent');
    q.setSelection(at + 2, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onAddChip(id, {
      chipId,
      entity: {
        type: def.type,
        label,
        text: label + ' — ' + (item.chipSig || item.sig),
        rx,
        details: JSON.parse(JSON.stringify(item.details || {}))
      },
      _prebuilt: true,
      storedOverride: stored
    });
    setSlash(null); slashStateRef.current = null;
    setGhost(null);
  }

  // Detect order command from slash query: '/rx …', '/lab …', '/img …'
  function orderKindForQuery(query) {
    const m = /^(rx|lab|img)(\s|$)/i.exec(query || '');
    return m ? m[1].toLowerCase() : null;
  }

  const isOrderMode = !!(slash && slash.mode === 'order');
  const orderKind = isOrderMode ? slash.kind : null;
  const orderDef = orderKind ? window.NOTE_DATA.ORDER_DEFS[orderKind] : null;
  const orderQuery = isOrderMode ? (slash.query || '') : '';
  const orderResults = isOrderMode ? window.NOTE_DATA.searchOrder(orderKind, orderQuery) : null;
  const slashItems = slash && !isOrderMode ? filterSlash(slash.query) : [];

  // Open the functions menu (Prescription, Labo, Imagerie…) from the + button
  function openFunctionsMenu() {
    const q = quillRef.current; if (q) q.focus();
    const btn = addBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setFuncMenu({ top: r.bottom + 6, left: r.left });
  }

  return (
    <>
      <div className="note-field-shell">
        <button
          ref={addBtnRef}
          type="button" className="nf-add" title="Insérer une fonction"
          style={addBtnOffset !== null ? { marginTop: addBtnOffset + 'px' } : undefined}
          onMouseDown={(e) => { e.preventDefault(); funcMenu ? setFuncMenu(null) : openFunctionsMenu(); }}>
          <span className="material-icons-outlined">add_circle_outline</span>
        </button>
        <div ref={hostRef} className="note-field" data-field-id={id} style={{ minHeight: "96px" }} />
        <button
          type="button" className="nf-tt" title="Format du texte"
          onMouseDown={(e) => {
            e.preventDefault();
            const q = quillRef.current;
            if (!q) return;
            q.focus();
            const rect = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('ftbar-pin', { detail: { quill: q, rect } }));
          }}>
          <span className="nf-tt-sm">T</span><span className="nf-tt-lg">T</span>
        </button>
      </div>
      {ghost && ghost.options && ghost.options.length > 0 && (() => {
        const pos = ghost.pos;
        const menuWidth = 360;
        // Position below caret line, clamp within viewport
        const left = Math.max(8, Math.min(pos.caretLeft, window.innerWidth - menuWidth - 12));
        const top = pos.caretBottom + 4;
        return (
          <div className="med-menu" role="listbox" style={{
            position: 'fixed',
            left, top, width: menuWidth,
            zIndex: 50
          }}>
            <div className="med-menu__hdr">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
              <span>Médicaments — « {ghost.matched} »</span>
              <span className="med-menu__count">{ghost.options.length}</span>
            </div>
            <div className="med-menu__list">
              {ghost.options.slice(0, 8).map((o, i) =>
              <div
                key={o.stem}
                role="option"
                aria-selected={i === ghost.activeIndex}
                className={'med-menu__item' + (i === ghost.activeIndex ? ' is-active' : '')}
                onMouseEnter={() => {
                  setGhost((g) => g ? { ...g, activeIndex: i } : g);
                  ghostRef.current = { ...ghost, activeIndex: i };
                }}
                onMouseDown={(e) => {e.preventDefault(); /* keep focus */}}
                onClick={() => {
                  ghostRef.current = { ...ghost, activeIndex: i };
                  acceptGhost();
                }}>
                
                  <span className="material-symbols-outlined med-menu__pill">pill</span>
                  <div className="med-menu__body">
                    <div className="med-menu__title">
                      <MedHighlight name={o.label} query={ghost.matched} />
                      {o.brand && o.brand.toLowerCase() !== o.stem.toLowerCase() &&
                    <span className="med-menu__brand">({o.brand})</span>
                    }
                    </div>
                    <div className="med-menu__meta">
                      <span className="med-menu__class">{o.klass}</span>
                      <span className="med-menu__sig">{o.text.split(' — ')[1] || ''}</span>
                    </div>
                  </div>
                  {i === ghost.activeIndex && <span className="med-menu__kbd">↵</span>}
                </div>
              )}
            </div>
            <div className="med-menu__foot">
              <span><kbd>↑ ↓</kbd> naviguer</span>
              <span><kbd>↵</kbd> / <kbd>Tab</kbd> choisir</span>
              <span><kbd>Esc</kbd> annuler</span>
            </div>
          </div>);

      })()}
      {slash && !isOrderMode &&
      <SlashMenu
        position={{ top: slash.pos.caretBottom + 6, left: Math.max(8, Math.min(slash.pos.caretLeft, window.innerWidth - 332)) }}
        query={slash.query}
        activeIndex={slash.activeIndex}
        items={slashItems}
        onSelect={chooseSlashItem}
        onClose={() => closeSlashMenu()} />

      }
      {slash && !isOrderMode && (slash.query || '') === '' &&
      <div className="slash-hint" style={{
        position: 'fixed',
        left: slash.pos.caretLeft + 5,
        top: (slash.pos.caretTop + slash.pos.caretBottom) / 2,
        transform: 'translateY(-50%)',
        zIndex: 48
      }}>Saisissez du texte pour chercher une commande</div>

      }
      {slash && isOrderMode &&
      <RxMenu
        position={{ top: slash.pos.caretBottom + 6, left: Math.max(8, Math.min(slash.pos.caretLeft, window.innerWidth - 416)), zIndex: 60 }}
        kind={orderKind}
        def={orderDef}
        query={orderQuery}
        results={orderResults}
        activeIndex={slash.activeIndex}
        onHover={(i) => setSlash((s) => {if (!s) return s;const ns = { ...s, activeIndex: i };slashStateRef.current = ns;return ns;})}
        onSelect={(it) => insertOrderChip(it)}
        onToggleFav={(k) => {window.NOTE_DATA.toggleOrderFav(orderKind, k);setFavBump((n) => n + 1);}}
        onClose={() => closeSlashMenu()} />

      }
      {funcMenu &&
      <AddMenu
        position={{ top: funcMenu.top, left: funcMenu.left }}
        tools={window.NOTE_DATA.SLASH_ITEMS.filter((t2) => !t2.rxSearch && !t2.orderSearch)}
        orders={window.NOTE_DATA.SLASH_ITEMS.filter((t2) => t2.rxSearch || t2.orderSearch)}
        onPickTool={chooseSlashItem}
        onPickOrder={(kbd) => enterOrderMode(kbd)}
        onClose={() => setFuncMenu(null)} />

      }
    </>);

}

Object.assign(window, { EditorField, newChipId });