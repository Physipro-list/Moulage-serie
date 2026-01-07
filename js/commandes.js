// ===== COMMANDES (SÉRIE+) =====
// Données de test - commandes pré-créées pour démonstration
const TEST_COMMANDES = {
  'test1': {
    order: '454654',
    client: 'Vermeiren',
    dateLivraison: '2025-01-15',
    items: [
      { name: 'Premium', grandeurs: [
        { name: 'S', qty: 5, atelier: { status: 'done', note: '', qtyFait: 5 }, couture: { status: 'partial', note: '', qtyFait: 3, employe: '' }, inspection: { status: 'todo', note: '', qtyFait: 0, exped: 'attente' } },
        { name: 'M', qty: 10, atelier: { status: 'partial', note: 'Test note', qtyFait: 7 }, couture: { status: 'todo', note: '', qtyFait: 0, employe: '' }, inspection: { status: 'todo', note: '', qtyFait: 0, exped: 'attente' } }
      ]},
      { name: 'Ultra', grandeurs: [
        { name: 'L', qty: 3, atelier: { status: 'todo', note: '', qtyFait: 0 }, couture: { status: 'todo', note: '', qtyFait: 0, employe: '' }, inspection: { status: 'todo', note: '', qtyFait: 0, exped: 'attente' } }
      ]}
    ]
  },
  'test2': {
    order: '156333',
    client: 'HME',
    dateLivraison: '2025-01-05',
    items: []
  },
  'test3': {
    order: '789012',
    client: 'France',
    dateLivraison: '2025-02-01',
    items: [
      { name: 'Physiair', grandeurs: [
        { name: 'XL', qty: 8, atelier: { status: 'done', note: '', qtyFait: 8 }, couture: { status: 'done', note: '', qtyFait: 8, employe: 'Mario' }, inspection: { status: 'partial', note: '', qtyFait: 4, exped: 'partiel' } }
      ]}
    ]
  }
};

// Commandes data - initialisé avec les données de test
let commandesData = JSON.parse(JSON.stringify(TEST_COMMANDES));
let currentCmdId = null;
const CMD_CLIENTS = ['Vermeiren', 'HME', 'C1SOUTH', 'Cubro', 'France'];

// Listes des valeurs pour Item et Grandeur
const CMD_ITEM_VALUES = ["Premium", "Ultra", "PZ Siliko", "Physiair", "Easy-fit", "HP2", "Cinch", "Resolve", "Brio", "Appuis Thoraciques"];
const CMD_GRANDEUR_VALUES = ["10 x 10", "12 x 12", "12 x 14", "14 x 14", "14 x 16", "16 x 16", "16 x 18", "18 x 16", "18 x 18", "18 x 20", "20 x 20", "20 x 18", "20 x 16", "20 x 22", "22 x 18", "22 x 20"];

// Listes des employés
let EMPLOYES_ATELIER = ['Mario', 'Sina', 'Cassie'];
let EMPLOYES_COUTURE = ['Michelle', 'Francine', 'Stéphanie', 'Valérie'];

// Options d'expédition
let EXPEDITION_OPTIONS = [
  { value: 'attente', label: 'En attente', blink: false, color: '' },
  { value: 'pret', label: 'Prêt expédition', blink: true, color: '' },
  { value: 'expedie', label: 'Expédié', blink: false, color: '' }
];

// ===== SYSTÈME DE RECETTES ET MATÉRIAUX =====
// Recettes par défaut pour chaque type d'item
const CMD_RECETTES = {
  "HP2": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou 22x24", qty: 1, epaisseur: "½″" }
  ],
  "HP2 Ultra": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou 22x24", qty: 1, epaisseur: "½″" },
    { code: "COQ-2S", materiau: "Coquille 2Sizer", qty: 1, epaisseur: "" },
    { code: "VIS-T36", materiau: "Feuille Viscose T36 (cuvette)", qty: 1, epaisseur: "" }
  ],
  "Ultra": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou 22x24", qty: 1, epaisseur: "½″" },
    { code: "COQ-2S", materiau: "Coquille 2Sizer", qty: 1, epaisseur: "" }
  ],
  "Premium": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou 22x24", qty: 1, epaisseur: "½″" }
  ],
  "Easy-fit": [
    { code: "NEO-60", materiau: "Feuille Néocor VF60", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou", qty: 0.5, epaisseur: "1″" }
  ],
  "Brio": [
    { code: "NEO-60", materiau: "Feuille Néocor VF60", qty: 1.5, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou", qty: 0.5, epaisseur: "1″" },
    { code: "BIS-BR", materiau: "Biseau pour Brio", qty: 1, epaisseur: "" }
  ],
  "Coussin Brio": [
    { code: "NEO-60", materiau: "Feuille Néocor VF60", qty: 1.5, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou", qty: 0.5, epaisseur: "1″" },
    { code: "BIS-BR", materiau: "Biseau pour Brio", qty: 1, epaisseur: "" },
    { code: "BUT-AB", materiau: "Butée ABD Néocor", qty: 1, epaisseur: "" },
    { code: "NEO-40", materiau: "Feuille Néocor VF40", qty: 0.5, epaisseur: "½″" }
  ],
  "Physiair": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "AIR-M", materiau: "Feuille Air mou", qty: 1, epaisseur: "½″" }
  ],
  "Cinch": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "SUN-M", materiau: "Feuille Sunmate mou", qty: 0.5, epaisseur: "½″" },
    { code: "CIN-S", materiau: "Sangle Cinch", qty: 1, epaisseur: "" }
  ],
  "Resolve": [
    { code: "VIS-22", materiau: "Feuille Viscose 22x24", qty: 1, epaisseur: "1″" },
    { code: "RES-F", materiau: "Foam Resolve", qty: 1, epaisseur: "1″" }
  ],
  "PZ Siliko": [
    { code: "SIL-22", materiau: "Feuille Silicone 22x24", qty: 1, epaisseur: "1″" },
    { code: "PZ-B", materiau: "Base PZ", qty: 1, epaisseur: "" }
  ]
};

// Recettes personnalisées (peuvent être ajoutées/modifiées)
let customRecettes = {};

