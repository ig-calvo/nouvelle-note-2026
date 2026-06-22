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
let _diagSeq = 1;
function newDiagId() {return 'd' + _diagSeq++;}

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
        // Rich inline order chip: [icon] Name dose | [split-sig parts] [edit btn]
        const kind = data.rx.kind || 'rx';
        node.classList.add('chip--rx');
        node.classList.add('chip--' + kind);
        node.setAttribute('data-rx', JSON.stringify(data.rx));
        node.setAttribute('data-label', data.label || '');
        const d = data.details || {};
        if (Object.keys(d).length > 0) node.setAttribute('data-details', JSON.stringify(d));
        const ic = document.createElement('span');
        if (kind === 'rx') {
          ic.className = 'chip-rx-icon';
          ic.setAttribute('data-action', 'modal');
          ic.setAttribute('title', 'Modifier les détails complets');
          ic.textContent = '℞';
        } else {
          ic.className = 'material-symbols-outlined chip-rx-glyph';
          ic.setAttribute('data-action', 'modal');
          ic.setAttribute('title', 'Modifier les détails');
          ic.textContent = kind === 'lab' ? 'science' : kind === 'img' ? 'radiology' : kind === 'ref' ? 'person_add' : 'bookmark';
        }
        node.appendChild(ic);
        const nm = document.createElement('span');
        nm.className = 'chip-rx-name';
        nm.textContent = data.rx.name || '';
        node.appendChild(nm);
        if (kind === 'rx') {
          const ds = document.createElement('span');
          ds.className = 'chip-rx-dose';
          ds.setAttribute('data-field', 'dose');
          ds.textContent = data.rx.dose || '';
          node.appendChild(ds);
          // If structured details available, render split sig parts; otherwise fall back to sig string
          if (d.frequency) {
            const qty = d.form === 'comprimé' ? '1 co' : d.form === 'aérosol-doseur' ? '2 inh' : d.form === 'gélule' ? '1 gél' : '1 dose';
            const fm = document.createElement('span');
            fm.className = 'chip-rx-form';
            fm.setAttribute('data-field', 'form');
            fm.textContent = qty;
            node.appendChild(fm);
            const rt = document.createElement('span');
            rt.className = 'chip-rx-route';
            rt.setAttribute('data-field', 'route');
            rt.textContent = d.route || '';
            node.appendChild(rt);
            const sep1 = document.createElement('span'); sep1.className = 'chip-rx-sep'; sep1.textContent = ' '; node.appendChild(sep1);
            const freq = document.createElement('span');
            freq.className = 'chip-rx-freq';
            freq.setAttribute('data-field', 'frequency');
            freq.textContent = d.frequency;
            node.appendChild(freq);
            const durParts = [];
            if (d.duration && d.duration !== '—') durParts.push('× ' + d.duration + ' ' + (d.durationUnit || 'jours'));
            if (d.refills !== undefined && String(d.refills) !== '' && String(d.refills) !== '0') durParts.push('R' + d.refills);
            if (durParts.length) {
              const sep2 = document.createElement('span'); sep2.className = 'chip-rx-sep'; sep2.textContent = ' '; node.appendChild(sep2);
              const dur = document.createElement('span');
              dur.className = 'chip-rx-dur';
              dur.setAttribute('data-field', 'duration_refills');
              dur.textContent = durParts.join(' ');
              node.appendChild(dur);
            }
          } else {
            const sg = document.createElement('span');
            sg.className = 'chip-rx-sig';
            sg.textContent = data.rx.sig || '';
            node.appendChild(sg);
          }
        } else {
          // Lab / Img / Ref: clickable priority badge (+ optional extras)
          const pr = document.createElement('span');
          pr.className = 'chip-rx-badge';
          pr.setAttribute('data-field', 'priority');
          pr.textContent = d.priority || 'Routine';
          node.appendChild(pr);
          if (kind === 'lab' && d.fasting) {
            const ft = document.createElement('span');
            ft.className = 'chip-rx-sig';
            ft.textContent = 'À jeun';
            node.appendChild(ft);
          }
        }
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
        let rx = {}, details = {};
        try { rx = JSON.parse(node.getAttribute('data-rx') || '{}'); } catch (e) {}
        try { details = JSON.parse(node.getAttribute('data-details') || '{}'); } catch (e) {}
        return {
          cid: node.getAttribute('data-cid'),
          type: node.getAttribute('data-type'),
          label: node.getAttribute('data-label') || '',
          icon: rx.kind === 'lab' ? 'science' : rx.kind === 'img' ? 'radiology' : 'pill',
          rx, details
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
        ic.textContent = kind === 'lab' ? 'science' : kind === 'dx' ? 'local_hospital' : kind === 'ref' ? 'person_add' : 'radiology';
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
// Diagnostic region — a Notion-callout-style block that lives INSIDE a
// section's flow. One single cursor flows: text → [header] → body lines → text.
//   • DiagnosticHeader : a standalone, non-editable block (icon + name +
//                        "promote to problem" button). Atomic (length 1).
//   • DiagnosticBody   : a line-level block format ('diagnostic' = id) on PLAIN
//                        blocks (no container) — same-id lines are grouped into
//                        one box via CSS adjacency. Plain blocks (not a nested
//                        container) keep keyboard input reliable in the line
//                        right after the header.
// ---------------------------------------------------------
(function registerDiagnosticBlots() {
  if (window.__diagBlotsRegistered) return;
  const Block = Quill.import('blots/block');
  const BlockEmbed = Quill.import('blots/block/embed');

  // Body lines are PLAIN blocks (no Container wrapper) carrying a data-diag-id —
  // the canonical Quill "block-embed + block" arrangement, which keeps keyboard
  // input working in the line right after the header. Consecutive same-id lines
  // are grouped into a visual box purely via CSS adjacency.
  class DiagnosticBody extends Block {
    static blotName = 'diagnostic';
    static tagName = 'div';
    static className = 'ql-diag-line';
    static create(value) {
      const node = super.create();
      node.setAttribute('data-diag-id', value || '');
      return node;
    }
    static formats(node) {
      return node.getAttribute('data-diag-id') || undefined;
    }
    format(name, value) {
      if (name === this.statics.blotName && value) {
        this.domNode.setAttribute('data-diag-id', value);
      } else {
        super.format(name, value);
      }
    }
  }

  class DiagnosticHeader extends BlockEmbed {
    static blotName = 'diagnostic-header';
    static tagName = 'div';
    static className = 'ql-diag-header';
    static create(value) {
      const node = super.create();
      value = value || {};
      node.setAttribute('data-diag-id', value.id || '');
      node.setAttribute('contenteditable', 'false');
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined ql-diag-ic';
      ic.textContent = 'local_hospital';
      node.appendChild(ic);
      const nm = document.createElement('span');
      nm.className = 'ql-diag-name';
      nm.setAttribute('data-diag-id', value.id || '');
      nm.textContent = value.name || 'Diagnostic';
      node.appendChild(nm);
      return node;
    }
    static value(node) {
      const nm = node.querySelector('.ql-diag-name');
      return {
        id: node.getAttribute('data-diag-id') || '',
        name: nm ? nm.textContent : ''
      };
    }
    length() { return 1; }
  }

  Quill.register(DiagnosticBody, true);
  Quill.register(DiagnosticHeader, true);

  // Allow the header block embed as a direct child of the scroll.
  const Scroll = Quill.import('blots/scroll');
  if (Scroll.allowedChildren && Scroll.allowedChildren.indexOf(DiagnosticHeader) === -1) {
    Scroll.allowedChildren.push(DiagnosticHeader);
  }
  window.__diagBlotsRegistered = true;
})();

// ---------------------------------------------------------
// Convert stored value to Quill delta.
// Stored format: flat string with inline "{{CHIP:cid}}" markers, plus
// per-line diagnostic-region sentinels:
//     texte avant
//     {{DIAG:<id>|<encodedName>}}
//     ligne de corps {{CHIP:cX}}
//     {{/DIAG}}
//     texte apres
// The diagnostic attribute lands on each body line's terminating newline;
// the header is a block embed. encodeURIComponent on the name keeps the
// marker regex unambiguous (no '}' '|' '{' newline inside).
// ---------------------------------------------------------
const DIAG_OPEN_RE = /^\{\{DIAG:([A-Za-z0-9_-]+)\|([^}]*)\}\}$/;

