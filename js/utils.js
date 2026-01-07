// ===== DONNEES =====
let MENU_DATA = {
  regions: ["Quebec", "Canada anglais", "Maritime"],
  delays: { "Quebec": 90, "Canada anglais": 30, "Maritime": 45 },
  clients: [],
  intervenants: [],
  representantes: ["Marie-Soleil", "Marie-Pier"],
  items: ["Siege", "Dossier", "Siege + Dossier"]
};

// Jours feries Quebec
const QUEBEC_HOLIDAYS = [
  '2024-01-01', '2024-04-29', '2024-05-20', '2024-06-24', '2024-07-01',
  '2024-09-02', '2024-10-14', '2024-12-25', '2024-12-26',
  '2025-01-01', '2025-04-21', '2025-05-19', '2025-06-24', '2025-07-01',
  '2025-09-01', '2025-10-13', '2025-12-25', '2025-12-26'
];

// Charger cartes depuis Firebase
function loadCardsFromFirebase() {
  console.log('═══════════════════════════════════════');
  console.log('🔄 loadCardsFromFirebase() appelé');
  console.log('📊 firebaseDb existe:', !!firebaseDb);
  
  if (!firebaseDb) {
    console.log('❌ ERREUR: firebaseDb est null/undefined!');
    showToast('❌ Erreur: Base de données non connectée');
    return;
  }
  
  console.log('🔄 Abonnement à Firebase ref("cards")...');
  
  firebaseDb.ref('cards').on('value', snapshot => {
    const data = snapshot.val();
    console.log('📥 Données cartes reçues:', data ? Object.keys(data).length + ' cartes' : 'AUCUNE (null)');
    
    if (!data) {
      console.log('⚠️ Snapshot.val() est null - Aucune carte dans Firebase');
    }
    
    // Supprimer cartes qui n'existent plus
    document.querySelectorAll('.mcard[data-card-id]').forEach(card => {
      const cardId = card.dataset.cardId;
      if (!data || !data[cardId]) {
        card.remove();
        delete cardsData[cardId];
      }
    });
    
    if (data) {
      Object.keys(data).forEach(cardId => {
        const cardData = data[cardId];
        cardsData[cardId] = cardData;
        
        let card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
        const isAttente = (cardData.columnIndex === 7);
        const isExpedition = (cardData.columnIndex === 6);
        
        if (card) {
          // Mettre a jour carte existante
          updateExistingCard(card, cardId, cardData);
        } else {
          // Creer nouvelle carte
          card = createCardElement(cardId, cardData);
          const columns = document.querySelectorAll('.col');
          const targetCol = columns[cardData.columnIndex || 0];
          if (targetCol) {
            const content = targetCol.querySelector('.col-content');
            if (content) content.appendChild(card);
          }
          attachCardEvents(card);
        }
      });
      
      // Nettoyer les notes corrompues
      cleanCorruptedNotes(cardsData, 'cards');
      
      updateColumnCounts();
      refreshAllPriorities();
      
      // Initialiser les zones de drop
      initMoulageDropZones();
      
      console.log(`✅ ${Object.keys(data).length} cartes synchronisées et affichées`);
      
      // Forcer l'affichage mobile aussi
      if (typeof displayAllMobileCards === 'function') {
        displayAllMobileCards();
      }
    } else {
      console.log('⚠️ Aucune carte dans Firebase');
      updateColumnCounts();
    }
  }, error => {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERREUR Firebase cards:', error);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('═══════════════════════════════════════');
    showToast('❌ Erreur de chargement: ' + error.message);
  });
}

// Initialiser les zones de drop pour le drag and drop des cartes moulage
let moulageDropZonesInitialized = false;
let dropIndicator = null;