// Obtenir la recette pour un item
function getRecetteForItem(itemName) {
  if (!itemName) return [];
  
  // D'abord vérifier les recettes personnalisées (exact match)
  const customKey = itemName.replace(/[.#$/[\]]/g, '_');
  if (customRecettes[customKey]) {
    return customRecettes[customKey];
  }
  
  // Vérifier les recettes par défaut (exact match)
  if (CMD_RECETTES[itemName]) {
    return CMD_RECETTES[itemName];
  }
  
  // Recherche partielle dans les recettes par défaut
  const itemNameLower = itemName.toLowerCase();
  for (const [key, value] of Object.entries(CMD_RECETTES)) {
    if (key.toLowerCase().includes(itemNameLower) || itemNameLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Recherche partielle dans les recettes personnalisées
  for (const [key, value] of Object.entries(customRecettes)) {
    const keyClean = key.replace(/_/g, ' ').toLowerCase();
    if (keyClean.includes(itemNameLower) || itemNameLower.includes(keyClean)) {
      return value;
    }
  }
  
  return [];
}

// Mettre à jour la section Matériaux
function updateMateriauxSection(cmdId) {
  const container = document.getElementById('cmdMateriauxContainer');
  const totalContainer = document.getElementById('cmdMateriauxTotalTop');
  if (!container) return;
  
  const cmd = commandesData[cmdId];
  if (!cmd || !cmd.items || cmd.items.length === 0) {
    container.innerHTML = '<div style="color:#9ca3af;font-size:9px;text-align:center;padding:10px;grid-column:1/-1;">Aucun item - Ajoutez des items dans le Tableau</div>';
    if (totalContainer) totalContainer.innerHTML = '';
    return;
  }
  
  // Collecter tous les matériaux pour le total
  const totalMateriaux = {};
  
  // Préparer les colonnes par item
  const columns = [];
  
  // Pour chaque item dans la commande
  cmd.items.forEach(item => {
    const itemName = item.name || 'Item';
    const recette = getRecetteForItem(itemName);
    
    // Calculer la quantité totale (somme de toutes les grandeurs)
    const totalQty = (item.grandeurs || []).reduce((sum, g) => sum + (parseInt(g.qty) || 0), 0);
    
    // Créer les lignes pour cet item
    const lines = [];
    
    if (recette && recette.length > 0) {
      recette.forEach(mat => {
        const matQty = parseFloat(mat.qty) || 1;
        const qtyNeeded = matQty * (totalQty || 1);
        const qtyDisplay = qtyNeeded % 1 === 0 ? qtyNeeded : qtyNeeded.toFixed(1);
        const epaisseur = mat.epaisseur || '';
        const code = mat.code || '';
        const matName = mat.materiau || 'Matériau';
        const fullName = epaisseur ? `${matName} ${epaisseur}` : matName;
        
        lines.push({ code, fullName, qtyDisplay });
        
        // Ajouter au total
        const key = code || fullName;
        if (!totalMateriaux[key]) {
          totalMateriaux[key] = { code, name: fullName, qty: 0 };
        }
        totalMateriaux[key].qty += qtyNeeded;
      });
    }
    
    columns.push({
      name: itemName,
      qty: totalQty,
      lines: lines,
      hasRecette: recette && recette.length > 0
    });
  });
  
  // Générer le HTML des colonnes (2 par rangée)
  let html = '';
  
  for (let i = 0; i < columns.length; i += 2) {
    const left = columns[i];
    const right = columns[i + 1];
    
    // Colonne gauche
    html += `<div class="cmd-materiaux-column">
      <div class="cmd-materiaux-header">${left.name} (×${left.qty || 0})</div>
      <div class="cmd-materiaux-list">`;
    
    if (left.hasRecette) {
      left.lines.forEach(line => {
        html += `<div class="cmd-materiaux-item">
          <span class="cmd-materiaux-code">${line.code}</span>
          <span class="cmd-materiaux-name">${line.fullName}</span>
          <span class="cmd-materiaux-qty">${line.qtyDisplay}</span>
        </div>`;
      });
    } else {
      html += '<div style="color:#f59e0b;font-size:8px;font-style:italic;text-align:center;padding:4px;">⚠ Pas de recette</div>';
    }
    
    html += '</div></div>';
    
    // Colonne droite (si existe)
    if (right) {
      html += `<div class="cmd-materiaux-column">
        <div class="cmd-materiaux-header">${right.name} (×${right.qty || 0})</div>
        <div class="cmd-materiaux-list">`;
      
      if (right.hasRecette) {
        right.lines.forEach(line => {
          html += `<div class="cmd-materiaux-item">
            <span class="cmd-materiaux-code">${line.code}</span>
            <span class="cmd-materiaux-name">${line.fullName}</span>
            <span class="cmd-materiaux-qty">${line.qtyDisplay}</span>
          </div>`;
        });
      } else {
        html += '<div style="color:#f59e0b;font-size:8px;font-style:italic;text-align:center;padding:4px;">⚠ Pas de recette</div>';
      }
      
      html += '</div></div>';
    }
  }
  
  container.innerHTML = html;
  
  // Générer le HTML du Total Matériaux
  const totalKeys = Object.keys(totalMateriaux);
  let totalHtml = '';
  
  if (totalKeys.length > 0) {
    totalHtml = `
      <div class="cmd-materiaux-total">
        <div class="cmd-materiaux-total-header">📦 TOTAL MATÉRIAUX</div>
        <div class="cmd-materiaux-total-list">
    `;
    
    totalKeys.forEach(key => {
      const mat = totalMateriaux[key];
      const qtyDisplay = mat.qty % 1 === 0 ? mat.qty : mat.qty.toFixed(1);
      totalHtml += `
        <div class="cmd-materiaux-total-item">
          <span class="code">${mat.code || ''}</span>
          <span class="name">${mat.name}</span>
          <span class="qty">${qtyDisplay}</span>
        </div>
      `;
    });
    
    totalHtml += '</div></div>';
  }
  
  // Mettre à jour la section Total Matériaux
  if (totalContainer) {
    totalContainer.innerHTML = totalHtml;
  }
}

// Initialiser les commandes
// ===== GESTION DES RECETTES =====
let recettesPopupOverlay = null;

function openRecettesInfo() {
  openRecettesPopup();
}

function openRecettesPopup() {
  // Fermer si déjà ouvert
  if (recettesPopupOverlay) recettesPopupOverlay.remove();
  
  // Fusionner les recettes par défaut et personnalisées
  const allRecettes = {};
  Object.entries(CMD_RECETTES).forEach(([name, mats]) => {
    allRecettes[name] = { materiaux: JSON.parse(JSON.stringify(mats)), isDefault: true };
  });
  Object.entries(customRecettes).forEach(([name, mats]) => {
    allRecettes[name] = { materiaux: JSON.parse(JSON.stringify(mats)), isDefault: false };
  });
  
  recettesPopupOverlay = document.createElement('div');
  recettesPopupOverlay.id = 'recettesPopupOverlay';
  recettesPopupOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:35000;';
  recettesPopupOverlay.onclick = (e) => { if (e.target === recettesPopupOverlay) closeRecettesPopup(); };
  
  const popup = document.createElement('div');
  popup.style.cssText = 'background:white;border-radius:12px;width:95%;max-width:700px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;';
  
  popup.innerHTML = `
    <div style="background:linear-gradient(to bottom,#3f6eb8,#1d3560);color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:14px;">⚙ Gestion des Recettes</h3>
      <div style="display:flex;gap:8px;">
        <button onclick="addNewRecette()" style="padding:6px 12px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:11px;">+ Nouvelle Recette</button>
        <button onclick="closeRecettesPopup()" style="padding:6px 12px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:6px;cursor:pointer;font-size:11px;">Fermer</button>
      </div>
    </div>
    <div id="recettesListContainer" style="flex:1;overflow-y:auto;padding:12px;background:#f8fafc;">
      ${renderRecettesList(allRecettes)}
    </div>
  `;
  
  recettesPopupOverlay.appendChild(popup);
  document.body.appendChild(recettesPopupOverlay);
}

function renderRecettesList(allRecettes) {
  let html = '';
  
  Object.entries(allRecettes).sort((a,b) => a[0].localeCompare(b[0])).forEach(([itemName, data]) => {
    const safeItemName = itemName.replace(/'/g, "\\'");
    html += `
      <div class="recette-card" style="background:white;border:1px solid #d1d5db;border-radius:8px;margin-bottom:10px;overflow:hidden;">
        <div style="background:linear-gradient(to bottom,#e2e8f0,#cbd5e1);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;color:#1e3a5f;font-size:12px;">${itemName} ${data.isDefault ? '<span style="font-size:9px;color:#64748b;">(défaut)</span>' : '<span style="font-size:9px;color:#22c55e;">(personnalisée)</span>'}</span>
          <div style="display:flex;gap:4px;">
            <button onclick="addMateriauToRecette('${safeItemName}')" style="padding:3px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10px;">+ Matériau</button>
            <button onclick="renameRecette('${safeItemName}')" style="padding:3px 8px;background:#f59e0b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10px;">✏ Renommer</button>
            <button onclick="deleteRecette('${safeItemName}')" style="padding:3px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10px;">🗑</button>
          </div>
        </div>
        <div style="padding:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:4px;text-align:left;width:70px;border-bottom:1px solid #d1d5db;">Code</th>
                <th style="padding:4px;text-align:left;border-bottom:1px solid #d1d5db;">Matériau</th>
                <th style="padding:4px;text-align:left;width:60px;border-bottom:1px solid #d1d5db;">Épaisseur</th>
                <th style="padding:4px;text-align:center;width:40px;border-bottom:1px solid #d1d5db;">Qté</th>
                <th style="padding:4px;width:30px;border-bottom:1px solid #d1d5db;"></th>
              </tr>
            </thead>
            <tbody>
    `;
    
    data.materiaux.forEach((mat, idx) => {
      html += `
        <tr style="border-bottom:1px dotted #e5e7eb;">
          <td style="padding:3px;"><input type="text" value="${mat.code || ''}" onchange="updateRecetteMat('${safeItemName}',${idx},'code',this.value)" style="width:100%;padding:2px 4px;border:1px solid #d1d5db;border-radius:3px;font-size:10px;"></td>
          <td style="padding:3px;"><input type="text" value="${mat.materiau || ''}" onchange="updateRecetteMat('${safeItemName}',${idx},'materiau',this.value)" style="width:100%;padding:2px 4px;border:1px solid #d1d5db;border-radius:3px;font-size:10px;"></td>
          <td style="padding:3px;"><input type="text" value="${mat.epaisseur || ''}" onchange="updateRecetteMat('${safeItemName}',${idx},'epaisseur',this.value)" style="width:100%;padding:2px 4px;border:1px solid #d1d5db;border-radius:3px;font-size:10px;"></td>
          <td style="padding:3px;"><input type="number" value="${mat.qty || 1}" min="0.1" step="0.1" onchange="updateRecetteMat('${safeItemName}',${idx},'qty',parseFloat(this.value))" style="width:100%;padding:2px 4px;border:1px solid #d1d5db;border-radius:3px;font-size:10px;text-align:center;"></td>
          <td style="padding:3px;text-align:center;"><button onclick="deleteMateriauFromRecette('${safeItemName}',${idx})" style="background:#ef4444;color:white;border:none;border-radius:3px;cursor:pointer;padding:2px 6px;font-size:10px;">✕</button></td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
  
  if (Object.keys(allRecettes).length === 0) {
    html = '<div style="text-align:center;color:#64748b;padding:40px;">Aucune recette. Cliquez sur "+ Nouvelle Recette" pour commencer.</div>';
  }
  
  return html;
}

function refreshRecettesList() {
  const container = document.getElementById('recettesListContainer');
  if (!container) return;
  
  const allRecettes = {};
  Object.entries(CMD_RECETTES).forEach(([name, mats]) => {
    allRecettes[name] = { materiaux: JSON.parse(JSON.stringify(mats)), isDefault: true };
  });
  Object.entries(customRecettes).forEach(([name, mats]) => {
    allRecettes[name] = { materiaux: JSON.parse(JSON.stringify(mats)), isDefault: false };
  });
  
  container.innerHTML = renderRecettesList(allRecettes);
}

function closeRecettesPopup() {
  if (recettesPopupOverlay) {
    recettesPopupOverlay.remove();
    recettesPopupOverlay = null;
  }
  // Rafraîchir les matériaux si une fiche est ouverte
  if (currentCmdId) {
    updateMateriauxSection(currentCmdId);
  }
}

function addNewRecette() {
  const name = prompt('Nom de la nouvelle recette (ex: "HP2 Custom"):');
  if (!name || name.trim() === '') return;
  
  const cleanName = name.trim();
  if (CMD_RECETTES[cleanName] || customRecettes[cleanName]) {
    alert('Une recette avec ce nom existe déjà!');
    return;
  }
  
  // Créer une recette vide
  customRecettes[cleanName] = [
    { code: '', materiau: 'Nouveau matériau', qty: 1, epaisseur: '' }
  ];
  
  saveRecettesToFirebase();
  refreshRecettesList();
}

function renameRecette(oldName) {
  const newName = prompt('Nouveau nom pour la recette:', oldName);
  if (!newName || newName.trim() === '' || newName === oldName) return;
  
  const cleanNewName = newName.trim();
  if (CMD_RECETTES[cleanNewName] || customRecettes[cleanNewName]) {
    alert('Une recette avec ce nom existe déjà!');
    return;
  }
  
  // Copier la recette
  let recette = customRecettes[oldName] || CMD_RECETTES[oldName];
  if (!recette) return;
  
  recette = JSON.parse(JSON.stringify(recette));
  
  // Supprimer l'ancienne (si personnalisée)
  if (customRecettes[oldName]) {
    delete customRecettes[oldName];
  }
  
  // Créer la nouvelle
  customRecettes[cleanNewName] = recette;
  
  saveRecettesToFirebase();
  refreshRecettesList();
}

function deleteRecette(itemName) {
  if (!confirm(`Supprimer la recette "${itemName}"?`)) return;
  
  if (customRecettes[itemName]) {
    delete customRecettes[itemName];
    saveRecettesToFirebase();
    refreshRecettesList();
  } else if (CMD_RECETTES[itemName]) {
    // Pour les recettes par défaut, on les "masque" en créant une version vide
    customRecettes[itemName] = [];
    saveRecettesToFirebase();
    refreshRecettesList();
  }
}

function addMateriauToRecette(itemName) {
  // Récupérer ou créer la recette personnalisée
  if (!customRecettes[itemName]) {
    customRecettes[itemName] = JSON.parse(JSON.stringify(CMD_RECETTES[itemName] || []));
  }
  
  customRecettes[itemName].push({
    code: '',
    materiau: 'Nouveau matériau',
    qty: 1,
    epaisseur: ''
  });
  
  saveRecettesToFirebase();
  refreshRecettesList();
}

function deleteMateriauFromRecette(itemName, matIdx) {
  // Récupérer ou créer la recette personnalisée
  if (!customRecettes[itemName]) {
    customRecettes[itemName] = JSON.parse(JSON.stringify(CMD_RECETTES[itemName] || []));
  }
  
  if (customRecettes[itemName].length <= 1) {
    alert('Une recette doit avoir au moins un matériau. Supprimez la recette entière si nécessaire.');
    return;
  }
  
  customRecettes[itemName].splice(matIdx, 1);
  saveRecettesToFirebase();
  refreshRecettesList();
}

function updateRecetteMat(itemName, matIdx, field, value) {
  // Récupérer ou créer la recette personnalisée
  if (!customRecettes[itemName]) {
    customRecettes[itemName] = JSON.parse(JSON.stringify(CMD_RECETTES[itemName] || []));
  }
  
  if (customRecettes[itemName][matIdx]) {
    customRecettes[itemName][matIdx][field] = value;
    saveRecettesToFirebase();
  }
}

function saveRecettesToFirebase() {
  if (firebaseDb) {
    firebaseDb.ref('customRecettes').set(customRecettes)
      .then(() => console.log('Recettes sauvegardées'))
      .catch(e => console.error('Erreur sauvegarde recettes:', e));
  }
  // Aussi sauvegarder en localStorage comme backup
  try {
    localStorage.setItem('physipro_custom_recettes', JSON.stringify(customRecettes));
  } catch(e) {}
}

function loadRecettesFromFirebase() {
  // D'abord charger depuis localStorage
  try {
    const stored = localStorage.getItem('physipro_custom_recettes');
    if (stored) {
      customRecettes = JSON.parse(stored);
    }
  } catch(e) {}
  
  // Puis depuis Firebase (prioritaire)
  if (firebaseDb) {
    firebaseDb.ref('customRecettes').on('value', snap => {
      if (snap.val()) {
        customRecettes = snap.val();
        console.log('Recettes chargées:', Object.keys(customRecettes).length);
      }
    });
  }
}

// ===== IMPRESSION DES MATÉRIAUX =====
function printMateriaux(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  // Calculer les matériaux totaux
  const totalMateriaux = {};
  // Détails par item
  const itemsDetails = [];
  
  (cmd.items || []).forEach(item => {
    const itemName = item.name || 'Item';
    const recette = getRecetteForItem(itemName);
    const totalQty = (item.grandeurs || []).reduce((sum, g) => sum + (parseInt(g.qty) || 0), 0);
    
    const itemDetail = {
      name: itemName,
      qty: totalQty,
      materiaux: []
    };
    
    if (recette && recette.length > 0) {
      recette.forEach(mat => {
        const qtyNeeded = (parseFloat(mat.qty) || 1) * (totalQty || 1);
        const key = mat.code || mat.materiau;
        const fullName = mat.materiau + (mat.epaisseur ? ' ' + mat.epaisseur : '');
        
        // Ajouter au total
        if (!totalMateriaux[key]) {
          totalMateriaux[key] = { code: mat.code || '', name: fullName, qty: 0 };
        }
        totalMateriaux[key].qty += qtyNeeded;
        
        // Ajouter aux détails de l'item
        itemDetail.materiaux.push({
          code: mat.code || '',
          name: fullName,
          qty: qtyNeeded
        });
      });
    }
    
    if (itemDetail.materiaux.length > 0) {
      itemsDetails.push(itemDetail);
    }
  });
  
  // Créer la fenêtre d'impression
  let printHtml = `<!DOCTYPE html><html><head><title>Matériaux - ${cmd.order}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
      h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 18px; margin-bottom: 10px; }
      h2 { color: #1e3a5f; font-size: 14px; margin: 20px 0 8px 0; padding: 6px 10px; background: #e2e8f0; border-radius: 4px; }
      h3 { color: #374151; font-size: 12px; margin: 15px 0 5px 0; padding: 4px 8px; background: #f1f5f9; border-left: 3px solid #3b82f6; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
      th { background: #3b82f6; color: white; font-size: 11px; }
      .total-section { background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
      .total-section h2 { background: #3b82f6; color: white; margin: -12px -12px 12px -12px; padding: 10px; border-radius: 6px 6px 0 0; }
      .qty { font-weight: bold; color: #059669; text-align: right; font-size: 13px; }
      .item-section { page-break-inside: avoid; margin-bottom: 15px; }
      .info { color: #64748b; margin-bottom: 15px; }
      @media print { body { padding: 10px; } }
    </style>
  </head><body>
    <h1>📦 Liste Matériaux - Commande #${cmd.order}</h1>
    <p class="info"><strong>Client:</strong> ${cmd.client} | <strong>Date livraison:</strong> ${cmd.dateLivraison || 'N/A'} | <strong>Imprimé:</strong> ${new Date().toLocaleString('fr-CA')}</p>
    
    <!-- TOTAL DES MATÉRIAUX EN HAUT -->
    <div class="total-section">
      <h2>📋 TOTAL MATÉRIAUX À PRÉPARER</h2>
      <table>
        <thead><tr><th style="width:80px;">Code</th><th>Matériau</th><th style="width:60px;">Quantité</th></tr></thead>
        <tbody>`;
  
  Object.values(totalMateriaux).forEach(mat => {
    const qtyDisplay = mat.qty % 1 === 0 ? mat.qty : mat.qty.toFixed(1);
    printHtml += `<tr><td><strong>${mat.code}</strong></td><td>${mat.name}</td><td class="qty">${qtyDisplay}</td></tr>`;
  });
  
  printHtml += `</tbody></table></div>
    
    <!-- DÉTAILS PAR ITEM -->
    <h2>📝 DÉTAILS PAR ITEM</h2>`;
  
  itemsDetails.forEach(item => {
    printHtml += `
      <div class="item-section">
        <h3>${item.name} (×${item.qty})</h3>
        <table>
          <thead><tr><th style="width:80px;">Code</th><th>Matériau</th><th style="width:60px;">Quantité</th></tr></thead>
          <tbody>`;
    
    item.materiaux.forEach(mat => {
      const qtyDisplay = mat.qty % 1 === 0 ? mat.qty : mat.qty.toFixed(1);
      printHtml += `<tr><td>${mat.code}</td><td>${mat.name}</td><td class="qty">${qtyDisplay}</td></tr>`;
    });
    
    printHtml += `</tbody></table></div>`;
  });
  
  printHtml += `</body></html>`;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHtml);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

function initCommandes() {
  // Charger les recettes personnalisées
  loadRecettesFromFirebase();
  
  // D'abord essayer de charger depuis localStorage
  try {
    const stored = localStorage.getItem('physipro_commandes');
    if (stored) {
      const localData = JSON.parse(stored);
      if (localData && Object.keys(localData).length > 0) {
        // Fusionner avec commandesData existant (données de test)
        Object.keys(localData).forEach(key => {
          commandesData[key] = localData[key];
        });
        console.log('📦 Commandes chargées depuis localStorage:', Object.keys(localData).length);
      }
    }
  } catch(e) {
    console.error('Erreur chargement localStorage:', e);
  }
  
  // TOUJOURS afficher les cartes immédiatement avec les données locales
  renderCommandes();
  console.log('📦 Commandes affichées:', Object.keys(commandesData).length);
  
  // Si pas de Firebase, c'est terminé
  if (!firebaseDb) {
    return;
  }
  
  // Avec Firebase - écouter les changements (mise à jour en arrière-plan)
  firebaseDb.ref('commandes').on('value', snapshot => {
    const firebaseData = snapshot.val();
    
    if (firebaseData && Object.keys(firebaseData).length > 0) {
      // Firebase a des données - les fusionner (Firebase a priorité)
      Object.keys(firebaseData).forEach(key => {
        commandesData[key] = firebaseData[key];
      });
      // Nettoyer les notes corrompues
      cleanCorruptedNotes(commandesData, 'commandes');
      console.log('☁️ Commandes Firebase chargées:', Object.keys(firebaseData).length);
      
      // Sauvegarder tout en localStorage
      saveCommandesToLocalStorage();
      // Re-rendre avec les données Firebase
      renderCommandes();
    }
  }, error => {
    console.warn('⚠️ Firebase commandes non disponible:', error.message);
    // Les cartes sont déjà affichées depuis localStorage, pas besoin de faire plus
  });
}

// Sauvegarder les commandes en localStorage
function saveCommandesToLocalStorage() {
  try {
    localStorage.setItem('physipro_commandes', JSON.stringify(commandesData));
  } catch(e) {
    console.error('Erreur sauvegarde localStorage:', e);
  }
}

// Rendre le board de commandes
function renderCommandes() {
  CMD_CLIENTS.forEach(client => {
    const col = document.getElementById('col' + client);
    if (col) col.innerHTML = '';
  });
  
  const sorted = Object.entries(commandesData).sort((a, b) => {
    const posA = a[1].position ?? 999;
    const posB = b[1].position ?? 999;
    return posA - posB;
  });
  
  sorted.forEach(([cmdId, cmd]) => {
    const col = document.getElementById('col' + (cmd.client || 'Vermeiren'));
    if (col) {
      col.appendChild(createCmdCard(cmdId, cmd));
    }
  });
  
  updateCmdCounts();
  
  // Rafraîchir les cartes Série+ si on est sur cette page
  if (document.getElementById('serieCardsList') && typeof renderSerieCards === 'function') {
    renderSerieCards();
  }
}

// Créer une carte commande
// Jours fériés Québec
const JOURS_FERIES = [
  '2024-01-01', '2024-03-29', '2024-05-20', '2024-06-24', '2024-07-01', '2024-09-02', '2024-10-14', '2024-12-25', '2024-12-26',
  '2025-01-01', '2025-04-18', '2025-05-19', '2025-06-24', '2025-07-01', '2025-09-01', '2025-10-13', '2025-12-25', '2025-12-26',
  '2026-01-01', '2026-04-03', '2026-05-18', '2026-06-24', '2026-07-01', '2026-09-07', '2026-10-12', '2026-12-25', '2026-12-26'
];

function isJourFerie(date) {
  const dateStr = date.toISOString().split('T')[0];
  return JOURS_FERIES.includes(dateStr);
}

function isJourOuvrable(date) {
  const jour = date.getDay();
  if (jour === 0 || jour === 6) return false;
  if (isJourFerie(date)) return false;
  return true;
}

function calculerJoursOuvrables(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return null;
  
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);
  
  let jours = 0;
  const current = new Date(aujourdHui);
  
  if (fin < aujourdHui) {
    while (current > fin) {
      current.setDate(current.getDate() - 1);
      if (isJourOuvrable(current)) jours--;
    }
  } else {
    while (current < fin) {
      current.setDate(current.getDate() + 1);
      if (isJourOuvrable(current)) jours++;
    }
  }
  
  return jours;
}

function createCmdCard(cmdId, data) {
  const card = document.createElement('div');
  card.className = `cmd-card client-${(data.client || 'vermeiren').toLowerCase()}`;
  card.setAttribute('data-cmd-id', cmdId);
  
  // Calculer délai en JOURS OUVRABLES
  let delayText = '-- jours ouvrables';
  let delayClass = '';
  
  const hasValidDateLivraison = data.dateLivraison && data.dateLivraison !== '' && data.dateLivraison !== 'AAAA-MM-JJ';
  
  if (hasValidDateLivraison) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const livraison = new Date(data.dateLivraison);
    livraison.setHours(0, 0, 0, 0);
    
    if (livraison < today) {
      const joursRetard = Math.abs(calculerJoursOuvrables(livraison, today));
      delayText = `${joursRetard} jour${joursRetard > 1 ? 's' : ''} retard`;
      delayClass = 'delai-retard';
    } else if (livraison.getTime() === today.getTime()) {
      delayText = "Aujourd'hui!";
      delayClass = 'delai-retard';
    } else {
      const joursRestants = calculerJoursOuvrables(today, livraison);
      delayText = `${joursRestants} jour${joursRestants > 1 ? 's' : ''} ouvrable${joursRestants > 1 ? 's' : ''}`;
      
      if (joursRestants <= 3) delayClass = 'delai-rouge';
      else if (joursRestants <= 10) delayClass = 'delai-jaune';
      else delayClass = 'delai-vert';
    }
  }
  
  // Structure IDENTIQUE à l'ancien fichier
  card.innerHTML = `
    <div class="cmd-card-header">
      <div class="cmd-card-info">
        <div class="cmd-card-title-line">
          <div class="cmd-card-client">${data.client || 'Client'}</div>
        </div>
        <div class="cmd-card-order-line">
          <input type="text" class="cmd-card-order" value="${data.order || '000000'}" maxlength="6">
          <button class="cmd-card-fiche-btn" onclick="event.stopPropagation(); openCmdFiche('${cmdId}')">Fiche</button>
        </div>
      </div>
    </div>
    <div class="cmd-card-separator"></div>
    <div class="cmd-card-delay ${delayClass}"><span>${delayText}</span></div>
    <div class="cmd-card-footer">
      <button class="cmd-card-btn btn-move" onclick="event.stopPropagation(); openCmdRangMenu('${cmdId}', this)">Rang</button>
      <button class="cmd-card-btn btn-delete" onclick="event.stopPropagation(); confirmDeleteCmd('${cmdId}')">Supprimer</button>
    </div>
  `;
  
  // Event listener pour édition du numéro de commande
  const orderInput = card.querySelector('.cmd-card-order');
  orderInput.addEventListener('blur', () => {
    commandesData[cmdId].order = orderInput.value;
    saveCommandeToFirebase(cmdId);
  });
  
  return card;
}

// Menu de rang pour commandes
function openCmdRangMenu(cmdId, btn) {
  // Fermer tout menu existant
  document.querySelectorAll('.cmd-rang-menu').forEach(m => m.remove());
  
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  const client = cmd.client;
  const col = document.getElementById('col' + client);
  if (!col) return;
  
  // Compter les cartes dans la colonne
  const cardsInCol = Object.entries(commandesData)
    .filter(([id, c]) => c.client === client)
    .sort((a, b) => (a[1].position ?? 999) - (b[1].position ?? 999));
  
  const currentPos = cardsInCol.findIndex(([id]) => id === cmdId) + 1;
  const totalCards = cardsInCol.length;
  
  // Créer le menu
  const menu = document.createElement('div');
  menu.className = 'cmd-rang-menu';
  menu.style.cssText = 'position:fixed;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:20000;padding:10px;min-width:150px;';
  
  const rect = btn.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + 5) + 'px';
  
  menu.innerHTML = `
    <div style="font-weight:700;color:#1e3a5f;margin-bottom:8px;font-size:12px;">Rang: ${currentPos} / ${totalCards}</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      <button onclick="moveCmdToRang('${cmdId}', 1)" style="padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">⬆ Premier</button>
      <button onclick="moveCmdToRang('${cmdId}', ${currentPos - 1})" style="padding:6px 12px;background:#64748b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;" ${currentPos <= 1 ? 'disabled' : ''}>↑ Monter</button>
      <button onclick="moveCmdToRang('${cmdId}', ${currentPos + 1})" style="padding:6px 12px;background:#64748b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;" ${currentPos >= totalCards ? 'disabled' : ''}>↓ Descendre</button>
      <button onclick="moveCmdToRang('${cmdId}', ${totalCards})" style="padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">⬇ Dernier</button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Fermer au clic ailleurs
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// Déplacer une commande à un rang spécifique
function moveCmdToRang(cmdId, newRang) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  const client = cmd.client;
  
  // Obtenir toutes les cartes de cette colonne
  const cardsInCol = Object.entries(commandesData)
    .filter(([id, c]) => c.client === client)
    .sort((a, b) => (a[1].position ?? 999) - (b[1].position ?? 999));
  
  // Retirer la carte actuelle
  const currentIdx = cardsInCol.findIndex(([id]) => id === cmdId);
  if (currentIdx === -1) return;
  
  const [removed] = cardsInCol.splice(currentIdx, 1);
  
  // Insérer à la nouvelle position
  const newIdx = Math.max(0, Math.min(newRang - 1, cardsInCol.length));
  cardsInCol.splice(newIdx, 0, removed);
  
  // Mettre à jour les positions
  cardsInCol.forEach(([id, c], idx) => {
    commandesData[id].position = idx;
  });
  
  // Sauvegarder et rafraîchir
  Object.keys(commandesData).forEach(id => saveCommandeToFirebase(id));
  renderCommandes();
  
  // Fermer le menu
  document.querySelectorAll('.cmd-rang-menu').forEach(m => m.remove());
  showToast('Position mise à jour');
}

// Mettre à jour les compteurs
function updateCmdCounts() {
  CMD_CLIENTS.forEach(client => {
    const col = document.getElementById('col' + client);
    const countEl = document.getElementById('count' + client);
    if (col && countEl) {
      countEl.textContent = col.querySelectorAll('.cmd-card').length;
    }
  });
}

// Ouvrir la fiche commande
function openCmdFiche(cmdId) {
  currentCmdId = cmdId;
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  if (!cmd.items) cmd.items = [];
  
  const overlay = document.getElementById('cmdFicheOverlay');
  const content = document.getElementById('cmdFicheContent');
  
  let delaiHtml = renderCmdDelai(cmd);
  
  content.innerHTML = `
    <div class="cmd-fiche-header">
      <div class="cmd-fiche-header-left">
        <div class="cmd-fiche-logo">
          <img src="https://raw.githubusercontent.com/Physipro-list/Physipro-serie/main/logo-physiprodemi1.png" alt="PhysiPro"/>
        </div>
        <button class="cmd-create-inv-btn-header" id="createInvBtnHeader_${cmdId}" onclick="createInventoryFromSelection('${cmdId}')" disabled>
          📦 Créer dans Inventaire (<span id="selectCountHeader_${cmdId}">0</span>)
        </button>
        ${currentUser?.role === 'admin' ? `<button class="cmd-goto-inv-btn" onclick="closeCmdFiche(); switchToPage('inventaire');">📦 Inventaire</button>` : ''}
      </div>
      <div class="cmd-fiche-header-center">
        <div class="cmd-fiche-order">#${cmd.order || '000000'}</div>
        <div class="cmd-fiche-client">${cmd.client || ''}</div>
      </div>
      <div class="cmd-fiche-tabs">
        <button class="cmd-fiche-tab tab-info active" id="tabInfo" onclick="switchCmdTab('info')">📋 Info / Magasin</button>
        <button class="cmd-fiche-tab tab-tableau" id="tabTableau" onclick="switchCmdTab('tableau')">📊 Tableau</button>
      </div>
      <button class="cmd-fiche-close" onclick="closeCmdFiche()">✕</button>
    </div>
    
    <div class="cmd-fiche-body">
      <!-- VUE INFO -->
      <div class="cmd-view-info active" id="viewInfo">
        <div class="cmd-panel cmd-panel-info">
          <div class="cmd-panel-header">📋 Information</div>
          <div class="cmd-panel-body">
            <div class="cmd-info-row">
              <div class="cmd-info-field">
                <label>Client</label>
                <select id="cfClient" onchange="updateCmdField('client', this.value)">
                  ${CMD_CLIENTS.map(c => `<option value="${c}" ${cmd.client === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="cmd-info-field">
                <label>N° Commande</label>
                <input type="text" id="cfOrder" value="${cmd.order || ''}" onblur="updateCmdField('order', this.value)" maxlength="10">
              </div>
            </div>
            
            <div class="cmd-info-row">
              <div class="cmd-info-field">
                <label>N° PO</label>
                <input type="text" id="cfPO" value="${cmd.numeroPO || ''}" onblur="updateCmdField('numeroPO', this.value)">
              </div>
              <div class="cmd-info-field">
                <label>N° Soumission</label>
                <input type="text" id="cfSoumission" value="${cmd.numeroSoumission || ''}" onblur="updateCmdField('numeroSoumission', this.value)">
              </div>
            </div>
            
            <div class="cmd-info-row">
              <div class="cmd-info-field">
                <label>Date reçue</label>
                <div class="cmd-date-pill" id="cfDateRecue" onclick="openCmdCalendar('dateRecue', this)">${cmd.dateRecue || 'Sélectionner...'}</div>
              </div>
              <div class="cmd-info-field">
                <label>Date livraison</label>
                <div class="cmd-date-pill" id="cfDateLiv" onclick="openCmdCalendar('dateLivraison', this)">${cmd.dateLivraison || 'Sélectionner...'}</div>
              </div>
            </div>
            
            <div id="cmdDelaiDisplay">${delaiHtml}</div>
            
            <div class="cmd-notes-section">
              <label>Notes</label>
              <div class="cmd-notes-content" id="cfNotes" contenteditable="true" 
                   onfocus="handleStandardNoteClick('cfNotes', () => updateCmdField('notes', document.getElementById('cfNotes').innerHTML))"
                   onblur="updateCmdField('notes', this.innerHTML)">${cmd.notes || ''}</div>
            </div>
          </div>
        </div>
        
        <!-- PANNEAU MAGASIN (droite) -->
        <div class="cmd-panel cmd-panel-magasin" style="display: flex; flex-direction: column;">
          <div class="cmd-panel-header" style="display: flex; align-items: center; gap: 8px;">
            <span>📦 Magasin</span>
            <div style="display: flex; gap: 4px; margin-left: auto;">
              <button class="cmd-recettes-btn" onclick="openRecettesInfo()">⚙ Recettes</button>
              <button onclick="printMateriaux('${cmdId}')" style="font-size: 8px; padding: 3px 8px; background: linear-gradient(to bottom, #3b82f6, #2563eb); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">🖨 Imprimer</button>
            </div>
          </div>
          <!-- Total Matériaux - EN HAUT juste après le header -->
          <div class="cmd-materiaux-total-section-top" id="cmdMateriauxTotalTop">
            <!-- Généré par updateMateriauxSection -->
          </div>
          <!-- Zone scrollable pour les recettes -->
          <div class="cmd-panel-body" style="flex: 1; overflow-y: auto; padding: 8px;">
            <div class="cmd-materiaux-container" id="cmdMateriauxContainer">
              <!-- Les colonnes seront générées dynamiquement par item -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- VUE TABLEAU -->
      <div class="cmd-view-tableau" id="viewTableau">
        <div class="cmd-tableau-body">
          <div class="cmd-items-list" id="atelierItemsList">
            ${renderDeptItems(cmd.items, cmdId)}
          </div>
        </div>
      </div>
    </div>
    
    <div class="cmd-fiche-footer">
      <button class="cmd-fiche-btn btn-close" onclick="closeCmdFiche()">Fermer</button>
    </div>
  `;
  
  overlay.classList.add('active');
  
  // Mettre à jour les matériaux automatiquement
  setTimeout(() => updateMateriauxSection(cmdId), 100);
}

// Rendre le délai grand format
function renderCmdDelai(cmd) {
  if (!cmd.dateLivraison || cmd.dateLivraison === 'AAAA-MM-JJ') {
    return '<div class="cmd-delai-big" style="background:#f1f5f9;color:#64748b;"><div class="cmd-delai-big-jours">--</div><div class="cmd-delai-big-label">jours</div></div>';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const livraison = new Date(cmd.dateLivraison);
  livraison.setHours(0, 0, 0, 0);
  
  const diff = Math.ceil((livraison - today) / (1000 * 60 * 60 * 24));
  let delaiClass = '';
  let label = 'jours restants';
  
  if (diff < 0) {
    delaiClass = 'delai-retard';
    label = 'jours de retard';
  } else if (diff <= 5) {
    delaiClass = 'delai-rouge';
  } else if (diff <= 10) {
    delaiClass = 'delai-jaune';
  } else {
    delaiClass = 'delai-vert';
  }
  
  const dateStr = livraison.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div class="cmd-delai-big ${delaiClass}">
      <div class="cmd-delai-big-jours">${Math.abs(diff)}</div>
      <div class="cmd-delai-big-label">${label}</div>
      <div class="cmd-delai-big-date">📅 ${dateStr}</div>
    </div>
  `;
}

// Calendrier pour commandes
let cmdCalendarField = null;
let cmdCalendarElement = null;
let cmdCalendarDate = new Date();

function openCmdCalendar(field, element) {
  cmdCalendarField = field;
  cmdCalendarElement = element;
  
  // Date actuelle ou sélectionnée
  const currentValue = commandesData[currentCmdId]?.[field];
  
  showCalendar({
    mode: 'modal',
    value: currentValue || '',
    onSelect: (dateStr) => {
      if (!currentCmdId || !cmdCalendarField) return;
      commandesData[currentCmdId][cmdCalendarField] = dateStr;
      saveCommandeToFirebase(currentCmdId);
      if (cmdCalendarElement) {
        cmdCalendarElement.textContent = dateStr || 'Sélectionner...';
      }
      if (cmdCalendarField === 'dateLivraison') {
        updateCmdDelaiDisplay();
      }
    },
    onClear: () => {
      if (!currentCmdId || !cmdCalendarField) return;
      commandesData[currentCmdId][cmdCalendarField] = '';
      saveCommandeToFirebase(currentCmdId);
      if (cmdCalendarElement) {
        cmdCalendarElement.textContent = 'Sélectionner...';
      }
      if (cmdCalendarField === 'dateLivraison') {
        updateCmdDelaiDisplay();
      }
    }
  });
}

function updateCmdDelaiDisplay() {
  if (!currentCmdId || !commandesData[currentCmdId]) return;
  const display = document.getElementById('cmdDelaiDisplay');
  if (display) {
    display.innerHTML = renderCmdDelai(commandesData[currentCmdId]);
  }
}

// ===== TABLEAU À 3 SECTIONS =====
function renderDeptItems(items, cmdId) {
  const cmd = commandesData[cmdId] || {};
  
  // Structure compacte - colonnes réduites
  let html = `
    <table class="cmd-items-table">
      <colgroup>
        <col style="width: 12px;">
        <col style="width: 48px;">
        <col style="width: 22px;">
        <col style="width: 44px;">
        <col style="width: 30px;">
        <col style="width: 42px;">
        <col style="width: 28px;">
        <col style="width: 48px;">
        <col style="width: 22px;">
        <col style="width: 30px;">
        <col style="width: 42px;">
        <col style="width: 48px;">
        <col style="width: 28px;">
        <col style="width: 48px;">
        <col style="width: 22px;">
        <col style="width: 30px;">
        <col style="width: 42px;">
        <col style="width: 78px;">
        <col style="width: 28px;">
        <col style="width: 14px;">
      </colgroup>
      <thead>
        <tr>
          <th class="section-header atelier" colspan="7">Atelier</th>
          <th class="section-header couture" colspan="6">Couture</th>
          <th class="section-header" colspan="7">Inspection</th>
        </tr>
        <tr>
          <th class="cmd-col-header cmd-col-plus"></th>
          <th class="cmd-col-header cmd-col-item"><button class="cmd-table-add-item-green" onclick="addCmdItemDept('${cmdId}')">+ Item</button></th>
          <th class="cmd-col-header cmd-col-qty">Qté</th>
          <th class="cmd-col-header cmd-col-prod">Prod</th>
          <th class="cmd-col-header cmd-col-total">Fait</th>
          <th class="cmd-col-header cmd-col-status">Insp.</th>
          <th class="cmd-col-header cmd-col-notes border-right-solid">Notes</th>
          <th class="cmd-col-header cmd-col-item">Item</th>
          <th class="cmd-col-header cmd-col-qty">Qté</th>
          <th class="cmd-col-header cmd-col-total">Fait</th>
          <th class="cmd-col-header cmd-col-status">Status</th>
          <th class="cmd-col-header cmd-col-emp">Emp.</th>
          <th class="cmd-col-header cmd-col-notes border-right-solid">Notes</th>
          <th class="cmd-col-header cmd-col-item">Item</th>
          <th class="cmd-col-header cmd-col-qty">Qté</th>
          <th class="cmd-col-header cmd-col-total">Fait</th>
          <th class="cmd-col-header cmd-col-status">Status</th>
          <th class="cmd-col-header cmd-col-exped">Expédition</th>
          <th class="cmd-col-header cmd-col-notes">Notes</th>
          <th class="cmd-col-header cmd-col-x"></th>
        </tr>
      </thead>
      <tbody>
  `;
  
  if (!items || items.length === 0) {
    html += `<tr><td colspan="20" style="text-align:center;color:#9ca3af;padding:10px;font-size:8px;">Aucun item - Cliquez sur "+ Item" pour ajouter</td></tr>`;
  } else {
    items.forEach((item, itemIdx) => {
      const grandeurs = item.grandeurs || [];
      
      // Calculer totaux pour l'item
      let totalQty = 0;
      let totalFait = 0;
      grandeurs.forEach(g => { 
        totalQty += parseInt(g.qty) || 0;
        totalFait += (g.atelier && g.atelier.qtyFait) || 0;
      });
      
      // Pastille status pour l'item entier
      let itemStatusClass = 'total-todo';
      let itemStatusText = '';
      if (totalFait >= totalQty && totalQty > 0) {
        itemStatusClass = 'total-done';
        itemStatusText = 'Complet';
      } else if (totalFait > 0) {
        itemStatusClass = 'total-partial';
        itemStatusText = `${totalFait}/${totalQty}`;
      }
      
      html += `
        <tr class="item-row">
          <td class="cmd-col-plus"><button class="cmd-table-add-grandeur" onclick="addCmdGrandeurDept('${cmdId}', ${itemIdx})">+</button></td>
          <td class="cmd-col-item"><button class="cmd-table-item-pill" onclick="openCmdItemMenu('${cmdId}', ${itemIdx}, event)">${item.name || 'Item'}</button></td>
          <td class="cmd-col-qty"><span class="cmd-table-item-qty">${totalQty}</span></td>
          <td class="cmd-col-prod"></td>
          <td class="cmd-col-total">${itemStatusText ? `<div class="cmd-table-fait-container ${itemStatusClass}"><span class="cmd-table-item-status-text">${itemStatusText}</span></div>` : ''}</td>
          <td class="cmd-col-status"></td>
          <td class="cmd-col-notes border-right-solid"></td>
          <td class="cmd-col-item"><span class="cmd-table-item-name">${item.name || 'Item'}</span></td>
          <td class="cmd-col-qty"><span class="cmd-table-item-qty">${totalQty}</span></td>
          <td class="cmd-col-total"></td>
          <td class="cmd-col-status"></td>
          <td class="cmd-col-emp"></td>
          <td class="cmd-col-notes border-right-solid"></td>
          <td class="cmd-col-item"><span class="cmd-table-item-name">${item.name || 'Item'}</span></td>
          <td class="cmd-col-qty"><span class="cmd-table-item-qty">${totalQty}</span></td>
          <td class="cmd-col-total"></td>
          <td class="cmd-col-status"></td>
          <td class="cmd-col-exped"></td>
          <td class="cmd-col-notes"></td>
          <td class="cmd-col-x"><span class="cmd-table-delete-text" onclick="deleteCmdItemDept('${cmdId}', ${itemIdx})">−</span></td>
        </tr>
      `;
      
      grandeurs.forEach((g, gIdx) => {
        const qtyTotal = g.qty || 0;
        
        const atelierData = g.atelier || { status: 'todo', note: '', qtyFait: 0, inspected: false };
        const atelierQtyFait = atelierData.qtyFait || 0;
        const atelierNoteClass = atelierData.note ? 'cmd-table-notes has-note' : 'cmd-table-notes';
        
        // Couleur du total Atelier: vert si complet, jaune si partiel
        let atelierTotalClass = 'total-todo';
        if (atelierQtyFait >= qtyTotal && qtyTotal > 0) {
          atelierTotalClass = 'total-done';
        } else if (atelierQtyFait > 0) {
          atelierTotalClass = 'total-partial';
        }
        
        // Switch inspection Atelier
        const atelierInspected = atelierData.inspected || false;
        const atelierSwitchClass = atelierInspected ? 'switch-inspected' : 'switch-pending';
        const atelierSwitchText = atelierInspected ? 'Inspecté' : 'À inspecter';
        
        const coutureData = g.couture || { status: 'todo', note: '', qtyFait: 0, employe: '' };
        const coutureStatusClass = coutureData.status === 'done' ? 'done' : (coutureData.status === 'partial' ? 'partial' : 'todo');
        const coutureStatusText = coutureData.status === 'done' ? 'Complet' : (coutureData.status === 'partial' ? 'Partiel' : 'À faire');
        const coutureQtyFait = coutureData.qtyFait || 0;
        const coutureNoteClass = coutureData.note ? 'cmd-table-notes has-note' : 'cmd-table-notes';
        
        const inspData = g.inspection || { status: 'todo', note: '', qtyFait: 0, exped: 'attente' };
        const inspStatusClass = inspData.status === 'done' ? 'done' : (inspData.status === 'partial' ? 'partial' : 'todo');
        const inspStatusText = inspData.status === 'done' ? 'Emboîté' : (inspData.status === 'partial' ? 'Partiel' : 'À faire');
        const inspQtyFait = inspData.qtyFait || 0;
        const inspNoteClass = inspData.note ? 'cmd-table-notes has-note' : 'cmd-table-notes';
        const inspExped = inspData.exped || 'attente';
        
        const expedOption = EXPEDITION_OPTIONS.find(o => o.value === inspExped) || { label: inspExped, blink: false, color: '' };
        let inspExpedClass = '';
        if (expedOption.blink) inspExpedClass = 'blink-green';
        else if (expedOption.color === 'yellow') inspExpedClass = 'yellow-bg';
        else if (inspExped === 'expedie') inspExpedClass = 'expedie';
        
        // Vérifier le statut inventaire pour cette grandeur
        const invStatus = getInventoryStatusForGrandeur(cmdId, cmd.order, cmd.client, item.name, g.name);
        let prodBadgeHtml = '';
        let checkboxHtml = '';
        
        // Vérifier si complet (permanent avec nom)
        const isComplete = atelierQtyFait >= qtyTotal && qtyTotal > 0;
        const completedBy = atelierData.completedBy || '';
        
        if (isComplete && completedBy) {
          // Complet - Vert permanent avec nom de la personne
          prodBadgeHtml = `<span class="cmd-prod-name prod-complete">${completedBy}</span>`;
          checkboxHtml = '';
        } else if (invStatus) {
          // Job existe dans inventaire
          if (invStatus.status === 'afaire') {
            // Dans le bassin - Blanc "À faire"
            prodBadgeHtml = `<span class="cmd-prod-name prod-afaire">Distribué</span>`;
          } else if (invStatus.status === 'assigne') {
            // Assigné à un employé - Jaune (vide)
            prodBadgeHtml = `<span class="cmd-prod-name prod-partial"></span>`;
          }
          // Checkbox cachée (job déjà créée)
          checkboxHtml = '';
        } else {
          // Pas de job - afficher checkbox sous le +
          checkboxHtml = `<input type="checkbox" class="cmd-inv-checkbox" data-cmd="${cmdId}" data-item="${itemIdx}" data-grandeur="${gIdx}" data-itemname="${item.name || ''}" data-gname="${g.name || ''}" data-qty="${qtyTotal}" onchange="updateSelectionCount('${cmdId}')">`;
        }
        
        html += `
          <tr class="grandeur-row">
            <td class="cmd-col-plus">${checkboxHtml}</td>
            <td class="cmd-col-item"><button class="cmd-table-grandeur-pill" onclick="openCmdGrandeurMenu('${cmdId}', ${itemIdx}, ${gIdx}, event)">${g.name || 'Grandeur'}</button></td>
            <td class="cmd-col-qty"><input type="text" class="cmd-table-qty-input" value="${qtyTotal}" maxlength="3" onfocus="this.select()" oninput="this.value=this.value.replace(/[^0-9]/g,'')" onchange="updateCmdGrandeurQty('${cmdId}', ${itemIdx}, ${gIdx}, this.value)"></td>
            <td class="cmd-col-prod">${prodBadgeHtml}</td>
            <td class="cmd-col-total"><div class="cmd-table-fait-container ${atelierTotalClass}"><span class="cmd-table-fait-num">${atelierQtyFait}</span><span class="cmd-table-fait-separator">/</span><span class="cmd-table-fait-total">${qtyTotal}</span></div></td>
            <td class="cmd-col-status"><button class="cmd-atelier-switch ${atelierSwitchClass}" onclick="toggleAtelierInspection('${cmdId}', ${itemIdx}, ${gIdx})" ${atelierQtyFait < qtyTotal ? 'disabled title="Compléter la fabrication d\'abord"' : ''}>${atelierSwitchText}</button></td>
            <td class="cmd-col-notes border-right-solid"><button class="${atelierNoteClass}" onclick="openCmdGrandeurNoteDept('${cmdId}', ${itemIdx}, ${gIdx}, 'atelier', event)">Notes</button></td>
            <td class="cmd-col-item"><span class="cmd-table-grandeur-readonly">${g.name || 'Grandeur'}</span></td>
            <td class="cmd-col-qty"><span class="cmd-table-qty-readonly">${qtyTotal}</span></td>
            <td class="cmd-col-total"><div class="cmd-table-fait-container"><input type="text" class="cmd-table-fait-input-top" value="${coutureQtyFait}" maxlength="3" onfocus="this.select()" oninput="limitQtyInputText(this, ${qtyTotal})" onchange="updateCmdQtyFait('${cmdId}', ${itemIdx}, ${gIdx}, 'couture', this.value)"><span class="cmd-table-fait-separator">/</span><span class="cmd-table-fait-total">${qtyTotal}</span></div></td>
            <td class="cmd-col-status"><button class="cmd-table-status ${coutureStatusClass}">${coutureStatusText}</button></td>
            <td class="cmd-col-emp">
              <select class="cmd-table-emp-select" onchange="handleCmdEmployeSelect(this, '${cmdId}', ${itemIdx}, ${gIdx}, 'couture')">
                <option value="">Emp.</option>
                ${EMPLOYES_COUTURE.map(emp => `<option value="${emp}" ${coutureData.employe === emp ? 'selected' : ''}>${emp}</option>`).join('')}
                <option value="__ADD__">➕</option>
                <option value="__REMOVE__">➖</option>
              </select>
            </td>
            <td class="cmd-col-notes border-right-solid"><button class="${coutureNoteClass}" onclick="openCmdGrandeurNoteDept('${cmdId}', ${itemIdx}, ${gIdx}, 'couture', event)">Notes</button></td>
            <td class="cmd-col-item"><span class="cmd-table-grandeur-readonly">${g.name || 'Grandeur'}</span></td>
            <td class="cmd-col-qty"><span class="cmd-table-qty-readonly">${qtyTotal}</span></td>
            <td class="cmd-col-total"><div class="cmd-table-fait-container"><input type="text" class="cmd-table-fait-input-top" value="${inspQtyFait}" maxlength="3" onfocus="this.select()" oninput="limitQtyInputText(this, ${qtyTotal})" onchange="updateCmdQtyFait('${cmdId}', ${itemIdx}, ${gIdx}, 'inspection', this.value)"><span class="cmd-table-fait-separator">/</span><span class="cmd-table-fait-total">${qtyTotal}</span></div></td>
            <td class="cmd-col-status"><button class="cmd-table-status ${inspStatusClass}">${inspStatusText}</button></td>
            <td class="cmd-col-exped">
              <select class="cmd-table-exped-select ${inspExpedClass}" onchange="handleCmdExpedSelect(this, '${cmdId}', ${itemIdx}, ${gIdx})">
                ${EXPEDITION_OPTIONS.map(opt => `<option value="${opt.value}" ${inspExped === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                <option value="__ADD__">➕</option>
                <option value="__REMOVE__">➖</option>
              </select>
            </td>
            <td class="cmd-col-notes"><button class="${inspNoteClass}" onclick="openCmdGrandeurNoteDept('${cmdId}', ${itemIdx}, ${gIdx}, 'inspection', event)">Notes</button></td>
            <td class="cmd-col-x"><span class="cmd-table-delete-text" onclick="deleteCmdGrandeurDept('${cmdId}', ${itemIdx}, ${gIdx})">−</span></td>
          </tr>
        `;
      });
    });
  }
  
  html += `</tbody></table>`;
  
  // Ajouter juste le compteur de sélection
  html += `
    <div class="cmd-tableau-actions">
      <span class="cmd-select-count" id="selectCount_${cmdId}"><strong>0</strong> grandeur(s) sélectionnée(s)</span>
    </div>
  `;
  
  return html;
}

// ===== SYSTÈME CRÉATION JOBS INVENTAIRE =====

// Stocker les données de sélection pour le modal
let currentSplitJobData = null;

// Mettre à jour le compteur de sélection
function updateSelectionCount(cmdId) {
  // Chercher les checkboxes dans le tableau (overlay ou Série+)
  let checkboxes = document.querySelectorAll(`.cmd-inv-checkbox[data-cmd="${cmdId}"]:checked`);
  
  // Si on est sur Série+, chercher aussi dans serieItemsList
  const serieItemsList = document.getElementById('serieItemsList');
  if (serieItemsList && currentSerieCommandeId === cmdId) {
    checkboxes = serieItemsList.querySelectorAll('.cmd-inv-checkbox:checked');
  }
  
  const count = checkboxes.length;
  
  // Mettre à jour le compteur dans le tableau (overlay)
  const countEl = document.getElementById(`selectCount_${cmdId}`);
  if (countEl) {
    countEl.innerHTML = `<strong>${count}</strong> grandeur(s) sélectionnée(s)`;
  }
  
  // Mettre à jour le bouton dans le tableau (overlay)
  const btnEl = document.getElementById(`createInvBtn_${cmdId}`);
  if (btnEl) {
    btnEl.disabled = count === 0;
  }
  
  // Mettre à jour le bouton dans le header (overlay)
  const headerCountEl = document.getElementById(`selectCountHeader_${cmdId}`);
  if (headerCountEl) {
    headerCountEl.textContent = count;
  }
  
  const headerBtnEl = document.getElementById(`createInvBtnHeader_${cmdId}`);
  if (headerBtnEl) {
    headerBtnEl.disabled = count === 0;
  }
  
  // Mettre à jour les éléments Série+
  const serieCountEl = document.getElementById('serieSelectCount');
  if (serieCountEl) {
    serieCountEl.textContent = count;
  }
  
  const serieBtnEl = document.getElementById('serieCreateInvBtn');
  if (serieBtnEl) {
    serieBtnEl.disabled = count === 0;
  }
}

// Toggle toutes les grandeurs
function toggleAllGrandeurs(cmdId, checked) {
  const checkboxes = document.querySelectorAll(`.cmd-inv-checkbox[data-cmd="${cmdId}"]`);
  checkboxes.forEach(cb => {
    if (!cb.id?.includes('CheckAll')) {
      cb.checked = checked;
    }
  });
  updateSelectionCount(cmdId);
}

// Ouvrir le modal de création/split
function createInventoryFromSelection(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  const checkboxes = document.querySelectorAll(`.cmd-inv-checkbox[data-cmd="${cmdId}"]:checked`);
  if (checkboxes.length === 0) {
    showToast('⚠️ Sélectionnez au moins une grandeur');
    return;
  }
  
  let createdCount = 0;
  
  // Créer directement dans le bassin "À faire" (rang='main')
  checkboxes.forEach(cb => {
    const itemIdx = parseInt(cb.dataset.item);
    const grandeurIdx = parseInt(cb.dataset.grandeur);
    const itemName = cb.dataset.itemname;
    const grandeurName = cb.dataset.gname;
    const qty = parseInt(cb.dataset.qty) || 0;
    
    if (qty > 0) {
      // Convertir le client en minuscules pour les classes CSS
      const clientLower = (cmd.client || '').toLowerCase();
      
      // Créer l'item inventaire dans le bassin
      const invId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const invItem = {
        nom: itemName,
        code: '',
        commande: cmd.order || '',
        client: clientLower,
        grandeur: grandeurName,
        quantite: qty,
        rang: 'main', // Bassin "À faire"
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Lien vers Série+
        linkedCmd: cmdId,
        linkedItemIdx: itemIdx,
        linkedGrandeurIdx: grandeurIdx
      };
      
      inventaireData[invId] = invItem;
      
      // Sauvegarder dans Firebase
      if (firebaseDb) {
        firebaseDb.ref('inventaire/' + invId).set(invItem);
      }
      
      createdCount++;
    }
  });
  
  // Rafraîchir l'affichage inventaire
  renderInventaireCubes();
  
  // Rafraîchir le tableau Série+ pour cacher les checkboxes
  refreshCmdDeptTables(cmdId);
  
  showToast(`✅ ${createdCount} job(s) créé(s) dans le bassin!`);
  
  // Décocher toutes les checkboxes
  document.querySelectorAll('.cmd-inv-checkbox:checked').forEach(cb => {
    cb.checked = false;
  });
  
  // Mettre à jour le compteur
  updateSelectionCount(cmdId);
}

// Rendu du modal de split
function renderSplitJobModal() {
  const content = document.getElementById('splitJobContent');
  if (!content || !currentSplitJobData) return;
  
  let html = '';
  
  currentSplitJobData.forEach((sel, selIdx) => {
    html += `
      <div class="split-job-item">
        <div class="split-job-item-header">
          <span class="split-job-item-name">${sel.itemName || 'Item'}</span>
          <span class="split-job-item-grandeur">${sel.grandeurName || 'Grandeur'}</span>
          <span class="split-job-item-qty">Qté totale: ${sel.qty}</span>
        </div>
        <div class="split-job-assignments" id="splitAssignments_${selIdx}">
          ${renderSplitAssignments(selIdx, sel.assignments, sel.qty)}
        </div>
        <button class="split-job-add-split" onclick="addSplitAssignment(${selIdx})">+ Splitter (ajouter une personne)</button>
      </div>
    `;
  });
  
  content.innerHTML = html;
}

// Rendu des assignations pour un item
function renderSplitAssignments(selIdx, assignments, maxQty) {
  let html = '';
  assignments.forEach((a, aIdx) => {
    html += `
      <div class="split-job-assignment">
        <select onchange="updateSplitAssignee(${selIdx}, ${aIdx}, this.value)">
          <option value="pablo" ${a.assignee === 'pablo' ? 'selected' : ''}>👤 Pablo</option>
          <option value="checkna" ${a.assignee === 'checkna' ? 'selected' : ''}>👤 Checkna</option>
          <option value="saul" ${a.assignee === 'saul' ? 'selected' : ''}>👤 Saul</option>
          <option value="mathieu" ${a.assignee === 'mathieu' ? 'selected' : ''}>👤 Mathieu</option>
          <option value="nestor" ${a.assignee === 'nestor' ? 'selected' : ''}>👤 Nestor</option>
          <option value="serge" ${a.assignee === 'serge' ? 'selected' : ''}>👤 Serge</option>
        </select>
        <input type="number" value="${a.qty}" min="1" max="${maxQty}" 
               onchange="updateSplitQty(${selIdx}, ${aIdx}, this.value)">
        ${assignments.length > 1 ? `<button class="split-job-remove" onclick="removeSplitAssignment(${selIdx}, ${aIdx})">✕</button>` : ''}
      </div>
    `;
  });
  return html;
}

// Ajouter un split
function addSplitAssignment(selIdx) {
  if (!currentSplitJobData[selIdx]) return;
  
  const sel = currentSplitJobData[selIdx];
  const currentTotal = sel.assignments.reduce((sum, a) => sum + a.qty, 0);
  const remaining = sel.qty - currentTotal;
  
  if (remaining <= 0) {
    // Diviser la dernière quantité
    const lastAssign = sel.assignments[sel.assignments.length - 1];
    if (lastAssign.qty > 1) {
      const half = Math.floor(lastAssign.qty / 2);
      lastAssign.qty = lastAssign.qty - half;
      sel.assignments.push({ assignee: 'checkna', qty: half });
    } else {
      showToast('⚠️ Quantité trop petite pour splitter');
      return;
    }
  } else {
    sel.assignments.push({ assignee: 'checkna', qty: remaining });
  }
  
  renderSplitJobModal();
}

// Supprimer un split
function removeSplitAssignment(selIdx, aIdx) {
  if (!currentSplitJobData[selIdx]) return;
  
  const removed = currentSplitJobData[selIdx].assignments.splice(aIdx, 1)[0];
  
  // Ajouter la quantité au premier
  if (currentSplitJobData[selIdx].assignments.length > 0) {
    currentSplitJobData[selIdx].assignments[0].qty += removed.qty;
  }
  
  renderSplitJobModal();
}

// Mettre à jour l'assignee
function updateSplitAssignee(selIdx, aIdx, value) {
  if (currentSplitJobData[selIdx]?.assignments[aIdx]) {
    currentSplitJobData[selIdx].assignments[aIdx].assignee = value;
  }
}

// Mettre à jour la quantité
function updateSplitQty(selIdx, aIdx, value) {
  if (currentSplitJobData[selIdx]?.assignments[aIdx]) {
    currentSplitJobData[selIdx].assignments[aIdx].qty = parseInt(value) || 1;
  }
}

// Fermer le modal
function closeSplitJobModal() {
  document.getElementById('splitJobOverlay')?.classList.add('hidden');
  currentSplitJobData = null;
}

// Créer les jobs dans l'inventaire
function executeCreateJobs() {
  if (!currentSplitJobData || currentSplitJobData.length === 0) {
    closeSplitJobModal();
    return;
  }
  
  let createdCount = 0;
  
  currentSplitJobData.forEach(sel => {
    sel.assignments.forEach(assign => {
      if (assign.qty > 0) {
        // Trouver la prochaine position disponible pour cet assignee
        const existingItems = Object.values(inventaireData)
          .filter(item => item.rang === assign.assignee);
        const maxPos = existingItems.reduce((max, item) => Math.max(max, item.position || 0), 0);
        const newPos = maxPos + 1;
        
        // Créer l'item inventaire
        const invId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const invItem = {
          nom: sel.itemName,
          code: '',
          commande: sel.order,
          client: sel.client,
          grandeur: sel.grandeurName,
          quantite: assign.qty,
          rang: assign.assignee,
          position: newPos,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Lien vers Série+
          linkedCmd: sel.cmdId,
          linkedItemIdx: sel.itemIdx,
          linkedGrandeurIdx: sel.grandeurIdx
        };
        
        inventaireData[invId] = invItem;
        
        // Sauvegarder dans Firebase
        if (firebaseDb) {
          firebaseDb.ref('inventaire/' + invId).set(invItem);
        }
        
        createdCount++;
      }
    });
  });
  
  // Rafraîchir l'affichage
  renderInventaireCubes();
  
  // Rafraîchir le tableau Série+ pour montrer les badges
  if (currentSplitJobData[0]?.cmdId) {
    refreshCmdDeptTables(currentSplitJobData[0].cmdId);
  }
  
  // Fermer et confirmer
  closeSplitJobModal();
  showToast(`✅ ${createdCount} job(s) créé(s) dans l'inventaire!`);
  
  // Décocher toutes les checkboxes
  document.querySelectorAll('.cmd-inv-checkbox:checked').forEach(cb => {
    cb.checked = false;
  });
  
  // Mettre à jour le compteur
  if (currentSplitJobData[0]?.cmdId) {
    updateSelectionCount(currentSplitJobData[0].cmdId);
  }
}

// Obtenir le statut inventaire pour une grandeur (pour affichage dans le tableau)
function getInventoryStatusForGrandeur(cmdId, order, client, itemName, grandeurName) {
  if (!order || !itemName || !grandeurName) return null;
  
  // Map des noms d'employés
  const empNames = {
    pablo: 'Pablo',
    checkna: 'Checkna',
    saul: 'Saul',
    mathieu: 'Mathieu',
    nestor: 'Nestor',
    serge: 'Serge',
    main: 'À faire'
  };
  
  // Chercher un item inventaire correspondant
  for (const [id, item] of Object.entries(inventaireData)) {
    if (item.commande === order && 
        item.client === client &&
        (item.nom || '').toLowerCase() === (itemName || '').toLowerCase() &&
        item.grandeur === grandeurName) {
      
      const rang = item.rang || 'main';
      const position = item.position || 0;
      
      if (rang === 'main') {
        // Dans le bassin "À faire" - pastille blanche
        return {
          id: id,
          status: 'afaire',
          assignee: '',
          position: 0,
          qty: item.quantite || 0
        };
      } else {
        // Assigné à un employé - pastille jaune (pas de nom affiché)
        return {
          id: id,
          status: 'assigne',
          assignee: empNames[rang] || rang,
          position: position,
          qty: item.quantite || 0
        };
      }
    }
  }
  
  return null;
}

// Exposer les fonctions globalement
window.updateSelectionCount = updateSelectionCount;
window.toggleAllGrandeurs = toggleAllGrandeurs;
window.createInventoryFromSelection = createInventoryFromSelection;
window.closeSplitJobModal = closeSplitJobModal;
window.executeCreateJobs = executeCreateJobs;
window.addSplitAssignment = addSplitAssignment;
window.removeSplitAssignment = removeSplitAssignment;
window.updateSplitAssignee = updateSplitAssignee;
window.updateSplitQty = updateSplitQty;
window.getInventoryStatusForGrandeur = getInventoryStatusForGrandeur;

// ===== FONCTIONS TABLEAU =====
function addCmdItemDept(cmdId) {
  if (!commandesData[cmdId].items) commandesData[cmdId].items = [];
  commandesData[cmdId].items.push({ name: '', grandeurs: [] });
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function deleteCmdItemDept(cmdId, itemIdx) {
  commandesData[cmdId].items.splice(itemIdx, 1);
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function addCmdGrandeurDept(cmdId, itemIdx) {
  if (!commandesData[cmdId].items[itemIdx].grandeurs) {
    commandesData[cmdId].items[itemIdx].grandeurs = [];
  }
  commandesData[cmdId].items[itemIdx].grandeurs.push({ 
    name: '', 
    qty: 0,
    atelier: { status: 'todo', note: '', qtyFait: 0 },
    couture: { status: 'todo', note: '', qtyFait: 0, employe: '' },
    inspection: { status: 'todo', note: '', qtyFait: 0, exped: 'attente' }
  });
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function deleteCmdGrandeurDept(cmdId, itemIdx, gIdx) {
  commandesData[cmdId].items[itemIdx].grandeurs.splice(gIdx, 1);
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function updateCmdGrandeurQty(cmdId, itemIdx, gIdx, value) {
  commandesData[cmdId].items[itemIdx].grandeurs[gIdx].qty = parseInt(value) || 0;
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function limitQtyInputText(input, maxQty) {
  input.value = input.value.replace(/[^0-9]/g, '');
  let val = parseInt(input.value) || 0;
  if (val > maxQty) input.value = maxQty;
}

function updateCmdQtyFait(cmdId, itemIdx, gIdx, dept, value) {
  const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
  
  // Préserver les données existantes (notamment completedBy)
  if (!g[dept]) {
    g[dept] = { status: 'todo', note: '', qtyFait: 0 };
  }
  
  const qtyFait = parseInt(value) || 0;
  const qtyTotal = parseInt(g.qty) || 0;
  
  // Préserver completedBy si existant
  const existingCompletedBy = g[dept].completedBy;
  
  g[dept].qtyFait = Math.min(qtyFait, qtyTotal);
  
  if (g[dept].qtyFait === 0) g[dept].status = 'todo';
  else if (g[dept].qtyFait >= qtyTotal) g[dept].status = 'done';
  else g[dept].status = 'partial';
  
  // Restaurer completedBy si c'était présent
  if (existingCompletedBy) {
    g[dept].completedBy = existingCompletedBy;
  }
  
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
}

function refreshCmdDeptTables(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  // Sur la page Série+, utiliser les éléments Série
  const serieItemsList = document.getElementById('serieItemsList');
  if (serieItemsList && currentSerieCommandeId === cmdId) {
    serieItemsList.innerHTML = renderDeptItems(cmd.items, cmdId);
    
    // Mettre à jour les matériaux avec les bons conteneurs
    const serieMateriauxContainer = document.getElementById('serieMateriauxContainer');
    const serieMateriauxTotalTop = document.getElementById('serieMateriauxTotalTop');
    
    if (serieMateriauxContainer) {
      // Temporairement assigner les IDs pour que updateMateriauxSection fonctionne
      const origContainer = document.getElementById('cmdMateriauxContainer');
      const origTotal = document.getElementById('cmdMateriauxTotalTop');
      
      serieMateriauxContainer.id = 'cmdMateriauxContainer';
      if (serieMateriauxTotalTop) serieMateriauxTotalTop.id = 'cmdMateriauxTotalTop';
      
      updateMateriauxSection(cmdId);
      
      // Restaurer les IDs
      serieMateriauxContainer.id = 'serieMateriauxContainer';
      if (serieMateriauxTotalTop) serieMateriauxTotalTop.id = 'serieMateriauxTotalTop';
    }
    
    // Mettre à jour les barres de progression des cartes
    updateSerieCardProgress();
    return;
  }
  
  // Sinon, utiliser la fonction originale pour l'overlay
  const atelierList = document.getElementById('atelierItemsList');
  if (atelierList) atelierList.innerHTML = renderDeptItems(cmd.items, cmdId);
  updateMateriauxSection(cmdId);
}

function updateSerieCardProgress() {
  const cards = document.querySelectorAll('.serie-card');
  const sorted = Object.keys(commandesData).sort((a, b) => {
    const posA = commandesData[a].position ?? 999;
    const posB = commandesData[b].position ?? 999;
    return posA - posB;
  });
  
  cards.forEach((card, idx) => {
    const cardCmdId = sorted[idx];
    if (cardCmdId && commandesData[cardCmdId]) {
      const cardCmd = commandesData[cardCmdId];
      const items = cardCmd.items || [];
      let totalGrandeurs = 0;
      let completedGrandeurs = 0;
      items.forEach(item => {
        (item.grandeurs || []).forEach(g => {
          totalGrandeurs++;
          if (g.inspection && g.inspection.exped === 'expedie') completedGrandeurs++;
        });
      });
      const progressPct = totalGrandeurs > 0 ? Math.round((completedGrandeurs / totalGrandeurs) * 100) : 0;
      
      const progressBar = card.querySelector('.serie-card-progress-bar');
      if (progressBar) {
        progressBar.style.width = progressPct + '%';
        progressBar.style.background = progressPct === 100 ? '#22c55e' : '#fff';
      }
    }
  });
}

// Toggle inspection Atelier (switch rouge/vert)
function toggleAtelierInspection(cmdId, itemIdx, gIdx) {
  const cmd = commandesData[cmdId];
  if (!cmd || !cmd.items || !cmd.items[itemIdx] || !cmd.items[itemIdx].grandeurs) return;
  
  const grandeur = cmd.items[itemIdx].grandeurs[gIdx];
  if (!grandeur) return;
  
  if (!grandeur.atelier) {
    grandeur.atelier = { status: 'todo', note: '', qtyFait: 0, inspected: false };
  }
  
  // Toggle
  grandeur.atelier.inspected = !grandeur.atelier.inspected;
  
  // Si inspecté et qtyFait >= qty, marquer comme done
  const qtyTotal = grandeur.qty || 0;
  const qtyFait = grandeur.atelier.qtyFait || 0;
  
  if (grandeur.atelier.inspected && qtyFait >= qtyTotal) {
    grandeur.atelier.status = 'done';
    showToast('✅ Inspection validée!');
  } else if (grandeur.atelier.inspected) {
    showToast('✅ Marqué comme inspecté');
  } else {
    grandeur.atelier.status = qtyFait > 0 ? 'partial' : 'todo';
    showToast('↩️ Inspection annulée');
  }
  
  // Sauvegarder
  saveCommandeToFirebase(cmdId);
  refreshCmdDeptTables(cmdId);
}

// Exposer la fonction
window.toggleAtelierInspection = toggleAtelierInspection;

// ===== MENUS DE SÉLECTION =====
function closeCmdSelectMenu() {
  const existing = document.querySelector('.cmd-select-menu');
  if (existing) existing.remove();
}

function openCmdItemMenu(cmdId, itemIdx, event) {
  event.stopPropagation();
  closeCmdSelectMenu();
  
  const rect = event.target.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'cmd-select-menu';
  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + 2) + 'px';
  
  menu.innerHTML = `
    <div class="cmd-select-title">Item commande</div>
    ${CMD_ITEM_VALUES.map(val => `
      <button class="cmd-select-option" onclick="selectCmdItem('${cmdId}', ${itemIdx}, '${val}')">${val}</button>
    `).join('')}
  `;
  
  document.body.appendChild(menu);
  setTimeout(() => { document.addEventListener('click', closeCmdSelectMenu, { once: true }); }, 10);
}

function selectCmdItem(cmdId, itemIdx, value) {
  commandesData[cmdId].items[itemIdx].name = value;
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
  closeCmdSelectMenu();
}

function openCmdGrandeurMenu(cmdId, itemIdx, gIdx, event) {
  event.stopPropagation();
  closeCmdSelectMenu();
  
  const menu = document.createElement('div');
  menu.className = 'cmd-select-menu';
  menu.style.left = ((window.innerWidth - 150) / 2) + 'px';
  menu.style.top = ((window.innerHeight - 200) / 2) + 'px';
  
  menu.innerHTML = `
    <div class="cmd-select-title">Grandeur</div>
    ${CMD_GRANDEUR_VALUES.map(val => `
      <button class="cmd-select-option" onclick="selectCmdGrandeur('${cmdId}', ${itemIdx}, ${gIdx}, '${val}')">${val}</button>
    `).join('')}
  `;
  
  document.body.appendChild(menu);
  setTimeout(() => { document.addEventListener('click', closeCmdSelectMenu, { once: true }); }, 10);
}

function selectCmdGrandeur(cmdId, itemIdx, gIdx, value) {
  commandesData[cmdId].items[itemIdx].grandeurs[gIdx].name = value;
  refreshCmdDeptTables(cmdId);
  saveCommandeToFirebase(cmdId);
  closeCmdSelectMenu();
}

// ===== NOTES =====
function closeCmdGrandeurNote() {
  const popup = document.getElementById('cmdMiniNotePopup');
  if (popup) popup.remove();
}

function openCmdGrandeurNoteDept(cmdId, itemIdx, gIdx, dept, event) {
  closeCmdGrandeurNote();
  
  const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
  if (!g[dept]) g[dept] = { status: 'todo', note: '', qtyFait: 0 };
  
  const popup = document.createElement('div');
  popup.className = 'cmd-mini-note-popup';
  popup.id = 'cmdMiniNotePopup';
  
  popup.innerHTML = `
    <textarea id="cmdMiniNoteText">${g[dept].note || ''}</textarea>
    <div class="mini-note-btns">
      <button class="save-btn" onclick="saveCmdGrandeurNoteDept('${cmdId}', ${itemIdx}, ${gIdx}, '${dept}')">OK</button>
      <button class="close-btn" onclick="closeCmdGrandeurNote()">✕</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  popup.style.left = ((window.innerWidth - 180) / 2) + 'px';
  popup.style.top = ((window.innerHeight - 100) / 2) + 'px';
}

function saveCmdGrandeurNoteDept(cmdId, itemIdx, gIdx, dept) {
  const textarea = document.getElementById('cmdMiniNoteText');
  if (textarea) {
    const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
    if (!g[dept]) g[dept] = { status: 'todo', note: '', qtyFait: 0 };
    g[dept].note = textarea.value;
    saveCommandeToFirebase(cmdId);
    refreshCmdDeptTables(cmdId);
  }
  closeCmdGrandeurNote();
}

// ===== EMPLOYÉS =====
function handleCmdEmployeSelect(selectEl, cmdId, itemIdx, gIdx, dept) {
  const value = selectEl.value;
  
  if (value === '__ADD__') {
    const newEmp = prompt('Nom du nouvel employé:');
    if (newEmp && newEmp.trim()) {
      const empName = newEmp.trim();
      if (!EMPLOYES_COUTURE.includes(empName)) {
        EMPLOYES_COUTURE.push(empName);
      }
      const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
      if (!g[dept]) g[dept] = { status: 'todo', note: '', qtyFait: 0, employe: '' };
      g[dept].employe = empName;
      saveCommandeToFirebase(cmdId);
      refreshCmdDeptTables(cmdId);
    } else {
      const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
      selectEl.value = g[dept]?.employe || '';
    }
  } else if (value === '__REMOVE__') {
    const empList = EMPLOYES_COUTURE.map((e, i) => `${i + 1}. ${e}`).join('\n');
    const choice = prompt(`Supprimer quel employé?\n${empList}\n\nNuméro:`);
    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < EMPLOYES_COUTURE.length) {
        EMPLOYES_COUTURE.splice(index, 1);
        refreshCmdDeptTables(cmdId);
      }
    }
    const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
    selectEl.value = g.couture?.employe || '';
  } else {
    const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
    if (!g[dept]) g[dept] = { status: 'todo', note: '', qtyFait: 0, employe: '' };
    g[dept].employe = value;
    saveCommandeToFirebase(cmdId);
  }
}

// ===== EXPÉDITION =====
function handleCmdExpedSelect(selectEl, cmdId, itemIdx, gIdx) {
  const value = selectEl.value;
  
  if (value === '__ADD__') {
    const newLabel = prompt('Nom de la nouvelle option:');
    if (newLabel && newLabel.trim()) {
      const optValue = newLabel.trim().toLowerCase().replace(/\s+/g, '_');
      const blink = confirm('Cette option doit-elle clignoter en vert?');
      let color = '';
      if (!blink) {
        const isYellow = confirm('Cette option doit-elle être jaune?');
        if (isYellow) color = 'yellow';
      }
      EXPEDITION_OPTIONS.push({ value: optValue, label: newLabel.trim(), blink, color });
      const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
      if (!g.inspection) g.inspection = { status: 'todo', note: '', qtyFait: 0, exped: 'attente' };
      g.inspection.exped = optValue;
      saveCommandeToFirebase(cmdId);
      refreshCmdDeptTables(cmdId);
    } else {
      const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
      selectEl.value = g.inspection?.exped || 'attente';
    }
  } else if (value === '__REMOVE__') {
    const optList = EXPEDITION_OPTIONS.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
    const choice = prompt(`Supprimer quelle option?\n${optList}\n\nNuméro:`);
    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < EXPEDITION_OPTIONS.length) {
        EXPEDITION_OPTIONS.splice(index, 1);
        refreshCmdDeptTables(cmdId);
      }
    }
    const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
    selectEl.value = g.inspection?.exped || 'attente';
  } else {
    const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
    if (!g.inspection) g.inspection = { status: 'todo', note: '', qtyFait: 0, exped: 'attente' };
    g.inspection.exped = value;
    saveCommandeToFirebase(cmdId);
    
    const expedOption = EXPEDITION_OPTIONS.find(o => o.value === value) || {};
    selectEl.className = 'cmd-table-exped-select';
    if (expedOption.blink) selectEl.classList.add('blink-green');
    else if (expedOption.color === 'yellow') selectEl.classList.add('yellow-bg');
    else if (value === 'expedie') selectEl.classList.add('expedie');
  }
}

// ===== AUTRES FONCTIONS =====
function switchCmdTab(tab) {
  const tabInfo = document.getElementById('tabInfo');
  const tabTableau = document.getElementById('tabTableau');
  const viewInfo = document.getElementById('viewInfo');
  const viewTableau = document.getElementById('viewTableau');
  
  if (tab === 'info') {
    tabInfo.classList.add('active');
    tabTableau.classList.remove('active');
    viewInfo.classList.add('active');
    viewTableau.classList.remove('active');
    // Rafraîchir les matériaux quand on revient sur Info/Magasin
    if (currentCmdId) {
      setTimeout(() => updateMateriauxSection(currentCmdId), 50);
    }
  } else {
    tabInfo.classList.remove('active');
    tabTableau.classList.add('active');
    viewInfo.classList.remove('active');
    viewTableau.classList.add('active');
  }
}

function closeCmdFiche() {
  // Sauvegarder avant de fermer
  if (currentCmdId && commandesData[currentCmdId]) {
    saveCommandeToFirebase(currentCmdId);
  }
  document.getElementById('cmdFicheOverlay').classList.remove('active');
  currentCmdId = null;
  renderCommandes();
}

function updateCmdField(field, value) {
  if (!currentCmdId || !commandesData[currentCmdId]) return;
  commandesData[currentCmdId][field] = value;
  commandesData[currentCmdId].updatedAt = new Date().toISOString();
  saveCommandeToFirebase(currentCmdId);
  
  // Mettre à jour l'en-tête de la fiche en temps réel
  if (field === 'order') {
    const orderEl = document.querySelector('.cmd-fiche-order');
    if (orderEl) orderEl.textContent = '#' + (value || '000000');
  }
  if (field === 'client') {
    const clientEl = document.querySelector('.cmd-fiche-client');
    if (clientEl) clientEl.textContent = value || '';
  }
  
  // Rafraîchir la carte dans le board Série+
  renderCommandes();
}

function saveCommandeToFirebase(cmdId) {
  if (!commandesData[cmdId]) return;
  
  // Toujours sauvegarder en localStorage
  saveCommandesToLocalStorage();
  
  // Si Firebase disponible, sauvegarder aussi là
  if (firebaseDb) {
    firebaseDb.ref('commandes/' + cmdId).set(commandesData[cmdId])
      .then(() => console.log('✅ Commande sauvegardée:', cmdId))
      .catch(e => console.error('❌ Erreur Firebase:', e));
  }
}

function showCmdAddModal() {
  document.getElementById('cmdAddModal').classList.add('active');
  document.getElementById('cmdAddOrder').value = '';
  document.getElementById('cmdAddDesc').value = '';
  document.getElementById('cmdAddPO').value = '';
  document.getElementById('cmdAddDateLivraison').value = '';
  document.getElementById('cmdAddDateLivraisonDisplay').textContent = '-- Sélectionner --';
  // Focus sur le champ numéro de commande
  setTimeout(() => {
    document.getElementById('cmdAddOrder').focus();
  }, 100);
}

function closeCmdAddModal() {
  document.getElementById('cmdAddModal').classList.remove('active');
}

// Calendrier pour modal ajout commande
function openCmdAddCalendar(targetId) {
  const hiddenInput = document.getElementById(targetId);
  const currentValue = hiddenInput?.value || '';
  
  showCalendar({
    value: currentValue,
    mode: 'modal',
    onSelect: (dateStr) => {
      if (hiddenInput) hiddenInput.value = dateStr;
      const displayEl = document.getElementById(targetId + 'Display');
      if (displayEl) displayEl.textContent = formatDateFR(dateStr);
    },
    onClear: () => {
      if (hiddenInput) hiddenInput.value = '';
      const displayEl = document.getElementById(targetId + 'Display');
      if (displayEl) displayEl.textContent = '-- Sélectionner --';
    }
  });
}

function confirmAddCommande() {
  const client = document.getElementById('cmdAddClient').value;
  const order = document.getElementById('cmdAddOrder').value.trim();
  const desc = document.getElementById('cmdAddDesc').value.trim();
  const po = document.getElementById('cmdAddPO').value.trim();
  const dateLiv = document.getElementById('cmdAddDateLivraison').value;
  
  if (!order) {
    alert('Veuillez entrer un numéro de commande');
    return;
  }
  
  const cmdId = 'cmd_' + Date.now();
  const newCmd = {
    client: client,
    order: order,
    description: desc,
    numeroPO: po,
    dateLivraison: dateLiv,
    dateRecue: new Date().toLocaleDateString('fr-CA'),
    statut: 'En cours',
    notes: '',
    items: [],
    createdAt: new Date().toISOString(),
    position: Object.keys(commandesData).length
  };
  
  commandesData[cmdId] = newCmd;
  saveCommandeToFirebase(cmdId);
  renderCommandes();
  closeCmdAddModal();
  showToast('✅ Commande ajoutée');
  
  // Si on est sur la page Série+, rafraîchir les cartes et sélectionner la nouvelle commande
  if (document.getElementById('serieCardsList')) {
    renderSerieCards();
    selectSerieCommande(cmdId);
  }
}

function confirmDeleteCmd(cmdId) {
  const cmd = commandesData[cmdId];
  const name = cmd?.client || cmd?.numCommande || 'cette commande';
  
  // Utiliser le modal de confirmation existant
  document.getElementById('confirmMessage').textContent = `Voulez-vous vraiment supprimer "${name}"?`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
  
  // Configurer le bouton Oui
  document.getElementById('confirmYes').onclick = () => {
    document.getElementById('confirmOverlay').classList.add('hidden');
    deleteCmd(cmdId);
  };
  
  // Configurer le bouton Non
  document.getElementById('confirmNo').onclick = () => {
    document.getElementById('confirmOverlay').classList.add('hidden');
  };
}

function deleteCmd(cmdId) {
  // Supprimer des données locales
  delete commandesData[cmdId];
  
  // Sauvegarder en localStorage
  saveCommandesToLocalStorage();
  
  // Si Firebase disponible, supprimer aussi là
  if (firebaseDb) {
    firebaseDb.ref('commandes/' + cmdId).remove();
  }
  
  renderCommandes();
  showToast('Commande supprimée');
}

// Exposer fonctions commandes
window.initCommandes = initCommandes;
window.renderCommandes = renderCommandes;
window.openCmdFiche = openCmdFiche;
window.closeCmdFiche = closeCmdFiche;
window.showCmdAddModal = showCmdAddModal;
window.closeCmdAddModal = closeCmdAddModal;
window.openCmdCalendar = openCmdCalendar;
window.confirmAddCommande = confirmAddCommande;
window.confirmDeleteCmd = confirmDeleteCmd;
window.updateCmdField = updateCmdField;
window.switchCmdTab = switchCmdTab;
window.addCmdItemDept = addCmdItemDept;
window.deleteCmdItemDept = deleteCmdItemDept;
window.addCmdGrandeurDept = addCmdGrandeurDept;
window.deleteCmdGrandeurDept = deleteCmdGrandeurDept;
window.updateCmdGrandeurQty = updateCmdGrandeurQty;
window.updateCmdQtyFait = updateCmdQtyFait;
window.limitQtyInputText = limitQtyInputText;
window.openCmdItemMenu = openCmdItemMenu;
window.selectCmdItem = selectCmdItem;
window.openCmdGrandeurMenu = openCmdGrandeurMenu;
window.selectCmdGrandeur = selectCmdGrandeur;
window.openCmdGrandeurNoteDept = openCmdGrandeurNoteDept;
window.saveCmdGrandeurNoteDept = saveCmdGrandeurNoteDept;
window.closeCmdGrandeurNote = closeCmdGrandeurNote;
window.handleCmdEmployeSelect = handleCmdEmployeSelect;
window.handleCmdExpedSelect = handleCmdExpedSelect;
window.refreshCmdDeptTables = refreshCmdDeptTables;
window.saveCommandeToFirebase = saveCommandeToFirebase;
window.deleteCmd = deleteCmd;
window.openRecettesPopup = openRecettesPopup;
window.closeRecettesPopup = closeRecettesPopup;
window.addNewRecette = addNewRecette;
window.renameRecette = renameRecette;
window.deleteRecette = deleteRecette;
window.addMateriauToRecette = addMateriauToRecette;
window.deleteMateriauFromRecette = deleteMateriauFromRecette;
window.updateRecetteMat = updateRecetteMat;
window.printMateriaux = printMateriaux;
window.updateMateriauxSection = updateMateriauxSection;
window.openCmdRangMenu = openCmdRangMenu;
window.moveCmdToRang = moveCmdToRang;
window.openCmdAddCalendar = openCmdAddCalendar;
