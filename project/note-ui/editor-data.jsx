// =========================================================
// data.jsx — scenarios + entity registry (FR-CA)
// =========================================================
const ENTITY_TYPES = {
  prescription: { key: 'prescription', label: 'Prescription', icon: 'pill', summaryGroup: 'Médications' },
  lab:          { key: 'lab',          label: 'Laboratoire',  icon: 'science', summaryGroup: 'Résultats' },
  imaging:      { key: 'imaging',      label: 'Imagerie',     icon: 'radiology', summaryGroup: 'Résultats' },
  problem:      { key: 'problem',      label: 'Problème', icon: 'flag', summaryGroup: 'Problèmes' },
  instructions: { key: 'instructions', label: 'Consignes',    icon: 'menu_book', summaryGroup: 'Consignes' },
  diagnostic:   { key: 'diagnostic',   label: 'Diagnostic',   icon: 'local_hospital', summaryGroup: 'Diagnostics' },
  file:         { key: 'file',         label: 'Fichier',       icon: 'attach_file',    summaryGroup: 'Fichiers' },
  referral:     { key: 'referral',     label: 'Référence',     icon: 'person_add',     summaryGroup: 'Références' },
};

// MED_CATALOG — dictionary used for the autocomplete dropdown.
const MED_CATALOG = [
  { stem: 'metformine', brand: null, klass: 'Antidiabétique',
    text: 'Metformine 500 mg — 1 co PO BID avec repas × long terme',
    label: 'Metformine 500 mg',
    details: { molecule: 'Metformine', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '90', durationUnit: 'jours', quantity: '180', refills: '3',
      indication: 'Diabète type 2', notes: 'Avec repas pour diminuer GI.' } },
  { stem: 'méthotrexate', brand: null, klass: 'Immunosuppresseur',
    text: 'Méthotrexate 15 mg — 1 co PO 1× / sem × 90 jours',
    label: 'Méthotrexate 15 mg',
    details: { molecule: 'Méthotrexate', dose: '15', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: '1× / semaine', duration: '90', durationUnit: 'jours', quantity: '12', refills: '2',
      indication: 'Polyarthrite rhumatoïde', notes: 'Associer acide folique 5 mg.' } },
  { stem: 'méthylprednisolone', brand: 'Medrol', klass: 'Corticostéroïde',
    text: 'Méthylprednisolone 4 mg — dose-pack sur 6 jours',
    label: 'Méthylprednisolone 4 mg',
    details: { molecule: 'Méthylprednisolone', dose: '4', unit: 'mg', form: 'dose-pack', route: 'PO',
      frequency: 'Décroissant', duration: '6', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: 'Poussée inflammatoire', notes: 'Prendre le matin.' } },
  { stem: 'métoprolol', brand: 'Lopresor', klass: 'Bêta-bloqueur',
    text: 'Métoprolol 25 mg — 1 co PO BID × long terme',
    label: 'Métoprolol 25 mg',
    details: { molecule: 'Métoprolol', dose: '25', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '90', durationUnit: 'jours', quantity: '180', refills: '3',
      indication: 'HTA / FA', notes: 'Titrer selon FC et TA.' } },
  { stem: 'métronidazole', brand: 'Flagyl', klass: 'Antibiotique',
    text: 'Métronidazole 500 mg — 1 co PO TID × 7 jours',
    label: 'Métronidazole 500 mg',
    details: { molecule: 'Métronidazole', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: 'Infection anaérobie', notes: 'Éviter alcool pendant + 48 h après.' } },
  { stem: 'mébendazole', brand: 'Vermox', klass: 'Antiparasitaire',
    text: 'Mébendazole 100 mg — 1 co PO BID × 3 jours',
    label: 'Mébendazole 100 mg',
    details: { molecule: 'Mébendazole', dose: '100', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '3', durationUnit: 'jours', quantity: '6', refills: '0',
      indication: 'Oxyurose', notes: 'Répéter dose dans 2 semaines.' } },
  { stem: 'amoxicilline', brand: null, klass: 'Antibiotique',
    text: 'Amoxicilline 500 mg — 1 co PO TID × 7 jours',
    label: 'Amoxicilline 500 mg',
    details: { molecule: 'Amoxicilline', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: 'Otite moyenne aiguë', notes: 'Prendre avec nourriture.' } },
  { stem: 'ibuprofène', brand: 'Advil', klass: 'AINS',
    text: 'Ibuprofène 400 mg — 1 co PO QID PRN × 5 jours',
    label: 'Ibuprofène 400 mg',
    details: { molecule: 'Ibuprofène', dose: '400', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'QID PRN', duration: '5', durationUnit: 'jours', quantity: '20', refills: '0',
      indication: 'Douleur', notes: 'Max 4 doses / 24 h.' } },
  { stem: 'ventolin', brand: 'Ventolin', klass: 'Bronchodilatateur',
    text: 'Ventolin 100 mcg — 2 inh PRN q4-6h',
    label: 'Ventolin 100 mcg',
    details: { molecule: 'Salbutamol (Ventolin)', dose: '100', unit: 'mcg/inh', form: 'aérosol-doseur',
      route: 'Inhalé', frequency: 'q4-6h PRN', duration: '—', durationUnit: '',
      quantity: '1 inhalateur', refills: '5', indication: 'Bronchospasme', notes: 'Avec aérochambre.' } },
];

