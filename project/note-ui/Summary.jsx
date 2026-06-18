/* global React */

var INIT_DATA = {
  results: [],
  programs: [],
  tasks: [],
  vitals: [
    { left:'Poids',        mid:'62 kg',           right:'08/12/2025' },
    { left:'Pression',     mid:'118/74 mmHg',     right:'08/12/2025' },
    { left:'Fréq. cardiaque', mid:'72 bpm',        right:'08/12/2025' },
    { left:'Taille',       mid:'165 cm',           right:'08/12/2025' },
    { left:'IMC',          mid:'22,8',             right:'08/12/2025' },
  ],
  problems: [],
  history: [
    { left:'Infection urinaire (résolue)', right:'08/12/2025' },
  ],
  allergies: [
    { name:'Aucune allergie connue', type:'none', muted:true },
  ],
  family: [
    { left:'Nulligeste',             mid:'' },
    { left:'Cycles réguliers',       mid:'' },
    { left:'Contraception…',         mid:'depuis 5 ans' },
    { left:'Antécédents…',           mid:'Aucun pertinent' },
    { left:'Antécédents chirurgi…',  mid:'Aucun' },
  ],
  meds: [
    { name:'Contraceptif…',      detail:'1 co DIE — actif',  status:'active',  pinned:true },
    { name:'Nitrofurantoïne…',   detail:'cessée (ITU)',       status:'cessée',  date:'12/2025' },
  ],
  immun: [
    { left:'HPV (Gardasil…',             mid:'série complète',      right:'2010' },
    { left:'dCaT (Tétanos-diphtérie)',   mid:'',                    right:'2022' },
    { left:'Influenza',                   mid:'à jour',              right:'2025' },
    { left:'COVID-19',                    mid:'primaire + rappels',   right:'2023' },
  ],
  habits: [
    { left:'Tabac',   name:'Tabac',   mid:'Non-fumeuse',         detail:'Non-fumeuse' },
    { left:'Alcool',  name:'Alcool',  mid:'Occasionnel (social)', detail:'Occasionnel (social)' },
    { left:'Drogues', name:'Drogues', mid:'Aucune',               detail:'Aucune' },
  ],
};

var SECTION_CFG = [
  { id:'tasks',    icon:'check_box',      label:'Tâches',                    add:true  },
  { id:'vitals',   icon:'monitor_heart',  label:'Signes vitaux',             add:true,  list:true },
  { id:'problems', icon:'hub',            label:'Problèmes',                 add:true,  list:true },
  { id:'history',  icon:'assignment',     label:'Antécédents',               add:true,  list:true },
  { id:'results',  icon:'science',            label:'Résultats',                  add:true,  list:true },
  { id:'allergies',icon:'eco',            label:'Allergies',                 add:true,  list:true },
  { id:'family',   icon:'folder_open',    label:'Antécédents familiaux',     add:true,  list:true },
  { id:'meds',     icon:'medication',     label:'Médicaments',               add:false, list:true, dots:true },
  { id:'immun',    icon:'vaccines',       label:'Immunisations et vaccins',  add:true,  list:true },
  { id:'habits',   icon:'nutrition',      label:'Habitudes de vie',          add:true,  list:true },
  { id:'programs', icon:'assignment_turned_in', label:'Programmes de suivi', add:true,  list:true },
];

var MEDS_STATUS_COLOR = { active:'#1b8a3f', echue:'#c07a00', cessée:'#c62828', texte:'#1565c0' };

