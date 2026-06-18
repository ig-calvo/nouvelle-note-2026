/* global React */
// =========================================================
// primitives.jsx — Sheet (modal/drawer), Star, Seg, Toast
// =========================================================
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

// Sheet: overlay + animated modal/drawer. `kind`: modal | modal-lg | drawer | drawer-md
// children may be a function receiving `close` to wire footer buttons.
function Sheet({ kind = "modal", onClose, children }) {
  const [show, setShow] = useStateP(false);
  const closingRef = useRefP(false);

  useEffectP(() => {
    const r = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const close = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setShow(false);
    setTimeout(() => onClose && onClose(), 240);
  }, [onClose]);

  useEffectP(() => {
    const h = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  const variant = kind.startsWith("drawer") ? "right" : "center";
  const cardCls =
    kind === "modal" ? "modal" :
    kind === "modal-lg" ? "modal lg" :
    kind === "drawer-md" ? "drawer md" : "drawer";

  return (
    <div
      className={"ov " + variant + (show ? " show" : "")}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={cardCls} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {typeof children === "function" ? children(close) : children}
      </div>
    </div>);
}

// Dialog header
function DlgHead({ icon, overline, title, onClose, actions }) {
  return (
    <div className="dlg-head">
      {icon &&
        <div className="dh-ico"><span className="material-icons-outlined">{icon}</span></div>}
      <div className="dh-txt">
        {overline && <div className="dh-overline">{overline}</div>}
        <div className="dh-title">{title}</div>
      </div>
      <div className="dh-actions">
        {actions}
        {onClose &&
          <button className="icon-btn" title="Fermer" onClick={onClose}>
            <span className="material-icons-outlined">close</span>
          </button>}
      </div>
    </div>);
}

function Star({ on, onClick, title }) {
  return (
    <button
      className={"star-btn" + (on ? " on" : "")}
      title={title || (on ? "Retirer du sommaire" : "Mettre au sommaire")}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
      <span className="material-icons">{on ? "star" : "star_border"}</span>
    </button>);
}

function Seg({ options, value, onChange, className }) {
  return (
    <span className={"seg " + (className || "")}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        const extra = typeof o === "object" && o.cls ? o.cls : "";
        return (
          <button
            key={val}
            className={(value === val ? "on " + extra : "")}
            onClick={() => onChange(val)}>{lbl}</button>);
      })}
    </span>);
}

function IconBtn({ icon, title, onClick, accent, filled }) {
  return (
    <button className={"icon-btn" + (accent ? " accent" : "")} title={title} onClick={onClick}>
      <span className={filled ? "material-icons" : "material-icons-outlined"}>{icon}</span>
    </button>);
}

// ---- Toast ----
function toast(message, opts = {}) {
  window.dispatchEvent(new CustomEvent("omd-toast", { detail: { message, ...opts } }));
}
function ToastHost() {
  const [items, setItems] = useStateP([]);
  useEffectP(() => {
    const h = (e) => {
      const id = Date.now() + Math.random();
      const it = { id, ...e.detail };
      setItems((x) => [...x, it]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), e.detail.duration || 3200);
    };
    window.addEventListener("omd-toast", h);
    return () => window.removeEventListener("omd-toast", h);
  }, []);
  return (
    <div className="toast-wrap">
      {items.map((it) =>
        <div className="toast" key={it.id}>
          <span className="material-icons">{it.icon || "check_circle"}</span>
          <span>{it.message}</span>
          {it.onUndo &&
            <span className="t-undo" onClick={() => { it.onUndo(); setItems((x) => x.filter((i) => i.id !== it.id)); }}>Annuler</span>}
        </div>
      )}
    </div>);
}

Object.assign(window, { Sheet, DlgHead, Star, Seg, IconBtn, toast, ToastHost });
