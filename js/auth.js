// ===== SYSTÈME DE CONNEXION SIMPLE =====

// Init Firebase - VERSION SIMPLE
function initFirebase() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.database();
    return true;
  } catch (e) {
    console.error("Erreur Firebase:", e);
    return false;
  }
}

// Fonction pour hasher le mot de passe avec SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Connexion - VERSION SIMPLE avec fallback
async function attemptLogin() {
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;
  
  console.log('🔐 Tentative de connexion pour:', email);
  
  if (!email) { loginError.textContent = "Veuillez entrer votre email"; return; }
  if (!password) { loginError.textContent = "Veuillez entrer votre mot de passe"; return; }
  
  const userInfo = USERS[email];
  if (!userInfo) { 
    console.log('❌ Email non trouvé dans USERS:', email);
    loginError.textContent = "Cet email n'est pas autorise"; 
    return; 
  }
  
  console.log('✅ Utilisateur trouvé:', userInfo.name, '- Role:', userInfo.role);
  
  loginBtn.textContent = "Connexion...";
  loginBtn.disabled = true;
  loginError.textContent = "";
  
  try {
    console.log('🔄 Tentative Firebase Auth...');
    await firebaseAuth.signInWithEmailAndPassword(email, password);
    console.log('✅ Firebase Auth réussi!');
    // Sauvegarder si checkbox cochee
    if (document.getElementById('rememberMe').checked) {
      localStorage.setItem('physipro_email', email);
      localStorage.setItem('physipro_password', password);
    } else {
      localStorage.removeItem('physipro_email');
      localStorage.removeItem('physipro_password');
    }
    loginSuccess(userInfo, email);
  } catch (error) {
    console.error('❌ Erreur Firebase Auth:', error.code, error.message);
    
    // Mode de contournement - si Firebase échoue mais l'email est autorisé
    // Vérifier le mot de passe avec le hash
    console.log('🔄 Vérification hash local...');
    const inputHash = await hashPassword(password);
    console.log('Hash calculé:', inputHash.substring(0, 20) + '...');
    console.log('Hash attendu:', userInfo.tempHash ? userInfo.tempHash.substring(0, 20) + '...' : 'AUCUN');
    
    if (inputHash === userInfo.tempHash) {
      console.log('✅ Hash correspond - Mode hors-ligne');
      if (document.getElementById('rememberMe').checked) {
        localStorage.setItem('physipro_email', email);
        localStorage.setItem('physipro_password', password);
      }
      loginSuccess(userInfo, email);
      showToast('⚠️ Mode hors-ligne - données locales uniquement');
    } else {
      console.log('❌ Hash ne correspond pas');
      loginError.textContent = "Email ou mot de passe incorrect";
    }
  }
  
  loginBtn.textContent = "Se connecter";
  loginBtn.disabled = false;
}

function loginSuccess(userInfo, email) {
  currentUser = { ...userInfo, email };
  loginOverlay.classList.add('hidden');
  
  console.log('═══════════════════════════════════════');
  console.log('✅ CONNEXION RÉUSSIE');
  console.log('👤 Utilisateur:', userInfo.name);
  console.log('📧 Email:', email);
  console.log('🔑 Rôle:', userInfo.role);
  console.log('📄 Pages autorisées:', userInfo.allowedPages);
  console.log('═══════════════════════════════════════');
  
  const statusDot = userStatusEl.querySelector('.status-dot');
  const userName = userStatusEl.querySelector('.user-name');
  if (statusDot) statusDot.classList.add('online');
  if (userName) userName.innerHTML = '<span class="user-name-text">' + userInfo.name + '</span><span class="user-role-badge ' + userInfo.role + '">' + 
    ({ admin: 'Admin', editor: 'Éditeur', viewer: 'Lecteur', operator: 'Opérateur' }[userInfo.role] || userInfo.role) + '</span>';
  
  console.log('🔄 Début chargement des données...');
  console.log('📊 Firebase DB disponible:', !!firebaseDb);
  
  loadCardsFromFirebase();
  loadCustomLists();
  initJobsPage();
  initInventaire();
  initCommandes();
  initCalculateur();
  showToast("Connexion réussie!");
  
  // Mettre à jour le menu de navigation
  if (typeof updateLogoMenu === 'function') {
    updateLogoMenu();
  }
  
  // Activer le mode "Fabriquer seulement" si l'utilisateur a cette permission
  if (userInfo.inventaireFabriquerOnly) {
    document.body.classList.add('fabriquer-only-mode');
    console.log('🔧 Mode Fabriquer seulement activé pour', userInfo.name);
  }
  
  if (typeof initMobileAfterLogin === 'function') {
    initMobileAfterLogin();
  }
  
  // Backup automatique quotidien (garde 7 jours)
  if (typeof performAutoBackup === 'function') {
    performAutoBackup(userInfo.name);
  }
  
  // Rediriger les opérateurs vers leur page autorisée
  if (userInfo.role === 'operator' && userInfo.allowedPages && userInfo.allowedPages.length > 0) {
    const firstAllowedPage = userInfo.allowedPages[0];
    const pageMapping = { 'Moulages': 'moulages', 'Série+': 'serie', 'Inventaire': 'inventaire', 'Jobs': 'jobs', 'Calculateur': 'calculateur' };
    const pageKey = pageMapping[firstAllowedPage];
    if (pageKey) {
      setTimeout(() => switchToPage(pageKey), 500);
    }
  }
}

// Charger email/password sauvegardés
function loadSavedCredentials() {
  const savedEmail = localStorage.getItem('physipro_email');
  const savedPassword = localStorage.getItem('physipro_password');
  if (savedEmail) {
    loginEmail.value = savedEmail;
    document.getElementById('rememberMe').checked = true;
  }
  if (savedPassword) {
    loginPassword.value = savedPassword;
  }
}

// Logout simple
async function logout() {
  try {
    await firebaseAuth.signOut();
  } catch(e) {}
  localStorage.removeItem('physipro_email');
  localStorage.removeItem('physipro_password');
  location.reload();
}

