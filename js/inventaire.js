let inventaireData = {};
let currentInvId = null;

// Initialiser l'inventaire
function initInventaire() {
  loadInventaireFromFirebase();
  renderInventaireCubes();
}

// Charger depuis Firebase
function loadInventaireFromFirebase() {
  if (!firebaseDb) {
    renderInventaireCubes();
    return;
  }
  firebaseDb.ref('inventaire').on('value', (snapshot) => {
    inventaireData = snapshot.val() || {};
    renderInventaireCubes();
  });
}

// Variable pour le drag and drop
let draggedInvId = null;

// Liste des employés inventaire
const INV_EMPLOYEES = ['pablo', 'checkna', 'saul', 'mathieu', 'nestor', 'serge'];

// Afficher les cubes dans les rangées horizontales
function renderInventaireCubes() {
  const rowMain = document.getElementById('invRowMain');
  
  if (!rowMain) return;
  
  // Si mode FabriquerOnly, filtrer pour ne montrer que la rangée de l'utilisateur
  const isFabriquerOnlyMode = currentUser?.inventaireFabriquerOnly;
  const userName = currentUser?.name?.toLowerCase() || '';
  
  // Générer le dropdown Tableau pour admin
  renderInvTableauDropdown();
  
  rowMain.innerHTML = '';
  
  // Compteurs par employé
  const counts = {};
  INV_EMPLOYEES.forEach(emp => counts[emp] = 0);
  
  // Vider tous les slots de chaque employé et remettre le hint dans slot 0
  INV_EMPLOYEES.forEach(emp => {
    const empCap = emp.charAt(0).toUpperCase() + emp.slice(1);
    const statusEl = document.getElementById('invStatus' + empCap);
    if (statusEl) statusEl.textContent = '';
    
    // En mode FabriquerOnly, cacher les rangées des autres employés
    const rowSmall = document.querySelector(`.inv-row-small:has([id*="invSlot${empCap}"])`);
    if (rowSmall && isFabriquerOnlyMode) {
      // Montrer seulement si c'est la rangée de l'utilisateur
      if (userName.includes(emp) || emp.includes(userName)) {
        rowSmall.style.display = '';
      } else {
        rowSmall.style.display = 'none';
      }
    }
    
    for (let i = 0; i <= 5; i++) {
      const slot = document.getElementById('invSlot' + empCap + i);
      if (slot) {
        slot.innerHTML = '';
        if (i === 0 && !isFabriquerOnlyMode) {
          slot.innerHTML = '<span class="inv-slot-hint">Glisser ici<br>= Production</span>';
        }
      }
    }
  });
  
  // Trier par position puis par nom
  const items = Object.entries(inventaireData).sort((a, b) => {
    const posA = a[1].position || 0;
    const posB = b[1].position || 0;
    if (posA !== posB) return posA - posB;
    return (a[1].nom || '').localeCompare(b[1].nom || '');
  });
  
  // Répartir les items dans les slots
  items.forEach(([id, item]) => {
    const rang = item.rang || 'main';
    
    let position = item.position || 0;
    if (position < 0) position = 0;
    if (position > 15) position = 15;
    
    // Vérifier si c'est un employé
    if (INV_EMPLOYEES.includes(rang)) {
      counts[rang]++;
      const empCap = rang.charAt(0).toUpperCase() + rang.slice(1);
      const slot = document.getElementById('invSlot' + empCap + position);
      const statusEl = document.getElementById('invStatus' + empCap);
      
      // Position 0 = bouton Fabriqué (vert, cliquable)
      // Positions 1-5+ = pastille En attente (gris)
      const isPosition0 = (position === 0);
      const isWaiting = (position > 0);
      const cube = createInvCube(id, item, isPosition0, isWaiting);
      
      if (slot) {
        // Supprimer le hint si présent
        const hint = slot.querySelector('.inv-slot-hint');
        if (hint) hint.remove();
        slot.appendChild(cube);
        // Position 0 = en production
        if (position === 0 && statusEl) {
          statusEl.textContent = '🔧 En production';
        }
      }
    } else {
      // À faire (main) - pastille bleue
      const cube = createInvCube(id, item, false, false);
      rowMain.appendChild(cube);
    }
  });
  
  // Afficher status "Libre" pour les employés sans jobs
  INV_EMPLOYEES.forEach(emp => {
    if (counts[emp] === 0) {
      const empCap = emp.charAt(0).toUpperCase() + emp.slice(1);
      const statusEl = document.getElementById('invStatus' + empCap);
      if (statusEl) statusEl.textContent = '✅ Libre';
    }
  });
  
  // Ajouter bouton + dans la zone À faire
  const addBtnMain = document.createElement('div');
  addBtnMain.className = 'inv-add-cube';
  addBtnMain.innerHTML = '+';
  addBtnMain.onclick = () => openInvFiche(null, 'main');
  rowMain.appendChild(addBtnMain);
  
  // Setup drag and drop zones
  setupInvDragDropZones();
  
  // Mettre à jour la version mobile
  renderInventaireMobile();
}

