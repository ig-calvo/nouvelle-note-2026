/* global React */
// =========================================================
// Toast.jsx — notification éphémère, coin bas-gauche.
// window.toast(message, opts) émet un CustomEvent "omd-toast" ;
// <ToastHost/> (monté une fois à la racine) l'écoute et empile
// les notifications actives, chacune avec sa propre durée de vie.
// =========================================================
function toast(message, opts) {
  window.dispatchEvent(new CustomEvent('omd-toast', { detail: Object.assign({ message: message }, opts || {}) }));
}

function ToastHost() {
  const [items, setItems] = React.useState([]);
  React.useEffect(function () {
    function onToast(e) {
      const id = Date.now() + Math.random();
      const it = Object.assign({ id: id }, e.detail);
      setItems(function (list) { return list.concat([it]); });
      setTimeout(function () {
        setItems(function (list) { return list.filter(function (i) { return i.id !== id; }); });
      }, e.detail.duration || 3200);
    }
    window.addEventListener('omd-toast', onToast);
    return function () { window.removeEventListener('omd-toast', onToast); };
  }, []);

  return (
    <React.Fragment>
      <style>{TOAST_CSS}</style>
      <div style={toastStyles.wrap}>
        {items.map(function (it) {
          return (
            <div key={it.id} style={toastStyles.toast}>
              <span className="material-icons" style={toastStyles.icon}>{it.icon || 'check_circle'}</span>
              <span style={toastStyles.text}>{it.message}</span>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}

const TOAST_CSS = '@keyframes toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }';

const toastStyles = {
  wrap: { position: 'fixed', left: 20, bottom: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' },
  toast: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#25245E', color: '#fff', borderRadius: 8,
    padding: '11px 16px', boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
    font: "500 14px 'Inter', sans-serif", minWidth: 220,
    animation: 'toast-in 180ms ease-out',
  },
  icon: { fontSize: 19, color: '#7fd88f', flexShrink: 0 },
  text: { flex: 1 },
};

Object.assign(window, { toast: toast, ToastHost: ToastHost });
