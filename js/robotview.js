// ===== MENUS CONTEXTUELS UNIFIÉS (Délai / Raison Attente / Expédition) =====
let isRobotViewActive = false;

// Ferme tous les menus contextuels
function closeContextMenus() {
  document.getElementById('contextMenu')?.remove();
}

// Positionne un menu près d'un élément
function positionMenu(menu, anchor, preferLeft = false) {
  const rect = anchor.getBoundingClientRect();
  const menuW = menu.offsetWidth || 250;
  const menuH = menu.offsetHeight || 300;
  
  if (preferLeft) {
    menu.style.left = Math.max(10, rect.left - menuW - 10) + 'px';
    menu.style.top = Math.max(10, Math.min(rect.top, window.innerHeight - menuH - 10)) + 'px';
  } else {
    menu.style.left = Math.min(rect.left, window.innerWidth - menuW - 10) + 'px';
    menu.style.top = Math.min(rect.bottom + 5, window.innerHeight - menuH - 10) + 'px';
  }
}

// Met à jour une carte après modification
function refreshCard(cardId) {
  const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
  if (card && cardsData[cardId]) {
    updateExistingCard(card, cardId, cardsData[cardId]);
  }
}

// Menu principal - dispatch selon la colonne
function openDelaiMenu(cardId, event) {
  event.stopPropagation();
  event.preventDefault();
  closeContextMenus();
  
  const cardData = cardsData[cardId];
  if (!cardData) return;
  
  // Colonne 7 (En attente) → Menu raison
  if (cardData.columnIndex === 7) {
    showRaisonMenu(cardId, event);
    return;
  }
  
  // Colonne 6 (Expédition) → Menu expédier
  if (cardData.columnIndex === 6) {
    showExpeditionMenu(cardId, event);
    return;
  }
  
  // Colonnes 0-5 → Menu délai régional
  showDelaiMenu(cardId, event);
}

// Menu Expédition (colonne 6)
function showExpeditionMenu(cardId, event) {
  const menu = document.createElement('div');
  menu.id = 'contextMenu';
  menu.className = 'ctx-menu';
  menu.onclick = e => e.stopPropagation();
  
  menu.innerHTML = `
    <div class="ctx-header">📦 Expédition</div>
    <div class="ctx-body">
      <button class="ctx-btn primary" onclick="marquerExpedie('${cardId}')">📦 Marquer comme Expédié</button>
    </div>
    <div class="ctx-footer">
      <button class="ctx-btn" onclick="closeContextMenus()">Fermer</button>
    </div>
  `;
  
  document.body.appendChild(menu);
  positionMenu(menu, event.target);
}

