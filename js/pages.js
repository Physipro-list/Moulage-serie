          <div class="add-modal-field add-modal-field-full">
            <label>Représentante</label>
            <div class="add-field-with-btn">
              <select id="addMoulageRepresentant"></select>
              <button class="list-add-btn" onclick="openListManager('representantes', 'Représentantes')" title="Gérer">+</button>
            </div>
          </div>
          
        </div>
        <div class="add-modal-footer">
          <button class="add-btn-cancel" onclick="closeAddMoulageModal()">Annuler</button>
          <button class="add-btn-confirm" onclick="confirmAddMoulage()">Ajouter</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  populateAddMoulageSelects();
  
  // Reset tous les champs
  document.getElementById('addMoulageName').value = '';
  document.getElementById('addMoulageOrder').value = '';
  document.getElementById('addMoulageNumeroPO').value = '';
  document.getElementById('addMoulageSoumission').value = '';
  
  // Reset dates avec valeur par défaut pour Date reçue
  const today = new Date().toLocaleDateString('fr-CA');
  document.getElementById('addMoulageDateRecue').value = today;
  document.getElementById('addMoulageDateRecueDisplay').textContent = formatDateFR(today);
  document.getElementById('addMoulageDateRobot').value = '';
  document.getElementById('addMoulageDateRobotDisplay').textContent = '-- Sélectionner --';
  document.getElementById('addMoulageDateLivraison').value = '';
  document.getElementById('addMoulageDateLivraisonDisplay').textContent = '-- Sélectionner --';
  
  modal.classList.remove('hidden');
}

function closeAddMoulageModal() {
  const modal = document.getElementById('addMoulageModal');
  if (modal) modal.classList.add('hidden');
}

function populateAddMoulageSelects() {
  const clientSelect = document.getElementById('addMoulageClient');
  const regionSelect = document.getElementById('addMoulageRegion');
  const repSelect = document.getElementById('addMoulageRepresentant');
  const intSelect = document.getElementById('addMoulageIntervenant');
  
  if (clientSelect) {
    const clients = [...(customLists.moulageClients || [])].sort((a, b) => a.localeCompare(b, 'fr'));
    clientSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
      clients.map(c => '<option value="' + c + '">' + c + '</option>').join('');
  }
  
  if (regionSelect) {
    const regions = [...(customLists.regions || ['Quebec', 'Canada anglais', 'Maritime'])].sort((a, b) => a.localeCompare(b, 'fr'));
    regionSelect.innerHTML = regions.map(r => '<option value="' + r + '">' + r + '</option>').join('');
    regionSelect.value = 'Quebec';
  }
  
  if (repSelect) {
    const reps = [...(customLists.representantes || [])].sort((a, b) => a.localeCompare(b, 'fr'));
    repSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
      reps.map(r => '<option value="' + r + '">' + r + '</option>').join('');
  }
  
  if (intSelect) {
    const ints = [...(customLists.intervenants || [])].sort((a, b) => a.localeCompare(b, 'fr'));
    intSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
      ints.map(i => '<option value="' + i + '">' + i + '</option>').join('');
  }
}

function confirmAddMoulage() {
  const nameInput = document.getElementById('addMoulageName').value.trim();
  const name = nameInput || 'Sans nom';  // Valeur par défaut si vide
  const order = document.getElementById('addMoulageOrder').value.trim();
  const region = document.getElementById('addMoulageRegion').value || 'Quebec';
  const client = document.getElementById('addMoulageClient').value;
  const representant = document.getElementById('addMoulageRepresentant').value;
  const intervenant = document.getElementById('addMoulageIntervenant').value;
  const soumission = document.getElementById('addMoulageSoumission').value.trim();
  const numeroPO = document.getElementById('addMoulageNumeroPO').value.trim();
  const dateRecue = document.getElementById('addMoulageDateRecue').value;
  const dateRobot = document.getElementById('addMoulageDateRobot').value;
  const dateLivraison = document.getElementById('addMoulageDateLivraison').value;
  
  // Créer la carte (pas de validation obligatoire)
  const cardId = createCard(name, order || '000000', region, 0);
  
  // Ajouter les données supplémentaires
  if (cardsData[cardId]) {
    cardsData[cardId].client = client;
    cardsData[cardId].representant = representant;
    cardsData[cardId].intervenant = intervenant;
    cardsData[cardId].numeroSoumission = soumission;
    cardsData[cardId].numeroPO = numeroPO;
    cardsData[cardId].dateRecue = dateRecue;
    cardsData[cardId].dateRobot = dateRobot;
    cardsData[cardId].dateLivraison = dateLivraison;
    saveCardToFirebase(cardId);
  }
  
  closeAddMoulageModal();
  showToast('Moulage "' + name + '" créé avec succès!');
  
  // Rafraîchir la vue Robot si active
  if (isRobotViewActive && typeof renderRobotTable === 'function') {
    setTimeout(() => renderRobotTable(), 200);
  }
  
  // Mettre à jour les compteurs mobile
  if (typeof updateMobileMenuCounts === 'function') updateMobileMenuCounts();
  if (typeof displayAllMobileCards === 'function') displayAllMobileCards();
}

// ===== IMPORT JSON POUR MOULAGE =====
function handleImportMoulageJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const rawData = JSON.parse(e.target.result);
      
      // Déterminer si c'est un tableau ou un objet simple
      const moulages = Array.isArray(rawData) ? rawData : [rawData];
      
      let newValuesAdded = [];
      let createdCount = 0;
      let createdNames = [];
      
      // Ajouter valeur à une liste si nouvelle
      function addToListIfNew(listKey, value) {
        if (!value || value.trim() === '') return false;
        const trimmedValue = value.trim();
        
        if (!customLists[listKey]) customLists[listKey] = [];
        
        const exists = customLists[listKey].some(item => 
          item.toLowerCase() === trimmedValue.toLowerCase()
        );
        
        if (!exists) {
          customLists[listKey].push(trimmedValue);
          customLists[listKey].sort((a, b) => a.localeCompare(b, 'fr'));
          newValuesAdded.push(trimmedValue + ' (' + listKey + ')');
          return true;
        }
        return false;
      }
      
      // Traiter chaque moulage
      moulages.forEach(data => {
        // Ajouter les nouvelles valeurs aux listes
        if (data.client) addToListIfNew('moulageClients', data.client);
        if (data.representante || data.representant) addToListIfNew('representantes', data.representante || data.representant);
        if (data.intervenant) addToListIfNew('intervenants', data.intervenant);
        if (data.region) addToListIfNew('regions', data.region);
        
        // Créer la carte
        const name = data.name || data.nom || 'Sans nom';
        const order = data.order || data.commande || data.numeroCommande || '000000';
        const region = data.region || 'Quebec';
        
        const cardId = createCard(name, order, region, 0);
        
        // Ajouter toutes les données
        if (cardsData[cardId]) {
          cardsData[cardId].client = data.client || '';
          cardsData[cardId].representant = data.representante || data.representant || '';
          cardsData[cardId].intervenant = data.intervenant || '';
          cardsData[cardId].numeroSoumission = data.numeroSoumission || data.soumission || '';
          cardsData[cardId].numeroPO = data.numeroPO || data.po || '';
          cardsData[cardId].dateRecue = data.dateRecue || new Date().toLocaleDateString('fr-CA');
          cardsData[cardId].dateRobot = data.dateRobot || '';
          cardsData[cardId].dateLivraison = data.dateLivraison || data.livraison || '';
          cardsData[cardId].dateEssayage = data.dateEssayage || '';
          cardsData[cardId].item = data.item || '';
          cardsData[cardId].notes = data.notes || '';
          saveCardToFirebase(cardId);
          createdCount++;
          createdNames.push(name + ' (#' + order + ')');
        }
      });
      
      // Sauvegarder les listes si nouvelles valeurs
      if (newValuesAdded.length > 0) {
        saveCustomLists();
      }
      
      closeAddMoulageModal();
      
      // Rafraîchir
      if (isRobotViewActive && typeof renderRobotTable === 'function') {
        setTimeout(() => renderRobotTable(), 200);
      }
      
      // Message succès
      let msg = '';
      if (createdCount === 1) {
        msg = 'Moulage "' + createdNames[0] + '" créé!';
      } else {
        msg = createdCount + ' moulages créés:\n• ' + createdNames.slice(0, 10).join('\n• ');
        if (createdNames.length > 10) {
          msg += '\n• ... et ' + (createdNames.length - 10) + ' autres';
        }
      }
      
      if (newValuesAdded.length > 0) {
        msg += '\n\nNouvelles valeurs ajoutées aux listes:\n• ' + newValuesAdded.slice(0, 10).join('\n• ');
        if (newValuesAdded.length > 10) {
          msg += '\n• ... et ' + (newValuesAdded.length - 10) + ' autres';
        }
      }
      alert('✅ ' + msg);
      
    } catch (error) {
      console.error('Erreur import JSON:', error);
      alert('❌ Erreur lors de l\'import du JSON!\n\n' + error.message);
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

// ===== CALENDRIER UNIFIÉ =====
const CAL_MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const CAL_DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

let calState = { year: 0, month: 0, selected: '', callback: null, clearCallback: null, mode: 'modal', anchorEl: null };

function showCalendar(options = {}) {
  const { value = '', onSelect = null, onClear = null, mode = 'modal', anchor = null } = options;
  
  // Fermer tout calendrier existant
  closeCalendar();
  
  // Initialiser l'état - utiliser midi pour éviter les problèmes de fuseau horaire
  const d = value ? new Date(value + 'T12:00:00') : new Date();
  calState = { 
    year: d.getFullYear(), 
    month: d.getMonth(), 
    selected: value, 
    callback: onSelect, 
    clearCallback: onClear,
    mode: mode,
    anchorEl: anchor
  };
  
  // Créer le calendrier
  const cal = document.createElement('div');
  cal.id = 'unifiedCalendar';
  cal.className = mode === 'modal' ? 'cal-overlay' : 'cal-popup';
  cal.onclick = mode === 'modal' ? (e) => { if (e.target === cal) closeCalendar(); } : (e) => e.stopPropagation();
  
  const popup = document.createElement('div');
  popup.className = 'cal-container';
  popup.innerHTML = renderCalendarContent();
  
  if (mode === 'modal') {
    cal.appendChild(popup);
  } else {
    cal.appendChild(popup);
  }
  
  document.body.appendChild(cal);
  
  // Positionner si mode inline
  if (mode === 'inline' && anchor) {
    const rect = anchor.getBoundingClientRect();
    cal.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
    cal.style.top = Math.min(rect.bottom + 5, window.innerHeight - 320) + 'px';
  }
}

// Fonction pour obtenir la date locale au format YYYY-MM-DD sans décalage
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderCalendarContent() {
  const { year, month, selected } = calState;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Utiliser getLocalDateString pour éviter les décalages de fuseau horaire
  const today = getLocalDateString(new Date());
  
  let daysHtml = '';
  
  // Jours vides du début
  for (let i = 0; i < firstDay; i++) daysHtml += '<div class="cal-cell empty"></div>';
  
  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let cls = 'cal-cell';
    if (dateStr === today) cls += ' today';
    if (dateStr === selected) cls += ' selected';
    daysHtml += `<div class="${cls}" onclick="selectCalDate('${dateStr}')">${day}</div>`;
  }
  
  return `
    <div class="cal-header">
      <button onclick="navCal(-1)">◀</button>
      <span>${CAL_MONTHS[month]} ${year}</span>
      <button onclick="navCal(1)">▶</button>
    </div>
    <div class="cal-weekdays">${CAL_DAYS.map(d => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid">${daysHtml}</div>
    <div class="cal-footer">
      <button class="cal-btn today" onclick="selectCalDate('${today}')">Aujourd'hui</button>
      <button class="cal-btn clear" onclick="clearCalDate()">Effacer</button>
      <button class="cal-btn close" onclick="closeCalendar()">Fermer</button>
    </div>
  `;
}

function navCal(dir) {
  calState.month += dir;
  if (calState.month < 0) { calState.month = 11; calState.year--; }
  if (calState.month > 11) { calState.month = 0; calState.year++; }
  document.querySelector('#unifiedCalendar .cal-container').innerHTML = renderCalendarContent();
}

function selectCalDate(dateStr) {
  if (calState.callback) calState.callback(dateStr);
  closeCalendar();
}

function clearCalDate() {
  if (calState.clearCallback) calState.clearCallback();
  else if (calState.callback) calState.callback('');
  closeCalendar();
}

function closeCalendar() {
  document.getElementById('unifiedCalendar')?.remove();
}

// Format date FR - corrigé pour éviter les décalages
function formatDateFR(dateStr) {
  if (!dateStr) return '-- Sélectionner --';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ===== COMPATIBILITÉ ANCIEN CODE =====
// Calendrier popup (fiche moulage)
function openCalendarPopup(targetId) {
  const hiddenInput = document.getElementById(targetId);
  const currentValue = hiddenInput?.value || '';
  
  showCalendar({
    value: currentValue,
    mode: 'modal',
    onSelect: (dateStr) => {
      if (hiddenInput) hiddenInput.value = dateStr;
      const displayEl = document.getElementById(targetId + 'Display');
      if (displayEl) displayEl.textContent = formatDateFR(dateStr);
    }
  });
}
function closeCalendarPopup() { closeCalendar(); }
function calendarPrev() { navCal(-1); }
function calendarNext() { navCal(1); }
function calendarToday() { selectCalDate(new Date().toLocaleDateString('fr-CA')); }
function calendarClear() { clearCalDate(); }
function selectCalendarDate(dateStr) { selectCalDate(dateStr); }

// Calendrier table (vue Robot)
function showTableCalendar(cardId, field, cell) {
  const currentDate = cardsData[cardId]?.[field] || '';
  
  showCalendar({
    value: currentDate,
    mode: 'inline',
    anchor: cell,
    onSelect: (dateStr) => {
      if (cardsData[cardId]) {
        cardsData[cardId][field] = dateStr;
        saveCardToFirebase(cardId);
        renderRobotTable();
      }
    }
  });
}

// ===== NAVIGATION PAGES =====
let currentPage = 'moulages';

// Configuration des pages
const pageConfig = {
  'moulages': {
    logoText: 'Moulage',
    title: 'Outil de gestion des moulages',
    addBtn: '+ Ajouter moulage',
    showSearch: true
  },
  'serie': {
    logoText: 'Série+',
    title: 'Outil de gestion des séries',
    addBtn: '+ Ajouter commande',
    showSearch: false
  },
  'inventaire': {
    logoText: 'Inventaire',
    title: 'Outil de gestion de l\'inventaire',
    addBtn: '+ Ajouter inventaire',
    showSearch: true
  },
  'jobs': {
    logoText: 'Job en attente',
    title: 'Outil de gestion des jobs en attente',
    addBtn: '+ Ajouter job en attente',
    showSearch: true
  },
  'calculateur': {
    logoText: 'Calculateur',
    title: 'Calculateur de temps de production',
    addBtn: '',
    showSearch: false
  },
  'psm': {
    logoText: 'PSM',
    title: 'Produits Sur Mesure',
    addBtn: '🖨️ Imprimer',
    showSearch: false
  },
  'atm': {
    logoText: 'ATM',
    title: 'Gestion ATM',
    addBtn: '+ Ajouter ATM',
    showSearch: true
  }
};

// Vérifier si l'utilisateur a accès à une page
function canAccessPage(pageName) {
  if (!currentUser) return false;
  const allowedPages = currentUser.allowedPages || ['all'];
  if (allowedPages.includes('all')) return true;
  
  // Mapper les noms de page internes aux noms de permission
  const pageMapping = {
    'moulages': 'Moulages',
    'serie': 'Série+',
    'inventaire': 'Inventaire',
    'jobs': 'Jobs',
    'calculateur': 'Calculateur',
    'psm': 'PSM',
    'atm': 'ATM'
  };
  
  return allowedPages.includes(pageMapping[pageName] || pageName);
}

function updateLogoMenu() {
  const menu = document.getElementById('logoMenu');
  if (!menu) return;
  
  // URL du logo PhysiPro
  const logoUrl = 'https://raw.githubusercontent.com/Physipro-list/Physipro-serie/main/logo-physiprodemi1.png';
  
  const pageBadges = {
    // Aucun badge pour le moment
  };
  
  // Couleurs pour les noms de pages
  const pageColors = {
    'moulages': '#ffffff',      // Blanc (par défaut)
    'serie': '#22c55e',         // Vert
    'inventaire': '#60a5fa',    // Bleu
    'jobs': '#ef4444',          // Rouge
    'calculateur': '#a855f7',   // Violet/Mauve
    'psm': '#3b82f6',           // Bleu PhysiPro
    'atm': '#f97316'            // Orange
  };
  
  // Vider le menu complètement
  menu.innerHTML = '';
  
  // Pas de header dans le nouveau design horizontal
  
  Object.keys(pageConfig).forEach(page => {
    // Ne pas afficher la page actuelle dans le menu
    if (page === currentPage) return;
    
    // Vérifier si l'utilisateur peut accéder à cette page
    if (canAccessPage(page)) {
      const badge = pageBadges[page] ? `<span class="logo-menu-badge">${pageBadges[page]}</span>` : '';
      const textColor = pageColors[page] || '#ffffff';
      
      const item = document.createElement('div');
      item.className = 'logo-menu-item';
      item.innerHTML = `
        <img class="logo-menu-icon-img" src="${logoUrl}" alt="${pageConfig[page].logoText}"/>
        <span class="logo-menu-text" style="color: ${textColor};">${pageConfig[page].logoText}</span>
        ${badge}
      `;
      item.onclick = function() { switchToPage(page); };
      menu.appendChild(item);
    }
  });
}

function switchToPage(page) {
  // Vérifier les permissions
  if (!canAccessPage(page)) {
    showToast('⛔ Accès non autorisé à cette page');
    return;
  }
  
  currentPage = page;
  const config = pageConfig[page];
  if (!config) return;
  
  // Mettre à jour le logo
  const logoText = document.getElementById('logoBottomText');
  if (logoText) logoText.textContent = config.logoText;
  
  // Mettre à jour le titre principal
  const titleEl = document.getElementById('pageMainTitle');
  if (titleEl) titleEl.textContent = config.title;
  
  // Mettre à jour le bouton d'ajout
  const addBtn = document.getElementById('btnAddItem');
  if (addBtn) addBtn.textContent = config.addBtn;
  
  // Gérer le bouton Tableau pour la page Inventaire (centré entre logo et recherche)
  let tableauContainer = document.getElementById('invTableauContainerCenter');
  if (page === 'inventaire' && currentUser?.role === 'admin') {
    if (tableauContainer) {
      tableauContainer.innerHTML = getInvTableauDropdownHTML();
      tableauContainer.classList.add('visible');
    }
  } else if (tableauContainer) {
    tableauContainer.classList.remove('visible');
    tableauContainer.innerHTML = '';
  }
  
  // Afficher/cacher la barre de recherche
  const searchRow = document.getElementById('searchRow');
  if (searchRow) searchRow.style.display = config.showSearch ? '' : 'none';
  
  // Effacer la recherche quand on change de page
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  if (searchInput) searchInput.value = '';
  if (searchClear) searchClear.classList.add('hidden');
  document.querySelectorAll('.mcard, .job-card, .cmd-card').forEach(c => c.style.display = '');
  
  // Mettre à jour le menu
  updateLogoMenu();
  
  // Cacher toutes les pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Afficher la page demandée
  const pageEl = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (pageEl) {
    pageEl.classList.add('active');
  }
  
  // Initialiser PSM si nécessaire
  if (page === 'psm') {
    initPsm();
  }
  
  // Initialiser Série+ si nécessaire
  if (page === 'serie') {
    initSeriePlus();
  }
  
  // Initialiser ATM si nécessaire
  if (page === 'atm') {
    initAtm();
  }
}

// Fonction appelée par le bouton d'ajout
function handleAddButton() {
  switch (currentPage) {
    case 'moulages':
      showAddMoulageModal();
      break;
    case 'jobs':
      showAddJobModal();
      break;
    case 'serie':
      showCmdAddModal();
      break;
    case 'inventaire':
      openInvFiche();
      break;
    case 'psm':
      printPsm();
      break;
    case 'atm':
      showAddAtmModal();
      break;
  }
}

window.showAddMoulageModal = showAddMoulageModal;
window.closeAddMoulageModal = closeAddMoulageModal;
window.confirmAddMoulage = confirmAddMoulage;
window.handleImportMoulageJson = handleImportMoulageJson;
window.switchToPage = switchToPage;
window.showPage = switchToPage; // Alias
window.canAccessPage = canAccessPage;
window.handleAddButton = handleAddButton;
window.openCalendarPopup = openCalendarPopup;
window.closeCalendarPopup = closeCalendarPopup;
window.calendarPrev = calendarPrev;
window.calendarNext = calendarNext;
window.calendarToday = calendarToday;
window.calendarClear = calendarClear;
window.selectCalendarDate = selectCalendarDate;
window.formatDateFR = formatDateFR;
window.createCard = createCard;
window.generateCardId = generateCardId;
window.showCalendar = showCalendar;
window.closeCalendar = closeCalendar;
window.navCal = navCal;
window.selectCalDate = selectCalDate;
window.clearCalDate = clearCalDate;


// =============================================================================

// =============================================================================

// =============================================================================
// PAGE CALCULATEUR DE TEMPS
// =============================================================================

// Base de données des codes PhysiPro (763 codes)
const CALC_CODES_DATA = [{"code": "AT5000", "description": "Appui-tête simple 7\"×4\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5005", "description": "Appui-tête simple 8\"x5\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5010", "description": "Appui-tête simple 9\"x6\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5030", "description": "Appui-tête combiné 6\"×4½\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5041", "description": "Appui-tête combiné 8\"×6\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5056", "description": "Appui-tête personnalisé", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5060", "description": "Prolongement latéral intégré", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5070", "description": "Appui-tête à prolongements latéraux 6\"x5½\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5090", "description": "Bandeau frontal néoprène 14\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5106", "description": "Bandeau frontal néoprène 22\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5115", "description": "Support appui-tête multi-réglable droit", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5120", "description": "Support appui-tête multi-réglable déporté", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5135", "description": "Ancrage externe 13\"-18\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5140", "description": "Ancrage interne ¾\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5155", "description": "Ancrage interne 1\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5196", "description": "Barre de tension pliable avec ancrage 12\"-15\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5197", "description": "Barre de tension pliable avec ancrage 15\"-18\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5198", "description": "Barre de tension pliable avec ancrage 18\"-22\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "AT5330", "description": "Prolongement latéral réglable", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5450", "description": "Support appui-tête SYMBIO", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5455", "description": "Support appui-tête pédiatrique", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "AT5530", "description": "Ensemble Symbio et appui-tête 7\"x4\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "AT5531", "description": "Ensemble Symbio et appui-tête 8\"x5\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "AT5532", "description": "Ensemble Symbio et appui-tête 9\"x6\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "AT5533", "description": "Ensemble Symbio et appui-tête personnalisé", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "AT5720", "description": "Appui-tête simple 14\"×7\"", "categorie": "Appui-tête", "temps_minutes": 0}, {"code": "BP-0.5U-M", "description": "FIPS Sunmate moyen ½ unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "BP-0.5U-S", "description": "FIPS Sunmate mou ½ unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "BP-0.5U-XS", "description": "FIPS Sunmate extra-mou ½ unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "BP-1U-M", "description": "FIPS Sunmate moyen 1 unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "BP-1U-S", "description": "FIPS Sunmate mou 1 unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "BP-1U-XS", "description": "FIPS Sunmate extra-mou 1 unité", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "CINCH1416", "description": "Contour Cinch 14\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1418", "description": "Contour Cinch 14\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1420", "description": "Contour Cinch 14\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1516", "description": "Contour Cinch 15\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1518", "description": "Contour Cinch 15\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1520", "description": "Contour Cinch 15\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1616", "description": "Contour Cinch 16\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1618", "description": "Contour Cinch 16\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1620", "description": "Contour Cinch 16\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1716", "description": "Contour Cinch 17\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1718", "description": "Contour Cinch 17\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1720", "description": "Contour Cinch 17\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1816", "description": "Contour Cinch 18\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1818", "description": "Contour Cinch 18\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1820", "description": "Contour Cinch 18\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1916", "description": "Contour Cinch 19\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1918", "description": "Contour Cinch 19\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH1920", "description": "Contour Cinch 19\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2016", "description": "Contour Cinch 20\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2018", "description": "Contour Cinch 20\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2020", "description": "Contour Cinch 20\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2116", "description": "Contour Cinch 21\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2118", "description": "Contour Cinch 21\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2120", "description": "Contour Cinch 21\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2216", "description": "Contour Cinch 22\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2218", "description": "Contour Cinch 22\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2220", "description": "Contour Cinch 22\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2316", "description": "Contour Cinch 23\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2318", "description": "Contour Cinch 23\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2320", "description": "Contour Cinch 23\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2416", "description": "Contour Cinch 24\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2418", "description": "Contour Cinch 24\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2420", "description": "Contour Cinch 24\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2516", "description": "Contour Cinch 25\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2518", "description": "Contour Cinch 25\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2520", "description": "Contour Cinch 25\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2616", "description": "Contour Cinch 26\"x16\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2618", "description": "Contour Cinch 26\"x18\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "CINCH2620", "description": "Contour Cinch 26\"x20\"", "categorie": "Dossier Contour Cinch", "temps_minutes": 0}, {"code": "D3200", "description": "Syst. Crochets/équerres 2 trous 3/4\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3205", "description": "Syst. Crochets/équerres 2 trous 7/8\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3210", "description": "Syst. Crochets/équerres 2 trous 1\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3215", "description": "Syst. Crochets/équerres 5 trous 3/4\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3220", "description": "Syst. Crochets/équerres 5 trous 7/8\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3225", "description": "Syst. Crochets/équerres 5 trous 1\"", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3245", "description": "Plaque plastique 1/4\" adulte", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3250", "description": "Plaque plastique 3/8\" adulte", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3255", "description": "Plaque aluminium 3/16\" adulte", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3260", "description": "Plaque plastique 1/4\" pédiatrique", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3265", "description": "Plaque plastique 3/8\" pédiatrique", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3270", "description": "Plaque aluminium 3/16\" pédiatrique", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3345", "description": "Stabilisateur fixe tube 1\"", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "D3350", "description": "Mousse Plastazote/Uréthane", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3355", "description": "Mousse Plastazote/T-38/Uréthane", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3360", "description": "Mousse Plastazote/Latex", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3365", "description": "Mousse Plastazote/Sunmate/Uréthane", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3380", "description": "Biseau thoracique - Constructa foam", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3385", "description": "Biseau thoracique - Uréthane", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3390", "description": "Biseau dorso-lombaire - Constructa foam", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3395", "description": "Biseau dorso-lombaire - Uréthane", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3400", "description": "Biseau lombaire - Constructa foam", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3405", "description": "Biseau lombaire - Uréthane", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3410", "description": "Butée sacro lombaire - Uréthane L:9½\" P:1\" H:10\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3415", "description": "Butée sacro lombaire - Uréthane L:9½\" P:1½\" H:11\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3420", "description": "Butée sacro lombaire - Uréthane L:9½\" P:2\" H:12\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3425", "description": "Butée sacro lombaire - Constructa L:9½\" P:1\" H:10\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3430", "description": "Butée sacro lombaire - Constructa L:9½\" P:1½\" H:11\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3435", "description": "Butée sacro lombaire - Constructa L:9½\" P:2\" H:12\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D3440", "description": "Appui-thoracique rigide droit #1", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3445", "description": "Appui-thoracique rigide droit #2", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3450", "description": "Appui-thoracique rigide droit #3", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3455", "description": "Appui-thoracique rigide droit #4", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3476", "description": "Appui-thoracique rigide droit personnalisé", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3500", "description": "Appui-thoracique rigide courbé #2", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3505", "description": "Appui-thoracique rigide courbé #3", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3510", "description": "Appui-thoracique rigide courbé #4", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3511", "description": "Appui-thoracique rigide courbé personnalisé", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3535", "description": "Appui-thoracique rigide englobant #1", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3540", "description": "Appui-thoracique rigide englobant #2", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3545", "description": "Appui-thoracique rigide englobant #3", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3550", "description": "Appui-thoracique rigide englobant #4", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3551", "description": "Appui-thoracique rigide englobant personnalisé", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D3851", "description": "Appui-thoracique réglable mini", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3852", "description": "Appui-thoracique réglable petit", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3853", "description": "Appui-thoracique réglable moyen", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3854", "description": "Appui-thoracique réglable grand", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3865", "description": "Courroie lombaire 1\"", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3866", "description": "Courroie lombaire sans coussin", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3868", "description": "Courroie lombaire 1.5\"", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D3869", "description": "Courroie lombaire 2\"", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D38699", "description": "Système courroies thoracique/support lombaire", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3895", "description": "Barre de tension pliable 14\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3900", "description": "Barre de tension pliable 16\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3905", "description": "Barre de tension pliable 18\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3910", "description": "Barre de tension pliable 20\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3975", "description": "Appui-thoracique façonné #1", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D3985", "description": "Appui-thoracique façonné #2", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D3995", "description": "Appui-thoracique AEH fixation velcro 14½\"H x 5½\"P", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D3995-V", "description": "Appui-thoracique façonné AEH #1", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D4005", "description": "Appui-thoracique AEH fixation velcro 14½\"H x 6½\"P", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D4005-V", "description": "Appui-thoracique façonné AEH #2", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D4045", "description": "Coussin d'appoint Néocor 12\" large", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D4050", "description": "Coussin d'appoint Néocor 14\" large", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D4060", "description": "Toile Velcro #1 14\"x16\"", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D4065", "description": "Toile Velcro #2 16\"x16\"", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D4070", "description": "Toile Velcro #3 18\"x16\"", "categorie": "Dossier Toile Velcro", "temps_minutes": 0}, {"code": "D4695", "description": "Recouvrement montants avec fermeture éclair", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D4700", "description": "Recouvrement montants sans fermeture éclair", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5200", "description": "Premium Standard avec fermeture éclair", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5208", "description": "Surcharge largeur ou hauteur > 20\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D5209", "description": "Dossier Axis", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D5211", "description": "Dossier Axis avec Surface Velcro", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D5216", "description": "Ajout d'appui thoracique réglable", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "D5217", "description": "Ajout appui thoracique réglable Valeo", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "D5250", "description": "Dossier Valdis", "categorie": "Dossier Valdis", "temps_minutes": 0}, {"code": "D5252", "description": "Ajout appui thoracique réglable Valdis", "categorie": "Dossier Valdis", "temps_minutes": 0}, {"code": "D5440", "description": "Premium Surface Velcro", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5445", "description": "Appui-thoracique rabattable grand", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5446", "description": "Appui-thoracique rabattable moyen", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5447", "description": "Appui-thoracique rabattable petit", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5448", "description": "Appui-thoracique rabattable mini", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5455", "description": "Mousse Plastazote/Sunmate/Sunmate mou", "categorie": "Dossier Modulaire Rigide", "temps_minutes": 0}, {"code": "D5650", "description": "Appui-thoracique réglable personnalisé", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D5655", "description": "Appui-thoracique rabattable personnalisé", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "D6000", "description": "Dossier Valeo standard 3/32\"", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "D6005", "description": "Dossier Valeo robuste 1/8\"", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "D6020", "description": "Appui-thoracique contour 7\"H x 6\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6025", "description": "Appui-thoracique contour 7\"H x 7\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6035", "description": "Appui-thoracique contour 8\"H x 6\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6040", "description": "Appui-thoracique contour 8\"H x 7\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6050", "description": "Appui-thoracique contour 9\"H x 6\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6055", "description": "Appui-thoracique contour 9\"H x 7\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6065", "description": "Appui-thoracique contour 7\"H x 6\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6070", "description": "Appui-thoracique contour 7\"H x 7\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6080", "description": "Appui-thoracique contour 8\"H x 6\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6085", "description": "Appui-thoracique contour 8\"H x 7\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6095", "description": "Appui-thoracique contour 9\"H x 6\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "D6100", "description": "Appui-thoracique contour 9\"H x 7\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "DV001D", "description": "Appui-thoracique droit 4\"H x 4\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV001G", "description": "Appui-thoracique droit 4\"H x 4\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV002D", "description": "Appui-thoracique droit 6\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV002G", "description": "Appui-thoracique droit 6\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV003D", "description": "Appui-thoracique droit 7\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV003G", "description": "Appui-thoracique droit 7\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV004D", "description": "Appui-thoracique droit 8\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV004G", "description": "Appui-thoracique droit 8\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV005D", "description": "Appui-thoracique droit 8\"H x 5½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV005G", "description": "Appui-thoracique droit 8\"H x 5½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV006D", "description": "Appui-thoracique droit 10\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV006G", "description": "Appui-thoracique droit 10\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV007D", "description": "Appui-thoracique droit 10\"H x 5½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DV007G", "description": "Appui-thoracique droit 10\"H x 5½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVMD", "description": "Appui-thoracique fixé aux montants - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVMG", "description": "Appui-thoracique fixé aux montants - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP001D", "description": "Appui-thoracique profilé 4\"H x 4\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP001G", "description": "Appui-thoracique profilé 4\"H x 4\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP002D", "description": "Appui-thoracique profilé 6\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP002G", "description": "Appui-thoracique profilé 6\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP003D", "description": "Appui-thoracique profilé 7\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP003G", "description": "Appui-thoracique profilé 7\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP004D", "description": "Appui-thoracique profilé 8\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP004G", "description": "Appui-thoracique profilé 8\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP005D", "description": "Appui-thoracique profilé 8\"H x 5½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP005G", "description": "Appui-thoracique profilé 8\"H x 5½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP006D", "description": "Appui-thoracique profilé 10\"H x 4½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP006G", "description": "Appui-thoracique profilé 10\"H x 4½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP007D", "description": "Appui-thoracique profilé 10\"H x 5½\"P - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVP007G", "description": "Appui-thoracique profilé 10\"H x 5½\"P - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVRD", "description": "Appui-thoracique ajustable Valeo D", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "DVRG", "description": "Appui-thoracique ajustable Valeo G", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "DVTD", "description": "Appui-thoracique droit personnalisé - Droite", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "DVTG", "description": "Appui-thoracique droit personnalisé - Gauche", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "GCP050-PZ-1/2/3", "description": "Gel plat - Installé au niveau de la cuvette", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "GCP050-UL-1/2/3", "description": "Gel plat - Installé au niveau de la cuvette", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "GEL-BMD01-2428", "description": "Gel Géo-Matrix Pillowtop", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-BMD04", "description": "Gel carrelé", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-CABA01", "description": "Gel pebble bleu petit", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-CABA02", "description": "Gel pebble bleu moyen", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-DG14145", "description": "Gel silicone 14\"×14\" ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-DG18185", "description": "Gel silicone 18\"×18\" ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-DG20205", "description": "Gel silicone 20\"×20\" ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "GEL-PEBA03", "description": "Gel pebble bleu grand", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "HPC", "description": "Dossier HP2 Contour", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPP", "description": "Dossier HP2 Profilé", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPS12", "description": "HP2 Sport 12\"x9\"", "categorie": "Dossier HP2 Sport", "temps_minutes": 0}, {"code": "HPS14", "description": "HP2 Sport 14\"x9\"", "categorie": "Dossier HP2 Sport", "temps_minutes": 0}, {"code": "HPS16", "description": "HP2 Sport 16\"x9\"", "categorie": "Dossier HP2 Sport", "temps_minutes": 0}, {"code": "HPS18", "description": "HP2 Sport 18\"x9\"", "categorie": "Dossier HP2 Sport", "temps_minutes": 0}, {"code": "HPT001D", "description": "Appui-thoracique réglable Pédiatrique 4\"H x 4\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT001G", "description": "Appui-thoracique réglable Pédiatrique 4\"H x 4\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT002D", "description": "Appui-thoracique réglable Mini 6\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT002G", "description": "Appui-thoracique réglable Mini 6\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT003D", "description": "Appui-thoracique réglable Petit 7\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT003G", "description": "Appui-thoracique réglable Petit 7\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT004D", "description": "Appui-thoracique réglable Moyen 8\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT004G", "description": "Appui-thoracique réglable Moyen 8\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT005D", "description": "Appui-thoracique réglable Large 10\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT005G", "description": "Appui-thoracique réglable Large 10\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT006D", "description": "Appui-thoracique réglable Moyen 8\"H x 5½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT006G", "description": "Appui-thoracique réglable Moyen 8\"H x 5½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT007D", "description": "Appui-thoracique réglable Large 10\"H x 5½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPT007G", "description": "Appui-thoracique réglable Large 10\"H x 5½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTD", "description": "Appui-thoracique réglable personnalisé - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTG", "description": "Appui-thoracique réglable personnalisé - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI001", "description": "Appui-thoracique intégré Pédiatrique - Paire", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI001D", "description": "Appui-thoracique intégré Pédiatrique - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI001G", "description": "Appui-thoracique intégré Pédiatrique - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI002", "description": "Appui-thoracique intégré Mini - Paire", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI002D", "description": "Appui-thoracique intégré Mini - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI002G", "description": "Appui-thoracique intégré Mini - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI003", "description": "Appui-thoracique intégré Petit - Paire", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI003D", "description": "Appui-thoracique intégré Petit - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI003G", "description": "Appui-thoracique intégré Petit - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI004", "description": "Appui-thoracique intégré Moyen - Paire", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI004D", "description": "Appui-thoracique intégré Moyen - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI004G", "description": "Appui-thoracique intégré Moyen - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI005", "description": "Appui-thoracique intégré Grand - Paire", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI005D", "description": "Appui-thoracique intégré Grand - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTI005G", "description": "Appui-thoracique intégré Grand - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR001D", "description": "Appui-thoracique rabattable Pédiatrique - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR001G", "description": "Appui-thoracique rabattable Pédiatrique - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR002D", "description": "Appui-thoracique rabattable Mini - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR002G", "description": "Appui-thoracique rabattable Mini - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR003D", "description": "Appui-thoracique rabattable Petit - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR003G", "description": "Appui-thoracique rabattable Petit - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR004D", "description": "Appui-thoracique rabattable Moyen 8\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR004G", "description": "Appui-thoracique rabattable Moyen 8\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR005D", "description": "Appui-thoracique rabattable Large 10\"H x 4½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR005G", "description": "Appui-thoracique rabattable Large 10\"H x 4½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR006D", "description": "Appui-thoracique rabattable Moyen 8\"H x 5½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR006G", "description": "Appui-thoracique rabattable Moyen 8\"H x 5½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR007D", "description": "Appui-thoracique rabattable Large 10\"H x 5½\"P - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTR007G", "description": "Appui-thoracique rabattable Large 10\"H x 5½\"P - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTRD", "description": "Appui-thoracique rabattable personnalisé - Droite", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPTRG", "description": "Appui-thoracique rabattable personnalisé - Gauche", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPX", "description": "Frais additionnel hauteur hors-standard", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "HPZ", "description": "Surcharge largeur ou hauteur > 20\"", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "LAF10-1/2/3", "description": "Mousse de finition - Latex", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "LF-30100-1", "description": "Uréthane LXA souple 1\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-30100-2", "description": "Uréthane LXA souple 2\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-30100-3", "description": "Uréthane LXA ferme 1\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-50100-1/2/3", "description": "Épaisseur du coussin 3\" (Latex 1\")", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "LF-50200-1/2/3", "description": "Épaisseur du coussin 4\" (Latex 2\")", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "LF-80050-1", "description": "Mousse mémoire extra-souple ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-80050-2", "description": "Mousse mémoire souple ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-80050-3", "description": "Mousse mémoire souple 1\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-80100-1", "description": "Temper T-38 ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-80100-2", "description": "Temper T-38 1\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-80100-3", "description": "Temper T-36 ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-82100-1", "description": "Latex 1\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-82100-2", "description": "Latex 2\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LF-82100-3", "description": "Viscose ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "LI8005", "description": "Toile velcro 57½\"×17\"", "categorie": "Appuis-thoraciques", "temps_minutes": 0}, {"code": "LI8070", "description": "Système appuis-thoraciques au lit complet", "categorie": "Appuis-thoraciques", "temps_minutes": 0}, {"code": "LI8075", "description": "Appui-thoracique droit", "categorie": "Appuis-thoraciques", "temps_minutes": 0}, {"code": "LI8080", "description": "Appui-thoracique gauche", "categorie": "Appuis-thoraciques", "temps_minutes": 0}, {"code": "LI8310", "description": "Coussin 1/2 bouée", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8320", "description": "Coussin universel petit", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8330", "description": "Coussin universel moyen", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8340", "description": "Coussin base cylindrique", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8350", "description": "Coussin positionnement talon", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8360", "description": "Coussin positionnement main", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8370", "description": "Coussin d'abduction", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8410", "description": "Coussin bouée forme circulaire", "categorie": "Positionnement au lit", "temps_minutes": 0}, {"code": "LI8465", "description": "Système anti-chute bilatéral (6 blocs + toile)", "categorie": "Système anti-chute", "temps_minutes": 0}, {"code": "LI8470", "description": "Système anti-chute unilatéral (3 blocs + toile)", "categorie": "Système anti-chute", "temps_minutes": 0}, {"code": "LI8475", "description": "Toile velcro pour blocs anti-chute 36\"x80\"", "categorie": "Système anti-chute", "temps_minutes": 0}, {"code": "LI8480", "description": "Bloc anti-chute 11.5\"x24\"x6\"", "categorie": "Système anti-chute", "temps_minutes": 0}, {"code": "MI7025", "description": "Équerre correctrice coussinée/pied", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7045", "description": "Palette appui-pied coussinée", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7046", "description": "Palette appui-pied ABS 1/4\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7050", "description": "Palette appui-pied avec antidérapant", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7055", "description": "Coussinage palette appui-pied", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7066", "description": "Boîte d'appuis-pieds", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7070", "description": "Boîte d'appuis-pieds structure ABS", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7085", "description": "Mécanisme multi réglable", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7115", "description": "Équerres (2 unités)", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7120", "description": "Courroie appui-mollet simple 4po", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7125", "description": "Courroie appui-mollet double 8po", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7130", "description": "Talonnière 2\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7131", "description": "Talonnière 4\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7133", "description": "Talonnière 4\" avec coussinage néoprène", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7135", "description": "Cale-pied", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7140", "description": "Chevillère #1 6.5\"-8.5\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7145", "description": "Chevillère #2 8.5\"-10\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7150", "description": "Chevillère #3 10\"-12.5\"", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7155", "description": "Coussin remplacement stabilisateur X petit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7160", "description": "Coussin remplacement stabilisateur petit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7165", "description": "Coussin remplacement stabilisateur moyen", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7181", "description": "Stabilisateur genou X petit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7182", "description": "Stabilisateur genou petit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7183", "description": "Stabilisateur genou moyen", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7195", "description": "Courroie stabilisatrice aux genoux", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7215", "description": "Protège-genou droit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7220", "description": "Protège-genou gauche", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7230", "description": "Bottine rigide petite", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7235", "description": "Bottine rigide moyenne", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7240", "description": "Bottine rigide grande", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7245", "description": "Bottine rigide personnalisée", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7250", "description": "Courroie au pied", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7256", "description": "Appui-moignon standard", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7262", "description": "Appui-moignon standard", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7267", "description": "Appui-moignon multi-réglable 7\"×8\"", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7268", "description": "Appui-moignon multi-réglable 8\"×11\"", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7288", "description": "Palette pleine largeur ABS antidérapant", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7289", "description": "Palette pleine largeur ABS", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7290", "description": "Palette pleine largeur coussinée ABS", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7295", "description": "Coussinage palette pleine largeur", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7300", "description": "Gaine protectrice pleine longueur", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7301", "description": "Gaine protectrice genou oeillet gauche", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7302", "description": "Gaine protectrice genou velcro droit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7303", "description": "Gaine protectrice genou velcro gauche", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7304", "description": "Gaine protectrice genou oeillet droit", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7320", "description": "Appui-moignon profilé", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7385", "description": "Appui-moignon personnalisé", "categorie": "Appui-moignon", "temps_minutes": 0}, {"code": "MI7443", "description": "Gaine protectrice non-standard", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7480", "description": "Gaine protectrice plaque siège rigide", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7520", "description": "Courroie appui-mollet simple avec gel", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7525", "description": "Courroie appui-mollet double avec gel", "categorie": "Membres inférieurs", "temps_minutes": 0}, {"code": "MI7550", "description": "Gaine protectrice traverse Neox Dynamic petite", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7555", "description": "Gaine protectrice traverse Neox Dynamic moyenne", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7560", "description": "Gaine protectrice traverse Neox Dynamic grande", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7575-D", "description": "Gaine protectrice repose-jambe élévateur droit", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7575-L", "description": "Gaine protectrice repose-jambe élévateur gauche", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7600", "description": "Gaine protectrice XL châssis", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7605", "description": "Gaine protectrice XL-Hémi", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7610", "description": "Gaine protectrice Neox", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "MI7615", "description": "Gaine protectrice universelle", "categorie": "Gaines protectrices", "temps_minutes": 0}, {"code": "NS75", "description": "Insert Roho 7×5 cellules", "categorie": "Inserts", "temps_minutes": 0}, {"code": "NS85", "description": "Insert Roho 8×5 cellules", "categorie": "Inserts", "temps_minutes": 0}, {"code": "NS85-DV", "description": "Insert Roho Standard 8×5 cellules", "categorie": "Inserts", "temps_minutes": 0}, {"code": "NS95", "description": "Insert Roho Bariatrique 9×5 cellules", "categorie": "Inserts", "temps_minutes": 0}, {"code": "NS95-DV", "description": "Insert Roho Bariatrique DV", "categorie": "Inserts", "temps_minutes": 0}, {"code": "PH-00174", "description": "Glissière de table en ABS gauche", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "PH-00175", "description": "Glissière de table en ABS droite", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "PH-02341", "description": "Option extension (1\" additionnel en largeur)", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "PH-05862", "description": "Glissières réglables en U épaisse", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "PH-05882", "description": "Glissières réglables en U mince", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "PH-05883", "description": "Glissières réglables en L épaisse", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "PH-05884", "description": "Glissières réglables en L mince", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "PHY60", "description": "Densité base souple 3.4", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "PHY75", "description": "Densité base ferme 4.5", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "PVB40630", "description": "Segufix", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "PZ5525-1/2", "description": "Base en mousse - Uréthane Densité souple", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "PZ7525-1/2/3", "description": "Base en mousse - Uréthane Densité ferme", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1000", "description": "Siège conventionnel plastique 1/4\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1005", "description": "Siège conventionnel plastique 3/8\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1010", "description": "Siège conventionnel aluminium 3/16\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1015", "description": "Siège profondeur inégale plastique 1/4\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1020", "description": "Siège profondeur inégale plastique 3/8\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1025", "description": "Siège profondeur inégale plastique 1/4\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1030", "description": "Siège profondeur inégale plastique 3/8\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1035", "description": "Siège profondeur inégale aluminium 3/16\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1040", "description": "Siège profondeur inégale aluminium 3/16\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1045", "description": "Siège réglable angle/profondeur plastique 1/4\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1050", "description": "Siège réglable angle/profondeur plastique 3/8\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1055", "description": "Siège réglable angle/profondeur aluminium 3/16\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1060", "description": "Siège réglable inégal plastique 1/4\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1065", "description": "Siège réglable inégal plastique 3/8\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1070", "description": "Siège réglable inégal plastique 1/4\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1075", "description": "Siège réglable inégal plastique 3/8\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1080", "description": "Siège réglable inégal aluminium 3/16\" droite", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1085", "description": "Siège réglable inégal aluminium 3/16\" gauche", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1095", "description": "Syst. ancrage crochets/équerres 2 trous 7/8\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1100", "description": "Syst. ancrage crochets/équerres 2 trous 1\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1110", "description": "Syst. ancrage crochets/équerres 5 trous 7/8\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1115", "description": "Syst. ancrage crochets/équerres 5 trous 1\"", "categorie": "Siège Rigide", "temps_minutes": 0}, {"code": "S1332-C3S-CA", "description": "Coupe anatomique C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-C3S-CPI", "description": "Coupe profondeur inégale C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-C3S-CSB-L", "description": "Coupe surbaissé gauche C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-C3S-CSB-R", "description": "Coupe surbaissé droite C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-C3S-DO", "description": "Coupe devant oblique C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-C3S-DS", "description": "Coupe dégagement sacrum C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1332-FUS-CA", "description": "Coupe anatomique Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-FUS-CPI", "description": "Coupe profondeur inégale Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-FUS-CSB-L", "description": "Coupe surbaissé gauche Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-FUS-CSB-R", "description": "Coupe surbaissé droite Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-FUS-DO", "description": "Coupe devant oblique Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-FUS-DS", "description": "Coupe dégagement sacrum Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1332-INS-CA", "description": "Coupe anatomique Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1332-INS-CPI", "description": "Coupe profondeur inégale Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1332-INS-CSB-L", "description": "Coupe surbaissé gauche Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1332-INS-CSB-R", "description": "Coupe surbaissé droite Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1332-INS-DO", "description": "Coupe devant oblique Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1332-LXA-CA", "description": "Coupe anatomique LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-LXA-CPI", "description": "Coupe profondeur inégale LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-LXA-CSB-L", "description": "Coupe surbaissé gauche LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-LXA-CSB-R", "description": "Coupe surbaissé droite LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-LXA-DA", "description": "Coupe devant arrondi LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-LXA-DO", "description": "Coupe devant oblique LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1332-PZ-CA", "description": "Coupe Anatomique - Abaissement de 1½\"", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1332-PZ-CSB-L", "description": "Coupe Surbaissé Gauche - Abaissement de 1½\"", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1332-PZ-CSB-R", "description": "Coupe Surbaissé Droite - Abaissement de 1½\"", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1332-PZ-DO", "description": "Coupe Devant oblique", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1332-PZ-PB", "description": "Coupe Profil Bas - Diminution du devant de 1\"", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1332-SK-CA", "description": "Coupe Anatomique", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1332-SK-CSB-L", "description": "Coupe Surbaissé Gauche", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1332-SK-CSB-R", "description": "Coupe Surbaissé Droite", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1332-SK-DO", "description": "Coupe Devant oblique", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1332-SK-PB", "description": "Coupe Profil Bas", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1332-TEF-CA", "description": "Coupe Anatomique", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-CSB-L", "description": "Coupe Surbaissé Gauche", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-CSB-R", "description": "Coupe Surbaissé Droite", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-DA", "description": "Coupe Devant arrondi", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-DO", "description": "Coupe Devant oblique", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-DS", "description": "Coupe Dégagement au sacrum", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-TEF-PB", "description": "Coupe Profil Bas", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1332-UL-CA", "description": "Coupe Anatomique", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1332-UL-CSB-L", "description": "Coupe Surbaissé Gauche", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1332-UL-CSB-R", "description": "Coupe Surbaissé Droite", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1332-UL-DO", "description": "Coupe Devant oblique", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1332-UL-PB", "description": "Coupe Profil Bas", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1900-AF", "description": "Installation plate Air Foam", "categorie": "Coussin Air Foam", "temps_minutes": 0}, {"code": "S1900-BR", "description": "Installation plate Brio", "categorie": "Coussin Brio", "temps_minutes": 0}, {"code": "S1900-C3S", "description": "Installation plate C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1900-EAS", "description": "Installation plate Easy Fit", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "S1900-ELL", "description": "Installation plate Ellipse", "categorie": "Coussin Ellipse", "temps_minutes": 0}, {"code": "S1900-FUS", "description": "Installation plate Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1900-INS", "description": "Installation plate Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1900-LXA", "description": "Installation plate LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1900-PHY", "description": "Installation plate Physiair", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "S1900-PZ", "description": "Installation Plate - Sans renfort en ABS", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1900-RES", "description": "Installation Plate", "categorie": "Coussin Resolve Air (avec appuis-pelviens)", "temps_minutes": 0}, {"code": "S1900-SK", "description": "Installation Plate - Sans renfort en ABS", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1900-TEF", "description": "Installation Plate - Sans renfort en ABS", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1900-UL", "description": "Installation Plate - Sans renfort en ABS", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S1901-AF", "description": "Installation encastrée Air Foam", "categorie": "Coussin Air Foam", "temps_minutes": 0}, {"code": "S1901-BR", "description": "Installation encastrée Brio", "categorie": "Coussin Brio", "temps_minutes": 0}, {"code": "S1901-C3S", "description": "Installation encastrée C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1901-ELL", "description": "Installation encastrée Ellipse", "categorie": "Coussin Ellipse", "temps_minutes": 0}, {"code": "S1901-FUS", "description": "Installation encastrée Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1901-INS", "description": "Installation encastrée Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1901-LXA", "description": "Installation encastrée LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1901-PHY", "description": "Installation encastrée Physiair", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "S1902-AF", "description": "Installation canevas Air Foam", "categorie": "Coussin Air Foam", "temps_minutes": 0}, {"code": "S1902-BR", "description": "Installation canevas Brio", "categorie": "Coussin Brio", "temps_minutes": 0}, {"code": "S1902-C3S", "description": "Installation canevas C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S1902-EAS", "description": "Installation canevas Easy Fit", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "S1902-ELL", "description": "Installation canevas Ellipse", "categorie": "Coussin Ellipse", "temps_minutes": 0}, {"code": "S1902-FUS", "description": "Installation canevas Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S1902-INS", "description": "Installation canevas Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S1902-LXA", "description": "Installation canevas LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S1902-PHY", "description": "Installation canevas Physiair", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "S1902-PZ", "description": "Installation Canevas - Sans renfort en ABS", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S1902-SK", "description": "Installation Canevas - Sans renfort en ABS", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S1902-TEF", "description": "Installation Canevas - Sans renfort en ABS", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S1902-UL", "description": "Installation Canevas - Sans renfort en ABS", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S2361", "description": "Coussin Contour Insert 2\"", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S2366", "description": "Coussin Contour Insert 3\"", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S2371", "description": "Coussin Contour Insert 4\"", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S2455", "description": "Coussin LXA standard", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S2465", "description": "Pellicule transparente", "categorie": "Accessoires coussins", "temps_minutes": 0}, {"code": "S2655", "description": "Biseau crural en pointe standard", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2655-4", "description": "Biseau crural en pointe - Non-standard", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2665", "description": "Biseau à couper vrac", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2670", "description": "Biseau crural plat", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2670-0.5", "description": "Biseau crural - Épaisseur ½\" (petit seulement)", "categorie": "Coussin Resolve (avec appuis-pelviens)", "temps_minutes": 0}, {"code": "S2670-1", "description": "Biseau crural plat - Épaisseur 1\"", "categorie": "Coussin Resolve Air (avec appuis-pelviens)", "temps_minutes": 0}, {"code": "S2670-4", "description": "Biseau crural pointe", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2675", "description": "Biseau fessier", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2680", "description": "Biseau fessier alt", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2685", "description": "Biseau anti-effet hamac en pointe standard", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2685-1", "description": "Canevas avec biseau anti-effet hamac en pointe 1\"", "categorie": "Coussin Resolve Air (avec appuis-pelviens)", "temps_minutes": 0}, {"code": "S2695", "description": "Biseau AEH plat", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2705", "description": "Biseau AEH pointe", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2724-0", "description": "Butée ABD stratifiée 0", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2724-1", "description": "Butée ABD stratifiée 1", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2724-2", "description": "Butée ABD stratifiée 2", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2724-3", "description": "Butée ABD stratifiée 3", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2725-0", "description": "Butée ABD velcro 0", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2725-1", "description": "Butée d'abduction à velcro - Uréthane L:3\" P:7\" H:2\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2725-2", "description": "Butée d'abduction à velcro - Uréthane L:4\" P:7\" H:2½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2725-3", "description": "Butée ABD velcro 3", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2725-P", "description": "Butée ABD velcro petit", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2726-0", "description": "Butée d'abduction à velcro - EVA foam Non-standard", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2726-1", "description": "Butée d'abduction à velcro - EVA foam L:3\" P:7\" H:2\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2726-2", "description": "Butée d'abduction à velcro - EVA foam L:4\" P:7\" H:2½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2726-3", "description": "Butée d'abduction à velcro - EVA foam L:5\" P:7\" H:3\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2726-P", "description": "Butée d'abduction à velcro - EVA foam L:2\" P:5\" H:2\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2740", "description": "Butée abduction vrac 3\"x44\"x2\"", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2745", "description": "Butée abduction vrac 4\"x44\"x2.5\"", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2750", "description": "Butée abduction vrac 5\"x44\"x3\"", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2755", "description": "Pommeau abduction 2½\"×3\"×3\"", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2760", "description": "Pommeau abduction 3\"×4\"×3\"", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2800", "description": "Mécanisme bouton pression", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2805", "description": "Mécanisme enclenchement rail", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2810", "description": "Pommeau abduction 4½\"×5\"×4\"", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2815", "description": "Mécanisme dégagement horizontal/vertical", "categorie": "Abduction", "temps_minutes": 0}, {"code": "S2821", "description": "Mécanisme adduction tubulure ⅞\"", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2826", "description": "Mécanisme adduction tubulure 1\"", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2828", "description": "Coussin adduction standard alt", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2828-GEL", "description": "Coussin adduction gel alt", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2829", "description": "Coussin adduction standard", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2829-GEL", "description": "Coussin adduction gel", "categorie": "Adduction", "temps_minutes": 0}, {"code": "S2861", "description": "Appui-pelvien amovible petit", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2866", "description": "Appui-pelvien amovible 1.5\" épaisseur", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2871", "description": "Appui-pelvien amovible 2\" épaisseur", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "S2883", "description": "Appui-pelvien amovible personnalisé", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2887", "description": "Appui-pelvien amovible grand", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2890-0", "description": "Appui-pelvien stratifié 0", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2890-1", "description": "Appui-pelvien stratifié 1", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2890-2", "description": "Appui-pelvien stratifié 2", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2890-3", "description": "Appui-pelvien stratifié 3", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2937", "description": "Plaque ABS ¼\" seul - H:5½\" P:9½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2938", "description": "Plaque ABS ¼\" avec système fixation sur plaque siège", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "S2950", "description": "Coussin Brio standard", "categorie": "Coussin Brio", "temps_minutes": 0}, {"code": "S2955", "description": "Coussin Fusion standard", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S2956", "description": "Coussin Fusion personnalisé", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S2965-0", "description": "Butée ADD stratifiée 0", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2965-1", "description": "Butée ADD stratifiée 1", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2965-2", "description": "Butée ADD stratifiée 2", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2965-3", "description": "Butée ADD stratifiée 3", "categorie": "Éléments forme", "temps_minutes": 0}, {"code": "S2980-AF", "description": "Renfort ABS Air Foam", "categorie": "Coussin Air Foam", "temps_minutes": 0}, {"code": "S2980-BR", "description": "Renfort ABS Brio", "categorie": "Coussin Brio", "temps_minutes": 0}, {"code": "S2980-C3S", "description": "Renfort ABS C3S", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S2980-EAS", "description": "Renfort ABS Easy Fit", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "S2980-ELL", "description": "Renfort ABS Ellipse", "categorie": "Coussin Ellipse", "temps_minutes": 0}, {"code": "S2980-FUS", "description": "Renfort ABS Fusion", "categorie": "Coussin Fusion", "temps_minutes": 0}, {"code": "S2980-INS", "description": "Renfort ABS Contour Insert", "categorie": "Coussin Contour Insert", "temps_minutes": 0}, {"code": "S2980-LXA", "description": "Renfort ABS LXA", "categorie": "Coussin LXA", "temps_minutes": 0}, {"code": "S2980-PHY", "description": "Renfort ABS Physiair", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "S2980-PZ", "description": "Installation Plate - Avec renfort en ABS", "categorie": "Coussin Pression Zéro", "temps_minutes": 0}, {"code": "S2980-SK", "description": "Installation Plate - Avec renfort en ABS", "categorie": "Coussin Siliko", "temps_minutes": 0}, {"code": "S2980-TEF", "description": "Installation Plate - Avec renfort en ABS", "categorie": "Coussin Temper-Flo", "temps_minutes": 0}, {"code": "S2980-UL", "description": "Installation Plate - Avec renfort en ABS", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "S2985", "description": "Coussin C3S standard", "categorie": "Coussin C3S", "temps_minutes": 0}, {"code": "S2991", "description": "Coussin Ellipse standard", "categorie": "Coussin Ellipse", "temps_minutes": 0}, {"code": "S3016", "description": "Insert mousse", "categorie": "Inserts", "temps_minutes": 0}, {"code": "S3033", "description": "Insert gel Géo-Matrix Pillowtop", "categorie": "Inserts", "temps_minutes": 0}, {"code": "S3035", "description": "Insert gel carrelé bleu", "categorie": "Inserts", "temps_minutes": 0}, {"code": "S3037", "description": "Insert gel pebble bleu", "categorie": "Inserts", "temps_minutes": 0}, {"code": "S4400", "description": "Pochette amovible velcro", "categorie": "Accessoires coussins", "temps_minutes": 0}, {"code": "S5000", "description": "Coussin Physiair standard", "categorie": "Coussin Physiair", "temps_minutes": 0}, {"code": "S5360", "description": "Coussin Air Foam standard", "categorie": "Coussin Air Foam", "temps_minutes": 0}, {"code": "S5400", "description": "Coussin Easy Fit standard", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "S5406", "description": "Mousse viscoélastique ½\" Easy Fit", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "S5408", "description": "Insert gel cuvette Easy Fit", "categorie": "Coussin Easy Fit", "temps_minutes": 0}, {"code": "SBS-1", "description": "Stimulite ½\" sans pellicule", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "SBS-5-XS", "description": "Stimulite 1\" avec pellicule", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "SC7500", "description": "Ceinture métal 2\"", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7505", "description": "Ceinture plastique 1\"", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7520", "description": "Ceinture plastique 2\"", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7540", "description": "Ceinture coussinée adulte", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7546", "description": "Ceinture coussinée enfant", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7550", "description": "Plastron hauteurs 3\"-7\" largeurs 4\"-12\"", "categorie": "Plastrons", "temps_minutes": 0}, {"code": "SC7590", "description": "Ceinture 4 pointes Y adulte plastique", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7594", "description": "Ceinture 4 pointes Y enfant métal 65°", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7595", "description": "Harnais poitrine homme petit", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7600", "description": "Harnais poitrine homme moyen", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7605", "description": "Harnais poitrine homme grand", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7610", "description": "Harnais poitrine femme petit", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7615", "description": "Harnais de poitrine souple femme - Moyen", "categorie": "Dossier HP2", "temps_minutes": 0}, {"code": "SC7620", "description": "Harnais poitrine femme grand", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7625", "description": "Harnais poitrine enfant", "categorie": "Ceintures", "temps_minutes": 0}, {"code": "SC7629", "description": "Plaque ancrage rigide", "categorie": "Plastrons", "temps_minutes": 0}, {"code": "SC7631", "description": "Plaque ancrage rigide alt", "categorie": "Plastrons", "temps_minutes": 0}, {"code": "SC7710-WB", "description": "Couche maintien standard boucles plastique", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "SC7710-WS", "description": "Couche maintien standard boutons pression", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "SC7710-WV", "description": "Couche maintien standard velcro", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "SC7712-WB", "description": "Couche maintien non-standard boucles plastique", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "SC7712-WS", "description": "Couche maintien non-standard boutons pression", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "SC7712-WV", "description": "Couche maintien non-standard velcro", "categorie": "Couche maintien", "temps_minutes": 0}, {"code": "ST-03753", "description": "Garniture d'appui-bras profilé gel #1", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "ST-52143", "description": "Garniture d'appui-bras profilé gel #2", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6010", "description": "Table surdimensionnée (Lexan)", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6015", "description": "Table standard (Lexan)", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6020", "description": "Courroie de retenue pour table", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6035", "description": "Demi-table rabattable standard droite", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6036", "description": "Demi-table rabattable non-standard droite", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6040", "description": "Demi-table rabattable standard gauche", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6041", "description": "Demi-table rabattable non-standard gauche", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6045", "description": "Extenseur de main", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6060", "description": "Coussin demi-table cuirette gauche", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6065", "description": "Coussin demi-table cuirette droit", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6076", "description": "Option couche de gel coude", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6145", "description": "Glissière de table en aluminium", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6160", "description": "Gouttière standard petit", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6161", "description": "Gouttière standard moyen", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6162", "description": "Gouttière standard grand", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6163", "description": "Gouttière standard non-standard", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6175", "description": "Courroie pour avant-bras", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6176", "description": "Gouttière avec gel petit", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6177", "description": "Gouttière avec gel moyen", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6178", "description": "Gouttière avec gel grand", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6180", "description": "Mécanisme d'ancrage à réglages multiples", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6183", "description": "Gouttière avec gel non-standard", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "TA6185", "description": "Garniture d'appui-bras coussiné standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6195", "description": "Garniture d'appui-bras coussiné non-standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6215", "description": "Bordure de table avant", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6216", "description": "Inhibiteur avant-bras central standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6217", "description": "Inhibiteur avant-bras latéral profilé standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6218", "description": "Bordure de table gauche", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6219", "description": "Bordure de table droit", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6220", "description": "Équerre de blocage (paire)", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6244", "description": "Inhibiteur avant-bras latéral droit standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6245", "description": "Inhibiteur avant-bras latéral droit non-standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6266", "description": "Inhibiteur avant-bras central non-standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6267", "description": "Inhibiteur avant-bras latéral profilé non-standard", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6310", "description": "Support feuillet communication Lexan", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6340", "description": "Table personnalisée 3/8\"", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6345", "description": "Table personnalisée 1/4\"", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6430", "description": "Écarteur de main", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6510", "description": "Coussin demi-table Startex gauche", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6515", "description": "Coussin demi-table Startex droit", "categorie": "Demi-table rabattable", "temps_minutes": 0}, {"code": "TA6530", "description": "Coussin de coude Startex gauche", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6535", "description": "Coussin de coude Startex droit", "categorie": "Table et éléments de posture", "temps_minutes": 0}, {"code": "TA6550", "description": "Mécanisme rabattable", "categorie": "Gouttière", "temps_minutes": 0}, {"code": "UL5530-1/2", "description": "Base en mousse - Uréthane Densité souple", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "UL7530-1/2/3", "description": "Base en mousse - Uréthane Densité ferme", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "VIF10-1/2/3", "description": "Mousse de finition - Viscose", "categorie": "Coussin Ultra", "temps_minutes": 0}, {"code": "VPU", "description": "Personnalisation coussinage Valeo", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "VPX", "description": "Frais hauteur hors-standard Valeo", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "VPZ", "description": "Coussinage de base Valeo Néocor 1.5\"", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "VR10073", "description": "Viscose 1\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10074", "description": "Viscose ½\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10076", "description": "Néocor 1\" (Valeo)", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "VR10077", "description": "Néocor 1\" - Coussinage de base", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10084C", "description": "Néocor ½\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10085C", "description": "Latex 1\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10091C", "description": "Sunmate mou 1\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10093C", "description": "Temper T-36 1\"", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "VR10095C", "description": "Temper T38 1\"", "categorie": "Dossier Valeo", "temps_minutes": 0}, {"code": "VR10110C", "description": "Sunmate mou ½\"", "categorie": "Dossier Axis", "temps_minutes": 0}, {"code": "VR10111C", "description": "Temper T-36 1/2\"", "categorie": "Dossier Premium", "temps_minutes": 0}, {"code": "VR9080C", "description": "Plastazote 1/4\"", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "VR9085-VNC", "description": "EVA foam ¼\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "VR9085VNC", "description": "Mousse - EVA foam ¼\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "VR9090C", "description": "Plastazote 1/2\"", "categorie": "Éléments de forme", "temps_minutes": 0}, {"code": "VR9097-VNC", "description": "EVA foam ½\"", "categorie": "Éléments Fusion", "temps_minutes": 0}, {"code": "VR9097VNC", "description": "Mousse - EVA foam ½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "VR9225C", "description": "Mousse - Uréthane ferme ½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "VR9235C", "description": "Mousse - Uréthane ferme 1\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "VR9390C", "description": "Mousse - Mousse mémoire souple ½\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}, {"code": "VR9400C", "description": "Mousse - Mousse mémoire souple 1\"", "categorie": "Éléments de forme (communs à plusieurs coussins)", "temps_minutes": 0}];

let calcCodesDB = CALC_CODES_DATA.map(c => ({...c})); // Initialiser immédiatement!
let calcCategories = new Set();
let calcLastAnalysis = null; // Pour l'impression

// Extraire les catégories immédiatement
CALC_CODES_DATA.forEach(c => calcCategories.add(c.categorie));

// Initialiser le calculateur
function initCalculateur() {
  // Charger les temps depuis Firebase ou localStorage
  loadCalcTimesFromStorage();
}

// Charger les temps sauvegardés
function loadCalcTimesFromStorage() {
  // D'abord essayer Firebase
  if (typeof db !== 'undefined' && db && currentUser) {
    db.ref('physipro_calc_times').once('value').then(snapshot => {
      const timesMap = snapshot.val() || {};
      applyTimesToCodes(timesMap);
    }).catch(() => {
      // Fallback localStorage
      loadCalcTimesFromLocalStorage();
    });
  } else {
    loadCalcTimesFromLocalStorage();
  }
}

function loadCalcTimesFromLocalStorage() {
  try {
    const saved = localStorage.getItem('physipro_calc_times');
    const timesMap = saved ? JSON.parse(saved) : {};
    applyTimesToCodes(timesMap);
  } catch(e) {
    console.log('Erreur chargement temps:', e);
  }
}

function applyTimesToCodes(timesMap) {
  calcCodesDB = CALC_CODES_DATA.map(c => ({
    ...c,
    temps_minutes: timesMap[c.code] !== undefined ? timesMap[c.code] : c.temps_minutes
  }));
  
  // Extraire les catégories
  calcCategories = new Set();
  calcCodesDB.forEach(c => calcCategories.add(c.categorie));
  
  // Remplir le filtre des catégories (onglet Recherche)
  const catFilter = document.getElementById('calcCategoryFilter');
  if (catFilter) {
    catFilter.innerHTML = '<option value="">Toutes catégories</option>';
    [...calcCategories].sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catFilter.appendChild(opt);
    });
  }
  
  // Afficher les codes
  filterCalcCodes();
  renderCalcEditList();
  initCalcEditCategories(); // Initialiser le filtre catégories de l'onglet Édition
}

// Sauvegarder les temps
function saveCalcTimes() {
  const timesMap = {};
  calcCodesDB.forEach(c => {
    if (c.temps_minutes > 0) {
      timesMap[c.code] = c.temps_minutes;
    }
  });
  
  // Sauvegarder dans localStorage
  localStorage.setItem('physipro_calc_times', JSON.stringify(timesMap));
  
  // Sauvegarder dans Firebase
  if (db && currentUser) {
    db.ref('physipro_calc_times').set(timesMap).catch(err => {
      console.error('Erreur sauvegarde Firebase:', err);
    });
  }
}

// Changer d'onglet
function showCalcTab(tabId, clickedEl) {
  document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
  
  // Marquer l'onglet cliqué comme actif
  if (clickedEl) {
    clickedEl.classList.add('active');
  } else {
    // Fallback: trouver le bon onglet
    document.querySelectorAll('.calc-tab').forEach(t => {
      if (t.textContent.toLowerCase().includes(tabId)) t.classList.add('active');
    });
  }
  
  const panelId = 'calcPanel' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

// Filtrer les codes (onglet recherche)
function filterCalcCodes() {
  const search = (document.getElementById('calcSearchInput')?.value || '').toLowerCase();
  const category = document.getElementById('calcCategoryFilter')?.value || '';
  
  const filtered = calcCodesDB.filter(c => {
    const matchSearch = c.code.toLowerCase().includes(search) || 
                       c.description.toLowerCase().includes(search);
    const matchCat = !category || c.categorie === category;
    return matchSearch && matchCat;
  });
  
  renderCalcTable(filtered);
  const countEl = document.getElementById('calcResultCount');
  if (countEl) countEl.textContent = `${filtered.length} résultat(s) sur ${calcCodesDB.length}`;
}

// Afficher la table
function renderCalcTable(codes) {
  const tbody = document.getElementById('calcCodesTable');
  if (!tbody) return;
  
  tbody.innerHTML = codes.slice(0, 200).map(c => `
    <tr>
      <td class="calc-code-cell">${c.code}</td>
      <td>${c.description}</td>
      <td>${c.categorie}</td>
      <td class="calc-temps-cell ${c.temps_minutes === 0 ? 'calc-temps-zero' : ''}">${c.temps_minutes} min</td>
    </tr>
  `).join('');
  
  if (codes.length > 200) {
    tbody.innerHTML += '<tr><td colspan="4" style="text-align:center;color:#64748b;">... et ' + (codes.length - 200) + ' autres (filtrez pour voir plus)</td></tr>';
  }
}

// Extraire le code de base (sans dimensions)
function getCalcBaseCode(code) {
  // Normaliser le code
  code = code.toUpperCase().trim();
  
  // Si pas de tiret, retourner tel quel
  if (!code.includes('-')) return code;
  
  const parts = code.split('-');
  const baseParts = [parts[0]]; // Toujours garder la première partie (ex: S2366, NS75, S1332)
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // Ignorer les parties qui sont purement numériques ou des dimensions (ex: 1717, 3.0, 1.0, 17x17)
    if (/^[\d.x]+$/i.test(part)) continue;
    // Ignorer aussi les parties comme "L" ou "R" seuls à la fin (gauche/droite)
    if (i === parts.length - 1 && /^[LR]$/i.test(part)) {
      baseParts.push(part);
      continue;
    }
    // Garder les suffixes alphabétiques significatifs (INS, CPI, AF, CA, etc.)
    if (/^[A-Z]+$/i.test(part)) {
      baseParts.push(part);
    }
  }
  
  return baseParts.join('-');
}

// Trouver un code dans la DB avec plusieurs stratégies
function findCalcCodeInDB(code) {
  if (!code || !calcCodesDB || calcCodesDB.length === 0) return null;
  
  const upperCode = code.toUpperCase().trim();
  
  // 1. Match exact
  let match = calcCodesDB.find(c => c.code.toUpperCase() === upperCode);
  if (match) return { ...match, matchType: 'exact' };
  
  // 2. Match sur le code de base (sans dimensions)
  const baseCode = getCalcBaseCode(code);
  if (baseCode !== upperCode) {
    match = calcCodesDB.find(c => c.code.toUpperCase() === baseCode);
    if (match) return { ...match, matchType: 'base', searchedCode: upperCode };
  }
  
  // 3. Match sur la racine (première partie avant le tiret)
  const rootCode = upperCode.split('-')[0];
  match = calcCodesDB.find(c => c.code.toUpperCase() === rootCode);
  if (match) return { ...match, matchType: 'root', searchedCode: upperCode };
  
  // 4. Match partiel - chercher un code qui commence pareil
  match = calcCodesDB.find(c => c.code.toUpperCase().startsWith(rootCode));
  if (match) return { ...match, matchType: 'partial', searchedCode: upperCode };
  
  // 5. Match inversé - si le code de la DB commence par notre recherche
  match = calcCodesDB.find(c => upperCode.startsWith(c.code.toUpperCase()));
  if (match) return { ...match, matchType: 'reverse', searchedCode: upperCode };
  
  return null;
}

// Analyser le devis
function analyzeCalcDevis() {
  const text = document.getElementById('calcDevisText')?.value || '';
  if (!text.trim()) {
    showToast('⚠️ Collez un devis à analyser');
    return;
  }
  
  // Pattern amélioré pour capturer les codes PhysiPro
  // Exemples: S2366-1717, NS75-4, S1332-INS-CPI-1.0-L, AT5000, CINCH1416
  const codePattern = /\b([A-Z]{1,5}[\d]{1,5}(?:-[\w.]+)*)\b/gi;
  
  // Aussi chercher les codes qui commencent par des lettres puis tiret puis chiffres
  const codePattern2 = /\b([A-Z]{1,5}-[\d.]+[\w.-]*)\b/gi;
  
  let rawMatches = [];
  
  // Extraire ligne par ligne pour être plus précis
  const lines = text.split('\n');
  lines.forEach(line => {
    // Prendre le premier "mot" de chaque ligne comme code potentiel
    const firstWord = line.trim().split(/\s+/)[0];
    if (firstWord && /^[A-Z]/i.test(firstWord)) {
      rawMatches.push(firstWord);
    }
  });
  
  // Aussi utiliser les patterns regex
  const matches1 = text.match(codePattern) || [];
  const matches2 = text.match(codePattern2) || [];
  rawMatches = [...new Set([...rawMatches, ...matches1, ...matches2])];
  
  let totalTime = 0;
  const found = [];
  const missing = [];
  const processedCodes = new Set();
  
  rawMatches.forEach(m => {
    const upperM = m.toUpperCase().trim();
    // Éviter les doublons par code exact
    if (processedCodes.has(upperM)) return;
    
    const dbCode = findCalcCodeInDB(m);
    if (dbCode) {
      // Éviter les doublons par code DB trouvé
      if (processedCodes.has(dbCode.code.toUpperCase())) return;
      
      processedCodes.add(upperM);
      processedCodes.add(dbCode.code.toUpperCase());
      
      found.push({
        ...dbCode,
        originalCode: m
      });
      totalTime += dbCode.temps_minutes || 0;
    } else {
      processedCodes.add(upperM);
      // Filtrer les faux positifs (mots trop courts ou pas des codes)
      if (m.length >= 3 && /[A-Z]/i.test(m) && /\d/.test(m)) {
        missing.push(m);
      }
    }
  });
  
  // Sauvegarder pour impression
  calcLastAnalysis = { found, missing, totalTime, date: new Date() };
  
  // Afficher les résultats
  const resultsEl = document.getElementById('calcDevisResults');
  if (resultsEl) resultsEl.classList.add('visible');
  
  // Boutons - visibles si on a des codes
  const printBtn = document.getElementById('calcPrintBtn');
  const addSpecialBtn = document.getElementById('calcAddSpecialBtn');
  
  if (printBtn) printBtn.style.display = found.length > 0 ? '' : 'none';
  if (addSpecialBtn) addSpecialBtn.style.display = found.length > 0 ? '' : 'none';
  
  // Réinitialiser les demandes spéciales
  calcSpecialRequests = [];
  const specialSection = document.getElementById('calcSpecialSection');
  if (specialSection) specialSection.style.display = 'none';
  
  // Temps total
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${totalTime} min`;
  const totalEl = document.getElementById('calcTotalTime');
  if (totalEl) totalEl.textContent = timeStr;
  
  // Codes trouvés
  const foundCountEl = document.getElementById('calcFoundCount');
  const foundListEl = document.getElementById('calcFoundList');
  if (foundCountEl) foundCountEl.textContent = found.length;
  if (foundListEl) {
    foundListEl.innerHTML = found.map(c => {
      const matchInfo = c.matchType && c.matchType !== 'exact' ? ` (via ${c.code})` : '';
      const timeDisplay = c.temps_minutes > 0 ? ` - ${c.temps_minutes}min` : '';
      return `<span class="calc-code-tag calc-code-found" title="${c.description}">${c.originalCode}${matchInfo}${timeDisplay}</span>`;
    }).join('');
  }
  
  // Codes manquants
  const missingSection = document.getElementById('calcMissingSection');
  const missingCountEl = document.getElementById('calcMissingCount');
  const missingListEl = document.getElementById('calcMissingList');
  
  if (missing.length > 0) {
    if (missingSection) missingSection.style.display = '';
    if (missingCountEl) missingCountEl.textContent = missing.length;
    if (missingListEl) {
      missingListEl.innerHTML = missing.map(c => 
        `<span class="calc-code-tag calc-code-missing">${c}</span>`
      ).join('');
    }
  } else {
    if (missingSection) missingSection.style.display = 'none';
  }
  
  // Liste détaillée
  const detailListEl = document.getElementById('calcDetailList');
  if (detailListEl) {
    detailListEl.innerHTML = found.map(c => `
      <div class="calc-detail-item">
        <span class="calc-detail-code">${c.code}</span>
        <span class="calc-detail-desc">${c.description}</span>
        <span class="calc-detail-time">${c.temps_minutes} min</span>
      </div>
    `).join('');
  }
}

// Effacer le devis
// Liste des demandes spéciales
let calcSpecialRequests = [];

function clearCalcDevis() {
  const textEl = document.getElementById('calcDevisText');
  const resultsEl = document.getElementById('calcDevisResults');
  const printBtn = document.getElementById('calcPrintBtn');
  const addSpecialBtn = document.getElementById('calcAddSpecialBtn');
  const specialSection = document.getElementById('calcSpecialSection');
  
  if (textEl) textEl.value = '';
  if (resultsEl) resultsEl.classList.remove('visible');
  if (printBtn) printBtn.style.display = 'none';
  if (addSpecialBtn) addSpecialBtn.style.display = 'none';
  if (specialSection) specialSection.style.display = 'none';
  
  calcSpecialRequests = [];
  calcLastAnalysis = null;
}

// Ouvrir le modal pour ajouter une demande spéciale
function openAddSpecialModal() {
  document.getElementById('specialModalOverlay').classList.remove('hidden');
  document.getElementById('specialDescription').value = '';
  document.getElementById('specialMinutes').value = '15';
  document.getElementById('specialDescription').focus();
}

// Fermer le modal
function closeSpecialModal() {
  document.getElementById('specialModalOverlay').classList.add('hidden');
}

// Ajouter une demande spéciale
function addSpecialRequest() {
  const description = document.getElementById('specialDescription').value.trim();
  const minutes = parseInt(document.getElementById('specialMinutes').value) || 0;
  
  if (!description) {
    showToast('⚠️ Entrez une description');
    return;
  }
  
  if (minutes <= 0) {
    showToast('⚠️ Le temps doit être supérieur à 0');
    return;
  }
  
  // Ajouter à la liste
  calcSpecialRequests.push({
    id: Date.now(),
    description: description,
    minutes: minutes
  });
  
  // Fermer le modal
  closeSpecialModal();
  
  // Mettre à jour l'affichage
  renderSpecialRequests();
  updateCalcTotalWithSpecial();
  
  showToast('✅ Demande spéciale ajoutée');
}

// Supprimer une demande spéciale
function deleteSpecialRequest(id) {
  calcSpecialRequests = calcSpecialRequests.filter(r => r.id !== id);
  renderSpecialRequests();
  updateCalcTotalWithSpecial();
}

// Afficher les demandes spéciales
function renderSpecialRequests() {
  const section = document.getElementById('calcSpecialSection');
  const list = document.getElementById('calcSpecialList');
  const count = document.getElementById('calcSpecialCount');
  
  if (!section || !list) return;
  
  if (calcSpecialRequests.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  if (count) count.textContent = calcSpecialRequests.length;
  
  list.innerHTML = calcSpecialRequests.map(r => `
    <div class="calc-special-item">
      <div class="calc-special-item-info">
        <span class="calc-special-item-desc">${r.description}</span>
        <span class="calc-special-item-time">${r.minutes} min</span>
      </div>
      <button class="calc-special-item-delete" onclick="deleteSpecialRequest(${r.id})" title="Supprimer">✕</button>
    </div>
  `).join('');
}

// Mettre à jour le total avec les demandes spéciales
function updateCalcTotalWithSpecial() {
  if (!calcLastAnalysis) return;
  
  const specialTime = calcSpecialRequests.reduce((sum, r) => sum + r.minutes, 0);
  const baseTime = calcLastAnalysis.totalTime || 0;
  const newTotal = baseTime + specialTime;
  
  // Mettre à jour l'affichage
  const hours = Math.floor(newTotal / 60);
  const mins = newTotal % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${newTotal} min`;
  
  const totalEl = document.getElementById('calcTotalTime');
  if (totalEl) {
    if (specialTime > 0) {
      totalEl.innerHTML = `${timeStr} <span style="font-size:11px;color:#fbbf24;">(+${specialTime}min spécial)</span>`;
    } else {
      totalEl.textContent = timeStr;
    }
  }
  
  // Mettre à jour calcLastAnalysis pour l'impression
  calcLastAnalysis.specialRequests = calcSpecialRequests;
  calcLastAnalysis.specialTime = specialTime;
  calcLastAnalysis.grandTotal = newTotal;
}

// Imprimer le devis
function printCalcDevis() {
  if (!calcLastAnalysis || calcLastAnalysis.found.length === 0) {
    showToast('⚠️ Aucun code trouvé à imprimer');
    return;
  }
  
  const { found, totalTime, date } = calcLastAnalysis;
  const specialRequests = calcLastAnalysis.specialRequests || [];
  const specialTime = specialRequests.reduce((sum, r) => sum + r.minutes, 0);
  const grandTotal = (totalTime || 0) + specialTime;
  
  // Calculer le temps total pour l'affichage
  const hours = Math.floor(grandTotal / 60);
  const mins = grandTotal % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${grandTotal} min`;
  const dateStr = date.toLocaleDateString('fr-CA');
  
  // Lignes pour chaque demande spéciale
  const specialLines = specialRequests.map(r => `
    <div class="coupon-item coupon-special">
      <span class="item-code">⚡ ${r.description}</span>
      <span class="item-time">${r.minutes}m</span>
    </div>
  `).join('');
  
  // Générer le contenu du coupon (1 seul coupon avec la liste des codes)
  const couponContent = `
    <div class="coupon">
      <div class="coupon-header">
        <span class="coupon-logo">PhysiPro</span>
        <span class="coupon-date">${dateStr}</span>
      </div>
      <div class="coupon-total">⏱️ ${timeStr}</div>
      <div class="coupon-items">
        ${found.map(c => `
          <div class="coupon-item">
            <span class="item-code">${c.originalCode || c.code}</span>
            <span class="item-time">${c.temps_minutes || 0}m</span>
          </div>
        `).join('')}
        ${specialLines}
      </div>
      <div class="coupon-footer">${found.length} codes${specialRequests.length > 0 ? ' + ' + specialRequests.length + ' spécial' : ''}</div>
    </div>
  `;
  
  // Créer 6 coupons identiques sur la page (grille 2x3)
  let couponsHtml = '';
  for (let i = 0; i < 6; i++) {
    couponsHtml += couponContent;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PhysiPro - Coupons temps</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page {
          size: letter;
          margin: 0.3in;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
        }
        
        .page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(3, 1fr);
          gap: 8px;
          height: 10in;
          width: 8in;
        }
        
        .coupon {
          border: 1px dashed #999;
          padding: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
        }
        
        .coupon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        
        .coupon-logo {
          font-weight: bold;
          font-size: 11px;
          color: #1e3a5f;
        }
        
        .coupon-date {
          font-size: 8px;
          color: #666;
        }
        
        .coupon-total {
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          background: #e8f4fd;
          padding: 4px;
          border-radius: 3px;
          margin-bottom: 6px;
          color: #1e3a5f;
        }
        
        .coupon-items {
          flex: 1;
          overflow: hidden;
        }
        
        .coupon-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          border-bottom: 1px dotted #ddd;
        }
        
        .coupon-item:last-child {
          border-bottom: none;
        }
        
        .item-code {
          font-weight: 600;
          font-size: 8px;
          max-width: 70%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .item-time {
          font-size: 8px;
          font-weight: bold;
          color: #2563eb;
          background: #f0f7ff;
          padding: 1px 4px;
          border-radius: 2px;
        }
        
        .coupon-special {
          background: #fef3c7;
          border-radius: 3px;
          margin-top: 4px;
          padding: 3px 0 !important;
        }
        
        .coupon-special .item-code {
          color: #92400e;
          font-style: italic;
        }
        
        .coupon-special .item-time {
          background: #fbbf24;
          color: #78350f;
        }
        
        .coupon-footer {
          font-size: 7px;
          text-align: right;
          color: #888;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #ddd;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${couponsHtml}
      </div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Rendu liste édition
function renderCalcEditList(filter = '', category = '') {
  const listEl = document.getElementById('calcEditList');
  if (!listEl) return;
  
  // Filtrer par recherche ET par catégorie
  const filtered = calcCodesDB.filter(c => {
    const matchSearch = !filter || 
      c.code.toLowerCase().includes(filter.toLowerCase()) ||
      c.description.toLowerCase().includes(filter.toLowerCase());
    const matchCategory = !category || c.categorie === category;
    return matchSearch && matchCategory;
  });
  
  // Afficher TOUS les résultats (pas de limite)
  listEl.innerHTML = filtered.map(c => `
    <div class="calc-edit-row">
      <input type="number" class="calc-edit-input" min="0" value="${c.temps_minutes}" 
             onchange="updateCalcTime('${c.code}', this.value)">
      <span class="calc-edit-label"><strong>${c.code}</strong> - ${c.description} <span style="color:#64748b;font-size:11px;">(${c.categorie})</span></span>
    </div>
  `).join('');
  
  // Mettre à jour le compteur
  const countEl = document.getElementById('calcEditCount');
  if (countEl) {
    countEl.textContent = `Affichage: ${filtered.length} codes sur ${calcCodesDB.length}`;
  }
}

function filterCalcEditCodes() {
  const search = document.getElementById('calcEditSearch')?.value || '';
  const category = document.getElementById('calcEditCategoryFilter')?.value || '';
  renderCalcEditList(search, category);
}

// Initialiser le dropdown des catégories pour l'édition
function initCalcEditCategories() {
  const catFilter = document.getElementById('calcEditCategoryFilter');
  if (catFilter && calcCodesDB.length > 0) {
    // Extraire les catégories uniques et les trier
    const categories = [...new Set(calcCodesDB.map(c => c.categorie))].sort();
    catFilter.innerHTML = '<option value="">📁 Toutes les catégories (' + calcCodesDB.length + ')</option>';
    categories.forEach(cat => {
      const count = calcCodesDB.filter(c => c.categorie === cat).length;
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = `${cat} (${count})`;
      catFilter.appendChild(opt);
    });
  }
}

// Mettre à jour un temps
function updateCalcTime(code, value) {
  const c = calcCodesDB.find(x => x.code === code);
  if (c) {
    c.temps_minutes = parseInt(value) || 0;
    saveCalcTimes();
    showToast(`✅ ${code}: ${c.temps_minutes} min sauvegardé`);
  }
}

// Remettre à zéro
function resetCalcAllTimes() {
  if (!confirm('Remettre tous les temps à 0?')) return;
  
  calcCodesDB.forEach(c => c.temps_minutes = 0);
  localStorage.removeItem('physipro_calc_times');
  
  if (db && currentUser) {
    db.ref('physipro_calc_times').remove();
  }
  
  renderCalcEditList();
  filterCalcCodes();
  showToast('🔄 Tous les temps remis à zéro');
}

// Exporter JSON
function exportCalcJSON() {
  const data = {
    metadata: {
      version: '1.0',
      date_export: new Date().toISOString().split('T')[0],
      description: 'Base de données PhysiPro avec temps'
    },
    codes: calcCodesDB
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'physipro_codes_avec_temps.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Fichier exporté');
}

// Importer JSON
function importCalcJSON() {
  document.getElementById('calcImportFile')?.click();
}

function handleCalcImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.codes) {
        const timesMap = {};
        data.codes.forEach(c => {
          if (c.temps_minutes > 0) {
            timesMap[c.code] = c.temps_minutes;
          }
        });
        applyTimesToCodes(timesMap);
        saveCalcTimes();
        showToast('📤 ' + Object.keys(timesMap).length + ' temps importés');
      }
    } catch (err) {
      showToast('❌ Erreur de lecture du fichier');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Exposer les fonctions globalement
window.showCalcTab = showCalcTab;
window.filterCalcCodes = filterCalcCodes;
window.analyzeCalcDevis = analyzeCalcDevis;
window.clearCalcDevis = clearCalcDevis;
window.printCalcDevis = printCalcDevis;
window.filterCalcEditCodes = filterCalcEditCodes;
window.initCalcEditCategories = initCalcEditCategories;
window.updateCalcTime = updateCalcTime;
window.resetCalcAllTimes = resetCalcAllTimes;
window.exportCalcJSON = exportCalcJSON;
window.importCalcJSON = importCalcJSON;
window.handleCalcImport = handleCalcImport;
window.initCalculateur = initCalculateur;
window.openAddSpecialModal = openAddSpecialModal;
window.closeSpecialModal = closeSpecialModal;
window.addSpecialRequest = addSpecialRequest;
window.deleteSpecialRequest = deleteSpecialRequest;


// =============================================================================
// PAGE PSM (Produits Sur Mesure)
// =============================================================================

let psmCards = {}; // Toutes les cartes PSM
let currentPsmId = null; // ID de la carte actuellement sélectionnée
let editingPsmId = null; // ID de la carte en cours d'édition

// Liste des matériaux disponibles avec codes (format: {nom, code})
let psmMateriauxListe = [
  {nom: 'Sélectionner...', code: ''},
  {nom: 'Mousse uréthane', code: 'MU-001'},
  {nom: 'Mousse mémoire', code: 'MM-002'},
  {nom: 'Gel silicone', code: 'GS-003'},
  {nom: 'Plastazote', code: 'PZ-004'},
  {nom: 'EVA foam', code: 'EV-005'},
  {nom: 'Néoprène', code: 'NE-006'},
  {nom: 'Cuirette', code: 'CU-007'},
  {nom: 'Tissu Startex', code: 'TS-008'},
  {nom: 'Velcro', code: 'VE-009'},
  {nom: 'ABS plastique', code: 'AB-010'},
  {nom: 'Aluminium', code: 'AL-011'},
  {nom: 'Acier', code: 'AC-012'},
  {nom: 'Sunmate', code: 'SM-013'},
  {nom: 'Latex', code: 'LA-014'},
  {nom: 'T-38', code: 'T38-015'},
  {nom: 'Autre...', code: 'AU-999'}
];

// Charger les données PSM depuis Firebase
let psmListenersAttached = false;

function loadPsmData() {
  // Éviter d'attacher les listeners plusieurs fois
  if (psmListenersAttached) {
    // Juste rafraîchir l'affichage
    renderPsmCards();
    if (currentPsmId && psmCards[currentPsmId]) {
      selectPsmCard(currentPsmId);
    }
    return;
  }
  
  if (firebaseDb) {
    psmListenersAttached = true;
    
    // Charger la liste des matériaux
    firebaseDb.ref('psmMateriauxListe').on('value', snap => {
      if (snap.val()) {
        psmMateriauxListe = snap.val();
      }
    }, err => {
      console.error('Erreur chargement matériaux PSM:', err);
    });
    
    // Charger les cartes PSM
    firebaseDb.ref('psmCards').on('value', snapshot => {
      const data = snapshot.val();
      psmCards = data || {};
      console.log('PSM cartes chargées:', Object.keys(psmCards).length);
      
      renderPsmCards();
      
      // Si une carte était sélectionnée, la recharger
      if (currentPsmId && psmCards[currentPsmId]) {
        selectPsmCard(currentPsmId);
      } else {
        showPsmNoSelection();
      }
    }, err => {
      console.error('Erreur chargement cartes PSM:', err);
      showToast('❌ Erreur de chargement PSM');
    });
  } else {
    console.error('Firebase non connecté pour PSM');
    showToast('❌ Firebase non connecté');
  }
}

// Sauvegarder la liste des matériaux
function saveMateriauxListe() {
  if (firebaseDb) {
    firebaseDb.ref('psmMateriauxListe').set(psmMateriauxListe);
  }
}

// Sauvegarder une carte PSM
function savePsmCard(id) {
  if (firebaseDb && id && psmCards[id]) {
    firebaseDb.ref('psmCards/' + id).set(psmCards[id]);
  }
}

// Afficher les cartes PSM
function renderPsmCards(searchTerm = '') {
  const list = document.getElementById('psmCardsList');
  if (!list) return;
  
  const search = searchTerm.toLowerCase().trim();
  const cardIds = Object.keys(psmCards).filter(id => {
    if (!search) return true;
    const card = psmCards[id];
    const nom = (card.nomPsm || '').toLowerCase();
    return nom.includes(search);
  });
  
  if (cardIds.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:20px;font-size:13px;">' + 
      (search ? 'Aucun résultat pour "' + searchTerm + '"' : 'Aucun PSM<br>Cliquez + pour ajouter') + '</div>';
    return;
  }
  
  list.innerHTML = cardIds.map(id => {
    const card = psmCards[id];
    const isActive = id === currentPsmId;
    const isAllComplete = card.completeAtelier && card.completeCouture;
    const statusHtml = isAllComplete ? '<div class="psm-card-status">✓ Complet</div>' : '';
    return `
      <div class="psm-card ${isActive ? 'active' : ''} ${isAllComplete ? 'all-completed' : ''}" onclick="selectPsmCard('${id}')">
        <button class="psm-card-edit" onclick="event.stopPropagation(); showEditPsmModal('${id}')">✏️</button>
        <button class="psm-card-delete" onclick="event.stopPropagation(); deletePsmCard('${id}')">×</button>
        <div class="psm-card-name">${card.nomPsm || 'Sans nom'}</div>
        ${statusHtml}
      </div>
    `;
  }).join('');
}

// Filtrer les cartes PSM selon la recherche
function filterPsmCards() {
  const input = document.getElementById('psmSearchInput');
  const searchTerm = input ? input.value : '';
  renderPsmCards(searchTerm);
}

// Afficher le modal pour ajouter un PSM
function showAddPsmModal() {
  document.getElementById('psmAddModal').style.display = 'flex';
  document.getElementById('psmModalNom').value = '';
  document.getElementById('psmModalNom').focus();
}

// Fermer le modal
function closeAddPsmModal() {
  document.getElementById('psmAddModal').style.display = 'none';
}

// Confirmer la création du PSM
function confirmAddPsm() {
  const nomPsm = document.getElementById('psmModalNom').value.trim();
  
  if (!nomPsm) {
    showToast('⚠️ Veuillez entrer un nom');
    return;
  }
  
  const id = 'psm_' + Date.now();
  psmCards[id] = {
    nomPsm: nomPsm,
    materials: [],
    checkPsmAtelier: false,
    checkPrixMajoreAtelier: false,
    tempsAtelier: '',
    signAtelier: '',
    notesAtelier: '',
    checkPsmCouture: false,
    checkPrixMajoreCouture: false,
    tempsCouture: '',
    signCouture: '',
    notesCouture: ''
  };
  
  savePsmCard(id);
  closeAddPsmModal();
  renderPsmCards();
  selectPsmCard(id);
  showToast('✅ PSM créé');
}

// Afficher le modal pour modifier le nom
function showEditPsmModal(id) {
  editingPsmId = id;
  const card = psmCards[id];
  document.getElementById('psmEditModal').style.display = 'flex';
  document.getElementById('psmEditModalNom').value = card.nomPsm || '';
  document.getElementById('psmEditModalNom').focus();
}

// Fermer le modal d'édition
function closeEditPsmModal() {
  document.getElementById('psmEditModal').style.display = 'none';
  editingPsmId = null;
}

// Confirmer la modification du nom
function confirmEditPsm() {
  if (!editingPsmId || !psmCards[editingPsmId]) return;
  
  const newNom = document.getElementById('psmEditModalNom').value.trim();
  
  if (!newNom) {
    showToast('⚠️ Veuillez entrer un nom');
    return;
  }
  
  psmCards[editingPsmId].nomPsm = newNom;
  savePsmCard(editingPsmId);
  closeEditPsmModal();
  renderPsmCards();
  showToast('✅ Nom modifié');
}

// Modal Import Matériaux
function showImportMateriauxModal() {
  document.getElementById('psmImportMateriauxModal').style.display = 'flex';
  document.getElementById('psmImportJsonTextarea').value = '';
  document.getElementById('psmImportPreview').innerHTML = '';
  document.getElementById('psmImportPreview').className = 'psm-import-preview';
}

function closeImportMateriauxModal() {
  document.getElementById('psmImportMateriauxModal').style.display = 'none';
}

function confirmImportMateriaux() {
  const textarea = document.getElementById('psmImportJsonTextarea');
  const preview = document.getElementById('psmImportPreview');
  const jsonText = textarea.value.trim();
  
  if (!jsonText) {
    preview.innerHTML = '❌ Veuillez coller un JSON valide';
    preview.className = 'psm-import-preview error';
    return;
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Le JSON doit être un tableau');
    }
    
    // Valider et formater
    const formatted = [{nom: 'Sélectionner...', code: ''}];
    
    for (const item of parsed) {
      if (item.nom) {
        formatted.push({
          nom: item.nom,
          code: item.code || ''
        });
      }
    }
    
    if (formatted.length <= 1) {
      throw new Error('Aucun matériau valide trouvé');
    }
    
    // Sauvegarder
    psmMateriauxListe = formatted;
    saveMateriauxListe();
    
    closeImportMateriauxModal();
    renderPsmMaterials();
    showToast(`✅ ${formatted.length - 1} matériaux importés`);
    
  } catch (e) {
    preview.innerHTML = '❌ Erreur: ' + e.message;
    preview.className = 'psm-import-preview error';
  }
}

// Sélectionner une carte PSM
function selectPsmCard(id) {
  currentPsmId = id;
  
  // Mettre à jour l'affichage des cartes
  renderPsmCards();
  
  // Afficher les détails
  document.getElementById('psmNoSelection').style.display = 'none';
  document.getElementById('psmDetailsContent').style.display = 'flex';
  
  // Charger les données dans les champs
  const card = psmCards[id];
  if (!card) return;
  
  renderPsmMaterials();
  renderPsmTemps();
  updatePsmLabels();
}

// Afficher message aucune sélection
function showPsmNoSelection() {
  currentPsmId = null;
  document.getElementById('psmNoSelection').style.display = 'flex';
  document.getElementById('psmDetailsContent').style.display = 'none';
}

// Supprimer une carte PSM
function deletePsmCard(id) {
  if (!confirm('Supprimer ce PSM?')) return;
  
  if (firebaseDb) {
    firebaseDb.ref('psmCards/' + id).remove();
  }
  delete psmCards[id];
  
  if (currentPsmId === id) {
    showPsmNoSelection();
  }
  
  renderPsmCards();
  showToast('🗑️ PSM supprimé');
}

// Mettre à jour les labels Temps selon les checkboxes
// Toggle exclusif PSM / Prix majoré (un seul peut être coché)
function togglePsmExclusive(section, clicked) {
  const psmCheck = document.getElementById(`psmCheckPsm${section}`);
  const prixMajoreCheck = document.getElementById(`psmCheckPrixMajore${section}`);
  
  if (clicked === 'psm' && psmCheck?.checked) {
    // Si on coche PSM, décocher Prix majoré
    if (prixMajoreCheck) prixMajoreCheck.checked = false;
  } else if (clicked === 'prixMajore' && prixMajoreCheck?.checked) {
    // Si on coche Prix majoré, décocher PSM
    if (psmCheck) psmCheck.checked = false;
  }
}

function updatePsmLabels() {
  // Atelier
  const checkPsmAtelier = document.getElementById('psmCheckPsmAtelier')?.checked;
  const checkPrixMajoreAtelier = document.getElementById('psmCheckPrixMajoreAtelier')?.checked;
  const labelAtelier = document.getElementById('psmLabelTempsAtelier');
  
  if (labelAtelier) {
    if (checkPsmAtelier) {
      labelAtelier.textContent = 'Temps total:';
    } else if (checkPrixMajoreAtelier) {
      labelAtelier.textContent = 'Temps à ajouter:';
    } else {
      labelAtelier.textContent = 'Temps:';
    }
  }
  
  // Couture
  const checkPsmCouture = document.getElementById('psmCheckPsmCouture')?.checked;
  const checkPrixMajoreCouture = document.getElementById('psmCheckPrixMajoreCouture')?.checked;
  const labelCouture = document.getElementById('psmLabelTempsCouture');
  
  if (labelCouture) {
    if (checkPsmCouture) {
      labelCouture.textContent = 'Temps total:';
    } else if (checkPrixMajoreCouture) {
      labelCouture.textContent = 'Temps à ajouter:';
    } else {
      labelCouture.textContent = 'Temps:';
    }
  }
}

// Générer les options du dropdown matériaux (nom + code)
function getPsmMateriauxOptions(selectedValue) {
  return psmMateriauxListe.map(mat => {
    const displayText = mat.code ? `${mat.nom} (${mat.code})` : mat.nom;
    const value = mat.code ? `${mat.nom}|${mat.code}` : mat.nom;
    const isSelected = value === selectedValue || mat.nom === selectedValue;
    return `<option value="${value}" ${isSelected ? 'selected' : ''}>${displayText}</option>`;
  }).join('');
}

// Afficher les matériaux en lignes
function renderPsmMaterials() {
  const list = document.getElementById('psmMaterialsList');
  if (!list || !currentPsmId || !psmCards[currentPsmId]) return;
  
  const materials = psmCards[currentPsmId].materials || [];
  
  list.innerHTML = materials.map((mat, idx) => {
    const selectValue = mat.code ? `${mat.materiau}|${mat.code}` : mat.materiau;
    return `
      <div class="psm-material-row" data-idx="${idx}">
        <select class="psm-material-select" onchange="updatePsmMaterial(${idx}, this.value)">
          ${getPsmMateriauxOptions(selectValue)}
        </select>
        <input type="text" class="psm-material-input input-qty" placeholder="Qté" 
               value="${mat.quantite || ''}" onchange="updatePsmMaterialQty(${idx}, this.value)">
        <button class="psm-material-delete no-print" onclick="deletePsmMaterial(${idx})">×</button>
      </div>
    `;
  }).join('');
}

// Ajouter une ligne de matériau
function addPsmMaterial() {
  if (!currentPsmId || !psmCards[currentPsmId]) {
    showToast('⚠️ Sélectionnez un PSM d\'abord');
    return;
  }
  
  if (!psmCards[currentPsmId].materials) {
    psmCards[currentPsmId].materials = [];
  }
  
  psmCards[currentPsmId].materials.push({
    materiau: '',
    code: '',
    quantite: ''
  });
  
  savePsmCard(currentPsmId);
  renderPsmMaterials();
}

// Mettre à jour un matériau (dropdown avec nom|code)
function updatePsmMaterial(idx, value) {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  if (psmCards[currentPsmId].materials && psmCards[currentPsmId].materials[idx]) {
    const parts = value.split('|');
    psmCards[currentPsmId].materials[idx].materiau = parts[0] || '';
    psmCards[currentPsmId].materials[idx].code = parts[1] || '';
    savePsmCard(currentPsmId);
  }
}

// Mettre à jour la quantité
function updatePsmMaterialQty(idx, value) {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  if (psmCards[currentPsmId].materials && psmCards[currentPsmId].materials[idx]) {
    psmCards[currentPsmId].materials[idx].quantite = value;
    savePsmCard(currentPsmId);
  }
}

// Supprimer un matériau
function deletePsmMaterial(idx) {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  if (confirm('Supprimer cette ligne?')) {
    psmCards[currentPsmId].materials.splice(idx, 1);
    savePsmCard(currentPsmId);
    renderPsmMaterials();
    showToast('🗑️ Ligne supprimée');
  }
}

// Afficher les temps
function renderPsmTemps() {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  const card = psmCards[currentPsmId];
  
  // Évaluateurs
  const evaluateurAtelier = document.getElementById('psmEvaluateurAtelier');
  const evaluateurCouture = document.getElementById('psmEvaluateurCouture');
  
  if (evaluateurAtelier) evaluateurAtelier.value = card.evaluateurAtelier || '';
  if (evaluateurCouture) evaluateurCouture.value = card.evaluateurCouture || '';
  
  // Atelier
  const checkPsmAtelier = document.getElementById('psmCheckPsmAtelier');
  const checkPrixMajoreAtelier = document.getElementById('psmCheckPrixMajoreAtelier');
  const tempsAtelier = document.getElementById('psmTempsAtelier');
  const questionAtelier = document.getElementById('psmQuestionAtelier');
  const notesAtelier = document.getElementById('psmNotesAtelier');
  
  if (checkPsmAtelier) checkPsmAtelier.checked = card.checkPsmAtelier || false;
  if (checkPrixMajoreAtelier) checkPrixMajoreAtelier.checked = card.checkPrixMajoreAtelier || false;
  if (tempsAtelier) tempsAtelier.value = card.tempsAtelier || '';
  if (questionAtelier) questionAtelier.innerHTML = card.questionAtelier || '';
  if (notesAtelier) notesAtelier.innerHTML = card.notesAtelier || '';
  
  // Couture
  const checkPsmCouture = document.getElementById('psmCheckPsmCouture');
  const checkPrixMajoreCouture = document.getElementById('psmCheckPrixMajoreCouture');
  const tempsCouture = document.getElementById('psmTempsCouture');
  const questionCouture = document.getElementById('psmQuestionCouture');
  const notesCouture = document.getElementById('psmNotesCouture');
  
  if (checkPsmCouture) checkPsmCouture.checked = card.checkPsmCouture || false;
  if (checkPrixMajoreCouture) checkPrixMajoreCouture.checked = card.checkPrixMajoreCouture || false;
  if (tempsCouture) tempsCouture.value = card.tempsCouture || '';
  if (questionCouture) questionCouture.innerHTML = card.questionCouture || '';
  if (notesCouture) notesCouture.innerHTML = card.notesCouture || '';
  
  updatePsmLabels();
  updatePsmCompleteButtons();
}

// Toggle complet pour Atelier ou Couture
function togglePsmComplete(section) {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  const key = 'complete' + section;
  psmCards[currentPsmId][key] = !psmCards[currentPsmId][key];
  
  savePsmCard(currentPsmId);
  updatePsmCompleteButtons();
  renderPsmCards();
}

// Mettre à jour les boutons Complet et l'affichage
function updatePsmCompleteButtons() {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  const card = psmCards[currentPsmId];
  
  // Bouton Atelier
  const btnAtelier = document.getElementById('psmCompleteAtelier');
  const colAtelier = btnAtelier?.closest('.psm-column');
  if (btnAtelier) {
    if (card.completeAtelier) {
      btnAtelier.classList.add('completed');
      btnAtelier.textContent = '✓ Atelier Complété';
      if (colAtelier) colAtelier.classList.add('completed');
    } else {
      btnAtelier.classList.remove('completed');
      btnAtelier.textContent = '✓ Complet';
      if (colAtelier) colAtelier.classList.remove('completed');
    }
  }
  
  // Bouton Couture
  const btnCouture = document.getElementById('psmCompleteCouture');
  const colCouture = btnCouture?.closest('.psm-column');
  if (btnCouture) {
    if (card.completeCouture) {
      btnCouture.classList.add('completed');
      btnCouture.textContent = '✓ Couture Complétée';
      if (colCouture) colCouture.classList.add('completed');
    } else {
      btnCouture.classList.remove('completed');
      btnCouture.textContent = '✓ Complet';
      if (colCouture) colCouture.classList.remove('completed');
    }
  }
}

// Sauvegarder les temps
function savePsmTemps() {
  if (!currentPsmId || !psmCards[currentPsmId]) return;
  
  // Évaluateurs
  psmCards[currentPsmId].evaluateurAtelier = document.getElementById('psmEvaluateurAtelier')?.value || '';
  psmCards[currentPsmId].evaluateurCouture = document.getElementById('psmEvaluateurCouture')?.value || '';
  
  // Atelier
  psmCards[currentPsmId].checkPsmAtelier = document.getElementById('psmCheckPsmAtelier')?.checked || false;
  psmCards[currentPsmId].checkPrixMajoreAtelier = document.getElementById('psmCheckPrixMajoreAtelier')?.checked || false;
  psmCards[currentPsmId].tempsAtelier = document.getElementById('psmTempsAtelier')?.value || '';
  psmCards[currentPsmId].questionAtelier = document.getElementById('psmQuestionAtelier')?.innerHTML || '';
  psmCards[currentPsmId].notesAtelier = document.getElementById('psmNotesAtelier')?.innerHTML || '';
  
  // Couture
  psmCards[currentPsmId].checkPsmCouture = document.getElementById('psmCheckPsmCouture')?.checked || false;
  psmCards[currentPsmId].checkPrixMajoreCouture = document.getElementById('psmCheckPrixMajoreCouture')?.checked || false;
  psmCards[currentPsmId].tempsCouture = document.getElementById('psmTempsCouture')?.value || '';
  psmCards[currentPsmId].questionCouture = document.getElementById('psmQuestionCouture')?.innerHTML || '';
  psmCards[currentPsmId].notesCouture = document.getElementById('psmNotesCouture')?.innerHTML || '';
  
  savePsmCard(currentPsmId);
}

// Initialiser PSM
function initPsm() {
  loadPsmData();
}

// Imprimer la page PSM
function printPsm() {
  if (!currentPsmId || !psmCards[currentPsmId]) {
    showToast('⚠️ Sélectionnez un PSM à imprimer');
    return;
  }
  
  const card = psmCards[currentPsmId];
  
  // Déterminer les labels
  let labelAtelier = 'Temps:';
  if (card.checkPsmAtelier) labelAtelier = 'Temps total:';
  else if (card.checkPrixMajoreAtelier) labelAtelier = 'Temps à ajouter:';
  
  let labelCouture = 'Temps:';
  if (card.checkPsmCouture) labelCouture = 'Temps total:';
  else if (card.checkPrixMajoreCouture) labelCouture = 'Temps à ajouter:';
  
  // Générer le HTML des matériaux (filtrer les vides)
  const validMaterials = (card.materials || []).filter(mat => mat.materiau && mat.materiau !== 'Sélectionner...');
  const materialsHtml = validMaterials.map(mat => {
    const displayName = mat.code ? `${mat.materiau} (${mat.code})` : mat.materiau;
    return `<tr><td>${displayName}</td><td style="text-align:center;width:80px;">${mat.quantite || '-'}</td></tr>`;
  }).join('');
  
  // Créer le contenu d'impression optimisé
  const printContent = `
    <html>
    <head>
      <title>PSM - ${card.nomPsm}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        h1 { text-align: center; font-size: 20px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
        
        /* Section Matériaux - pleine largeur */
        .materials-section { 
          margin-bottom: 15px; 
          border: 2px solid #333; 
          border-radius: 8px;
          width: 100%;
        }
        .section-title { 
          background: #e0e0e0; 
          padding: 10px 15px; 
          font-weight: bold; 
          font-size: 14px;
          border-bottom: 2px solid #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .materials-table { width: 100%; border-collapse: collapse; }
        .materials-table th { 
          background: #f0f0f0; 
          padding: 8px 12px; 
          text-align: left; 
          font-size: 11px; 
          font-weight: bold;
          border-bottom: 1px solid #999; 
        }
        .materials-table td { 
          padding: 8px 12px; 
          border-bottom: 1px solid #ddd; 
          font-size: 12px; 
        }
        .materials-table tr:last-child td {
          border-bottom: none;
        }
        
        /* Sections Atelier et Couture côte à côte */
        .temps-container { display: flex; gap: 15px; width: 100%; }
        .temps-section { 
          flex: 1; 
          border: 2px solid #333; 
          border-radius: 8px; 
        }
        .temps-content { padding: 12px; }
        
        .checkbox-row { 
          display: flex; 
          gap: 20px; 
          margin-bottom: 10px; 
          padding: 8px 10px; 
          background: #f5f5f5; 
          border-radius: 4px; 
          font-size: 11px; 
        }
        .field-row { margin-bottom: 10px; }
        .field-label { font-weight: bold; font-size: 11px; margin-bottom: 4px; }
        .field-value { 
          padding: 8px 10px; 
          border: 1px solid #ccc; 
          border-radius: 4px; 
          min-height: 20px; 
          background: #fafafa; 
        }
        
        .question-section { margin-bottom: 10px; }
        .question-label { font-weight: bold; font-size: 11px; color: #b45309; margin-bottom: 4px; }
        .question-box { 
          padding: 8px 10px; 
          border: 2px solid #fbbf24; 
          border-radius: 4px; 
          min-height: 50px; 
          background: #fffbeb; 
        }
        
        .notes-section { }
        .notes-label { font-weight: bold; font-size: 11px; margin-bottom: 4px; }
        .notes-box { 
          padding: 8px 10px; 
          border: 1px solid #ccc; 
          border-radius: 4px; 
          min-height: 80px; 
        }
        .notes-box img { max-width: 100%; height: auto; }
        
        .evaluateur { 
          font-size: 10px; 
          color: #666; 
          margin-top: 8px; 
          text-align: right; 
          font-style: italic;
        }
        
        @media print {
          body { padding: 15px; }
          .temps-container { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>📋 ${card.nomPsm}</h1>
      
      <!-- Matériaux pleine largeur -->
      <div class="materials-section">
        <div class="section-title">🔧 Matériaux</div>
        <table class="materials-table">
          <thead>
            <tr>
              <th>Matériau / Code</th>
              <th style="width:80px;text-align:center;">Qté</th>
            </tr>
          </thead>
          <tbody>
            ${materialsHtml || '<tr><td colspan="2" style="text-align:center;color:#999;padding:15px;">Aucun matériau</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <!-- Atelier et Couture côte à côte -->
      <div class="temps-container">
        <!-- Atelier -->
        <div class="temps-section">
          <div class="section-title">🔨 Temps Atelier</div>
          <div class="temps-content">
            <div class="checkbox-row">
              ${card.checkPsmAtelier ? '☑' : '☐'} PSM &nbsp;&nbsp;&nbsp; ${card.checkPrixMajoreAtelier ? '☑' : '☐'} Prix majoré
            </div>
            <div class="field-row">
              <div class="field-label">${labelAtelier}</div>
              <div class="field-value">${card.tempsAtelier || '-'}</div>
            </div>
            <div class="question-section">
              <div class="question-label">❓ Questionnement:</div>
              <div class="question-box">${card.questionAtelier || ''}</div>
            </div>
            <div class="notes-section">
              <div class="notes-label">📝 Notes:</div>
              <div class="notes-box">${card.notesAtelier || ''}</div>
            </div>
            ${card.evaluateurAtelier ? `<div class="evaluateur">Évalué par: ${card.evaluateurAtelier}</div>` : ''}
          </div>
        </div>
        
        <!-- Couture -->
        <div class="temps-section">
          <div class="section-title">🧵 Temps Couture</div>
          <div class="temps-content">
            <div class="checkbox-row">
              ${card.checkPsmCouture ? '☑' : '☐'} PSM &nbsp;&nbsp;&nbsp; ${card.checkPrixMajoreCouture ? '☑' : '☐'} Prix majoré
            </div>
            <div class="field-row">
              <div class="field-label">${labelCouture}</div>
              <div class="field-value">${card.tempsCouture || '-'}</div>
            </div>
            <div class="question-section">
              <div class="question-label">❓ Questionnement:</div>
              <div class="question-box">${card.questionCouture || ''}</div>
            </div>
            <div class="notes-section">
              <div class="notes-label">📝 Notes:</div>
              <div class="notes-box">${card.notesCouture || ''}</div>
            </div>
            ${card.evaluateurCouture ? `<div class="evaluateur">Évalué par: ${card.evaluateurCouture}</div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Ouvrir une nouvelle fenêtre pour l'impression
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

// Exposer les fonctions PSM
window.showAddPsmModal = showAddPsmModal;
window.closeAddPsmModal = closeAddPsmModal;
window.confirmAddPsm = confirmAddPsm;
window.showEditPsmModal = showEditPsmModal;
window.closeEditPsmModal = closeEditPsmModal;
window.confirmEditPsm = confirmEditPsm;
window.showImportMateriauxModal = showImportMateriauxModal;
window.closeImportMateriauxModal = closeImportMateriauxModal;
window.confirmImportMateriaux = confirmImportMateriaux;
window.selectPsmCard = selectPsmCard;
window.deletePsmCard = deletePsmCard;
window.updatePsmLabels = updatePsmLabels;
window.togglePsmExclusive = togglePsmExclusive;
window.addPsmMaterial = addPsmMaterial;
window.updatePsmMaterial = updatePsmMaterial;
window.updatePsmMaterialQty = updatePsmMaterialQty;
window.deletePsmMaterial = deletePsmMaterial;
window.savePsmTemps = savePsmTemps;
window.printPsm = printPsm;
window.initPsm = initPsm;
window.filterPsmCards = filterPsmCards;


// =============================================================================
// PAGE ATM - Gestion des cartes ATM avec fiche détaillée
// =============================================================================

let atmData = {};
let currentAtmFicheId = null;

// Types de chaises ATM (stockés dans Firebase)
let atmChaiseTypes = ['Neox', 'Simulateur', 'Spirale', 'XL 5CI', 'XL5'];

const ATM_COLUMNS = [
  { id: 0, name: 'Dossier', key: 'dossier', icon: '📁', contentId: 'colAtmDossier', countId: 'countAtmDossier' },
  { id: 1, name: 'Bac', key: 'bac', icon: '📦', contentId: 'colAtmBac', countId: 'countAtmBac' },
  { id: 2, name: 'Assemblage', key: 'assemblage', icon: '🔧', contentId: 'colAtmAssemblage', countId: 'countAtmAssemblage' },
  { id: 3, name: 'Inspection', key: 'inspection', icon: '🔍', contentId: 'colAtmInspection', countId: 'countAtmInspection' },
  { id: 4, name: 'Shipping', key: 'shipping', icon: '🚚', contentId: 'colAtmShipping', countId: 'countAtmShipping' }
];

// Charger les types de chaises depuis Firebase
function loadAtmChaiseTypes() {
  if (firebaseDb) {
    firebaseDb.ref('atmChaiseTypes').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        atmChaiseTypes = data;
      }
      updateAtmChaiseSelect();
    });
  }
}

// Mettre à jour le select des types de chaises
function updateAtmChaiseSelect() {
  const select = document.getElementById('atmModalChaise');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Sélectionner --</option>' + 
    atmChaiseTypes.map(type => `<option value="${type}">${type}</option>`).join('');
}

// Ajouter un nouveau type de chaise
function addAtmChaiseType() {
  const newType = prompt('Entrez le nouveau type de chaise:');
  if (!newType || !newType.trim()) return;
  
  const trimmed = newType.trim();
  if (atmChaiseTypes.includes(trimmed)) {
    showToast('⚠️ Ce type existe déjà');
    return;
  }
  
  atmChaiseTypes.push(trimmed);
  
  // Sauvegarder dans Firebase
  if (firebaseDb) {
    firebaseDb.ref('atmChaiseTypes').set(atmChaiseTypes);
  }
  
  updateAtmChaiseSelect();
  
  // Sélectionner le nouveau type
  const select = document.getElementById('atmModalChaise');
  if (select) select.value = trimmed;
  
  showToast('✅ Type ajouté: ' + trimmed);
}

function initAtm() {
  loadAtmChaiseTypes();
  loadAtmData();
  renderAtmCards();
}

function loadAtmData() {
  if (firebaseDb) {
    firebaseDb.ref('atm').on('value', (snapshot) => {
      atmData = snapshot.val() || {};
      renderAtmCards();
      // Rafraîchir la fiche si ouverte
      if (currentAtmFicheId && atmData[currentAtmFicheId]) {
        updateAtmFicheContent(currentAtmFicheId);
      }
    });
  }
}

function renderAtmCards() {
  // Vider toutes les colonnes
  ATM_COLUMNS.forEach(col => {
    const content = document.getElementById(col.contentId);
    const count = document.getElementById(col.countId);
    if (content) content.innerHTML = '';
    if (count) count.textContent = '0';
  });
  
  // Compter les cartes par colonne
  const counts = [0, 0, 0, 0, 0];
  
  // Trier par date de création
  const sorted = Object.entries(atmData)
    .filter(([id, card]) => card)
    .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));
  
  sorted.forEach(([id, card]) => {
    const colIndex = card.colonne || 0;
    if (colIndex < 0 || colIndex > 4) return;
    
    const col = ATM_COLUMNS[colIndex];
    const content = document.getElementById(col.contentId);
    if (!content) return;
    
    const cardEl = createAtmCard(id, card);
    content.appendChild(cardEl);
    counts[colIndex]++;
  });
  
  // Mettre à jour les compteurs
  ATM_COLUMNS.forEach((col, idx) => {
    const countEl = document.getElementById(col.countId);
    if (countEl) countEl.textContent = counts[idx];
  });
}

function createAtmCard(id, card) {
  const div = document.createElement('div');
  div.className = 'atm-card';
  div.draggable = true;
  div.dataset.id = id;
  
  const dateCreated = card.createdAt ? new Date(card.createdAt).toLocaleDateString('fr-CA') : '';
  const colIndex = card.colonne || 0;
  const isLastColumn = (colIndex >= 4);
  const chaiseType = card.chaiseType || '';
  
  // Texte du bouton selon la colonne suivante
  const nextColumnNames = ['Bac →', 'Asm →', 'Insp →', 'Ship →', '✓'];
  const btnText = nextColumnNames[colIndex] || '→';
  const btnClass = isLastColumn ? 'atm-card-next-btn disabled' : 'atm-card-next-btn';
  
  div.innerHTML = `
    <div class="atm-card-chaise" data-type="${chaiseType}">${chaiseType}</div>
    <div class="atm-card-order">#${card.order || '000000'}</div>
    <div class="atm-card-client">${card.client || 'Client'}</div>
    <div class="atm-card-desc">${card.description || ''}</div>
    <div class="atm-card-footer">
      <div class="atm-card-date">${dateCreated}</div>
      <button class="${btnClass}" onclick="event.stopPropagation(); moveAtmCardNext('${id}')">${btnText}</button>
    </div>
  `;
  
  // Click pour ouvrir la fiche
  div.onclick = (e) => {
    if (e.target.classList.contains('atm-card-next-btn')) return;
    openAtmFiche(id);
  };
  
  // Drag events
  div.ondragstart = (e) => {
    div.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
  };
  
  div.ondragend = () => {
    div.classList.remove('dragging');
  };
  
  return div;
}

// ===== FICHE ATM =====
function openAtmFiche(id) {
  if (!atmData[id]) return;
  
  currentAtmFicheId = id;
  const modal = document.getElementById('atmFicheModal');
  const overlay = document.getElementById('atmCardOverlay');
  
  // Générer le contenu de la fiche
  modal.innerHTML = generateAtmFicheHTML(id, atmData[id]);
  
  // Afficher
  modal.classList.add('active');
  overlay.classList.add('active');
  
  // Attacher les événements
  attachAtmFicheEvents(id);
}

function closeAtmFiche() {
  const modal = document.getElementById('atmFicheModal');
  const overlay = document.getElementById('atmCardOverlay');
  
  // Sauvegarder avant de fermer
  if (currentAtmFicheId && atmData[currentAtmFicheId]) {
    saveAtmCard(currentAtmFicheId);
  }
  
  modal.classList.remove('active');
  overlay.classList.remove('active');
  currentAtmFicheId = null;
}

function generateAtmFicheHTML(id, data) {
  const tracking = data.tracking || {};
  const currentCol = data.colonne || 0;
  
  // Générer la sidebar de suivi
  let trackingHTML = '<div class="atm-tracking-sidebar"><div class="atm-tracking-title">Suivi</div><div class="atm-tracking-pills">';
  
  ATM_COLUMNS.forEach((col, idx) => {
    const colTracking = tracking[col.key] || {};
    const isActive = idx === currentCol;
    const isCompleted = colTracking.entree && colTracking.sortie;
    const jours = isCompleted ? calcJoursOuvrables(colTracking.entree, colTracking.sortie) : 
                 (colTracking.entree ? calcJoursOuvrables(colTracking.entree, new Date().toLocaleDateString('fr-CA')) : '-');
    
    let pillClass = 'atm-tracking-pill';
    if (isActive) pillClass += ' active';
    if (isCompleted) pillClass += ' completed';
    
    trackingHTML += `
      <div class="${pillClass}" onclick="openAtmTrackingMenu('${id}', '${col.key}', '${col.icon} ${col.name}', event)">
        <span class="atm-tracking-pill-icon">${col.icon}</span>
        <span class="atm-tracking-pill-name">${col.name}</span>
        <span class="atm-tracking-pill-jours">${jours}</span>
      </div>
    `;
  });
  
  trackingHTML += '</div></div>';
  
  return `
    ${trackingHTML}
    <div class="atm-fiche-content">
      <div class="fiche-header">
        <div class="fiche-logo"><img src="https://raw.githubusercontent.com/Physipro-list/Physipro-serie/main/logo-physiprodemi1.png" alt="PhysiPro"/></div>
        <div class="fiche-title"><h3>Fiche ATM</h3></div>
        <button class="fiche-btn-delete" onclick="confirmDeleteAtm('${id}')" style="background:linear-gradient(to bottom,#ef4444,#dc2626);color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;">🗑️ Supprimer</button>
      </div>
      
      <div class="fiche-section">
        <div class="fiche-grid-2">
          <div class="fiche-field">
            <div class="fiche-label">N° Commande</div>
            <input type="text" class="fiche-input" data-atm-field="order" value="${data.order || ''}" placeholder="000000">
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Client</div>
            <input type="text" class="fiche-input" data-atm-field="client" value="${data.client || ''}" placeholder="Nom du client">
          </div>
        </div>
        
        <div class="fiche-grid-2" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">Type de chaise</div>
            <select class="fiche-select" data-atm-field="chaiseType" onchange="updateAtmField('${id}', 'chaiseType', this.value)">
              <option value="">-- Sélectionner --</option>
              ${atmChaiseTypes.map(type => `<option value="${type}" ${data.chaiseType === type ? 'selected' : ''}>${type}</option>`).join('')}
            </select>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Description</div>
            <input type="text" class="fiche-input" data-atm-field="description" value="${data.description || ''}" placeholder="Description...">
          </div>
        </div>
        
        <div class="fiche-grid-2" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">N° PO</div>
            <input type="text" class="fiche-input" data-atm-field="numeroPO" value="${data.numeroPO || ''}" placeholder="Numéro PO...">
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Colonne actuelle</div>
            <select class="fiche-select" data-atm-field="colonne" onchange="updateAtmColonne('${id}', this.value)">
              ${ATM_COLUMNS.map((col, idx) => `<option value="${idx}" ${idx === currentCol ? 'selected' : ''}>${col.icon} ${col.name}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div class="fiche-grid-2" style="margin-top:6px;">
          <div class="fiche-field">
            <div class="fiche-label">Date reçue</div>
            <div class="fiche-date-pill" data-atm-date="dateRecue" onclick="openAtmCalendar('${id}', 'dateRecue', this)">${data.dateRecue || 'AAAA-MM-JJ'}</div>
          </div>
          <div class="fiche-field">
            <div class="fiche-label">Date livraison</div>
            <div class="fiche-date-pill" data-atm-date="dateLivraison" onclick="openAtmCalendar('${id}', 'dateLivraison', this)">${data.dateLivraison || 'AAAA-MM-JJ'}</div>
          </div>
        </div>
      </div>
      
      <div class="fiche-section" style="margin-top:10px;">
        <div class="fiche-label" style="margin-bottom:6px;font-weight:700;">📋 Historique des déplacements</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;font-size:10px;max-height:120px;overflow-y:auto;">
          ${generateAtmHistoryHTML(data)}
        </div>
      </div>
    </div>
    
    <div class="atm-notes-page">
      <div class="atm-notes-header">
        <span>📝 Notes</span>
        <button class="notes-close-btn" onclick="closeAtmFiche()" title="Fermer">✕</button>
      </div>
      <div class="atm-notes-content" id="atmNotesContent_${id}"
        contenteditable="true"
        placeholder="Cliquez ici pour écrire... (Ctrl+V pour coller des images)"
        onblur="saveAtmNotes('${id}')"
        onpaste="handleAtmNotesPaste(event, '${id}')">${data.notes || ''}</div>
    </div>
  `;
}

function generateAtmHistoryHTML(data) {
  const tracking = data.tracking || {};
  let html = '';
  
  ATM_COLUMNS.forEach(col => {
    const t = tracking[col.key] || {};
    if (t.entree) {
      html += `<div style="margin-bottom:4px;"><strong>${col.icon} ${col.name}:</strong> Entrée ${t.entree}${t.sortie ? ' → Sortie ' + t.sortie : ' (en cours)'}</div>`;
    }
  });
  
  return html || '<div style="color:#94a3b8;">Aucun historique</div>';
}

function updateAtmFicheContent(id) {
  const modal = document.getElementById('atmFicheModal');
  if (modal.classList.contains('active') && atmData[id]) {
    // Ne pas régénérer tout, juste mettre à jour les éléments nécessaires
  }
}

function attachAtmFicheEvents(id) {
  const modal = document.getElementById('atmFicheModal');
  
  // Inputs
  modal.querySelectorAll('.fiche-input[data-atm-field]').forEach(input => {
    input.addEventListener('change', () => {
      const field = input.dataset.atmField;
      if (field && atmData[id]) {
        atmData[id][field] = input.value;
        saveAtmCard(id);
        renderAtmCards();
      }
    });
  });
}

// Mettre à jour un champ ATM et rafraîchir
function updateAtmField(id, field, value) {
  if (!atmData[id]) return;
  atmData[id][field] = value;
  saveAtmCard(id);
  renderAtmCards();
}

function openAtmCalendar(id, field, element) {
  const currentValue = atmData[id]?.[field] || '';
  
  showCalendar({
    value: currentValue && currentValue !== 'AAAA-MM-JJ' ? currentValue : '',
    mode: 'modal',
    onSelect: (dateStr) => {
      if (atmData[id]) {
        atmData[id][field] = dateStr;
        saveAtmCard(id);
        if (element) element.textContent = dateStr || 'AAAA-MM-JJ';
      }
    },
    onClear: () => {
      if (atmData[id]) {
        atmData[id][field] = '';
        saveAtmCard(id);
        if (element) element.textContent = 'AAAA-MM-JJ';
      }
    }
  });
}

function updateAtmColonne(id, newCol) {
  if (!atmData[id]) return;
  
  const oldCol = atmData[id].colonne || 0;
  const newColIndex = parseInt(newCol);
  
  // Enregistrer la sortie de l'ancienne colonne
  if (!atmData[id].tracking) atmData[id].tracking = {};
  const oldKey = ATM_COLUMNS[oldCol].key;
  if (!atmData[id].tracking[oldKey]) atmData[id].tracking[oldKey] = {};
  if (!atmData[id].tracking[oldKey].sortie) {
    atmData[id].tracking[oldKey].sortie = new Date().toLocaleDateString('fr-CA');
  }
  
  // Enregistrer l'entrée dans la nouvelle colonne
  const newKey = ATM_COLUMNS[newColIndex].key;
  if (!atmData[id].tracking[newKey]) atmData[id].tracking[newKey] = {};
  if (!atmData[id].tracking[newKey].entree) {
    atmData[id].tracking[newKey].entree = new Date().toLocaleDateString('fr-CA');
  }
  
  atmData[id].colonne = newColIndex;
  saveAtmCard(id);
  renderAtmCards();
  
  // Rafraîchir la fiche
  const modal = document.getElementById('atmFicheModal');
  modal.innerHTML = generateAtmFicheHTML(id, atmData[id]);
  attachAtmFicheEvents(id);
  
  showToast(`→ Déplacé vers ${ATM_COLUMNS[newColIndex].name}`);
}

function openAtmTrackingMenu(id, colKey, title, event) {
  event.stopPropagation();
  
  // Fermer tout menu existant
  document.getElementById('atmTrackingMenu')?.remove();
  
  if (!atmData[id]) return;
  if (!atmData[id].tracking) atmData[id].tracking = {};
  if (!atmData[id].tracking[colKey]) atmData[id].tracking[colKey] = {};
  
  const t = atmData[id].tracking[colKey];
  
  const menu = document.createElement('div');
  menu.id = 'atmTrackingMenu';
  menu.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:15px;box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:20000;min-width:250px;';
  menu.innerHTML = `
    <div style="font-weight:700;margin-bottom:10px;color:#1e40af;">${title}</div>
    <div style="margin-bottom:8px;">
      <label style="font-size:11px;color:#374151;">Date entrée:</label>
      <input type="date" id="atmTrackEntree" value="${t.entree || ''}" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;margin-top:2px;">
    </div>
    <div style="margin-bottom:12px;">
      <label style="font-size:11px;color:#374151;">Date sortie:</label>
      <input type="date" id="atmTrackSortie" value="${t.sortie || ''}" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;margin-top:2px;">
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="saveAtmTracking('${id}', '${colKey}')" style="flex:1;padding:8px;background:linear-gradient(to bottom,#22c55e,#16a34a);color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Enregistrer</button>
      <button onclick="document.getElementById('atmTrackingMenu').remove()" style="flex:1;padding:8px;background:#f1f5f9;color:#374151;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;">Annuler</button>
    </div>
  `;
  
  document.body.appendChild(menu);
}

function saveAtmTracking(id, colKey) {
  const entree = document.getElementById('atmTrackEntree').value;
  const sortie = document.getElementById('atmTrackSortie').value;
  
  if (!atmData[id].tracking) atmData[id].tracking = {};
  atmData[id].tracking[colKey] = { entree, sortie };
  
  saveAtmCard(id);
  document.getElementById('atmTrackingMenu')?.remove();
  
  // Rafraîchir la fiche
  const modal = document.getElementById('atmFicheModal');
  modal.innerHTML = generateAtmFicheHTML(id, atmData[id]);
  attachAtmFicheEvents(id);
  
  showToast('✅ Suivi enregistré');
}

function saveAtmNotes(id) {
  const content = document.getElementById(`atmNotesContent_${id}`);
  if (content && atmData[id]) {
    atmData[id].notes = content.innerHTML;
    saveAtmCard(id);
  }
}

function handleAtmNotesPaste(event, id) {
  const items = event.clipboardData?.items;
  if (!items) return;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      event.preventDefault();
      const blob = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '300px';
        
        const content = document.getElementById(`atmNotesContent_${id}`);
        if (content) {
          content.appendChild(img);
          content.appendChild(document.createElement('br'));
          saveAtmNotes(id);
        }
      };
      reader.readAsDataURL(blob);
      break;
    }
  }
}

function confirmDeleteAtm(id) {
  if (confirm('Voulez-vous vraiment supprimer cette carte ATM?')) {
    delete atmData[id];
    if (firebaseDb) {
      firebaseDb.ref('atm/' + id).remove();
    }
    closeAtmFiche();
    renderAtmCards();
    showToast('🗑️ Carte supprimée');
  }
}

// Déplacer une carte ATM vers la colonne suivante (depuis le bouton sur la carte)
function moveAtmCardNext(id) {
  if (!atmData[id]) return;
  
  const currentCol = atmData[id].colonne || 0;
  
  // Si déjà dans la dernière colonne (Shipping), ne rien faire
  if (currentCol >= 4) {
    showToast('✓ Cette carte est déjà terminée');
    return;
  }
  
  // Enregistrer la sortie de la colonne actuelle
  if (!atmData[id].tracking) atmData[id].tracking = {};
  const currentKey = ATM_COLUMNS[currentCol].key;
  if (!atmData[id].tracking[currentKey]) atmData[id].tracking[currentKey] = {};
  atmData[id].tracking[currentKey].sortie = new Date().toLocaleDateString('fr-CA');
  
  // Passer à la colonne suivante et enregistrer l'entrée
  const newCol = currentCol + 1;
  const newKey = ATM_COLUMNS[newCol].key;
  if (!atmData[id].tracking[newKey]) atmData[id].tracking[newKey] = {};
  atmData[id].tracking[newKey].entree = new Date().toLocaleDateString('fr-CA');
  
  atmData[id].colonne = newCol;
  saveAtmCard(id);
  renderAtmCards();
  
  showToast(`→ Déplacé vers ${ATM_COLUMNS[newCol].name}`);
}

// Drag & Drop pour les colonnes ATM
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    ATM_COLUMNS.forEach((col, colIndex) => {
      const content = document.getElementById(col.contentId);
      if (!content) return;
      
      content.ondragover = (e) => {
        e.preventDefault();
        content.style.background = 'rgba(74, 142, 245, 0.3)';
      };
      
      content.ondragleave = () => {
        content.style.background = '';
      };
      
      content.ondrop = (e) => {
        e.preventDefault();
        content.style.background = '';
        
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && atmData[cardId]) {
          const oldCol = atmData[cardId].colonne || 0;
          
          // Enregistrer le tracking
          if (!atmData[cardId].tracking) atmData[cardId].tracking = {};
          const oldKey = ATM_COLUMNS[oldCol].key;
          if (!atmData[cardId].tracking[oldKey]) atmData[cardId].tracking[oldKey] = {};
          atmData[cardId].tracking[oldKey].sortie = new Date().toLocaleDateString('fr-CA');
          
          const newKey = ATM_COLUMNS[colIndex].key;
          if (!atmData[cardId].tracking[newKey]) atmData[cardId].tracking[newKey] = {};
          atmData[cardId].tracking[newKey].entree = new Date().toLocaleDateString('fr-CA');
          
          atmData[cardId].colonne = colIndex;
          saveAtmCard(cardId);
          renderAtmCards();
        }
      };
    });
  }, 500);
});

function saveAtmCard(id) {
  if (firebaseDb && atmData[id]) {
    firebaseDb.ref('atm/' + id).set(atmData[id]);
  }
}

function showAddAtmModal() {
  document.getElementById('atmAddModal').style.display = 'flex';
  document.getElementById('atmModalOrder').value = '';
  document.getElementById('atmModalClient').value = '';
  document.getElementById('atmModalChaise').value = '';
  document.getElementById('atmModalDesc').value = '';
  updateAtmChaiseSelect(); // Rafraîchir la liste des types
  document.getElementById('atmModalOrder').focus();
}

function closeAddAtmModal() {
  document.getElementById('atmAddModal').style.display = 'none';
}

function confirmAddAtm() {
  const order = document.getElementById('atmModalOrder').value.trim();
  const client = document.getElementById('atmModalClient').value.trim();
  const chaiseType = document.getElementById('atmModalChaise').value;
  const description = document.getElementById('atmModalDesc').value.trim();
  
  if (!order) {
    showToast('⚠️ Numéro de commande requis');
    return;
  }
  
  const id = 'atm_' + Date.now();
  const today = new Date().toLocaleDateString('fr-CA');
  
  atmData[id] = {
    order: order,
    client: client,
    chaiseType: chaiseType,
    description: description,
    colonne: 0,
    createdAt: Date.now(),
    dateRecue: today,
    tracking: {
      dossier: { entree: today }
    }
  };
  
  saveAtmCard(id);
  closeAddAtmModal();
  renderAtmCards();
  showToast('✅ Carte ATM créée!');
}

// Exposer les fonctions ATM
window.initAtm = initAtm;
window.showAddAtmModal = showAddAtmModal;
window.closeAddAtmModal = closeAddAtmModal;
window.confirmAddAtm = confirmAddAtm;
window.addAtmChaiseType = addAtmChaiseType;
window.moveAtmCardNext = moveAtmCardNext;
window.openAtmFiche = openAtmFiche;
window.closeAtmFiche = closeAtmFiche;
window.openAtmCalendar = openAtmCalendar;
window.updateAtmColonne = updateAtmColonne;
window.updateAtmField = updateAtmField;
window.openAtmTrackingMenu = openAtmTrackingMenu;
window.saveAtmTracking = saveAtmTracking;
window.saveAtmNotes = saveAtmNotes;
window.handleAtmNotesPaste = handleAtmNotesPaste;
window.confirmDeleteAtm = confirmDeleteAtm;


// =============================================================================
// PAGE SÉRIE+ (GROSSES COMMANDES) - Structure fixe, données dynamiques
// =============================================================================

let currentSerieCommandeId = null;

function initSeriePlus() {
  renderSerieCards();
  
  // Écouter les changements Firebase pour mettre à jour les cartes seulement
  if (firebaseDb) {
    firebaseDb.ref('commandes').on('value', snapshot => {
      renderSerieCards();
      // Mettre à jour les données de la fiche seulement si une commande est sélectionnée
      if (currentSerieCommandeId && commandesData[currentSerieCommandeId]) {
        updateSerieFieldsOnly();
      }
    });
  }
}

// Filtrer les cartes Série+ par recherche
function filterSerieCards() {
  renderSerieCards();
}

function renderSerieCards() {
  const list = document.getElementById('serieCardsList');
  if (!list) return;
  
  list.innerHTML = '';
  
  // Récupérer le terme de recherche
  const searchInput = document.getElementById('serieSearchInput');
  const searchTerm = (searchInput?.value || '').toLowerCase().trim();
  
  const sorted = Object.entries(commandesData)
    .filter(([cmdId, cmd]) => {
      if (!searchTerm) return true;
      const searchText = [
        cmd.order,
        cmd.client,
        cmd.description,
        cmd.numeroPO
      ].join(' ').toLowerCase();
      return searchText.includes(searchTerm);
    })
    .sort((a, b) => {
      const posA = a[1].position ?? 999;
      const posB = b[1].position ?? 999;
      return posA - posB;
    });
  
  // Mettre à jour le compteur
  const countEl = document.getElementById('serieCommandesCount');
  if (countEl) countEl.textContent = sorted.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  sorted.forEach(([cmdId, cmd]) => {
    const card = document.createElement('div');
    const clientClass = 'client-' + (cmd.client || 'default').toLowerCase();
    const isCompleted = cmd.completed || false;
    
    // Calculer la progression et détecter les BO/Partiels
    const items = cmd.items || [];
    let totalGrandeurs = 0;
    let completedGrandeurs = 0;
    let totalQty = 0;
    let totalFait = 0;
    let hasBOorPartial = false;
    let boCount = 0;
    
    items.forEach(item => {
      (item.grandeurs || []).forEach(g => {
        totalGrandeurs++;
        const qty = parseInt(g.qty) || 0;
        const qtyFait = (g.atelier && g.atelier.qtyFait) || 0;
        totalQty += qty;
        totalFait += qtyFait;
        
        if (g.inspection && g.inspection.exped === 'expedie') {
          completedGrandeurs++;
        }
        
        // Détecter BO/Partiel - Tout ce qui n'est pas complet est un BO
        if (qty > 0 && qtyFait < qty) {
          hasBOorPartial = true;
          boCount += (qty - qtyFait);
        }
      });
    });
    const progressPct = totalGrandeurs > 0 ? Math.round((completedGrandeurs / totalGrandeurs) * 100) : 0;
    
    // Classe pour carte complète (verte)
    let cardClass = 'serie-card ' + clientClass;
    if (isCompleted) {
      cardClass += ' completed';
    }
    if (cmdId === currentSerieCommandeId) {
      cardClass += ' active';
    }
    card.className = cardClass;
    card.onclick = () => selectSerieCommande(cmdId);
    
    // Badge BO (visible et gros à droite)
    let boBadgeHtml = '';
    if (hasBOorPartial && !isCompleted) {
      boBadgeHtml = `<span class="serie-card-bo-badge">BO</span>`;
    }
    
    // Calculer le délai
    let delaiHtml = '';
    let delaiClass = '';
    const dateLiv = cmd.dateLivraison || '';
    const completedDate = cmd.completedDate || '';
    
    if (isCompleted && completedDate) {
      // Commande complétée
      delaiHtml = `
        <div class="serie-card-delai delai-complete" onclick="event.stopPropagation(); uncompleteSerieCommande('${cmdId}')">
          <span class="serie-card-delai-jours">✓</span>
          <span class="serie-card-delai-text">COMPLET</span>
          <div class="serie-card-ready-note">Prêt à expédier: ${completedDate}</div>
        </div>
      `;
    } else if (dateLiv) {
      const livraison = new Date(dateLiv);
      livraison.setHours(0, 0, 0, 0);
      
      if (livraison < today) {
        // En retard
        const joursRetard = Math.abs(calculerJoursOuvrables(livraison, today));
        delaiClass = 'delai-retard';
        delaiHtml = `
          <div class="serie-card-delai ${delaiClass}" onclick="event.stopPropagation(); completeSerieCommande('${cmdId}')">
            <span class="serie-card-delai-jours">${joursRetard}</span>
            <span class="serie-card-delai-text">jour${joursRetard > 1 ? 's' : ''} de retard</span>
            <span class="serie-card-delai-hint">Cliquer pour compléter</span>
          </div>
        `;
      } else if (livraison.getTime() === today.getTime()) {
        // Aujourd'hui
        delaiClass = 'delai-retard';
        delaiHtml = `
          <div class="serie-card-delai ${delaiClass}" onclick="event.stopPropagation(); completeSerieCommande('${cmdId}')">
            <span class="serie-card-delai-jours">!</span>
            <span class="serie-card-delai-text">Aujourd'hui!</span>
            <span class="serie-card-delai-hint">Cliquer pour compléter</span>
          </div>
        `;
      } else {
        // Jours restants
        const joursRestants = calculerJoursOuvrables(today, livraison);
        
        if (joursRestants <= 3) {
          delaiClass = 'delai-rouge';
        } else if (joursRestants <= 10) {
          delaiClass = 'delai-jaune';
        } else {
          delaiClass = 'delai-vert';
        }
        
        delaiHtml = `
          <div class="serie-card-delai ${delaiClass}" onclick="event.stopPropagation(); completeSerieCommande('${cmdId}')">
            <span class="serie-card-delai-jours">${joursRestants}</span>
            <span class="serie-card-delai-text">jour${joursRestants > 1 ? 's' : ''} ouvrable${joursRestants > 1 ? 's' : ''}</span>
            <span class="serie-card-delai-hint">Cliquer pour compléter</span>
          </div>
        `;
      }
    } else {
      delaiHtml = `
        <div class="serie-card-delai delai-none" onclick="event.stopPropagation(); completeSerieCommande('${cmdId}')">
          <span class="serie-card-delai-text">Aucune date</span>
          <span class="serie-card-delai-hint">Cliquer pour compléter</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="serie-card-client">${cmd.client || 'Client'}</div>
      <div class="serie-card-order-row">
        <span class="serie-card-order">#${cmd.order || '000000'}</span>
        ${boBadgeHtml}
      </div>
      ${delaiHtml}
      <div class="serie-card-progress">
        <div class="serie-card-progress-bar" style="width: ${progressPct}%; background: ${progressPct === 100 ? '#22c55e' : '#fff'};"></div>
      </div>
    `;
    
    list.appendChild(card);
  });
  
  // Rendre aussi la liste des BO
  renderSerieBO();
}

// Rendre la liste des Back Orders dans Série+
function renderSerieBO() {
  const list = document.getElementById('serieBoList');
  const countEl = document.getElementById('serieBoCount');
  if (!list) return;
  
  list.innerHTML = '';
  let boItems = [];
  
  // Parcourir toutes les commandes pour trouver les BO
  Object.entries(commandesData || {}).forEach(([cmdId, cmd]) => {
    if (cmd.completed) return; // Ignorer les commandes complétées
    
    const items = cmd.items || [];
    items.forEach((item, itemIndex) => {
      (item.grandeurs || []).forEach((g, gIndex) => {
        const qty = parseInt(g.qty) || 0;
        const qtyFait = (g.atelier && g.atelier.qtyFait) || 0;
        
        if (qty > 0 && qtyFait < qty) {
          boItems.push({
            cmdId,
            order: cmd.order,
            client: cmd.client,
            itemDesc: item.description || item.code || '-',
            grandeur: g.grandeur || '-',
            qtyBO: qty - qtyFait
          });
        }
      });
    });
  });
  
  // Mettre à jour le compteur
  if (countEl) countEl.textContent = boItems.length;
  
  if (boItems.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);padding:15px;font-size:10px;">Aucun BO</div>';
    return;
  }
  
  // Générer les cartes BO
  boItems.forEach(bo => {
    const card = document.createElement('div');
    card.className = 'serie-bo-card';
    card.onclick = () => selectSerieCommande(bo.cmdId);
    
    card.innerHTML = `
      <div class="serie-bo-card-order">#${bo.order}</div>
      <div class="serie-bo-card-client">${bo.client} - ${bo.grandeur}</div>
      <div class="serie-bo-card-client" style="color:#fbbf24;font-weight:700;">${bo.qtyBO} BO</div>
    `;
    
    list.appendChild(card);
  });
}

// Compléter une commande série
function completeSerieCommande(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Vérifier s'il y a des BO
  const items = cmd.items || [];
  let hasBOorPartial = false;
  let boCount = 0;
  
  items.forEach(item => {
    (item.grandeurs || []).forEach(g => {
      const qty = parseInt(g.qty) || 0;
      const qtyFait = (g.atelier && g.atelier.qtyFait) || 0;
      if (qty > 0 && qtyFait < qty) {
        hasBOorPartial = true;
        boCount += (qty - qtyFait);
      }
    });
  });
  
  // Si BO, demander confirmation d'abord
  if (hasBOorPartial) {
    const boConfirm = confirm(`⚠️ Il y a ${boCount} unité(s) en Back Order dans cette commande.\n\nLe BO a-t-il été réglé?`);
    if (!boConfirm) {
      return; // Annuler si le BO n'est pas réglé
    }
  }
  
  // Demander confirmation pour marquer comme complet
  if (confirm(`✅ Marquer la commande #${cmd.order} comme COMPLÈTE?`)) {
    cmd.completed = true;
    cmd.completedDate = today;
    saveCommandeToFirebase(cmdId);
    
    // === SUPPRIMER LES ITEMS INVENTAIRE LIÉS ===
    if (typeof inventaireData !== 'undefined') {
      const orderNum = cmd.order;
      const clientKey = (cmd.client || '').toLowerCase();
      
      const itemsToDelete = Object.entries(inventaireData)
        .filter(([id, item]) => {
          return item.commande === orderNum && 
                 (item.client || '').toLowerCase() === clientKey;
        });
      
      itemsToDelete.forEach(([itemId, item]) => {
        delete inventaireData[itemId];
        if (firebaseDb) {
          firebaseDb.ref('inventaire/' + itemId).remove();
        }
      });
      
      if (itemsToDelete.length > 0 && typeof renderInventaireCubes === 'function') {
        renderInventaireCubes();
      }
    }
    
    renderSerieCards();
    showToast(`✅ Commande #${cmd.order} complète!`);
  }
}

// Annuler la completion
function uncompleteSerieCommande(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  const message = `Commande #${cmd.order}\n\nQue voulez-vous faire?\n\n• OK = Supprimer définitivement cette commande\n• Annuler = Revenir en arrière`;
  
  if (confirm(message)) {
    // Supprimer la commande
    delete commandesData[cmdId];
    
    if (firebaseDb) {
      firebaseDb.ref('commandes/' + cmdId).remove()
        .then(() => console.log('🗑️ Commande supprimée:', cmdId))
        .catch(e => console.error('Erreur suppression:', e));
    }
    
    renderSerieCards();
    showToast(`🗑️ Commande #${cmd.order} supprimée`);
  }
}

function selectSerieCommande(cmdId) {
  currentSerieCommandeId = cmdId;
  currentCmdId = cmdId; // Pour les fonctions existantes
  
  // Mettre à jour la sélection visuelle des cartes
  document.querySelectorAll('.serie-card').forEach((c, idx) => {
    c.classList.remove('active');
  });
  
  const sorted = Object.keys(commandesData).sort((a, b) => {
    const posA = commandesData[a].position ?? 999;
    const posB = commandesData[b].position ?? 999;
    return posA - posB;
  });
  const idx = sorted.indexOf(cmdId);
  const cards = document.querySelectorAll('.serie-card');
  if (cards[idx]) cards[idx].classList.add('active');
  
  // Afficher la fiche
  const noSelection = document.getElementById('serieNoSelection');
  const ficheWrapper = document.getElementById('serieFicheWrapper');
  
  if (noSelection) noSelection.style.display = 'none';
  if (ficheWrapper) ficheWrapper.style.display = 'flex';
  
  // Charger les données dans les champs fixes
  loadSerieCommandeData(cmdId);
}

function loadSerieCommandeData(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  if (!cmd.items) cmd.items = [];
  
  // Header
  const orderDisplay = document.getElementById('serieOrderDisplay');
  const clientDisplay = document.getElementById('serieClientDisplay');
  if (orderDisplay) orderDisplay.textContent = '#' + (cmd.order || '000000');
  if (clientDisplay) clientDisplay.textContent = cmd.client || '';
  
  // Champs Info
  const fieldClient = document.getElementById('serieFieldClient');
  const fieldOrder = document.getElementById('serieFieldOrder');
  const fieldPO = document.getElementById('serieFieldPO');
  const fieldSoumission = document.getElementById('serieFieldSoumission');
  const fieldDateRecue = document.getElementById('serieFieldDateRecue');
  const fieldDateLiv = document.getElementById('serieFieldDateLiv');
  const fieldNotes = document.getElementById('serieFieldNotes');
  
  if (fieldClient) fieldClient.value = cmd.client || 'Vermeiren';
  if (fieldOrder) fieldOrder.value = cmd.order || '';
  if (fieldPO) fieldPO.value = cmd.numeroPO || '';
  if (fieldSoumission) fieldSoumission.value = cmd.numeroSoumission || '';
  if (fieldDateRecue) fieldDateRecue.textContent = cmd.dateRecue || 'Sélectionner...';
  if (fieldDateLiv) fieldDateLiv.textContent = cmd.dateLivraison || 'Sélectionner...';
  if (fieldNotes) fieldNotes.innerHTML = cmd.notes || '';
  
  // Délai
  const delaiDisplay = document.getElementById('serieDelaiDisplay');
  if (delaiDisplay && typeof renderCmdDelai === 'function') {
    delaiDisplay.innerHTML = renderCmdDelai(cmd);
  }
  
  // Matériaux
  updateSerieMateriauxSection(cmdId);
  
  // Tableau d'items
  refreshSerieItemsList(cmdId);
}

function updateSerieFieldsOnly() {
  // Met à jour seulement les données sans toucher à la structure
  if (!currentSerieCommandeId) return;
  loadSerieCommandeData(currentSerieCommandeId);
}

function updateSerieField(field, value) {
  if (!currentSerieCommandeId) return;
  
  commandesData[currentSerieCommandeId][field] = value;
  saveCommandeToFirebase(currentSerieCommandeId);
  
  // Mettre à jour le header si nécessaire
  if (field === 'order') {
    const orderDisplay = document.getElementById('serieOrderDisplay');
    if (orderDisplay) orderDisplay.textContent = '#' + value;
  }
  if (field === 'client') {
    const clientDisplay = document.getElementById('serieClientDisplay');
    if (clientDisplay) clientDisplay.textContent = value;
    renderSerieCards(); // Mettre à jour les couleurs des cartes
  }
}

function openSerieDatePicker(field) {
  if (!currentSerieCommandeId) return;
  
  const cmd = commandesData[currentSerieCommandeId];
  const currentValue = cmd[field] || '';
  
  showCalendar({
    value: currentValue,
    mode: 'modal',
    onSelect: (dateStr) => {
      commandesData[currentSerieCommandeId][field] = dateStr;
      saveCommandeToFirebase(currentSerieCommandeId);
      
      if (field === 'dateRecue') {
        document.getElementById('serieFieldDateRecue').textContent = dateStr;
      } else if (field === 'dateLivraison') {
        document.getElementById('serieFieldDateLiv').textContent = dateStr;
        renderSerieCards(); // Mettre à jour la date sur la carte
      }
      
      // Mettre à jour le délai
      const delaiDisplay = document.getElementById('serieDelaiDisplay');
      if (delaiDisplay && typeof renderCmdDelai === 'function') {
        delaiDisplay.innerHTML = renderCmdDelai(commandesData[currentSerieCommandeId]);
      }
    },
    onClear: () => {
      commandesData[currentSerieCommandeId][field] = '';
      saveCommandeToFirebase(currentSerieCommandeId);
      
      if (field === 'dateRecue') {
        document.getElementById('serieFieldDateRecue').textContent = 'Sélectionner...';
      } else if (field === 'dateLivraison') {
        document.getElementById('serieFieldDateLiv').textContent = 'Sélectionner...';
      }
    }
  });
}

function switchSerieView(view) {
  const btnInfo = document.getElementById('serieViewInfoBtn');
  const btnTableau = document.getElementById('serieViewTableBtn');
  const btnBO = document.getElementById('serieViewBOBtn');
  const viewInfo = document.getElementById('serieViewInfo');
  const viewTableau = document.getElementById('serieViewTableau');
  const viewBO = document.getElementById('serieViewBO');
  
  // Retirer active de tous les boutons et vues
  if (btnInfo) btnInfo.classList.remove('active');
  if (btnTableau) btnTableau.classList.remove('active');
  if (btnBO) btnBO.classList.remove('active');
  if (viewInfo) viewInfo.classList.remove('active');
  if (viewTableau) viewTableau.classList.remove('active');
  if (viewBO) viewBO.classList.remove('active');
  
  // Activer la bonne vue
  if (view === 'info') {
    if (btnInfo) btnInfo.classList.add('active');
    if (viewInfo) viewInfo.classList.add('active');
  } else if (view === 'tableau') {
    if (btnTableau) btnTableau.classList.add('active');
    if (viewTableau) viewTableau.classList.add('active');
  } else if (view === 'bo') {
    if (btnBO) btnBO.classList.add('active');
    if (viewBO) viewBO.classList.add('active');
    // Rafraîchir le tableau BO
    refreshSerieBOTable();
  }
}

// Fonction pour rafraîchir le tableau des Back Orders
function refreshSerieBOTable() {
  if (!currentSerieCommandeId) return;
  
  const cmd = commandesData[currentSerieCommandeId];
  if (!cmd || !cmd.items) return;
  
  const tbody = document.getElementById('serieBOTableBody');
  const emptyMsg = document.getElementById('serieBOEmpty');
  if (!tbody) return;
  
  let html = '';
  let hasBO = false;
  
  cmd.items.forEach((item, itemIdx) => {
    const grandeurs = item.grandeurs || [];
    grandeurs.forEach((g, gIdx) => {
      const qtyTotal = parseInt(g.qty) || 0;
      const atelierData = g.atelier || {};
      const qtyFait = atelierData.qtyFait || 0;
      const qtyBO = qtyTotal - qtyFait;
      
      // Afficher si BO (qtyFait < qtyTotal) OU si partiel (qtyFait > 0 mais < qtyTotal)
      if (qtyBO > 0 && qtyTotal > 0) {
        hasBO = true;
        const boReason = g.boReason || '';
        const boNoteClass = g.boNote ? 'has-note' : '';
        const isPartial = qtyFait > 0;
        const statusText = isPartial ? 'PARTIEL' : 'BO';
        const statusClass = isPartial ? 'partial' : '';
        
        html += `
          <tr>
            <td><strong>${item.name || 'Item'}</strong></td>
            <td>${g.name || '-'}</td>
            <td style="text-align: center;">${qtyTotal}</td>
            <td style="text-align: center;">${qtyFait}</td>
            <td style="text-align: center;"><span class="cmd-bo-qty-bo ${statusClass}">${qtyBO}</span></td>
            <td style="text-align: center;"><span class="cmd-bo-status ${statusClass}">${statusText}</span></td>
            <td>
              <input type="text" class="cmd-bo-reason-input" 
                     value="${boReason}" 
                     placeholder="Raison..."
                     onblur="updateBOReason('${currentSerieCommandeId}', ${itemIdx}, ${gIdx}, this.value)">
            </td>
            <td>
              <button class="cmd-bo-notes-btn ${boNoteClass}" 
                      onclick="openBONote('${currentSerieCommandeId}', ${itemIdx}, ${gIdx}, event)">
                Notes
              </button>
            </td>
          </tr>
        `;
      }
    });
  });
  
  tbody.innerHTML = html;
  
  // Afficher message si aucun BO
  if (emptyMsg) {
    emptyMsg.classList.toggle('show', !hasBO);
  }
  if (tbody.parentElement) {
    tbody.parentElement.querySelector('table').style.display = hasBO ? '' : 'none';
  }
}

// Mettre à jour la raison du BO
function updateBOReason(cmdId, itemIdx, gIdx, value) {
  const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
  g.boReason = value;
  saveCommandeToFirebase(cmdId);
}

// Ouvrir note BO
function openBONote(cmdId, itemIdx, gIdx, event) {
  event.stopPropagation();
  const g = commandesData[cmdId].items[itemIdx].grandeurs[gIdx];
  const currentNote = g.boNote || '';
  
  const newNote = prompt('Notes Back Order:', currentNote);
  if (newNote !== null) {
    g.boNote = newNote;
    saveCommandeToFirebase(cmdId);
    refreshSerieBOTable();
  }
}

// Compatibilité avec l'ancienne fonction
function toggleSerieView() {
  const viewInfo = document.getElementById('serieViewInfo');
  if (viewInfo && viewInfo.classList.contains('active')) {
    switchSerieView('tableau');
  } else {
    switchSerieView('info');
  }
}

// Garder switchSerieTab pour compatibilité
function switchSerieTab(tab) {
  switchSerieView(tab);
}

// Créer dans Inventaire depuis Série+
function createSerieInventory() {
  if (!currentSerieCommandeId) {
    showToast('⚠️ Aucune commande sélectionnée');
    return;
  }
  
  const cmd = commandesData[currentSerieCommandeId];
  if (!cmd) return;
  
  // Chercher les checkboxes cochées dans le tableau Série+
  const checkboxes = document.querySelectorAll('#serieItemsList .cmd-inv-checkbox:checked');
  
  if (checkboxes.length === 0) {
    showToast('⚠️ Sélectionnez au moins une grandeur');
    return;
  }
  
  let createdCount = 0;
  
  checkboxes.forEach(cb => {
    const itemIdx = parseInt(cb.dataset.item);
    const grandeurIdx = parseInt(cb.dataset.grandeur);
    const itemName = cb.dataset.itemname;
    const grandeurName = cb.dataset.gname;
    const qty = parseInt(cb.dataset.qty) || 0;
    
    if (qty > 0) {
      const clientLower = (cmd.client || '').toLowerCase();
      
      const invId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const invItem = {
        nom: itemName,
        code: '',
        commande: cmd.order || '',
        client: clientLower,
        grandeur: grandeurName,
        quantite: qty,
        rang: 'main',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedCmd: currentSerieCommandeId,
        linkedItemIdx: itemIdx,
        linkedGrandeurIdx: grandeurIdx
      };
      
      inventaireData[invId] = invItem;
      
      if (firebaseDb) {
        firebaseDb.ref('inventaire/' + invId).set(invItem);
      }
      
      createdCount++;
    }
  });
  
  // Rafraîchir l'affichage inventaire
  if (typeof renderInventaireCubes === 'function') {
    renderInventaireCubes();
  }
  
  // Rafraîchir le tableau pour mettre à jour les checkboxes
  refreshSerieItemsList(currentSerieCommandeId);
  
  showToast(`✅ ${createdCount} job(s) créé(s) dans le bassin!`);
  
  // Décocher toutes les checkboxes
  document.querySelectorAll('#serieItemsList .cmd-inv-checkbox:checked').forEach(cb => {
    cb.checked = false;
  });
  
  // Mettre à jour le compteur
  updateSerieSelectionCount();
}

// Mettre à jour le compteur de sélection
function updateSerieSelectionCount() {
  const checkboxes = document.querySelectorAll('#serieItemsList .cmd-inv-checkbox:checked');
  const count = checkboxes.length;
  
  const countSpan = document.getElementById('serieSelectCount');
  const btn = document.getElementById('serieCreateInvBtn');
  
  if (countSpan) countSpan.textContent = count;
  if (btn) btn.disabled = (count === 0);
}

function updateSerieMateriauxSection(cmdId) {
  const container = document.getElementById('serieMateriauxContainer');
  const totalContainer = document.getElementById('serieMateriauxTotalTop');
  if (!container) return;
  
  // Utiliser la même fonction que l'original mais avec les bons IDs
  const cmd = commandesData[cmdId];
  if (!cmd || !cmd.items || cmd.items.length === 0) {
    container.innerHTML = '<div style="color:#9ca3af;font-size:9px;text-align:center;padding:10px;">Aucun item - Ajoutez des items dans le Tableau</div>';
    if (totalContainer) totalContainer.innerHTML = '';
    return;
  }
  
  // Appeler la fonction originale avec les bons conteneurs
  if (typeof updateMateriauxSectionForSerie === 'function') {
    updateMateriauxSectionForSerie(cmdId, container, totalContainer);
  } else {
    // Fallback - utiliser updateMateriauxSection en changeant temporairement les IDs
    const origContainer = document.getElementById('cmdMateriauxContainer');
    const origTotal = document.getElementById('cmdMateriauxTotalTop');
    
    // Assigner temporairement les IDs
    container.id = 'cmdMateriauxContainer';
    if (totalContainer) totalContainer.id = 'cmdMateriauxTotalTop';
    
    updateMateriauxSection(cmdId);
    
    // Restaurer les IDs
    container.id = 'serieMateriauxContainer';
    if (totalContainer) totalContainer.id = 'serieMateriauxTotalTop';
  }
}

function refreshSerieItemsList(cmdId) {
  const itemsList = document.getElementById('serieItemsList');
  if (!itemsList) return;
  
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  if (typeof renderDeptItems === 'function') {
    itemsList.innerHTML = renderDeptItems(cmd.items || [], cmdId);
  }
}

// Override pour que les fonctions existantes utilisent les bons éléments sur Série+
const originalRefreshCmdDeptTables = window.refreshCmdDeptTables;

function refreshCmdDeptTablesForSerie(cmdId) {
  const cmd = commandesData[cmdId];
  if (!cmd) return;
  
  // Sur la page Série+, utiliser les éléments Série
  const serieItemsList = document.getElementById('serieItemsList');
  if (serieItemsList && currentSerieCommandeId === cmdId) {
    serieItemsList.innerHTML = renderDeptItems(cmd.items, cmdId);
    updateSerieMateriauxSection(cmdId);
    
    // Mettre à jour les barres de progression des cartes
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
    return;
  }
  
  // Sinon, utiliser la fonction originale pour l'overlay
  const atelierList = document.getElementById('atelierItemsList');
  if (atelierList) atelierList.innerHTML = renderDeptItems(cmd.items, cmdId);
  updateMateriauxSection(cmdId);
}

// Exposer les fonctions Série+
window.initSeriePlus = initSeriePlus;
window.renderSerieCards = renderSerieCards;
window.filterSerieCards = filterSerieCards;
window.selectSerieCommande = selectSerieCommande;
window.switchSerieTab = switchSerieTab;
window.toggleSerieView = toggleSerieView;
window.switchSerieView = switchSerieView;
window.refreshSerieBOTable = refreshSerieBOTable;
window.updateBOReason = updateBOReason;
window.openBONote = openBONote;
window.completeSerieCommande = completeSerieCommande;
window.uncompleteSerieCommande = uncompleteSerieCommande;
window.updateSerieField = updateSerieField;
window.openSerieDatePicker = openSerieDatePicker;
window.refreshSerieItemsList = refreshSerieItemsList;
window.createSerieInventory = createSerieInventory;
window.updateSerieSelectionCount = updateSerieSelectionCount;


// PAGE JOBS EN ATTENTE
// =============================================================================

let jobsData = {
  // 6 jobs exemple pour tests - dates 2025
  'job_ex_1': {
    type: 'question',
    order: '287001',
    client: 'Centre ABC',
    numeroPO: 'PO-2025-001',
    numeroSoumission: 'S-001',
    representant: 'Marie-Soleil',
    intervenant: 'Dr Martin',
    region: 'Quebec',
    assignee: 'Sonia',
    dateRecue: '2025-12-01',
    dateAmene: '2025-12-15',
    dateLivraison: '2025-12-28',
    notes: '',
    createdAt: '2025-12-15T10:00:00Z'
  },
  'job_ex_2': {
    type: 'question',
    order: '287002',
    client: 'Clinique XYZ',
    numeroPO: 'PO-2025-002',
    numeroSoumission: 'S-002',
    representant: 'Valérie',
    intervenant: 'Dr Tremblay',
    region: 'Canada anglais',
    assignee: 'Jacynthe',
    dateRecue: '2025-12-05',
    dateAmene: '2025-12-18',
    dateLivraison: '2025-12-30',
    notes: '',
    createdAt: '2025-12-18T10:00:00Z'
  },
  'job_ex_3': {
    type: 'question',
    order: '287003',
    client: 'SAT IRDPQ Hamel',
    numeroPO: 'PO-2025-003',
    numeroSoumission: 'S-003',
    representant: 'Marie-Pier',
    intervenant: 'Isabelle Neault',
    region: 'Quebec',
    assignee: 'Nadia',
    dateRecue: '2025-12-10',
    dateAmene: '2025-12-19',
    dateLivraison: '2026-01-05',
    notes: '',
    createdAt: '2025-12-19T10:00:00Z'
  },
  'job_ex_4': {
    type: 'question',
    order: '287004',
    client: 'IWK Nouvelle Ecosse',
    numeroPO: 'PO-2025-004',
    numeroSoumission: 'S-004',
    representant: 'Fabrys',
    intervenant: 'Jenny Jackson',
    region: 'Quebec',
    assignee: 'Jonathan Perreault',
    dateRecue: '2025-12-08',
    dateAmene: '2025-12-20',
    dateLivraison: '2026-01-10',
    notes: '',
    createdAt: '2025-12-20T10:00:00Z'
  },
  'job_ex_5': {
    type: 'question',
    order: '287005',
    client: 'Stan Cassidy Nouveau Brunswick',
    numeroPO: 'PO-2025-005',
    numeroSoumission: 'S-005',
    representant: 'Multipass',
    intervenant: 'Pam McKaskill',
    region: 'Canada anglais',
    assignee: 'Sonia',
    dateRecue: '2025-12-12',
    dateAmene: '2025-12-21',
    dateLivraison: '2026-01-15',
    notes: '',
    createdAt: '2025-12-21T10:00:00Z'
  },
  'job_ex_6': {
    type: 'question',
    order: '287006',
    client: 'TLC Medical',
    numeroPO: 'PO-2025-006',
    numeroSoumission: 'S-006',
    representant: 'Marie-Soleil',
    intervenant: 'Eric Gagnon',
    region: 'Quebec',
    assignee: 'Jonathan Perreault',
    dateRecue: '2025-12-14',
    dateAmene: '2025-12-21',
    dateLivraison: '2026-01-20',
    notes: '',
    createdAt: '2025-12-21T11:00:00Z'
  }
};
let currentJobId = null;

// Charger les jobs depuis Firebase
function loadJobsFromFirebase() {
  // D'abord charger depuis localStorage
  let localData = null;
  try {
    const stored = localStorage.getItem('physipro_jobs');
    if (stored) {
      localData = JSON.parse(stored);
      // Fusionner avec les exemples
      Object.keys(localData).forEach(key => {
        jobsData[key] = localData[key];
      });
      console.log('📋 Jobs chargés depuis localStorage:', Object.keys(localData).length);
    }
  } catch(e) {
    console.error('Erreur chargement localStorage jobs:', e);
  }
  
  // Afficher immédiatement
  renderJobs();
  if (typeof renderMobileJobsList === 'function') renderMobileJobsList();
  
  if (!firebaseDb) {
    return;
  }
  
  firebaseDb.ref('jobs').on('value', snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Fusionner avec les données existantes (Firebase a priorité)
      Object.keys(data).forEach(key => {
        jobsData[key] = data[key];
      });
      // Nettoyer les notes corrompues
      cleanCorruptedNotes(jobsData, 'jobs');
      // Sauvegarder en local
      saveJobsToLocalStorage();
    }
    renderJobs();
    if (typeof renderMobileJobsList === 'function') renderMobileJobsList();
    if (typeof updateMobileMenuCounts === 'function') updateMobileMenuCounts();
  });
}

// Sauvegarder tous les jobs en localStorage
function saveJobsToLocalStorage() {
  try {
    // Sauvegarder TOUS les jobs (y compris les exemples modifiés)
    localStorage.setItem('physipro_jobs', JSON.stringify(jobsData));
    console.log('💾 Jobs sauvegardés:', Object.keys(jobsData).length);
  } catch(e) {
    console.error('Erreur sauvegarde localStorage jobs:', e);
  }
}

// Sauvegarder un job
function saveJobToFirebase(jobId) {
  if (!jobsData[jobId]) return;
  
  // Toujours sauvegarder en localStorage
  saveJobsToLocalStorage();
  
  // Si Firebase disponible, sauvegarder aussi là
  if (firebaseDb) {
    firebaseDb.ref('jobs/' + jobId).set(jobsData[jobId])
      .then(() => console.log('✅ Job sauvegardé:', jobId))
      .catch(e => console.error('❌ Erreur Firebase job:', e));
  }
}

// Supprimer un job (résolu)
function deleteJobFromFirebase(jobId) {
  const job = jobsData[jobId];
  
  // Effacer les images de Firebase Storage avant de supprimer le job
  if (job) {
    // Effacer les images des questions et réponses
    if (job.questions) deleteImagesFromStorage(job.questions);
    if (job.response) deleteImagesFromStorage(job.response);
  }
  
  // Supprimer des données locales
  delete jobsData[jobId];
  
  // Sauvegarder en localStorage
  saveJobsToLocalStorage();
  
  // Si Firebase disponible, supprimer aussi là
  if (firebaseDb) {
    firebaseDb.ref('jobs/' + jobId).remove()
      .catch(e => console.error('Erreur suppression Firebase:', e));
  }
  
  renderJobs();
  closeJobFiche();
  showToast('Job résolu et archivé');
}

// Calculer jours en attente
function calcJobDays(dateStr) {
  if (!dateStr) return 0;
  const date = new Date(dateStr + 'T12:00:00'); // Midi pour éviter décalage timezone
  const today = new Date();
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

// Classe couleur jours
function getDaysClass(days) {
  if (days < 10) return 'ok';       // Même couleur que la carte
  if (days < 15) return 'warn';     // Jaune
  if (days < 25) return 'danger';   // Rouge
  return 'critical';                // Rouge clignotant
}

// Formater numéro de soumission (enlever les zéros au début si trop long)
function formatSoumission(num) {
  if (!num) return '-';
  // Si plus de 8 caractères et commence par des zéros, enlever les 4 premiers zéros
  if (num.length > 8 && num.startsWith('0000')) {
    return num.substring(4);
  }
  return num;
}

// Formater date en français
function formatJobDate(dateStr) {
  if (!dateStr) return '-- Sélectionner --';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Classe région pour CSS
function getRegionClass(region) {
  if (region === 'Quebec') return 'region-quebec';
  if (region === 'Canada anglais') return 'region-canada-anglais';
  if (region === 'France') return 'region-france';
  return 'region-quebec';
}

// Nom court région
function getRegionShort(region) {
  if (region === 'Quebec') return 'QC';
  if (region === 'Canada anglais') return 'CA-EN';
  if (region === 'France') return 'FR';
  return '--';
}

// Créer une mini-carte PROPRE
function createJobMiniCard(jobId, job) {
  const days = calcJobDays(job.dateAmene);
  const daysClass = getDaysClass(days);
  const regionClass = getRegionClass(job.region);
  const regionShort = getRegionShort(job.region);
  const orderDisplay = job.order || '000000';
  const daysLabel = `${days}j en attente`;
  
  return `
    <div class="job-mini ${regionClass}" onclick="openJobFiche('${jobId}')">
      <div class="job-mini-row1">
        <span class="job-mini-region">${regionShort}</span>
        <span class="job-mini-order">#${orderDisplay}</span>
        <span class="job-mini-rep">${job.representant || '-'}</span>
      </div>
      <div class="job-mini-row2">
        <span class="job-mini-client">${job.client || '-'}</span>
      </div>
      <div class="job-mini-days ${daysClass}">${daysLabel}</div>
    </div>
  `;
}

// Afficher les jobs
function renderJobs() {
  const listSonia = document.getElementById('listSonia');
  const listJacynthe = document.getElementById('listJacynthe');
  const listNadia = document.getElementById('listNadia');
  const listJonathan = document.getElementById('listJonathan');
  const listMateriaux = document.getElementById('listMateriaux');
  const listMoulageAttente = document.getElementById('listMoulageAttente');
  
  // Si on est sur mobile, ces éléments n'existent pas - ne pas planter
  if (!listSonia && !listJacynthe && !listNadia && !listJonathan && !listMateriaux && !listMoulageAttente) return;
  
  let htmlSonia = '', htmlJacynthe = '', htmlNadia = '', htmlJonathan = '';
  let htmlMateriaux = '', htmlMoulageAttente = '';
  let countSonia = 0, countJacynthe = 0, countNadia = 0, countJonathan = 0;
  let countMateriaux = 0, countMoulageAttente = 0;
  
  // Trier par jours en attente (plus ancien en haut)
  const sorted = Object.entries(jobsData || {})
    .filter(([id, job]) => job)
    .sort((a, b) => calcJobDays(b[1].dateAmene) - calcJobDays(a[1].dateAmene));
  
  sorted.forEach(([id, job]) => {
    const card = createJobMiniCard(id, job);
    
    // Colonnes par type
    if (job.type === 'materiaux') {
      htmlMateriaux += card;
      countMateriaux++;
    } else if (job.type === 'moulage_attente') {
      htmlMoulageAttente += card;
      countMoulageAttente++;
    } else {
      // Colonnes par assignee (type question ou autre)
      const assignee = job.assignee || 'Jonathan Perreault';
      
      if (assignee === 'Sonia') {
        htmlSonia += card;
        countSonia++;
      } else if (assignee === 'Jacynthe') {
        htmlJacynthe += card;
        countJacynthe++;
      } else if (assignee === 'Nadia') {
        htmlNadia += card;
        countNadia++;
      } else {
        htmlJonathan += card;
        countJonathan++;
      }
    }
  });
  
  // === AJOUTER LES CARTES MOULAGE EN ATTENTE (colonne 7) ===
  if (typeof cardsData !== 'undefined' && listMoulageAttente) {
    const moulageEnAttente = Object.entries(cardsData)
      .filter(([id, card]) => card && card.colonne === 7)
      .sort((a, b) => (b[1].dateCreation || 0) - (a[1].dateCreation || 0));
    
    moulageEnAttente.forEach(([cardId, card]) => {
      const miniCard = createMoulageMiniCard(cardId, card);
      htmlMoulageAttente += miniCard;
      countMoulageAttente++;
    });
  }
  
  if (listSonia) listSonia.innerHTML = htmlSonia || '<div class="jobs-empty"><div class="jobs-empty-icon">✓</div><p>Aucun</p></div>';
  if (listJacynthe) listJacynthe.innerHTML = htmlJacynthe || '<div class="jobs-empty"><div class="jobs-empty-icon">✓</div><p>Aucun</p></div>';
  if (listNadia) listNadia.innerHTML = htmlNadia || '<div class="jobs-empty"><div class="jobs-empty-icon">✓</div><p>Aucun</p></div>';
  if (listJonathan) listJonathan.innerHTML = htmlJonathan || '<div class="jobs-empty"><div class="jobs-empty-icon">🆕</div><p>Aucun</p></div>';
  if (listMateriaux) listMateriaux.innerHTML = htmlMateriaux || '<div class="jobs-empty"><div class="jobs-empty-icon">📦</div><p>Aucun</p></div>';
  if (listMoulageAttente) listMoulageAttente.innerHTML = htmlMoulageAttente || '<div class="jobs-empty"><div class="jobs-empty-icon">🔧</div><p>Aucun</p></div>';
  
  const countSoniaEl = document.getElementById('countSonia');
  const countJacyntheEl = document.getElementById('countJacynthe');
  const countNadiaEl = document.getElementById('countNadia');
  const countJonathanEl = document.getElementById('countJonathan');
  const countMateriauxEl = document.getElementById('countMateriaux');
  const countMoulageAttenteEl = document.getElementById('countMoulageAttente');
  
  if (countSoniaEl) countSoniaEl.textContent = countSonia;
  if (countJacyntheEl) countJacyntheEl.textContent = countJacynthe;
  if (countNadiaEl) countNadiaEl.textContent = countNadia;
  if (countJonathanEl) countJonathanEl.textContent = countJonathan;
  if (countMateriauxEl) countMateriauxEl.textContent = countMateriaux;
  if (countMoulageAttenteEl) countMoulageAttenteEl.textContent = countMoulageAttente;
}

// Créer une mini carte pour les moulages dans Jobs
function createMoulageMiniCard(cardId, card) {
  const client = card.client || '-';
  const order = card.order || '000000';
  const region = card.region || 'Quebec';
  
  // Couleur région
  let regionClass = 'region-quebec';
  if (region.toLowerCase().includes('anglais') || region.toLowerCase().includes('canada')) {
    regionClass = 'region-canada';
  } else if (region.toLowerCase().includes('france')) {
    regionClass = 'region-france';
  }
  
  const regionShort = region.toLowerCase().includes('france') ? 'FR' : 
                      (region.toLowerCase().includes('anglais') ? 'CA' : 'QC');
  
  // Calculer jours en attente
  const dateEntree = card.dateCreation ? new Date(card.dateCreation) : new Date();
  const today = new Date();
  const diffTime = Math.abs(today - dateEntree);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let daysClass = '';
  if (days > 14) daysClass = 'days-red';
  else if (days > 7) daysClass = 'days-yellow';
  
  return `
    <div class="job-mini moulage-mini ${regionClass}" onclick="goToMoulageCard('${cardId}')">
      <div class="job-mini-row1">
        <span class="job-mini-region">${regionShort}</span>
        <span class="job-mini-order">#${order}</span>
        <span class="job-mini-type">🔧</span>
      </div>
      <div class="job-mini-row2">
        <span class="job-mini-client">${client}</span>
      </div>
      <div class="job-mini-days ${daysClass}">${days}j en attente</div>
    </div>
  `;
}

// Aller vers une carte moulage depuis Jobs
function goToMoulageCard(cardId) {
  // Naviguer vers la page Moulages
  showPage('pageMoulages');
  
  // Attendre que la page soit affichée puis ouvrir la fiche
  setTimeout(() => {
    if (typeof openFiche === 'function') {
      openFiche(cardId);
    }
  }, 100);
}

// ===== FICHE JOB =====
function openJobFiche(jobId) {
  currentJobId = jobId;
  const job = jobsData[jobId];
  if (!job) return;
  
  let overlay = document.getElementById('jobFicheOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'jobFicheOverlay';
    overlay.className = 'job-fiche-overlay';
    document.body.appendChild(overlay);
  }
  
  const isMateriau = job.type === 'materiau';
  const regionClass = getRegionClass(job.region);
  
  overlay.innerHTML = `
    <div class="job-fiche ${regionClass}">
      <div class="job-fiche-main">
        <div class="job-fiche-header">
          <h2>Job en attente #${job.order || '------'}</h2>
          <button class="job-fiche-close" onclick="closeJobFiche()">×</button>
        </div>
        
        <div class="job-fiche-body">
          <!-- Ligne 1: Centre + Commande -->
          <div class="job-fiche-row">
            <div class="job-fiche-field">
              <label>Centre</label>
              <select id="jfClient" onchange="updateJobField('client', this.value)">
                <option value="">-- Sélectionner --</option>
                ${(customLists.moulageClients || []).map(c => `<option value="${c}" ${job.client === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="job-fiche-field">
              <label>N° Commande</label>
              <input type="text" id="jfOrder" value="${job.order || ''}" onchange="updateJobField('order', this.value)">
            </div>
          </div>
          
          <!-- Ligne 2: PO + Soumission -->
          <div class="job-fiche-row">
            <div class="job-fiche-field">
              <label>Numéro PO</label>
              <input type="text" id="jfPO" value="${job.numeroPO || ''}" onchange="updateJobField('numeroPO', this.value)">
            </div>
            <div class="job-fiche-field">
              <label>Numéro Soumission</label>
              <input type="text" id="jfSoum" value="${job.numeroSoumission || ''}" onchange="updateJobField('numeroSoumission', this.value)">
            </div>
          </div>
          
          <!-- Ligne 3: Rep + Interv + Région -->
          <div class="job-fiche-row">
            <div class="job-fiche-field">
              <label>Représentante</label>
              <select id="jfRep" onchange="updateJobField('representant', this.value)">
                <option value="">-- Sélectionner --</option>
                ${(customLists.representantes || []).map(r => `<option value="${r}" ${job.representant === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="job-fiche-field">
              <label>Intervenant</label>
              <select id="jfInterv" onchange="updateJobField('intervenant', this.value)">
                <option value="">-- Sélectionner --</option>
                ${(customLists.intervenants || []).map(i => `<option value="${i}" ${job.intervenant === i ? 'selected' : ''}>${i}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <!-- Ligne: Assigné + Région -->
          <div class="job-fiche-row">
            <div class="job-fiche-field">
              <label>Assigné à</label>
              <select id="jfAssignee" onchange="updateJobField('assignee', this.value); renderJobs();">
                <option value="Sonia" ${job.assignee === 'Sonia' ? 'selected' : ''}>Sonia</option>
                <option value="Jacynthe" ${job.assignee === 'Jacynthe' ? 'selected' : ''}>Jacynthe</option>
                <option value="Nadia" ${job.assignee === 'Nadia' ? 'selected' : ''}>Nadia</option>
                <option value="Jonathan Perreault" ${(job.assignee === 'Jonathan Perreault' || !job.assignee) ? 'selected' : ''}>Jonathan Perreault</option>
              </select>
            </div>
            <div class="job-fiche-field">
              <label>Région</label>
              <select id="jfRegion" onchange="updateJobField('region', this.value); updateFicheRegionColor();">
                <option value="Quebec" ${job.region === 'Quebec' ? 'selected' : ''}>Québec</option>
                <option value="Canada anglais" ${job.region === 'Canada anglais' ? 'selected' : ''}>Canada anglais</option>
                <option value="France" ${job.region === 'France' ? 'selected' : ''}>France</option>
              </select>
            </div>
          </div>
          
          <!-- Ligne: Dates -->
          <div class="job-fiche-row">
            <div class="job-fiche-field">
              <label>Date réception</label>
              <div class="job-date-pill" id="jfDateRecue" onclick="openJobCalendar('dateRecue', this)">${formatJobDate(job.dateRecue)}</div>
            </div>
            <div class="job-fiche-field">
              <label>Mise en attente</label>
              <div class="job-date-pill" id="jfDateAmene" onclick="openJobCalendar('dateAmene', this)">${formatJobDate(job.dateAmene)}</div>
            </div>
            <div class="job-fiche-field">
              <label>Livraison prévue</label>
              <div class="job-date-pill" id="jfDateLivraison" onclick="openJobCalendar('dateLivraison', this)">${formatJobDate(job.dateLivraison)}</div>
            </div>
          </div>
        </div>
        
        <div class="job-fiche-footer">
          <button class="job-fiche-btn btn-delete" onclick="deleteJob()">🗑️ Supprimer</button>
          <button class="job-fiche-btn btn-close" onclick="closeJobFiche()">Fermer</button>
        </div>
      </div>
      
      <div class="job-fiche-notes">
        <div class="job-notes-header">
          <div class="job-notes-header-left">
            <span>📝 Notes & Questions</span>
          </div>
          <button class="job-notes-close" onclick="closeJobFiche()">×</button>
        </div>
        
        <!-- Boutons d'action - toute la largeur -->
        <div class="job-notes-actions">
          <button class="job-notes-action-btn btn-resolve" onclick="resolveJob()">✓ Résolu</button>
          <button class="job-notes-action-btn btn-email" onclick="sendJobEmailWithQuestions()">Envoyer questionnement service client</button>
          <button class="job-notes-action-btn btn-print" onclick="printJobNotes()">🖨️ Imprimer</button>
        </div>
        
        <div class="job-notes-body">
          <!-- Zone Questions -->
          <div class="job-questions-section">
            <div class="job-questions-label">❓ Questions pour intervenant / acheteur / agent service client</div>
            <div class="job-questions-content" 
                 id="jobQuestionsContent" 
                 contenteditable="true" 
                 onblur="saveJobQuestions()"
                 onpaste="handleQuestionsPaste(event)"
                 onfocus="handleStandardNoteClick('jobQuestionsContent', saveJobQuestions)"
                 onclick="handleNotesImageClick(event)">${job.questions || ''}</div>
          </div>
          
          <!-- Zone Réponse -->
          <div class="job-response-section">
            <div class="job-response-label">✅ Réponse</div>
            <div class="job-response-content" 
                 id="jobResponseContent" 
                 contenteditable="true" 
                 onblur="saveJobResponse()"
                 onpaste="handleResponsePaste(event)"
                 onfocus="handleStandardNoteClick('jobResponseContent', saveJobResponse)"
                 onclick="handleNotesImageClick(event)">${job.response || ''}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Menu photo popup -->
    <div class="job-photo-menu" id="jobPhotoMenu" style="display:none;">
      <div class="job-photo-menu-header">📷 Photo <span id="jobPhotoMenuNum">1</span></div>
      <div class="job-photo-menu-body">
        <input type="text" id="jobPhotoUrl" placeholder="Coller l'URL de l'image..." onkeyup="if(event.key==='Enter')saveJobPhotoUrl()">
      </div>
      <div class="job-photo-menu-btns">
        <button onclick="viewJobPhoto()">👁️ Voir</button>
        <button onclick="saveJobPhotoUrl()">💾 Sauver</button>
        <button onclick="clearJobPhoto()">🗑️</button>
        <button onclick="closeJobPhotoMenu()">Fermer</button>
      </div>
    </div>
  `;
  
  overlay.style.display = 'flex';
  
  // Initialiser le redimensionnement des images existantes
  setTimeout(() => initNotesImageResizing(), 100);
}

function closeJobFiche() {
  // Sauvegarder avant de fermer
  if (currentJobId && jobsData[currentJobId]) {
    saveJobToFirebase(currentJobId);
  }
  const overlay = document.getElementById('jobFicheOverlay');
  if (overlay) overlay.style.display = 'none';
  currentJobId = null;
  closeJobPhotoMenu();
  closeCalendar();
  // Rafraîchir la liste
  renderJobs();
}

function updateFicheRegionColor() {
  const region = document.getElementById('jfRegion')?.value || 'Quebec';
  const fiche = document.querySelector('.job-fiche');
  if (fiche) {
    fiche.className = 'job-fiche ' + getRegionClass(region);
  }
}

function updateJobField(field, value) {
  if (!currentJobId || !jobsData[currentJobId]) return;
  jobsData[currentJobId][field] = value;
  jobsData[currentJobId].updatedAt = new Date().toISOString();
  saveJobToFirebase(currentJobId);
  renderJobs();
  
  // Mettre à jour la classe région si changement
  if (field === 'region') {
    const fiche = document.querySelector('.job-fiche');
    if (fiche) {
      fiche.className = 'job-fiche ' + getRegionClass(value);
    }
  }
}

// Sélectionner la région
function selectJobRegion(region) {
  document.querySelectorAll('.job-region-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.job-region-btn[data-region="${region}"]`)?.classList.add('active');
  updateJobField('region', region);
}

// ===== CALENDRIER POUR JOBS =====
function openJobCalendar(field, element) {
  if (!currentJobId) return;
  
  showCalendar({
    value: jobsData[currentJobId][field] || '',
    mode: 'modal',
    onSelect: (dateStr) => {
      if (dateStr && currentJobId && jobsData[currentJobId]) {
        jobsData[currentJobId][field] = dateStr;
        element.textContent = formatJobDate(dateStr);
        saveJobToFirebase(currentJobId);
        renderJobs();
      }
      closeCalendar();
    },
    onClear: () => {
      if (currentJobId && jobsData[currentJobId]) {
        jobsData[currentJobId][field] = '';
        element.textContent = '-- Sélectionner --';
        saveJobToFirebase(currentJobId);
        renderJobs();
      }
      closeCalendar();
    }
  });
}

// ===== PHOTOS =====
let currentJobPhotoNum = 1;

function openJobPhotoMenu(num) {
  currentJobPhotoNum = num;
  const job = jobsData[currentJobId];
  if (!job) return;
  
  document.getElementById('jobPhotoMenuNum').textContent = num;
  document.getElementById('jobPhotoUrl').value = job['photo' + num] || '';
  document.getElementById('jobPhotoMenu').style.display = 'block';
}

function closeJobPhotoMenu() {
  const menu = document.getElementById('jobPhotoMenu');
  if (menu) menu.style.display = 'none';
}

function saveJobPhotoUrl() {
  if (!currentJobId) return;
  const url = document.getElementById('jobPhotoUrl').value.trim();
  jobsData[currentJobId]['photo' + currentJobPhotoNum] = url;
  saveJobToFirebase(currentJobId);
  
  const btns = document.querySelectorAll('.job-photo-btn');
  if (btns[currentJobPhotoNum - 1]) {
    btns[currentJobPhotoNum - 1].classList.toggle('has-link', !!url);
  }
  
  closeJobPhotoMenu();
  showToast('Photo enregistrée');
}

function viewJobPhoto() {
  const url = document.getElementById('jobPhotoUrl').value.trim();
  if (url) window.open(url, '_blank');
}

function clearJobPhoto() {
  document.getElementById('jobPhotoUrl').value = '';
  saveJobPhotoUrl();
}

// ===== SYSTÈME DE NOTES STANDARDISÉ =====
// Tracking: stocke l'état du dernier timestamp pour chaque zone de notes
const noteStates = {};

/**
 * Fonction standardisée pour gérer les timestamps dans toutes les zones de notes
 * @param {string} contentId - L'ID de l'élément contenteditable
 * @param {function} saveFunc - La fonction de sauvegarde à appeler
 */
function handleStandardNoteClick(contentId, saveFunc) {
  const content = document.getElementById(contentId);
  if (!content) return;
  
  const userName = currentUser?.name || 'Utilisateur';
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  
  // Initialiser l'état si nécessaire
  if (!noteStates[contentId]) {
    noteStates[contentId] = { lastUser: null, lastTimestamp: null, contentAfterTimestamp: '' };
  }
  
  const state = noteStates[contentId];
  const currentHtml = content.innerHTML || '';
  const isEmpty = !currentHtml || currentHtml === '<br>' || currentHtml.trim() === '';
  
  // Créer le nouveau timestamp formaté (gras et plus gros)
  const timestampHtml = `<div class="note-timestamp"><span class="note-user">${userName}</span> <span class="note-datetime">— ${dateStr} ${timeStr}</span></div>`;
  
  // Trouver le dernier timestamp dans le contenu
  const timestampRegex = /<div class="note-timestamp">.*?<\/div>/g;
  const timestamps = currentHtml.match(timestampRegex);
  const lastTimestamp = timestamps ? timestamps[timestamps.length - 1] : null;
  
  if (lastTimestamp) {
    // Extraire le nom d'utilisateur du dernier timestamp
    const userMatch = lastTimestamp.match(/<span class="note-user">([^<]+)<\/span>/);
    const lastUserInTimestamp = userMatch ? userMatch[1] : null;
    
    // Trouver le contenu après le dernier timestamp
    const lastTimestampIndex = currentHtml.lastIndexOf(lastTimestamp);
    const contentAfterLastTimestamp = currentHtml.substring(lastTimestampIndex + lastTimestamp.length);
    
    // Vérifier si du texte a été ajouté après le dernier timestamp
    const textAfter = contentAfterLastTimestamp.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const hasNewContent = textAfter.length > 0;
    
    if (lastUserInTimestamp === userName) {
      // Même utilisateur
      if (!hasNewContent) {
        // Pas de nouveau contenu - rafraîchir seulement la date/heure
        const newHtml = currentHtml.substring(0, lastTimestampIndex) + timestampHtml + contentAfterLastTimestamp;
        content.innerHTML = newHtml;
        placeCursorAtEnd(content);
        if (saveFunc) saveFunc();
        return;
      }
      // Nouveau contenu ajouté - ajouter un nouveau timestamp
    }
    // Utilisateur différent OU nouveau contenu - ajouter un nouveau timestamp
  }
  
  // Ajouter un nouveau timestamp
  if (isEmpty) {
    content.innerHTML = timestampHtml + '<div><br></div>';
  } else {
    content.innerHTML = currentHtml + '<br>' + timestampHtml + '<div><br></div>';
  }
  
  placeCursorAtEnd(content);
  if (saveFunc) saveFunc();
}

/**
 * Place le curseur à la fin d'un élément contenteditable
 */
function placeCursorAtEnd(element) {
  setTimeout(() => {
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    element.scrollTop = element.scrollHeight;
  }, 10);
}

// ===== NOTES JOB (Questions/Réponses) =====
function insertJobNoteTimestamp(event) {
  // Cette fonction est gardée pour compatibilité mais n'est plus utilisée dans le HTML actuel
  const content = document.getElementById('jobNotesContent');
  if (!content || !currentJobId) return;
  handleStandardNoteClick('jobNotesContent', saveJobNotes);
}

function handleJobNotesPaste(event) {
  // Bloquer le collage d'images - utiliser le bouton Lien à la place
  const items = event.clipboardData?.items;
  if (!items) return;
  
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      alert('⚠️ Les images ne peuvent pas être collées directement.\n\nUtilisez le bouton "🔗 Lien" pour ajouter un lien vers votre image (Google Drive, Dropbox, etc.)');
      return;
    }
  }
}

// Rendre une image redimensionnable comme Word
function makeImageResizable(img) {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  img.addEventListener('mousedown', function(e) {
    // Commencer le redimensionnement seulement si on est près du bord
    const rect = img.getBoundingClientRect();
    const isNearEdge = (rect.right - e.clientX < 20) && (rect.bottom - e.clientY < 20);
    
    if (isNearEdge) {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = img.offsetWidth;
      startHeight = img.offsetHeight;
      img.classList.add('resizing');
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });
  
  function onMouseMove(e) {
    if (!isResizing) return;
    const newWidth = startWidth + (e.clientX - startX);
    if (newWidth > 50 && newWidth < 500) {
      img.style.width = newWidth + 'px';
      img.style.height = 'auto';
    }
  }
  
  function onMouseUp() {
    isResizing = false;
    img.classList.remove('resizing');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    saveJobNotes();
  }
}

// Initialiser le redimensionnement pour les images existantes
function initNotesImageResizing() {
  const content = document.getElementById('jobNotesContent');
  if (content) {
    content.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'nwse-resize';
      makeImageResizable(img);
    });
  }
}

function saveJobNotes() {
  if (!currentJobId) return;
  const content = document.getElementById('jobNotesContent');
  if (content) {
    jobsData[currentJobId].notes = content.innerHTML;
    saveJobToFirebase(currentJobId);
  }
}

// ===== INSERTION DE LIENS DANS LES NOTES =====
// Variable pour sauvegarder la sélection
let savedSelection = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedSelection = sel.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (savedSelection) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
  }
}

function showInsertLinkPopup(target, cardId = null) {
  // Sauvegarder la sélection/position du curseur AVANT d'ouvrir le popup
  saveSelection();
  
  // Supprimer popup existant
  document.getElementById('insertLinkOverlay')?.remove();
  document.getElementById('insertLinkPopup')?.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'insertLinkOverlay';
  overlay.className = 'insert-link-popup-overlay';
  overlay.onclick = closeInsertLinkPopup;
  
  const popup = document.createElement('div');
  popup.id = 'insertLinkPopup';
  popup.className = 'insert-link-popup';
  popup.dataset.target = target;
  popup.dataset.cardId = cardId || '';
  popup.onclick = e => e.stopPropagation();
  popup.innerHTML = `
    <div class="insert-link-header">
      <span>🔗 Insérer un lien</span>
      <button class="insert-link-close" onclick="closeInsertLinkPopup()">×</button>
    </div>
    <div class="insert-link-body">
      <div class="insert-link-field">
        <label>URL du lien (image, document, page web...)</label>
        <input type="url" id="insertLinkUrl" placeholder="https://drive.google.com/..." oninput="updateLinkPreview()">
      </div>
      <div class="insert-link-field">
        <label>Texte à afficher (optionnel)</label>
        <input type="text" id="insertLinkText" placeholder="Ex: Photo client, Devis, etc." value="📎 Voir le fichier">
      </div>
      <div class="insert-link-preview" id="insertLinkPreview">
        <span style="color:#94a3b8;">Aperçu: </span>
        <a href="#" class="note-link" onclick="return false;">🔗 📎 Voir le fichier</a>
      </div>
    </div>
    <div class="insert-link-btns">
      <button class="btn-cancel" onclick="closeInsertLinkPopup()">Annuler</button>
      <button class="btn-insert" onclick="insertLinkIntoNotes()">✓ Insérer</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  setTimeout(() => document.getElementById('insertLinkUrl')?.focus(), 100);
}

function updateLinkPreview() {
  const url = document.getElementById('insertLinkUrl')?.value || '';
  const text = document.getElementById('insertLinkText')?.value || '📎 Voir le fichier';
  const preview = document.getElementById('insertLinkPreview');
  
  if (preview) {
    if (url) {
      preview.innerHTML = `<span style="color:#94a3b8;">Aperçu: </span><a href="${url}" target="_blank" class="note-link">🔗 ${text}</a>`;
    } else {
      preview.innerHTML = `<span style="color:#94a3b8;">Aperçu: </span><a href="#" class="note-link" onclick="return false;">🔗 ${text}</a>`;
    }
  }
}

function closeInsertLinkPopup() {
  document.getElementById('insertLinkOverlay')?.remove();
  document.getElementById('insertLinkPopup')?.remove();
}

function insertLinkIntoNotes() {
  const popup = document.getElementById('insertLinkPopup');
  const target = popup?.dataset?.target;
  const cardId = popup?.dataset?.cardId;
  
  const url = document.getElementById('insertLinkUrl')?.value?.trim();
  const text = document.getElementById('insertLinkText')?.value?.trim() || '📎 Voir le fichier';
  
  if (!url) {
    alert('Veuillez entrer une URL');
    return;
  }
  
  const linkHTML = `<a href="${url}" target="_blank" class="note-link">🔗 ${text}</a>&nbsp;`;
  let contentElement = null;
  
  if (target === 'job') {
    // Insérer dans la zone Questions
    contentElement = document.getElementById('jobQuestionsContent');
    if (contentElement) {
      // Restaurer la sélection et insérer à la position du curseur
      contentElement.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, linkHTML);
      saveJobQuestions();
    }
  } else if (target === 'moulage' && cardId) {
    contentElement = document.getElementById('notesContent_' + cardId);
    if (contentElement) {
      contentElement.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, linkHTML);
      saveMoulageNotes(cardId);
    }
  } else if (target === 'moulage_popup' && cardId) {
    contentElement = document.getElementById('notesContent_popup_' + cardId);
    if (contentElement) {
      contentElement.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, linkHTML);
      savePopupNotes(cardId);
    }
  } else if (target === 'mobile_moulage') {
    contentElement = document.getElementById('mobileNotesContent');
    if (contentElement) {
      contentElement.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, linkHTML);
      saveMobileNotesContent();
    }
  } else if (target === 'mobile_job') {
    contentElement = document.getElementById('mobileJobNotesContent');
    if (contentElement) {
      contentElement.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, linkHTML);
      saveMobileJobNotesContent();
    }
  }
  
  savedSelection = null;
  closeInsertLinkPopup();
}

// Exposer les fonctions
window.showInsertLinkPopup = showInsertLinkPopup;
window.closeInsertLinkPopup = closeInsertLinkPopup;
window.updateLinkPreview = updateLinkPreview;
window.insertLinkIntoNotes = insertLinkIntoNotes;

// ===== MODAL AJOUT =====
let addJobType = 'question';
let addJobDates = { dateRecue: '', dateAmene: new Date().toLocaleDateString('fr-CA') };

let addJobAssignee = 'Jonathan Perreault';

function showAddJobModal(defaultType = 'question', assignee = 'Jonathan Perreault') {
  addJobType = defaultType;
  addJobAssignee = assignee;
  addJobDates = { dateRecue: '', dateAmene: new Date().toLocaleDateString('fr-CA') };
  
  const typeLabels = {
    'question': 'Questionnement',
    'materiaux': '📦 En attente de matériaux',
    'moulage_attente': '🔧 Moulage en attente'
  };
  const modalTitle = typeLabels[defaultType] || 'Ajouter un job';
  
  let modal = document.getElementById('jobAddModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'jobAddModal';
    modal.className = 'job-add-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="job-add-modal">
      <div class="job-add-header">
        <h3>${modalTitle}</h3>
        <div class="job-add-header-btns">
          <input type="file" id="jobJsonInput" accept=".json" style="display:none" onchange="handleImportJobJson(event)" multiple>
          <button class="job-header-import-btn" onclick="document.getElementById('jobJsonInput').click()">📥 JSON</button>
          <button class="job-add-close" onclick="closeAddJobModal()">×</button>
        </div>
      </div>
      <div class="job-add-body">
        <!-- Type de job -->
        <div class="job-add-row">
          <div class="job-add-field">
            <label>Type de job *</label>
            <select id="addJobType" onchange="addJobType=this.value;">
              <option value="question" ${defaultType === 'question' ? 'selected' : ''}>❓ Questionnement</option>
              <option value="materiaux" ${defaultType === 'materiaux' ? 'selected' : ''}>📦 En attente de matériaux</option>
              <option value="moulage_attente" ${defaultType === 'moulage_attente' ? 'selected' : ''}>🔧 Moulage en attente</option>
            </select>
          </div>
          <div class="job-add-field">
            <label>Matériau manquant</label>
            <input type="text" id="addJobMateriau" placeholder="Ex: Mousse X, Tissu Y...">
          </div>
        </div>
        
        <!-- Centre + Commande -->
        <div class="job-add-row">
          <div class="job-add-field" style="flex:3;">
            <label>Centre</label>
            <select id="addJobClient">
              <option value="">-- Sélectionner --</option>
              ${(customLists.moulageClients || []).map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="job-add-field" style="flex:1;">
            <label>N° Commande *</label>
            <input type="text" id="addJobOrder" placeholder="000000" value="000000" onclick="if(this.value==='000000')this.select()">
          </div>
        </div>
        
        <!-- Assigné à + Région -->
        <div class="job-add-row">
          <div class="job-add-field">
            <label>Assigné à</label>
            <select id="addJobAssignee">
              <option value="Sonia" ${assignee === 'Sonia' ? 'selected' : ''}>Sonia</option>
              <option value="Jacynthe" ${assignee === 'Jacynthe' ? 'selected' : ''}>Jacynthe</option>
              <option value="Nadia" ${assignee === 'Nadia' ? 'selected' : ''}>Nadia</option>
              <option value="Jonathan Perreault" ${assignee === 'Jonathan Perreault' ? 'selected' : ''}>Jonathan Perreault</option>
            </select>
          </div>
          <div class="job-add-field">
            <label>Région</label>
            <select id="addJobRegion">
              <option value="Quebec">Québec</option>
              <option value="Canada anglais">Canada anglais</option>
              <option value="France">France</option>
            </select>
          </div>
        </div>
        
        <!-- Représentante + Intervenant -->
        <div class="job-add-row">
          <div class="job-add-field">
            <label>Représentante</label>
            <select id="addJobRep">
              <option value="">-- Sélectionner --</option>
              ${(customLists.representantes || ['Marie-Soleil', 'Marie-Pier']).map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div class="job-add-field">
            <label>Intervenant</label>
            <select id="addJobInterv">
              <option value="">-- Sélectionner --</option>
              ${(customLists.intervenants || []).map(i => `<option value="${i}">${i}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <!-- PO + Soumission -->
        <div class="job-add-row">
          <div class="job-add-field">
            <label>Numéro PO</label>
            <input type="text" id="addJobPO" placeholder="PO">
          </div>
          <div class="job-add-field">
            <label>Numéro Soumission</label>
            <input type="text" id="addJobSoum" placeholder="Soumission">
          </div>
        </div>
        
        <!-- Dates -->
        <div class="job-add-row">
          <div class="job-add-field">
            <label>Date réception</label>
            <div class="job-add-date-pill" id="addDateRecue" onclick="openAddJobCalendar('dateRecue', this)">-- Sélectionner --</div>
          </div>
          <div class="job-add-field">
            <label>Date mise en attente</label>
            <div class="job-add-date-pill" id="addDateAmene" onclick="openAddJobCalendar('dateAmene', this)">${formatJobDate(addJobDates.dateAmene)}</div>
          </div>
        </div>
      </div>
      <div class="job-add-footer">
        <button class="job-add-btn cancel" onclick="closeAddJobModal()">Annuler</button>
        <button class="job-add-btn save" onclick="saveNewJob()">💾 Ajouter</button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Import JSON - comme moulages
function handleImportJobJson(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  let totalImported = 0;
  let filesProcessed = 0;
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        const jobsArray = Array.isArray(data) ? data : [data];
        
        jobsArray.forEach(job => {
          if (job.order) {
            const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            jobsData[jobId] = {
              type: job.type || 'question',
              order: job.order || '',
              numeroPO: job.numeroPO || job.po || '',
              numeroSoumission: job.numeroSoumission || job.soumission || '',
              client: job.client || '',
              representant: job.representant || job.rep || '',
              intervenant: job.intervenant || '',
              region: job.region || 'Quebec',
              dateRecue: job.dateRecue || '',
              dateAmene: job.dateAmene || new Date().toLocaleDateString('fr-CA'),
              dateLivraison: job.dateLivraison || '',
              materiau: job.materiau || '',
              notes: job.notes || '',
              createdAt: new Date().toISOString()
            };
            saveJobToFirebase(jobId);
            totalImported++;
          }
        });
        
        filesProcessed++;
        if (filesProcessed === files.length) {
          renderJobs();
          closeAddJobModal();
          showToast(`${totalImported} job(s) importé(s)!`);
        }
      } catch (err) {
        console.error('Erreur JSON:', err);
        showToast('Erreur dans le fichier JSON');
      }
    };
    reader.readAsText(file);
  });
  
  event.target.value = '';
}

function openAddJobCalendar(field, element) {
  showCalendar({
    value: addJobDates[field] || '',
    mode: 'modal',
    onSelect: (dateStr) => {
      if (dateStr) {
        addJobDates[field] = dateStr;
        element.textContent = formatJobDate(dateStr);
      }
      closeCalendar();
    },
    onClear: () => {
      addJobDates[field] = '';
      element.textContent = '-- Sélectionner --';
      closeCalendar();
    }
  });
}

function closeAddJobModal() {
  const modal = document.getElementById('jobAddModal');
  if (modal) modal.style.display = 'none';
  closeCalendar();
}

function saveNewJob() {
  const order = document.getElementById('addJobOrder').value.trim();
  if (!order) {
    alert('Numéro de commande requis');
    return;
  }
  
  const selectedType = document.getElementById('addJobType')?.value || addJobType || 'question';
  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  jobsData[jobId] = {
    type: selectedType,
    order: order,
    numeroPO: document.getElementById('addJobPO').value.trim(),
    numeroSoumission: document.getElementById('addJobSoum')?.value.trim() || '',
    client: document.getElementById('addJobClient').value,
    representant: document.getElementById('addJobRep').value,
    intervenant: document.getElementById('addJobInterv').value,
    region: document.getElementById('addJobRegion').value || 'Quebec',
    assignee: document.getElementById('addJobAssignee')?.value || 'Jonathan Perreault',
    materiau: document.getElementById('addJobMateriau')?.value.trim() || '',
    dateRecue: addJobDates.dateRecue,
    dateAmene: addJobDates.dateAmene,
    notes: '',
    createdAt: new Date().toISOString()
  };
  
  saveJobToFirebase(jobId);
  closeAddJobModal();
  renderJobs();
  // Mettre à jour la liste mobile aussi
  if (typeof renderMobileJobsList === 'function') renderMobileJobsList();
  if (typeof updateMobileMenuCounts === 'function') updateMobileMenuCounts();
  showToast('Job ajouté!');
}

// ===== ACTIONS =====

// Sauvegarder les questions
function saveJobQuestions() {
  if (!currentJobId) return;
  const content = document.getElementById('jobQuestionsContent');
  if (content) {
    jobsData[currentJobId].questions = content.innerHTML;
    saveJobToFirebase(currentJobId);
  }
}

// Gérer le collage d'images et de liens dans la zone Questions
// Gérer le collage dans la zone Questions (utilise la fonction générique)
function handleQuestionsPaste(e) {
  handleGenericImagePaste(e, saveJobQuestions, 'questions');
}

// Gérer le collage dans la zone Réponse
function handleResponsePaste(e) {
  handleGenericImagePaste(e, saveJobResponse, 'responses');
}

// Gérer le collage dans les notes de moulage
function handleMoulageNotesPaste(e, cardId) {
  const saveFunc = () => saveMoulageNotesContent(cardId);
  handleGenericImagePaste(e, saveFunc, 'moulage-notes');
}

// Sauvegarder les notes de moulage depuis un contenteditable (appelé par onblur)
function saveMoulageNotesContent(cardId) {
  const content = document.getElementById('notesContent_' + cardId);
  if (content && cardsData[cardId]) {
    cardsData[cardId].notes = content.innerHTML;
    saveCardToFirebase(cardId);
  }
}

// Uploader une image sur Firebase Storage (version générique)
async function uploadImageToFirebase(blob, placeholder, saveCallback, folderName) {
  try {
    // Vérifier si Firebase Storage est disponible
    if (!firebase.storage) {
      throw new Error('Firebase Storage non disponible');
    }
    
    const storage = firebase.storage();
    const timestamp = Date.now();
    const folder = folderName || 'images';
    const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substr(2, 6)}.png`;
    const storageRef = storage.ref(fileName);
    
    // Uploader le fichier
    const snapshot = await storageRef.put(blob);
    
    // Obtenir l'URL de téléchargement
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    // Créer juste une image simple redimensionnable
    const img = document.createElement('img');
    img.src = downloadURL;
    img.className = 'resizable-inline-image';
    img.style.cssText = 'max-width:300px;max-height:200px;border-radius:4px;cursor:nwse-resize;';
    img.title = 'Cliquer et glisser un coin pour redimensionner';
    img.onclick = (e) => { e.preventDefault(); window.open(downloadURL, '_blank'); };
    
    // Ajouter le redimensionnement par drag
    makeImageResizable(img, saveCallback);
    
    // Remplacer le placeholder
    placeholder.replaceWith(img);
    
    // Appeler le callback de sauvegarde
    if (typeof saveCallback === 'function') {
      saveCallback();
    }
    
    showToast('✅ Image uploadée!');
    
  } catch (error) {
    console.error('Erreur upload:', error);
    
    // Fallback: afficher l'image en base64
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.className = 'resizable-inline-image';
      img.style.cssText = 'max-width:300px;max-height:200px;border-radius:4px;cursor:nwse-resize;';
      img.title = 'Cliquer et glisser un coin pour redimensionner';
      makeImageResizable(img, saveCallback);
      placeholder.replaceWith(img);
      if (typeof saveCallback === 'function') {
        saveCallback();
      }
      showToast('📷 Image affichée (stockage local)');
    };
    reader.readAsDataURL(blob);
  }
}

// Rendre une image redimensionnable par drag
function makeImageResizable(img, saveCallback) {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  img.addEventListener('mousedown', function(e) {
    // Vérifier si on clique près du coin (30px)
    const rect = img.getBoundingClientRect();
    const cornerSize = 30;
    const isNearCorner = (
      (e.clientX > rect.right - cornerSize && e.clientY > rect.bottom - cornerSize) ||
      (e.clientX > rect.right - cornerSize && e.clientY < rect.top + cornerSize) ||
      (e.clientX < rect.left + cornerSize && e.clientY > rect.bottom - cornerSize) ||
      (e.clientX < rect.left + cornerSize && e.clientY < rect.top + cornerSize)
    );
    
    if (isNearCorner) {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = img.offsetWidth;
      startHeight = img.offsetHeight;
      img.style.opacity = '0.8';
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });
  
  function onMouseMove(e) {
    if (!isResizing) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Garder le ratio
    const ratio = startHeight / startWidth;
    let newWidth = Math.max(50, Math.min(600, startWidth + dx));
    let newHeight = newWidth * ratio;
    
    img.style.width = newWidth + 'px';
    img.style.height = newHeight + 'px';
    img.style.maxWidth = newWidth + 'px';
    img.style.maxHeight = newHeight + 'px';
  }
  
  function onMouseUp() {
    if (isResizing) {
      isResizing = false;
      img.style.opacity = '1';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Sauvegarder
      if (typeof saveCallback === 'function') {
        saveCallback();
      }
    }
  }
}

// Fonction générique pour gérer le collage d'images
function handleGenericImagePaste(e, saveCallback, folderName) {
  const items = e.clipboardData?.items;
  if (!items) return;
  
  // Chercher une image
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      e.preventDefault();
      const blob = items[i].getAsFile();
      
      // Créer un placeholder simple
      const placeholder = document.createElement('span');
      placeholder.className = 'image-upload-placeholder';
      placeholder.innerHTML = '⏳ Upload...';
      placeholder.style.cssText = 'display:inline-block;padding:4px 8px;background:#e0f2fe;border-radius:4px;font-size:11px;color:#0369a1;';
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(placeholder);
      } else {
        e.target.appendChild(placeholder);
      }
      
      // Uploader sur Firebase Storage (5 GB gratuit!)
      uploadImageToFirebaseStorage(blob, placeholder, saveCallback, folderName);
      return true;
    }
  }
  
  // Vérifier les URLs dans le texte collé
  const text = e.clipboardData?.getData('text/plain');
  if (text) {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    if (urlRegex.test(text)) {
      e.preventDefault();
      const htmlContent = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;
        
        const frag = document.createDocumentFragment();
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }
        
        range.insertNode(frag);
      }
      
      if (typeof saveCallback === 'function') {
        saveCallback();
      }
      showToast('🔗 Lien(s) ajouté(s)');
      return true;
    }
  }
  
  return false;
}

// Upload image sur Firebase Storage (5 GB gratuit)
async function uploadImageToFirebaseStorage(blob, placeholder, saveCallback, folderName) {
  try {
    // Vérifier si Firebase Storage est disponible
    if (!firebase.storage) {
      throw new Error('Firebase Storage non disponible');
    }
    
    const storage = firebase.storage();
    const timestamp = Date.now();
    const folder = folderName || 'images';
    const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substr(2, 6)}.png`;
    const storageRef = storage.ref(fileName);
    
    // Uploader le fichier
    const snapshot = await storageRef.put(blob);
    
    // Obtenir l'URL de téléchargement
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    // Créer l'image
    const img = document.createElement('img');
    img.src = downloadURL;
    img.className = 'resizable-inline-image';
    img.style.cssText = 'max-width:300px;max-height:200px;border-radius:4px;cursor:pointer;';
    img.title = 'Cliquer pour agrandir';
    
    // Remplacer le placeholder
    placeholder.replaceWith(img);
    
    // Sauvegarder
    if (typeof saveCallback === 'function') {
      saveCallback();
    }
    
    showToast('✅ Image uploadée!');
    
  } catch (error) {
    console.error('Erreur upload Firebase Storage:', error);
    placeholder.innerHTML = '❌ Erreur upload';
    placeholder.style.background = '#fee2e2';
    placeholder.style.color = '#dc2626';
    showToast('❌ Erreur: ' + error.message);
  }
}

// Gérer les clics sur les liens dans les zones éditables
function handleGenericLinkClick(e) {
  let target = e.target;
  while (target && target !== e.currentTarget) {
    if (target.tagName === 'A' && target.href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(target.href, '_blank');
      return;
    }
    target = target.parentElement;
  }
}

// Gérer les clics sur les images dans les notes pour les agrandir
function handleNotesImageClick(e) {
  // Si c'est une image, l'agrandir
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    e.stopPropagation();
    showImageFullscreen(e.target.src);
    return;
  }
  // Sinon, gérer les liens normalement
  handleGenericLinkClick(e);
}

// Afficher une image en plein écran
function showImageFullscreen(src) {
  // Créer l'overlay s'il n'existe pas
  let overlay = document.getElementById('imageFullscreenOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'imageFullscreenOverlay';
    overlay.className = 'image-fullscreen-overlay';
    overlay.innerHTML = `
      <div class="image-fullscreen-container">
        <img id="fullscreenImage" src="" alt="Image agrandie">
        <button class="image-fullscreen-close" onclick="closeImageFullscreen()">×</button>
      </div>
    `;
    overlay.onclick = function(e) {
      if (e.target === overlay) closeImageFullscreen();
    };
    document.body.appendChild(overlay);
  }
  
  // Afficher l'image
  const img = document.getElementById('fullscreenImage');
  img.src = src;
  overlay.style.display = 'flex';
}

// Fermer l'overlay d'image
function closeImageFullscreen() {
  const overlay = document.getElementById('imageFullscreenOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Exposer les fonctions
window.handleNotesImageClick = handleNotesImageClick;
window.showImageFullscreen = showImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;

// Gérer les clics sur les liens dans la zone Questions
function handleQuestionsLinkClick(e) {
  // Vérifier si le clic est sur un lien ou un élément enfant d'un lien
  let target = e.target;
  while (target && target !== e.currentTarget) {
    if (target.tagName === 'A' && target.href) {
      e.preventDefault();
      e.stopPropagation();
      // Ouvrir le lien dans un nouvel onglet
      window.open(target.href, '_blank');
      return;
    }
    target = target.parentElement;
  }
}

// Sauvegarder la réponse
function saveJobResponse() {
  if (!currentJobId) return;
  const content = document.getElementById('jobResponseContent');
  if (content) {
    jobsData[currentJobId].response = content.innerHTML;
    saveJobToFirebase(currentJobId);
  }
}

// Résolu = envoie email à Daniel avec questions + réponses + liens
function resolveJob() {
  if (!currentJobId) return;
  const job = jobsData[currentJobId];
  if (!job) return;
  
  // D'abord demander si l'utilisateur veut imprimer
  const wantPrint = confirm('📄 Voulez-vous IMPRIMER cette fiche avant de la classer?\n\n(Cliquez OK pour imprimer, Annuler pour continuer sans imprimer)');
  
  if (wantPrint) {
    // Imprimer la fiche
    printJobFiche();
    // Attendre un peu puis demander confirmation de résolution
    setTimeout(() => {
      confirmResolveJob(job);
    }, 500);
  } else {
    // Continuer directement vers la résolution
    confirmResolveJob(job);
  }
}

// Confirmation et exécution de la résolution
function confirmResolveJob(job) {
  if (!confirm('Marquer ce job comme résolu?\n\nUn email sera envoyé à Daniel pour notification.')) return;
  
  // Récupérer les questions (texte seulement)
  const questionsEl = document.getElementById('jobQuestionsContent');
  let questionsText = '';
  if (questionsEl) {
    const temp = document.createElement('div');
    temp.innerHTML = questionsEl.innerHTML;
    questionsText = temp.innerText || temp.textContent || '';
  }
  
  // Récupérer les réponses (texte seulement)
  const responseEl = document.getElementById('jobResponseContent');
  let responseText = '';
  if (responseEl) {
    const temp = document.createElement('div');
    temp.innerHTML = responseEl.innerHTML;
    responseText = temp.innerText || temp.textContent || '';
  }
  
  // Récupérer les liens photos
  let photosText = '';
  if (job.photo1) photosText += `📷 Photo 1: ${job.photo1}\n`;
  if (job.photo2) photosText += `📷 Photo 2: ${job.photo2}\n`;
  if (job.photo3) photosText += `📷 Photo 3: ${job.photo3}\n`;
  
  // Construire l'email
  const subject = encodeURIComponent(`✓ Job #${job.order} RÉSOLU - ${job.client}`);
  
  let body = `Bonjour Daniel,\n\n`;
  body += `Le job en attente suivant a été marqué comme RÉSOLU:\n\n`;
  body += `═══════════════════════════════════════\n`;
  body += `📋 COMMANDE: #${job.order}\n`;
  body += `👤 CLIENT: ${job.client || '-'}\n`;
  body += `📍 RÉGION: ${job.region || '-'}\n`;
  body += `👩 REPRÉSENTANTE: ${job.representant || '-'}\n`;
  body += `👨‍⚕️ INTERVENANT: ${job.intervenant || '-'}\n`;
  body += `📅 EN ATTENTE DEPUIS: ${formatJobDate(job.dateAmene)}\n`;
  body += `═══════════════════════════════════════\n\n`;
  
  if (questionsText.trim()) {
    body += `❓ QUESTIONS:\n${questionsText}\n\n`;
  }
  
  if (responseText.trim()) {
    body += `✅ RÉPONSES:\n${responseText}\n\n`;
  }
  
  if (photosText) {
    body += `🖼️ LIENS PHOTOS/DOCUMENTS:\n${photosText}\n`;
  }
  
  body += `\n---\nNotification automatique PhysiPro`;
  
  // Ouvrir l'email
  window.open(`mailto:atelieratp@physipro.com?subject=${subject}&body=${encodeURIComponent(body)}`);
  
  // Supprimer le job
  deleteJobFromFirebase(currentJobId);
}

// Fonction pour imprimer la fiche du job
function printJobFiche() {
  const printContent = document.querySelector('.job-fiche');
  if (!printContent) return;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
      <title>Job en attente - Impression</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .job-fiche-header { background: #1e40af; color: white; padding: 15px; margin-bottom: 20px; }
        .job-fiche-title { font-size: 18px; font-weight: bold; }
        .job-field { margin: 10px 0; }
        .job-field label { font-weight: bold; display: block; margin-bottom: 3px; }
        .job-section { margin: 15px 0; padding: 10px; border: 1px solid #ccc; }
        .job-section-title { font-weight: bold; margin-bottom: 10px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      ${printContent.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Supprimer sans notification
function deleteJob() {
  if (!currentJobId) return;
  if (!confirm('⚠️ Supprimer ce job définitivement?\n\nCette action est irréversible.')) return;
  deleteJobFromFirebase(currentJobId);
}

// Email avec questions et liens photos
function sendJobEmailWithQuestions() {
  if (!currentJobId) return;
  const job = jobsData[currentJobId];
  if (!job) return;
  
  // Récupérer les questions (garder les liens)
  const questionsEl = document.getElementById('jobQuestionsContent');
  let questionsText = '';
  let imagesLinks = [];
  
  if (questionsEl) {
    // Cloner le contenu pour manipulation
    const temp = document.createElement('div');
    temp.innerHTML = questionsEl.innerHTML;
    
    // Extraire les liens des images uploadées (Firebase Storage)
    temp.querySelectorAll('a').forEach(a => {
      const href = a.href || '';
      if (href.includes('firebasestorage') || href.includes('firebase')) {
        imagesLinks.push(href);
      }
    });
    
    // Convertir les <a> en texte avec URL
    temp.querySelectorAll('a').forEach(a => {
      a.textContent = a.href;
    });
    
    // Retirer les images pour le texte (on garde juste le lien)
    temp.querySelectorAll('img').forEach(img => img.remove());
    
    questionsText = temp.innerText || temp.textContent || '';
    // Nettoyer les espaces multiples
    questionsText = questionsText.replace(/\n{3,}/g, '\n\n').trim();
  }
  
  // Récupérer les liens photos existants
  let photosText = '';
  if (job.photo1) photosText += `📷 Photo 1: ${job.photo1}\n`;
  if (job.photo2) photosText += `📷 Photo 2: ${job.photo2}\n`;
  if (job.photo3) photosText += `📷 Photo 3: ${job.photo3}\n`;
  
  // Sujet avec nom de l'assignée
  const assignee = job.assignee || 'Service client';
  const subject = encodeURIComponent(`Commande #${job.order} - En attente de questionnement`);
  
  let body = `Bonjour,\n\n`;
  body += `La commande #${job.order} est maintenant en attente pour un questionnement.\n\n`;
  body += `Veuillez faire le suivi s'il vous plaît.\n\n`;
  body += `---\n`;
  body += `Informations:\n`;
  body += `• Commande: #${job.order}\n`;
  body += `• Client: ${job.client || '-'}\n`;
  body += `• Assigné à: ${assignee}\n`;
  body += `• Représentante: ${job.representant || '-'}\n`;
  
  window.open(`mailto:orders@physipro.com?subject=${subject}&body=${encodeURIComponent(body)}`);
}

// Imprimer les questions et réponses
function printJobNotes() {
  if (!currentJobId) return;
  const job = jobsData[currentJobId];
  if (!job) return;
  
  const questionsEl = document.getElementById('jobQuestionsContent');
  const responseEl = document.getElementById('jobResponseContent');
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job #${job.order} - Questions & Réponses</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .info { margin-bottom: 20px; font-size: 12px; color: #666; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 13px; font-weight: bold; margin-bottom: 5px; padding: 5px; background: #f0f0f0; }
        .section-content { padding: 10px; border: 1px solid #ddd; min-height: 40px; }
        .questions { background: #fff9e6; border-color: #f59e0b; }
        .response { background: #dcfce7; border-color: #22c55e; }
        .photos { font-size: 11px; margin-top: 15px; }
        .photos a { color: #2563eb; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>📋 Job #${job.order} - ${job.client || 'Client'}</h1>
      <div class="info">
        <strong>Région:</strong> ${job.region || '-'} | 
        <strong>Rep:</strong> ${job.representant || '-'} | 
        <strong>Intervenant:</strong> ${job.intervenant || '-'} |
        <strong>Date:</strong> ${new Date().toLocaleDateString('fr-CA')}
      </div>
      
      <div class="section">
        <div class="section-title">❓ Questions</div>
        <div class="section-content questions">${questionsEl?.innerHTML || '<em>Aucune question</em>'}</div>
      </div>
      
      <div class="section">
        <div class="section-title">✅ Réponses</div>
        <div class="section-content response">${responseEl?.innerHTML || '<em>Aucune réponse</em>'}</div>
      </div>
      
      ${(job.photo1 || job.photo2 || job.photo3) ? `
      <div class="photos">
        <strong>🖼️ Liens photos:</strong><br>
        ${job.photo1 ? `<a href="${job.photo1}" target="_blank">Photo 1</a><br>` : ''}
        ${job.photo2 ? `<a href="${job.photo2}" target="_blank">Photo 2</a><br>` : ''}
        ${job.photo3 ? `<a href="${job.photo3}" target="_blank">Photo 3</a><br>` : ''}
      </div>
      ` : ''}
      
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Ancienne fonction pour compatibilité
async function sendJobEmail() {
  sendJobEmailWithQuestions();
}

// Init
function initJobsPage() {
  loadJobsFromFirebase();
}

// Exports
window.showAddJobModal = showAddJobModal;
window.closeAddJobModal = closeAddJobModal;
window.saveNewJob = saveNewJob;
window.handleImportJobJson = handleImportJobJson;
window.openJobFiche = openJobFiche;
window.closeJobFiche = closeJobFiche;
window.updateJobField = updateJobField;
window.updateFicheRegionColor = updateFicheRegionColor;
window.selectJobRegion = selectJobRegion;
window.openJobCalendar = openJobCalendar;
window.openAddJobCalendar = openAddJobCalendar;
window.openJobPhotoMenu = openJobPhotoMenu;
window.closeJobPhotoMenu = closeJobPhotoMenu;
window.saveJobPhotoUrl = saveJobPhotoUrl;
window.viewJobPhoto = viewJobPhoto;
window.clearJobPhoto = clearJobPhoto;
window.insertJobNoteTimestamp = insertJobNoteTimestamp;
window.handleJobNotesPaste = handleJobNotesPaste;
window.makeImageResizable = makeImageResizable;
window.initNotesImageResizing = initNotesImageResizing;
window.saveJobNotes = saveJobNotes;
window.handleStandardNoteClick = handleStandardNoteClick;
window.placeCursorAtEnd = placeCursorAtEnd;
window.saveJobQuestions = saveJobQuestions;
window.handleQuestionsPaste = handleQuestionsPaste;
window.handleResponsePaste = handleResponsePaste;
window.handleGenericImagePaste = handleGenericImagePaste;
window.handleGenericLinkClick = handleGenericLinkClick;
window.handleQuestionsLinkClick = handleQuestionsLinkClick;
window.uploadImageToFirebase = uploadImageToFirebase;
window.saveJobResponse = saveJobResponse;
window.resolveJob = resolveJob;
window.deleteJob = deleteJob;
window.sendJobEmail = sendJobEmail;
window.sendJobEmailWithQuestions = sendJobEmailWithQuestions;
window.printJobNotes = printJobNotes;

// INTERFACE MOBILE - COMPLÈTEMENT SÉPARÉE DU DESKTOP
// =============================================================================

// Détecter si on est sur mobile/tablette
function isMobileDevice() {
  // Détection stricte : NE PAS activer sur desktop même avec écran tactile
  const isSmallScreen = window.innerWidth <= 1024;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Desktop avec grand écran = JAMAIS mobile, même si tactile
  if (window.innerWidth > 1024) return false;
  
  // Petit écran + userAgent mobile = mobile
  if (isSmallScreen && isMobileUserAgent) return true;
  
  // Très petit écran (téléphone) = mobile
  if (window.innerWidth <= 768) return true;
  
  // Par défaut = desktop
  return false;
}

// Variables globales mobile
var currentMobileFicheId = null;
var mobileSwipeCurrentPage = 0; // 0=Info, 1=Notes

// Fonction appelée APRÈS la connexion réussie
function initMobileAfterLogin() {
  if (!isMobileDevice()) return;
  
  // Cacher le board desktop
  const appRoot = document.querySelector('.app-root');
  if (appRoot) appRoot.style.display = 'none';
  
  // Créer les overlays mobiles s'ils n'existent pas
  if (!document.getElementById('mobileHomeOverlay')) {
    createMobileHomeHTML();
  }
  if (!document.getElementById('mobileMenuOverlay')) {
    createMobileMenuHTML();
  }
  
  // Afficher le menu principal
  showMobileMenu();
  
  // Mettre à jour les compteurs
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    updateMobileDataCount();
    const moulagesCount = Object.keys(cardsData || {}).length;
    const jobsCount = Object.keys(jobsData || {}).filter(k => jobsData[k] && jobsData[k].type === 'question').length;
    
    const menuMoulagesCount = document.getElementById('menuMoulagesCount');
    const menuJobsCount = document.getElementById('menuJobsCount');
    if (menuMoulagesCount) menuMoulagesCount.textContent = `(${moulagesCount})`;
    if (menuJobsCount) menuJobsCount.textContent = `(${jobsCount})`;
    
    checkCount++;
    if (checkCount >= 10 || moulagesCount > 0) {
      clearInterval(checkInterval);
    }
  }, 1000);
}

// Mettre à jour le compteur de moulages chargés
function updateMobileDataCount() {
  const count = Object.keys(cardsData).length;
  const countEl = document.getElementById('mobileDataCount');
  
  if (countEl) {
    if (count > 0) {
      countEl.textContent = `${count} moulage${count > 1 ? 's' : ''} chargé${count > 1 ? 's' : ''}`;
      countEl.style.color = '#22c55e';
      
      // Afficher les cartes si pas de recherche en cours
      const input = document.getElementById('mobileSearchInput');
      if (!input || input.value.trim() === '') {
        displayAllMobileCards();
      }
    } else {
      countEl.textContent = '⏳ Chargement...';
      countEl.style.color = '#fbbf24';
    }
  }
}

// Créer le HTML de l'écran d'accueil mobile
function createMobileHomeHTML() {
  const mobileHTML = `
    <!-- ÉCRAN D'ACCUEIL MOBILE -->
    <div class="mobile-home-overlay" id="mobileHomeOverlay">
      <div class="mobile-home-header">
        <button class="mobile-home-back" onclick="closeMobileMoulages()">←</button>
        <h1 class="mobile-home-title">Outil de gestion des moulages</h1>
        <button class="mobile-home-add" onclick="showAddMoulageModal()">+</button>
      </div>
      
      <div class="mobile-search-container">
        <div class="mobile-search-box">
          <span class="mobile-search-icon">🔍</span>
          <input type="text" id="mobileSearchInput" placeholder="Rechercher..." autocomplete="off">
          <span class="mobile-search-clear" id="mobileSearchClear" onclick="clearMobileSearch()">✕</span>
        </div>
        <div class="mobile-cards-count" id="mobileDataCount">⏳ Chargement...</div>
      </div>
      
      <div class="mobile-search-results" id="mobileSearchResults">
        <div class="mobile-search-hint" id="mobileSearchHint">
          <div class="mobile-search-hint-icon">⏳</div>
          <div class="mobile-search-hint-text">
            Chargement des moulages...<br>
            Veuillez patienter
          </div>
        </div>
      </div>
    </div>
    
    <!-- FICHE MOBILE AVEC SWIPE - 2 PAGES -->
    <div class="mobile-fiche-overlay" id="mobileFicheOverlay">
      <div class="mobile-fiche-header">
        <button class="mobile-fiche-back" onclick="closeMobileFiche()">
          ← Retour
        </button>
        <div class="mobile-fiche-title" id="mobileFicheTitle">Nom du moulage</div>
        <div class="mobile-fiche-order" id="mobileFicheOrder">#000000</div>
      </div>
      
      <div class="mobile-fiche-swipe-container" id="mobileFicheSwipeContainer">
        <div class="mobile-fiche-swipe-wrapper-2pages" id="mobileFicheSwipeWrapper">
          
          <!-- PAGE INFO (gauche - index 0) -->
          <div class="mobile-fiche-page mobile-page-info" id="mobilePageInfo">
            <!-- Contenu généré dynamiquement -->
          </div>
          
          <!-- PAGE NOTES (droite - index 1) -->
          <div class="mobile-fiche-page mobile-page-notes" id="mobilePageNotes">
            <!-- Section Photos 1-6 -->
            <div class="mobile-notes-photos-section" id="mobileNotesPhotos">
              <!-- Contenu généré dynamiquement -->
            </div>
            <div class="mobile-notes-content-editable" 
                 id="mobileNotesContent" 
                 contenteditable="true"
                 onclick="insertMobileNoteTimestamp(event)"
                 onpaste="handleMobileNotesPaste(event)"
                 onblur="saveMobileNotesContent()"></div>
          </div>
          
        </div>
      </div>
      
      <div class="mobile-swipe-hint" id="mobileSwipeHint">
        <span class="mobile-swipe-hint-arrow">←</span>
        <span>Glissez pour Notes</span>
        <span class="mobile-swipe-hint-arrow">→</span>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', mobileHTML);
  
  // Initialiser les événements
  initMobileSearchEvents();
  initMobileSwipeEvents();
}

// Afficher l'écran d'accueil mobile
function showMobileHome() {
  const overlay = document.getElementById('mobileHomeOverlay');
  if (overlay) {
    overlay.classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('mobileSearchInput');
      if (input) input.focus();
    }, 300);
  }
}

// Masquer l'écran d'accueil mobile
function hideMobileHome() {
  const overlay = document.getElementById('mobileHomeOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Basculer vers le mode desktop
function switchToDesktopMode() {
  // Cacher TOUS les overlays mobiles
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobileHomeOverlay')?.classList.remove('active');
  document.getElementById('mobileJobsOverlay')?.classList.remove('active');
  document.getElementById('mobileJobFicheOverlay')?.classList.remove('active');
  document.getElementById('mobileFicheOverlay')?.classList.remove('active');
  
  // Réafficher le desktop
  const appRoot = document.querySelector('.app-root');
  if (appRoot) appRoot.style.display = '';
  
  console.log('✅ Basculé vers mode desktop');
}

// Initialiser les événements de recherche
function initMobileSearchEvents() {
  const input = document.getElementById('mobileSearchInput');
  const clearBtn = document.getElementById('mobileSearchClear');
  
  if (input) {
    input.addEventListener('input', function() {
      const query = this.value.trim();
      clearBtn.classList.toggle('visible', query.length > 0);
      performMobileSearch(query);
    });
  }
  
  // Afficher tous les moulages au démarrage
  setTimeout(() => {
    displayAllMobileCards();
  }, 500);
}

// Afficher toutes les cartes de moulages
function displayAllMobileCards() {
  const results = document.getElementById('mobileSearchResults');
  if (!results) return;
  
  const dataCount = Object.keys(cardsData).length;
  if (dataCount === 0) {
    results.innerHTML = `
      <div class="mobile-search-hint">
        <div class="mobile-search-hint-icon">⏳</div>
        <div class="mobile-search-hint-text">
          Chargement des données...<br>
          Veuillez patienter
        </div>
      </div>
    `;
    return;
  }
  
  // Trier : EN ATTENTE en premier, puis par nom alphabétique
  const sortedCards = Object.entries(cardsData)
    .sort((a, b) => {
      const isAttenteA = (a[1].columnIndex === 7) ? 0 : 1;
      const isAttenteB = (b[1].columnIndex === 7) ? 0 : 1;
      
      // En attente en premier
      if (isAttenteA !== isAttenteB) return isAttenteA - isAttenteB;
      
      // Puis par nom alphabétique
      const nameA = (a[1].name || '').toLowerCase();
      const nameB = (b[1].name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'fr');
    });
  
  results.innerHTML = sortedCards.map(([cardId, card]) => createMobileCardHTML(cardId, card)).join('');
}

// Créer le HTML d'une carte mobile (style PC compact)
function createMobileCardHTML(cardId, card) {
  const regionClass = getMobileRegionClass(card.region);
  const daysInfo = calculateMobileDaysRemaining(card);
  const isEnAttente = card.columnIndex === 7;
  
  // Texte région abrégé
  let regionText = 'QC';
  if (regionClass === 'region-on') regionText = 'ON';
  else if (regionClass === 'region-ma') regionText = 'MA';
  
  // Représentante (raccourcie)
  let repText = '-';
  if (card.representant) {
    repText = card.representant;
    if (repText.length > 12) {
      repText = repText.split(' ')[0];
    }
  }
  
  // Raison attente et calcul des jours
  const raisonAttente = card.raisonAttente || '';
  let joursAttenteText = '';
  
  if (isEnAttente && card.dateAttente) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateAttente = new Date(card.dateAttente + 'T00:00:00');
    if (!isNaN(dateAttente.getTime())) {
      const diffTime = today - dateAttente;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      joursAttenteText = diffDays <= 0 ? "aujourd'hui" : `depuis ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }
  
  // Statut basé sur la colonne
  const statusNames = ['Robot', 'Dégauchage', 'Essayage', 'Atelier', 'Couture', 'Peinture', 'Expédition', 'En attente'];
  const statusClasses = ['robot', 'degauchage', 'essayage', 'atelier', 'couture', 'peinture', 'expedition', 'attente'];
  const colIndex = card.columnIndex || 0;
  const statusText = statusNames[colIndex] || 'Robot';
  const statusClass = statusClasses[colIndex] || 'robot';
  
  // Construire le texte de la barre en attente
  let attenteBarText = '';
  if (raisonAttente) {
    // La raison contient déjà "En attente de..." donc on l'utilise directement
    attenteBarText = raisonAttente;
    if (joursAttenteText) {
      attenteBarText += ` ${joursAttenteText}`;
    }
  } else {
    attenteBarText = 'En attente';
    if (joursAttenteText) {
      attenteBarText += ` ${joursAttenteText}`;
    }
  }
  
  // HTML pour la carte - Statut à gauche, Nom centré
  return `
    <div class="mobile-card ${regionClass} ${isEnAttente ? 'en-attente' : ''}" onclick="openMobileFiche('${cardId}')">
      <div class="mobile-card-top">
        <div class="mobile-card-status status-${statusClass}">${statusText}</div>
      </div>
      <div class="mobile-card-name">${card.name || 'Sans nom'}</div>
      <div class="mobile-card-middle">
        <span class="mobile-card-rep">${repText}</span>
        <span class="mobile-card-order">#${card.order || '000000'}</span>
        <span class="mobile-card-region">${regionText}</span>
      </div>
      ${isEnAttente 
        ? `<div class="mobile-card-delay attente-info">${attenteBarText}</div>`
        : `<div class="mobile-card-delay ${daysInfo.class}">${daysInfo.text}</div>`
      }
    </div>
  `;
}

// Calculer les jours restants pour mobile (version simplifiée et robuste)
function calculateMobileDaysRemaining(card) {
  // Si pas de date livraison, retourner vide
  if (!card.dateLivraison) return { text: '-', class: '' };
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateLiv = new Date(card.dateLivraison + 'T00:00:00');
    
    if (isNaN(dateLiv.getTime())) return { text: '-', class: '' };
    
    // Calculer différence en jours
    const diffTime = dateLiv - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}j retard`, class: 'retard' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}j`, class: 'urgent' };
    } else if (diffDays <= 10) {
      return { text: `${diffDays}j`, class: 'warning' };
    } else {
      return { text: `${diffDays}j`, class: '' };
    }
  } catch (e) {
    return { text: '-', class: '' };
  }
}

// Obtenir la classe de région
function getMobileRegionClass(region) {
  if (!region) return 'region-qc';
  const r = region.toLowerCase();
  if (r.includes('ontario') || r.includes('on')) return 'region-on';
  if (r.includes('maritime') || r.includes('ma') || r.includes('nova') || r.includes('halifax')) return 'region-ma';
  return 'region-qc';
}

// Effacer la recherche
function clearMobileSearch() {
  const input = document.getElementById('mobileSearchInput');
  const clearBtn = document.getElementById('mobileSearchClear');
  
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.remove('visible');
  
  displayAllMobileCards();
}

// Effectuer la recherche mobile
function performMobileSearch(query) {
  const results = document.getElementById('mobileSearchResults');
  if (!results) return;
  
  const dataCount = Object.keys(cardsData).length;
  if (dataCount === 0) {
    results.innerHTML = `
      <div class="mobile-search-hint">
        <div class="mobile-search-hint-icon">⏳</div>
        <div class="mobile-search-hint-text">
          Chargement des données en cours...<br>
          Veuillez patienter quelques secondes
        </div>
      </div>
    `;
    return;
  }
  
  // Si pas de recherche, afficher tous les moulages
  if (query.length < 1) {
    displayAllMobileCards();
    return;
  }
  
  const queryLower = query.toLowerCase();
  const matches = [];
  
  // Rechercher dans toutes les cartes
  Object.entries(cardsData).forEach(([cardId, card]) => {
    const allFields = [
      card.name, card.order, card.client, card.intervenant,
      card.representant, card.numeroPO, card.numeroSoumission,
      card.region, card.item, card.notes
    ].filter(Boolean).map(f => String(f).toLowerCase());
    
    if (allFields.some(field => field.includes(queryLower))) {
      matches.push({ cardId, card });
    }
  });
  
  // Afficher les résultats
  if (matches.length === 0) {
    results.innerHTML = `
      <div class="mobile-no-results">
        <div class="mobile-no-results-icon">🔍</div>
        <div class="mobile-no-results-text">Aucun moulage trouvé pour "${query}"</div>
      </div>
    `;
    return;
  }
  
  // Trier : EN ATTENTE en premier, puis par nom alphabétique
  matches.sort((a, b) => {
    const isAttenteA = (a.card.columnIndex === 7) ? 0 : 1;
    const isAttenteB = (b.card.columnIndex === 7) ? 0 : 1;
    
    if (isAttenteA !== isAttenteB) return isAttenteA - isAttenteB;
    
    const nameA = (a.card.name || '').toLowerCase();
    const nameB = (b.card.name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'fr');
  });
  
  results.innerHTML = matches.map(({ cardId, card }) => createMobileCardHTML(cardId, card)).join('');
}

// Ouvrir une fiche mobile
function openMobileFiche(cardId) {
  const card = cardsData[cardId];
  if (!card) return;
  
  currentMobileFicheId = cardId;
  mobileSwipeCurrentPage = 0; // Commencer sur Info (page 0)
  mobileNoteTimestampAdded = false; // Réinitialiser pour permettre nouvelle signature
  
  // Mettre à jour le header
  document.getElementById('mobileFicheTitle').textContent = card.name || 'Sans nom';
  document.getElementById('mobileFicheOrder').textContent = '#' + (card.order || '000000');
  
  // Générer le contenu des pages
  renderMobilePageInfo(card);
  renderMobilePageNotes(card);
  
  // Afficher la fiche
  document.getElementById('mobileFicheOverlay').classList.add('active');
  
  // Positionner sur la page Info (page 0)
  updateMobileSwipePosition2Pages(0, false);
  
  // Masquer le hint après 3 secondes
  setTimeout(() => {
    const hint = document.getElementById('mobileSwipeHint');
    if (hint) hint.style.opacity = '0';
  }, 3000);
}

// Fermer la fiche mobile
function closeMobileFiche() {
  // Sauvegarder les notes avant de fermer
  saveMobileNotesContent();
  
  document.getElementById('mobileFicheOverlay').classList.remove('active');
  currentMobileFicheId = null;
  
  // Réafficher le hint pour la prochaine fois
  const hint = document.getElementById('mobileSwipeHint');
  if (hint) hint.style.opacity = '1';
  
  showMobileHome();
  
  // Rafraîchir la liste des cartes
  const input = document.getElementById('mobileSearchInput');
  if (!input || input.value.trim() === '') {
    displayAllMobileCards();
  } else {
    performMobileSearch(input.value.trim());
  }
}

// Générer la page Info
function renderMobilePageInfo(card) {
  const container = document.getElementById('mobilePageInfo');
  
  // Calculer le statut
  const colIndex = card.columnIndex || 0;
  const colNames = ['Robot', 'Dégauchage', 'Essayage', 'Atelier', 'Couture', 'Peinture', 'Expédition', 'En attente'];
  const currentDept = colNames[colIndex] || 'Robot';
  const isAttente = colIndex === 7;
  const raisonAttente = card.raisonAttente || '';
  
  // Déterminer le texte du statut avec article
  let article = 'À ';
  if (currentDept === 'Robot' || currentDept === 'Dégauchage') article = 'Au ';
  else if (currentDept === 'Atelier' || currentDept === 'Essayage') article = "À l'";
  else if (currentDept === 'Couture' || currentDept === 'Peinture' || currentDept === 'Expédition') article = 'À la ';
  else if (isAttente) article = '';
  
  // Date depuis (à partir du tracking)
  let dateSince = '';
  const deptKey = ['robot', 'degauchage', 'essayage', 'atelier', 'couture', 'peinture', 'expedition'][colIndex];
  if (isAttente && card.dateAttente) {
    dateSince = card.dateAttente;
  } else if (card.tracking && card.tracking[deptKey] && card.tracking[deptKey].entree) {
    dateSince = card.tracking[deptKey].entree;
  } else if (card.dateRecue) {
    dateSince = card.dateRecue;
  }
  
  // Texte statut sur une ligne
  let statutLine = isAttente ? 'EN ATTENTE' : `${article}${currentDept}`;
  if (dateSince) statutLine += ` depuis ${dateSince}`;
  
  container.innerHTML = `
    <div class="mobile-info-card" style="flex: 1;">
      <!-- STATUT - Cliquable pour voir/modifier l'historique -->
      <div class="mobile-status-block ${isAttente ? 'attente' : ''}" onclick="openMobileDeptHistory()">
        <span class="mobile-status-text">${statutLine}</span>
        <span class="mobile-status-edit">📊 Voir historique</span>
        ${isAttente && raisonAttente ? `<span class="mobile-status-raison blink">${raisonAttente}</span>` : ''}
      </div>
      
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">👤 Nom du Moulage</span>
        <span class="mobile-info-value" style="font-weight:700;">${card.name || '-'}</span>
      </div>
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">🔢 # de commande</span>
        <span class="mobile-info-value highlight">${card.order || '-'}</span>
      </div>
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">📋 # de soumission</span>
        <span class="mobile-info-value">${formatSoumission(card.numeroSoumission)}</span>
      </div>
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">📑 # de PO</span>
        <span class="mobile-info-value">${card.numeroPO || '-'}</span>
      </div>
      <div class="mobile-info-row size-plus1">
        <span class="mobile-info-label">🏢 Client</span>
        <span class="mobile-info-value shrink-text">${card.client || '-'}</span>
      </div>
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">🗺️ Région</span>
        <span class="mobile-info-value">${card.region || '-'}</span>
      </div>
      
      <div class="mobile-section-divider"></div>
      
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">👩‍⚕️ Intervenant</span>
        <span class="mobile-info-value shrink-text">${card.intervenant || '-'}</span>
      </div>
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">👩‍💼 Représentante</span>
        <span class="mobile-info-value shrink-text">${card.representant || '-'}</span>
      </div>
      
      <div class="mobile-section-divider"></div>
      
      <!-- DATES CLIQUABLES (labels courts, taille réduite) -->
      <div class="mobile-info-row mobile-date-row">
        <span class="mobile-info-label">📥 Réception</span>
        <span class="mobile-info-value mobile-date-editable" onclick="openMobileMoulageCalendar('dateRecue')">${card.dateRecue || 'Sélectionner'}</span>
      </div>
      <div class="mobile-info-row mobile-date-row">
        <span class="mobile-info-label">📦 Livraison</span>
        <span class="mobile-info-value mobile-date-editable highlight" onclick="openMobileMoulageCalendar('dateLivraison')">${card.dateLivraison || 'Sélectionner'}</span>
      </div>
      <div class="mobile-info-row mobile-date-row">
        <span class="mobile-info-label">🤖 Fab. robot</span>
        <span class="mobile-info-value mobile-date-editable" onclick="openMobileMoulageCalendar('dateRobot')">${card.dateRobot || 'Sélectionner'}</span>
      </div>
      <div class="mobile-info-row mobile-date-row">
        <span class="mobile-info-label">📅 RDV essayage</span>
        <span class="mobile-info-value mobile-date-editable" onclick="openMobileMoulageCalendar('dateEssayage')">${card.dateEssayage || 'Sélectionner'}</span>
      </div>
      
      <div class="mobile-section-divider"></div>
      
      <!-- ITEM CLIQUABLE -->
      <div class="mobile-info-row size-plus2">
        <span class="mobile-info-label">📦 Item</span>
        <span class="mobile-info-value mobile-item-editable" onclick="openMobileItemSelector()">${card.item || '-- Sélectionner --'}</span>
      </div>
      
      <div class="mobile-section-divider"></div>
      
      <!-- PHOTOS - 3 boutons avec icône caméra -->
      <div class="mobile-photos-section">
        <div class="mobile-photos-row">
          <div class="mobile-photo-btn ${card.photoClient ? 'has-photo' : ''}" onclick="openMobilePhotoLink('client')">📷 Client</div>
          <div class="mobile-photo-btn ${card.photoAtelier ? 'has-photo' : ''}" onclick="openMobilePhotoLink('atelier')">📷 Atelier</div>
          <div class="mobile-photo-btn ${card.photoDevis ? 'has-photo' : ''}" onclick="openMobilePhotoLink('devis')">📷 Devis</div>
        </div>
      </div>
    </div>
  `;
}

// Générer la page Notes (avec support images)
function renderMobilePageNotes(card) {
  // Photos 1-6 enlevées - on peut maintenant coller des images directement dans les notes
  const photosSection = document.getElementById('mobileNotesPhotos');
  if (photosSection) {
    photosSection.innerHTML = ''; // Section vide - plus de boutons photos
  }
  
  // Notes (contenteditable avec support images)
  const content = document.getElementById('mobileNotesContent');
  if (content) {
    content.innerHTML = card.notes || '';
    // Initialiser le redimensionnement des images existantes
    setTimeout(() => initMobileNotesImageResizing(), 100);
  }
}

// Variable globale pour le timestamp moulages
var mobileNoteTimestampAdded = false;

// Insérer timestamp au clic dans les notes moulage mobile  
function insertMobileNoteTimestamp(event) {
  if (mobileNoteTimestampAdded) return;
  mobileNoteTimestampAdded = true;
  
  const content = document.getElementById('mobileNotesContent');
  if (!content) return;
  
  let userName = 'Utilisateur';
  if (currentUser && currentUser.name) {
    userName = currentUser.name;
  }
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-CA');
  const timeStr = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const signature = `<div><strong>— ${userName} (${dateStr} à ${timeStr}) —</strong></div><div><br></div>`;
  
  content.innerHTML += signature;
  
  // Placer le curseur à la fin
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(content);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  content.focus();
  
  saveMobileNotesContent();
}

// Gérer le collage d'images dans les notes moulage mobile
function handleMobileNotesPaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;
  
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.width = '150px';
        img.style.cursor = 'nwse-resize';
        img.style.display = 'block';
        img.style.margin = '5px 0';
        
        makeMobileNoteImageResizable(img);
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          document.getElementById('mobileNotesContent').appendChild(img);
        }
        
        saveMobileNotesContent();
      };
      
      reader.readAsDataURL(file);
      break;
    }
  }
}

// Rendre une image redimensionnable (moulages)
function makeMobileNoteImageResizable(img) {
  let isResizing = false;
  let startX, startWidth;
  
  img.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = img.getBoundingClientRect();
      const isNearEdge = (rect.right - touch.clientX < 30) && (rect.bottom - touch.clientY < 30);
      
      if (isNearEdge) {
        e.preventDefault();
        isResizing = true;
        startX = touch.clientX;
        startWidth = img.offsetWidth;
        img.style.opacity = '0.7';
      }
    }
  }, { passive: false });
  
  img.addEventListener('touchmove', function(e) {
    if (!isResizing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newWidth = startWidth + (touch.clientX - startX);
    if (newWidth > 50 && newWidth < 300) {
      img.style.width = newWidth + 'px';
      img.style.height = 'auto';
    }
  }, { passive: false });
  
  img.addEventListener('touchend', function() {
    if (isResizing) {
      isResizing = false;
      img.style.opacity = '1';
      saveMobileNotesContent();
    }
  });
  
  // Mouse events
  img.addEventListener('mousedown', function(e) {
    const rect = img.getBoundingClientRect();
    const isNearEdge = (rect.right - e.clientX < 20) && (rect.bottom - e.clientY < 20);
    
    if (isNearEdge) {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = img.offsetWidth;
      
      const onMouseMove = (e) => {
        if (!isResizing) return;
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > 50 && newWidth < 300) {
          img.style.width = newWidth + 'px';
          img.style.height = 'auto';
        }
      };
      
      const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        saveMobileNotesContent();
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });
}

// Initialiser le redimensionnement des images existantes (moulages)
function initMobileNotesImageResizing() {
  const content = document.getElementById('mobileNotesContent');
  if (content) {
    content.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'nwse-resize';
      img.style.maxWidth = '100%';
      makeMobileNoteImageResizable(img);
    });
  }
}

// Sauvegarder les notes moulage mobile
function saveMobileNotesContent() {
  if (!currentMobileFicheId || !cardsData[currentMobileFicheId]) return;
  const content = document.getElementById('mobileNotesContent');
  if (content) {
    cardsData[currentMobileFicheId].notes = content.innerHTML;
    saveCardToFirebase(currentMobileFicheId);
  }
}

// Ouvrir le lien photo (si existe)
function openMobilePhotoLink(photoType) {
  if (!currentMobileFicheId) return;
  
  const card = cardsData[currentMobileFicheId];
  const photoKey = `photo${photoType.charAt(0).toUpperCase() + photoType.slice(1)}`;
  const photoUrl = card[photoKey];
  
  if (photoUrl) {
    window.open(photoUrl, '_blank');
  } else {
    alert('Aucun lien photo défini. Cliquez sur 📷 pour ajouter un lien.');
  }
}

// Menu pour ajouter les liens photos
function openMobilePhotoMenu() {
  if (!currentMobileFicheId) return;
  
  const card = cardsData[currentMobileFicheId];
  if (!card) {
    alert('Erreur: carte non trouvée');
    return;
  }
  
  // Préparer les valeurs (éviter undefined)
  const photoClient = card.photoClient || '';
  const photoAtelier = card.photoAtelier || '';
  const photoDevis = card.photoDevis || '';
  
  const menuHTML = `
    <div class="mobile-photo-menu-overlay" id="mobilePhotoMenu" onclick="closeMobilePhotoMenu(event)">
      <div class="mobile-photo-menu" onclick="event.stopPropagation()">
        <div class="mobile-photo-menu-header">
          <span>📷 Liens Photos</span>
          <button onclick="closeMobilePhotoMenu()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#fff;">✕</button>
        </div>
        <div class="mobile-photo-menu-content">
          <div class="mobile-photo-menu-field">
            <label>👤 Client</label>
            <input type="url" id="photoClientInput" value="${photoClient}" placeholder="URL de la photo client">
          </div>
          <div class="mobile-photo-menu-field">
            <label>🔧 Atelier</label>
            <input type="url" id="photoAtelierInput" value="${photoAtelier}" placeholder="URL de la photo atelier">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📄 Devis/Modifs</label>
            <input type="url" id="photoDevisInput" value="${photoDevis}" placeholder="URL du devis/modifs">
          </div>
        </div>
        <div class="mobile-photo-menu-actions">
          <button class="mobile-photo-save-btn" onclick="saveMobilePhotos()">💾 Sauvegarder</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
}

function closeMobilePhotoMenu(event) {
  if (event && event.target.id !== 'mobilePhotoMenu') return;
  const menu = document.getElementById('mobilePhotoMenu');
  if (menu) menu.remove();
}

// ===== CALENDRIER POUR DATES MOULAGE MOBILE =====
function openMobileMoulageCalendar(field) {
  if (!currentMobileFicheId) return;
  const card = cardsData[currentMobileFicheId];
  if (!card) return;
  
  const currentDate = card[field] || '';
  
  showCalendar({
    value: currentDate,
    mode: 'modal',
    onSelect: (dateStr) => {
      if (currentMobileFicheId && cardsData[currentMobileFicheId]) {
        cardsData[currentMobileFicheId][field] = dateStr;
        saveCardToFirebase(currentMobileFicheId);
        renderMobilePageInfo(cardsData[currentMobileFicheId]);
        renderAllCards();
      }
    }
  });
}

// ===== SÉLECTEUR D'ITEM MOBILE =====
function openMobileItemSelector() {
  if (!currentMobileFicheId) return;
  const card = cardsData[currentMobileFicheId];
  if (!card) return;
  
  const items = customLists.items || ['Appui-tête', 'Coussin', 'Dossier', 'Siège', 'Siège + Dossier'];
  
  const menuHTML = `
    <div class="mobile-item-selector-overlay" id="mobileItemSelector" onclick="closeMobileItemSelector(event)">
      <div class="mobile-item-selector" onclick="event.stopPropagation()">
        <div class="mobile-item-selector-header">
          <span>📦 Sélectionner un Item</span>
          <button onclick="closeMobileItemSelector()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#fff;">✕</button>
        </div>
        <div class="mobile-item-selector-body">
          ${items.map(item => `
            <div class="mobile-item-option ${card.item === item ? 'selected' : ''}" onclick="selectMobileItem('${item}')">${item}</div>
          `).join('')}
          <div class="mobile-item-option" onclick="selectMobileItem('')">-- Aucun --</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
}

function closeMobileItemSelector(event) {
  if (event && event.target.id !== 'mobileItemSelector') return;
  const menu = document.getElementById('mobileItemSelector');
  if (menu) menu.remove();
}

function selectMobileItem(item) {
  if (!currentMobileFicheId) return;
  cardsData[currentMobileFicheId].item = item;
  saveCardToFirebase(currentMobileFicheId);
  closeMobileItemSelector({ target: { id: 'mobileItemSelector' } });
  renderMobilePageInfo(cardsData[currentMobileFicheId]);
  displayAllMobileCards();
}

// ===== HISTORIQUE DES DÉPARTEMENTS MOBILE =====
function openMobileDeptHistory() {
  if (!currentMobileFicheId) return;
  const card = cardsData[currentMobileFicheId];
  if (!card) return;
  
  const depts = [
    { key: 'robot', name: 'Robot', icon: '🤖' },
    { key: 'degauchage', name: 'Dégauchage', icon: '🔧' },
    { key: 'essayage', name: 'Essayage', icon: '👔' },
    { key: 'atelier', name: 'Atelier', icon: '🏭' },
    { key: 'couture', name: 'Couture', icon: '🧵' },
    { key: 'peinture', name: 'Peinture', icon: '🎨' },
    { key: 'expedition', name: 'Expédition', icon: '📦' }
  ];
  
  const tracking = card.tracking || {};
  const colIndex = card.columnIndex || 0;
  
  let historyHTML = depts.map((dept, idx) => {
    const data = tracking[dept.key] || {};
    const entree = data.entree || '';
    const sortie = data.sortie || '';
    const isCurrent = idx === colIndex;
    const isCompleted = entree && sortie;
    const isActive = entree && !sortie;
    
    let jours = '-';
    if (isCompleted) {
      jours = calcJoursOuvrables(entree, sortie) + 'j';
    } else if (isActive) {
      jours = calcJoursOuvrables(entree, new Date().toLocaleDateString('fr-CA')) + 'j';
    }
    
    let statusClass = '';
    if (isCompleted) statusClass = 'completed';
    else if (isActive) statusClass = 'active';
    
    return `
      <div class="mobile-dept-row ${statusClass} ${isCurrent ? 'current' : ''}">
        <div class="mobile-dept-name">${dept.icon} ${dept.name}</div>
        <div class="mobile-dept-dates">
          <div class="mobile-dept-date-field">
            <label>Entrée</label>
            <input type="date" value="${entree}" onchange="updateMobileDeptDate('${dept.key}', 'entree', this.value)">
          </div>
          <div class="mobile-dept-date-field">
            <label>Sortie</label>
            <input type="date" value="${sortie}" onchange="updateMobileDeptDate('${dept.key}', 'sortie', this.value)">
          </div>
          <div class="mobile-dept-jours">${jours}</div>
        </div>
      </div>
    `;
  }).join('');
  
  const menuHTML = `
    <div class="mobile-dept-history-overlay" id="mobileDeptHistory" onclick="closeMobileDeptHistory(event)">
      <div class="mobile-dept-history" onclick="event.stopPropagation()">
        <div class="mobile-dept-history-header">
          <span>📊 Historique des départements</span>
          <button onclick="closeMobileDeptHistory()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#fff;">✕</button>
        </div>
        <div class="mobile-dept-history-body">
          ${historyHTML}
        </div>
        <div class="mobile-dept-history-footer">
          <button onclick="closeMobileDeptHistory()" class="mobile-dept-close-btn">Fermer</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
}

function closeMobileDeptHistory(event) {
  if (event && event.target.id !== 'mobileDeptHistory') return;
  const menu = document.getElementById('mobileDeptHistory');
  if (menu) menu.remove();
}

function updateMobileDeptDate(deptKey, field, value) {
  if (!currentMobileFicheId) return;
  
  if (!cardsData[currentMobileFicheId].tracking) {
    cardsData[currentMobileFicheId].tracking = {};
  }
  if (!cardsData[currentMobileFicheId].tracking[deptKey]) {
    cardsData[currentMobileFicheId].tracking[deptKey] = {};
  }
  
  cardsData[currentMobileFicheId].tracking[deptKey][field] = value;
  saveCardToFirebase(currentMobileFicheId);
  
  // Rafraîchir l'historique
  closeMobileDeptHistory({ target: { id: 'mobileDeptHistory' } });
  openMobileDeptHistory();
  
  // Rafraîchir la fiche
  renderMobilePageInfo(cardsData[currentMobileFicheId]);
}

function saveMobilePhotos() {
  if (!currentMobileFicheId) return;
  
  const clientInput = document.getElementById('photoClientInput');
  const atelierInput = document.getElementById('photoAtelierInput');
  const devisInput = document.getElementById('photoDevisInput');
  
  if (clientInput) cardsData[currentMobileFicheId].photoClient = clientInput.value.trim();
  if (atelierInput) cardsData[currentMobileFicheId].photoAtelier = atelierInput.value.trim();
  if (devisInput) cardsData[currentMobileFicheId].photoDevis = devisInput.value.trim();
  
  saveCardToFirebase(currentMobileFicheId);
  closeMobilePhotoMenu({ target: { id: 'mobilePhotoMenu' } });
  renderMobilePageInfo(cardsData[currentMobileFicheId]);
}

// Ouvrir le lien photo 1-6
function openMobilePhotoLink1to6(photoKey) {
  if (!currentMobileFicheId) return;
  
  const card = cardsData[currentMobileFicheId];
  const photoUrl = card[photoKey];
  
  if (photoUrl) {
    window.open(photoUrl, '_blank');
  } else {
    alert('Aucun lien défini. Cliquez sur 📷 pour ajouter des liens.');
  }
}

// Menu pour ajouter les liens photos 1-6 (utilise notePhoto pour synchro avec PC)
function openMobilePhotos1to6Menu() {
  if (!currentMobileFicheId) return;
  
  const card = cardsData[currentMobileFicheId];
  if (!card) {
    alert('Erreur: carte non trouvée');
    return;
  }
  
  // Préparer les valeurs (éviter undefined)
  const photo1 = card.notePhoto1 || '';
  const photo2 = card.notePhoto2 || '';
  const photo3 = card.notePhoto3 || '';
  const photo4 = card.notePhoto4 || '';
  const photo5 = card.notePhoto5 || '';
  const photo6 = card.notePhoto6 || '';
  
  const menuHTML = `
    <div class="mobile-photo-menu-overlay" id="mobilePhotos1to6Menu" onclick="closeMobilePhotos1to6Menu(event)">
      <div class="mobile-photo-menu" onclick="event.stopPropagation()">
        <div class="mobile-photo-menu-header">
          <span>📷 Liens Photos 1-6</span>
          <button onclick="closeMobilePhotos1to6Menu()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#fff;">✕</button>
        </div>
        <div class="mobile-photo-menu-content">
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 1</label>
            <input type="url" id="notePhoto1Input" value="${photo1}" placeholder="URL photo 1">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 2</label>
            <input type="url" id="notePhoto2Input" value="${photo2}" placeholder="URL photo 2">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 3</label>
            <input type="url" id="notePhoto3Input" value="${photo3}" placeholder="URL photo 3">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 4</label>
            <input type="url" id="notePhoto4Input" value="${photo4}" placeholder="URL photo 4">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 5</label>
            <input type="url" id="notePhoto5Input" value="${photo5}" placeholder="URL photo 5">
          </div>
          <div class="mobile-photo-menu-field">
            <label>📷 Photo 6</label>
            <input type="url" id="notePhoto6Input" value="${photo6}" placeholder="URL photo 6">
          </div>
        </div>
        <div class="mobile-photo-menu-actions">
          <button class="mobile-photo-save-btn" onclick="saveMobilePhotos1to6()">💾 Sauvegarder</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
}

function closeMobilePhotos1to6Menu(event) {
  if (event && event.target.id !== 'mobilePhotos1to6Menu') return;
  const menu = document.getElementById('mobilePhotos1to6Menu');
  if (menu) menu.remove();
}

function saveMobilePhotos1to6() {
  if (!currentMobileFicheId) return;
  
  // Utilise notePhoto pour synchro avec PC
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`notePhoto${i}Input`);
    if (input) {
      cardsData[currentMobileFicheId][`notePhoto${i}`] = input.value.trim();
    }
  }
  
  saveCardToFirebase(currentMobileFicheId);
  closeMobilePhotos1to6Menu({ target: { id: 'mobilePhotos1to6Menu' } });
  renderMobilePageNotes(cardsData[currentMobileFicheId]);
}

// ===== GESTION DU SWIPE =====

let swipeStartX = 0;
let swipeCurrentX = 0;
let swipeIsDragging = false;

function initMobileSwipeEvents() {
  setTimeout(() => {
    const container = document.getElementById('mobileFicheSwipeContainer');
    if (!container) return;
    
    // Touch events
    container.addEventListener('touchstart', handleMobileSwipeStart, { passive: true });
    container.addEventListener('touchmove', handleMobileSwipeMove, { passive: false });
    container.addEventListener('touchend', handleMobileSwipeEnd);
    
    // Mouse events (pour tester sur desktop)
    container.addEventListener('mousedown', handleMobileSwipeStart);
    container.addEventListener('mousemove', handleMobileSwipeMove);
    container.addEventListener('mouseup', handleMobileSwipeEnd);
    container.addEventListener('mouseleave', handleMobileSwipeEnd);
  }, 500);
}

function handleMobileSwipeStart(e) {
  swipeIsDragging = true;
  swipeStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  swipeCurrentX = swipeStartX;
  
  const wrapper = document.getElementById('mobileFicheSwipeWrapper');
  if (wrapper) {
    wrapper.classList.add('dragging');
  }
}

function handleMobileSwipeMove(e) {
  if (!swipeIsDragging) return;
  
  swipeCurrentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const diff = swipeCurrentX - swipeStartX;
  
  let newOffset = (mobileSwipeCurrentPage * -50) + (diff / window.innerWidth * 50);
  newOffset = Math.max(-50, Math.min(0, newOffset));
  
  const wrapper = document.getElementById('mobileFicheSwipeWrapper');
  if (wrapper) {
    wrapper.style.transform = `translateX(${newOffset}%)`;
  }
  
  if (e.type === 'touchmove' && Math.abs(diff) > 10) {
    e.preventDefault();
  }
}

function handleMobileSwipeEnd(e) {
  if (!swipeIsDragging) return;
  swipeIsDragging = false;
  
  const wrapper = document.getElementById('mobileFicheSwipeWrapper');
  if (wrapper) {
    wrapper.classList.remove('dragging');
  }
  
  const diff = swipeCurrentX - swipeStartX;
  const threshold = window.innerWidth * 0.2;
  
  let newPage = mobileSwipeCurrentPage;
  
  if (diff > threshold && mobileSwipeCurrentPage > 0) {
    newPage = mobileSwipeCurrentPage - 1;
  } else if (diff < -threshold && mobileSwipeCurrentPage < 1) {
    newPage = mobileSwipeCurrentPage + 1;
  }
  
  goToMobilePage(newPage);
}

function goToMobilePage(pageIndex) {
  if (pageIndex < 0) pageIndex = 0;
  if (pageIndex > 1) pageIndex = 1;
  
  mobileSwipeCurrentPage = pageIndex;
  updateMobileSwipePosition2Pages(pageIndex, true);
}

// Position pour 2 pages (50% chaque)
function updateMobileSwipePosition2Pages(pageIndex, animate) {
  const wrapper = document.getElementById('mobileFicheSwipeWrapper');
  if (wrapper) {
    wrapper.style.transition = animate ? 'transform 0.3s ease-out' : 'none';
    wrapper.style.transform = `translateX(${pageIndex * -50}%)`;
  }
}

// Exposer les fonctions mobile globalement
window.isMobileDevice = isMobileDevice;
window.initMobileAfterLogin = initMobileAfterLogin;
window.switchToDesktopMode = switchToDesktopMode;
window.clearMobileSearch = clearMobileSearch;
window.openMobileFiche = openMobileFiche;
window.closeMobileFiche = closeMobileFiche;
window.openMobilePhotoLink = openMobilePhotoLink;
window.openMobilePhotoMenu = openMobilePhotoMenu;
window.closeMobilePhotoMenu = closeMobilePhotoMenu;
window.saveMobilePhotos = saveMobilePhotos;
window.openMobilePhotoLink1to6 = openMobilePhotoLink1to6;
window.openMobilePhotos1to6Menu = openMobilePhotos1to6Menu;
window.closeMobilePhotos1to6Menu = closeMobilePhotos1to6Menu;
window.saveMobilePhotos1to6 = saveMobilePhotos1to6;
window.openMobileMoulageCalendar = openMobileMoulageCalendar;
window.openMobileItemSelector = openMobileItemSelector;
window.closeMobileItemSelector = closeMobileItemSelector;
window.selectMobileItem = selectMobileItem;
window.openMobileDeptHistory = openMobileDeptHistory;
window.closeMobileDeptHistory = closeMobileDeptHistory;
window.updateMobileDeptDate = updateMobileDeptDate;
window.insertMobileNoteTimestamp = insertMobileNoteTimestamp;
window.handleMobileNotesPaste = handleMobileNotesPaste;
window.saveMobileNotesContent = saveMobileNotesContent;

// ===== MOBILE MENU & JOBS =====
var currentMobileJobId = null;
var mobileJobSwipePage = 0;

// Créer le HTML du menu mobile
function createMobileMenuHTML() {
  const menuHTML = `
    <!-- MENU MOBILE - CHOIX MOULAGES / JOBS / ATM / PSM -->
    <div class="mobile-menu-overlay" id="mobileMenuOverlay">
      <div class="mobile-menu-title">Outil de gestion simplifiée</div>
      <div class="mobile-menu-author">par Daniel Charest</div>
      <div class="mobile-menu-buttons">
        <button class="mobile-menu-btn btn-moulages" onclick="openMobileMoulages()">
          <span class="mobile-menu-btn-icon">📋</span>
          <span class="mobile-menu-btn-text">Moulages</span>
          <span class="mobile-menu-btn-count" id="menuMoulagesCount"></span>
        </button>
        <button class="mobile-menu-btn btn-jobs" onclick="openMobileJobs()">
          <span class="mobile-menu-btn-icon">⏳</span>
          <span class="mobile-menu-btn-text">Job en attente</span>
          <span class="mobile-menu-btn-count" id="menuJobsCount"></span>
        </button>
        <button class="mobile-menu-btn btn-atm" onclick="openMobileATM()">
          <span class="mobile-menu-btn-icon">🦽</span>
          <span class="mobile-menu-btn-text">ATM</span>
          <span class="mobile-menu-btn-count" id="menuAtmCount"></span>
        </button>
        <button class="mobile-menu-btn btn-psm" onclick="openMobilePSM()">
          <span class="mobile-menu-btn-icon">🔧</span>
          <span class="mobile-menu-btn-text">Produits sur mesure</span>
          <span class="mobile-menu-btn-count" id="menuPsmCount"></span>
        </button>
        <button class="mobile-menu-btn btn-inv" onclick="openMobileInventaire()">
          <span class="mobile-menu-btn-icon">📦</span>
          <span class="mobile-menu-btn-text">Inventaire</span>
          <span class="mobile-menu-btn-count" id="menuInvCount"></span>
        </button>
      </div>
      <div class="mobile-desktop-btn" onclick="switchToDesktopMode()">
        💻 Version complète
      </div>
    </div>
    
    <!-- LISTE JOBS MOBILE -->
    <div class="mobile-jobs-overlay" id="mobileJobsOverlay">
      <div class="mobile-jobs-header">
        <button class="mobile-jobs-back" onclick="closeMobileJobs()">←</button>
        <div class="mobile-jobs-title">Job en attente de réponse</div>
        <button class="mobile-jobs-add" onclick="showMobileAddJob()">+</button>
      </div>
      <!-- Sélecteur de colonne Jobs -->
      <div class="mobile-jobs-col-selector" id="mobileJobsColSelector">
        <button class="mobile-jobs-col-btn active" onclick="selectMobileJobsCol('sonia')">👤 Sonia</button>
        <button class="mobile-jobs-col-btn" onclick="selectMobileJobsCol('jacynthe')">👤 Jacynthe</button>
        <button class="mobile-jobs-col-btn" onclick="selectMobileJobsCol('nadia')">👤 Nadia</button>
        <button class="mobile-jobs-col-btn" onclick="selectMobileJobsCol('jonathan')">👤 Jonathan</button>
        <button class="mobile-jobs-col-btn" onclick="selectMobileJobsCol('materiaux')">📦 Matériaux</button>
        <button class="mobile-jobs-col-btn" onclick="selectMobileJobsCol('moulage')">🔧 Moulage</button>
      </div>
      <div class="mobile-jobs-list" id="mobileJobsList"></div>
    </div>
    
    <!-- FICHE JOB MOBILE -->
    <div class="mobile-job-fiche-overlay" id="mobileJobFicheOverlay">
      <div class="mobile-job-fiche-header" id="mobileJobFicheHeader">
        <button class="mobile-job-fiche-back" onclick="closeMobileJobFiche()">← Retour</button>
        <div class="mobile-job-fiche-title" id="mobileJobFicheTitle">Job #000000</div>
      </div>
      <div class="mobile-job-swipe-indicator" id="mobileJobSwipeIndicator">
        ← Glissez pour voir les notes →
      </div>
      <div class="mobile-job-fiche-swipe" id="mobileJobFicheSwipe">
        <div class="mobile-job-fiche-wrapper" id="mobileJobFicheWrapper">
          <div class="mobile-job-fiche-page page-info" id="mobileJobPageInfo"></div>
          <div class="mobile-job-fiche-page page-notes" id="mobileJobPageNotes"></div>
        </div>
      </div>
      <div class="mobile-job-fiche-footer">
        <button class="mobile-job-fiche-btn btn-done" onclick="resolveMobileJob()">✓ Résolu</button>
        <button class="mobile-job-fiche-btn btn-email" onclick="emailMobileJob()">✉️ Email</button>
      </div>
    </div>
    
    <!-- ATM MOBILE -->
    <div class="mobile-atm-overlay" id="mobileAtmOverlay">
      <div class="mobile-atm-header">
        <button class="mobile-atm-back" onclick="closeMobileATM()">←</button>
        <div class="mobile-atm-title">Gestion ATM</div>
        <button class="mobile-atm-add" onclick="showMobileAddAtm()">+</button>
      </div>
      <div class="mobile-atm-search">
        <input type="text" id="mobileAtmSearchInput" placeholder="🔍 Rechercher..." oninput="filterMobileAtmCards()">
      </div>
      <div class="mobile-atm-col-indicator" id="mobileAtmColIndicator">
        <div class="mobile-atm-col-dot active" data-col="0"></div>
        <div class="mobile-atm-col-dot" data-col="1"></div>
        <div class="mobile-atm-col-dot" data-col="2"></div>
        <div class="mobile-atm-col-dot" data-col="3"></div>
        <div class="mobile-atm-col-dot" data-col="4"></div>
      </div>
      <div class="mobile-atm-swipe-container" id="mobileAtmSwipeContainer">
        <div class="mobile-atm-swipe-wrapper" id="mobileAtmSwipeWrapper">
          <div class="mobile-atm-column" data-col="0">
            <div class="mobile-atm-col-header">📁 Dossier <span class="mobile-atm-col-count" id="mobileAtmCount0">0</span></div>
            <div class="mobile-atm-col-content" id="mobileAtmCol0"></div>
          </div>
          <div class="mobile-atm-column" data-col="1">
            <div class="mobile-atm-col-header">📦 Bac <span class="mobile-atm-col-count" id="mobileAtmCount1">0</span></div>
            <div class="mobile-atm-col-content" id="mobileAtmCol1"></div>
          </div>
          <div class="mobile-atm-column" data-col="2">
            <div class="mobile-atm-col-header">🔧 Assemblage <span class="mobile-atm-col-count" id="mobileAtmCount2">0</span></div>
            <div class="mobile-atm-col-content" id="mobileAtmCol2"></div>
          </div>
          <div class="mobile-atm-column" data-col="3">
            <div class="mobile-atm-col-header">🔍 Inspection <span class="mobile-atm-col-count" id="mobileAtmCount3">0</span></div>
            <div class="mobile-atm-col-content" id="mobileAtmCol3"></div>
          </div>
          <div class="mobile-atm-column" data-col="4">
            <div class="mobile-atm-col-header">🚚 Shipping <span class="mobile-atm-col-count" id="mobileAtmCount4">0</span></div>
            <div class="mobile-atm-col-content" id="mobileAtmCol4"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- PSM MOBILE -->
    <div class="mobile-psm-overlay" id="mobilePsmOverlay">
      <div class="mobile-psm-header">
        <button class="mobile-psm-back" onclick="closeMobilePSM()">←</button>
        <div class="mobile-psm-title">Produits sur mesure</div>
        <button class="mobile-psm-add" onclick="showMobileAddPsm()">+</button>
      </div>
      <div class="mobile-psm-tabs">
        <button class="mobile-psm-tab active" onclick="showMobilePsmPage('liste')">📋 Liste</button>
        <button class="mobile-psm-tab" onclick="showMobilePsmPage('atelier')">🔨 Atelier</button>
        <button class="mobile-psm-tab" onclick="showMobilePsmPage('couture')">🧵 Couture</button>
      </div>
      
      <!-- Page Liste -->
      <div class="mobile-psm-page active" id="mobilePsmPageListe">
        <div class="mobile-psm-search">
          <input type="text" id="mobilePsmSearchInput" placeholder="🔍 Rechercher un produit..." oninput="filterMobilePsmCards()">
        </div>
        <div class="mobile-psm-list" id="mobilePsmList"></div>
      </div>
      
      <!-- Page Atelier -->
      <div class="mobile-psm-page" id="mobilePsmPageAtelier">
        <div class="mobile-psm-detail" id="mobilePsmDetailAtelier">
          <div class="mobile-psm-no-selection">Sélectionnez un produit dans la liste</div>
        </div>
      </div>
      
      <!-- Page Couture -->
      <div class="mobile-psm-page" id="mobilePsmPageCouture">
        <div class="mobile-psm-detail" id="mobilePsmDetailCouture">
          <div class="mobile-psm-no-selection">Sélectionnez un produit dans la liste</div>
        </div>
      </div>
    </div>
    
    <!-- INVENTAIRE MOBILE -->
    <div class="mobile-inv-overlay" id="mobileInvOverlay">
      <div class="mobile-inv-header">
        <button class="mobile-inv-back" onclick="closeMobileInventaire()">←</button>
        <div class="mobile-inv-title">Inventaire</div>
        <div class="mobile-inv-user" id="mobileInvUser">-</div>
      </div>
      
      <!-- Section À faire -->
      <div class="mobile-inv-afaire">
        <div class="mobile-inv-afaire-title">📦 À faire</div>
        <div class="mobile-inv-afaire-scroll" id="mobileInvAfaire"></div>
      </div>
      
      <!-- Indicateur de colonne -->
      <div class="mobile-inv-prod-indicator" id="mobileInvProdIndicator"></div>
      
      <!-- Production swipeable -->
      <div class="mobile-inv-swipe-container" id="mobileInvSwipeContainer">
        <div class="mobile-inv-swipe-wrapper" id="mobileInvSwipeWrapper"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', menuHTML);
  initMobileJobSwipe();
  initMobileAtmSwipe();
  initMobileInvSwipe();
}

// Ouvrir le menu mobile (au lieu de l'écran moulages directement)
function showMobileMenu() {
  // S'assurer que le menu existe
  if (!document.getElementById('mobileMenuOverlay')) {
    createMobileMenuHTML();
  }
  
  // Mettre à jour les compteurs
  updateMobileMenuCounts();
  
  // Afficher le menu et cacher les autres overlays
  document.getElementById('mobileMenuOverlay').classList.add('active');
  document.getElementById('mobileHomeOverlay')?.classList.remove('active');
  document.getElementById('mobileJobsOverlay')?.classList.remove('active');
  document.getElementById('mobileAtmOverlay')?.classList.remove('active');
  document.getElementById('mobilePsmOverlay')?.classList.remove('active');
  document.getElementById('mobileInvOverlay')?.classList.remove('active');
}

// Mettre à jour les compteurs du menu mobile
function updateMobileMenuCounts() {
  const moulagesCount = Object.keys(cardsData || {}).length;
  const jobsCount = Object.keys(jobsData || {}).filter(k => jobsData[k] && jobsData[k].type === 'question').length;
  const atmCount = Object.keys(atmData || {}).length;
  const psmCount = Object.keys(psmCards || {}).length;
  const invCount = Object.keys(inventaireData || {}).length;
  
  const moulagesCountEl = document.getElementById('menuMoulagesCount');
  const jobsCountEl = document.getElementById('menuJobsCount');
  const atmCountEl = document.getElementById('menuAtmCount');
  const psmCountEl = document.getElementById('menuPsmCount');
  const invCountEl = document.getElementById('menuInvCount');
  
  if (moulagesCountEl) moulagesCountEl.textContent = `(${moulagesCount})`;
  if (jobsCountEl) jobsCountEl.textContent = `(${jobsCount})`;
  if (atmCountEl) atmCountEl.textContent = `(${atmCount})`;
  if (psmCountEl) psmCountEl.textContent = `(${psmCount})`;
  if (invCountEl) invCountEl.textContent = `(${invCount})`;
}

// Ouvrir les Moulages depuis le menu
function openMobileMoulages() {
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobileHomeOverlay')?.classList.add('active');
}

// Fermer les Moulages et retourner au menu
function closeMobileMoulages() {
  document.getElementById('mobileHomeOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuOverlay')?.classList.add('active');
}

// Ouvrir les Jobs depuis le menu
// Variable pour la colonne sélectionnée Jobs mobile
var mobileJobsSelectedCol = 'sonia';

function openMobileJobs() {
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobileJobsOverlay')?.classList.add('active');
  renderMobileJobsList();
}

// Sélectionner une colonne Jobs mobile
function selectMobileJobsCol(col) {
  mobileJobsSelectedCol = col;
  
  // Mettre à jour les boutons
  document.querySelectorAll('.mobile-jobs-col-btn').forEach(btn => {
    btn.classList.toggle('active', btn.onclick.toString().includes(`'${col}'`));
  });
  
  renderMobileJobsList();
}

// Fermer les Jobs et retourner au menu
function closeMobileJobs() {
  document.getElementById('mobileJobsOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuOverlay')?.classList.add('active');
}

// ===== ATM MOBILE =====
var mobileAtmCurrentCol = 0;
var mobileAtmSwipeStartX = 0;
var mobileAtmSwiping = false;

function openMobileATM() {
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobileAtmOverlay')?.classList.add('active');
  
  // Petit délai pour s'assurer que atmData est chargé
  setTimeout(() => {
    renderMobileAtmCards();
    
    // Si aucune carte, afficher un message
    const totalCards = Object.keys(atmData || {}).length;
    if (totalCards === 0) {
      const col0 = document.getElementById('mobileAtmCol0');
      if (col0) col0.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);padding:20px;">Aucune carte ATM</div>';
    }
  }, 100);
}

function closeMobileATM() {
  document.getElementById('mobileAtmOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuOverlay')?.classList.add('active');
}

function renderMobileAtmCards() {
  const counts = [0, 0, 0, 0, 0];
  
  // Vider les colonnes
  for (let i = 0; i < 5; i++) {
    const col = document.getElementById('mobileAtmCol' + i);
    if (col) col.innerHTML = '';
  }
  
  // Remplir les colonnes
  const searchTerm = (document.getElementById('mobileAtmSearchInput')?.value || '').toLowerCase();
  
  const entries = Object.entries(atmData || {});
  
  entries.forEach(([id, card]) => {
    if (!card) return;
    
    // Filtrer par recherche
    if (searchTerm) {
      const searchText = [card.order, card.client, card.chaiseType, card.description].join(' ').toLowerCase();
      if (!searchText.includes(searchTerm)) return;
    }
    
    const colIndex = card.colonne || 0;
    if (colIndex < 0 || colIndex > 4) return;
    
    const col = document.getElementById('mobileAtmCol' + colIndex);
    if (!col) return;
    
    counts[colIndex]++;
    
    const cardHtml = `
      <div class="mobile-atm-card" onclick="openMobileAtmFiche('${id}')">
        <div class="mobile-atm-card-header">
          <span class="mobile-atm-card-type">${card.chaiseType || '-'}</span>
          <span class="mobile-atm-card-order">#${card.order || '000000'}</span>
        </div>
        <div class="mobile-atm-card-client">${card.client || 'Client'}</div>
        <button class="mobile-atm-card-btn" onclick="event.stopPropagation(); moveMobileAtmNext('${id}')">
          ${colIndex < 4 ? '→ Suivant' : '✓ Terminé'}
        </button>
      </div>
    `;
    col.insertAdjacentHTML('beforeend', cardHtml);
  });
  
  // Mettre à jour les compteurs
  for (let i = 0; i < 5; i++) {
    const countEl = document.getElementById('mobileAtmCount' + i);
    if (countEl) countEl.textContent = counts[i];
  }
  
  // Afficher message si colonne vide
  for (let i = 0; i < 5; i++) {
    const col = document.getElementById('mobileAtmCol' + i);
    if (col && col.innerHTML === '') {
      col.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:15px;font-size:12px;">Vide</div>';
    }
  }
}

function filterMobileAtmCards() {
  renderMobileAtmCards();
}

function moveMobileAtmNext(id) {
  if (!atmData[id]) return;
  const currentCol = atmData[id].colonne || 0;
  if (currentCol >= 4) return;
  
  atmData[id].colonne = currentCol + 1;
  
  // Sauvegarder
  if (firebaseDb) {
    firebaseDb.ref('atm/' + id).set(atmData[id]);
  }
  
  renderMobileAtmCards();
  showToast('✓ Carte déplacée');
}

function openMobileAtmFiche(id) {
  // Pour l'instant, juste un toast - on peut ajouter une fiche détaillée plus tard
  const card = atmData[id];
  if (card) {
    showToast(`📋 ${card.order} - ${card.client}`);
  }
}

function showMobileAddAtm() {
  // Utiliser le modal desktop pour l'instant
  showAddAtmModal();
}

function initMobileAtmSwipe() {
  setTimeout(() => {
    const container = document.getElementById('mobileAtmSwipeContainer');
    if (!container) return;
    
    container.addEventListener('touchstart', handleMobileAtmSwipeStart, { passive: true });
    container.addEventListener('touchmove', handleMobileAtmSwipeMove, { passive: false });
    container.addEventListener('touchend', handleMobileAtmSwipeEnd);
  }, 500);
}

function handleMobileAtmSwipeStart(e) {
  mobileAtmSwiping = true;
  mobileAtmSwipeStartX = e.touches[0].clientX;
}

function handleMobileAtmSwipeMove(e) {
  if (!mobileAtmSwiping) return;
  const diff = e.touches[0].clientX - mobileAtmSwipeStartX;
  
  if (Math.abs(diff) > 10) {
    e.preventDefault();
  }
}

function handleMobileAtmSwipeEnd(e) {
  if (!mobileAtmSwiping) return;
  mobileAtmSwiping = false;
  
  const diff = e.changedTouches[0].clientX - mobileAtmSwipeStartX;
  const threshold = 50;
  
  if (diff > threshold && mobileAtmCurrentCol > 0) {
    mobileAtmCurrentCol--;
  } else if (diff < -threshold && mobileAtmCurrentCol < 4) {
    mobileAtmCurrentCol++;
  }
  
  updateMobileAtmPosition();
}

function updateMobileAtmPosition() {
  const wrapper = document.getElementById('mobileAtmSwipeWrapper');
  if (wrapper) {
    wrapper.style.transform = `translateX(${mobileAtmCurrentCol * -20}%)`;
  }
  
  // Mettre à jour les dots
  document.querySelectorAll('.mobile-atm-col-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === mobileAtmCurrentCol);
  });
}

// ===== PSM MOBILE =====
var currentMobilePsmId = null;

function openMobilePSM() {
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobilePsmOverlay')?.classList.add('active');
  renderMobilePsmList();
}

function closeMobilePSM() {
  document.getElementById('mobilePsmOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuOverlay')?.classList.add('active');
}

function showMobilePsmPage(page) {
  // Mettre à jour les tabs
  document.querySelectorAll('.mobile-psm-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.mobile-psm-tab[onclick*="${page}"]`)?.classList.add('active');
  
  // Afficher la bonne page
  document.querySelectorAll('.mobile-psm-page').forEach(p => p.classList.remove('active'));
  
  if (page === 'liste') {
    document.getElementById('mobilePsmPageListe')?.classList.add('active');
  } else if (page === 'atelier') {
    document.getElementById('mobilePsmPageAtelier')?.classList.add('active');
    renderMobilePsmAtelier();
  } else if (page === 'couture') {
    document.getElementById('mobilePsmPageCouture')?.classList.add('active');
    renderMobilePsmCouture();
  }
}

function renderMobilePsmList() {
  const list = document.getElementById('mobilePsmList');
  if (!list) return;
  
  const searchTerm = (document.getElementById('mobilePsmSearchInput')?.value || '').toLowerCase();
  
  const cards = Object.entries(psmCards || {}).filter(([id, card]) => {
    if (!card) return false;
    if (searchTerm && !(card.nomPsm || '').toLowerCase().includes(searchTerm)) return false;
    return true;
  });
  
  if (cards.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);padding:40px;">Aucun produit</div>';
    return;
  }
  
  list.innerHTML = cards.map(([id, card]) => {
    const isComplete = card.completeAtelier && card.completeCouture;
    const status = isComplete ? '✓ Complet' : 
                   (card.completeAtelier ? '🔨 Atelier OK' : 
                   (card.completeCouture ? '🧵 Couture OK' : ''));
    
    return `
      <div class="mobile-psm-card ${isComplete ? 'completed' : ''}" onclick="selectMobilePsm('${id}')">
        <div class="mobile-psm-card-name">${card.nomPsm || 'Sans nom'}</div>
        ${status ? `<div class="mobile-psm-card-status">${status}</div>` : ''}
      </div>
    `;
  }).join('');
}

function filterMobilePsmCards() {
  renderMobilePsmList();
}

function selectMobilePsm(id) {
  currentMobilePsmId = id;
  
  // Mettre en surbrillance
  document.querySelectorAll('.mobile-psm-card').forEach(c => c.style.border = '2px solid #000');
  event.currentTarget.style.border = '2px solid #3b82f6';
  
  // Mettre à jour les pages Atelier et Couture
  renderMobilePsmAtelier();
  renderMobilePsmCouture();
  
  showToast('📋 ' + (psmCards[id]?.nomPsm || 'Sélectionné'));
}

function renderMobilePsmAtelier() {
  const container = document.getElementById('mobilePsmDetailAtelier');
  if (!container) return;
  
  if (!currentMobilePsmId || !psmCards[currentMobilePsmId]) {
    container.innerHTML = '<div class="mobile-psm-no-selection">Sélectionnez un produit dans la liste</div>';
    return;
  }
  
  const card = psmCards[currentMobilePsmId];
  
  container.innerHTML = `
    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:15px;text-align:center;">
      🔨 ${card.nomPsm || 'Sans nom'}
    </div>
    
    <div class="mobile-psm-checkbox-row">
      <label class="mobile-psm-checkbox">
        <input type="checkbox" ${card.checkPsmAtelier ? 'checked' : ''} onchange="updateMobilePsmField('checkPsmAtelier', this.checked)">
        <span>PSM</span>
      </label>
      <label class="mobile-psm-checkbox">
        <input type="checkbox" ${card.checkPrixMajoreAtelier ? 'checked' : ''} onchange="updateMobilePsmField('checkPrixMajoreAtelier', this.checked)">
        <span>Prix majoré</span>
      </label>
    </div>
    
    <div class="mobile-psm-field">
      <label>Temps:</label>
      <input type="text" value="${card.tempsAtelier || ''}" placeholder="Ex: 45 min" onchange="updateMobilePsmField('tempsAtelier', this.value)">
    </div>
    
    <div class="mobile-psm-field">
      <label>Évalué par:</label>
      <input type="text" value="${card.evaluateurAtelier || ''}" placeholder="Nom..." onchange="updateMobilePsmField('evaluateurAtelier', this.value)">
    </div>
    
    <div class="mobile-psm-field">
      <label>❓ Questionnement:</label>
      <textarea placeholder="Questions..." onchange="updateMobilePsmField('questionAtelier', this.value)">${card.questionAtelier || ''}</textarea>
    </div>
    
    <div class="mobile-psm-field">
      <label>📝 Notes:</label>
      <textarea placeholder="Notes..." onchange="updateMobilePsmField('notesAtelier', this.value)">${card.notesAtelier || ''}</textarea>
    </div>
    
    <button class="mobile-psm-complete-btn ${card.completeAtelier ? 'completed' : ''}" onclick="toggleMobilePsmComplete('Atelier')">
      ${card.completeAtelier ? '✓ Atelier Complété' : '✓ Marquer Complet'}
    </button>
  `;
}

function renderMobilePsmCouture() {
  const container = document.getElementById('mobilePsmDetailCouture');
  if (!container) return;
  
  if (!currentMobilePsmId || !psmCards[currentMobilePsmId]) {
    container.innerHTML = '<div class="mobile-psm-no-selection">Sélectionnez un produit dans la liste</div>';
    return;
  }
  
  const card = psmCards[currentMobilePsmId];
  
  container.innerHTML = `
    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:15px;text-align:center;">
      🧵 ${card.nomPsm || 'Sans nom'}
    </div>
    
    <div class="mobile-psm-checkbox-row">
      <label class="mobile-psm-checkbox">
        <input type="checkbox" ${card.checkPsmCouture ? 'checked' : ''} onchange="updateMobilePsmField('checkPsmCouture', this.checked)">
        <span>PSM</span>
      </label>
      <label class="mobile-psm-checkbox">
        <input type="checkbox" ${card.checkPrixMajoreCouture ? 'checked' : ''} onchange="updateMobilePsmField('checkPrixMajoreCouture', this.checked)">
        <span>Prix majoré</span>
      </label>
    </div>
    
    <div class="mobile-psm-field">
      <label>Temps:</label>
      <input type="text" value="${card.tempsCouture || ''}" placeholder="Ex: 30 min" onchange="updateMobilePsmField('tempsCouture', this.value)">
    </div>
    
    <div class="mobile-psm-field">
      <label>Évalué par:</label>
      <input type="text" value="${card.evaluateurCouture || ''}" placeholder="Nom..." onchange="updateMobilePsmField('evaluateurCouture', this.value)">
    </div>
    
    <div class="mobile-psm-field">
      <label>❓ Questionnement:</label>
      <textarea placeholder="Questions..." onchange="updateMobilePsmField('questionCouture', this.value)">${card.questionCouture || ''}</textarea>
    </div>
    
    <div class="mobile-psm-field">
      <label>📝 Notes:</label>
      <textarea placeholder="Notes..." onchange="updateMobilePsmField('notesCouture', this.value)">${card.notesCouture || ''}</textarea>
    </div>
    
    <button class="mobile-psm-complete-btn ${card.completeCouture ? 'completed' : ''}" onclick="toggleMobilePsmComplete('Couture')">
      ${card.completeCouture ? '✓ Couture Complété' : '✓ Marquer Complet'}
    </button>
  `;
}

function updateMobilePsmField(field, value) {
  if (!currentMobilePsmId || !psmCards[currentMobilePsmId]) return;
  
  psmCards[currentMobilePsmId][field] = value;
  savePsmCard(currentMobilePsmId);
}

function toggleMobilePsmComplete(section) {
  if (!currentMobilePsmId || !psmCards[currentMobilePsmId]) return;
  
  const field = 'complete' + section;
  psmCards[currentMobilePsmId][field] = !psmCards[currentMobilePsmId][field];
  savePsmCard(currentMobilePsmId);
  
  // Rafraîchir
  if (section === 'Atelier') {
    renderMobilePsmAtelier();
  } else {
    renderMobilePsmCouture();
  }
  renderMobilePsmList();
  
  showToast(psmCards[currentMobilePsmId][field] ? '✓ Marqué complet' : '↩ Marqué incomplet');
}

function showMobileAddPsm() {
  // Utiliser le modal desktop
  showAddPsmModal();
}

// Exposer les fonctions ATM/PSM mobile
window.openMobileATM = openMobileATM;
window.closeMobileATM = closeMobileATM;
window.filterMobileAtmCards = filterMobileAtmCards;
window.moveMobileAtmNext = moveMobileAtmNext;
window.openMobileAtmFiche = openMobileAtmFiche;
window.showMobileAddAtm = showMobileAddAtm;

window.openMobilePSM = openMobilePSM;
window.closeMobilePSM = closeMobilePSM;
window.showMobilePsmPage = showMobilePsmPage;
window.filterMobilePsmCards = filterMobilePsmCards;
window.selectMobilePsm = selectMobilePsm;
window.updateMobilePsmField = updateMobilePsmField;
window.toggleMobilePsmComplete = toggleMobilePsmComplete;
window.showMobileAddPsm = showMobileAddPsm;

// ===== INVENTAIRE MOBILE =====
var mobileInvCurrentCol = 0;
var mobileInvSwipeStartX = 0;
var mobileInvSwiping = false;
var mobileInvUserRang = null; // 'pablo' ou 'checkna'

function getMobileInvUserRang() {
  if (!currentUser) return null;
  const name = (currentUser.name || '').toLowerCase();
  const email = (currentUser.email || '').toLowerCase();
  
  if (name.includes('pablo') || email.includes('pablo')) return 'pablo';
  if (name.includes('checkna') || email.includes('checkna')) return 'checkna';
  
  // Admin voit tout, mais on montre Pablo par défaut
  if (currentUser.role === 'admin') return 'all';
  
  return null;
}

function openMobileInventaire() {
  mobileInvUserRang = getMobileInvUserRang();
  
  document.getElementById('mobileMenuOverlay')?.classList.remove('active');
  document.getElementById('mobileInvOverlay')?.classList.add('active');
  
  // Afficher le nom de l'utilisateur
  const userEl = document.getElementById('mobileInvUser');
  if (userEl) {
    if (mobileInvUserRang === 'pablo') userEl.textContent = 'Pablo';
    else if (mobileInvUserRang === 'checkna') userEl.textContent = 'Checkna';
    else if (mobileInvUserRang === 'all') userEl.textContent = 'Admin';
    else userEl.textContent = 'Non assigné';
  }
  
  renderMobileInventaire();
}

function closeMobileInventaire() {
  document.getElementById('mobileInvOverlay')?.classList.remove('active');
  document.getElementById('mobileMenuOverlay')?.classList.add('active');
}

function renderMobileInventaire() {
  // Rendre la section À faire
  const afaireContainer = document.getElementById('mobileInvAfaire');
  if (afaireContainer) {
    const afaireItems = Object.entries(inventaireData || {}).filter(([id, item]) => {
      return item && item.rang === 'main';
    });
    
    if (afaireItems.length === 0) {
      afaireContainer.innerHTML = '<div style="color:rgba(255,255,255,0.5);padding:10px;">Aucun item</div>';
    } else {
      afaireContainer.innerHTML = afaireItems.map(([id, item]) => `
        <div class="mobile-inv-card" onclick="mobileInvTakeItem('${id}')">
          <div class="mobile-inv-card-order">#${item.code || '---'}</div>
          <div class="mobile-inv-card-name">${item.nom || 'Sans nom'}</div>
          <div class="mobile-inv-card-qty">Qté: ${item.qte || 0}</div>
          <button class="mobile-inv-card-btn">📥 Prendre</button>
        </div>
      `).join('');
    }
  }
  
  // Rendre les colonnes de production
  const wrapper = document.getElementById('mobileInvSwipeWrapper');
  const indicator = document.getElementById('mobileInvProdIndicator');
  if (!wrapper) return;
  
  // Déterminer quels rangs afficher
  let rangsToShow = [];
  if (mobileInvUserRang === 'pablo') {
    rangsToShow = ['pablo'];
  } else if (mobileInvUserRang === 'checkna') {
    rangsToShow = ['checkna'];
  } else {
    rangsToShow = ['pablo', 'checkna'];
  }
  
  // Créer les colonnes (positions 0-5 pour chaque rang)
  let columnsHtml = '';
  let dotsHtml = '';
  let colIndex = 0;
  
  rangsToShow.forEach(rang => {
    const rangName = rang.charAt(0).toUpperCase() + rang.slice(1);
    
    for (let pos = 0; pos <= 5; pos++) {
      const items = Object.entries(inventaireData || {}).filter(([id, item]) => {
        return item && item.rang === rang && item.pos === pos;
      });
      
      columnsHtml += `
        <div class="mobile-inv-column" data-rang="${rang}" data-pos="${pos}">
          <div class="mobile-inv-col-header">
            ${rangName} - Position ${pos}
            <span>${items.length}</span>
          </div>
          <div class="mobile-inv-col-content">
            ${items.length === 0 ? '<div style="color:rgba(255,255,255,0.5);text-align:center;padding:20px;">Vide</div>' :
              items.map(([id, item]) => `
                <div class="mobile-inv-card">
                  <div class="mobile-inv-card-order">#${item.code || '---'}</div>
                  <div class="mobile-inv-card-name">${item.nom || 'Sans nom'}</div>
                  <div class="mobile-inv-card-qty">Qté: ${item.qte || 0}</div>
                  <button class="mobile-inv-card-btn" onclick="mobileInvComplete('${id}')">✓ FABRIQUÉ</button>
                </div>
              `).join('')
            }
          </div>
        </div>
      `;
      
      dotsHtml += `<div class="mobile-inv-prod-dot ${colIndex === 0 ? 'active' : ''}" data-col="${colIndex}"></div>`;
      colIndex++;
    }
  });
  
  wrapper.innerHTML = columnsHtml;
  wrapper.style.width = `${colIndex * 100}%`;
  
  if (indicator) {
    indicator.innerHTML = dotsHtml;
  }
  
  // Mettre à jour la position
  updateMobileInvPosition();
}

function mobileInvTakeItem(id) {
  if (!inventaireData[id]) return;
  if (!mobileInvUserRang || mobileInvUserRang === 'all') {
    showToast('⚠️ Utilisateur non assigné');
    return;
  }
  
  inventaireData[id].rang = mobileInvUserRang;
  inventaireData[id].pos = 0;
  
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + id).set(inventaireData[id]);
  }
  
  renderMobileInventaire();
  showToast('✓ Item pris');
}

function mobileInvComplete(id) {
  if (!inventaireData[id]) return;
  
  // Supprimer l'item
  delete inventaireData[id];
  
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + id).remove();
  }
  
  renderMobileInventaire();
  showToast('✓ Fabriqué!');
}

function initMobileInvSwipe() {
  setTimeout(() => {
    const container = document.getElementById('mobileInvSwipeContainer');
    if (!container) return;
    
    container.addEventListener('touchstart', handleMobileInvSwipeStart, { passive: true });
    container.addEventListener('touchmove', handleMobileInvSwipeMove, { passive: false });
    container.addEventListener('touchend', handleMobileInvSwipeEnd);
  }, 500);
}

function handleMobileInvSwipeStart(e) {
  mobileInvSwiping = true;
  mobileInvSwipeStartX = e.touches[0].clientX;
}

function handleMobileInvSwipeMove(e) {
  if (!mobileInvSwiping) return;
  const diff = e.touches[0].clientX - mobileInvSwipeStartX;
  if (Math.abs(diff) > 10) e.preventDefault();
}

function handleMobileInvSwipeEnd(e) {
  if (!mobileInvSwiping) return;
  mobileInvSwiping = false;
  
  const diff = e.changedTouches[0].clientX - mobileInvSwipeStartX;
  const threshold = 50;
  const maxCol = document.querySelectorAll('.mobile-inv-column').length - 1;
  
  if (diff > threshold && mobileInvCurrentCol > 0) {
    mobileInvCurrentCol--;
  } else if (diff < -threshold && mobileInvCurrentCol < maxCol) {
    mobileInvCurrentCol++;
  }
  
  updateMobileInvPosition();
}

function updateMobileInvPosition() {
  const wrapper = document.getElementById('mobileInvSwipeWrapper');
  const numCols = document.querySelectorAll('.mobile-inv-column').length || 1;
  const colWidth = 100 / numCols;
  
  if (wrapper) {
    wrapper.style.transform = `translateX(${mobileInvCurrentCol * -colWidth}%)`;
  }
  
  document.querySelectorAll('.mobile-inv-prod-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === mobileInvCurrentCol);
  });
}

// Exposer les fonctions Inventaire mobile
window.openMobileInventaire = openMobileInventaire;
window.closeMobileInventaire = closeMobileInventaire;
window.mobileInvTakeItem = mobileInvTakeItem;
window.mobileInvComplete = mobileInvComplete;

// Rendre la liste des jobs mobile selon la colonne sélectionnée
function renderMobileJobsList() {
  const list = document.getElementById('mobileJobsList');
  if (!list) return;
  
  let items = [];
  let colTitle = '';
  
  // Filtrer selon la colonne sélectionnée
  if (mobileJobsSelectedCol === 'moulage') {
    // Moulages en attente (colonne 7)
    colTitle = '🔧 Moulage en attente';
    const moulages = Object.entries(cardsData || {})
      .filter(([id, card]) => card && card.colonne === 7)
      .sort((a, b) => (b[1].dateCreation || 0) - (a[1].dateCreation || 0));
    
    items = moulages.map(([id, card]) => {
      const days = Math.ceil((Date.now() - (card.dateCreation || Date.now())) / (1000 * 60 * 60 * 24));
      const daysClass = days > 14 ? 'days-red' : days > 7 ? 'days-yellow' : '';
      return {
        id,
        type: 'moulage',
        order: card.order,
        client: card.client,
        name: card.name,
        days,
        daysClass,
        region: card.region
      };
    });
  } else if (mobileJobsSelectedCol === 'materiaux') {
    // Jobs matériaux
    colTitle = '📦 Att. Matériaux';
    const jobs = Object.entries(jobsData || {})
      .filter(([id, job]) => job && job.type === 'materiaux')
      .sort((a, b) => calcJobDays(b[1].dateAmene) - calcJobDays(a[1].dateAmene));
    
    items = jobs.map(([id, job]) => {
      const days = calcJobDays(job.dateAmene);
      return {
        id,
        type: 'job',
        order: job.order,
        client: job.client,
        days,
        daysClass: getDaysClass(days),
        region: job.region
      };
    });
  } else {
    // Jobs par assignee (Sonia, Jacynthe, Nadia, Jonathan)
    const assigneeMap = {
      'sonia': 'Sonia',
      'jacynthe': 'Jacynthe',
      'nadia': 'Nadia',
      'jonathan': 'Jonathan Perreault'
    };
    const assignee = assigneeMap[mobileJobsSelectedCol] || 'Sonia';
    colTitle = '👤 ' + assignee;
    
    const jobs = Object.entries(jobsData || {})
      .filter(([id, job]) => job && job.type === 'question' && job.assignee === assignee)
      .sort((a, b) => calcJobDays(b[1].dateAmene) - calcJobDays(a[1].dateAmene));
    
    items = jobs.map(([id, job]) => {
      const days = calcJobDays(job.dateAmene);
      return {
        id,
        type: 'job',
        order: job.order,
        client: job.client,
        days,
        daysClass: getDaysClass(days),
        region: job.region,
        representant: job.representant
      };
    });
  }
  
  // Afficher le titre et le nombre
  const header = `<div class="mobile-jobs-filter-info">${colTitle} (${items.length})</div>`;
  
  if (items.length === 0) {
    list.innerHTML = header + '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:40px;">Aucun élément</div>';
    return;
  }
  
  // Générer les cartes
  list.innerHTML = header + items.map(item => {
    const regionClass = (item.region || '').toLowerCase().includes('anglais') ? 'region-on' : 
                        (item.region || '').toLowerCase().includes('france') ? 'region-fr' : '';
    
    if (item.type === 'moulage') {
      return `
        <div class="mobile-job-card moulage-card ${regionClass}" onclick="goToMoulageFromMobile('${item.id}')">
          <div class="mobile-job-card-row1">
            <span class="mobile-job-card-order">#${item.order || '------'}</span>
            <span class="mobile-job-card-rep">🔧</span>
          </div>
          <div class="mobile-job-card-row2">
            <span class="mobile-job-card-client">${item.client || item.name || '-'}</span>
          </div>
          <div class="mobile-job-card-days ${item.daysClass}">${item.days}j en attente</div>
        </div>
      `;
    } else {
      return `
        <div class="mobile-job-card ${regionClass}" onclick="openMobileJobFiche('${item.id}')">
          <div class="mobile-job-card-row1">
            <span class="mobile-job-card-order">#${item.order || '------'}</span>
            <span class="mobile-job-card-rep">${item.representant || '-'}</span>
          </div>
          <div class="mobile-job-card-row2">
            <span class="mobile-job-card-client">${item.client || '-'}</span>
          </div>
          <div class="mobile-job-card-days ${item.daysClass}">${item.days}j en attente</div>
        </div>
      `;
    }
  }).join('');
}

// Aller vers un moulage depuis Jobs mobile
function goToMoulageFromMobile(cardId) {
  // Fermer les overlays
  document.getElementById('mobileJobsOverlay')?.classList.remove('active');
  
  // Ouvrir le moulage dans la fiche mobile
  openMobileFiche(cardId);
}

// Ouvrir la fiche job mobile
function openMobileJobFiche(jobId) {
  currentMobileJobId = jobId;
  const job = jobsData[jobId];
  if (!job) return;
  
  // Header
  const header = document.getElementById('mobileJobFicheHeader');
  header.className = 'mobile-job-fiche-header';
  if (job.region === 'Canada anglais') header.classList.add('region-on');
  else if (job.region === 'France') header.classList.add('region-fr');
  
  document.getElementById('mobileJobFicheTitle').textContent = `Job #${job.order || '------'}`;
  
  // Page Info
  renderMobileJobPageInfo(job);
  
  // Page Notes
  renderMobileJobPageNotes(job);
  
  // Reset swipe
  mobileJobSwipePage = 0;
  setMobileJobSwipePage(0, false);
  updateMobileJobSwipeIndicator();
  
  // Afficher
  document.getElementById('mobileJobFicheOverlay')?.classList.add('active');
}

// Fermer la fiche job mobile
function closeMobileJobFiche() {
  document.getElementById('mobileJobFicheOverlay')?.classList.remove('active');
  currentMobileJobId = null;
}

// Rendre la page Info du job mobile
function renderMobileJobPageInfo(job) {
  const page = document.getElementById('mobileJobPageInfo');
  if (!page) return;
  
  page.innerHTML = `
    <div class="mobile-job-field">
      <label>Centre</label>
      <select id="mobileJobClient" onchange="updateMobileJobField('client', this.value)">
        <option value="">-- Sélectionner --</option>
        ${(customLists.moulageClients || []).map(c => `<option value="${c}" ${job.client === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    
    <div class="mobile-job-field-row">
      <div class="mobile-job-field">
        <label>N° Commande</label>
        <input type="text" value="${job.order || ''}" onchange="updateMobileJobField('order', this.value)">
      </div>
      <div class="mobile-job-field">
        <label>Région</label>
        <select onchange="updateMobileJobField('region', this.value)">
          <option value="Quebec" ${job.region === 'Quebec' ? 'selected' : ''}>Québec</option>
          <option value="Canada anglais" ${job.region === 'Canada anglais' ? 'selected' : ''}>Canada anglais</option>
          <option value="France" ${job.region === 'France' ? 'selected' : ''}>France</option>
        </select>
      </div>
    </div>
    
    <div class="mobile-job-field-row">
      <div class="mobile-job-field">
        <label>PO</label>
        <input type="text" value="${job.numeroPO || ''}" onchange="updateMobileJobField('numeroPO', this.value)">
      </div>
      <div class="mobile-job-field">
        <label>Soumission</label>
        <input type="text" value="${job.numeroSoumission || ''}" onchange="updateMobileJobField('numeroSoumission', this.value)">
      </div>
    </div>
    
    <div class="mobile-job-field-row">
      <div class="mobile-job-field">
        <label>Représentante</label>
        <select onchange="updateMobileJobField('representant', this.value)">
          <option value="">--</option>
          ${(customLists.representantes || []).map(r => `<option value="${r}" ${job.representant === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="mobile-job-field">
        <label>Intervenant</label>
        <select onchange="updateMobileJobField('intervenant', this.value)">
          <option value="">--</option>
          ${(customLists.intervenants || []).map(i => `<option value="${i}" ${job.intervenant === i ? 'selected' : ''}>${i}</option>`).join('')}
        </select>
      </div>
    </div>
    
    <div class="mobile-job-field-row">
      <div class="mobile-job-field">
        <label>Réception</label>
        <div class="mobile-job-date-pill" onclick="openMobileJobCalendar('dateRecue')">${formatJobDate(job.dateRecue)}</div>
      </div>
      <div class="mobile-job-field">
        <label>En attente</label>
        <div class="mobile-job-date-pill" onclick="openMobileJobCalendar('dateAmene')">${formatJobDate(job.dateAmene)}</div>
      </div>
      <div class="mobile-job-field">
        <label>Livraison</label>
        <div class="mobile-job-date-pill" onclick="openMobileJobCalendar('dateLivraison')">${formatJobDate(job.dateLivraison)}</div>
      </div>
    </div>
  `;
}

// Rendre la page Notes du job mobile (avec support images comme desktop)
function renderMobileJobPageNotes(job) {
  const page = document.getElementById('mobileJobPageNotes');
  if (!page) return;
  
  page.innerHTML = `
    <div class="mobile-job-notes-area">
      <div class="mobile-job-notes-header">📝 Notes (collez des images!)</div>
      <div class="mobile-job-notes-content" 
           id="mobileJobNotesContent" 
           contenteditable="true"
           onclick="insertMobileJobNoteTimestamp(event)"
           onpaste="handleMobileJobNotesPaste(event)"
           onblur="saveMobileJobNotesContent()">${job.notes || ''}</div>
    </div>
  `;
  
  // Initialiser le redimensionnement des images existantes
  setTimeout(() => initMobileJobNotesImageResizing(), 100);
}

// Insérer timestamp au clic dans les notes job mobile
// Insérer timestamp au clic dans les notes job mobile - Utilise le système standardisé
function insertMobileJobNoteTimestamp(event) {
  handleStandardNoteClick('mobileJobNotesContent', saveMobileJobNotesContent);
}

// Gérer le collage d'images dans les notes job mobile
function handleMobileJobNotesPaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;
  
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.width = '150px';
        img.style.cursor = 'nwse-resize';
        img.style.display = 'block';
        img.style.margin = '5px 0';
        
        // Activer le redimensionnement
        makeMobileJobImageResizable(img);
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          document.getElementById('mobileJobNotesContent').appendChild(img);
        }
        
        saveMobileJobNotesContent();
      };
      
      reader.readAsDataURL(file);
      break;
    }
  }
}

// Rendre une image redimensionnable (touch + mouse)
function makeMobileJobImageResizable(img) {
  let isResizing = false;
  let startX, startWidth;
  
  // Touch events
  img.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = img.getBoundingClientRect();
      const isNearEdge = (rect.right - touch.clientX < 30) && (rect.bottom - touch.clientY < 30);
      
      if (isNearEdge) {
        e.preventDefault();
        isResizing = true;
        startX = touch.clientX;
        startWidth = img.offsetWidth;
        img.style.opacity = '0.7';
      }
    }
  }, { passive: false });
  
  img.addEventListener('touchmove', function(e) {
    if (!isResizing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newWidth = startWidth + (touch.clientX - startX);
    if (newWidth > 50 && newWidth < 300) {
      img.style.width = newWidth + 'px';
      img.style.height = 'auto';
    }
  }, { passive: false });
  
  img.addEventListener('touchend', function() {
    if (isResizing) {
      isResizing = false;
      img.style.opacity = '1';
      saveMobileJobNotesContent();
    }
  });
  
  // Mouse events (pour desktop)
  img.addEventListener('mousedown', function(e) {
    const rect = img.getBoundingClientRect();
    const isNearEdge = (rect.right - e.clientX < 20) && (rect.bottom - e.clientY < 20);
    
    if (isNearEdge) {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = img.offsetWidth;
      
      const onMouseMove = (e) => {
        if (!isResizing) return;
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > 50 && newWidth < 300) {
          img.style.width = newWidth + 'px';
          img.style.height = 'auto';
        }
      };
      
      const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        saveMobileJobNotesContent();
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });
}

// Initialiser le redimensionnement des images existantes
function initMobileJobNotesImageResizing() {
  const content = document.getElementById('mobileJobNotesContent');
  if (content) {
    content.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'nwse-resize';
      img.style.maxWidth = '100%';
      makeMobileJobImageResizable(img);
    });
  }
}

// Sauvegarder les notes job mobile
function saveMobileJobNotesContent() {
  if (!currentMobileJobId || !jobsData[currentMobileJobId]) return;
  const content = document.getElementById('mobileJobNotesContent');
  if (content) {
    jobsData[currentMobileJobId].notes = content.innerHTML;
    saveJobToFirebase(currentMobileJobId);
  }
}

// Mettre à jour un champ du job mobile
function updateMobileJobField(field, value) {
  if (!currentMobileJobId || !jobsData[currentMobileJobId]) return;
  jobsData[currentMobileJobId][field] = value;
  saveJobToFirebase(currentMobileJobId);
  renderMobileJobsList();
}

// Ouvrir le calendrier pour une date de job mobile
function openMobileJobCalendar(field) {
  const job = jobsData[currentMobileJobId];
  if (!job) return;
  
  const currentDate = job[field] || '';
  
  showCalendar({
    value: currentDate,
    mode: 'modal',
    onSelect: (dateStr) => {
      if (currentMobileJobId && jobsData[currentMobileJobId]) {
        jobsData[currentMobileJobId][field] = dateStr;
        saveJobToFirebase(currentMobileJobId);
        renderMobileJobPageInfo(jobsData[currentMobileJobId]);
        renderMobileJobsList();
      }
    }
  });
}

// Résoudre le job mobile
function resolveMobileJob() {
  if (!currentMobileJobId) return;
  
  // D'abord demander si l'utilisateur veut imprimer
  const wantPrint = confirm('📄 Voulez-vous IMPRIMER cette fiche avant de la classer?\n\n(Cliquez OK pour imprimer, Annuler pour continuer sans imprimer)');
  
  if (wantPrint) {
    // Imprimer la fiche mobile
    const printContent = document.querySelector('.mobile-job-fiche');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
        <head>
          <title>Job en attente - Impression</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            * { color: black !important; background: white !important; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
  
  // Puis demander confirmation
  if (confirm('Marquer ce job comme résolu?')) {
    deleteJobFromFirebase(currentMobileJobId);
    closeMobileJobFiche();
    renderMobileJobsList();
  }
}

// Email du job mobile
function emailMobileJob() {
  if (!currentMobileJobId) return;
  currentJobId = currentMobileJobId;
  sendJobEmail();
}

// Variables globales pour le swipe jobs
var jobSwipeIsDragging = false;
var jobSwipeStartX = 0;
var jobSwipeCurrentX = 0;

// Initialiser le swipe pour les jobs mobiles (identique aux moulages)
function initMobileJobSwipe() {
  setTimeout(() => {
    const container = document.getElementById('mobileJobFicheSwipe');
    if (!container) return;
    
    // Touch events
    container.addEventListener('touchstart', handleJobSwipeStart, { passive: true });
    container.addEventListener('touchmove', handleJobSwipeMove, { passive: false });
    container.addEventListener('touchend', handleJobSwipeEnd);
    
    // Mouse events (pour tester sur desktop)
    container.addEventListener('mousedown', handleJobSwipeStart);
    container.addEventListener('mousemove', handleJobSwipeMove);
    container.addEventListener('mouseup', handleJobSwipeEnd);
    container.addEventListener('mouseleave', handleJobSwipeEnd);
  }, 500);
}

function handleJobSwipeStart(e) {
  jobSwipeIsDragging = true;
  jobSwipeStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  jobSwipeCurrentX = jobSwipeStartX;
  
  const wrapper = document.getElementById('mobileJobFicheWrapper');
  if (wrapper) {
    wrapper.style.transition = 'none';
  }
}

function handleJobSwipeMove(e) {
  if (!jobSwipeIsDragging) return;
  
  jobSwipeCurrentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const diff = jobSwipeCurrentX - jobSwipeStartX;
  
  // Calculer la nouvelle position en suivant le doigt
  let newOffset = (mobileJobSwipePage * -50) + (diff / window.innerWidth * 50);
  newOffset = Math.max(-50, Math.min(0, newOffset));
  
  const wrapper = document.getElementById('mobileJobFicheWrapper');
  if (wrapper) {
    wrapper.style.transform = `translateX(${newOffset}%)`;
  }
  
  if (e.type === 'touchmove' && Math.abs(diff) > 10) {
    e.preventDefault();
  }
}

function handleJobSwipeEnd(e) {
  if (!jobSwipeIsDragging) return;
  jobSwipeIsDragging = false;
  
  const diff = jobSwipeCurrentX - jobSwipeStartX;
  const threshold = window.innerWidth * 0.2;
  
  let newPage = mobileJobSwipePage;
  
  if (diff > threshold && mobileJobSwipePage > 0) {
    newPage = mobileJobSwipePage - 1;
  } else if (diff < -threshold && mobileJobSwipePage < 1) {
    newPage = mobileJobSwipePage + 1;
  }
  
  mobileJobSwipePage = newPage;
  setMobileJobSwipePage(newPage, true);
  updateMobileJobSwipeIndicator();
}

// Définir la page du swipe job
function setMobileJobSwipePage(pageIndex, animate) {
  const wrapper = document.getElementById('mobileJobFicheWrapper');
  if (wrapper) {
    wrapper.style.transition = animate ? 'transform 0.3s ease-out' : 'none';
    wrapper.style.transform = `translateX(${pageIndex * -50}%)`;
  }
}

// Mettre à jour l'indicateur de swipe
function updateMobileJobSwipeIndicator() {
  const indicator = document.getElementById('mobileJobSwipeIndicator');
  if (indicator) {
    indicator.textContent = mobileJobSwipePage === 0 
      ? '← Glissez pour voir les notes →' 
      : '← Glissez pour voir les infos →';
  }
}

// Afficher le modal d'ajout de job mobile
function showMobileAddJob() {
  showAddJobModal('question');
}

// Exposer les nouvelles fonctions
window.showMobileMenu = showMobileMenu;
window.openMobileMoulages = openMobileMoulages;
window.closeMobileMoulages = closeMobileMoulages;
window.openMobileJobs = openMobileJobs;
window.closeMobileJobs = closeMobileJobs;
window.selectMobileJobsCol = selectMobileJobsCol;
window.goToMoulageFromMobile = goToMoulageFromMobile;
window.openMobileJobFiche = openMobileJobFiche;
window.closeMobileJobFiche = closeMobileJobFiche;
window.updateMobileJobField = updateMobileJobField;
window.openMobileJobCalendar = openMobileJobCalendar;
window.insertMobileJobNoteTimestamp = insertMobileJobNoteTimestamp;
window.handleMobileJobNotesPaste = handleMobileJobNotesPaste;
window.saveMobileJobNotesContent = saveMobileJobNotesContent;
window.resolveMobileJob = resolveMobileJob;
window.emailMobileJob = emailMobileJob;
window.showMobileAddJob = showMobileAddJob;

// ===== IMPORT/EXPORT & LOG FUNCTIONS =====
let logEntries = [];

function openImportExportMenu() {
  document.getElementById('importExportOverlay')?.classList.remove('hidden');
  document.getElementById('settingsOverlay')?.classList.add('hidden');
}

function closeImportExportMenu() {
  document.getElementById('importExportOverlay')?.classList.add('hidden');
}

function openLogMenu() {
  // Utiliser le nouveau menu Log avec les options
  showLogMenu();
  document.getElementById('settingsOverlay')?.classList.add('hidden');
}

function closeLogMenu() {
  document.getElementById('logOverlay')?.classList.add('hidden');
}

// ===== SYSTÈME D'ARCHIVES =====
let archivedCards = [];
let currentArchiveIndex = 0;

// Charger les archives depuis localStorage
function loadArchivedCards() {
  try {
    const stored = localStorage.getItem('physipro_archives');
    if (stored) {
      archivedCards = JSON.parse(stored);
      console.log(`📁 ${archivedCards.length} archive(s) chargée(s)`);
    }
  } catch (e) {
    console.error('Erreur chargement archives:', e);
    archivedCards = [];
  }
}

// Sauvegarder les archives
function saveArchivedCards() {
  try {
    localStorage.setItem('physipro_archives', JSON.stringify(archivedCards));
  } catch (e) {
    console.error('Erreur sauvegarde archives:', e);
  }
}

// Archiver une carte avant suppression
function archiveCard(cardId, cardData, type = 'moulage') {
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Anonyme';
  
  const archive = {
    id: cardId,
    type: type,
    name: cardData.name || 'Sans nom',
    client: cardData.client || '-',
    order: cardData.order || '-',
    numeroPO: cardData.numeroPO || '-',
    region: cardData.region || '-',
    intervenant: cardData.intervenant || '-',
    representant: cardData.representant || '-',
    dateRecue: cardData.dateRecue || '-',
    dateLivraison: cardData.dateLivraison || '-',
    dateEssayage: cardData.dateEssayage || '-',
    notes: cardData.notes || '-',
    lastColumnName: getColumnName(cardData.col) || '-',
    departmentTime: cardData.departmentTime || {},
    deletedAt: new Date().toISOString(),
    deletedBy: userName
  };
  
  archivedCards.unshift(archive);
  saveArchivedCards();
  console.log(`📁 Carte archivée: ${archive.name}`);
}

function getColumnName(col) {
  const names = ['Robot', 'Dégauchage', 'Essayage', 'Atelier', 'Couture', 'Peinture', 'Expédition', 'En attente'];
  return names[col] || 'Inconnu';
}

// Menu Log principal avec toutes les options
function showLogMenu() {
  document.getElementById('logMenuPopup')?.remove();
  
  const popup = document.createElement('div');
  popup.id = 'logMenuPopup';
  popup.className = 'archives-popup-overlay';
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  
  popup.innerHTML = `
    <div class="log-menu-popup">
      <div class="log-menu-header">
        <h2>📋 Menu Log</h2>
        <button class="archives-close" onclick="document.getElementById('logMenuPopup').remove()">✕</button>
      </div>
      <div class="log-menu-content">
        <button class="log-menu-btn" onclick="document.getElementById('logMenuPopup').remove(); showArchivesPopup();">
          <span class="log-menu-icon">📁</span>
          <span class="log-menu-text">Registre</span>
          <span class="log-menu-desc">Liste de toutes les cartes archivées</span>
        </button>
        <button class="log-menu-btn" onclick="document.getElementById('logMenuPopup').remove(); showArchiveSlider();">
          <span class="log-menu-icon">🔍</span>
          <span class="log-menu-text">Consulter une par une</span>
          <span class="log-menu-desc">Naviguer avec un slider</span>
        </button>
        <button class="log-menu-btn" onclick="document.getElementById('logMenuPopup').remove(); printAllArchives();">
          <span class="log-menu-icon">🖨️</span>
          <span class="log-menu-text">Imprimer tout</span>
          <span class="log-menu-desc">Imprimer le registre complet</span>
        </button>
        <button class="log-menu-btn backup-btn" onclick="document.getElementById('logMenuPopup').remove(); showBackupsPopup();">
          <span class="log-menu-icon">💾</span>
          <span class="log-menu-text">Backups</span>
          <span class="log-menu-desc">Voir et restaurer les sauvegardes (7 jours)</span>
        </button>
      </div>
      <div class="log-menu-footer">
        <span>${archivedCards.length} carte(s) archivée(s)</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

// Afficher le registre des archives
function showArchivesPopup() {
  document.getElementById('archivesPopup')?.remove();
  
  const popup = document.createElement('div');
  popup.id = 'archivesPopup';
  popup.className = 'archives-popup-overlay';
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  
  let archivesHtml = '';
  if (archivedCards.length === 0) {
    archivesHtml = '<div class="archives-empty">Aucune carte archivée</div>';
  } else {
    archivedCards.forEach((archive, index) => {
      const deletedDate = new Date(archive.deletedAt).toLocaleDateString('fr-CA');
      const deptTime = archive.departmentTime || {};
      const deptTimeStr = Object.entries(deptTime).map(([d, t]) => `${d}: ${t}j`).join(', ') || '-';
      
      archivesHtml += `
        <div class="archive-card" onclick="toggleArchiveDetails(${index})">
          <div class="archive-header">
            <span class="archive-type ${archive.type}">${archive.type === 'moulage' ? '🔧' : '📦'}</span>
            <span class="archive-name">${archive.name}</span>
            <span class="archive-date">Supprimé le ${deletedDate}</span>
          </div>
          <div class="archive-summary">
            <span>Client: ${archive.client}</span>
            <span>N° Cmd: ${archive.order}</span>
            <span>Par: ${archive.deletedBy}</span>
          </div>
          <div class="archive-details" id="archiveDetails_${index}" style="display:none;">
            <div class="archive-detail-row"><span>N° PO:</span><span>${archive.numeroPO}</span></div>
            <div class="archive-detail-row"><span>Région:</span><span>${archive.region}</span></div>
            <div class="archive-detail-row"><span>Intervenant:</span><span>${archive.intervenant}</span></div>
            <div class="archive-detail-row"><span>Représentante:</span><span>${archive.representant}</span></div>
            <div class="archive-detail-row"><span>Date reçue:</span><span>${archive.dateRecue}</span></div>
            <div class="archive-detail-row"><span>Date livraison:</span><span>${archive.dateLivraison}</span></div>
            <div class="archive-detail-row"><span>Date essayage:</span><span>${archive.dateEssayage}</span></div>
            <div class="archive-detail-row"><span>Dernière colonne:</span><span>${archive.lastColumnName}</span></div>
            <div class="archive-detail-row"><span>Temps départements:</span><span>${deptTimeStr}</span></div>
            <div class="archive-detail-row"><span>Notes:</span><span>${archive.notes}</span></div>
          </div>
        </div>
      `;
    });
  }
  
  popup.innerHTML = `
    <div class="archives-popup">
      <div class="archives-header">
        <h2>📁 Registre des archives</h2>
        <span class="archives-count">${archivedCards.length} carte(s)</span>
        <button class="archives-close" onclick="document.getElementById('archivesPopup').remove()">✕</button>
      </div>
      <div class="archives-list">
        ${archivesHtml}
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

function toggleArchiveDetails(index) {
  const details = document.getElementById('archiveDetails_' + index);
  if (details) {
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  }
}

// Slider pour voir les archives une par une
function showArchiveSlider() {
  if (archivedCards.length === 0) {
    alert('Aucune carte archivée');
    return;
  }
  
  currentArchiveIndex = 0;
  renderArchiveSlider();
}

function renderArchiveSlider() {
  document.getElementById('archiveSliderPopup')?.remove();
  
  const archive = archivedCards[currentArchiveIndex];
  const deletedDate = new Date(archive.deletedAt).toLocaleDateString('fr-CA');
  const deptTime = archive.departmentTime || {};
  
  const popup = document.createElement('div');
  popup.id = 'archiveSliderPopup';
  popup.className = 'archives-popup-overlay';
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  
  popup.innerHTML = `
    <div class="archive-slider-popup">
      <div class="archive-slider-header">
        <button class="slider-nav-btn" onclick="event.stopPropagation(); navigateArchive(-1)" ${currentArchiveIndex === 0 ? 'disabled' : ''}>◀ Précédent</button>
        <span class="slider-counter">${currentArchiveIndex + 1} / ${archivedCards.length}</span>
        <button class="slider-nav-btn" onclick="event.stopPropagation(); navigateArchive(1)" ${currentArchiveIndex === archivedCards.length - 1 ? 'disabled' : ''}>Suivant ▶</button>
        <button class="archives-close" onclick="document.getElementById('archiveSliderPopup').remove()">✕</button>
      </div>
      
      <div class="archive-slider-content" onclick="event.stopPropagation()">
        <div class="archive-slider-title">
          <span class="archive-type-big">${archive.type === 'moulage' ? '🔧' : '📦'}</span>
          <h2>${archive.name}</h2>
        </div>
        
        <div class="archive-slider-grid">
          <div class="archive-slider-field"><span class="label">Client:</span><span class="value">${archive.client}</span></div>
          <div class="archive-slider-field"><span class="label">N° Commande:</span><span class="value">${archive.order}</span></div>
          <div class="archive-slider-field"><span class="label">N° PO:</span><span class="value">${archive.numeroPO}</span></div>
          <div class="archive-slider-field"><span class="label">Région:</span><span class="value">${archive.region}</span></div>
          <div class="archive-slider-field"><span class="label">Intervenant:</span><span class="value">${archive.intervenant}</span></div>
          <div class="archive-slider-field"><span class="label">Représentante:</span><span class="value">${archive.representant}</span></div>
          <div class="archive-slider-field"><span class="label">Date reçue:</span><span class="value">${archive.dateRecue}</span></div>
          <div class="archive-slider-field"><span class="label">Date livraison:</span><span class="value">${archive.dateLivraison}</span></div>
          <div class="archive-slider-field"><span class="label">Date essayage:</span><span class="value">${archive.dateEssayage}</span></div>
          <div class="archive-slider-field"><span class="label">Dernière colonne:</span><span class="value">${archive.lastColumnName}</span></div>
        </div>
        
        <div class="archive-slider-section">
          <h3>⏱ Temps par département</h3>
          <div class="archive-dept-times">
            ${Object.entries(deptTime).map(([dept, days]) => `<span class="dept-time-pill">${dept}: ${days}j</span>`).join('') || '<span class="no-data">Aucune donnée</span>'}
          </div>
        </div>
        
        <div class="archive-slider-section">
          <h3>📝 Notes</h3>
          <div class="archive-notes-box">${archive.notes || '-'}</div>
        </div>
        
        <div class="archive-slider-footer">
          <span>Supprimé le ${deletedDate} par ${archive.deletedBy}</span>
        </div>
      </div>
      
      <div class="archive-slider-range" onclick="event.stopPropagation()">
        <input type="range" min="0" max="${archivedCards.length - 1}" value="${currentArchiveIndex}" 
          onchange="currentArchiveIndex = parseInt(this.value); renderArchiveSlider();"
          oninput="document.getElementById('sliderPreview').textContent = (parseInt(this.value) + 1) + ' / ${archivedCards.length}'">
        <span id="sliderPreview">${currentArchiveIndex + 1} / ${archivedCards.length}</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

function navigateArchive(direction) {
  currentArchiveIndex += direction;
  if (currentArchiveIndex < 0) currentArchiveIndex = 0;
  if (currentArchiveIndex >= archivedCards.length) currentArchiveIndex = archivedCards.length - 1;
  renderArchiveSlider();
}

// Imprimer tout le registre
function printAllArchives() {
  if (archivedCards.length === 0) {
    alert('Aucune carte archivée à imprimer');
    return;
  }
  
  let printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registre des Archives - PhysiPro</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
        h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .archive-item { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin-bottom: 15px; page-break-inside: avoid; }
        .archive-item h2 { font-size: 14px; margin: 0 0 10px 0; color: #1e3a5f; }
        .archive-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .archive-field { display: flex; gap: 5px; }
        .archive-field .label { font-weight: bold; color: #666; }
        .archive-field .value { color: #000; }
        .dept-times { margin-top: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
        .notes-box { margin-top: 10px; padding: 8px; background: #fffde7; border-radius: 4px; font-style: italic; }
        .footer { font-size: 9px; color: #999; margin-top: 8px; border-top: 1px dotted #ccc; padding-top: 5px; }
        @media print { .archive-item { break-inside: avoid; } }
      </style>
    </head>
    <body>
      <h1>📋 Registre des Archives - PhysiPro</h1>
      <p>Total: ${archivedCards.length} carte(s) archivée(s) | Imprimé le ${new Date().toLocaleDateString('fr-CA')}</p>
  `;
  
  archivedCards.forEach((archive, index) => {
    const deletedDate = new Date(archive.deletedAt).toLocaleDateString('fr-CA');
    const deptTime = archive.departmentTime || {};
    const deptTimeStr = Object.entries(deptTime).map(([d, t]) => `${d}: ${t}j`).join(' | ') || 'Aucune donnée';
    
    printHtml += `
      <div class="archive-item">
        <h2>${archive.type === 'moulage' ? '🔧' : '📦'} ${archive.name}</h2>
        <div class="archive-grid">
          <div class="archive-field"><span class="label">Client:</span><span class="value">${archive.client}</span></div>
          <div class="archive-field"><span class="label">N° Cmd:</span><span class="value">${archive.order}</span></div>
          <div class="archive-field"><span class="label">N° PO:</span><span class="value">${archive.numeroPO}</span></div>
          <div class="archive-field"><span class="label">Région:</span><span class="value">${archive.region}</span></div>
          <div class="archive-field"><span class="label">Intervenant:</span><span class="value">${archive.intervenant}</span></div>
          <div class="archive-field"><span class="label">Représentante:</span><span class="value">${archive.representant}</span></div>
          <div class="archive-field"><span class="label">Date reçue:</span><span class="value">${archive.dateRecue}</span></div>
          <div class="archive-field"><span class="label">Date livraison:</span><span class="value">${archive.dateLivraison}</span></div>
          <div class="archive-field"><span class="label">Date essayage:</span><span class="value">${archive.dateEssayage}</span></div>
        </div>
        <div class="dept-times"><strong>Temps par département:</strong> ${deptTimeStr}</div>
        ${archive.notes && archive.notes !== '-' ? `<div class="notes-box"><strong>Notes:</strong> ${archive.notes}</div>` : ''}
        <div class="footer">Supprimé le ${deletedDate} par ${archive.deletedBy} | Dernière colonne: ${archive.lastColumnName}</div>
      </div>
    `;
  });
  
  printHtml += `
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

// ===== SYSTÈME DE BACKUP AUTOMATIQUE (7 JOURS) =====
const MAX_BACKUPS = 7;
let backupsList = [];

// Charger la liste des backups
function loadBackupsList() {
  try {
    const stored = localStorage.getItem('physipro_backups_list');
    if (stored) {
      backupsList = JSON.parse(stored);
      console.log(`💾 ${backupsList.length} backup(s) trouvé(s)`);
    }
  } catch (e) {
    console.error('Erreur chargement liste backups:', e);
    backupsList = [];
  }
}

// Sauvegarder la liste des backups
function saveBackupsList() {
  try {
    localStorage.setItem('physipro_backups_list', JSON.stringify(backupsList));
  } catch (e) {
    console.error('Erreur sauvegarde liste backups:', e);
  }
}

// Créer un backup complet
function createBackup(userName) {
  const backupId = 'backup_' + Date.now();
  const now = new Date();
  
  const backup = {
    id: backupId,
    createdAt: now.toISOString(),
    createdBy: userName || 'Inconnu',
    dateFormatted: now.toLocaleDateString('fr-CA') + ' ' + now.toLocaleTimeString('fr-CA'),
    data: {
      cardsData: JSON.parse(JSON.stringify(cardsData || {})),
      commandesData: JSON.parse(JSON.stringify(typeof commandesData !== 'undefined' ? commandesData : {})),
      archivedCards: JSON.parse(JSON.stringify(archivedCards || [])),
      inventaireData: JSON.parse(JSON.stringify(typeof inventaireData !== 'undefined' ? inventaireData : {})),
      jobsData: JSON.parse(JSON.stringify(typeof jobsData !== 'undefined' ? jobsData : {}))
    },
    stats: {
      totalMoulages: Object.keys(cardsData || {}).length,
      totalCommandes: Object.keys(typeof commandesData !== 'undefined' ? commandesData : {}).length,
      totalArchives: (archivedCards || []).length,
      totalInventaire: Object.keys(typeof inventaireData !== 'undefined' ? inventaireData : {}).length,
      totalJobs: Object.keys(typeof jobsData !== 'undefined' ? jobsData : {}).length
    }
  };
  
  // Ajouter au début de la liste
  backupsList.unshift({
    id: backupId,
    createdAt: backup.createdAt,
    createdBy: backup.createdBy,
    dateFormatted: backup.dateFormatted,
    stats: backup.stats
  });
  
  // Garder seulement les 7 derniers
  if (backupsList.length > MAX_BACKUPS) {
    const oldBackups = backupsList.splice(MAX_BACKUPS);
    oldBackups.forEach(old => {
      localStorage.removeItem('physipro_backup_' + old.id);
      if (firebaseDb) {
        firebaseDb.ref('backups/' + old.id).remove();
      }
    });
    console.log(`🗑️ ${oldBackups.length} ancien(s) backup(s) supprimé(s)`);
  }
  
  // Sauvegarder dans localStorage
  try {
    localStorage.setItem('physipro_backup_' + backupId, JSON.stringify(backup));
    saveBackupsList();
    console.log(`💾 Backup local créé: ${backupId}`);
  } catch (e) {
    console.error('Erreur backup localStorage:', e);
  }
  
  // Sauvegarder dans Firebase
  if (firebaseDb) {
    firebaseDb.ref('backups/' + backupId).set(backup)
      .then(() => console.log(`☁️ Backup cloud créé: ${backupId}`))
      .catch(e => console.error('Erreur backup Firebase:', e));
  }
  
  return backup;
}

// Vérifier si un backup est nécessaire
function shouldCreateBackup() {
  if (backupsList.length === 0) return true;
  
  const lastBackup = new Date(backupsList[0].createdAt);
  const today = new Date();
  
  return lastBackup.toDateString() !== today.toDateString();
}

// Effectuer un backup automatique
function performAutoBackup(userName) {
  if (shouldCreateBackup()) {
    setTimeout(() => {
      const backup = createBackup(userName);
      showBackupNotification(backup);
    }, 3000);
  } else {
    console.log('📅 Backup déjà effectué aujourd\'hui');
  }
}

// Afficher notification de backup
function showBackupNotification(backup) {
  const notification = document.createElement('div');
  notification.className = 'backup-notification';
  notification.innerHTML = `
    <div class="backup-notif-content">
      <span class="backup-notif-icon">✅</span>
      <div class="backup-notif-text">
        <strong>Backup automatique effectué!</strong>
        <span>${backup.stats.totalMoulages} moulages, ${backup.stats.totalInventaire || 0} inventaire</span>
      </div>
      <button onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 5000);
}

// Afficher la liste des backups
function showBackupsPopup() {
  document.getElementById('backupsPopup')?.remove();
  
  const popup = document.createElement('div');
  popup.id = 'backupsPopup';
  popup.className = 'archives-popup-overlay';
  popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
  
  let backupsHtml = '';
  if (backupsList.length === 0) {
    backupsHtml = '<div class="archives-empty">Aucun backup disponible</div>';
  } else {
    backupsList.forEach((backup, index) => {
      backupsHtml += `
        <div class="backup-item">
          <div class="backup-info">
            <span class="backup-date">${backup.dateFormatted}</span>
            <span class="backup-by">Par: ${backup.createdBy}</span>
          </div>
          <div class="backup-stats">
            <span>🔧 ${backup.stats.totalMoulages} moulages</span>
            <span>📦 ${backup.stats.totalCommandes || 0} commandes</span>
            <span>📁 ${backup.stats.totalArchives} archives</span>
          </div>
          <button class="backup-restore-btn" onclick="confirmRestore('${backup.id}')">
            Restaurer
          </button>
        </div>
      `;
    });
  }
  
  popup.innerHTML = `
    <div class="archives-popup">
      <div class="archives-header">
        <h2>💾 Backups disponibles</h2>
        <span class="archives-count">${backupsList.length} / ${MAX_BACKUPS}</span>
        <button class="archives-close" onclick="document.getElementById('backupsPopup').remove()">✕</button>
      </div>
      <div class="archives-list">
        ${backupsHtml}
      </div>
      <div class="backup-manual-section">
        <button class="backup-manual-btn" onclick="manualBackup()">
          ➕ Créer un backup maintenant
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

// Backup manuel
function manualBackup() {
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Manuel';
  const backup = createBackup(userName);
  showBackupNotification(backup);
  document.getElementById('backupsPopup')?.remove();
  showBackupsPopup();
}

// Confirmer restauration
function confirmRestore(backupId) {
  if (confirm('⚠️ ATTENTION!\n\nRestaurer ce backup va remplacer TOUTES les données actuelles.\n\nÊtes-vous sûr de vouloir continuer?')) {
    restoreBackup(backupId);
  }
}

// Restaurer un backup
function restoreBackup(backupId) {
  try {
    const backupData = localStorage.getItem('physipro_backup_' + backupId);
    if (!backupData) {
      if (firebaseDb) {
        firebaseDb.ref('backups/' + backupId).once('value', (snapshot) => {
          const backup = snapshot.val();
          if (backup) {
            applyBackup(backup);
          } else {
            alert('Backup introuvable!');
          }
        });
      } else {
        alert('Backup introuvable!');
      }
      return;
    }
    
    const backup = JSON.parse(backupData);
    applyBackup(backup);
    
  } catch (e) {
    console.error('Erreur restauration:', e);
    alert('Erreur lors de la restauration: ' + e.message);
  }
}

// Appliquer les données d'un backup
function applyBackup(backup) {
  try {
    if (backup.data.cardsData) {
      cardsData = backup.data.cardsData;
      if (firebaseDb) {
        Object.entries(cardsData).forEach(([id, card]) => {
          firebaseDb.ref('cards/' + id).set(card);
        });
      }
    }
    
    if (backup.data.commandesData && typeof commandesData !== 'undefined') {
      commandesData = backup.data.commandesData;
      if (firebaseDb) {
        Object.entries(commandesData).forEach(([id, cmd]) => {
          firebaseDb.ref('commandes/' + id).set(cmd);
        });
      }
    }
    
    if (backup.data.archivedCards) {
      archivedCards = backup.data.archivedCards;
      saveArchivedCards();
    }
    
    if (backup.data.inventaireData && typeof inventaireData !== 'undefined') {
      inventaireData = backup.data.inventaireData;
      if (firebaseDb) {
        Object.entries(inventaireData).forEach(([id, item]) => {
          firebaseDb.ref('inventaire/' + id).set(item);
        });
      }
    }
    
    if (backup.data.jobsData && typeof jobsData !== 'undefined') {
      jobsData = backup.data.jobsData;
      if (firebaseDb) {
        Object.entries(jobsData).forEach(([id, job]) => {
          firebaseDb.ref('jobs/' + id).set(job);
        });
      }
    }
    
    alert(`✅ Backup restauré avec succès!\n\nDate du backup: ${backup.dateFormatted}\n\nLa page va se recharger.`);
    location.reload();
    
  } catch (e) {
    console.error('Erreur application backup:', e);
    alert('Erreur: ' + e.message);
  }
}

// Charger archives et backups au démarrage
loadArchivedCards();
loadBackupsList();

// Fermer avec clic sur overlay
document.getElementById('importExportOverlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'importExportOverlay') closeImportExportMenu();
});
document.getElementById('logOverlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'logOverlay') closeLogMenu();
});

// Exporter TOUTES les données
function exportAllData() {
  const exportData = {
    version: 'PhysiPro_v2.18',
    exportDate: new Date().toISOString(),
    exportedBy: currentUser?.email || 'Anonyme',
    moulages: cardsData,
    logs: logEntries
  };
  
  downloadJSON(exportData, `physipro_backup_${formatDateForFilename()}.json`);
  addLogEntry('Export', 'Export complet effectué');
  alert('✅ Export complet effectué!\n\nFichier téléchargé avec toutes les données.');
}

// Exporter seulement les moulages
function exportMoulagesOnly() {
  const exportData = {
    version: 'PhysiPro_v2.18',
    exportDate: new Date().toISOString(),
    exportType: 'moulages_only',
    moulages: cardsData
  };
  
  downloadJSON(exportData, `physipro_moulages_${formatDateForFilename()}.json`);
  addLogEntry('Export', 'Export moulages effectué');
  alert('✅ Export des moulages effectué!');
}

// Télécharger JSON
function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateForFilename() {
  const now = new Date();
  return now.toISOString().slice(0,10).replace(/-/g, '') + '_' + 
         now.toTimeString().slice(0,5).replace(':', '');
}

// Importer fichier
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (!importedData.version || !importedData.version.startsWith('PhysiPro')) {
        alert('❌ Fichier invalide!\n\nCe fichier ne semble pas être un export PhysiPro valide.');
        return;
      }
      
      const confirmMsg = `⚠️ ATTENTION!\n\nVous êtes sur le point d'importer des données du ${new Date(importedData.exportDate).toLocaleString('fr-CA')}.\n\nCette action ajoutera les données importées.\n\nÊtes-vous sûr de vouloir continuer?`;
      
      if (!confirm(confirmMsg)) return;
      
      let importCount = 0;
      
      if (importedData.moulages) {
        Object.keys(importedData.moulages).forEach(cardId => {
          cardsData[cardId] = importedData.moulages[cardId];
          saveCardToFirebase(cardId);
          importCount++;
        });
      }
      
      loadCardsFromFirebase();
      addLogEntry('Import', `${importCount} moulages importés`);
      alert(`✅ Importation réussie!\n\n• ${importCount} moulages importés\n\nL'affichage a été rafraîchi.`);
      closeImportExportMenu();
      
    } catch (error) {
      console.error('Erreur d\'importation:', error);
      alert('❌ Erreur lors de l\'importation!\n\n' + error.message);
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

// Log entries
function addLogEntry(action, details) {
  let userName = 'Anonyme';
  if (currentUser?.name) {
    userName = currentUser.name;
  } else if (currentUser?.email) {
    userName = currentUser.email.split('@')[0];
  }
  
  const entry = {
    time: new Date().toLocaleString('fr-CA'),
    user: userName,
    action,
    details
  };
  logEntries.unshift(entry);
  if (logEntries.length > 100) logEntries.pop();
}

// Connecter les boutons settings
document.getElementById('btnImportExport')?.addEventListener('click', openImportExportMenu);
document.getElementById('btnArchives')?.addEventListener('click', openLogMenu);

// Exposer fonctions globalement
window.openImportExportMenu = openImportExportMenu;
window.closeImportExportMenu = closeImportExportMenu;
window.openLogMenu = openLogMenu;
window.closeLogMenu = closeLogMenu;
window.exportAllData = exportAllData;
window.exportMoulagesOnly = exportMoulagesOnly;
window.handleImportFile = handleImportFile;
window.showLogMenu = showLogMenu;
window.showArchivesPopup = showArchivesPopup;
window.showArchiveSlider = showArchiveSlider;
window.renderArchiveSlider = renderArchiveSlider;
window.navigateArchive = navigateArchive;
window.printAllArchives = printAllArchives;
window.toggleArchiveDetails = toggleArchiveDetails;
window.showBackupsPopup = showBackupsPopup;
window.manualBackup = manualBackup;
window.confirmRestore = confirmRestore;
window.restoreBackup = restoreBackup;
window.performAutoBackup = performAutoBackup;
window.archiveCard = archiveCard;

// ===== INVENTAIRE =====