function initMoulageDropZones() {
  if (moulageDropZonesInitialized) return;
  moulageDropZonesInitialized = true;
  
  // Créer l'indicateur de drop (ligne bleue)
  dropIndicator = document.createElement('div');
  dropIndicator.className = 'moulage-drop-indicator';
  dropIndicator.style.display = 'none';
  document.body.appendChild(dropIndicator);
  
  const columns = document.querySelectorAll('#pageMoulages .col');
  
  columns.forEach((col, colIndex) => {
    const content = col.querySelector('.col-content');
    if (!content) return;
    
    content.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      content.classList.add('drag-over');
      
      // Trouver la position d'insertion
      const afterElement = getDragAfterElement(content, e.clientY);
      
      // Positionner l'indicateur
      if (afterElement) {
        const rect = afterElement.getBoundingClientRect();
        dropIndicator.style.display = 'block';
        dropIndicator.style.top = (rect.top - 2) + 'px';
        dropIndicator.style.left = rect.left + 'px';
        dropIndicator.style.width = rect.width + 'px';
      } else {
        // À la fin de la colonne
        const cards = content.querySelectorAll('.mcard:not(.dragging)');
        if (cards.length > 0) {
          const lastCard = cards[cards.length - 1];
          const rect = lastCard.getBoundingClientRect();
          dropIndicator.style.display = 'block';
          dropIndicator.style.top = (rect.bottom + 2) + 'px';
          dropIndicator.style.left = rect.left + 'px';
          dropIndicator.style.width = rect.width + 'px';
        } else {
          // Colonne vide
          const rect = content.getBoundingClientRect();
          dropIndicator.style.display = 'block';
          dropIndicator.style.top = (rect.top + 5) + 'px';
          dropIndicator.style.left = (rect.left + 5) + 'px';
          dropIndicator.style.width = (rect.width - 10) + 'px';
        }
      }
    });
    
    content.addEventListener('dragleave', (e) => {
      if (!content.contains(e.relatedTarget)) {
        content.classList.remove('drag-over');
        dropIndicator.style.display = 'none';
      }
    });
    
    content.addEventListener('drop', (e) => {
      e.preventDefault();
      content.classList.remove('drag-over');
      dropIndicator.style.display = 'none';
      
      const cardId = e.dataTransfer.getData('text/plain');
      if (!cardId || !cardsData[cardId]) return;
      
      // Trouver la carte à déplacer
      const card = document.querySelector(`.mcard[data-card-id="${cardId}"]`);
      if (!card) return;
      
      // Trouver la position d'insertion
      const afterElement = getDragAfterElement(content, e.clientY);
      
      // Insérer la carte à la bonne position
      if (afterElement) {
        content.insertBefore(card, afterElement);
      } else {
        content.appendChild(card);
      }
      
      // Mettre à jour les données
      cardsData[cardId].columnIndex = colIndex;
      
      // Mettre à jour les classes spéciales
      card.classList.remove('in-attente-column', 'in-expedition-column');
      if (colIndex === 7) card.classList.add('in-attente-column');
      if (colIndex === 6) card.classList.add('in-expedition-column');
      
      // Sauvegarder dans Firebase
      saveCardToFirebase(cardId);
      
      // Mettre à jour les compteurs
      updateColumnCounts();
      
      showToast(`✅ Carte déplacée vers ${COLUMNS[colIndex]?.name || 'colonne ' + colIndex}`);
    });
  });
  
  console.log('✅ Drop zones moulage initialisées');
}

