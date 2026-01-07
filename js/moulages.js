window.deleteImagesFromStorage = deleteImagesFromStorage;

// Sauvegarder carte
function saveCardToFirebase(cardId) {
  if (cardsData[cardId]) {
    firebaseDb.ref('cards/' + cardId).set(cardsData[cardId]);
  }
}

// Générer ID unique pour carte
function generateCardId() {
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Créer une nouvelle carte
function createCard(name, order, region, columnIndex) {
  const cardId = generateCardId();
  const delay = MENU_DATA.delays[region] || 90;
  
  // Créer l'élément carte
  const card = document.createElement('div');
  card.className = 'mcard';
  card.dataset.cardId = cardId;
  card.draggable = true; // Activer le drag
  
  // Classe région
  if (region === 'Québec' || region === 'Quebec') card.classList.add('region-qc');
  else if (region === 'Canada anglais' || region === 'Ontario') card.classList.add('region-on');
  else if (region === 'Maritime') card.classList.add('region-ma');
  
  // Marquer si colonne spéciale
  if (columnIndex === 7) card.classList.add('in-attente-column');
  if (columnIndex === 6) card.classList.add('in-expedition-column');
  
  const item = 'Siège';
  const isAttente = columnIndex === 7;
  const isExpedition = columnIndex === 6;
  
  // Déterminer le texte et la classe de couleur de la pastille délai
  let delayText = delay + ' jours ouvrables';
  let delayClass = 'mcard-delay-pill delai-vert';
  
  if (isAttente) {
    delayText = '? Raison';
    delayClass = 'mcard-delay-pill';
  } else if (isExpedition) {
    delayText = 'Expédier';
    delayClass = 'mcard-delay-pill';
  }
  
  card.innerHTML = `
    <div class="priority-badge hidden" data-priority="0"></div>
    <div class="mcard-header">
      <div class="mcard-info">
        <div class="mcard-title-line">
          <input type="text" class="mcard-title" value="${name}" data-field="name">
        </div>
        <div class="mcard-order-line">
          <span class="mcard-region-pill" onclick="openPriorityMenu('${cardId}', event)" title="Cliquer pour définir priorité">${region}</span>
          <input type="text" class="mcard-order" value="${order}" data-field="order" maxlength="6">
          <button class="mcard-fiche-btn" data-action="open-fiche" data-card-id="${cardId}" title="Ouvrir la fiche">Fiche</button>
        </div>
      </div>
    </div>
    <div class="mcard-separator"></div>
    <div class="${delayClass}" onclick="openDelaiMenu('${cardId}', event)"><span>${delayText}</span></div>
    <div class="mcard-footer-buttons">
      <button class="mcard-btn mcard-btn-move">Déplacer</button>
      <button class="mcard-btn mcard-btn-delete">Supprimer</button>
    </div>
  `;
  
  // Stocker les données avec tracking initial
  const today = new Date().toLocaleDateString('fr-CA');
  const deptMap = {0:'robot', 1:'degauchage', 2:'essayage', 3:'atelier', 4:'couture', 5:'peinture', 6:'expedition'};
  const initialTracking = {};
  if (deptMap[columnIndex]) {
    initialTracking[deptMap[columnIndex]] = { entree: today };
  }
  
  cardsData[cardId] = {
    name, order, region,
    columnIndex,
    item,
    priority: 0,
    raisonAttente: '',
    dateRecue: today,
    dateRobot: columnIndex === 0 ? today : '',
    dateEssayage: '',
    dateLivraison: '',
    client: '',
    intervenant: '',
    representant: '',
    notes: '',
    tracking: initialTracking
  };
  
  // Ajouter à la colonne
  const columns = document.querySelectorAll('.col');
  const targetCol = columns[columnIndex];
  if (targetCol) {
    const content = targetCol.querySelector('.col-content');
    if (content) content.appendChild(card);
  }
  
  // Attacher les événements
  attachCardEvents(card);
  updateColumnCounts();
  
  // Sauvegarder dans Firebase
  saveCardToFirebase(cardId);
  
  return cardId;
}

// Mise a jour compteurs colonnes
function updateColumnCounts() {
  COLUMNS.forEach(col => {
    const container = document.getElementById(col.contentId);
    const countEl = document.getElementById(col.countId);
    if (container && countEl) {
      countEl.textContent = container.querySelectorAll('.mcard').length;
    }
  });
}

// Rafraichir priorites
function refreshAllPriorities() {
  Object.keys(cardsData).forEach(cardId => {
    const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
    if (card) {
      const badge = card.querySelector('.priority-badge');
      const priority = cardsData[cardId].priority || 0;
      if (badge) {
        if (priority > 0) {
          badge.textContent = priority;
          badge.className = `priority-badge p${priority}`;
        } else {
          badge.className = 'priority-badge hidden';
        }
      }
    }
  });
}

// Menu priorite
function openPriorityMenu(cardId, event) {
  event.stopPropagation();
  document.querySelector('.priority-menu')?.remove();
  
  const menu = document.createElement('div');
  menu.className = 'priority-menu';
  menu.innerHTML = `
    <div class="priority-menu-item" data-priority="0"><div class="priority-dot none">-</div>Aucune priorite</div>
    <div class="priority-menu-item" data-priority="1"><div class="priority-dot p1">1</div>Priorité 1 - URGENT</div>
    <div class="priority-menu-item" data-priority="2"><div class="priority-dot p2">2</div>Priorité 2 - Important</div>
    <div class="priority-menu-item" data-priority="3"><div class="priority-dot p3">3</div>Priorité 3 - À surveiller</div>
    <div class="priority-menu-item" data-priority="4"><div class="priority-dot p4">4</div>Priorité 4 - Normal+</div>
    <div class="priority-menu-item" data-priority="5"><div class="priority-dot p5">5</div>Priorité 5 - Basse</div>
  `;
  
  // Menu centré via CSS (position: fixed + transform)
  document.body.appendChild(menu);
  
  menu.querySelectorAll('.priority-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const priority = parseInt(item.dataset.priority);
      if (cardsData[cardId]) {
        cardsData[cardId].priority = priority;
        saveCardToFirebase(cardId);
        refreshAllPriorities();
      }
      menu.remove();
    });
  });
  
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// Variable pour stocker la carte à déplacer
let cardToMove = null;

// Menu deplacement avec rangs
function showMoveMenu(card) {
  cardToMove = card;
  const cardId = card.dataset.cardId;
  const currentCol = cardsData[cardId]?.columnIndex ?? 0;
  const moveColumns = document.getElementById('moveColumns');
  
  // Compter les cartes dans chaque colonne
  let html = '';
  COLUMNS.forEach((col, i) => {
    const cardsInCol = Object.values(cardsData).filter(c => c.columnIndex === i).length;
    const isCurrent = (i === currentCol);
    
    html += `
      <div class="move-column">
        <div class="move-column-header ${isCurrent ? 'current' : ''}">
          ${col.name}
        </div>
        <div class="move-positions">
    `;
    
    if (isCurrent) {
      html += `<div class="move-position-btn" style="opacity:0.4;cursor:default;font-size:7px;">Colonne actuelle</div>`;
    } else if (cardsInCol === 0) {
      html += `<button class="move-position-btn" data-col="${i}" data-pos="1">1</button>`;
    } else {
      const maxPos = cardsInCol + 1;
      for (let pos = 1; pos <= maxPos; pos++) {
        const isLast = (pos === maxPos);
        const posLabel = isLast ? `${pos} (dernier)` : pos;
        html += `<button class="move-position-btn" data-col="${i}" data-pos="${pos}">${posLabel}</button>`;
      }
    }
    
    html += `
        </div>
      </div>
    `;
  });
  
  moveColumns.innerHTML = html;
  
  // Ajouter les event listeners aux boutons de position
  moveColumns.querySelectorAll('.move-position-btn[data-col]').forEach(btn => {
    if (btn.tagName === 'BUTTON') {
      btn.addEventListener('click', () => {
        const targetCol = parseInt(btn.dataset.col);
        const targetPos = parseInt(btn.dataset.pos);
        moveCardToPosition(cardToMove, targetCol, targetPos);
        closeMoveMenu();
      });
    }
  });
  
  document.getElementById('moveOverlay').classList.remove('hidden');
}

