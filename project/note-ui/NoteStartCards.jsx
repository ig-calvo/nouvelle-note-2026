/* global React */
function NoteStartCards({ onPick, hideSmart }) {
  const [hover, setHover] = React.useState(null);

  const cards = [
    { key: 'medicale', icon: 'post_add', iconColor: 'rgba(0,0,0,0.78)', overline: 'Note médicale', title: 'Depuis la dernière note', material: true },
    { key: 'intelligente', icon: 'auto_awesome', iconColor: '#6967d1', overline: 'Redaction Assistée', title: 'Note intelligente', material: true },
  ].filter(function (c) { return !(hideSmart && c.key === 'intelligente'); });

  return (
    <div style={nscStyles.row}>
      {cards.map(function (c) {
        const isHover = hover === c.key;
        return (
          <button
            key={c.key}
            style={Object.assign({}, nscStyles.card, isHover ? nscStyles.cardHover : null)}
            onMouseEnter={function () { setHover(c.key); }}
            onMouseLeave={function () { setHover(null); }}
            onClick={function () { if (onPick) onPick(c.key); }}>
            <span className="material-icons-outlined" style={Object.assign({}, nscStyles.icon, { color: c.iconColor })}>{c.icon}</span>
            <span style={nscStyles.textCol}>
              <span style={nscStyles.overline}>{c.overline}</span>
              <span style={nscStyles.title}>{c.title}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const nscStyles = {
  row: { display: 'flex', gap: 16, alignItems: 'stretch' },
  card: {
    flex: '0 1 360px', display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff', border: '1px solid #e3e3ec', borderRadius: 10,
    padding: '16px 22px', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 1px 2px 0 rgba(37,36,94,.06)',
    transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
    fontFamily: "'Inter', sans-serif",
  },
  cardHover: { borderColor: '#bdbce0', boxShadow: '0 3px 10px 0 rgba(37,36,94,.12)', transform: 'translateY(-1px)' },
  icon: { fontSize: 30, flexShrink: 0 },
  textCol: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  overline: { fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: 400 },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 21, color: 'rgba(0,0,0,0.82)', lineHeight: 1.1 },
};

window.NoteStartCards = NoteStartCards;