function Summary() {
  var [data, setData] = React.useState(INIT_DATA);
  var [modal, setModal] = React.useState(null);   // { section, type:'add'|'list' }
  var [reorder, setReorder] = React.useState(false);
  var [sectionIds, setSectionIds] = React.useState(SECTION_CFG.map(function(s){ return s.id; }));
  var [showPrint, setShowPrint] = React.useState(false);
  var [dragSrc, setDragSrc] = React.useState(null);

  function addItem(section, item) {
    setData(function(prev) {
      var arr = prev[section] ? prev[section].slice() : [];
      if (section === 'allergies') {
        arr = arr.filter(function(a){ return a.type !== 'none'; });
      }
      if (section === 'vitals' && item.poids) {
        var next = [];
        if (item.poids)       next.push({ left:'Poids',            mid:item.poids+' kg',            right:'aujourd\'hui' });
        if (item.taille)      next.push({ left:'Taille',           mid:item.taille+' cm',           right:'aujourd\'hui' });
        if (item.paS&&item.paD) next.push({ left:'Pression',      mid:item.paS+'/'+item.paD+' mmHg', right:'aujourd\'hui' });
        if (item.fc)          next.push({ left:'Fréq. cardiaque',  mid:item.fc+' bpm',              right:'aujourd\'hui' });
        if (item.imc&&item.imc!=='—') next.push({ left:'IMC',     mid:item.imc,                     right:'aujourd\'hui' });
        return Object.assign({}, prev, { vitals: next.length ? next : arr });
      }
      if (section === 'habits') {
        arr.push({ left:item.name, name:item.name, mid:item.detail, detail:item.detail });
        return Object.assign({}, prev, { habits: arr });
      }
      arr.push(item);
      return Object.assign({}, prev, { [section]: arr });
    });
  }

  function deleteItem(section, item) {
    setData(function(prev){
      return Object.assign({}, prev, { [section]: prev[section].filter(function(i){ return i !== item; }) });
    });
  }

  // Drag-to-reorder
  function onDragStart(e, idx) { setDragSrc(idx); e.dataTransfer.effectAllowed = 'move'; }
  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragSrc === null || dragSrc === idx) return;
    var arr = sectionIds.slice();
    var moved = arr.splice(dragSrc, 1)[0];
    arr.splice(idx, 0, moved);
    setSectionIds(arr);
    setDragSrc(idx);
  }

  var orderedCfg = sectionIds.map(function(id){ return SECTION_CFG.find(function(s){ return s.id===id; }); });

  function ActiveModal() {
    if (!modal) return null;
    var s = modal.section, type = modal.type;
    var items = data[s] || [];
    var close = function(){ setModal(null); };
    var add   = function(item){ addItem(s, item); };

    if (s==='allergies' && type==='add')  return <AllergiesAddModal  onClose={close} onAdd={add} />;
    if (s==='allergies' && type==='list') return <AllergiesListModal items={items} onClose={close} onDelete={function(i){ deleteItem(s,i); }} />;
    if (s==='vitals'    && type==='add')  return <VitalsAddModal     onClose={close} onAdd={add} />;
    if (s==='vitals'    && type==='list') return <VitalsAddModal     onClose={close} onAdd={add} />;
    if (s==='meds')                       return <MedsModal          items={items}  onClose={close} />;
    if (s==='habits')                     return <HabitsModal        items={items}  onClose={close} onAdd={add} />;
    if (s==='problems')                   return <ProblemsModal      title="Problèmes"    items={items} onClose={close} onAdd={add} convertLabel="Convertir en antécédent" />;
    if (s==='history')                    return <ProblemsModal      title="Antécédents"  items={items} onClose={close} onAdd={add} convertLabel="Convertir en problème" />;
    if (s==='family')                     return <FamilyModal        items={items}  onClose={close} onAdd={add} />;
    if (s==='immun')                      return <ImmunModal         items={items}  onClose={close} onAdd={add} />;
    if (s==='results')                     return <ResultsModal       items={items}  onClose={close} onAdd={add} />;
    if (s==='programs')                    return <ProgramsModal      items={items}  onClose={close} onAdd={add} />;
    if (s==='tasks')                      return <TasksModal         items={items}  onClose={close} onAdd={add} />;
    return null;
  }

  return (
    <aside style={suS.panel}>
      {/* Header */}
      <div style={suS.header}>
        <span style={suS.headerTitle}>Sommaire</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button style={suS.hBtn} onClick={function(){ setShowPrint(true); }} title="Imprimer le sommaire">
            <span className="material-icons-outlined" style={{ fontSize:20 }}>print</span>
          </button>
          <button style={{ ...suS.hBtn, color: reorder ? '#f59e0b' : 'rgba(255,255,255,0.85)' }} onClick={function(){ setReorder(!reorder); }} title="Réorganiser">
            <span className="material-icons-outlined" style={{ fontSize:22 }}>dashboard</span>
          </button>
        </div>
      </div>

      {reorder && (
        <div style={suS.reorderBar}>
          <span style={{ fontSize:12, color:'#25245E' }}>Glissez pour réorganiser</span>
          <button style={suS.saveBtn} onClick={function(){ setReorder(false); }}>Sauvegarder</button>
        </div>
      )}

      {/* Sections */}
      <div style={suS.scroll}>
        {orderedCfg.map(function(cfg, idx) {
          var items = data[cfg.id] || [];
          return (
            <SummaryBox
              key={cfg.id}
              cfg={cfg}
              items={items}
              reorder={reorder}
              draggable={reorder}
              onDragStart={function(e){ onDragStart(e, idx); }}
              onDragOver={function(e){ onDragOver(e, idx); }}
              onDragEnd={function(){ setDragSrc(null); }}
              onAdd={function(){ setModal({ section:cfg.id, type:'add' }); }}
              onTitle={function(){ if (cfg.list||cfg.dots) setModal({ section:cfg.id, type:'list' }); }}
            />
          );
        })}
      </div>

      <ActiveModal />
      {showPrint && <PrintModal sections={SECTION_CFG} onClose={function(){ setShowPrint(false); }} />}
    </aside>
  );
}