function openMoveMenu(cardId) {
  const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
  if (card) showMoveMenu(card);
}

function closeMoveMenu() {
  document.getElementById('moveOverlay').classList.add('hidden');
  cardToMove = null;
}

// Déplacer une carte vers une colonne à une position spécifique
function moveCardToPosition(card, targetColIndex, position) {
  const columns = document.querySelectorAll('.col');
  const targetCol = columns[targetColIndex];
  const cardId = card.dataset.cardId;
  const currentColIndex = cardsData[cardId]?.columnIndex ?? -1;
  
  if (targetCol) {
    // Cibler le col-content pour l'insertion
    const targetContent = targetCol.querySelector('.col-content') || targetCol;
    const cardsInTarget = targetContent.querySelectorAll('.mcard');
    
    // Position 1 = premier, position 2 = après la 1ère carte, etc.
    if (position <= 1 || cardsInTarget.length === 0) {
      targetContent.insertBefore(card, cardsInTarget[0] || null);
    } else if (position > cardsInTarget.length) {
      targetContent.appendChild(card);
    } else {
      targetContent.insertBefore(card, cardsInTarget[position - 1]);
    }
    
    // Tracking automatique
    const today = new Date().toLocaleDateString('fr-CA');
    const deptMap = {0:'robot', 1:'degauchage', 2:'essayage', 3:'atelier', 4:'couture', 5:'peinture', 6:'expedition'};
    
    // Si on quitte une colonne de département (0-6), marquer la sortie
    if (currentColIndex >= 0 && currentColIndex <= 6 && currentColIndex !== targetColIndex) {
      const deptKey = deptMap[currentColIndex];
      if (deptKey && cardsData[cardId]) {
        if (!cardsData[cardId].tracking) cardsData[cardId].tracking = {};
        if (!cardsData[cardId].tracking[deptKey]) cardsData[cardId].tracking[deptKey] = {};
        if (cardsData[cardId].tracking[deptKey].entree && !cardsData[cardId].tracking[deptKey].sortie) {
          cardsData[cardId].tracking[deptKey].sortie = today;
        }
      }
    }
    
    // Si on entre dans une colonne de département (0-6), marquer l'entrée
    if (targetColIndex >= 0 && targetColIndex <= 6) {
      const deptKey = deptMap[targetColIndex];
      if (deptKey && cardsData[cardId]) {
        if (!cardsData[cardId].tracking) cardsData[cardId].tracking = {};
        if (!cardsData[cardId].tracking[deptKey]) cardsData[cardId].tracking[deptKey] = {};
        if (!cardsData[cardId].tracking[deptKey].entree) {
          cardsData[cardId].tracking[deptKey].entree = today;
        }
      }
    }
    
    // Si on entre dans En attente (colonne 7), marquer la date
    if (targetColIndex === 7 && cardsData[cardId]) {
      if (!cardsData[cardId].dateAttente) {
        cardsData[cardId].dateAttente = today;
      }
    }
    
    // Si on quitte En attente (colonne 7), effacer la date
    if (currentColIndex === 7 && targetColIndex !== 7 && cardsData[cardId]) {
      cardsData[cardId].dateAttente = '';
    }
    
    // Mettre à jour cardsData et sauvegarder
    if (cardsData[cardId]) {
      cardsData[cardId].columnIndex = targetColIndex;
      saveCardToFirebase(cardId);
    }
    
    updateColumnCounts();
    showToast('Déplacé vers ' + COLUMNS[targetColIndex].name + ' position ' + position);
  }
}

// ===== FICHE MOULAGE =====
let currentExpandedCard = null;
let cardOverlay = null;

function openFiche(card) {
  if (!card) return;
  
  // Si c'est un ID, trouver la carte
  if (typeof card === 'string') {
    card = document.querySelector(`.mcard[data-card-id="${card}"]`);
    if (!card) return;
  }
  
  const cardId = card.dataset.cardId;
  
  // Si meme carte, ne rien faire
  if (currentExpandedCard === card) return;
  
  // Fermer la fiche precedente
  if (currentExpandedCard) {
    const prevCardId = currentExpandedCard.dataset.cardId;
    if (prevCardId && cardsData[prevCardId]) saveCardToFirebase(prevCardId);
    currentExpandedCard.classList.remove('mcard-expanded');
    currentExpandedCard = null;
  }
  
  // S'assurer que l'overlay existe
  if (!cardOverlay) cardOverlay = document.getElementById('cardOverlay');
  
  // Generer la fiche si pas deja fait
  if (!card.querySelector('.mcard-fiche')) {
    card.insertAdjacentHTML('beforeend', generateFicheHTML(card));
    attachFicheEvents(card);
  }
  
  // Ouvrir la fiche
  card.classList.add('mcard-expanded');
  if (cardOverlay) cardOverlay.classList.add('active');
  currentExpandedCard = card;
}

function closeFiche() {
  if (currentExpandedCard) {
    const cardId = currentExpandedCard.dataset.cardId;
    if (cardId && cardsData[cardId]) saveCardToFirebase(cardId);
    currentExpandedCard.classList.remove('mcard-expanded');
    
    // Fermer tous les menus et popups
    currentExpandedCard.querySelector('.photos-menu-popup')?.classList.remove('active');
    currentExpandedCard.querySelector('.notes-photos-links-panel')?.style.setProperty('display', 'none');
  }
  
  // Fermer les menus globaux
  document.getElementById('priorityMenu')?.remove();
  document.getElementById('delaiMenu')?.remove();
  document.getElementById('raisonAttenteMenu')?.remove();
  document.getElementById('trackingDatesMenu')?.remove();
  document.getElementById('fichePriorityMenu')?.remove();
  
  if (cardOverlay) cardOverlay.classList.remove('active');
  currentExpandedCard = null;
}