// Générer le dropdown Tableau pour admin
function renderInvTableauDropdown() {
  // Le bouton sera ajouté dans la topbar via updateTopbarForPage
  // Cette fonction ne fait plus rien ici
}

// Générer le HTML du dropdown Tableau pour la topbar
function getInvTableauDropdownHTML() {
  // Seulement pour admin
  if (!currentUser || currentUser.role !== 'admin') {
    return '';
  }
  
  // Simple bouton pour aller à Série+
  return `
    <button class="inv-serie-btn" onclick="goToSeriePlus()">
      📦 Série+
    </button>
  `;
}

// Aller directement à la page Série+
function goToSeriePlus() {
  switchToPage('serie');
}

// Toggle le menu dropdown (gardé pour compatibilité)
function toggleInvTableauMenu() {
  // Plus utilisé, mais gardé pour éviter erreurs
}

// Fermer le menu quand on clique ailleurs (gardé pour compatibilité)
document.addEventListener('click', function(e) {
  const dropdown = e.target.closest('.inv-tableau-dropdown');
  if (!dropdown) {
    const menu = document.getElementById('invTableauMenu');
    if (menu) menu.classList.remove('open');
  }
});

// Ouvrir le tableau d'une commande depuis Inventaire (gardé pour compatibilité)
function openCmdTableauFromInv(cmdId) {
  // Aller à Série+
  switchToPage('serie');
  
  // Attendre que la page se charge puis sélectionner la commande et aller au Tableau
  setTimeout(() => {
    if (typeof selectSerieCommande === 'function') {
      selectSerieCommande(cmdId);
      // Aller directement sur l'onglet Tableau
      setTimeout(() => {
        if (typeof switchSerieTab === 'function') {
          switchSerieTab('tableau');
        }
      }, 100);
    }
  }, 150);
}

// Exposer les fonctions
window.toggleInvTableauMenu = toggleInvTableauMenu;
window.openCmdTableauFromInv = openCmdTableauFromInv;
window.getInvTableauDropdownHTML = getInvTableauDropdownHTML;
window.goToSeriePlus = goToSeriePlus;

