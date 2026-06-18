/* global React Quill */

// Shared color palette (matches the provided color-selection menu) — 5×5 grid.
const PALETTE = [
'#1f1f1f', '#5c5c5c', '#8f8f8f', '#bfbfbf', '#ffffff',
'#ffd170', '#ffc01f', '#cfa70c', '#a9790a', '#b4cb2f',
'#52c25c', '#74b84d', '#108840', '#c6aef3', '#9479e0',
'#6f2ee2', '#2e1ba0', '#f4a596', '#ed6a5a', '#e0394b',
'#a8322a', '#7ed6f1', '#16bef0', '#1f7ed1', '#0a5cab'];


const BLOCK_TYPES = [
{ label: 'Paragraphe', value: false, preview: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 400 } },
{ label: 'Titre 1', value: 1, preview: { fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 600, letterSpacing: '-0.2px' } },
{ label: 'Titre 2', value: 2, preview: { fontFamily: "'Poppins',sans-serif", fontSize: 16, fontWeight: 600 } },
{ label: 'Titre 3', value: 3, preview: { fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600 } }];


function FloatingToolbar() {
  const [state, setState] = React.useState(null); // { left, top, quill, formats }
  const [blockOpen, setBlockOpen] = React.useState(false);
  const toolbarRef = React.useRef(null);

  React.useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setState(null);
        setBlockOpen(false);
        return;
      }
      const anchor = sel.anchorNode;
      const qlEditor = anchor && (anchor.closest ? anchor.closest('.ql-editor') : anchor.parentNode && anchor.parentNode.closest && anchor.parentNode.closest('.ql-editor'));
      if (!qlEditor) {setState(null);return;}
      const qlContainer = qlEditor.closest('.ql-container');
      if (!qlContainer) {setState(null);return;}
      const quill = Quill.find(qlContainer);
      if (!quill) {setState(null);return;}
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const qRange = quill.getSelection();
      const formats = qRange ? quill.getFormat(qRange) : {};
      setState({ left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8, quill, formats });
    }

    function onPin(e) {
      const { quill, rect } = e.detail;
      const qr = quill.getSelection();
      const formats = qr ? quill.getFormat(qr) : {};
      setState({ left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8, quill, formats });
    }

    document.addEventListener('selectionchange', onSelChange);
    window.addEventListener('ftbar-pin', onPin);
    return () => {
      document.removeEventListener('selectionchange', onSelChange);
      window.removeEventListener('ftbar-pin', onPin);
    };
  }, []);

  if (!state) return null;

  const { quill, formats } = state;

  function fmt(format, value) {
    const qr = quill.getSelection();
    if (!qr) return;
    if (value === undefined) {
      quill.format(format, !formats[format]);
    } else {
      quill.format(format, value);
    }
    // re-read formats
    const newFormats = quill.getFormat(quill.getSelection() || qr);
    setState((s) => s ? { ...s, formats: newFormats } : s);
  }

  function clearFmt() {
    const qr = quill.getSelection();if (!qr) return;
    quill.removeFormat(qr.index, qr.length);
    setState((s) => s ? { ...s, formats: {} } : s);
  }

  function setBlock(val) {
    const qr = quill.getSelection();if (!qr) return;
    quill.format('header', val);
    setState((s) => s ? { ...s, formats: { ...s.formats, header: val } } : s);
    setBlockOpen(false);
  }

  const curBlock = BLOCK_TYPES.find((b) => b.value === (formats.header || false)) || BLOCK_TYPES[0];

  const W = 620;
  const left = Math.max(8, Math.min(state.left - W / 2, window.innerWidth - W - 8));
  const bottom = state.bottom;

  return (
    <div
      ref={toolbarRef}
      style={{ ...{ ...ftS.bar, left, bottom, width: W }, width: "620px" }}
      onMouseDown={(e) => e.preventDefault()}>
      
      {/* Block type */}
      <div style={{ position: 'relative' }}>
        <button style={ftS.typeBtn} onMouseDown={(e) => {e.preventDefault();setBlockOpen((o) => !o);}}>
          <span>{curBlock.label}</span>
          <span style={ftS.chevrons}>
            <span style={ftS.chevUp}>⌃</span>
            <span style={ftS.chevDown}>⌄</span>
          </span>
        </button>
        {blockOpen &&
        <div style={ftS.blockDrop}>
            {BLOCK_TYPES.map((b) =>
          <div key={String(b.value)} style={{ ...ftS.blockItem, ...b.preview, background: curBlock.value === b.value ? '#ddeaff' : 'transparent' }}
          onMouseDown={(e) => {e.preventDefault();setBlock(b.value);}}>
                {b.label}
              </div>
          )}
          </div>
        }
      </div>

      <div style={ftS.sep} />

      {/* Inline formatting */}
      <FtBtn icon="format_bold" title="Gras" active={!!formats.bold} onCmd={() => fmt('bold')} />
      <FtBtn icon="format_italic" title="Italique" active={!!formats.italic} onCmd={() => fmt('italic')} iconStyle={{ fontStyle: 'italic' }} />
      <FtBtn icon="format_underlined" title="Souligné" active={!!formats.underline} onCmd={() => fmt('underline')} />
      <FtBtn icon="strikethrough_s" title="Barré" active={!!formats.strike} onCmd={() => fmt('strike')} />

      <div style={ftS.sep} />

      {/* Block / rich */}
      <FtBtn icon="format_quote" title="Citation" active={!!formats.blockquote} onCmd={() => fmt('blockquote')} />
      <FtBtn icon="link" title="Lien" active={!!formats.link} onCmd={() => {const url = prompt('URL :');if (url) fmt('link', url);}} />
      <FtBtn icon="code" title="Code" active={!!formats['code-block']} onCmd={() => fmt('code-block')} />

      <div style={ftS.sep} />

      {/* Color */}
      <ColorBtn
        icon="format_color_text" title="Couleur du texte"
        current={formats.color} defaultBar="#1f1f1f"
        onPick={(v) => fmt('color', v)} />
      <ColorBtn
        icon="border_color" title="Surlignage"
        current={formats.background} defaultBar="#ffc01f"
        onPick={(v) => fmt('background', v)} />

      <div style={ftS.sep} />

      {/* Lists + indent */}
      <FtBtn icon="format_list_bulleted" title="Liste à puces" active={formats.list === 'bullet'} onCmd={() => fmt('list', formats.list === 'bullet' ? false : 'bullet')} />
      <FtBtn icon="format_list_numbered" title="Liste numérotée" active={formats.list === 'ordered'} onCmd={() => fmt('list', formats.list === 'ordered' ? false : 'ordered')} />
      <FtBtn icon="format_indent_decrease" title="Désindenter" active={false} onCmd={() => {const qr = quill.getSelection();if (qr) quill.format('indent', '-1');}} />
      <FtBtn icon="format_indent_increase" title="Indenter" active={false} onCmd={() => {const qr = quill.getSelection();if (qr) quill.format('indent', '+1');}} />

      <div style={ftS.sep} />

      {/* Clear */}
      <FtBtn icon="format_clear" title="Effacer le formatage" active={false} onCmd={clearFmt} />
    </div>);

}