function generateFicheHTML(card) {
  const cardId = card.dataset.cardId;
  const data = cardsData[cardId] || {};
  
  const joursAttente = calcJoursAttente(data.dateAttente);
  const isEnAttente = data.columnIndex === 7;
  
  // Priorité
  const priorityLabels = {
    0: { text: '-- Aucune --', color: '#6b7280', emoji: '&#9898;' },
    1: { text: '#1 URGENT', color: '#ef4444', emoji: '&#128308;' },
    2: { text: '#2 Important', color: '#f97316', emoji: '&#128992;' },
    3: { text: '#3 À surveiller', color: '#eab308', emoji: '&#128993;' },
    4: { text: '#4 Normal+', color: '#22c55e', emoji: '&#128994;' },
    5: { text: '#5 Basse', color: '#3b82f6', emoji: '&#128309;' }
  };
  const currentPriority = data.priority || 0;
  const priorityInfo = priorityLabels[currentPriority] || priorityLabels[0];
  
  // Sidebar tracking
  const trackingHTML = generateTrackingSidebar(cardId, data);
  
  return `
    ${trackingHTML}
    <div class="mcard-fiche" data-card-id="${cardId}">
      <div class="fiche-header">
        <div class="fiche-logo"><img src="https://raw.githubusercontent.com/Physipro-list/Physipro-serie/main/logo-physiprodemi1.png" alt="PhysiPro"/></div>
        <div class="fiche-title"><h3>Fiche Moulage</h3></div>
        <div class="fiche-priority-btn" onclick="showFichePriorityMenu('${cardId}', event)" style="background: ${priorityInfo.color};">
          <span class="fiche-priority-emoji">${priorityInfo.emoji}</span>
          <span class="fiche-priority-text">Priorité</span>
        </div>
      </div>
      
      <div class="fiche-section">
        <div class="fiche-grid-2">
          <div class="fiche-field">
            <div class="fiche-label">Centre</div>
            <div class="fiche-field-with-btn">
              <select class="fiche-select" data-fiche-field="client">
                ${generateSelectOptions('moulageClients', data.client)}
              </select>
              <button class="fiche-list-btn" onclick="openListManager('moulageClients', 'Centres')" title="Gérer la liste">+</button>
            </div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Nom du moulage (Bénéficiaire)</div>
            <input type="text" class="fiche-input" data-fiche-field="name" value="${data.name || ''}" placeholder="Nom...">
          </div>
        </div>
        
        <div class="fiche-grid-3" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">N&#176; Soumission</div>
            <input type="text" class="fiche-input" data-fiche-field="numeroSoumission" value="${data.numeroSoumission || ''}" placeholder="Numéro...">
          </div>
          <div class="fiche-field">
            <div class="fiche-label">N&#176; PO</div>
            <input type="text" class="fiche-input" data-fiche-field="numeroPO" value="${data.numeroPO || ''}" placeholder="Numéro...">
          </div>
          <div class="fiche-field">
            <div class="fiche-label">N&#176; Commande</div>
            <input type="text" class="fiche-input" data-fiche-field="order" value="${data.order || ''}" placeholder="000000" maxlength="6">
          </div>
        </div>
        
        <div class="fiche-grid-2" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">Région</div>
            <div class="fiche-field-with-btn">
              <select class="fiche-select" data-fiche-field="region">
                ${generateSelectOptions('regions', data.region)}
              </select>
              <button class="fiche-list-btn" onclick="openListManager('regions', 'Régions')" title="Gérer la liste">+</button>
            </div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Intervenant</div>
            <div class="fiche-field-with-btn">
              <select class="fiche-select" data-fiche-field="intervenant">
                ${generateSelectOptions('intervenants', data.intervenant)}
              </select>
              <button class="fiche-list-btn" onclick="openListManager('intervenants', 'Intervenants')" title="Gérer la liste">+</button>
            </div>
          </div>
        </div>
        
        <div class="fiche-grid-2" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">Représentante</div>
            <div class="fiche-field-with-btn">
              <select class="fiche-select" data-fiche-field="representant">
                ${generateSelectOptions('representantes', data.representant)}
              </select>
              <button class="fiche-list-btn" onclick="openListManager('representantes', 'Représentantes')" title="Gérer la liste">+</button>
            </div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Date RDV essayage</div>
            <div class="fiche-date-pill" data-fiche-field="dateEssayage" onclick="openCalendar('${cardId}', 'dateEssayage', this)">${data.dateEssayage || 'AAAA-MM-JJ'}</div>
          </div>
        </div>
        
        <div class="fiche-grid-3" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">Date reçue</div>
            <div class="fiche-date-pill" data-fiche-field="dateRecue" onclick="openCalendar('${cardId}', 'dateRecue', this)">${data.dateRecue || 'AAAA-MM-JJ'}</div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Date fabriquée robot</div>
            <div class="fiche-date-pill" data-fiche-field="dateRobot" onclick="openCalendar('${cardId}', 'dateRobot', this)">${data.dateRobot || 'AAAA-MM-JJ'}</div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">&#128230; Date livraison</div>
            <div class="fiche-date-pill" data-fiche-field="dateLivraison" onclick="openCalendar('${cardId}', 'dateLivraison', this)">${data.dateLivraison || 'AAAA-MM-JJ'}</div>
          </div>
        </div>
      </div>
      
      <div class="fiche-attente-section ${isEnAttente ? 'visible' : ''}">
        <div class="attente-badge-full">&#9203; EN ATTENTE: ${data.raisonAttente || 'Raison non specifiee'}</div>
        <div class="attente-days-full">En attente depuis ${data.dateAttente || '---'} (${joursAttente} jours)</div>
      </div>
      
      <div class="fiche-photos-section">
        <div class="photos-row">
          <span class="photos-label" onclick="togglePhotosMenu('${cardId}')" style="cursor:pointer;"><span class="camera-icon">&#128247;</span> Liens</span>
          <button class="photo-btn ${data.photoClient ? 'has-link blink-green-photo' : ''}" onclick="openPhotoFromPill('${cardId}', 'Client', event)">Bénéficiaire</button>
          <button class="photo-btn ${data.photoAtelier ? 'has-link blink-green-photo' : ''}" onclick="openPhotoFromPill('${cardId}', 'Atelier', event)">Atelier</button>
          <button class="photo-btn ${data.photoDevis ? 'has-link blink-green-photo' : ''}" onclick="openPhotoFromPill('${cardId}', 'Devis', event)">Devis/Modif</button>
        </div>
      </div>
      
      <!-- Menu Photos popup -->
      <div class="photos-menu-popup" id="photosMenuPopup_${cardId}">
        <div class="photos-menu-header">&#128247; Gérer les liens photos</div>
        <div class="photos-menu-field">
          <label>Bénéficiaire:</label>
          <input type="url" id="photoLinkClient_${cardId}" value="${data.photoClient || ''}" placeholder="https://..."/>
        </div>
        <div class="photos-menu-field">
          <label>Atelier:</label>
          <input type="url" id="photoLinkAtelier_${cardId}" value="${data.photoAtelier || ''}" placeholder="https://..."/>
        </div>
        <div class="photos-menu-field">
          <label>Devis/Modif:</label>
          <input type="url" id="photoLinkDevis_${cardId}" value="${data.photoDevis || ''}" placeholder="https://..."/>
        </div>
        <div class="photos-menu-btns">
          <button onclick="saveAllPhotoLinks('${cardId}')">&#128190; Enregistrer</button>
          <button onclick="closePhotosMenu('${cardId}')">Fermer</button>
        </div>
      </div>
      
    </div>
    
    <div class="mcard-notes-page" data-card-id="${cardId}">
      <div class="notes-page-header">
        <span class="notes-header-center">&#128221; Notes</span>
        <button class="notes-close-btn" onclick="closeFiche()" title="Fermer">&#10005;</button>
      </div>
      
      <div class="notes-page-content" id="notesContent_${cardId}" 
        contenteditable="true"
        placeholder="Cliquez ici pour écrire... (Ctrl+V pour coller des images)"
        onfocus="prepareNoteWithSignature('${cardId}')"
        onblur="saveMoulageNotesContent('${cardId}')"
        onpaste="handleMoulageNotesPaste(event, '${cardId}')"
        onclick="handleNotesImageClick(event)">${data.notes || ''}</div>
    </div>
  `;
}