// Rendu de la zone d'inspection
// Créer un cube avec drag and drop
function createInvCube(id, item, showCompleteBtn = false, isWaiting = false) {
  const cube = document.createElement('div');
  cube.className = 'inv-cube';
  
  // Ajouter la classe client pour la couleur
  if (item.client) {
    cube.classList.add('client-' + item.client);
  }
  
  cube.draggable = true;
  cube.dataset.id = id;
  
  // Infos client
  const clientNames = { vermeiren: 'Vermeiren', hme: 'HME', c1south: 'C1South', cubro: 'Cubro', france: 'France' };
  const clientName = item.client ? (clientNames[item.client] || item.client) : '';
  
  // Construire le HTML
  const orderText = item.commande ? '#' + item.commande : '';
  const nomText = item.nom || 'Sans nom';
  const grandeurText = item.grandeur || '-';
  const qtyText = item.quantite ? item.quantite : '0';
  const codeText = item.code || '';
  
  // Bouton/Pastille en bas de la carte selon la position
  // showCompleteBtn = true → Bouton "✓ Fabriqué" (vert, cliquable) - slot 0
  // isWaiting = true → Pastille "En attente" (gris) - slots 1-10
  // Sinon → Pastille "À faire" (bleu) - zone À faire en haut
  let bottomHtml;
  if (showCompleteBtn) {
    bottomHtml = `<button class="inv-cube-complete" onclick="event.stopPropagation(); completeInvItem('${id}', '${item.rang}')">✓ Fabriqué</button>`;
  } else if (isWaiting) {
    bottomHtml = `<div class="inv-cube-waiting">En attente</div>`;
  } else {
    bottomHtml = `<div class="inv-cube-todo">À faire</div>`;
  }
  
  const codeHtml = codeText ? `<div class="inv-cube-code">${codeText}</div>` : '';
  
  // Structure de la carte - Code entre grandeur et quantité
  cube.innerHTML = `
    <div class="inv-cube-header">
      <span class="inv-cube-order">${orderText}</span>
      <span class="inv-cube-client-badge">${clientName}</span>
    </div>
    <div class="inv-cube-body">
      <div class="inv-cube-name">${nomText}</div>
      <div class="inv-cube-info-row">
        <span class="inv-cube-grandeur">${grandeurText}</span>
        ${codeText ? `<span class="inv-cube-code-inline">${codeText}</span>` : ''}
        <div class="inv-cube-qty-container">
          <span class="inv-cube-qty-label">Qté</span>
          <span class="inv-cube-qty">${qtyText}</span>
        </div>
      </div>
    </div>
    ${bottomHtml}
  `;
  
  // Click pour ouvrir fiche - SAUF si inventaireFabriquerOnly
  cube.onclick = (e) => {
    // Si l'utilisateur a seulement accès au bouton Fabriquer, bloquer l'ouverture de la fiche
    if (currentUser?.inventaireFabriquerOnly) {
      e.stopPropagation();
      return; // Ne pas ouvrir la fiche
    }
    if (!cube.classList.contains('dragging')) {
      openInvFiche(id);
    }
  };
  
  // Drag events - désactivés pour inventaireFabriquerOnly
  if (!currentUser?.inventaireFabriquerOnly) {
    cube.draggable = true;
    cube.addEventListener('dragstart', (e) => {
      draggedInvId = id;
      cube.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    cube.addEventListener('dragend', () => {
      cube.classList.remove('dragging');
      draggedInvId = null;
      // Retirer tous les highlights
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
  } else {
    cube.draggable = false;
    cube.style.cursor = 'default'; // Pas de curseur pointer
  }
  
  return cube;
}

// Setup des zones de drop (appelé une fois au chargement)
let invDragDropInitialized = false;

function setupInvDragDropZones() {
  if (invDragDropInitialized) return;
  invDragDropInitialized = true;
  
  // Zone À faire
  const rowMain = document.getElementById('invRowMain');
  if (rowMain) {
    rowMain.addEventListener('dragover', (e) => {
      e.preventDefault();
      rowMain.classList.add('drag-over');
    });
    rowMain.addEventListener('dragleave', (e) => {
      // Vérifier qu'on quitte vraiment la zone
      if (!rowMain.contains(e.relatedTarget)) {
        rowMain.classList.remove('drag-over');
      }
    });
    rowMain.addEventListener('drop', (e) => {
      e.preventDefault();
      rowMain.classList.remove('drag-over');
      if (draggedInvId) {
        moveInvItem(draggedInvId, 'main', 0);
      }
    });
  }
  
  // Slots Pablo et Checkna (tous les slots incluant position 0)
  document.querySelectorAll('.inv-col-slot').forEach(slot => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (draggedInvId) {
        const rang = slot.dataset.rang;
        const pos = parseInt(slot.dataset.pos);
        moveInvItem(draggedInvId, rang, pos);
      }
    });
  });
}

// Déplacer un item
function moveInvItem(id, newRang, newPosition) {
  if (!inventaireData[id]) return;
  
  inventaireData[id].rang = newRang;
  inventaireData[id].position = newPosition;
  inventaireData[id].updatedAt = new Date().toISOString();
  
  // Sauvegarder
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + id).set(inventaireData[id])
      .then(() => {
        console.log('✅ Position inventaire sauvegardée:', id);
      })
      .catch((error) => {
        console.error('❌ Erreur déplacement inventaire:', error);
        showToast('❌ Erreur: ' + error.message);
      });
  }
  
  renderInventaireCubes();
  showToast('Déplacé vers ' + (newRang === 'main' ? 'À faire' : newRang + ' pos ' + newPosition));
}