// Menu Délai régional (colonnes 0-5)
function showDelaiMenu(cardId, event) {
  const cardData = cardsData[cardId];
  const currentRegion = cardData.region || 'Quebec';
  const delays = MENU_DATA.delays;
  
  const menu = document.createElement('div');
  menu.id = 'contextMenu';
  menu.className = 'ctx-menu';
  menu.onclick = e => e.stopPropagation();
  
  const regions = [
    { key: 'Quebec', label: 'Québec', delay: delays['Quebec'] || 90 },
    { key: 'Maritime', label: 'Maritime', delay: delays['Maritime'] || 45 },
    { key: 'Canada anglais', label: 'Canada anglais', delay: delays['Canada anglais'] || 30 }
  ];
  
  const rowsHtml = regions.map(r => `
    <div class="ctx-region ${currentRegion === r.key ? 'active' : ''}" data-region="${r.key}">
      <span class="ctx-region-name">${r.label}</span>
      <input type="number" class="ctx-input" data-region="${r.key}" value="${r.delay}" min="1" max="365" onclick="event.stopPropagation()">
      <span class="ctx-unit">jours</span>
    </div>
  `).join('');
  
  menu.innerHTML = `
    <div class="ctx-header">⏱ Délais par région</div>
    <div class="ctx-body">${rowsHtml}</div>
    <div class="ctx-footer">
      <button class="ctx-btn primary" onclick="saveDelai('${cardId}')">Sauvegarder</button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Click sur une région pour la sélectionner
  menu.querySelectorAll('.ctx-region').forEach(row => {
    row.onclick = (e) => {
      if (e.target.tagName === 'INPUT') return;
      menu.querySelectorAll('.ctx-region').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      if (cardsData[cardId]) cardsData[cardId].region = row.dataset.region;
    };
  });
  
  positionMenu(menu, event.target);
}

function saveDelai(cardId) {
  const menu = document.getElementById('contextMenu');
  if (!menu) return;
  
  // Sauvegarder les délais
  menu.querySelectorAll('.ctx-input').forEach(input => {
    MENU_DATA.delays[input.dataset.region] = parseInt(input.value) || 30;
  });
  
  // Sauvegarder la région sélectionnée
  const activeRow = menu.querySelector('.ctx-region.active');
  if (activeRow && cardsData[cardId]) {
    const region = activeRow.dataset.region;
    cardsData[cardId].region = region;
    cardsData[cardId].delaiPersonnalise = MENU_DATA.delays[region];
    saveCardToFirebase(cardId);
    refreshCard(cardId);
  }
  
  closeContextMenus();
  showToast('Délai sauvegardé!');
}

function marquerExpedie(cardId) {
  const dateExp = prompt("Date d'expédition (AAAA-MM-JJ):", new Date().toLocaleDateString('fr-CA'));
  if (dateExp && cardsData[cardId]) {
    cardsData[cardId].expedie = true;
    cardsData[cardId].dateExpedition = dateExp;
    saveCardToFirebase(cardId);
    refreshCard(cardId);
  }
  closeContextMenus();
}

// Menu Raison d'attente (colonne 7)
function showRaisonMenu(cardId, event) {
  const currentRaison = cardsData[cardId]?.raisonAttente || '';
  const raisons = customLists.raisonsAttente || [
    'RDV non reçu', 'Client rappeler - voir note', 'Essayage autre région',
    'Mesure à reprendre', 'Pièce à recommander', 'Vérification prix',
    'Intervention', 'Livraison reportée', 'Hors délai RAMQ', 'Sous traitement', 'Voir Fiche'
  ];
  
  const menu = document.createElement('div');
  menu.id = 'contextMenu';
  menu.className = 'ctx-menu raison';
  menu.onclick = e => e.stopPropagation();
  
  const optionsHtml = raisons.map(r => 
    `<div class="ctx-option ${r === currentRaison ? 'selected' : ''}" onclick="selectRaison('${cardId}','${r.replace(/'/g, "\\'")}')">${r}</div>`
  ).join('');
  
  menu.innerHTML = `
    <div class="ctx-header">⏳ Raison d'attente</div>
    <div class="ctx-options">${optionsHtml}</div>
    <div class="ctx-actions">
      <button class="ctx-btn small" onclick="addRaison('${cardId}')">➕ Ajouter</button>
      <button class="ctx-btn small danger" onclick="clearRaison('${cardId}')">🗑 Effacer</button>
    </div>
    <div class="ctx-footer">
      <button class="ctx-btn" onclick="closeContextMenus()">Fermer</button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Positionner à gauche de la carte
  const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
  positionMenu(menu, card || event.target, true);
}

function selectRaison(cardId, raison) {
  if (cardsData[cardId]) {
    cardsData[cardId].raisonAttente = raison;
    cardsData[cardId].attenteActive = true;
    if (!cardsData[cardId].dateAttente) {
      cardsData[cardId].dateAttente = new Date().toLocaleDateString('fr-CA');
    }
    saveCardToFirebase(cardId);
    refreshCard(cardId);
  }
  closeContextMenus();
  showToast('Raison: ' + raison);
}

function addRaison(cardId) {
  const newRaison = prompt("Nouvelle raison d'attente:");
  if (newRaison?.trim()) {
    const raison = newRaison.trim();
    if (!customLists.raisonsAttente) customLists.raisonsAttente = [];
    if (!customLists.raisonsAttente.includes(raison)) {
      customLists.raisonsAttente.push(raison);
      customLists.raisonsAttente.sort((a, b) => a.localeCompare(b, 'fr'));
      saveCustomLists();
      showListToast('✓ "' + raison + '" AJOUTÉ!', true);
    }
    selectRaison(cardId, raison);
  }
}

function clearRaison(cardId) {
  if (cardsData[cardId]) {
    cardsData[cardId].raisonAttente = '';
    cardsData[cardId].attenteActive = false;
    cardsData[cardId].dateAttente = '';
    saveCardToFirebase(cardId);
    refreshCard(cardId);
  }
  closeContextMenus();
  showToast('Raison effacée');
}

// ===== VUE ROBOT HORIZONTALE =====

function toggleRobotView() {
  isRobotViewActive = !isRobotViewActive;
  const robotView = document.getElementById('robotHorizontalView');
  if (!robotView) return;
  
  if (isRobotViewActive) {
    robotView.style.display = 'flex';
    renderRobotTable();
    setupColumnResize();
    setupRobotVerticalResize();
  } else {
    robotView.style.display = 'none';
  }
}

// Slider vertical pour redimensionner la hauteur de la vue Robot
function setupRobotVerticalResize() {
  const resizeBar = document.getElementById('robotResizeBar');
  const robotView = document.getElementById('robotHorizontalView');
  if (!resizeBar || !robotView) return;
  
  let isResizing = false;
  let startY = 0;
  let startHeight = 0;
  
  resizeBar.addEventListener('mousedown', function(e) {
    isResizing = true;
    startY = e.clientY;
    startHeight = robotView.offsetHeight;
    robotView.classList.add('resizable');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  
  resizeBar.addEventListener('touchstart', function(e) {
    isResizing = true;
    startY = e.touches[0].clientY;
    startHeight = robotView.offsetHeight;
    robotView.classList.add('resizable');
    e.preventDefault();
  }, { passive: false });
  
  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 50, startHeight + deltaY));
    robotView.style.height = newHeight + 'px';
  });
  
  document.addEventListener('touchmove', function(e) {
    if (!isResizing) return;
    const deltaY = e.touches[0].clientY - startY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 50, startHeight + deltaY));
    robotView.style.height = newHeight + 'px';
  }, { passive: false });
  
  document.addEventListener('mouseup', function() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
  
  document.addEventListener('touchend', function() {
    if (isResizing) {
      isResizing = false;
    }
  });
}

function renderRobotTable() {
  const tbody = document.getElementById('robotTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  // Cartes de la colonne Robot (columnIndex = 0), triées par robotOrder
  let robotCards = Object.entries(cardsData).filter(([id, card]) => 
    (card.columnIndex ?? card.column ?? -1) === 0
  );
  
  // Trier par robotOrder (si défini), sinon par ordre d'ajout
  robotCards.sort((a, b) => {
    const orderA = a[1].robotOrder ?? 999999;
    const orderB = b[1].robotOrder ?? 999999;
    return orderA - orderB;
  });
  
  if (robotCards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="19" style="text-align:center;padding:30px;color:#6b7280;">Aucune carte dans Robot</td></tr>';
    return;
  }
  
  // Listes fixes
  const lists = {
    clients: [...(customLists.moulageClients || [])].sort((a, b) => a.localeCompare(b, 'fr')),
    regions: [...(customLists.regions || ['Maritime', 'Canada anglais', 'Quebec'])].sort((a, b) => a.localeCompare(b, 'fr')),
    representantes: ['Marie-Pier', 'Marie-Soleil'],
    items: ['Siège', 'Dossier', 'Siège + Dossier'],
    etats: ['Lissage', 'Robot', 'Programmation', 'Terminé']
  };
  
  robotCards.forEach(([cardId, card], index) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-card-id', cardId);
    tr.setAttribute('draggable', 'true');
    
    const rang = index + 1;
    const prio = card.priority || 0;
    const hasNotes = card.notes && card.notes.trim().length > 0;
    const etat = card.etatRobot || '';
    
    // Couleur de l'état
    const etatColors = {
      'Lissage': 'robot-etat-lissage',
      'Robot': 'robot-etat-robot',
      'Programmation': 'robot-etat-prog',
      'Terminé': 'robot-etat-termine'
    };
    const etatClass = etatColors[etat] || '';
    
    tr.innerHTML = `
      <td class="robot-drag-handle" title="Glisser pour réordonner">⋮⋮</td>
      <td class="editable" contenteditable="true" data-field="name">${card.name || ''}</td>
      <td class="editable" contenteditable="true" data-field="order">${card.order || ''}</td>
      <td class="editable" contenteditable="true" data-field="numeroSoumission">${card.numeroSoumission || ''}</td>
      <td class="editable" contenteditable="true" data-field="numeroPO">${card.numeroPO || ''}</td>
      <td>${buildSelectCell(cardId, 'client', card.client, lists.clients, 'moulageClients')}</td>
      <td>
        <select class="table-select robot-etat-select ${etatClass}" onchange="updateRobotEtat('${cardId}', this)">
          <option value="">--</option>
          <option value="Lissage" ${etat==='Lissage'?'selected':''}>Lissage</option>
          <option value="Robot" ${etat==='Robot'?'selected':''}>Robot</option>
          <option value="Programmation" ${etat==='Programmation'?'selected':''}>Programmation</option>
          <option value="Terminé" ${etat==='Terminé'?'selected':''}>Terminé</option>
        </select>
      </td>
      <td>
        <select class="table-select" onchange="updateTableField('${cardId}', 'priority', parseInt(this.value))">
          <option value="0" ${prio==0?'selected':''}>☆ Aucune</option>
          <option value="1" ${prio==1?'selected':''}>1️⃣ Priorité 1</option>
          <option value="2" ${prio==2?'selected':''}>2️⃣ Priorité 2</option>
          <option value="3" ${prio==3?'selected':''}>3️⃣ Priorité 3</option>
          <option value="4" ${prio==4?'selected':''}>4️⃣ Priorité 4</option>
          <option value="5" ${prio==5?'selected':''}>5️⃣ Priorité 5</option>
        </select>
      </td>
      <td><span class="rang-robot-text">${rang}</span></td>
      <td>${buildSelectCell(cardId, 'region', card.region, lists.regions, 'regions')}</td>
      <td>${buildSelectCell(cardId, 'item', card.item, lists.items, 'items')}</td>
      <td class="date-cell ${card.dateRecue?'has-date':'placeholder'}" onclick="showTableCalendar('${cardId}','dateRecue',this)">${card.dateRecue || 'AAAA-MM-JJ'}</td>
      <td class="date-cell ${card.dateLivraison?'has-date':'placeholder'}" onclick="showTableCalendar('${cardId}','dateLivraison',this)">${card.dateLivraison || 'AAAA-MM-JJ'}</td>
      <td class="date-cell ${card.dateEssayage?'has-date':'placeholder'}" onclick="showTableCalendar('${cardId}','dateEssayage',this)">${card.dateEssayage || 'AAAA-MM-JJ'}</td>
      <td>${buildSelectCell(cardId, 'representant', card.representant, lists.representantes, 'representantes')}</td>
      <td>
        <select class="table-select" onchange="updateTableField('${cardId}', 'file', this.value)">
          <option value="">--</option>
          <option value="Oui" ${card.file==='Oui'?'selected':''}>Oui</option>
          <option value="Non" ${card.file==='Non'?'selected':''}>Non</option>
        </select>
      </td>
      <td class="editable" contenteditable="true" data-field="angle">${card.angle || ''}</td>
      <td>
        <select class="table-select" onchange="updateTableField('${cardId}', 'rush', this.value)">
          <option value="">--</option>
          <option value="Oui" ${card.rush==='Oui'?'selected':''}>Oui</option>
          <option value="Non" ${card.rush==='Non'?'selected':''}>Non</option>
        </select>
      </td>
      <td class="notes-cell"><button class="notes-btn ${hasNotes?'has-notes':''}" onclick="openCardNotes('${cardId}')">📝</button></td>
    `;
    tbody.appendChild(tr);
  });
  
  setupTableEditableListeners();
  setupRobotRowDragDrop();
}

// Mettre à jour l'état Robot avec couleur
function updateRobotEtat(cardId, selectEl) {
  const value = selectEl.value;
  if (!cardsData[cardId]) return;
  
  cardsData[cardId].etatRobot = value;
  saveCardToFirebase(cardId);
  
  // Mettre à jour la classe de couleur
  selectEl.className = 'table-select robot-etat-select';
  const etatColors = {
    'Lissage': 'robot-etat-lissage',
    'Robot': 'robot-etat-robot',
    'Programmation': 'robot-etat-prog',
    'Terminé': 'robot-etat-termine'
  };
  if (etatColors[value]) {
    selectEl.classList.add(etatColors[value]);
  }
}

// Variables globales pour le drag des lignes Robot
let robotDragState = {
  isDragging: false,
  draggedRow: null,
  placeholder: null
};

// Drag and drop pour réordonner les lignes (mousedown/mousemove/mouseup)
function setupRobotRowDragDrop() {
  const tbody = document.getElementById('robotTableBody');
  if (!tbody) return;
  
  // Créer le placeholder une seule fois
  if (!robotDragState.placeholder) {
    robotDragState.placeholder = document.createElement('tr');
    robotDragState.placeholder.className = 'robot-row-placeholder';
    robotDragState.placeholder.innerHTML = '<td colspan="19" style="height:6px;background:linear-gradient(90deg,#3b82f6,#60a5fa,#3b82f6);padding:0;border:none;"></td>';
  }
  
  tbody.querySelectorAll('tr[data-card-id]').forEach(row => {
    const handle = row.querySelector('.robot-drag-handle');
    if (!handle) return;
    
    // Mouse events
    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      startDrag(row, tbody);
    });
    
    // Touch events
    handle.addEventListener('touchstart', function(e) {
      e.preventDefault();
      startDrag(row, tbody);
    }, { passive: false });
  });
}

function startDrag(row, tbody) {
  robotDragState.isDragging = true;
  robotDragState.draggedRow = row;
  
  row.classList.add('robot-row-dragging');
  
  // Insérer le placeholder après la ligne
  tbody.insertBefore(robotDragState.placeholder, row.nextSibling);
  
  // Mouse move/up handlers
  const onMouseMove = function(e) {
    if (!robotDragState.isDragging) return;
    handleDragMove(e.clientY, tbody);
  };
  
  const onTouchMove = function(e) {
    if (!robotDragState.isDragging) return;
    e.preventDefault();
    handleDragMove(e.touches[0].clientY, tbody);
  };
  
  const onEnd = function() {
    endDrag(tbody);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onEnd);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}

function handleDragMove(clientY, tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr[data-card-id]:not(.robot-row-dragging)'));
  const placeholder = robotDragState.placeholder;
  
  let inserted = false;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    if (clientY < midY) {
      tbody.insertBefore(placeholder, row);
      inserted = true;
      break;
    }
  }
  
  if (!inserted) {
    // Mettre à la fin
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      tbody.insertBefore(placeholder, lastRow.nextSibling);
    } else {
      tbody.appendChild(placeholder);
    }
  }
}

function endDrag(tbody) {
  const { draggedRow, placeholder } = robotDragState;
  
  if (draggedRow && placeholder && placeholder.parentNode) {
    // Déplacer la ligne à la position du placeholder
    tbody.insertBefore(draggedRow, placeholder);
    placeholder.remove();
    
    draggedRow.classList.remove('robot-row-dragging');
    
    // Sauvegarder l'ordre
    saveRobotOrder();
    syncKanbanOrder();
  }
  
  robotDragState.isDragging = false;
  robotDragState.draggedRow = null;
  
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
}

// Sauvegarder l'ordre des lignes dans Firebase
function saveRobotOrder() {
  const tbody = document.getElementById('robotTableBody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr[data-card-id]');
  rows.forEach((row, index) => {
    const cardId = row.dataset.cardId;
    if (cardsData[cardId]) {
      cardsData[cardId].robotOrder = index;
      saveCardToFirebase(cardId);
    }
    
    // Mettre à jour le rang affiché
    const rangEl = row.querySelector('.rang-robot-text');
    if (rangEl) rangEl.textContent = index + 1;
  });
  
  showToast('✅ Ordre sauvegardé');
}

// Synchroniser l'ordre des cartes Kanban avec l'ordre de la vue Robot
function syncKanbanOrder() {
  const tbody = document.getElementById('robotTableBody');
  const colRobot = document.getElementById('colRobot');
  if (!tbody || !colRobot) return;
  
  const rows = tbody.querySelectorAll('tr[data-card-id]');
  
  rows.forEach((row) => {
    const cardId = row.dataset.cardId;
    const card = colRobot.querySelector(`.mcard[data-card-id="${cardId}"]`);
    if (card) {
      colRobot.appendChild(card);
    }
  });
}

// Construit une cellule select avec + et - gros et colorés
function buildSelectCell(cardId, field, value, list, listKey) {
  const options = list.map(item => 
    `<option value="${item}" ${value===item?'selected':''}>${item}</option>`
  ).join('');
  
  return `<select class="table-select has-pm" onchange="handleSelectChange('${cardId}','${field}','${listKey}',this)">
    <option value="__PM__">(+Valeur-)</option>
    <option value="" ${!value?'selected':''}>--</option>
    ${options}
  </select>`;
}

function handleSelectChange(cardId, field, listKey, selectEl) {
  const value = selectEl.value;
  
  if (value === '__PM__') {
    selectEl.value = cardsData[cardId]?.[field] || '';
    openListManager(listKey, getTitleForList(listKey));
  } else {
    updateTableField(cardId, field, value);
  }
}

function getTitleForList(listKey) {
  const titles = {moulageClients:'Clients', regions:'Régions', items:'Items', representantes:'Représentantes'};
  return titles[listKey] || listKey;
}

// Mise à jour d'un champ depuis le tableau
function updateTableField(cardId, field, value) {
  if (!cardsData[cardId]) return;
  cardsData[cardId][field] = value;
  saveCardToFirebase(cardId);
  
  // Sync avec Kanban
  const card = document.querySelector('.mcard[data-card-id="'+cardId+'"]');
  if (card) {
    if (field === 'name') {
      const el = card.querySelector('.mcard-title');
      if (el) el.value = value;
    } else if (field === 'order') {
      const el = card.querySelector('.mcard-order');
      if (el) el.value = value;
    } else if (field === 'priority') {
      updatePriorityBadge(card, value);
    } else if (field === 'region') {
      card.classList.remove('region-qc','region-on','region-ma');
      if (value === 'Quebec' || value === 'Québec') card.classList.add('region-qc');
      else if (value === 'Canada anglais' || value === 'Ontario') card.classList.add('region-on');
      else if (value === 'Maritime') card.classList.add('region-ma');
    }
  }
}

// Listeners pour cellules éditables
function setupTableEditableListeners() {
  document.querySelectorAll('#robotTableBody td.editable').forEach(cell => {
    cell.addEventListener('blur', function() {
      const row = this.closest('tr');
      const cardId = row?.getAttribute('data-card-id');
      const field = this.getAttribute('data-field');
      const value = this.textContent.trim();
      
      if (cardId && cardsData[cardId]) {
        cardsData[cardId][field] = value;
        saveCardToFirebase(cardId);
        
        const card = document.querySelector('.mcard[data-card-id="'+cardId+'"]');
        if (card && field === 'name') {
          const el = card.querySelector('.mcard-title');
          if (el) el.value = value;
        }
        if (card && field === 'order') {
          const el = card.querySelector('.mcard-order');
          if (el) el.value = value;
        }
      }
    });
  });
}

// Ouvre un popup Notes identique à la fiche moulage
function openCardNotes(cardId) {
  document.getElementById('notesPopupOverlay')?.remove();
  document.getElementById('notesPopup')?.remove();
  
  const card = cardsData[cardId];
  if (!card) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'notesPopupOverlay';
  overlay.className = 'notes-popup-overlay';
  overlay.onclick = closeNotesPopup;
  
  const popup = document.createElement('div');
  popup.id = 'notesPopup';
  popup.className = 'notes-popup-page';
  popup.onclick = e => e.stopPropagation();
  popup.innerHTML = `
    <div class="notes-page-header">
      <span class="notes-header-left" onclick="togglePopupPhotosPanel('${cardId}')" title="Gérer les liens photos"><span class="camera-icon">📷</span> Liens</span>
      <span class="notes-header-center">📝 Notes</span>
      <button class="notes-close-btn" onclick="closeNotesPopup()" title="Fermer">✕</button>
    </div>
    
    <div class="notes-photos-links-panel" id="notesPhotosPanel_popup_${cardId}" style="display:none;">
      <div class="notes-photo-link-row"><label>Photo 1:</label><input type="url" id="notePhotoLink1_popup_${cardId}" value="${card.notePhoto1 || ''}" placeholder="https://..."></div>
      <div class="notes-photo-link-row"><label>Photo 2:</label><input type="url" id="notePhotoLink2_popup_${cardId}" value="${card.notePhoto2 || ''}" placeholder="https://..."></div>
      <div class="notes-photo-link-row"><label>Photo 3:</label><input type="url" id="notePhotoLink3_popup_${cardId}" value="${card.notePhoto3 || ''}" placeholder="https://..."></div>
      <div class="notes-photo-link-row"><label>Photo 4:</label><input type="url" id="notePhotoLink4_popup_${cardId}" value="${card.notePhoto4 || ''}" placeholder="https://..."></div>
      <div class="notes-photo-link-row"><label>Photo 5:</label><input type="url" id="notePhotoLink5_popup_${cardId}" value="${card.notePhoto5 || ''}" placeholder="https://..."></div>
      <div class="notes-photo-link-row"><label>Photo 6:</label><input type="url" id="notePhotoLink6_popup_${cardId}" value="${card.notePhoto6 || ''}" placeholder="https://..."></div>
      <button class="notes-save-photos-btn" onclick="savePopupPhotoLinks('${cardId}')">💾 Enregistrer les liens</button>
    </div>
    
    <div class="notes-photos-row">
      <button class="notes-photo-btn ${card.notePhoto1?'has-link':''}" onclick="openNotePhoto('${cardId}', 1)">Photo 1</button>
      <button class="notes-photo-btn ${card.notePhoto2?'has-link':''}" onclick="openNotePhoto('${cardId}', 2)">Photo 2</button>
      <button class="notes-photo-btn ${card.notePhoto3?'has-link':''}" onclick="openNotePhoto('${cardId}', 3)">Photo 3</button>
      <button class="notes-photo-btn ${card.notePhoto4?'has-link':''}" onclick="openNotePhoto('${cardId}', 4)">Photo 4</button>
      <button class="notes-photo-btn ${card.notePhoto5?'has-link':''}" onclick="openNotePhoto('${cardId}', 5)">Photo 5</button>
      <button class="notes-photo-btn ${card.notePhoto6?'has-link':''}" onclick="openNotePhoto('${cardId}', 6)">Photo 6</button>
    </div>
    
    <textarea class="notes-page-textarea" id="notesTextarea_popup_${cardId}" 
      placeholder="Cliquez ici pour écrire..."
      onfocus="prepareNoteWithSignature('popup_${cardId}')"
      onblur="savePopupNotes('${cardId}')">${card.notes || ''}</textarea>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  // Focus sur le textarea
  setTimeout(() => document.getElementById('notesTextarea_popup_' + cardId)?.focus(), 100);
}

