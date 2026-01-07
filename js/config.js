// PHYSIPRO MOULAGE v13.3 - JAVASCRIPT PROPRE
// =====================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCk7bqVnx08Kz1fVq1W24AuW854KY9jPno",
  authDomain: "liste-des-moulages-physipro.firebaseapp.com",
  databaseURL: "https://liste-des-moulages-physipro-default-rtdb.firebaseio.com",
  projectId: "liste-des-moulages-physipro",
  storageBucket: "liste-des-moulages-physipro.firebasestorage.app",
  messagingSenderId: "24566847562",
  appId: "1:24566847562:web:db492bdd33116373e0eeb3"
};

// Utilisateurs autorises (identique au fichier original)
const USERS = {
  "atelieratp@physipro.com": { name: "Daniel Charest", role: "admin", allowedPages: ["all"], tempHash: "272ba5a5b4b8932fbe73c759383fbe3fdc1c98bbeaf6f93d12cb72dbbd460af1" },
  "simdut@physipro.com": { name: "Cassie Valois", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "b36e5a61cadecc891b457429048e44133cf8dae501a9cfc4c423bcf00715da30" },
  "mplanguedoc@physipro.com": { name: "Marie-Pier Languedoc", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "ff5cfebfb49c5213aa2304f15e19c3147f48d55aa26ea299f7457c0209f804e0" },
  "marie-soleil.riverin@physipro.com": { name: "Marie-Soleil Riverin", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "722d36562183c87fa53ce5c44d424c63c6c3b2b27c72c7a233663d9f568fecc2" },
  "michelle.bouchard@physipro.com": { name: "Michelle Bouchard", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "a899253b54dd6c800f9513919186a55948f9ff0d6162b9fdb200bdaf60a500f3" },
  "ngagne@physipro.com": { name: "Nadia Gagne", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs", "PSM"], tempHash: "cb2a7765e640d51841f9aa8dfc335e19bcbd894b0c8cc096d97a073c9a4b548d" },
  "cncatp@physipro.com": { name: "Sina Lotfollah", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "1d537709c14a89facf0704bd2c091d9da8b48fe69b0c65de5741db0b9ad7919d" },
  "magasinatp3@physipro.com": { name: "Stephane Delorme", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "5042c15596f4aad0f612d50e0c013476f84a1d709527eca42821cf423f6092c0" },
  "sroy@physipro.com": { name: "Stephanie Roy", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "eeff8c3b9ae24e6a2d8b3c8766c0a7bf927bf479da0aa94e21061ded39c6ce6d" },
  "magasinatp2@physipro.com": { name: "Sylvain Carrier", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "ffdebc076a622154180f479624c9a9e1c4ff4c832f62aca8f15341d16cfda6ef" },
  "mario.jacques@physipro.com": { name: "Mario Jacques", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "15d700ad21280a8c2fa03075c55c70a766ea8c9db5b5d8f7a850835e67514357" },
  "valerie18@videotron.ca": { name: "Valerie Frechette", role: "editor", allowedPages: ["all"], tempHash: "3277ff046b6d07eb1ff818f1a54ef1a7d40d72cb151fd29058efc54bfbe84d1a" },
  "fabrys.frechette@physipro.com": { name: "Fabrys Frechette", role: "viewer", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "2815e7664309c9785471fe9dba0c2ed4f97dd52a89f5e2b17fa695187d07c34e" },
  "rh@physipro.com": { name: "Roxanne Valois", role: "viewer", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "47fb2d990d95be18c1e0206e1f3640bcaf5ed0345bbb220757556d0fd3424f07" },
  "sonia.boulanger@physipro.com": { name: "Sonia Boulanger", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs", "PSM"], tempHash: "847267f5801f9d09b17995593d69db5a4b6a425c3d8594d8cdf81227c80e1fec" },
  "magasinatp1@physipro.com": { name: "Stephane Duchesneau", role: "viewer", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "bbca07c4246a26a6c438c325d29329b90693a5d26ccc166dd30ae755c9cfc540" },
  "marioouellette@physipro.com": { name: "Mario Ouellette", role: "viewer", allowedPages: ["Moulages", "Série+", "Jobs"], tempHash: "71b5601cad7b61f8a9bbf42546303b4676990f07d8ecee70a89c464b36553c4a" },
  "service3@physipro.com": { name: "Jacynthe Gaumond", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs", "PSM"], tempHash: "fd9f31c199a09b28b4d0eafe0dd63713f219141c2723a62ec68106079c3b10b5" },
  "service1@physipro.com": { name: "Jonathan Perreault", role: "editor", allowedPages: ["Moulages", "Série+", "Jobs", "PSM"], tempHash: "placeholder_jonathan" },
  "pbouchard@physipro.com": { name: "Patrick Bouchard", role: "admin", allowedPages: ["all"], tempHash: "placeholder_patrick" },
  "cheick212@yahoo.fr": { name: "Checkna", role: "operator", allowedPages: ["Inventaire"], inventaireFabriquerOnly: true, tempHash: "3969378e6702cf9808e38c998a2a4517a60647d043c8caf6b92614120f74af85" },
  "messandossa10@gmail.com": { name: "Pablo", role: "operator", allowedPages: ["Inventaire"], inventaireFabriquerOnly: true, tempHash: "8f3e51eb3d6b6a7098a3e08869bc47dc39a2c5cb0609507c5a2492ab7c4e86fa" }
};

const COLUMNS = [
  { id: 0, name: 'Robot', contentId: 'colRobot', countId: 'countRobot' },
  { id: 1, name: 'Dégauchage', contentId: 'colDégauchage', countId: 'countDégauchage' },
  { id: 2, name: 'Essayage', contentId: 'colEssayage', countId: 'countEssayage' },
  { id: 3, name: 'Atelier', contentId: 'colAtelier', countId: 'countAtelier' },
  { id: 4, name: 'Couture', contentId: 'colCouture', countId: 'countCouture' },
  { id: 5, name: 'Peinture', contentId: 'colPeinture', countId: 'countPeinture' },
  { id: 6, name: 'Expédition', contentId: 'colExpedition', countId: 'countExpedition' },
  { id: 7, name: 'En attente', contentId: 'colAttente', countId: 'countAttente' }
];

let firebaseAuth, firebaseDb, currentUser = null, cardsData = {};

// Listes personnalisables (triees alphabetiquement)
let customLists = {
  moulageClients: [
    'IWK Nouvelle Ecosse',
    'MED +',
    'Metro Health Nouveau Brunswick',
    'SAT Baie Comeau',
    'SAT CRE Sherbrooke',
    'SAT CRDPCA',
    'SAT Gaspesie Saint Anne des Monts',
    'SAT IRDPQ Hamel',
    'SAT Joliette',
    'SAT Jonquiere Saguenay Lac Saint Jean',
    'SAT Mont Joli',
    'SAT Sept Iles',
    'SAT Trois Rivieres',
    'Stan Cassidy Nouveau Brunswick',
    'TLC Medical'
  ],
  regions: ['Maritime', 'Canada anglais', 'Quebec'],
  intervenants: [
    'Anna Caulfield',
    'Annie Bourgeois',
    'Anne Sophie Montminy',
    'Camille Morel',
    'Cindy Audet',
    'Eric Gagnon',
    'Godefroy Neault',
    'Isabelle Neault',
    'Jenny Jackson',
    'Joelle Bourdages',
    'Josee Bedard',
    'Josianne Labrecque',
    'Judith Lagimoniere',
    'Julie Lefebvre',
    'Lisa Houde',
    'Louis Matton',
    'Maggie MCCann',
    'Marie Michelle Hamel',
    'Marie Smith',
    'Mario Lebouthiller',
    'Martine Comeau',
    'Mireille Lefebvre',
    'Nadyne Gobeil',
    'Pam McKaskill',
    'Stephanie DAstou',
    'Tabitha Knowles',
    'Ysabelle Fugere'
  ],
  representantes: ['Marie-Pier', 'Marie-Soleil'],
  items: [
    'Appui-tête',
    'Coussin',
    'Dossier',
    'Siège',
    'Siège + Dossier'
  ],
  raisonsAttente: [
    "En attente de pièces",
    "En attente d'approbation client",
    "En attente de réponse couture",
    "En attente de réponse atelier",
    "En attente de réponse robot",
    "En attente de posit",
    "En attente ROHO",
    "En attente de plaques d'aluminium",
    "En attente de fichiers de scans"
  ]
};

let currentListKey = null;
let currentListTitle = null;

// Elements DOM
const loginOverlay = document.getElementById('loginOverlay');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const userStatusEl = document.getElementById('userStatus');