function generateTrackingSidebar(cardId, data) {
  const depts = [
    { key: 'robot', name: 'Robot', icon: '⚙' },
    { key: 'degauchage', name: 'Dégauchage', icon: '&#128736;' },
    { key: 'essayage', name: 'Essayage', icon: '&#128090;' },
    { key: 'atelier', name: 'Atelier', icon: '&#128295;' },
    { key: 'couture', name: 'Couture', icon: '&#129697;' },
    { key: 'peinture', name: 'Peinture', icon: '&#127912;' },
    { key: 'expedition', name: 'Expédition', icon: '&#128230;' }
  ];
  
  const tracking = data.tracking || {};
  const currentDept = getDeptFromColumn(data.columnIndex);
  
  let html = '<div class="mcard-tracking-sidebar"><div class="tracking-sidebar-title">Suivi</div><div class="tracking-pills-container">';
  
  depts.forEach(dept => {
    const deptData = tracking[dept.key] || {};
    const isActive = dept.key === currentDept;
    const isCompleted = deptData.entree && deptData.sortie;
    const jours = isCompleted ? calcJoursOuvrables(deptData.entree, deptData.sortie) : (deptData.entree ? calcJoursOuvrables(deptData.entree, new Date().toLocaleDateString('fr-CA')) : '-');
    
    let pillClass = 'tracking-dept-pill';
    if (isActive) pillClass += ' active';
    if (isCompleted) pillClass += ' completed';
    
    html += `
      <div class="${pillClass}" onclick="openTrackingDatesMenu('${cardId}', '${dept.key}', '${dept.icon} ${dept.name}', event)" style="cursor:pointer;">
        <span class="tracking-pill-icon">${dept.icon}</span>
        <span class="tracking-pill-name">${dept.name}</span>
        <span class="tracking-pill-jours">${jours}</span>
      </div>
    `;
  });
  
  html += '</div></div>';
  return html;
}

function getDeptFromColumn(colIndex) {
  const map = { 0: 'robot', 1: 'degauchage', 2: 'essayage', 3: 'atelier', 4: 'couture', 5: 'peinture', 6: 'expedition' };
  return map[colIndex] || null;
}

function calcJoursOuvrables(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return 0;
  const debut = new Date(dateDebut + 'T00:00:00');
  const fin = new Date(dateFin + 'T00:00:00');
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0;
  return compterJoursOuvrables(debut, fin);
}

function calcJoursAttente(dateAttente) {
  if (!dateAttente) return 0;
  const debut = new Date(dateAttente + 'T00:00:00');
  const fin = new Date();
  fin.setHours(0, 0, 0, 0);
  if (isNaN(debut.getTime())) return 0;
  return Math.floor((fin - debut) / (1000 * 60 * 60 * 24));
}

function attachFicheEvents(card) {
  const cardId = card.dataset.cardId;
  
  // Inputs et selects - modification directe sans confirmation
  card.querySelectorAll('.fiche-input, .fiche-select').forEach(el => {
    el.addEventListener('change', () => {
      const field = el.dataset.ficheField;
      if (field && cardsData[cardId]) {
        cardsData[cardId][field] = el.value;
        
        // Si region change, mettre a jour la carte
        if (field === 'region') {
          card.classList.remove('region-qc', 'region-on', 'region-ma');
          if (el.value === 'Quebec' || el.value === 'Québec') card.classList.add('region-qc');
          else if (el.value === 'Canada anglais' || el.value === 'Ontario') card.classList.add('region-on');
          else if (el.value === 'Maritime') card.classList.add('region-ma');
        }
        
        // Si nom change, mettre a jour le titre
        if (field === 'name') {
          const titleInput = card.querySelector('.mcard-title');
          if (titleInput) titleInput.value = el.value;
        }
        
        // Si order change, mettre a jour le numero
        if (field === 'order') {
          const orderInput = card.querySelector('.mcard-order');
          if (orderInput) orderInput.value = el.value;
        }
        
        saveCardToFirebase(cardId);
      }
    });
  });
}

// ===== CALENDRIER GLOBAL =====
// openCalendar utilise maintenant le système unifié showCalendar
function openCalendar(cardId, field, element) {
  const currentValue = cardsData[cardId]?.[field] || '';
  
  showCalendar({
    value: currentValue && currentValue !== 'AAAA-MM-JJ' ? currentValue : '',
    mode: 'modal',
    onSelect: (dateStr) => {
      if (cardsData[cardId]) {
        cardsData[cardId][field] = dateStr;
        saveCardToFirebase(cardId);
        if (element) element.textContent = dateStr || 'AAAA-MM-JJ';
      }
    },
    onClear: () => {
      if (cardsData[cardId]) {
        cardsData[cardId][field] = '';
        saveCardToFirebase(cardId);
        if (element) element.textContent = 'AAAA-MM-JJ';
      }
    }
  });
}

// Photos
function openPhotoLink(cardId, field) {
  const currentUrl = cardsData[cardId]?.[field] || '';
  if (currentUrl) {
    window.open(currentUrl, '_blank');
  } else {
    const newUrl = prompt('Entrer le lien pour ' + field + ':', '');
    if (newUrl) {
      cardsData[cardId][field] = newUrl;
      saveCardToFirebase(cardId);
      // Mettre a jour le bouton
      const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
      if (card) {
        const btn = card.querySelector(`.photo-btn[onclick*="${field}"]`);
        if (btn) btn.classList.add('has-link');
      }
    }
  }
}

// ===== MENU PHOTOS FICHE =====
function togglePhotosMenu(cardId) {
  const popup = document.getElementById('photosMenuPopup_' + cardId);
  if (popup) {
    popup.classList.toggle('active');
  }
}

function closePhotosMenu(cardId) {
  const popup = document.getElementById('photosMenuPopup_' + cardId);
  if (popup) {
    popup.classList.remove('active');
  }
}

function saveAllPhotoLinks(cardId) {
  if (!cardsData[cardId]) return;
  
  const photoClient = document.getElementById('photoLinkClient_' + cardId)?.value || '';
  const photoAtelier = document.getElementById('photoLinkAtelier_' + cardId)?.value || '';
  const photoDevis = document.getElementById('photoLinkDevis_' + cardId)?.value || '';
  
  cardsData[cardId].photoClient = photoClient;
  cardsData[cardId].photoAtelier = photoAtelier;
  cardsData[cardId].photoDevis = photoDevis;
  
  saveCardToFirebase(cardId);
  
  // Mettre a jour les boutons
  const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
  if (card) {
    const btns = card.querySelectorAll('.photo-btn');
    btns.forEach(btn => {
      const onclick = btn.getAttribute('onclick') || '';
      if (onclick.includes('Client')) btn.classList.toggle('has-link', !!photoClient);
      if (onclick.includes('Atelier')) btn.classList.toggle('has-link', !!photoAtelier);
      if (onclick.includes('Devis')) btn.classList.toggle('has-link', !!photoDevis);
    });
  }
  
  closePhotosMenu(cardId);
  showToast('Liens photos enregistrés');
}