function togglePopupPhotosPanel(cardId) {
  const panel = document.getElementById('notesPhotosPanel_popup_' + cardId);
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function savePopupPhotoLinks(cardId) {
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById('notePhotoLink' + i + '_popup_' + cardId);
    if (input && cardsData[cardId]) {
      cardsData[cardId]['notePhoto' + i] = input.value.trim();
    }
  }
  saveCardToFirebase(cardId);
  showToast('Liens photos sauvegardés');
  
  // Rafraîchir le popup
  closeNotesPopup();
  openCardNotes(cardId);
}

function savePopupNotes(cardId) {
  const textarea = document.getElementById('notesTextarea_popup_' + cardId);
  if (!textarea || !cardsData[cardId]) return;
  
  cardsData[cardId].notes = textarea.value.trim();
  saveCardToFirebase(cardId);
  
  // Sync avec fiche si ouverte
  const ficheTextarea = document.getElementById('notesTextarea_' + cardId);
  if (ficheTextarea) ficheTextarea.value = cardsData[cardId].notes;
  
  renderRobotTable();
}

function closeNotesPopup() {
  document.getElementById('notesPopupOverlay')?.remove();
  document.getElementById('notesPopup')?.remove();
}

// Redimensionnement colonnes
function setupColumnResize() {
  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      const th = this.parentElement;
      const startX = e.pageX;
      const startWidth = th.offsetWidth;
      
      function onMove(e) {
        const newWidth = startWidth + (e.pageX - startX);
        if (newWidth > 40) th.style.width = newWidth + 'px';
      }
      
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

// Fermer menus au clic ailleurs (SAUF le calendrier qui a son propre overlay)
document.addEventListener('click', function(e) {
  if (!e.target.closest('.ctx-menu') && !e.target.closest('.mcard-delay-pill')) closeContextMenus();
});

// Exports window
window.toggleRobotView = toggleRobotView;
window.updateTableField = updateTableField;
window.updateRobotEtat = updateRobotEtat;
window.handleSelectChange = handleSelectChange;
window.showTableCalendar = showTableCalendar;
window.openCardNotes = openCardNotes;
window.closeNotesPopup = closeNotesPopup;
window.savePopupNotes = savePopupNotes;
window.savePopupPhotoLinks = savePopupPhotoLinks;
window.togglePopupPhotosPanel = togglePopupPhotosPanel;
window.closeContextMenus = closeContextMenus;
window.selectRaison = selectRaison;
window.addRaison = addRaison;
window.clearRaison = clearRaison;
window.saveDelai = saveDelai;
window.marquerExpedie = marquerExpedie;

// ===== MODAL AJOUTER MOULAGE =====
function showAddMoulageModal() {
  let modal = document.getElementById('addMoulageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'addMoulageModal';
    modal.className = 'add-modal-overlay hidden';
    modal.innerHTML = `
      <div class="add-modal">
        <div class="add-modal-header">
          <h3>➕ Ajouter un moulage</h3>
          <div class="add-modal-header-btns">
            <button class="add-json-btn" onclick="document.getElementById('addMoulageJsonInput').click()">
              🤖 JSON
            </button>
            <input type="file" id="addMoulageJsonInput" accept=".json" style="display:none" onchange="handleImportMoulageJson(event)" multiple>
            <button class="add-modal-close" onclick="closeAddMoulageModal()">×</button>
          </div>
        </div>
        <div class="add-modal-body">
          
          <!-- Centre -->
          <div class="add-modal-field">
            <label>Centre</label>
            <div class="add-field-with-btn">
              <select id="addMoulageClient"></select>
              <button class="list-add-btn" onclick="openListManager('moulageClients', 'Centres')" title="Gérer">+</button>
            </div>
          </div>
          
          <!-- Nom du moulage (Bénéficiaire) -->
          <div class="add-modal-field">
            <label>Nom du moulage (Bénéficiaire)</label>
            <input type="text" id="addMoulageName" placeholder="Ex: Dupont Jean">
          </div>
          
          <!-- Date reçue -->
          <div class="add-modal-field">
            <label>📅 Date reçue</label>
            <div class="date-picker-field" onclick="openCalendarPopup('addMoulageDateRecue')">
              <span id="addMoulageDateRecueDisplay">-- Sélectionner --</span>
              <span class="date-picker-icon">📅</span>
            </div>
            <input type="hidden" id="addMoulageDateRecue">
          </div>
          
          <!-- Date fabriquée robot -->
          <div class="add-modal-field">
            <label>🤖 Date fabriquée robot</label>
            <div class="date-picker-field" onclick="openCalendarPopup('addMoulageDateRobot')">
              <span id="addMoulageDateRobotDisplay">-- Sélectionner --</span>
              <span class="date-picker-icon">📅</span>
            </div>
            <input type="hidden" id="addMoulageDateRobot">
          </div>
          
          <!-- Date de livraison -->
          <div class="add-modal-field">
            <label>📦 Date de livraison</label>
            <div class="date-picker-field" onclick="openCalendarPopup('addMoulageDateLivraison')">
              <span id="addMoulageDateLivraisonDisplay">-- Sélectionner --</span>
              <span class="date-picker-icon">📅</span>
            </div>
            <input type="hidden" id="addMoulageDateLivraison">
          </div>
          
          <!-- N° Commande -->
          <div class="add-modal-field">
            <label>N° Commande</label>
            <input type="text" id="addMoulageOrder" placeholder="000000" maxlength="6">
          </div>
          
          <!-- Numéro PO -->
          <div class="add-modal-field">
            <label>Numéro PO</label>
            <input type="text" id="addMoulageNumeroPO" placeholder="Numéro...">
          </div>
          
          <!-- Région -->
          <div class="add-modal-field">
            <label>Région</label>
            <div class="add-field-with-btn">
              <select id="addMoulageRegion"></select>
              <button class="list-add-btn" onclick="openListManager('regions', 'Régions')" title="Gérer">+</button>
            </div>
          </div>
          
          <!-- N° Soumission -->
          <div class="add-modal-field">
            <label>📋 N° Soumission</label>
            <input type="text" id="addMoulageSoumission" placeholder="Numéro de soumission...">
          </div>
          
          <!-- Intervenant -->
          <div class="add-modal-field">
            <label>Intervenant</label>
            <div class="add-field-with-btn">
              <select id="addMoulageIntervenant"></select>
              <button class="list-add-btn" onclick="openListManager('intervenants', 'Intervenants')" title="Gérer">+</button>
            </div>
          </div>
          
          <!-- Représentante -->