// Toggle zone
function toggleInvZone(zoneId) {
  const content = document.getElementById(zoneId);
  if (content) {
    content.style.display = content.style.display === 'none' ? '' : 'none';
  }
}

// Ouvrir fiche
function openInvFiche(id = null, defaultRang = 'main') {
  currentInvId = id;
  const overlay = document.getElementById('invFicheOverlay');
  const title = document.getElementById('invFicheTitle');
  const btnDelete = document.getElementById('invBtnDelete');
  const completeRow = document.getElementById('invCompleteRow');
  
  if (id && inventaireData[id]) {
    const item = inventaireData[id];
    title.textContent = 'Modifier - ' + (item.nom || item.code || 'Article');
    document.getElementById('invCommande').value = item.commande || '';
    document.getElementById('invClient').value = item.client || '';
    document.getElementById('invNom').value = item.nom || '';
    document.getElementById('invCode').value = item.code || '';
    document.getElementById('invGrandeur').value = item.grandeur || '';
    document.getElementById('invQuantite').value = item.quantite || '';
    document.getElementById('invRang').value = item.rang || 'main';
    document.getElementById('invPosition').value = item.position || 0;
    // Afficher/masquer position selon rang
    updateInvPositionVisibility();
    btnDelete.style.display = '';
    
    // Afficher bouton Compléter si Pablo ou Checkna
    const rang = item.rang || 'main';
    if (rang === 'pablo' || rang === 'checkna') {
      completeRow.style.display = '';
    } else {
      completeRow.style.display = 'none';
    }
  } else {
    title.textContent = 'Nouvel article';
    document.getElementById('invCommande').value = '';
    document.getElementById('invClient').value = '';
    document.getElementById('invNom').value = '';
    document.getElementById('invCode').value = '';
    document.getElementById('invGrandeur').value = '';
    document.getElementById('invQuantite').value = '';
    document.getElementById('invRang').value = defaultRang;
    document.getElementById('invPosition').value = 1;
    updateInvPositionVisibility();
    btnDelete.style.display = 'none';
    completeRow.style.display = 'none';
  }
  
  overlay.classList.remove('hidden');
}

// Afficher/masquer le champ position selon le rang
function updateInvPositionVisibility() {
  const rang = document.getElementById('invRang').value;
  const positionField = document.getElementById('invPositionField');
  if (positionField) {
    // Afficher position pour tous les employés (pas pour 'main')
    positionField.style.display = (rang !== 'main') ? '' : 'none';
  }
}

// Fermer fiche
function closeInvFiche() {
  // Sauvegarder automatiquement si on a un item en cours
  if (currentInvId && inventaireData[currentInvId]) {
    const item = inventaireData[currentInvId];
    
    // Récupérer les valeurs des champs
    const nomEl = document.getElementById('invNom');
    const codeEl = document.getElementById('invCode');
    const commandeEl = document.getElementById('invCommande');
    const clientEl = document.getElementById('invClient');
    const grandeurEl = document.getElementById('invGrandeur');
    const quantiteEl = document.getElementById('invQuantite');
    
    if (nomEl) item.nom = nomEl.value.trim();
    if (codeEl) item.code = codeEl.value.trim();
    if (commandeEl) item.commande = commandeEl.value.trim().replace(/\D/g, ''); // Chiffres seulement
    if (clientEl) item.client = clientEl.value;
    if (grandeurEl) item.grandeur = grandeurEl.value.trim();
    if (quantiteEl) item.quantite = quantiteEl.value.trim() ? parseInt(quantiteEl.value) : null;
    item.updatedAt = new Date().toISOString();
    
    // Sauvegarder dans Firebase
    if (firebaseDb) {
      firebaseDb.ref('inventaire/' + currentInvId).set(item)
        .then(() => {
          console.log('✅ Inventaire auto-sauvegardé:', currentInvId);
        })
        .catch((error) => {
          console.error('❌ Erreur auto-sauvegarde:', error);
        });
    }
    
    renderInventaireCubes();
  }
  
  document.getElementById('invFicheOverlay').classList.add('hidden');
  currentInvId = null;
}