function openPhotoFromPill(cardId, photoType, event) {
  if (event) event.stopPropagation();
  
  const fieldName = 'photo' + photoType;
  const url = cardsData[cardId]?.[fieldName];
  
  if (url) {
    window.open(url, '_blank');
  } else {
    showToast('❌ ' + photoType + ': Aucun lien à afficher');
  }
}

// ===== PANNEAU PHOTOS NOTES =====
function toggleNotesPhotosPanel(cardId) {
  const panel = document.getElementById('notesPhotosPanel_' + cardId);
  if (panel) {
    panel.classList.toggle('active');
  }
}

function saveNotesPhotoLinks(cardId) {
  if (!cardsData[cardId]) return;
  
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById('notePhotoLink' + i + '_' + cardId);
    if (input) {
      cardsData[cardId]['notePhoto' + i] = input.value || '';
    }
  }
  
  saveCardToFirebase(cardId);
  
  // Mettre a jour les boutons
  const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
  if (card) {
    const btns = card.querySelectorAll('.notes-photo-btn');
    btns.forEach((btn, idx) => {
      const hasLink = !!cardsData[cardId]['notePhoto' + (idx + 1)];
      btn.classList.toggle('has-link', hasLink);
    });
  }
  
  toggleNotesPhotosPanel(cardId);
  showToast('Liens photos notes enregistrés');
}

function openNotePhoto(cardId, photoNum) {
  const fieldName = 'notePhoto' + photoNum;
  const url = cardsData[cardId]?.[fieldName] || '';
  
  if (url) {
    window.open(url, '_blank');
  } else {
    showToast('❌ Photo ' + photoNum + ': Aucun lien à afficher');
  }
}

// ===== SIGNATURE NOTES =====
function getCurrentUserName() {
  return currentUser?.name || 'Utilisateur';
}

function isRepresentante() {
  const name = getCurrentUserName();
  const reps = ['Marie-Soleil', 'Marie-Pier', 'Multipass', 'Fabrys'];
  return reps.some(r => name.toLowerCase().includes(r.toLowerCase()));
}

function prepareNoteWithSignature(cardId) {
  // Utiliser le système standardisé
  const contentId = 'notesContent_' + cardId;
  const element = document.getElementById(contentId);
  
  if (!element) {
    // Fallback pour textarea (ancien système)
    const textarea = document.getElementById('notesTextarea_' + cardId);
    if (textarea) {
      prepareNoteWithSignatureTextarea(cardId, textarea);
    }
    return;
  }
  
  const userName = getCurrentUserName();
  
  // Si représentante et première visite, ajouter "Note vue par..."
  if (isRepresentante()) {
    const viewedMarker = 'Note vue par ' + userName;
    const currentText = element.innerText || '';
    if (!currentText.includes(viewedMarker)) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-CA');
      const timeStr = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
      const viewedLine = `<div style="color:#9333ea;font-weight:600;">*** ${viewedMarker} (${dateStr} à ${timeStr}) ***</div>`;
      const existingHtml = element.innerHTML;
      if (existingHtml.trim()) {
        element.innerHTML = existingHtml + '<br>' + viewedLine;
      } else {
        element.innerHTML = viewedLine;
      }
      markNoteAsRead(cardId);
    }
  }
  
  // Utiliser le système standardisé de notes
  handleStandardNoteClick(contentId, () => saveMoulageNotesContent(cardId));
}