function _norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// =========================================================
// Rx search — commande « /rx » (favoris, fréquents, autres)
// =========================================================
const RX_FAVS = new Set(['actos15', 'amox500', 'vento100']);

const RX_ITEMS = [
  { key: 'actos15', name: 'Actos', dose: '15mg', active: true,
    sig: '1 comp. PO DIE, #30, 30j, R12',
    chipSig: '1 comp. PO DIE #30 30j R12',
    details: { molecule: 'Actos', dose: '15', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '30', durationUnit: 'jours', quantity: '30', refills: '12',
      indication: 'Diabète de type 2', notes: 'Pioglitazone.' } },
  { key: 'actos15-freq', name: 'Actos', dose: '15mg', freq: true,
    sig: '1 comprimé 1 fois par jour, #30, 30 jours, R2 mois, NPS C, Diabète de type 2',
    chipSig: '1 comp. PO DIE #30 30j R2',
    details: { molecule: 'Actos', dose: '15', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '30', durationUnit: 'jours', quantity: '30', refills: '2',
      indication: 'Diabète de type 2', notes: 'NPS C.' } },
  { key: 'actos30-freq', name: 'Actos', dose: '30mg', freq: true,
    sig: '1 comprimé 1 fois par jour, #30, 30 jours, R2 mois, NPS C, Diabète de type 2',
    chipSig: '1 comp. PO DIE #30 30j R2',
    details: { molecule: 'Actos', dose: '30', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '30', durationUnit: 'jours', quantity: '30', refills: '2',
      indication: 'Diabète de type 2', notes: 'NPS C.' } },
  { key: 'amox500', name: 'Amoxicilline', dose: '500mg',
    sig: '1 comp. PO TID, #21, 7j, R0',
    chipSig: '1 comp. PO TID #21 7j R0',
    details: { molecule: 'Amoxicilline', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: 'Otite moyenne aiguë', notes: 'Prendre avec nourriture.' } },
  { key: 'vento100', name: 'Ventolin', dose: '100mcg',
    sig: '2 inh. q4-6h PRN, R5',
    chipSig: '2 inh q4-6h PRN R5',
    details: { molecule: 'Salbutamol (Ventolin)', dose: '100', unit: 'mcg/inh', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'q4-6h PRN', duration: '', durationUnit: '', quantity: '1 inhalateur', refills: '5',
      indication: 'Bronchospasme', notes: 'Avec aérochambre.' } },
];

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function deriveRxSig(d) {
  const qty = d.form === 'comprimé' ? '1 comp.' : d.form === 'aérosol-doseur' ? '2 inh' : '1 dose';
  const dur = d.duration && d.duration !== '—'
    ? d.duration + (d.durationUnit === 'jours' || !d.durationUnit ? 'j' : ' ' + d.durationUnit)
    : '';
  return [qty, d.route, d.frequency,
    d.quantity && /^\d+$/.test(d.quantity) ? '#' + d.quantity : '',
    dur,
    d.refills !== '' && d.refills != null ? 'R' + d.refills : '']
    .filter(Boolean).join(' ');
}