// Sauvegarder
function saveInvItem() {
  const rang = document.getElementById('invRang').value;
  const positionVal = document.getElementById('invPosition').value;
  const quantiteVal = document.getElementById('invQuantite').value.trim();
  
  const item = {
    nom: document.getElementById('invNom').value.trim(),
    code: document.getElementById('invCode').value.trim(),
    commande: document.getElementById('invCommande').value.trim(),
    client: document.getElementById('invClient').value,
    grandeur: document.getElementById('invGrandeur').value.trim(),
    quantite: quantiteVal ? parseInt(quantiteVal) : null,
    rang: rang,
    position: (rang === 'pablo' || rang === 'checkna') ? parseInt(positionVal) : 0,
    updatedAt: new Date().toISOString()
  };
  
  if (!item.nom && !item.code) {
    alert('Veuillez entrer un nom ou un numéro de produit');
    return;
  }
  
  const id = currentInvId || 'inv_' + Date.now();
  
  if (!currentInvId) {
    item.createdAt = new Date().toISOString();
  }
  
  inventaireData[id] = item;
  
  // Sauvegarder dans Firebase
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + id).set(item)
      .then(() => {
        console.log('✅ Inventaire sauvegardé:', id);
        showToast('✅ Article enregistré');
      })
      .catch((error) => {
        console.error('❌ Erreur sauvegarde inventaire:', error);
        showToast('❌ Erreur: ' + error.message);
      });
  } else {
    console.warn('⚠️ Firebase non disponible, sauvegarde locale seulement');
    showToast('⚠️ Sauvegardé localement (Firebase non connecté)');
  }
  
  renderInventaireCubes();
  closeInvFiche();
}

// Supprimer
function deleteInvItem() {
  if (!currentInvId) return;
  if (!confirm('Supprimer cet article?')) return;
  
  delete inventaireData[currentInvId];
  
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + currentInvId).remove();
  }
  
  renderInventaireCubes();
  closeInvFiche();
  showToast('Article supprimé');
}

// Compléter un item - ENVOYER VERS INSPECTION
// Compléter un item - Met à jour Série+ et supprime
function completeInvItem(itemId, rang) {
  if (!inventaireData[itemId]) return;
  
  const item = inventaireData[itemId];
  const currentPosition = item.position || 0;
  
  // Nom de l'employé qui complète (capitaliser)
  const empNames = {
    pablo: 'Pablo',
    checkna: 'Checkna',
    saul: 'Saul',
    mathieu: 'Mathieu',
    nestor: 'Nestor',
    serge: 'Serge'
  };
  const completedByName = empNames[rang] || rang;
  
  // ===== LIEN AVEC SÉRIE+ =====
  // Si l'item a une commande et un client, mettre à jour l'Atelier dans Série+
  if (item.commande && item.client && item.nom && item.grandeur) {
    const linked = updateSeriesPlusAtelier(item, completedByName);
    if (linked) {
      showToast(`✅ Fabriqué par ${completedByName}!`);
    } else {
      showToast('✅ Fabriqué!');
    }
  } else {
    showToast('✅ Fabriqué!');
  }
  
  // Supprimer l'item complété
  delete inventaireData[itemId];
  
  if (firebaseDb) {
    firebaseDb.ref('inventaire/' + itemId).remove()
      .then(() => console.log('✅ Item complété supprimé:', itemId))
      .catch(e => console.error('Erreur:', e));
  }
  
  // Trouver tous les items du même rang et les décaler
  const itemsToShift = Object.entries(inventaireData)
    .filter(([id, data]) => data.rang === rang && (data.position || 0) > currentPosition)
    .sort((a, b) => (a[1].position || 0) - (b[1].position || 0));
  
  // Décaler chaque item d'une position
  itemsToShift.forEach(([id, data]) => {
    const oldPos = data.position || 0;
    const newPos = oldPos - 1;
    
    inventaireData[id].position = newPos;
    
    if (firebaseDb) {
      firebaseDb.ref('inventaire/' + id + '/position').set(newPos);
    }
  });
  
  // Rafraîchir l'affichage
  renderInventaireCubes();
}