function SummaryBox({ cfg, items, reorder, draggable, onDragStart, onDragOver, onDragEnd, onAdd, onTitle }) {
  return (
    <div
      style={{ ...suS.section, ...(reorder ? suS.sectionDrag : {}) }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div style={suS.sHead}>
        {reorder && <span className="material-icons" style={{ fontSize:16, color:'rgba(0,0,0,0.3)', cursor:'grab', marginRight:4 }}>drag_indicator</span>}
        <span className="material-icons-outlined" style={suS.sIcon}>{cfg.icon}</span>
        <button style={suS.labelBtn} onClick={onTitle}>
          <span style={suS.sLabel}>{cfg.label}</span>
        </button>
        {cfg.dots && (
          <button style={suS.addBtn} onClick={onTitle} title="Ouvrir les médicaments">
            <span className="material-icons" style={{ fontSize:20 }}>more_vert</span>
          </button>
        )}
        {cfg.add && (
          <button style={suS.addBtn} onClick={onAdd} title="Ajouter">
            <span className="material-icons" style={{ fontSize:20 }}>add</span>
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div style={suS.rows}>
          {items.slice(0, 6).map(function(r, i){ return <SummaryRow key={i} r={r} sId={cfg.id} />; })}
          {items.length > 6 && <div style={suS.more}>+{items.length-6} de plus</div>}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ r, sId }) {
  if (sId === 'meds') {
    var c = MEDS_STATUS_COLOR[r.status] || MEDS_STATUS_COLOR.active;
    return (
      <div style={suS.row}>
        <span style={{ ...suS.dot, background:c }} />
        <span style={{ ...suS.rLeft, maxWidth:100 }}>{r.name}</span>
        {r.detail && <span style={suS.rMid}>{r.detail}</span>}
        {r.date && <span style={suS.rRight}>{r.date}</span>}
      </div>
    );
  }
  if (sId === 'allergies' && r.muted) {
    return <div style={{ ...suS.row }}><span style={{ ...suS.rLeft, color:'rgba(0,0,0,0.45)', fontStyle:'italic', maxWidth:220 }}>{r.name}</span></div>;
  }
  return (
    <div style={suS.row}>
      <span style={suS.rLeft}>{r.left || r.name}</span>
      {r.mid && <span style={suS.rMid}>{r.mid}</span>}
      {r.right && <span style={suS.rRight}>{r.right}</span>}
    </div>
  );
}

var suS = {
  panel:{
    width:300, background:'#fff', borderRadius:8,
    boxShadow:'0 2px 4px 0 rgba(37,36,94,0.14), 0 0 5px 0 rgba(37,36,94,0.12)',
    fontFamily:"'Inter',sans-serif", flexShrink:0,
    display:'flex', flexDirection:'column',
    height:'100%', alignSelf:'stretch',
    position:'sticky', top:0,
  },
  header:{
    background:'#25245E', color:'#fff', padding:'13px 14px',
    display:'flex', alignItems:'center',
    borderRadius:'8px 8px 0 0', flexShrink:0,
  },
  headerTitle:{ flex:1, fontSize:15, fontWeight:700, fontFamily:"'Poppins',sans-serif" },
  hBtn:{ background:'none', border:0, cursor:'pointer', padding:3, color:'rgba(255,255,255,0.85)', display:'flex' },
  reorderBar:{
    background:'#ECF3F7', padding:'7px 14px',
    display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
  },
  saveBtn:{
    background:'#25245E', color:'#fff', border:0, borderRadius:6,
    padding:'4px 12px', cursor:'pointer', fontSize:12, fontWeight:600,
  },
  scroll:{ overflowY:'auto', flex:1 },
  section:{ borderBottom:'1px solid #ededed' },
  sectionDrag:{ cursor:'grab', background:'#fafafd' },
  sHead:{
    display:'flex', alignItems:'center', gap:7,
    padding:'9px 12px', minHeight:40, boxSizing:'border-box',
  },
  sIcon:{ fontSize:17, color:'rgba(0,0,0,0.55)', width:20, flexShrink:0 },
  labelBtn:{ background:'none', border:0, padding:0, cursor:'pointer', flex:1, textAlign:'left' },
  sLabel:{ fontSize:13, fontWeight:600, fontFamily:"'Poppins',sans-serif", color:'rgba(0,0,0,0.85)' },
  addBtn:{ background:'none', border:0, cursor:'pointer', padding:2, color:'#1975d1', display:'flex', alignItems:'center', marginLeft:'auto', flexShrink:0 },
  rows:{ padding:'0 12px 10px 39px', display:'flex', flexDirection:'column', gap:6 },
  row:{ display:'flex', alignItems:'center', gap:5, fontSize:12 },
  dot:{ width:7, height:7, borderRadius:'50%', flexShrink:0 },
  rLeft:{ color:'rgba(0,0,0,0.78)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:108, fontSize:12 },
  rMid:{ color:'rgba(0,0,0,0.52)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 },
  rRight:{ color:'rgba(0,0,0,0.45)', fontSize:11, fontVariantNumeric:'tabular-nums', flexShrink:0 },
  more:{ fontSize:11, color:'#1975d1', cursor:'pointer' },
};

window.Summary = Summary;