// Fallback pour les textareas (ancien système)
function prepareNoteWithSignatureTextarea(cardId, textarea) {
  const userName = getCurrentUserName();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-CA');
  const timeStr = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  
  let currentText = textarea.value;
  
  // Si représentante, ajouter "Note vue par..."
  if (isRepresentante()) {
    const viewedMarker = 'Note vue par ' + userName;
    if (!currentText.includes(viewedMarker)) {
      const viewedLine = `*** ${viewedMarker} (${dateStr} à ${timeStr}) ***`;
      currentText = currentText.trim() ? currentText.trimEnd() + '\n\n' + viewedLine + '\n' : viewedLine + '\n';
      textarea.value = currentText;
      markNoteAsRead(cardId);
    }
  }
  
  // Signature normale
  const signature = `— ${userName} — ${dateStr} ${timeStr}`;
  const lines = currentText.split('\n');
  const lastSignatureLine = lines.filter(l => l.startsWith('— ')).pop();
  
  let hasExactSameSignature = false;
  if (lastSignatureLine) {
    const match = lastSignatureLine.match(/— .+ — (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
    if (match && match[1] === dateStr && match[2] === timeStr) {
      hasExactSameSignature = true;
    }
  }
  
  if (!hasExactSameSignature) {
    textarea.value = currentText.trim() ? currentText.trimEnd() + '\n\n' + signature + '\n' : signature + '\n';
  }
  
  setTimeout(() => {
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
    textarea.scrollTop = textarea.scrollHeight;
  }, 10);
}

function markNoteAsRead(cardId) {
  if (!cardsData[cardId]) return;
  
  const currentUser = getCurrentUserName();
  
  if (!cardsData[cardId].notesUnread) {
    cardsData[cardId].notesUnread = {};
  }
  cardsData[cardId].notesUnread[currentUser] = false;
  saveCardToFirebase(cardId);
}

// Notes
function saveMoulageNotes(cardId) {
  const textarea = document.getElementById('notesTextarea_' + cardId);
  if (textarea && cardsData[cardId]) {
    cardsData[cardId].notes = textarea.value;
    saveCardToFirebase(cardId);
  }
}

// ===== MENU TRACKING DATES =====
function formatDateFull(dateStr) {
  if (!dateStr) return 'Cliquer pour définir';
  const d = new Date(dateStr + 'T12:00:00'); // Ajouter heure pour éviter décalage timezone
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

function openTrackingDatesMenu(cardId, deptKey, deptName, event) {
  event.stopPropagation();
  
  // Fermer tout menu existant
  document.getElementById('trackingDatesMenu')?.remove();
  
  const data = cardsData[cardId] || {};
  const tracking = data.tracking?.[deptKey] || {};
  const entree = tracking.entree || '';
  const sortie = tracking.sortie || '';
  
  const entreeDisplay = entree ? formatDateFull(entree) : 'Cliquer pour définir';
  const sortieDisplay = sortie ? formatDateFull(sortie) : 'Cliquer pour définir';
  
  const menu = document.createElement('div');
  menu.id = 'trackingDatesMenu';
  menu.className = 'tracking-dates-menu';
  
  menu.innerHTML = 
    '<div class="tracking-menu-header">' + deptName + '</div>' +
    '<div class="tracking-menu-row">' +
      '<span class="tracking-menu-label">Entree:</span>' +
      '<span class="tracking-menu-date" onclick="setTrackingDate(\'' + cardId + '\', \'' + deptKey + '\', \'entree\')">' + entreeDisplay + '</span>' +
    '</div>' +
    '<div class="tracking-menu-row">' +
      '<span class="tracking-menu-label">Sortie:</span>' +
      '<span class="tracking-menu-date" onclick="setTrackingDate(\'' + cardId + '\', \'' + deptKey + '\', \'sortie\')">' + sortieDisplay + '</span>' +
    '</div>' +
    '<div class="tracking-menu-footer">' +
      '<button onclick="document.getElementById(\'trackingDatesMenu\')?.remove()">Fermer</button>' +
    '</div>';
  
  document.body.appendChild(menu);
  
  // Mesurer la hauteur reelle du menu
  const menuHeight = menu.offsetHeight || 150;
  const menuWidth = menu.offsetWidth || 200;
  
  // Trouver la sidebar tracking pour positionner a droite
  const sidebar = event.target.closest('.mcard-tracking-sidebar');
  const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
  const pillRect = event.target.closest('.tracking-dept-pill').getBoundingClientRect();
  
  // Position horizontale: a droite de la sidebar
  let leftPos;
  if (sidebarRect) {
    leftPos = sidebarRect.right + 5;
  } else {
    leftPos = pillRect.right + 10;
  }
  
  // Si depasse a droite, mettre a gauche
  if (leftPos + menuWidth > window.innerWidth - 10) {
    leftPos = Math.max(10, pillRect.left - menuWidth - 10);
  }
  
  // Position verticale: centrer sur la pastille, mais TOUJOURS rester dans l'ecran
  const pillCenterY = pillRect.top + (pillRect.height / 2);
  let topPos = pillCenterY - (menuHeight / 2);
  
  // S'assurer que le menu reste TOUJOURS visible
  const minTop = 50; // Marge du haut
  const maxTop = window.innerHeight - menuHeight - 20; // Marge du bas
  
  if (topPos < minTop) {
    topPos = minTop;
  }
  if (topPos > maxTop) {
    topPos = maxTop;
  }
  
  menu.style.left = leftPos + 'px';
  menu.style.top = topPos + 'px';
}

function setTrackingDate(cardId, deptKey, dateType) {
  const currentDate = cardsData[cardId]?.tracking?.[deptKey]?.[dateType] || '';
  
  // Fermer le menu tracking
  document.getElementById('trackingDatesMenu')?.remove();
  
  // Ouvrir le calendrier
  showCalendar({
    value: currentDate,
    mode: 'modal',
    onSelect: (dateStr) => {
      if (!cardsData[cardId].tracking) cardsData[cardId].tracking = {};
      if (!cardsData[cardId].tracking[deptKey]) cardsData[cardId].tracking[deptKey] = {};
      
      cardsData[cardId].tracking[deptKey][dateType] = dateStr;
      saveCardToFirebase(cardId);
      
      // Mettre a jour l'affichage de la fiche
      const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
      if (card && card.classList.contains('mcard-expanded')) {
        const sidebar = card.querySelector('.mcard-tracking-sidebar');
        if (sidebar) {
          const newSidebar = document.createElement('div');
          newSidebar.innerHTML = generateTrackingSidebar(cardId, cardsData[cardId]);
          sidebar.replaceWith(newSidebar.firstElementChild);
        }
      }
      
      showToast('📅 Date ' + (dateType === 'entree' ? 'entrée' : 'sortie') + ' mise à jour');
    },
    onClear: () => {
      if (cardsData[cardId]?.tracking?.[deptKey]) {
        delete cardsData[cardId].tracking[deptKey][dateType];
        saveCardToFirebase(cardId);
        
        // Mettre a jour l'affichage
        const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
        if (card && card.classList.contains('mcard-expanded')) {
          const sidebar = card.querySelector('.mcard-tracking-sidebar');
          if (sidebar) {
            const newSidebar = document.createElement('div');
            newSidebar.innerHTML = generateTrackingSidebar(cardId, cardsData[cardId]);
            sidebar.replaceWith(newSidebar.firstElementChild);
          }
        }
        
        showToast('📅 Date effacée');
      }
    }
  });
}

// ===== GESTION DES LISTES PERSONNALISABLES =====

function loadCustomLists() {
  const listsRef = firebaseDb.ref('customLists');
  listsRef.once('value').then(snapshot => {
    const data = snapshot.val();
    if (data) {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          customLists[key] = data[key];
          // Trier alphabetiquement
          customLists[key].sort((a, b) => a.localeCompare(b, 'fr'));
        }
      }
      console.log('Listes chargees depuis Firebase');
    }
  }).catch(err => {
    // Si erreur de permission, utiliser les valeurs par défaut silencieusement
    if (err.message && err.message.includes('permission_denied')) {
      console.log('Listes: utilisation des valeurs par défaut (permissions Firebase)');
    } else {
      console.error('Erreur chargement listes:', err);
    }
  });
}

function saveCustomLists() {
  return new Promise((resolve, reject) => {
    firebaseDb.ref('customLists').set(customLists)
      .then(() => {
        console.log('Listes sauvegardees');
        resolve();
      })
      .catch(err => {
        // Si erreur de permission, ignorer silencieusement
        if (err.message && err.message.includes('permission_denied')) {
          console.log('Listes: sauvegarde locale uniquement (permissions Firebase)');
          resolve(); // Ne pas bloquer l'application
        } else {
          console.error('Erreur sauvegarde listes:', err);
          reject(err);
        }
      });
  });
}

function openListManager(listKey, title) {
  currentListKey = listKey;
  currentListTitle = title;
  
  const overlay = document.getElementById('listManagerOverlay');
  const titleEl = document.getElementById('listManagerTitle');
  const inputEl = document.getElementById('listManagerNewItem');
  
  titleEl.innerHTML = '⚙ Gérer les ' + title + 's';
  inputEl.value = '';
  
  renderListItems();
  overlay.classList.remove('hidden');
}

function renderListItems() {
  const itemsEl = document.getElementById('listManagerItems');
  const list = customLists[currentListKey] || [];
  
  // Si plus de 8 items, afficher sur 2 colonnes
  if (list.length > 8) {
    itemsEl.style.display = 'grid';
    itemsEl.style.gridTemplateColumns = '1fr 1fr';
    itemsEl.style.gap = '8px';
  } else {
    itemsEl.style.display = 'flex';
    itemsEl.style.flexDirection = 'column';
    itemsEl.style.gap = '8px';
  }
  
  if (list.length === 0) {
    itemsEl.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.5);font-size:13px;">Aucune valeur dans cette liste.<br>Ajoutez-en une ci-dessous!</div>';
    return;
  }
  
  itemsEl.innerHTML = list.map((item, index) => 
    '<div class="list-manager-item" data-index="' + index + '">' +
      '<span class="item-index">#' + (index + 1) + '</span>' +
      '<span class="item-name">' + item + '</span>' +
      '<button class="btn-remove-item" onclick="removeListItem(' + index + ')" title="Supprimer">&#10005;</button>' +
    '</div>'
  ).join('');
}