// Mettre à jour l'Atelier dans Série+ quand on complète un item inventaire
function updateSeriesPlusAtelier(invItem, completedByName) {
  if (typeof commandesData === 'undefined') return false;
  
  const orderNum = invItem.commande;
  const clientKey = invItem.client; // vermeiren, hme, c1south, cubro, france
  const itemName = invItem.nom.toLowerCase().trim();
  const grandeurName = invItem.grandeur.trim();
  const qtyToComplete = invItem.quantite || 1;
  
  // Chercher la carte Série+ correspondante
  let foundCmdId = null;
  let foundItemIdx = null;
  let foundGrandeurIdx = null;
  
  for (const [cmdId, cmd] of Object.entries(commandesData)) {
    // Vérifier que la commande correspond
    if (cmd.order !== orderNum) continue;
    // Comparaison insensible à la casse pour le client
    if ((cmd.client || '').toLowerCase() !== clientKey.toLowerCase()) continue;
    
    // Chercher l'item correspondant
    const items = cmd.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const cmdItemName = (item.name || '').toLowerCase().trim();
      
      // Match du nom de l'item (partiel accepté)
      if (cmdItemName.includes(itemName) || itemName.includes(cmdItemName)) {
        // Chercher la grandeur correspondante
        const grandeurs = item.grandeurs || [];
        for (let g = 0; g < grandeurs.length; g++) {
          const grandeur = grandeurs[g];
          if (grandeur.name === grandeurName) {
            foundCmdId = cmdId;
            foundItemIdx = i;
            foundGrandeurIdx = g;
            break;
          }
        }
      }
      if (foundCmdId) break;
    }
    if (foundCmdId) break;
  }
  
  if (!foundCmdId) {
    console.log('⚠️ Pas de carte Série+ trouvée pour:', orderNum, clientKey, itemName, grandeurName);
    return false;
  }
  
  // Mettre à jour l'Atelier
  const grandeur = commandesData[foundCmdId].items[foundItemIdx].grandeurs[foundGrandeurIdx];
  if (!grandeur.atelier) {
    grandeur.atelier = { status: 'todo', note: '', qtyFait: 0 };
  }
  
  // Ajouter la quantité complétée
  grandeur.atelier.qtyFait = (grandeur.atelier.qtyFait || 0) + qtyToComplete;
  
  // Stocker le nom de la personne qui a complété
  if (completedByName) {
    grandeur.atelier.completedBy = completedByName;
  }
  
  // Si la quantité faite >= quantité totale, marquer comme "done"
  if (grandeur.atelier.qtyFait >= (grandeur.qty || 0)) {
    grandeur.atelier.status = 'done';
    grandeur.atelier.qtyFait = grandeur.qty; // Pas dépasser
  } else if (grandeur.atelier.qtyFait > 0) {
    grandeur.atelier.status = 'partial';
  }
  
  // Sauvegarder dans Firebase
  if (firebaseDb) {
    firebaseDb.ref('commandes/' + foundCmdId).set(commandesData[foundCmdId])
      .then(() => console.log('✅ Série+ Atelier mis à jour:', foundCmdId))
      .catch(e => console.error('Erreur Série+:', e));
  }
  
  // Rafraîchir l'affichage Série+ si visible
  if (typeof refreshCmdDeptTables === 'function') {
    refreshCmdDeptTables(foundCmdId);
  }
  
  console.log(`✅ Lien Série+: Commande ${orderNum}, Item ${itemName}, Grandeur ${grandeurName} → +${qtyToComplete} dans Atelier par ${completedByName || 'inconnu'}`);
  return true;
}

// Compléter depuis le modal
function completeCurrentInvItem() {
  if (!currentInvId) return;
  
  const item = inventaireData[currentInvId];
  if (!item) return;
  
  const rang = item.rang;
  closeInvFiche();
  completeInvItem(currentInvId, rang);
}