function FtBtn({ icon, title, active, onCmd, iconStyle }) {
  return (
    <button
      title={title}
      style={{ ...ftS.btn, ...(active ? ftS.btnActive : {}) }}
      onMouseDown={(e) => {e.preventDefault();onCmd();}}>
      
      <span className="material-icons-outlined" style={{ fontSize: 18, ...iconStyle }}>{icon}</span>
    </button>);

}

function ColorBtn({ icon, title, current, defaultBar, onPick }) {
  const [open, setOpen] = React.useState(false);
  const active = !!current;
  const bar = current || defaultBar;
  return (
    <div style={{ position: 'relative' }}>
      <button
        title={title}
        style={{ ...ftS.btn, ...ftS.colorBtn, ...(open || active ? ftS.btnActive : {}) }}
        onMouseDown={(e) => {e.preventDefault();setOpen((o) => !o);}}>
        
        <span className="material-icons-outlined" style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ ...ftS.colorBar, background: bar }} />
      </button>
      {open &&
      <>
          <div style={ftS.menuScrim} onMouseDown={(e) => {e.preventDefault();setOpen(false);}} />
          <div style={ftS.colorMenu}>
            {PALETTE.map((hex) => {
            const isCur = (current || '').toLowerCase() === hex.toLowerCase();
            const isWhite = hex.toLowerCase() === '#ffffff';
            return (
              <button
                key={hex}
                title={hex}
                style={{ ...ftS.swatchBtn, ...(isCur ? ftS.swatchBtnActive : {}) }}
                onMouseDown={(e) => {e.preventDefault();onPick(hex);setOpen(false);}}>
                
                  <span style={{
                  ...ftS.swatch,
                  background: hex,
                  ...(isWhite ? { border: '1px solid #d8d8e0' } : {})
                }} />
                </button>);

          })}
          </div>
        </>
      }
    </div>);

}