function storedToDelta(stored, chips) {
  const ops = [];
  const lines = (stored || '').split('\n');
  let curDiag = null;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const mo = DIAG_OPEN_RE.exec(line);
    if (mo) {
      let nm = '';
      try { nm = decodeURIComponent(mo[2]); } catch (e) { nm = mo[2]; }
      ops.push({ insert: { 'diagnostic-header': { id: mo[1], name: nm } } });
      curDiag = mo[1];
      continue;
    }
    if (line === '{{/DIAG}}') { curDiag = null; continue; }
    // normal / body line: split on chip markers
    const parts = line.split(/(\{\{CHIP:[^}]+\}\})/g);
    for (const p of parts) {
      const cm = /^\{\{CHIP:([^}]+)\}\}$/.exec(p);
      if (cm) {
        const chip = chips[cm[1]];
        if (chip) {
          const meta = window.NOTE_DATA.ENTITY_TYPES[chip.entity.type] || {};
          ops.push({ insert: { chip: {
            cid: cm[1],
            type: chip.entity.type,
            label: chip.entity.label,
            icon: meta.icon || 'bookmark',
            rx: chip.entity.rx || undefined,
            details: chip.entity.details || undefined
          } } });
        }
      } else if (p) {
        ops.push({ insert: p });
      }
    }
    if (curDiag != null) ops.push({ insert: '\n', attributes: { diagnostic: curDiag } });
    else ops.push({ insert: '\n' });
  }
  // Ensure the doc ends with a normal trailing line (Quill keeps a trailing \n,
  // and the caret must never be trapped under a region).
  const last = ops[ops.length - 1];
  if (ops.length === 0) {
    ops.push({ insert: '\n' });
  } else if (last.insert && last.insert['diagnostic-header']) {
    ops.push({ insert: '\n', attributes: { diagnostic: last.insert['diagnostic-header'].id } });
    ops.push({ insert: '\n' });
  } else if (last.insert === '\n' && last.attributes && last.attributes.diagnostic) {
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

// Delta → stored string (with chip markers + diagnostic sentinels).
// The diagnostic attribute lives on each body line's newline op, so we walk
// line records and emit {{DIAG:..}} / {{/DIAG}} on region transitions.
function deltaToStored(delta) {
  // Phase 1: ops → line records.
  const recs = []; // {type:'line', text, diag} | {type:'header', id, name}
  let buf = '';
  for (const op of (delta.ops || [])) {
    if (op.insert == null) continue;
    if (typeof op.insert === 'string') {
      const s = op.insert;
      const diag = (op.attributes && op.attributes.diagnostic) || null;
      let start = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '\n') {
          buf += s.slice(start, i);
          recs.push({ type: 'line', text: buf, diag: diag });
          buf = '';
          start = i + 1;
        }
      }
      buf += s.slice(start);
    } else if (op.insert.chip) {
      buf += '{{CHIP:' + op.insert.chip.cid + '}}';
    } else if (op.insert['diagnostic-header']) {
      if (buf) { recs.push({ type: 'line', text: buf, diag: null }); buf = ''; }
      const h = op.insert['diagnostic-header'];
      recs.push({ type: 'header', id: h.id || '', name: h.name || '' });
    }
    // transient embeds (orderbadge) are intentionally dropped
  }
  if (buf) recs.push({ type: 'line', text: buf, diag: null });

  // Phase 2: emit sentinels on diagnostic transitions.
  const out = [];
  let cur = null;
  for (const r of recs) {
    if (r.type === 'header') {
      if (cur != null) out.push('{{/DIAG}}');
      out.push('{{DIAG:' + r.id + '|' + encodeURIComponent(r.name) + '}}');
      cur = r.id;
    } else {
      if (r.diag !== cur) {
        if (cur != null) { out.push('{{/DIAG}}'); cur = null; }
        if (r.diag != null) cur = r.diag; // body line without a header (defensive)
      }
      out.push(r.text);
    }
  }
  if (cur != null) out.push('{{/DIAG}}');
  let result = out.join('\n');
  if (result.endsWith('\n')) result = result.slice(0, -1);
  return result;
}