// Trouver l'élément après lequel insérer
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.mcard:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Nettoyer les notes corrompues (base64, HTML cassé, etc.)
function cleanCorruptedNotes(dataObj, dbPath) {
  let cleaned = 0;
  
  Object.keys(dataObj).forEach(id => {
    const item = dataObj[id];
    if (!item) return;
    
    // Vérifier le champ notes
    if (item.notes && typeof item.notes === 'string') {
      const originalNotes = item.notes;
      let cleanedNotes = item.notes;
      
      // Supprimer les données base64 d'images
      if (cleanedNotes.includes('data:image/') || cleanedNotes.includes('base64,')) {
        // Supprimer les balises img avec base64
        cleanedNotes = cleanedNotes.replace(/<img[^>]*src=["']data:image[^"']*["'][^>]*>/gi, '');
        // Supprimer les data:image standalone
        cleanedNotes = cleanedNotes.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[Image supprimée]');
      }
      
      // Supprimer les balises HTML cassées ou vides
      cleanedNotes = cleanedNotes.replace(/<div[^>]*><\/div>/gi, '');
      cleanedNotes = cleanedNotes.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>');
      cleanedNotes = cleanedNotes.replace(/^\s*<br\s*\/?>\s*/gi, '');
      cleanedNotes = cleanedNotes.replace(/\s*<br\s*\/?>\s*$/gi, '');
      
      // Supprimer les séquences de -- répétées
      cleanedNotes = cleanedNotes.replace(/--\s*--/g, '--');
      
      // Nettoyer les espaces multiples
      cleanedNotes = cleanedNotes.replace(/\s{3,}/g, ' ');
      
      // Si nettoyé, mettre à jour
      if (cleanedNotes !== originalNotes) {
        item.notes = cleanedNotes;
        cleaned++;
        
        // Sauvegarder si Firebase disponible
        if (firebaseDb && dbPath) {
          firebaseDb.ref(dbPath + '/' + id + '/notes').set(cleanedNotes);
        }
      }
    }
    
    // Pour les jobs, vérifier aussi questions et response
    if (item.questions && typeof item.questions === 'string') {
      if (item.questions.includes('data:image/') || item.questions.includes('base64,')) {
        item.questions = item.questions.replace(/<img[^>]*src=["']data:image[^"']*["'][^>]*>/gi, '');
        item.questions = item.questions.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[Image supprimée]');
        if (firebaseDb && dbPath) {
          firebaseDb.ref(dbPath + '/' + id + '/questions').set(item.questions);
        }
        cleaned++;
      }
    }
    
    if (item.response && typeof item.response === 'string') {
      if (item.response.includes('data:image/') || item.response.includes('base64,')) {
        item.response = item.response.replace(/<img[^>]*src=["']data:image[^"']*["'][^>]*>/gi, '');
        item.response = item.response.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[Image supprimée]');
        if (firebaseDb && dbPath) {
          firebaseDb.ref(dbPath + '/' + id + '/response').set(item.response);
        }
        cleaned++;
      }
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 ${cleaned} notes nettoyées dans ${dbPath}`);
  }
}

// Creer element carte
function createCardElement(cardId, cardData) {
  const card = document.createElement('div');
  card.className = 'mcard';
  card.dataset.cardId = cardId;
  card.draggable = true; // Activer le drag
  
  // Classe region
  if (cardData.region === 'Quebec' || cardData.region === 'Québec') card.classList.add('region-qc');
  else if (cardData.region === 'Canada anglais' || cardData.region === 'Ontario') card.classList.add('region-on');
  else if (cardData.region === 'Maritime') card.classList.add('region-ma');
  
  if (cardData.columnIndex === 7) card.classList.add('in-attente-column');
  if (cardData.columnIndex === 6) card.classList.add('in-expedition-column');
  
  // Calculer delai
  const delayInfo = getDelayInfo(cardData);
  const regionText = cardData.region || '--';
  
  // Nom et commande: verrouillés si déjà remplis
  // Champs nom et commande - modification libre
  
  card.innerHTML = `
    <div class="priority-badge hidden" data-priority="0"></div>
    <div class="mcard-header">
      <div class="mcard-info">
        <div class="mcard-title-line">
          <input type="text" class="mcard-title" value="${cardData.name || 'Nom (Bénéficiaire)'}" data-field="name">
        </div>
        <div class="mcard-order-line">
          <span class="mcard-region-pill" onclick="openPriorityMenu('${cardId}', event)" title="Cliquer pour priorite">${regionText}</span>
          <input type="text" class="mcard-order" value="${cardData.order || '000000'}" data-field="order" maxlength="6">
          <button class="mcard-fiche-btn" data-action="open-fiche" data-card-id="${cardId}" title="Ouvrir la fiche">Fiche</button>
        </div>
      </div>
    </div>
    <div class="mcard-separator"></div>
    <div class="${delayInfo.classes}" onclick="openDelaiMenu('${cardId}', event)"><span>${delayInfo.text}</span></div>
    <div class="mcard-footer-buttons">
      <button class="mcard-btn mcard-btn-move">Deplacer</button>
      <button class="mcard-btn mcard-btn-delete">Supprimer</button>
    </div>
  `;
  
  // Événements de drag
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', cardId);
    card.classList.add('dragging');
    setTimeout(() => card.style.opacity = '0.5', 0);
  });
  
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.style.opacity = '1';
    document.querySelectorAll('.col-content.drag-over').forEach(el => el.classList.remove('drag-over'));
    // Cacher l'indicateur de drop
    if (dropIndicator) dropIndicator.style.display = 'none';
  });
  
  return card;
}

// Mettre a jour carte existante
function updateExistingCard(card, cardId, cardData) {
  const titleInput = card.querySelector('.mcard-title');
  const orderInput = card.querySelector('.mcard-order');
  if (titleInput) titleInput.value = cardData.name || 'Nom (Bénéficiaire)';
  if (orderInput) orderInput.value = cardData.order || '000000';
  
  // Mettre a jour region
  card.classList.remove('region-qc', 'region-on', 'region-ma', 'in-attente-column', 'in-expedition-column');
  if (cardData.region === 'Quebec' || cardData.region === 'Québec') card.classList.add('region-qc');
  else if (cardData.region === 'Canada anglais' || cardData.region === 'Ontario') card.classList.add('region-on');
  else if (cardData.region === 'Maritime') card.classList.add('region-ma');
  if (cardData.columnIndex === 7) card.classList.add('in-attente-column');
  if (cardData.columnIndex === 6) card.classList.add('in-expedition-column');
  
  // Mettre a jour pastille delai
  const delayPill = card.querySelector('.mcard-delay-pill');
  const delaySpan = delayPill?.querySelector('span');
  if (delayPill && delaySpan) {
    delayPill.className = 'mcard-delay-pill';
    const delayInfo = getDelayInfo(cardData);
    delaySpan.textContent = delayInfo.text;
    delayInfo.classes.split(' ').forEach(c => { if (c) delayPill.classList.add(c); });
  }
  
  // Deplacer si necessaire
  const columns = document.querySelectorAll('.col');
  const currentCol = card.closest('.col');
  const targetCol = columns[cardData.columnIndex || 0];
  if (currentCol !== targetCol && targetCol) {
    const content = targetCol.querySelector('.col-content');
    if (content) content.appendChild(card);
  }
}

// Calculer info delai
function getDelayInfo(cardData) {
  const isAttente = cardData.columnIndex === 7;
  const isExpedition = cardData.columnIndex === 6;
  
  if (cardData.expedie && cardData.dateExpedition) {
    return { text: `Expédié ${cardData.dateExpedition}`, classes: 'mcard-delay-pill expedie' };
  }
  
  if (isAttente) {
    let classes = 'mcard-delay-pill';
    if (cardData.raisonAttente && cardData.attenteActive) classes += ' attente-active';
    return { text: cardData.raisonAttente || '? Raison', classes };
  }
  
  if (isExpedition) {
    return { text: '📦 Expédier', classes: 'mcard-delay-pill expedition-ready' };
  }
  
  // Calculer jours restants
  const hasValidDateRobot = cardData.dateRobot && cardData.dateRobot !== '' && cardData.dateRobot !== 'AAAA-MM-JJ';
  
  if (hasValidDateRobot) {
    const joursRestants = calculateRemainingDelay(cardData);
    
    if (joursRestants < 0) {
      const joursRetard = Math.abs(joursRestants);
      return { text: `${joursRetard} jour${joursRetard > 1 ? 's' : ''} retard`, classes: 'mcard-delay-pill delai-retard' };
    } else if (joursRestants === 0) {
      return { text: "Aujourd'hui!", classes: 'mcard-delay-pill delai-retard' };
    } else {
      let colorClass = 'delai-vert';
      if (joursRestants <= 3) colorClass = 'delai-rouge';
      else if (joursRestants <= 10) colorClass = 'delai-jaune';
      return { text: `${joursRestants} jour${joursRestants > 1 ? 's' : ''} ouvrable${joursRestants > 1 ? 's' : ''}`, classes: `mcard-delay-pill ${colorClass}` };
    }
  } else {
    const delaiTotal = cardData.delaiPersonnalise || MENU_DATA.delays[cardData.region] || 90;
    return { text: `${delaiTotal} jours ouvrables`, classes: 'mcard-delay-pill delai-vert' };
  }
}

// Calculer jours restants
function calculateRemainingDelay(cardData) {
  if (cardData.expedie) return 0;
  
  const delaiTotal = cardData.delaiPersonnalise || MENU_DATA.delays[cardData.region] || 90;
  const dateRobotStr = cardData.dateRobot;
  
  if (!dateRobotStr || dateRobotStr === '' || dateRobotStr === 'AAAA-MM-JJ') {
    return delaiTotal;
  }
  
  const dateRobot = new Date(dateRobotStr + 'T00:00:00');
  if (isNaN(dateRobot.getTime())) return delaiTotal;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let joursOuvrablesEcoules = compterJoursOuvrables(dateRobot, today);
  
  // Soustraire temps en essayage
  if (cardData.tracking && cardData.tracking.essayage) {
    const essayage = cardData.tracking.essayage;
    if (essayage.entree && essayage.sortie) {
      const dateEntree = new Date(essayage.entree + 'T00:00:00');
      const dateSortie = new Date(essayage.sortie + 'T00:00:00');
      if (!isNaN(dateEntree.getTime()) && !isNaN(dateSortie.getTime())) {
        const joursEssayage = compterJoursOuvrables(dateEntree, dateSortie);
        joursOuvrablesEcoules -= joursEssayage;
        if (joursOuvrablesEcoules < 0) joursOuvrablesEcoules = 0;
      }
    }
  }
  
  return delaiTotal - joursOuvrablesEcoules;
}

// Compter jours ouvrables
function compterJoursOuvrables(dateDebut, dateFin) {
  const debut = new Date(dateDebut + 'T12:00:00'); // Midi pour éviter décalage timezone
  const fin = new Date(dateFin + 'T12:00:00');
  debut.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  
  if (fin <= debut) return 0;
  
  let count = 0;
  const current = new Date(debut);
  current.setDate(current.getDate() + 1);
  
  while (current <= fin) {
    const dayOfWeek = current.getDay();
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !QUEBEC_HOLIDAYS.includes(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Attacher evenements carte
function attachCardEvents(card) {
  const cardId = card.dataset.cardId;
  
  // Événements de drag pour le déplacement entre colonnes
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', cardId);
    card.classList.add('dragging');
    setTimeout(() => card.style.opacity = '0.5', 0);
  });
  
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.style.opacity = '1';
    document.querySelectorAll('.col-content.drag-over').forEach(el => el.classList.remove('drag-over'));
    // Cacher l'indicateur de drop
    if (dropIndicator) dropIndicator.style.display = 'none';
  });
  
  // Input titre - modification directe sans confirmation
  const titleInput = card.querySelector('.mcard-title');
  titleInput?.addEventListener('focus', () => titleInput.select());
  titleInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); titleInput.blur(); } });
  titleInput?.addEventListener('blur', () => {
    if (cardsData[cardId]) {
      cardsData[cardId].name = titleInput.value || 'Nom (Bénéficiaire)';
      saveCardToFirebase(cardId);
    }
  });
  
  // Input commande - modification directe sans confirmation
  const orderInput = card.querySelector('.mcard-order');
  orderInput?.addEventListener('focus', () => orderInput.select());
  orderInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); orderInput.blur(); } });
  orderInput?.addEventListener('input', () => { orderInput.value = orderInput.value.replace(/[^0-9]/g, '').slice(0, 6); });
  orderInput?.addEventListener('blur', () => {
    if (cardsData[cardId]) {
      cardsData[cardId].order = orderInput.value || '000000';
      saveCardToFirebase(cardId);
    }
  });
  
  // Bouton Fiche
  const ficheBtn = card.querySelector('.mcard-fiche-btn');
  ficheBtn?.addEventListener('click', e => {
    e.stopPropagation();
    openFiche(card);
  });
  
  // Bouton Deplacer
  const moveBtn = card.querySelector('.mcard-btn-move');
  moveBtn?.addEventListener('click', e => {
    e.stopPropagation();
    openMoveMenu(cardId);
  });
  
  // Bouton Supprimer
  const deleteBtn = card.querySelector('.mcard-btn-delete');
  deleteBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showDeleteConfirm(card, cardId);
  });
}

// Variables pour la suppression
let cardToDelete = null;
let cardIdToDelete = null;

function showDeleteConfirm(card, cardId) {
  cardToDelete = card;
  cardIdToDelete = cardId;
  const name = cardsData[cardId]?.name || 'ce moulage';
  document.getElementById('confirmMessage').textContent = `Voulez-vous vraiment supprimer "${name}"?`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeDeleteConfirm() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  cardToDelete = null;
  cardIdToDelete = null;
}

function confirmDelete() {
  if (cardToDelete && cardIdToDelete) {
    const name = cardsData[cardIdToDelete]?.name || 'Inconnu';
    const notes = cardsData[cardIdToDelete]?.notes || '';
    
    // Effacer les images de Firebase Storage avant de supprimer la carte
    deleteImagesFromStorage(notes);
    
    cardToDelete.remove();
    delete cardsData[cardIdToDelete];
    updateColumnCounts();
    firebaseDb.ref('cards/' + cardIdToDelete).remove();
    showToast('Moulage "' + name + '" supprimé');
  }
  closeDeleteConfirm();
}

// Effacer les images de Firebase Storage à partir du HTML des notes
async function deleteImagesFromStorage(htmlContent) {
  if (!htmlContent || !firebase.storage) return;
  
  // Trouver toutes les URLs Firebase Storage dans le HTML
  const storageUrlRegex = /https:\/\/firebasestorage\.googleapis\.com\/[^"'\s<>]+/g;
  const matches = htmlContent.match(storageUrlRegex);
  
  if (!matches || matches.length === 0) return;
  
  console.log('🗑️ Suppression de', matches.length, 'image(s) de Firebase Storage...');
  
  const storage = firebase.storage();
  
  for (const url of matches) {
    try {
      // Créer une référence à partir de l'URL
      const imageRef = storage.refFromURL(url);
      await imageRef.delete();
      console.log('✅ Image supprimée:', imageRef.fullPath);
    } catch (error) {
      // Ignorer les erreurs (image déjà supprimée ou URL invalide)
      console.log('⚠️ Impossible de supprimer:', error.message);
    }
  }
}

// Exposer la fonction