function deriveRx(d, prev) {
  return {
    name: d.molecule || (prev && prev.name) || '',
    dose: d.dose ? d.dose + (d.unit || '') : '',
    sig: deriveRxSig(d),
    kind: 'rx'
  };
}

const RX_OTHERS = MED_CATALOG.map(function (m) {
  return {
    key: 'cat-' + m.stem, name: _cap(m.stem), brand: m.brand, dose: m.details.dose + ' ' + m.details.unit,
    sig: (m.text.split(' — ')[1] || '') + (m.klass ? ', ' + m.klass : ''),
    chipSig: deriveRxSig(m.details),
    details: m.details
  };
});

const RX_ALL = RX_ITEMS.concat(RX_OTHERS);

function searchRx(q) {
  const nq = _norm((q || '').trim());
  const match = function (it) {
    return !nq || _norm(it.name).startsWith(nq) || (it.brand && _norm(it.brand).startsWith(nq));
  };
  const favoris = RX_ALL.filter(function (it) { return RX_FAVS.has(it.key) && match(it); });
  const frequents = RX_ALL.filter(function (it) { return it.freq && !RX_FAVS.has(it.key) && match(it); });
  const autres = nq
    ? RX_ALL.filter(function (it) { return !it.freq && !RX_FAVS.has(it.key) && match(it); }).slice(0, 6)
    : [];
  return { favoris, frequents, autres };
}

function toggleRxFav(key) { RX_FAVS.has(key) ? RX_FAVS.delete(key) : RX_FAVS.add(key); }