function addListItem() {
  const inputEl = document.getElementById('listManagerNewItem');
  const value = inputEl.value.trim();
  
  if (!value) {
    showListToast('&#10060; Veuillez entrer une valeur', false);
    return;
  }
  
  if (!customLists[currentListKey]) {
    customLists[currentListKey] = [];
  }
  
  // Verifier si deja existant
  if (customLists[currentListKey].includes(value)) {
    showListToast('&#9888; Cette valeur existe déjà!', false);
    return;
  }
  
  // Ajouter et trier alphabetiquement
  customLists[currentListKey].push(value);
  customLists[currentListKey].sort((a, b) => a.localeCompare(b, 'fr'));
  
  inputEl.value = '';
  renderListItems();
  
  // Effet visuel sur l'element ajoute
  const newIndex = customLists[currentListKey].indexOf(value);
  const items = document.querySelectorAll('.list-manager-item');
  if (items[newIndex]) {
    items[newIndex].classList.add('just-added');
    // Scroll vers l'element ajoute
    items[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // Afficher le toast IMMEDIATEMENT
  showListToast('&#10004; "' + value + '" AJOUTÉ!', true);
  
  // Sauvegarder en arriere-plan
  saveCustomLists().then(() => {
    updateAllSelectsFromLists();
  });
  
  inputEl.focus();
}

function removeListItem(index) {
  if (!customLists[currentListKey]) return;
  
  const item = customLists[currentListKey][index];
  if (confirm('Supprimer "' + item + '" de la liste?')) {
    // Animation
    const items = document.querySelectorAll('.list-manager-item');
    if (items[index]) {
      items[index].classList.add('just-removed');
    }
    
    setTimeout(() => {
      customLists[currentListKey].splice(index, 1);
      renderListItems();
      
      // Afficher le toast IMMEDIATEMENT
      showListToast('&#128465; "' + item + '" SUPPRIMÉ!', false);
      
      // Sauvegarder en arriere-plan
      saveCustomLists().then(() => {
        updateAllSelectsFromLists();
      });
    }, 300);
  }
}

function closeListManager() {
  const overlay = document.getElementById('listManagerOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  // Forcer la mise a jour des selects a la fermeture
  if (currentListKey) {
    updateAllSelectsFromLists();
  }
}

// Mettre a jour tous les selects ouverts avec les nouvelles listes
function updateAllSelectsFromLists() {
  // Mapping champ -> liste
  const fieldToList = {
    'client': 'moulageClients',
    'region': 'regions',
    'intervenant': 'intervenants',
    'representant': 'representantes'
  };
  
  // Fonction pour mettre a jour les selects d'une carte
  function updateCardSelects(card) {
    if (!card) return;
    const cardId = card.dataset.cardId;
    const data = cardsData[cardId] || {};
    
    card.querySelectorAll('.fiche-select[data-fiche-field]').forEach(select => {
      const field = select.dataset.ficheField;
      const listKey = fieldToList[field];
      
      if (listKey && customLists[listKey]) {
        const currentValue = select.value || data[field] || '';
        select.innerHTML = generateSelectOptions(listKey, currentValue);
      }
    });
  }
  
  // Chercher TOUTES les fiches ouvertes par classe
  document.querySelectorAll('.mcard.mcard-expanded').forEach(updateCardSelects);
  
  // Aussi utiliser currentExpandedCard directement (au cas ou)
  if (currentExpandedCard) {
    updateCardSelects(currentExpandedCard);
  }
}

// Afficher un toast de confirmation pour les listes (TRES VISIBLE)
function showListToast(message, isSuccess = true) {
  // Supprimer les toasts existants
  document.querySelectorAll('.list-toast').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = 'list-toast';
  
  // Couleur de fond
  const bgColor = isSuccess ? '#22c55e' : '#ef4444';
  
  // Style inline DIRECT - pas d'animation
  toast.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    padding: 40px 80px !important;
    border-radius: 20px !important;
    font-size: 28px !important;
    font-weight: 900 !important;
    color: white !important;
    z-index: 9999999 !important;
    text-align: center !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
    border: 5px solid white !important;
    min-width: 400px !important;
    background: ${bgColor} !important;
    opacity: 1 !important;
    visibility: visible !important;
  `;
  
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  // Disparaitre apres 5 secondes
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Generer les options d'un select a partir d'une liste
function generateSelectOptions(listKey, selectedValue) {
  const list = customLists[listKey] || [];
  let html = '<option value="">-- Sélectionner --</option>';
  list.forEach(item => {
    const selected = (item === selectedValue) ? 'selected' : '';
    html += '<option value="' + item + '" ' + selected + '>' + item + '</option>';
  });
  return html;
}

// Menu priorite fiche
function showFichePriorityMenu(cardId, event) {
  event.stopPropagation();
  document.querySelector('.fiche-priority-menu')?.remove();
  
  const menu = document.createElement('div');
  menu.className = 'fiche-priority-menu';
  menu.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:10001;min-width:180px;';
  menu.innerHTML = `
    <div class="fiche-priority-menu-item" data-priority="0" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;border-bottom:1px solid #f1f5f9;">
      <div style="width:16px;height:16px;border-radius:50%;background:#6b7280;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">-</div>Aucune
    </div>
    <div class="fiche-priority-menu-item" data-priority="1" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;border-bottom:1px solid #f1f5f9;">
      <div style="width:16px;height:16px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">1</div>#1 URGENT
    </div>
    <div class="fiche-priority-menu-item" data-priority="2" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;border-bottom:1px solid #f1f5f9;">
      <div style="width:16px;height:16px;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">2</div>#2 Important
    </div>
    <div class="fiche-priority-menu-item" data-priority="3" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;border-bottom:1px solid #f1f5f9;">
      <div style="width:16px;height:16px;border-radius:50%;background:#eab308;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">3</div>#3 À surveiller
    </div>
    <div class="fiche-priority-menu-item" data-priority="4" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;border-bottom:1px solid #f1f5f9;">
      <div style="width:16px;height:16px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">4</div>#4 Normal+
    </div>
    <div class="fiche-priority-menu-item" data-priority="5" style="display:flex;align-items:center;gap:10px;padding:10px 15px;cursor:pointer;font-size:12px;color:#333;">
      <div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">5</div>#5 Basse
    </div>
  `;
  
  // Menu centré via CSS (position: fixed + transform)
  document.body.appendChild(menu);
  
  menu.querySelectorAll('.fiche-priority-menu-item').forEach(item => {
    item.addEventListener('mouseover', () => item.style.background = '#f1f5f9');
    item.addEventListener('mouseout', () => item.style.background = '');
    item.addEventListener('click', () => {
      const priority = parseInt(item.dataset.priority);
      if (cardsData[cardId]) {
        cardsData[cardId].priority = priority;
        saveCardToFirebase(cardId);
        refreshAllPriorities();
        
        // Mettre a jour le bouton priorite dans la fiche
        const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
        if (card) {
          const btn = card.querySelector('.fiche-priority-btn');
          if (btn) {
            const colors = { 0: '#6b7280', 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#3b82f6' };
            btn.style.background = colors[priority];
          }
        }
      }
      menu.remove();
    });
  });
  
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// Utilitaires
function showToast(msg, err = false) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast' + (err ? ' error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialiser Firebase
  if (!initFirebase()) {
    loginError.textContent = "Erreur serveur - rechargez la page";
    return;
  }
  
  // 2. Charger email/password sauvegardés
  loadSavedCredentials();
  
  // 3. Event listener formulaire login
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    attemptLogin();
  });
  loginEmail.addEventListener('keydown', e => { if (e.key === 'Enter') loginPassword.focus(); });
  
  // 4. Vérifier si déjà connecté
  firebaseAuth.onAuthStateChanged(user => {
    if (user && USERS[user.email]) {
      loginSuccess(USERS[user.email], user.email);
    }
  });
  
  // 5. Autres event listeners
  document.getElementById('btnSettings')?.addEventListener('click', () => document.getElementById('settingsOverlay').classList.remove('hidden'));
  document.getElementById('settingsCloseBtn')?.addEventListener('click', () => document.getElementById('settingsOverlay').classList.add('hidden'));
  document.getElementById('settingsOverlay')?.addEventListener('click', e => { if (e.target.id === 'settingsOverlay') document.getElementById('settingsOverlay').classList.add('hidden'); });
  document.getElementById('btnLogout')?.addEventListener('click', logout);
  
  const btnAddMoulage = document.getElementById('btnAddMoulage');
  if (btnAddMoulage) btnAddMoulage.addEventListener('click', () => showAddMoulageModal());
  
  document.getElementById('searchInput').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.getElementById('searchClear').classList.toggle('hidden', !q);
    
    // Déterminer quelle page est active
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const pageId = activePage.id;
    
    if (pageId === 'pageMoulages') {
      // Recherche dans TOUS les champs des moulages
      document.querySelectorAll('.mcard').forEach(card => {
        const cardId = card.dataset.cardId;
        const data = cardsData[cardId] || {};
        
        // Chercher dans tous les champs possibles
        const searchableText = [
          data.name || '',
          data.order || '',
          data.client || '',
          data.region || '',
          data.intervenant || '',
          data.representant || '',
          data.numeroPO || '',
          data.numeroSoumission || '',
          data.notes || '',
          data.raisonAttente || '',
          data.telephone || '',
          data.email || '',
          data.adresse || '',
          data.ville || '',
          data.codePostal || '',
          data.description || '',
          data.diagnostic || '',
          data.produit || '',
          data.modele || '',
          data.grandeur || '',
          data.couleur || '',
          data.assignee || '',
          data.evaluateur || '',
          data.technicien || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        
        card.style.display = searchableText.includes(q) ? '' : 'none';
      });
    } else if (pageId === 'pageJobs') {
      // Recherche dans TOUS les champs des jobs ET mini cartes
      document.querySelectorAll('.job-card, .job-mini').forEach(card => {
        const jobId = card.dataset.jobId;
        const job = jobsData[jobId] || {};
        
        const searchableText = [
          job.order || '',
          job.client || '',
          job.region || '',
          job.intervenant || '',
          job.representant || '',
          job.numeroPO || '',
          job.assignee || '',
          job.questions || '',
          job.response || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        
        card.style.display = searchableText.includes(q) ? '' : 'none';
      });
      // Recherche dans les mini cartes moulage
      document.querySelectorAll('.moulage-mini').forEach(card => {
        const cardId = card.dataset?.cardId;
        const data = cardsData[cardId] || {};
        
        const searchableText = [
          data.order || '',
          data.client || '',
          data.name || '',
          data.region || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        
        card.style.display = searchableText.includes(q) ? '' : 'none';
      });
    } else if (pageId === 'pageSerie') {
      // Recherche dans TOUS les champs des commandes Série+
      document.querySelectorAll('.cmd-card').forEach(card => {
        const cmdId = card.dataset.cmdId;
        const cmd = commandesData[cmdId] || {};
        
        // Collecter tous les items pour la recherche
        let itemsText = '';
        if (cmd.items && Array.isArray(cmd.items)) {
          cmd.items.forEach(item => {
            itemsText += ' ' + (item.item || '') + ' ' + (item.qte || '') + ' ' + (item.notes || '');
          });
        }
        
        const searchableText = [
          cmd.order || '',
          cmd.client || '',
          cmd.region || '',
          cmd.intervenant || '',
          cmd.representant || '',
          cmd.numeroPO || '',
          cmd.numeroSoumission || '',
          cmd.notes || '',
          cmd.dateRequise || '',
          cmd.dateLimite || '',
          itemsText,
          card.textContent || ''
        ].join(' ').toLowerCase();
        
        card.style.display = searchableText.includes(q) ? '' : 'none';
      });
    } else if (pageId === 'pageInventaire') {
      // Recherche dans TOUS les champs de l'inventaire
      document.querySelectorAll('.inv-cube').forEach(cube => {
        const cubeId = cube.dataset.id;
        const item = inventaireData[cubeId] || {};
        
        const searchableText = [
          item.nom || '',
          item.code || '',
          item.description || '',
          item.rang || '',
          cube.textContent || ''
        ].join(' ').toLowerCase();
        
        cube.style.display = searchableText.includes(q) ? '' : 'none';
      });
    } else if (pageId === 'pageATM') {
      // Recherche dans TOUS les champs ATM
      document.querySelectorAll('.atm-card').forEach(card => {
        const cardId = card.dataset.id;
        const data = atmData[cardId] || {};
        
        const searchableText = [
          data.order || '',
          data.client || '',
          data.chaiseType || '',
          data.description || '',
          data.numeroPO || '',
          data.notes || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        
        card.style.display = searchableText.includes(q) ? '' : 'none';
      });
    }
  });
  document.getElementById('searchClear').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.add('hidden');
    // Réafficher tout selon la page active
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const pageId = activePage.id;
    
    if (pageId === 'pageMoulages') {
      document.querySelectorAll('.mcard').forEach(c => c.style.display = '');
    } else if (pageId === 'pageJobs') {
      document.querySelectorAll('.job-card, .job-mini, .moulage-mini').forEach(c => c.style.display = '');
    } else if (pageId === 'pageSerie') {
      document.querySelectorAll('.cmd-card').forEach(c => c.style.display = '');
    } else if (pageId === 'pageInventaire') {
      document.querySelectorAll('.inv-cube').forEach(c => c.style.display = '');
    } else if (pageId === 'pageATM') {
      document.querySelectorAll('.atm-card').forEach(c => c.style.display = '');
    }
  });
  
  // Event listeners pour le menu de déplacement
  document.getElementById('moveClose')?.addEventListener('click', closeMoveMenu);
  document.getElementById('moveOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'moveOverlay') closeMoveMenu();
  });
  
  // Event listeners pour confirmation suppression
  document.getElementById('confirmYes')?.addEventListener('click', confirmDelete);
  document.getElementById('confirmNo')?.addEventListener('click', closeDeleteConfirm);
  document.getElementById('confirmOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirmOverlay') closeDeleteConfirm();
  });
});

// Exposer fonctions globales
window.openFiche = openFiche;
window.closeFiche = closeFiche;
window.openMoveMenu = openMoveMenu;
window.showMoveMenu = showMoveMenu;
window.closeMoveMenu = closeMoveMenu;
window.moveCardToPosition = moveCardToPosition;
window.showDeleteConfirm = showDeleteConfirm;
window.closeDeleteConfirm = closeDeleteConfirm;
window.confirmDelete = confirmDelete;
window.openPriorityMenu = openPriorityMenu;
window.openCalendar = openCalendar;
window.openPhotoLink = openPhotoLink;
window.openNotePhoto = openNotePhoto;
window.saveMoulageNotes = saveMoulageNotes;
window.saveMoulageNotesContent = saveMoulageNotesContent;
window.handleMoulageNotesPaste = handleMoulageNotesPaste;
window.showFichePriorityMenu = showFichePriorityMenu;
window.togglePhotosMenu = togglePhotosMenu;
window.closePhotosMenu = closePhotosMenu;