// Plain text (for recognizer) — chip = 1 char placeholder
function deltaToPlain(delta) {
  let out = '';
  for (const op of delta.ops || []) {
    if (typeof op.insert === 'string') out += op.insert;else
    if (op.insert && op.insert.chip) out += '\u0000';else
    if (op.insert && op.insert['diagnostic-header']) out += '\u0000';
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
function EditorField({ id, placeholder, value, chips, onChange, onAddChip, onChipClick, linkedChipId, onAddSection }) {
  const hostRef = useRefE(null);
  const quillRef = useRefE(null);
  const lastStoredRef = useRefE('');
  const silentRef = useRefE(false);
  const [ghost, setGhost] = useStateE(null); // { matched, ghost, entity, caret, pos:{left,top} }
  const [slash, setSlash] = useStateE(null); // { query, activeIndex, pos:{top,left}, startIndex }
  const [funcMenu, setFuncMenu] = useStateE(null); // { top, left } — opened from the + button
  const [, setFavBump] = useStateE(0); // re-render when favorites toggle
  const [addBtnOffset, setAddBtnOffset] = useStateE(null); // null = CSS default (unfocused)
  const [diagRename, setDiagRename] = useStateE(null); // { id, value, pos:{top,left} } — diagnostic rename popover
  const addBtnRef = useRefE(null);
  const fileInputRef = useRefE(null);
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
    if (slashStateRef.current && (slashStateRef.current.mode === 'order' || slashStateRef.current.mode === 'diagnostic')) removeOrderBadge();
    setSlash(null);slashStateRef.current = null;
  }

  // --- init Quill once
  useEffectE(() => {
    if (!hostRef.current || quillRef.current) return;
    const q = new Quill(hostRef.current, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: false, keyboard: { bindings: {} } },
      formats: ['bold', 'italic', 'underline', 'strike', 'list', 'indent', 'header', 'blockquote', 'code-block', 'link', 'color', 'background', 'chip', 'slashcmd', 'orderbadge', 'diagnostic', 'diagnostic-header']
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

    // --- Diagnostic region keyboard handling (single continuous cursor) ---
    // Enter on the last, empty body line leaves the region (Notion semantics):
    // drop the diagnostic format so the new line rejoins normal flow below.
    function diagId(blot) {
      return blot && blot.domNode && blot.domNode.getAttribute
        ? blot.domNode.getAttribute('data-diag-id') : null;
    }
    function isHeaderBlot(blot) {
      return blot && blot.statics && blot.statics.blotName === 'diagnostic-header';
    }
    q.keyboard.addBinding({ key: 'Enter', collapsed: true, format: ['diagnostic'] }, function (range) {
      const info = q.getLine(range.index);
      const line = info && info[0];
      if (!line) return true;
      const id = diagId(line);
      const isEmpty = line.length() <= 1;          // only the trailing \n
      const isLast = diagId(line.next) !== id;     // next block is not part of this region
      if (isEmpty && isLast) {
        q.formatLine(range.index, 1, 'diagnostic', false, 'user');
        return false;                              // handled — don't insert a new body line
      }
      return true;                                 // normal Enter → new body line in the region
    });
    // Backspace at the start of an empty, only body line removes the whole region.
    q.keyboard.addBinding({ key: 'Backspace', collapsed: true, offset: 0, format: ['diagnostic'] }, function (range) {
      const info = q.getLine(range.index);
      const line = info && info[0];
      if (!line) return true;
      const id = diagId(line);
      const prev = line.prev;
      const isFirst = diagId(prev) !== id;         // first line of this region
      const isLast = diagId(line.next) !== id;
      const isEmpty = line.length() <= 1;
      if (isFirst && isEmpty && isLast) {
        const lineIdx = q.getIndex(line);
        if (isHeaderBlot(prev)) {
          q.deleteText(Math.max(0, lineIdx - 1), 2, 'user'); // header + empty body line
        } else {
          q.deleteText(lineIdx, 1, 'user');                  // just the empty body line
        }
        return false;
      }
      return true;
    });
    // addBinding appends; Quill's default Enter/Backspace handlers would run
    // first and consume the event. Move ours to the front so they win.
    ['Enter', 'Backspace'].forEach(function (k) {
      const arr = q.keyboard.bindings[k];
      if (arr && arr.length) arr.unshift(arr.pop());
    });

    // Chip click handler — detects which zone was clicked (data-field or data-action)
    q.root.addEventListener('mousedown', (e) => {
      // Diagnostic header — "Promouvoir en problème" button → emit a window event
      // that the Sommaire panel listens for (Summary.jsx).
      const promoteEl = e.target.closest('.ql-diag-promote');
      if (promoteEl) {
        e.preventDefault();
        const hdr = promoteEl.closest('.ql-diag-header');
        const nmEl = hdr && hdr.querySelector('.ql-diag-name');
        const nm = nmEl ? nmEl.textContent.trim() : '';
        if (nm) window.dispatchEvent(new CustomEvent('note:add-problem', { detail: { name: nm } }));
        promoteEl.classList.add('ql-diag-promoted');
        return;
      }
      // Diagnostic header — click the name to rename it.
      const diagNameEl = e.target.closest('.ql-diag-name');
      if (diagNameEl) {
        e.preventDefault();
        openDiagRename(diagNameEl);
        return;
      }
      const chipEl = e.target.closest('.chip[data-cid]');
      if (chipEl) {
        e.preventDefault();
        const cid = chipEl.getAttribute('data-cid');
        const actionEl = e.target.closest('[data-action]');
        const fieldEl = e.target.closest('[data-field]');
        if (actionEl) {
          onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { action: actionEl.getAttribute('data-action') });
        } else if (fieldEl) {
          onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { field: fieldEl.getAttribute('data-field'), fieldRect: fieldEl.getBoundingClientRect() });
        } else {
          // Click on name/icon of rx chip → open dose editor by default
          const doseEl = chipEl.querySelector('[data-field="dose"]');
          if (doseEl && chipEl.classList.contains('chip--rx')) {
            onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { field: 'dose', fieldRect: doseEl.getBoundingClientRect() });
          } else {
            onChipClickRef.current(cid, chipEl.getBoundingClientRect(), null);
          }
        }
      }
    });

    // Keyboard: Tab accepts ghost; slash nav handled on keydown capture
    q.root.addEventListener('keydown', onKeyDownCapture, true);

    function onKeyDownCapture(e) {
      // Slash navigation first — we'll intercept when menu is open
      if (slashStateRef.current) {
        const s0 = slashStateRef.current;
        if (s0.mode === 'diagnostic') {
          if (e.key === 'Escape') { e.preventDefault(); closeSlashMenu(); return; }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const suggs = searchCIM10(s0.query || '');
            if (suggs.length > 0) {
              setSlash((s) => { const ns = { ...s, activeIndex: Math.min(suggs.length - 1, (s.activeIndex >= 0 ? s.activeIndex : -1) + 1) }; slashStateRef.current = ns; return ns; });
            }
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSlash((s) => { const ns = { ...s, activeIndex: Math.max(-1, (s.activeIndex >= 0 ? s.activeIndex : 0) - 1) }; slashStateRef.current = ns; return ns; });
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault(); e.stopPropagation();
            const suggs = searchCIM10(s0.query || '');
            const ai = s0.activeIndex;
            if (suggs.length > 0 && ai >= 0 && ai < suggs.length) {
              confirmDiagnostic(suggs[ai].libelle);
            } else {
              confirmDiagnostic();
            }
            return;
          }
          // All other keys (typing, backspace) pass through
        } else {
          const isOrder = s0.mode === 'order';
          const listFor = (query) => isOrder
            ? flattenRxResults(window.NOTE_DATA.searchOrder(s0.kind, (query || '').trim()))
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
            // Ensure Quill stays focused so user can type immediately after entering order/diagnostic mode
            setTimeout(function() { quillRef.current && quillRef.current.focus(); }, 0);
            return;
          }
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
  const onChipClickRef = useRefE(null);onChipClickRef.current = onChipClick;
  const onAddSectionRef = useRefE(null);onAddSectionRef.current = onAddSection;

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

  // --- reflect chips-map changes (label edits, inline field edits, linked highlight) without full reset
  useEffectE(() => {
    const q = quillRef.current;if (!q) return;
    q.root.querySelectorAll('.chip[data-cid]').forEach((node) => {
      const cid = node.getAttribute('data-cid');
      const chip = chips[cid];
      if (chip) {
        if (node.classList.contains('chip--rx')) {
          const rx = chip.entity.rx || {};
          const d = chip.entity.details || {};
          const nm = node.querySelector('.chip-rx-name');
          if (nm && nm.textContent !== (rx.name || '')) nm.textContent = rx.name || '';
          const ds = node.querySelector('.chip-rx-dose');
          if (ds && ds.textContent !== (rx.dose || '')) ds.textContent = rx.dose || '';
          // Update split sig spans
          const fmEl = node.querySelector('.chip-rx-form');
          if (fmEl && d.form) {
            const qty = d.form === 'comprimé' ? '1 co' : d.form === 'aérosol-doseur' ? '2 inh' : d.form === 'gélule' ? '1 gél' : '1 dose';
            if (fmEl.textContent !== qty) fmEl.textContent = qty;
          }
          const rtEl = node.querySelector('.chip-rx-route');
          if (rtEl && d.route !== undefined && rtEl.textContent !== d.route) rtEl.textContent = d.route || '';
          const freqEl = node.querySelector('.chip-rx-freq');
          if (freqEl && d.frequency && freqEl.textContent !== d.frequency) freqEl.textContent = d.frequency;
          const durEl = node.querySelector('.chip-rx-dur');
          if (durEl) {
            const dp = [];
            if (d.duration && d.duration !== '—') dp.push('× ' + d.duration + ' ' + (d.durationUnit || 'jours'));
            if (d.refills !== undefined && String(d.refills) !== '' && String(d.refills) !== '0') dp.push('R' + d.refills);
            const ndt = dp.join(' ');
            if (durEl.textContent !== ndt) durEl.textContent = ndt;
          }
          // Update fallback sig
          const sg = node.querySelector('.chip-rx-sig');
          if (sg && sg.textContent !== (rx.sig || '')) sg.textContent = rx.sig || '';
          node.setAttribute('data-rx', JSON.stringify(rx));
          if (Object.keys(d).length) node.setAttribute('data-details', JSON.stringify(d));
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
    } else if (slashStateRef.current && slashStateRef.current.mode === 'diagnostic') {
      // Diagnostic mode: like order mode — badge + free-text name.
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
          const ns = { ...s, query, startIndex: bIdx, pos };
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
      const orderSpace = /^(rx|lab|img|ref)\s/i.exec(query);
      const dxSpace = /^dx\s/i.exec(query);
      if (caret <= s.startIndex || !slashIntact || /\n/.test(query)) {
        closeSlashMenu();
      } else if (orderSpace) {
        enterOrderMode(orderSpace[1].toLowerCase(), query.slice(orderSpace[0].length), caret);
        return;
      } else if (dxSpace) {
        enterDiagnosticMode(query.slice(dxSpace[0].length));
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
    if (it.fileAction) { setFuncMenu(null); setSlash(null); slashStateRef.current = null; if (fileInputRef.current) fileInputRef.current.click(); return; }
    if (it.textRapides) { setFuncMenu(null); setSlash(null); slashStateRef.current = null; return; }
    if (it.ctPicker) { setFuncMenu(null); setSlash(null); slashStateRef.current = null; window.dispatchEvent(new CustomEvent('ct-picker-open', {})); return; }
    if (it.rxSearch || it.orderSearch) { enterOrderMode(it.kbd || 'rx'); return; }
    if (it.diagnosticEntry) { enterDiagnosticMode(''); return; }
    if (it.addSection) {
      const s = slashStateRef.current;
      if (s) {
        q.deleteText(s.startIndex, s.query.length + 1, 'silent');
        slashFmtRef.current = null;
      }
      setSlash(null); slashStateRef.current = null;
      setFuncMenu(null);
      if (onAddSectionRef.current) onAddSectionRef.current(id);
      return;
    }
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
    refocusAfterInsert(insertAt + 2);
  }

  function filterSlash(q) {
    const t = (q || '').toLowerCase().trim();
    if (!t) return window.NOTE_DATA.SLASH_ITEMS.filter((it) => !it.hideWhenEmpty);
    return window.NOTE_DATA.SLASH_ITEMS.filter((it) => it.title.toLowerCase().includes(t) || (it.kbd && it.kbd.includes(t)));
  }

  // ---------------------------------------------------------
  // Mode commande (/rx · /lab · /img) — recherche et insertion
  // ---------------------------------------------------------
  function enterOrderMode(kbd, carryQuery, caretHint) {
    const q = quillRef.current; if (!q) return;
    const kind = window.NOTE_DATA.orderKindForKbd(kbd) || 'rx';
    carryQuery = carryQuery || '';
    const s = slashStateRef.current;
    clearSlashPaint();
    silentRef.current = true;
    let at;
    if (s) {
      // Remove the literal "/…" text from the slash up to the live caret.
      // caretHint is used when called from text-change (q.getSelection is stale then).
      const sel = caretHint == null ? q.getSelection() : null;
      const end = caretHint != null ? caretHint : (sel ? sel.index : s.startIndex + (s.query || '').length + 1);
      q.deleteText(s.startIndex, Math.max(0, end - s.startIndex), 'silent');
      at = s.startIndex;
    } else {
      const sel = q.getSelection(true);
      at = sel ? sel.index : Math.max(0, q.getLength() - 1);
    }
    q.insertEmbed(at, 'orderbadge', { kind }, 'silent');
    // Leading space after the badge = an editable caret anchor (see enterDiagnosticMode).
    const carry = ' ' + carryQuery;
    q.insertText(at + 1, carry, 'silent');
    q.setSelection(at + 1 + carry.length, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onChange(stored);
    const pos = getBoundsPos(q, at + 1 + carry.length);
    const ns = { mode: 'order', kind, query: carry, activeIndex: 0, pos, startIndex: at };
    setSlash(ns); slashStateRef.current = ns;
    paintSlash(at + 1, carry.length);
    setGhost(null);
    setFuncMenu(null);
  }

  function enterDiagnosticMode(carryQuery) {
    const q = quillRef.current; if (!q) return;
    carryQuery = (carryQuery || '').replace(/\n/g, '');
    const s = slashStateRef.current;
    clearSlashPaint();
    silentRef.current = true;
    let at;
    if (s) {
      const sel = q.getSelection();
      const end = sel ? sel.index : s.startIndex + (s.query || '').length + 1;
      q.deleteText(s.startIndex, Math.max(0, end - s.startIndex), 'silent');
      at = s.startIndex;
    } else {
      const sel = q.getSelection(true);
      at = sel ? sel.index : Math.max(0, q.getLength() - 1);
    }
    q.insertEmbed(at, 'orderbadge', { kind: 'dx' }, 'silent');
    // Leading space after the badge = an editable caret anchor. Without it, when
    // the badge is the first thing in the editor the native caret lands ON the
    // non-editable badge and the user can't type the name (confirmed via debug).
    const carry = ' ' + carryQuery;
    q.insertText(at + 1, carry, 'silent');
    q.setSelection(at + 1 + carry.length, 0, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onChange(stored);
    const pos = getBoundsPos(q, at + 1 + carry.length);
    const ns = { mode: 'diagnostic', kind: 'dx', query: carry, activeIndex: 0, pos, startIndex: at };
    setSlash(ns); slashStateRef.current = ns;
    paintSlash(at + 1, carry.length);
    setGhost(null);
    setFuncMenu(null);
  }

  // Shared focus/caret restoration after a slash insertion (chip, order, or
  // diagnostic). Completing a slash command unmounts its menu and re-renders;
  // in real browsers that can leave the editor without keyboard focus, or drop
  // the caret onto the freshly-inserted non-editable embed (a chip or the
  // diagnostic header) — so the next keystrokes go nowhere until the user clicks.
  // We re-focus and re-assert the caret on the editable spot, across a few
  // timing points to survive the React commit. `bodyDiagId`, when given, forces
  // the native DOM caret inside that diagnostic's body line.
  function refocusAfterInsert(index, bodyDiagId) {
    function go() {
      const qq = quillRef.current; if (!qq) return;
      qq.focus();
      try { qq.setSelection(index, 0, 'api'); } catch (e) {}
      if (bodyDiagId) {
        const bodyEl = qq.root.querySelector('.ql-diag-line[data-diag-id="' + bodyDiagId + '"]');
        if (bodyEl) {
          try {
            const range = document.createRange();
            range.setStart(bodyEl, 0);
            range.collapse(true);
            const nsel = window.getSelection();
            nsel.removeAllRanges();
            nsel.addRange(range);
          } catch (e) {}
        }
      }
    }
    go();
    requestAnimationFrame(go);
    setTimeout(go, 0);
  }

  function confirmDiagnostic(nameOverride) {
    const q = quillRef.current;
    const s = slashStateRef.current;
    if (!q || !s || s.mode !== 'diagnostic') return;
    const name = (nameOverride || s.query || '').trim() || 'Diagnostic';
    const bIdx = orderBadgeIndex();
    const at = bIdx >= 0 ? bIdx : s.startIndex;
    const removeLen = (bIdx >= 0 ? 1 : 0) + (s.query || '').length;
    clearSlashPaint();
    silentRef.current = true;
    if (removeLen > 0) q.deleteText(at, removeLen, 'silent');
    // Insert the diagnostic region in place at the caret: a header block embed
    // followed by one empty body line. Any text before the caret stays above;
    // any text after falls below as a normal line (so the caret can leave later).
    const diagId = newDiagId();
    const Delta = Quill.import('delta');
    const lineInfo = q.getLine(at);
    const off = lineInfo && lineInfo.length > 1 ? lineInfo[1] : 0;
    const needBreak = off > 0;
    const d = new Delta().retain(at);
    if (needBreak) d.insert('\n');                          // close the preceding text line
    d.insert({ 'diagnostic-header': { id: diagId, name: name } });
    d.insert('\n', { diagnostic: diagId });                 // empty body line
    q.updateContents(d, 'silent');
    silentRef.current = false;
    const caret = at + (needBreak ? 1 : 0) + 1;             // into the empty body line
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onChange(stored);
    setSlash(null); slashStateRef.current = null;
    setGhost(null);
    refocusAfterInsert(caret, diagId);
  }

  // --- Diagnostic rename (click the header name) ---
  function openDiagRename(nameEl) {
    const rect = nameEl.getBoundingClientRect();
    setDiagRename({
      id: nameEl.getAttribute('data-diag-id'),
      value: nameEl.textContent || '',
      pos: { top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)) }
    });
  }
  function commitDiagRename(newName) {
    const q = quillRef.current;
    const dr = diagRename;
    setDiagRename(null);
    if (!q || !dr) return;
    const name = (newName || '').trim();
    if (!name || name === dr.value) return;
    const headerEl = q.root.querySelector('.ql-diag-header[data-diag-id="' + dr.id + '"]');
    if (!headerEl) return;
    const blot = Quill.find(headerEl);
    if (!blot) return;
    const idx = q.getIndex(blot);
    silentRef.current = true;
    q.deleteText(idx, 1, 'silent');
    q.insertEmbed(idx, 'diagnostic-header', { id: dr.id, name: name }, 'silent');
    silentRef.current = false;
    const stored = deltaToStored(q.getContents());
    lastStoredRef.current = stored;
    onChange(stored);
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
    // Preserve the diagnostic body context so the chip lands inside the box.
    const preFmt = q.getFormat(at);
    const diagBodyId = preFmt.diagnostic || null;
    clearSlashPaint();
    silentRef.current = true;
    if (removeLen > 0) q.deleteText(at, removeLen, 'silent');
    q.insertEmbed(at, 'chip', { cid: chipId, type: def.type, label, icon: def.icon, rx, details: item.details || {} }, 'silent');
    q.insertText(at + 1, ' ', 'silent');
    // If we were inside a diagnostic body, re-assert the line format — Quill's
    // normalizer can silently drop it after an embed insertion on a block boundary.
    if (diagBodyId) q.formatLine(at, 1, 'diagnostic', diagBodyId, 'silent');
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
    refocusAfterInsert(at + 2);
  }

  function handleFileChange(e) {
    const q = quillRef.current;
    if (!q) return;
    const files = Array.from(e.target.files || []);
    files.forEach(function(file) {
      const url = URL.createObjectURL(file);
      const chipId = newChipId();
      const sel = q.getSelection(true);
      const at = sel ? sel.index : Math.max(0, q.getLength() - 1);
      silentRef.current = true;
      q.insertEmbed(at, 'chip', { cid: chipId, type: 'file', label: file.name, icon: 'attach_file' }, 'silent');
      q.insertText(at + 1, ' ', 'silent');
      q.setSelection(at + 2, 0, 'silent');
      silentRef.current = false;
      const stored = deltaToStored(q.getContents());
      lastStoredRef.current = stored;
      onAddChip(id, { chipId, entity: { type: 'file', label: file.name, url, text: file.name }, _prebuilt: true, storedOverride: stored });
    });
    e.target.value = '';
  }

  // Detect order command from slash query: '/rx …', '/lab …', '/img …'
  function orderKindForQuery(query) {
    const m = /^(rx|lab|img)(\s|$)/i.exec(query || '');
    return m ? m[1].toLowerCase() : null;
  }

  const isOrderMode = !!(slash && slash.mode === 'order');
  const isDiagnosticMode = !!(slash && slash.mode === 'diagnostic');
  const orderKind = isOrderMode ? slash.kind : null;
  const orderDef = orderKind ? window.NOTE_DATA.ORDER_DEFS[orderKind] : null;
  const orderQuery = isOrderMode ? (slash.query || '').trim() : '';
  const orderResults = isOrderMode ? window.NOTE_DATA.searchOrder(orderKind, orderQuery) : null;
  const slashItems = slash && !isOrderMode && !isDiagnosticMode ? filterSlash(slash.query) : [];

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
      {slash && !isOrderMode && !isDiagnosticMode &&
      <SlashMenu
        position={{ top: slash.pos.caretBottom + 6, left: Math.max(8, Math.min(slash.pos.caretLeft, window.innerWidth - 332)) }}
        query={slash.query}
        activeIndex={slash.activeIndex}
        items={slashItems}
        onSelect={chooseSlashItem}
        onClose={() => closeSlashMenu()} />

      }
      {slash && !isOrderMode && !isDiagnosticMode && (slash.query || '') === '' &&
      <div className="slash-hint" style={{
        position: 'fixed',
        left: slash.pos.caretLeft + 5,
        top: (slash.pos.caretTop + slash.pos.caretBottom) / 2,
        transform: 'translateY(-50%)',
        zIndex: 48
      }}>Saisissez du texte pour chercher une commande</div>

      }
      {isDiagnosticMode &&
      <DiagnosticDropdown
        position={{ top: slash.pos.caretBottom + 6, left: Math.max(8, Math.min(slash.pos.caretLeft, window.innerWidth - 380)) }}
        query={(slash.query || '').trim()}
        suggestions={searchCIM10((slash.query || '').trim())}
        activeIndex={slash.activeIndex != null ? slash.activeIndex : -1}
        onPickSuggestion={(name) => confirmDiagnostic(name)}
        onConfirm={confirmDiagnostic}
        onClose={closeSlashMenu} />
      }
      {diagRename &&
      <DiagRenamePopover
        pos={diagRename.pos}
        value={diagRename.value}
        onCommit={commitDiagRename}
        onCancel={() => setDiagRename(null)} />
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
      <SlashMenu
        position={{ top: funcMenu.top, left: funcMenu.left }}
        query=""
        items={filterSlash('')}
        activeIndex={-1}
        onSelect={(it) => { setFuncMenu(null); chooseSlashItem(it); }}
        onClose={() => setFuncMenu(null)} />
      }
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange} />
    </>);

}

// ---------------------------------------------------------
// DiagRenamePopover — inline editor to rename a diagnostic (click its header name)
// ---------------------------------------------------------
function DiagRenamePopover({ pos, value, onCommit, onCancel }) {
  const [v, setV] = useStateE(value || '');
  const inputRef = useRefE(null);
  useEffectE(function() {
    if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, []);
  return (
    <div style={{
      position: 'fixed', top: pos.top, left: pos.left, zIndex: 70,
      background: '#fff', border: '1px solid #b3ccf0', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(37,36,94,0.16)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', minWidth: 240
    }}>
      <span className="material-icons-outlined" style={{ fontSize: 16, color: '#1a5fd4', flexShrink: 0 }}>local_hospital</span>
      <input
        ref={inputRef}
        value={v}
        placeholder="Nom du diagnostic…"
        style={{
          flex: 1, border: 'none', borderBottom: '1.5px solid #1a5fd4', outline: 'none',
          background: 'transparent', font: "500 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.85)', padding: '2px 2px'
        }}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit(v); }
          else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }}
        onBlur={() => onCommit(v)} />
    </div>
  );
}

// ---------------------------------------------------------
// searchCIM10 — filter CIM-10 entries by query (accent-insensitive)
// ---------------------------------------------------------
function searchCIM10(query) {
  const data = window.CIM10_DATA;
  if (!data || !query || query.trim().length < 2) return [];
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const q = norm(query.trim());
  const results = [];
  for (let i = 0; i < data.length && results.length < 8; i++) {
    if (norm(data[i].libelle).includes(q)) results.push(data[i]);
  }
  return results;
}

// ---------------------------------------------------------
// DiagnosticDropdown — shown while the user types a name after /dx
// ---------------------------------------------------------
function DiagnosticDropdown({ position, query, suggestions, activeIndex, onPickSuggestion, onConfirm, onClose }) {
  return (
    <div style={{
      position: 'fixed', top: position.top, left: position.left,
      background: '#fff', border: '1px solid #b3ccf0', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(37,36,94,0.16)',
      zIndex: 60, minWidth: 320, maxWidth: 420,
      fontFamily: "'Inter',sans-serif", overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: '#1a5fd4', flexShrink: 0 }}>local_hospital</span>
        {query
          ? <span style={{ font: "400 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.75)', flex: 1 }}>
              Diagnostic : <strong>{query}</strong>
            </span>
          : <span style={{ font: "400 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.45)', flex: 1 }}>
              Saisissez le nom du diagnostic…
            </span>
        }
        {query && (
          <kbd style={{
            marginLeft: 'auto', background: '#f0f0f8', border: '1px solid #d0d0e0',
            borderRadius: 4, padding: '2px 7px', font: "500 12px 'Inter',sans-serif", color: '#555', flexShrink: 0
          }}>↵</kbd>
        )}
      </div>
      {suggestions && suggestions.length > 0 && (
        <>
          <div style={{ height: 1, background: '#e8ecf5', margin: '0 12px' }} />
          <div style={{ padding: '4px 0 6px' }}>
            {suggestions.map((s, i) => (
              <div
                key={s.code}
                onMouseDown={(e) => { e.preventDefault(); if (onPickSuggestion) onPickSuggestion(s.libelle); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 16px', cursor: 'pointer',
                  background: i === activeIndex ? '#eef3fb' : 'transparent'
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1a5fd4', minWidth: 44, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{s.code}</span>
                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.82)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.libelle}</span>
                {i === activeIndex && <kbd style={{ background: '#f0f0f8', border: '1px solid #d0d0e0', borderRadius: 3, padding: '1px 5px', fontSize: 11, color: '#888', flexShrink: 0 }}>↵</kbd>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { EditorField, newChipId });