// =========================================================
// Laboratoire — commande « /lab » (mêmes sections que /rx)
// =========================================================
const LAB_FAVS = new Set(['fsc', 'lipide']);
const LAB_ITEMS = [
  { key: 'fsc', name: 'FSC', dose: '', active: true,
    sig: 'Formule sanguine complète · Routine',
    chipSig: 'Routine',
    details: { tests: ['FSC'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'lipide', name: 'Bilan lipidique', dose: '',
    sig: 'Cholestérol total, HDL, LDL, TG · À jeun 12 h · Routine',
    chipSig: 'À jeun · Routine',
    details: { tests: ['Cholestérol total', 'HDL', 'LDL', 'Triglycérides'], priority: 'Routine', fasting: true, context: 'Dépistage cardiovasculaire', collection: 'Au CH le plus proche' } },
  { key: 'tsh', name: 'TSH', dose: '', freq: true,
    sig: 'Thyréostimuline · Routine',
    chipSig: 'Routine',
    details: { tests: ['TSH'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'glyc', name: 'Glycémie à jeun', dose: '', freq: true,
    sig: 'Glucose plasmatique · À jeun 8 h · Routine',
    chipSig: 'À jeun · Routine',
    details: { tests: ['Glycémie à jeun'], priority: 'Routine', fasting: true, context: '', collection: 'Au CH le plus proche' } },
  { key: 'hba1c', name: 'HbA1c', dose: '', freq: true,
    sig: 'Hémoglobine glyquée · Routine',
    chipSig: 'Routine',
    details: { tests: ['HbA1c'], priority: 'Routine', fasting: false, context: 'Suivi diabète', collection: 'Au CH le plus proche' } },
  { key: 'creat', name: 'Créatinine / DFGe', dose: '', freq: true,
    sig: 'Créatinine sérique + débit de filtration · Routine',
    chipSig: 'Routine',
    details: { tests: ['Créatinine', 'DFGe'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'ions', name: 'Ions (Na, K, Cl)', dose: '', freq: true,
    sig: 'Électrolytes · Routine',
    chipSig: 'Routine',
    details: { tests: ['Sodium', 'Potassium', 'Chlore'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'ferritine', name: 'Ferritine', dose: '',
    sig: 'Réserves de fer · Routine', chipSig: 'Routine',
    details: { tests: ['Ferritine'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'b12', name: 'Vitamine B12', dose: '',
    sig: 'Cobalamine sérique · Routine', chipSig: 'Routine',
    details: { tests: ['Vitamine B12'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'bilanhep', name: 'Bilan hépatique', dose: '',
    sig: 'ALT, AST, PAL, bilirubine · Routine', chipSig: 'Routine',
    details: { tests: ['ALT', 'AST', 'PAL', 'Bilirubine'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'inr', name: 'INR', dose: '',
    sig: 'Temps de prothrombine · Prioritaire', chipSig: 'Prioritaire',
    details: { tests: ['INR'], priority: 'Prioritaire', fasting: false, context: 'Suivi anticoagulation', collection: 'Au CH le plus proche' } },
  { key: 'srum', name: "Analyse d'urine (SMU-DCA)", dose: '',
    sig: 'Sommaire microscopique + culture · Routine', chipSig: 'Routine',
    details: { tests: ['SMU', 'Culture urinaire'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
];

// =========================================================
// Imagerie — commande « /img » (mêmes sections que /rx)
// =========================================================
const IMG_FAVS = new Set(['rxpoumon']);
const IMG_ITEMS = [
  { key: 'rxpoumon', name: 'Radiographie pulmonaire', dose: '', active: true,
    sig: '2 incidences (PA + latérale) · Sans contraste · Routine',
    chipSig: '2 incidences · Routine',
    details: { modality: 'Radiographie', region: 'Thorax', views: 'PA + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'echoabdo', name: 'Échographie abdominale', dose: '', freq: true,
    sig: 'Abdomen complet · Routine',
    chipSig: 'Routine',
    details: { modality: 'Échographie', region: 'Abdomen', views: 'Complète', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'rxgenou', name: 'Radiographie genou', dose: '', freq: true,
    sig: '3 incidences · Sans contraste · Routine',
    chipSig: '3 incidences · Routine',
    details: { modality: 'Radiographie', region: 'Genou', views: 'AP + latérale + rotule', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmcereb', name: 'TDM cérébrale', dose: '', freq: true,
    sig: 'Sans contraste · Prioritaire',
    chipSig: 'Sans contraste · Prioritaire',
    details: { modality: 'TDM', region: 'Cerveau', views: '', priority: 'Prioritaire', context: 'Céphalées', contrast: 'Sans' } },
  { key: 'mammo', name: 'Mammographie', dose: '', freq: true,
    sig: 'Bilatérale · Dépistage · Routine',
    chipSig: 'Bilatérale · Routine',
    details: { modality: 'Mammographie', region: 'Seins', views: 'Bilatérale', priority: 'Routine', context: 'Dépistage', contrast: 'Sans' } },
  { key: 'irmlomb', name: 'IRM lombaire', dose: '',
    sig: 'Rachis lombaire · Sans contraste · Routine', chipSig: 'Sans contraste · Routine',
    details: { modality: 'IRM', region: 'Rachis lombaire', views: '', priority: 'Routine', context: 'Lombalgie persistante', contrast: 'Sans' } },
  { key: 'echopelv', name: 'Échographie pelvienne', dose: '',
    sig: 'Pelvis · Routine', chipSig: 'Routine',
    details: { modality: 'Échographie', region: 'Pelvis', views: 'Sus-pubienne + endovaginale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmthorax', name: 'TDM thoracique', dose: '',
    sig: 'Thorax · Avec contraste · Routine', chipSig: 'Avec contraste · Routine',
    details: { modality: 'TDM', region: 'Thorax', views: '', priority: 'Routine', context: '', contrast: 'Avec' } },
  { key: 'rxcolonne', name: 'Radiographie colonne', dose: '',
    sig: 'Rachis · Sans contraste · Routine', chipSig: 'Routine',
    details: { modality: 'Radiographie', region: 'Colonne dorsolombaire', views: 'AP + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
];

// =========================================================
// Référence spécialiste — commande « /ref »
// =========================================================
const REF_FAVS = new Set(['cardio', 'ortho', 'derm']);
const REF_ITEMS = [
  { key: 'cardio',  name: 'Cardiologie',       dose: '', active: true,
    sig: 'Avis cardiologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Cardiologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ortho',   name: 'Orthopédie',         dose: '', freq: true,
    sig: 'Avis orthopédie · Routine',       chipSig: 'Routine',
    details: { specialty: 'Orthopédie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'derm',    name: 'Dermatologie',       dose: '', freq: true,
    sig: 'Avis dermatologie · Routine',     chipSig: 'Routine',
    details: { specialty: 'Dermatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gastro',  name: 'Gastroentérologie',  dose: '', freq: true,
    sig: 'Avis gastroentérologie · Routine', chipSig: 'Routine',
    details: { specialty: 'Gastroentérologie',  question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'neuro',   name: 'Neurologie',         dose: '', freq: true,
    sig: 'Avis neurologie · Routine',       chipSig: 'Routine',
    details: { specialty: 'Neurologie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'pneumo',  name: 'Pneumologie',        dose: '',
    sig: 'Avis pneumologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Pneumologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'rhuma',   name: 'Rhumatologie',       dose: '',
    sig: 'Avis rhumatologie · Routine',     chipSig: 'Routine',
    details: { specialty: 'Rhumatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'endo',    name: 'Endocrinologie',     dose: '',
    sig: 'Avis endocrinologie · Routine',   chipSig: 'Routine',
    details: { specialty: 'Endocrinologie',     question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'nephro',  name: 'Néphrologie',        dose: '',
    sig: 'Avis néphrologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Néphrologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'uro',     name: 'Urologie',           dose: '',
    sig: 'Avis urologie · Routine',         chipSig: 'Routine',
    details: { specialty: 'Urologie',           question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gyn',     name: 'Gynécologie',        dose: '',
    sig: 'Avis gynécologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Gynécologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ophthal', name: 'Ophtalmologie',      dose: '',
    sig: 'Avis ophtalmologie · Routine',    chipSig: 'Routine',
    details: { specialty: 'Ophtalmologie',      question: '', indication: '', priority: 'Routine', crds: '' } },
];

// Unified order registry (rx / lab / img / ref) — shared search + favorites
const ORDER_DEFS = {
  rx:  { kbd: 'rx',  type: 'prescription', icon: 'pill',      glyph: '℞', verb: 'prescrire', emptyNoun: 'produit',
         sections: ['Favoris', 'Traitements fréquemment prescrits', 'Autres produits trouvés'],
         favs: RX_FAVS,  items: function () { return RX_ALL; }, search: searchRx },
  lab: { kbd: 'lab', type: 'lab',          icon: 'science',   glyph: null, verb: 'demander',  emptyNoun: 'analyse',
         sections: ['Favoris', 'Analyses fréquemment demandées', 'Autres analyses'],
         favs: LAB_FAVS, items: function () { return LAB_ITEMS; }, search: function (q) { return _searchList(LAB_ITEMS, LAB_FAVS, q); } },
  img: { kbd: 'img', type: 'imaging',      icon: 'radiology',  glyph: null, verb: 'demander',  emptyNoun: 'examen',
         sections: ['Favoris', 'Examens fréquemment demandés', 'Autres examens'],
         favs: IMG_FAVS, items: function () { return IMG_ITEMS; }, search: function (q) { return _searchList(IMG_ITEMS, IMG_FAVS, q); } },
  ref: { kbd: 'ref', type: 'referral',     icon: 'person_add', glyph: null, verb: 'référer',   emptyNoun: 'spécialité',
         sections: ['Favoris', 'Spécialités fréquentes', 'Autres spécialités'],
         favs: REF_FAVS, items: function () { return REF_ITEMS; }, search: function (q) { return _searchList(REF_ITEMS, REF_FAVS, q); } },
};

function _searchList(list, favSet, q) {
  const nq = _norm((q || '').trim());
  const match = function (it) { return !nq || _norm(it.name).startsWith(nq) || _norm(it.name).includes(nq); };
  const favoris = list.filter(function (it) { return favSet.has(it.key) && match(it); });
  const frequents = list.filter(function (it) { return it.freq && !favSet.has(it.key) && match(it); });
  const autres = nq
    ? list.filter(function (it) { return !it.freq && !favSet.has(it.key) && match(it); }).slice(0, 6)
    : [];
  return { favoris, frequents, autres };
}

// kbd → order kind ('rx' | 'lab' | 'img'), or null
function orderKindForKbd(kbd) {
  const k = (kbd || '').toLowerCase();
  return ORDER_DEFS[k] ? k : null;
}
function searchOrder(kind, q) { const d = ORDER_DEFS[kind]; return d ? d.search(q) : { favoris: [], frequents: [], autres: [] }; }
function toggleOrderFav(kind, key) { const d = ORDER_DEFS[kind]; if (d) { d.favs.has(key) ? d.favs.delete(key) : d.favs.add(key); } }

// Regenerate the rich-chip payload after a popover edit (lab / imaging)
function deriveLabRx(d) {
  const name = (d.tests && d.tests.length) ? d.tests.join(', ') : 'Demande de laboratoire';
  const sig = [d.fasting ? 'À jeun' : '', d.priority].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'lab' };
}
function deriveImgRx(d) {
  const name = [d.modality, d.region].filter(Boolean).join(' ') || "Demande d'imagerie";
  const sig = [d.contrast && d.contrast !== 'Sans' ? 'Avec contraste' : '', d.views, d.priority].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'img' };
}
function deriveRefRx(d) {
  const name = d.specialty || 'Référence spécialiste';
  const sig = d.priority || 'Routine';
  return { name: name, dose: '', sig: sig, kind: 'ref' };
}

const RECOGNIZERS = [
  { test: function(t) {
      const m = t.match(/(?:^|\s)([a-zà-ÿ]{2,})\s*$/i);
      if (!m) return null;
      const q = _norm(m[1]);
      const matches = MED_CATALOG.filter(function(x){
        return _norm(x.stem).startsWith(q) || (x.brand && _norm(x.brand).startsWith(q));
      });
      if (matches.length === 0) return null;
      return { matched: m[1], options: matches };
    },
    suggest: function(matched, options) {
      return {
        matched: matched,
        options: options.map(function(o){
          return {
            stem: o.stem, label: o.label, text: o.text, brand: o.brand, klass: o.klass,
            entity: { type: 'prescription', label: o.text, text: o.text, details: o.details },
          };
        }),
      };
    }
  },
];

const SLASH_ITEMS = [
  // ── STRUCTURE ────────────────────────────────────────────
  { key: 'add-section', section: 'Structure', icon: 'add', title: 'Ajouter une section', desc: 'Nouvelle section de texte libre', kbd: 'sec',
    addSection: true },
  { key: 'outils-cliniques', section: 'Structure', icon: 'handyman', title: 'Outils cliniques', desc: 'Score, calculatrice, outil clinique…', kbd: '',
    ctPicker: true, noKbd: true },
  // ── FONCTIONS ────────────────────────────────────────────
  { key: 'add-file', section: 'Fonctions', icon: 'upload_file', title: 'Ajouter des fichiers', desc: 'PDF, image depuis ordinateur…', kbd: 'Alt+A',
    kbdNoSlash: true, fileAction: true },
  { key: 'instructions', section: 'Fonctions', icon: 'menu_book', title: 'Instructions patient', desc: 'Consignes au patient', kbd: 'instr',
    template: { type: 'instructions', label: 'Consignes', text: 'Consignes au patient',
      details: { title: '', body: '', delivery: 'Imprimer + portail' } } },
  { key: 'textes-rapides', section: 'Fonctions', icon: 'bolt', title: 'Textes rapides', desc: 'Insérer un modèle de texte', kbd: 'Ctrl+R',
    kbdNoSlash: true, textRapides: true },
  { key: 'diagnostic', section: 'Fonctions', icon: 'local_hospital', title: 'Diagnostic', desc: 'Créer une section diagnostic', kbd: 'dx',
    diagnosticEntry: true },
  { key: 'prescription', section: 'Fonctions', icon: 'prescriptions', title: 'Prescriptions', desc: 'Rechercher et prescrire un médicament', kbd: 'rx',
    rxSearch: true },
  { key: 'lab', section: 'Fonctions', icon: 'science', title: 'Laboratoire', desc: 'FSC, TSH, bilan…', kbd: 'lab',
    orderSearch: true,
    template: { type: 'lab', label: 'Demande de laboratoire', text: 'Demande de laboratoire',
      details: { tests: ['FSC'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } } },
  { key: 'imaging', section: 'Fonctions', icon: 'radiology', title: 'Imagerie', desc: 'Radio, écho, TDM', kbd: 'img',
    orderSearch: true,
    template: { type: 'imaging', label: "Demande d'imagerie", text: "Demande d'imagerie",
      details: { modality: 'Radiographie', region: '', views: '', priority: 'Routine', context: '', contrast: 'Sans' } } },
  { key: 'referral', section: 'Fonctions', icon: 'person_add', title: 'Référence spécialiste', desc: 'Cardio, ortho, derm…', kbd: 'ref',
    orderSearch: true,
    template: { type: 'referral', label: 'Référence spécialiste', text: 'Référence spécialiste',
      details: { specialty: '', question: '', indication: '', priority: 'Routine', crds: '' } } },
  // ── accessible via /pb uniquement (masqué dans menu vide) ─
  { key: 'problem', section: 'Fonctions', icon: 'flag', title: 'Problème', desc: 'Ajouter au problématique', kbd: 'pb',
    hideWhenEmpty: true,
    template: { type: 'problem', label: 'Problème', text: 'Problème',
      details: { name: '', severity: 'Modéré', since: "Aujourd'hui", notes: '' } } },
];

const PATIENT = {
  initials: 'GT',
  name: 'Geneviève Tremblay',
  age: '38 ans',
  sex: 'F',
  dob: '03 mai 1987',
  ramq: 'TREG 8705 0301',
  phone: '514 555 0184',
  reason: 'Otite moyenne aiguë',
  status: 'En consultation',
};

const PROBLEMS = [
  { id: 'pb1', ttl: 'Asthme léger', meta: 'Depuis 2018 · Contrôlé', sev: 'ok', sevLbl: 'Stable' },
  { id: 'pb2', ttl: 'Allergie pénicilline', meta: 'Réaction: éruption cutanée', sev: 'err', sevLbl: 'Légère' },
  { id: 'pb3', ttl: 'Grossesse', meta: '22 sem · suivi GARE', sev: '', sevLbl: 'Actif' },
];

const VITALS = [
  { ic: 'thermostat',    lbl: 'Température', val: '38,1 °C' },
  { ic: 'favorite',      lbl: 'FC',            val: '84 bpm' },
  { ic: 'monitor_heart', lbl: 'TA',            val: '118/72' },
  { ic: 'air',           lbl: 'SpO₂',     val: '98 %' },
  { ic: 'scale',         lbl: 'Poids',         val: '64 kg' },
];

const RESULTS_RECENT = [
  { id: 'r1', ttl: 'FSC — 17 mars 2026', meta: 'Hb 128 g/L · Leuco 9,2', sev: 'ok', sevLbl: 'Normal' },
  { id: 'r2', ttl: 'TSH — 12 janv 2026', meta: '2,1 mUI/L', sev: 'ok', sevLbl: 'Normal' },
];

const SCENARIOS = [
  { key: 'empty',  name: 'Note vierge', desc: 'Commencer à zéro',
    detail: '', conclusion: '', hint: null },
  { key: 'rx',     name: 'Démo — prescription', desc: 'Tapez « mét » pour voir la liste',
    detail: "Motif de consultation\nPatiente enceinte de 22 sem consulte pour otalgie droite depuis 48 h, accompagnée d'un écoulement clair intermittent et d'une sensation d'oreille bouchée. Pas de vertiges, pas d'acouphènes, pas de fièvre frissonnante.\n\nAntécédents\nAsthme léger bien contrôlé sous Ventolin PRN. Grossesse actuelle sans complication, suivie en GARE. Allergie légère à la pénicilline documentée en 2019 — éruption maculopapuleuse seulement, pas d'œdème ni d'urticaire.\n\nExamen physique\nTempérature 38,1 °C, TA 118/72, FC 84 régulière, SpO₂ 98 % à l'air ambiant. Patiente alerte, confortable.\nOtoscopie droite : tympan bombé, érythémateux, opaque, perte du triangle lumineux. Otoscopie gauche : tympan nacré, mobile à l'insufflation, reliefs normaux.\nAuscultation pulmonaire claire, pas de râles ni de sibilances. Pharynx sans érythème. Adénopathies cervicales non palpables.\n\nRevue des systèmes\nPas de céphalées, pas de nausées, pas d'éruption cutanée. Mouvements fœtaux perçus, pas de contractions..",
    conclusion: 'Impression\nInfection bactérienne — plan de traitement à venir.\n\nPlan\nAntibiothérapie: mét',
    hint: 'Le curseur est placé après « mét ». Continuez à taper pour filtrer la liste. ↑ ↓ pour naviguer, Entrée / Tab pour choisir.' },
  { key: 'composed', name: 'Note avancée', desc: 'Plusieurs items confirmés',
    detail: 'Bilan annuel. HTA et dyslipidémie suivis. Pas de plainte.\nTA 138/86, FC 72 rég. Auscultation normale.',
    conclusion: 'Bilan stable. Renouvellement atorvastatine. Bilan lipidique annuel à jeun. Suivi 3 mois.',
    preChips: [
      { slot: 'conclusion', entity: { type: 'prescription', label: 'Atorvastatine 20 mg',
        text: 'Atorvastatine 20 mg — HS × 90 jours',
        details: { molecule: 'Atorvastatine', dose: '20', unit: 'mg', form: 'comprimé',
          route: 'PO', frequency: 'HS', duration: '90', durationUnit: 'jours',
          quantity: '90', refills: '3', indication: 'Dyslipidémie', notes: 'Surveiller CK.' } } },
      { slot: 'conclusion', entity: { type: 'lab', label: 'Bilan lipidique',
        text: 'Bilan lipidique + ALT + créat',
        details: { tests: ['Chol total', 'HDL', 'LDL', 'TG', 'ALT', 'Créat'], priority: 'Routine',
          fasting: true, context: 'Suivi statine', collection: 'Au CH' } } },
    ],
    hint: 'Cliquez sur un chip pour modifier les détails.' },
];

window.NOTE_DATA = { ENTITY_TYPES, RECOGNIZERS, MED_CATALOG, SLASH_ITEMS, PATIENT, PROBLEMS, VITALS, RESULTS_RECENT, SCENARIOS,
  RX_FAVS, RX_ITEMS, searchRx, toggleRxFav, deriveRx,
  ORDER_DEFS, orderKindForKbd, searchOrder, toggleOrderFav, deriveLabRx, deriveImgRx, deriveRefRx };
