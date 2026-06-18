/* global React */
// =========================================================
// store.jsx — seed data + localStorage-backed store
// =========================================================
const STORE_KEY = "omd_sommaire_v1";

const SEED = {
  // order of summary boxes (priority spec order)
  order: ["problems", "past", "allergies", "meds", "results", "vitals", "habits"],

  allergies: [
    { id: "a1", name: "Pénicilline", kind: "allergie", reaction: "Urticaire", date: "2019-03-12", author: "Dr Tremblay", info: "Réaction cutanée généralisée 30 min après la prise." },
    { id: "a2", name: "Sulfamidés", kind: "allergie", reaction: "Éruption", date: "2021-08-02", author: "IPS Côté", info: "" },
    { id: "a3", name: "Arachides", kind: "intolerance", reaction: "Inconfort digestif", date: "2018-05-20", author: "Dr Tremblay", info: "Ballonnements, pas de réaction systémique." }
  ],
  noAllergy: false,

  meds: [
    { id: "m1", name: "Amlodipine", dose: "5 mg", sig: "1 co PO DIE", status: "active", starred: true, since: "2024-01-10", presc: "Dr Tremblay" },
    { id: "m2", name: "Rosuvastatine", dose: "10 mg", sig: "1 co PO HS", status: "active", starred: true, since: "2023-11-02", presc: "Dr Tremblay" },
    { id: "m3", name: "Acétaminophène", dose: "650 mg", sig: "1 co PO QID PRN", status: "active", starred: false, since: "2025-02-14", presc: "IPS Côté" },
    { id: "m4", name: "Métformine", dose: "500 mg", sig: "1 co PO BID", status: "echue", starred: false, since: "2024-06-01", presc: "Dr Tremblay" },
    { id: "m5", name: "Naproxen", dose: "500 mg", sig: "1 co PO BID × 7 j", status: "cessee", starred: false, since: "2025-01-08", presc: "Dr Lavoie" },
    { id: "m6", name: "Multivitamines (Centrum)", dose: "", sig: "1 co PO DIE", status: "texte", starred: false, since: "2024-09-20", presc: "—" }
  ],

  results: [
    { type: "creat", label: "Créatinine", unit: "µmol/L", starred: true, ref: "62–106", values: [
      { date: "2025-09-28", v: 82 }, { date: "2025-03-14", v: 79 }, { date: "2024-09-30", v: 84 } ] },
    { type: "ldl", label: "Cholestérol LDL", unit: "mmol/L", starred: false, ref: "< 2,0", values: [
      { date: "2025-09-28", v: 3.4 }, { date: "2025-03-14", v: 3.7 } ] },
    { type: "hb", label: "Hémoglobine", unit: "g/L", starred: false, ref: "130–170", values: [
      { date: "2025-09-28", v: 135 }, { date: "2024-09-30", v: 141 } ] },
    { type: "fer", label: "Fer sérique", unit: "µmol/L", starred: false, ref: "10–30", values: [
      { date: "2025-09-28", v: 18 } ] },
    { type: "tsh", label: "TSH", unit: "mUI/L", starred: true, ref: "0,35–5,0", values: [
      { date: "2025-09-28", v: 2.1 }, { date: "2024-09-30", v: 1.8 } ] }
  ],

  vitals: [
    { id: "v1", date: "2026-04-24", time: "09:14", poids: 78, taille: 178, sys: 118, dia: 74, fc: 68, temp: 36.8, spo2: 98, tour: 92 },
    { id: "v2", date: "2026-02-05", time: "10:30", poids: 79, taille: 178, sys: 124, dia: 80, fc: 72, temp: 36.6, spo2: 97, tour: 94 },
    { id: "v3", date: "2025-11-18", time: "08:50", poids: 80, taille: 178, sys: 130, dia: 84, fc: 76, temp: 37.0, spo2: 98, tour: 95 }
  ],
  vitalsStar: { ta: true, fc: true, imc: true, temp: false, poids: false, spo2: false, tour: false },

  problems: [
    { id: "p1", name: "Hypertension artérielle", kind: "probleme", status: "actif", since: "2022", starred: true },
    { id: "p2", name: "Dyslipidémie", kind: "probleme", status: "actif", since: "2023", starred: true },
    { id: "p3", name: "Lombalgie mécanique", kind: "probleme", status: "résolu", since: "2024", starred: false },
    { id: "p4", name: "Appendicectomie", kind: "antecedent", status: "—", since: "2014", starred: false },
    { id: "p5", name: "Fracture radius gauche", kind: "antecedent", status: "—", since: "2009", starred: false }
  ],

  habits: [
    { id: "h1", text: "Non-fumeur" },
    { id: "h2", text: "Alcool — occasionnel" },
    { id: "h3", text: "Exercice 3×/sem." }
  ],

  // temporary additions pushed from the note (prescriptions / requests)
  noteAdds: []
};