const ftS = {
  bar: {
    position: 'fixed',
    zIndex: 2000,
    background: '#fff',
    border: '1px solid #e0e0eb',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(37,36,94,0.14)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 10px',
    gap: 2,
    fontFamily: "'Inter', sans-serif",
    animation: 'ftbar-in 140ms cubic-bezier(0.2,0,0,1)'
  },
  typeBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', border: 0, background: 'transparent',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 13, color: 'rgba(0,0,0,0.72)', fontFamily: "'Inter',sans-serif",
    whiteSpace: 'nowrap'
  },
  chevrons: { display: 'flex', flexDirection: 'column', lineHeight: 1, gap: -2, marginLeft: 2 },
  chevUp: { fontSize: 9, color: 'rgba(0,0,0,0.5)', lineHeight: 1 },
  chevDown: { fontSize: 9, color: 'rgba(0,0,0,0.5)', lineHeight: 1, marginTop: -2 },
  blockDrop: {
    position: 'absolute', top: '100%', left: 0,
    background: '#fff', border: '1px solid #e0e0eb', borderRadius: 8,
    boxShadow: '0 4px 12px rgba(37,36,94,0.12)',
    zIndex: 10, minWidth: 140, overflow: 'hidden'
  },
  blockItem: {
    padding: '8px 14px', fontSize: 13, cursor: 'pointer',
    color: 'rgba(0,0,0,0.78)'
  },
  sep: { width: 1, height: 20, background: '#e0e0eb', margin: '0 4px', flexShrink: 0 },
  btn: {
    width: 30, height: 30, border: 0, background: 'transparent',
    borderRadius: 6, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(0,0,0,0.62)'
  },
  btnActive: {
    background: '#ddeaff', color: '#1975d1'
  },
  colorBtn: { flexDirection: 'column', gap: 0, height: 30, paddingTop: 1 },
  colorBar: { width: 18, height: 3, borderRadius: 2, marginTop: -2 },
  menuScrim: { position: 'fixed', inset: 0, zIndex: 9 },
  colorMenu: {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8,
    background: '#fff', border: '1px solid #ececf2', borderRadius: 16,
    boxShadow: '0 10px 30px rgba(37,36,94,0.18)', zIndex: 10,
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: 14
  },
  swatchBtn: {
    width: 34, height: 34, border: 0, background: 'transparent', borderRadius: 10,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0
  },
  swatchBtnActive: { boxShadow: 'inset 0 0 0 2px #1f1f1f' },
  swatch: { width: 24, height: 24, borderRadius: 7 }
};

window.FloatingToolbar = FloatingToolbar;