/* global React */
// =========================================================
// ClinicalTool.jsx — "Symptômes d'une infection urinaire"
// An embedded clinical tool (Outil clinique) form, adapted to
// the prototype's DS3 design language.
// =========================================================

function CTField({ label, placeholder, type, options, value, onChange, span }) {
  const [internal, setInternal] = React.useState(value || "");
  const controlled = onChange !== undefined;
  const v = controlled ? (value || "") : internal;
  const handle = controlled ? onChange : function (e) { setInternal(e.target.value); };
  const cls = "ct-field" + (span === 2 ? " ct-span2" : span === 3 ? " ct-span3" : "");
  return (
    <div className={cls}>
      <label>{label}</label>
      {options ? (
        <select value={v} onChange={handle}>
          <option value="">—</option>
          {options.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
        </select>
      ) : (
        <input type={type || "text"} placeholder={placeholder || ""} value={v} onChange={handle} />
      )}
    </div>);
}

function CTCheck({ label }) {
  const [on, setOn] = React.useState(false);
  return (
    <label className="ct-check">
      <input type="checkbox" checked={on} onChange={function (e) { setOn(e.target.checked); }} />
      <span>{label}</span>
    </label>);
}

function CTSeg({ options, value, onChange }) {
  return (
    <span className="ct-seg">
      {options.map(function (o) {
        return (
          <button key={o} type="button" className={value === o ? "is-on" : ""}
            onClick={function () { onChange(value === o ? null : o); }}>{o}</button>);
      })}
    </span>);
}

function CTYesNo({ label }) {
  const [v, setV] = React.useState(null);
  return (
    <div className="ct-qrow">
      <span className="ct-qrow__lbl">{label}</span>
      <CTSeg options={["Oui", "Non"]} value={v} onChange={setV} />
    </div>);
}

function CTSection({ id, name, collapsed, onToggle, children }) {
  return (
    <div className={"ct-sec" + (collapsed ? " is-collapsed" : "")}>
      <button type="button" className="ct-sec__hd" onClick={function () { onToggle(id); }}>
        <span className="material-icons-outlined ct-sec__chev">expand_more</span>
        <span className="ct-sec__name">{name}</span>
      </button>
      <div className="ct-sec__bd">{children}</div>
    </div>);
}

const PHYS = ["Normal", "Anormal"];
const SECTION_IDS = ["hist", "dec", "plan", "reco", "exam", "interv", "ci", "disc"];

function ClinicalTool({ onClose, onHandleDown, dragging, bodyCollapsed: bodyCollapsedProp, onBodyCollapseChange }) {
  const [collapsed, setCollapsed] = React.useState({});
  const [bodyCollapsedInternal, setBodyCollapsedInternal] = React.useState(false);
  const controlled = bodyCollapsedProp !== undefined;
  const bodyCollapsed = controlled ? bodyCollapsedProp : bodyCollapsedInternal;
  function setBodyCollapsed(val) {
    const next = typeof val === 'function' ? val(bodyCollapsed) : val;
    if (controlled) { onBodyCollapseChange && onBodyCollapseChange(next); }
    else { setBodyCollapsedInternal(next); }
  }
  const [fav, setFav] = React.useState(false);
  const [effDate] = React.useState(function () { return new Date().toISOString().slice(0, 10); });

  // examen physique selects
  const [phys, setPhys] = React.useState({});
  function setP(k) { return function (e) { setPhys(function (p) { return Object.assign({}, p, { [k]: e.target.value }); }); }; }

  function toggle(id) { setCollapsed(function (c) { return Object.assign({}, c, { [id]: !c[id] }); }); }
  function isCol(id) { return !!collapsed[id]; }
  const allCollapsed = SECTION_IDS.every(function (id) { return collapsed[id]; });
  function toggleAll() {
    if (allCollapsed) { setCollapsed({}); }
    else { const o = {}; SECTION_IDS.forEach(function (id) { o[id] = true; }); setCollapsed(o); }
  }

  return (
    <div className={"ct-panel" + (dragging ? " is-dragging" : "")} data-screen-label="Outil clinique — Infection urinaire">
      {/* Top bar */}
      <div className="ct-bar">
        {onHandleDown &&
          <button className="ct-drag" title="Glisser pour déplacer l'outil dans la note" onPointerDown={onHandleDown}>
            <span className="material-icons-outlined">drag_indicator</span>
          </button>}
        <span className="ct-bar__wrench"><span className="material-icons-outlined">link</span></span>
        <span className="ct-bar__txt">
          <span className="ct-bar__overline">Outil clinique</span>
          <span className="ct-bar__title">Symptômes d'une infection urinaire</span>
        </span>
        <span className="ct-bar__actions">
          <button className={"ct-iconbtn" + (fav ? " is-fav" : "")} title="Favori" onClick={function () { setFav(!fav); }}>
            <span className="material-icons">{fav ? "favorite" : "favorite_border"}</span>
          </button>
          <button className="ct-iconbtn is-accent" title="Envoyer"><span className="material-icons-outlined">mail</span></button>
          <button className="ct-iconbtn is-accent" title="Imprimer"><span className="material-icons-outlined">print</span></button>
          <button className="ct-iconbtn is-accent" title="Fermer" onClick={onClose}><span className="material-icons-outlined">close</span></button>
          <button className="ct-iconbtn is-accent" title={bodyCollapsed ? "Déplier l'outil" : "Replier l'outil"}
            onClick={function () { setBodyCollapsed(function (b) { return !b; }); }}>
            <span className="material-icons-outlined">{bodyCollapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </span>
      </div>

      <div className="ct-body" style={bodyCollapsed ? { display: "none" } : null}>
        <div className="ct-effrow">
          <CTField label="Date d'entrée en vigueur" type="date" value={effDate} />
        </div>

        <p className="ct-doctitle">Symptômes d'une infection urinaire</p>

        {/* ---- HISTOIRE ---- */}
        <CTSection id="hist" name="Histoire" collapsed={isCol("hist")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <CTField label="Présence de sx urinaires depuis :" />
            <CTField label="Type d'apparition :" />
            <CTField label="Type de douleur :" />
            <CTField label="Irradiation :" />
            <CTField label="Échelle de la douleur :" />
            <CTField label="Soulagé par :" />
          </div>

          <p className="ct-sub ct-sub--plain">Présence de :</p>
          <div className="ct-checks ct-checks--3">
            <CTCheck label="Dysurie" />
            <CTCheck label="Urgence mictionnelle" />
            <CTCheck label="Pollakiurie" />
            <CTCheck label="Douleur ou malaise sus-pubien" />
            <CTCheck label="Hématurie" />
            <CTCheck label="Fièvre" />
            <CTCheck label="Douleur costo-vertébrale (au dos) ou au flanc" />
          </div>
          <p className="ct-note">***Si présence d'<strong>AU MOINS 2 signes</strong> ou Sx d'apparition récente = <strong>CYSTITE</strong></p>

          <p className="ct-sub">Présence CRITÈRES COMPLEXES ou à RISQUE :</p>
          <div className="ct-checks ct-checks--3">
            <CTCheck label="Homme" />
            <CTCheck label="Grossesse" />
            <CTCheck label="Immunosuppression" />
            <CTCheck label="Diabète mal contrôlé" />
            <CTCheck label="Insuffisance rénale sévère (DFG-30)" />
            <CTCheck label="Infection urinaire récidivante" />
            <CTCheck label="Risque d'antibiorésistance" />
          </div>
          <p className="ct-note">** Présence d'un critère = <strong>CYSTITE COMPLIQUÉE</strong> OU aucun critère = <strong>CYSTITE SIMPLE</strong></p>
          <p className="ct-note">** Présence d'un critère ou plus de pyélonéphrite : fièvre, douleur costo-vertébrale (au dos) ou au flanc = <strong>PYÉLONÉPHRITE</strong></p>

          <p className="ct-sub">Présence autres Sx :</p>
          <div className="ct-checks ct-checks--3">
            <CTCheck label="Nausée" />
            <CTCheck label="Vomissement" />
            <CTCheck label="Douleur abdominale" />
            <CTCheck label="Risque ITSS*" />
          </div>
          <p className="ct-note"><span className="ct-link">* Se référer au questionnaire ITSS prn</span></p>

          <div className="ct-grid ct-grid--2" style={{ marginTop: 8 }}>
            <div>
              <p className="ct-sub">Femme :</p>
              <div className="ct-checks ct-checks--1">
                <CTCheck label="Écoulement vaginal AN" />
                <CTCheck label="Lésions vulvaires de novo" />
                <CTCheck label="Prurit vulvaire" />
              </div>
              <div className="ct-grid ct-grid--2" style={{ marginTop: 12, marginBottom: 0 }}>
                <CTField label="Risque de grossesse ?" />
                <CTField label="DDM :" />
              </div>
            </div>
            <div>
              <p className="ct-sub">Homme :</p>
              <div className="ct-checks ct-checks--1">
                <CTCheck label="Écoulement pénien" />
                <CTCheck label="Lésions génitales de novo" />
                <CTCheck label="Prurit génital" />
              </div>
            </div>
          </div>
        </CTSection>

        {/* ---- DÉCISION CLINIQUE ---- */}
        <CTSection id="dec" name="Décision clinique" collapsed={isCol("dec")} onToggle={toggle}>
          <div className="ct-checks ct-checks--1">
            <CTCheck label="Le patient rencontre les critères pour l'application de l'OC #11" />
            <CTCheck label="Le patient ne rencontre pas les critères pour l'application de l'OC, il a été référé à une IPSPL ou un MD" />
          </div>
        </CTSection>

        {/* ---- CONDUITE À TENIR / PLAN ---- */}
        <CTSection id="plan" name="Conduite à tenir / Plan" collapsed={isCol("plan")} onToggle={toggle}>
          <p className="ct-sub">Traitement pharmacologique :</p>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 16 }}>
            <CTField label="" value="Antibiothérapie selon l'OC" />
          </div>

          <div className="ct-qrow" style={{ marginBottom: 14 }}>
            <span className="ct-qrow__lbl">Analyse de laboratoire de contrôle nécessaire :</span>
            <CTSeg options={["Oui", "Non"]} value={phys.lab || null} onChange={function (v) { setPhys(function (p) { return Object.assign({}, p, { lab: v }); }); }} />
          </div>
          <p className="ct-note">Si oui = Culture d'urine et contrôle 1 semaine post-fin de tx</p>

          <div className="ct-checks ct-checks--2">
            <CTCheck label="Requête remise au patient" />
            <CTCheck label="Avisé qu'il sera contacté lorsque résultats disponibles" />
          </div>

          <p className="ct-sub" style={{ marginTop: 16 }}>Counselling :</p>
          <div className="ct-checks ct-checks--1">
            <CTCheck label="Pour le soulagement de la douleur, envisager la prise d'acétaminophène ou d'ibuprofène, à moins d'une contre-indication." />
            <CTCheck label="Boire suffisamment d'eau (au moins 1.5 L par jour, sauf si contre-indiqué) pour aller uriner fréquemment." />
            <CTCheck label="Consulter à nouveau en cas de persistance, d'aggravation des signes et symptômes ou de détérioration de l'état général de la personne dans les 48-72 heures suivant le début des antibiotiques." />
            <CTCheck label="Donner des conseils sur les comportements qui peuvent aider à réduire le risque d'infection urinaire (hydratation abondante, essuyage de l'avant vers l'arrière après la défécation, miction post-coïtale, vidange complète de la vessie lors des mictions)." />
          </div>
        </CTSection>

        {/* ---- RECOMMANDATIONS / FILET DE SÉCURITÉ ---- */}
        <CTSection id="reco" name="Recommandations / Filet de sécurité" collapsed={isCol("reco")} onToggle={toggle}>
          <div className="ct-grid ct-grid--2" style={{ marginBottom: 6 }}>
            <CTCheck label="Patient informé de consulter une IPSPL ou médecin en urgence si :" />
            <p className="ct-note" style={{ margin: 0 }}>
              - Signes de réaction allergique <strong>*Doit cesser le traitement immédiatement*</strong><br />
              - T°, dlr aiguë, N, V ou DEG dans les 48-72 h après le début des antibiotiques
            </p>
          </div>
          <div className="ct-checks ct-checks--2">
            <CTCheck label="Avisé qu'il doit reconsulter si retour des symptômes dans les 2 à 4 semaines suivant le traitement" />
            <CTCheck label="Fiche conseil remise" />
            <CTCheck label="Fiche de liaison faxée à la pharmacie" />
            <CTCheck label="Patient dit être satisfait de la consultation" />
            <CTCheck label="Tâche ajoutée pour faire un suivi téléphonique d'ici 3-5 jours" />
          </div>
        </CTSection>

        {/* ---- EXAMEN PHYSIQUE ---- */}
        <CTSection id="exam" name="Examen physique" collapsed={isCol("exam")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <CTField label="Apparence générale" span={3} />

            <CTField label="Signes vitaux :" />
            <CTField label="TA :" />
            <CTField label="FC :" />

            <CTField label="FR :" />
            <CTField label="SpO2 % :" />
            <CTField label="T° :" />

            <CTField label="Cœur :" options={PHYS} value={phys.coeur} onChange={setP("coeur")} />
            <CTField label="Si anormal :" />
            <span />

            <CTField label="Poumons :" options={PHYS} value={phys.poumons} onChange={setP("poumons")} />
            <CTField label="Si anormal :" />
            <span />

            <CTField label="Abdomen :" options={PHYS} value={phys.abdomen} onChange={setP("abdomen")} />
            <span /><span />

            <CTField label="Si douleur abdomen :" options={["Sus-pubienne", "Lombaire", "Diffuse", "Autre"]} value={phys.dlrabdo} onChange={setP("dlrabdo")} />
            <span /><span />

            <CTField label="Punch rénaux :" options={["Négatif", "Positif droit", "Positif gauche", "Positif bilatéral"]} value={phys.punch} onChange={setP("punch")} />
            <span /><span />

            <CTField label="Anorectal :" options={PHYS} value={phys.anorectal} onChange={setP("anorectal")} />
            <CTField label="TR :" />
            <CTField label="Prostate :" options={["Normale", "Augmentée", "Sensible", "Anormale"]} value={phys.prostate} onChange={setP("prostate")} />

            <CTField label="Anus :" options={PHYS} value={phys.anus} onChange={setP("anus")} />
            <CTField label="Si anormal :" />
            <span />

            <CTField label="OGE :" />
            <CTField label="Testicules :" />
            <CTField label="Pénis :" />

            <CTField label="Gynéco :" />
            <CTField label="Vulve :" />
            <CTField label="Vagin :" />

            <CTField label="Col :" options={PHYS} value={phys.col} onChange={setP("col")} />
            <CTField label="Utérus :" options={PHYS} value={phys.uterus} onChange={setP("uterus")} />
            <CTField label="Annexes :" options={PHYS} value={phys.annexes} onChange={setP("annexes")} />

            <CTField label="Si annexes anormal :" />
            <div className="ct-field">
              <label>Sensibilité à la mobilisation du col</label>
              <div style={{ paddingTop: 4 }}>
                <CTSeg options={["Oui", "Non"]} value={phys.smc || null} onChange={function (v) { setPhys(function (p) { return Object.assign({}, p, { smc: v }); }); }} />
              </div>
            </div>
            <span />
          </div>
        </CTSection>

        {/* ---- INTERVENTION / PRÉLÈVEMENTS ---- */}
        <CTSection id="interv" name="Intervention / Prélèvements" collapsed={isCol("interv")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <CTField label="Bandelette urinaire :" />
            <CTField label="Leuco :" />
            <CTField label="Nitrite :" />
            <span />
            <CTField label="Hb :" />
            <CTField label="Protéines :" />
          </div>

          <div className="ct-grid ct-grid--3" style={{ alignItems: "end" }}>
            <label className="ct-check" style={{ paddingBottom: 6 }}>
              <CTCheckInner label="A+C d'urine" />
            </label>
            <div className="ct-field">
              <label>BHcg urinaire :</label>
              <div style={{ paddingTop: 4 }}>
                <CTBhcg />
              </div>
            </div>
            <CTField label="Autres :" />
          </div>

          <p className="ct-note"><strong>Cystite simple :</strong> Si absence de leuco = A+C d'urine &amp; attendre les résultats</p>
          <p className="ct-note ct-note--ital">*Si présence de sang et ou de protéines, envoyer une A+C d'urine*</p>

          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginTop: 8, marginBottom: 0 }}>
            <CTField label="IMP :" />
            <CTField label="Sx s'apparentant à :" options={["Cystite simple", "Cystite compliquée", "Pyélonéphrite", "Autre"]} value={phys.sxapp} onChange={setP("sxapp")} />
          </div>
        </CTSection>

        {/* ---- CONTRE-INDICATIONS ABSOLUES ---- */}
        <CTSection id="ci" name="Présence de contre-indications absolues : Oui / Non" collapsed={isCol("ci")} onToggle={toggle}>
          <div className="ct-qgrid">
            <CTYesNo label="Anomalie anatomique ou fonctionnelle de l'appareil urinaire" />
            <CTYesNo label="Hémodialyse ou pathologie rénale chronique autre que l'insuffisance rénale sévère" />
            <CTYesNo label="Chirurgie de l'appareil urinaire — 3 mois" />
            <CTYesNo label="Port d'un cathéter urinaire (sonde à demeure)" />
            <CTYesNo label="Contre-indication à l'usage de tous les antibiotiques recommandés" />
            <CTYesNo label="Instabilité hémodynamique et ou suspicion de sepsis" />
            <CTYesNo label="Femme enceinte de plus de 14 semaines" />
            <CTYesNo label="Symptomatologie compatible avec une prostatite, une orchiépididymite ou une pathologie gynécologique" />
          </div>
        </CTSection>

        {/* ---- SITUATION QUI NÉCESSITE UNE DISCUSSION ---- */}
        <CTSection id="disc" name="Situation qui nécessite une discussion avec le MD / IPSPL : Oui / Non" collapsed={isCol("disc")} onToggle={toggle}>
          <div className="ct-qgrid">
            <CTYesNo label="Facteurs de risque ITSS chez une personne symptomatique ET que l'inf. évaluatrice n'est pas habilitée à faire la prise en charge des ITSS ET que collègues inf. clin. habilitée n'est pas disponible" />
            <CTYesNo label="Insuffisance cardiaque, insuffisance rénale et ou patient immunosupprimé" />
            <CTYesNo label="État hémodynamique instable : état toxique, temps élevé, vomissement aigu, SV instable" />
            <CTYesNo label="Hématurie macroscopique" />
            <CTYesNo label="Enfant de moins de 14 ans et adulte de 75 ans et plus" />
            <CTYesNo label="Personne âgée (75 ans et plus) : patient confus et ou présence de rétention urinaire depuis plus de 16 h" />
          </div>
        </CTSection>
      </div>
    </div>);
}

// small inner check used where a checkbox sits inline in a grid cell
function CTCheckInner({ label }) {
  const [on, setOn] = React.useState(false);
  return (
    <React.Fragment>
      <input type="checkbox" checked={on} onChange={function (e) { setOn(e.target.checked); }} />
      <span>{label}</span>
    </React.Fragment>);
}

function CTBhcg() {
  const [v, setV] = React.useState(null);
  return <CTSeg options={["Négatif", "Positif"]} value={v} onChange={setV} />;
}

window.ClinicalTool = ClinicalTool;