// medication search catalog (static)
const MED_CATALOG = [
  { name: "Amoxicilline", dose: "500 mg", klass: "Antibiotique", sig: "1 co PO TID × 7 j" },
  { name: "Lisinopril", dose: "10 mg", klass: "IECA", sig: "1 co PO DIE" },
  { name: "Atorvastatine", dose: "20 mg", klass: "Statine", sig: "1 co PO HS" },
  { name: "Pantoprazole", dose: "40 mg", klass: "IPP", sig: "1 co PO DIE AC" },
  { name: "Metformine", dose: "500 mg", klass: "Antidiabétique", sig: "1 co PO BID" },
  { name: "Salbutamol", dose: "100 mcg", klass: "BACA", sig: "2 inh PRN" },
  { name: "Hydrochlorothiazide", dose: "25 mg", klass: "Diurétique", sig: "1 co PO DIE" },
  { name: "Cetirizine", dose: "10 mg", klass: "Antihistaminique", sig: "1 co PO DIE" }
];

const MED_FAVS = [
  { name: "Amoxicilline", dose: "500 mg", sig: "1 co PO TID × 7 j", label: "Amox — otite/sinusite" },
  { name: "Azithromycine", dose: "250 mg", sig: "2 co J1 puis 1 co × 4 j", label: "Azithro — pack respiratoire" },
  { name: "Nitrofurantoïne", dose: "100 mg", sig: "1 co PO BID × 5 j", label: "Macrobid — cystite simple" }
];

const ALLERGEN_CATALOG = ["Pénicilline", "Sulfamidés", "AAS (Aspirine)", "Ibuprofène", "Codéine", "Latex", "Noix / Arachides", "Fruits de mer", "Iode (produits de contraste)", "Œuf"];

// ---- store mechanics ----
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED));
}
function persist(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

const StoreCtx = React.createContext(null);

function StoreProvider({ children }) {
  const [state, setState] = React.useState(loadStore);
  React.useEffect(() => { persist(state); }, [state]);

  const update = React.useCallback((fn) => {
    setState((s) => {
      const next = fn(JSON.parse(JSON.stringify(s)));
      return next;
    });
  }, []);

  const resetAll = React.useCallback(() => {
    const fresh = JSON.parse(JSON.stringify(SEED));
    setState(fresh);
  }, []);

  return React.createElement(StoreCtx.Provider, { value: { state, update, resetAll } }, children);
}

function useStore() {
  const ctx = React.useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

// ---- date helpers (FR-CA) ----
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
}
function fmtShort(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${String(y).slice(2)}`;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function bmi(poids, taille) {
  const p = parseFloat(poids), t = parseFloat(taille);
  if (!p || !t) return null;
  return p / Math.pow(t / 100, 2);
}
function bsa(poids, taille) {
  const p = parseFloat(poids), t = parseFloat(taille);
  if (!p || !t) return null;
  return Math.sqrt((p * t) / 3600); // Mosteller
}

Object.assign(window, {
  StoreProvider, useStore, MED_CATALOG, MED_FAVS, ALLERGEN_CATALOG,
  fmtDate, fmtShort, todayISO, bmi, bsa, MONTHS_FR, SEED
});
