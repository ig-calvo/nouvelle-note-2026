/* global React */
function SideNav() {
  const [blueOpen, setBlueOpen] = React.useState(true);
  const primary = [
  { label: "Nouvelles", icon: "home" },
  { label: "Communication", icon: "forum" },
  { label: "Résultats", icon: "science" },
  { label: "Tâches", icon: "check_box" },
  { label: "Journal de Notes", icon: "menu_book" },
  { label: "Rendez-vous", icon: "event" },
  { label: "Liste d'attente", icon: "format_list_numbered" },
  { label: "Liste de patients", icon: "groups" }];

  const secondary = [
  { label: "Répertoire", icon: "contact_page" },
  { label: "Administration", icon: "settings" },
  { label: "Rx Vigilance", icon: "medication" },
  { label: "Transmissions", icon: "mail_outline" },
  { label: "Rapports", icon: "bar_chart" }];

  const blueRoom = ["Sophie Bouchard", "Julien Gagnon", "Émilie Tremblay", "Maxime Roy"];
  const recent = ["Julie Tremblay", "Camille Fournier"];

  const Item = ({ it }) =>
  <div
    style={snStyles.item}
    onMouseOver={(e) => {e.currentTarget.style.background = "rgba(0,0,0,0.04)";}}
    onMouseOut={(e) => {e.currentTarget.style.background = "transparent";}}>
    
      <span className="material-icons-outlined" style={snStyles.icon}>{it.icon}</span>
      <span style={snStyles.label}>{it.label}</span>
    </div>;


  const Person = ({ name, indent = 58 }) =>
  <div style={{ ...snStyles.person, paddingLeft: indent }}>
      <span style={snStyles.avatar}>
        <span className="material-icons" style={{ fontSize: 15, color: "#8a5cb8" }}>person</span>
      </span>
      <span style={snStyles.personName}>{name}</span>
    </div>;


  return (
    <aside style={snStyles.bar}>
      <div style={snStyles.scroll}>
        {primary.map((it) => <Item key={it.label} it={it} />)}
        <div style={snStyles.divider} />
        {secondary.map((it) => <Item key={it.label} it={it} />)}
        <div style={snStyles.divider} />
        <div style={snStyles.item}>
          <span className="material-icons-outlined" style={snStyles.icon}>help_outline</span>
          <span style={snStyles.label}>Besoin d'aide ?</span>
        </div>
        <div style={snStyles.divider} />

        <div style={snStyles.item}>
          <span className="material-icons-outlined" style={snStyles.icon}>schedule</span>
          <span style={snStyles.label}>Salles d'attente</span>
        </div>
        <div style={snStyles.roomHead} onClick={() => setBlueOpen((o) => !o)}>
          <span style={snStyles.roomName}>Salle Bleue</span>
          <span
            className="material-icons"
            style={{ ...snStyles.roomCaret, transform: blueOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>
            expand_more
          </span>
        </div>
        {blueOpen && blueRoom.map((n) => <Person key={n} name={n} />)}

        <div style={snStyles.divider} />
        <div style={snStyles.sectionLabel}>Récemment consultés</div>
        {recent.map((n) => <Person key={n} name={n} indent={18} />)}
        <div style={{ height: 24 }} />
      </div>

      <button style={snStyles.chatFab} aria-label="aide">
        <span className="material-icons" style={{ color: "#fff", fontSize: 28 }}>chat_bubble</span>
      </button>
    </aside>);

}

const snStyles = {
  bar: {
    width: 246, background: "#fff", borderRight: "1px solid #ececec",
    fontFamily: "'Inter', sans-serif", flexShrink: 0,
    position: "relative", display: "flex", flexDirection: "column",
    minHeight: 0
  },
  scroll: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" },
  item: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "0 18px", cursor: "pointer", userSelect: "none",
    minHeight: 40, boxSizing: "border-box",
    transition: "background 0.12s"
  },
  icon: { fontSize: 22, color: "rgba(0,0,0,0.6)", width: 24, textAlign: "center", flexShrink: 0 },
  label: { fontSize: 15, fontWeight: 400, color: "rgba(0,0,0,0.82)" },
  divider: { borderTop: "1px solid #eee", margin: "8px 14px" },
  roomHead: {
    display: "flex", alignItems: "center",
    padding: "4px 18px 4px 58px", cursor: "pointer"
  },
  roomName: { fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.7)" },
  roomCaret: { marginLeft: "auto", fontSize: 22, color: "#1975d1" },
  person: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "5px 18px 5px 58px", cursor: "pointer"
  },
  avatar: {
    width: 24, height: 24, borderRadius: "50%", background: "#ece3f5",
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  personName: { fontSize: 14, color: "rgba(0,0,0,0.8)" },
  sectionLabel: {
    padding: "6px 18px 4px", fontSize: 13,
    color: "rgba(0,0,0,0.6)", fontWeight: 400
  },
  chatFab: {
    position: "absolute", left: 150, bottom: 18,
    width: 52, height: 52, borderRadius: "50%",
    background: "#5b3fa8", border: 0, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(91,63,168,0.4)"
  }
};

window.SideNav = SideNav;