// Auto-save avec délai
let autoSaveInvTimeout = null;
function autoSaveInvItem() {
  // Annuler le timeout précédent
  if (autoSaveInvTimeout) {
    clearTimeout(autoSaveInvTimeout);
  }
  
  // Sauvegarder après 300ms d'inactivité (réduit)
  autoSaveInvTimeout = setTimeout(() => {
    const rangEl = document.getElementById('invRang');
    const positionEl = document.getElementById('invPosition');
    const quantiteEl = document.getElementById('invQuantite');
    const nomEl = document.getElementById('invNom');
    const codeEl = document.getElementById('invCode');
    const commandeEl = document.getElementById('invCommande');
    const clientEl = document.getElementById('invClient');
    const grandeurEl = document.getElementById('invGrandeur');
    
    if (!rangEl || !nomEl) {
      console.warn('⚠️ Éléments de formulaire non trouvés');
      return;
    }
    
    const rang = rangEl.value || 'main';
    const positionVal = positionEl?.value || '0';
    const quantiteVal = quantiteEl?.value?.trim() || '';
    const nomVal = nomEl.value?.trim() || '';
    const codeVal = codeEl?.value?.trim() || '';
    const commandeVal = commandeEl?.value?.trim()?.replace(/\D/g, '') || '';
    const clientVal = clientEl?.value || '';
    const grandeurVal = grandeurEl?.value?.trim() || '';
    
    // Ne pas sauvegarder si complètement vide
    if (!nomVal && !codeVal && !commandeVal && !grandeurVal) {
      console.log('⏭️ Pas de données à sauvegarder');
      return;
    }
    
    const item = {
      nom: nomVal,
      code: codeVal,
      commande: commandeVal,
      client: clientVal,
      grandeur: grandeurVal,
      quantite: quantiteVal ? parseInt(quantiteVal) : 0,
      rang: rang,
      position: (rang === 'pablo' || rang === 'checkna') ? parseInt(positionVal) : 0,
      updatedAt: new Date().toISOString()
    };
    
    // Générer ou utiliser l'ID existant
    let id = currentInvId;
    if (!id) {
      id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      currentInvId = id;
      item.createdAt = new Date().toISOString();
    }
    
    // Mettre à jour les données locales
    inventaireData[id] = item;
    
    // Sauvegarder dans Firebase
    if (firebaseDb) {
      firebaseDb.ref('inventaire/' + id).set(item)
        .then(() => {
          console.log('✅ Auto-save inventaire:', id, item.nom || item.code);
          // Mettre à jour le titre
          const title = document.getElementById('invFicheTitle');
          if (title) title.textContent = 'Modifier - ' + (item.nom || item.code || 'Article');
          // Afficher le bouton supprimer
          const btnDelete = document.getElementById('invBtnDelete');
          if (btnDelete) btnDelete.style.display = '';
          // Afficher bouton compléter si nécessaire
          const completeRow = document.getElementById('invCompleteRow');
          if (completeRow) {
            completeRow.style.display = (rang === 'pablo' || rang === 'checkna') ? '' : 'none';
          }
        })
        .catch((error) => {
          console.error('❌ Erreur auto-save Firebase:', error);
          showToast('❌ Erreur: ' + error.message);
        });
    } else {
      console.warn('⚠️ Firebase non connecté - sauvegarde locale');
    }
    
    renderInventaireCubes();
  }, 300);
}

// Rendre la version mobile de l'inventaire
function renderInventaireMobile() {
  const containerPablo = document.getElementById('invMobilePablo');
  const containerCheckna = document.getElementById('invMobileCheckna');
  
  if (!containerPablo || !containerCheckna) return;
  
  // Générer HTML pour Pablo
  containerPablo.innerHTML = generateMobileSection('pablo');
  
  // Générer HTML pour Checkna
  containerCheckna.innerHTML = generateMobileSection('checkna');
}

function generateMobileSection(rang) {
  // Trouver les items de ce rang triés par position
  const items = Object.entries(inventaireData)
    .filter(([id, item]) => item.rang === rang)
    .sort((a, b) => (a[1].position || 0) - (b[1].position || 0));
  
  // Si aucun item
  if (items.length === 0) {
    return `
      <div class="inv-mobile-empty">
        <div class="inv-mobile-empty-icon">✅</div>
        Retournez voir<br>votre chef d'équipe
      </div>
    `;
  }
  
  // Trouver l'item en position 0 (en production)
  const currentItem = items.find(([id, item]) => (item.position || 0) === 0);
  // Trouver les items suivants (positions 1, 2, 3...)
  const nextItems = items.filter(([id, item]) => (item.position || 0) > 0).slice(0, 3); // Max 3 prochains
  
  let html = '';
  
  // === Section "Prochain" en haut ===
  if (nextItems.length > 0) {
    html += '<div class="inv-mobile-next-section">';
    html += '<div class="inv-mobile-next-header"><span class="inv-mobile-next-arrow">↓</span> PROCHAIN</div>';
    
    // Afficher chaque prochain item (en ordre inverse pour que le plus proche soit en bas)
    nextItems.reverse().forEach(([id, item]) => {
      const qtyHtml = item.quantite ? `<span class="inv-mobile-card-qty">Qté: ${item.quantite}</span>` : '';
      const pos = item.position || 0;
      html += `
        <div class="inv-mobile-next-card" onclick="openInvFiche('${id}')">
          <div class="inv-mobile-next-card-pos">#${pos}</div>
          <div class="inv-mobile-next-card-info">
            <div class="inv-mobile-next-card-name">${item.nom || 'Sans nom'}</div>
            <div class="inv-mobile-next-card-code">${qtyHtml}${item.code || '---'}</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  // === Section "À faire maintenant" au centre ===
  if (currentItem) {
    const [id, item] = currentItem;
    const qtyHtml = item.quantite ? `<div class="inv-mobile-current-qty">Qté: ${item.quantite}</div>` : '';
    
    html += `
      <div class="inv-mobile-current-header">🔧 À FAIRE MAINTENANT</div>
      <div class="inv-mobile-current-card" onclick="openInvFiche('${id}')">
        ${qtyHtml}
        <div class="inv-mobile-current-name">${item.nom || 'Sans nom'}</div>
        <div class="inv-mobile-current-code">${item.code || '---'}</div>
        <div class="inv-mobile-current-tap">Toucher pour voir les détails</div>
      </div>
      <button class="inv-mobile-complete-btn" onclick="event.stopPropagation(); completeInvItem('${id}', '${rang}')">🔧 FABRIQUÉ</button>
    `;
  } else if (items.length > 0) {
    // Pas de position 0, prendre le premier disponible
    const [id, item] = items[0];
    const qtyHtml = item.quantite ? `<div class="inv-mobile-current-qty">Qté: ${item.quantite}</div>` : '';
    
    html += `
      <div class="inv-mobile-current-header">🔧 À FAIRE MAINTENANT</div>
      <div class="inv-mobile-current-card" onclick="openInvFiche('${id}')">
        ${qtyHtml}
        <div class="inv-mobile-current-name">${item.nom || 'Sans nom'}</div>
        <div class="inv-mobile-current-code">${item.code || '---'}</div>
        <div class="inv-mobile-current-tap">Toucher pour voir les détails</div>
      </div>
      <button class="inv-mobile-complete-btn" onclick="event.stopPropagation(); completeInvItem('${id}', '${rang}')">🔧 FABRIQUÉ</button>
    `;
  }
  
  return html;
}

// Exposer fonctions inventaire
window.openInvFiche = openInvFiche;
window.renderInventaireCubes = renderInventaireCubes;
window.updateInvPositionVisibility = updateInvPositionVisibility;
window.moveInvItem = moveInvItem;
window.closeInvFiche = closeInvFiche;
window.saveInvItem = saveInvItem;
window.deleteInvItem = deleteInvItem;
window.completeInvItem = completeInvItem;
window.completeCurrentInvItem = completeCurrentInvItem;
window.updateSeriesPlusAtelier = updateSeriesPlusAtelier;
window.autoSaveInvItem = autoSaveInvItem;
window.renderInventaireMobile = renderInventaireMobile;
window.toggleInvZone = toggleInvZone;
window.initInventaire = initInventaire;

