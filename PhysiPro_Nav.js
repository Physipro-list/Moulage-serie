/*  ═══════════════════════════════════════════════════════════
    PhysiPro_Nav.js — Navigation centralisée
    ─────────────────────────────────────────────────────────
    Un seul fichier pour gérer le menu logo dans TOUTES les apps.

    USAGE dans chaque app HTML :
      1) Ajouter dans le <head> ou avant </body> :
           <script src="PhysiPro_Nav.js"></script>

      2) Après l'authentification Firebase, appeler :
           initPhysiProNav('calcmat', user.email);

         où le 1er argument est l'ID du module courant
         et le 2e est l'email de l'utilisateur connecté.

      3) S'assurer qu'il y a un élément cliquable avec
         id="logoFlipContainer" OU class="topbar-logo"
         (le script s'y attache automatiquement).

    MODIFIER LES ACCÈS OU MODULES :
      → Changer uniquement ce fichier. Toutes les apps
        récupèrent les changements automatiquement.
    ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ══════════════════════════════════════
  //  MODULES DISPONIBLES
  // ══════════════════════════════════════
  var NAV_MODULES = {
    moulage:     { icon: '🏭', label: 'Moulage',          sub: 'Gestion des moulages',      file: 'Physipro_moulage.html',                color: '#3b82f6' },
    serie:       { icon: '📋', label: 'Série+',            sub: 'Commandes de série',         file: 'PhysiPro_Serie_.html',                  color: '#f97316' },
    inspection:  { icon: '☑️', label: 'Insp. Atelier',     sub: 'Inspection Atelier',         file: 'PhysiPro_Inspection_Atelier.html',      color: '#22c55e' },
    inspcouture: { icon: '🧵', label: 'Prod. Couture',     sub: 'Production Couture',         file: 'PhysiPro_Production_Couture.html',      color: '#a855f7' },
    psm:         { icon: '🔧', label: 'PSM',               sub: 'Plan de santé matières',     file: 'PhysiPro_PSM.html',                     color: '#ef4444' },
    jobs:        { icon: '🎧', label: 'Service Client',    sub: 'Service Client',             file: 'PhysiPro_ServiceClient.html',           color: '#f59e0b' },
    calcmat:     { icon: '🧮', label: 'Liste Matériaux',    sub: 'Liste des matériaux',        file: 'PhysiPro_Liste_Materiaux.html',         color: '#14b8a6' },
    photos:      { icon: '📷', label: 'Photo Sender',      sub: 'Envoi de photos',            file: 'PhysiPro_PhotoSender.html',              color: '#06b6d4' },
    jobsattente: { icon: '⏳', label: 'Cmd en attente',   sub: 'Commandes en attente',       file: 'PhysiPro_Jobs_Attente.html',             color: '#f59e0b' },
    inspfinale:  { icon: '🔍', label: 'Insp. Finale',      sub: 'Inspection finale',          file: 'PhysiPro_Inspection_Finale.html',        color: '#6366f1' }
  };

  // Ordre d'affichage dans le modal
  var DISPLAY_ORDER = [
    'moulage', 'serie', 'inspection', 'inspcouture', 'inspfinale', 'psm', 'jobs',
    'jobsattente', 'calcmat'
  ];

  // Modules autorisés sur mobile
  var MOBILE_ALLOWED = ['moulage'];
  var MOBILE_ALLOWED_ADMIN = ['moulage'];

  // ══════════════════════════════════════
  //  ACCÈS PAR UTILISATEUR (emails en base64)
  // ══════════════════════════════════════
  var HUB_ACCESS = {
    'YXRlbGllcmF0cEBwaHlzaXByby5jb20=':             ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // atelieratp (Daniel)
    'dmFsZXJpZTE4QHZpZGVvdHJvbi5jYQ==':             ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // valerie18 (Valérie)
    'c2ltZHV0QHBoeXNpcHJvLmNvbQ==':                 ['moulage','serie','inspection','inspcouture','psm','jobs','calcmat','jobsattente'],                // simdut (Cassie)
    'bWljaGVsbGUuYm91Y2hhcmRAcGh5c2lwcm8uY29t':     ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // michelle.bouchard
    'c3JveUBwaHlzaXByby5jb20=':                     ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // sroy (Stéphanie)
    'c29uaWEuYm91bGFuZ2VyQHBoeXNpcHJvLmNvbQ==':     ['moulage','serie','inspfinale','psm','jobs','calcmat','jobsattente'],                             // sonia.boulanger
    'c2VydmljZTNAcGh5c2lwcm8uY29t':                 ['moulage','psm','jobs','calcmat','jobsattente'],                                                  // service3 (Jacynthe)
    'c2VydmljZTFAcGh5c2lwcm8uY29t':                 ['moulage','psm','jobs','calcmat','jobsattente'],                                                  // service1 (Jonathan)
    'bmdhZ25lQHBoeXNpcHJvLmNvbQ==':                 ['moulage','inspfinale','psm','jobs','calcmat','jobsattente'],                                     // ngagne (Nadia)
    'bXBsYW5ndWVkb2NAcGh5c2lwcm8uY29t':             ['moulage','jobs','calcmat','jobsattente'],                                                        // mplanguedoc (Marie-Pier)
    'bWFyaWVzb2xlaWxyQHBoeXNpcHJvLmNvbQ==':         ['moulage','jobs','calcmat','jobsattente'],                                                        // mariesoleilr (Marie-Soleil)
    'ZmFicnlzLmZyZWNoZXR0ZUBwaHlzaXByby5jb20=':     ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // fabrys.frechette
    'Y25jYXRwQHBoeXNpcHJvLmNvbQ==':                 ['moulage','inspfinale','jobs','calcmat','jobsattente'],                                            // cncatp (Sina)
    'cGV0ZXJiYXNzNzZAZ21haWwuY29t':                 ['moulage','jobs','calcmat','jobsattente'],                                                        // peterbass76 (Pierre)
    'bWFyaW8uamFjcXVlc0BwaHlzaXByby5jb20=':         ['moulage','jobs','calcmat','jobsattente'],                                                        // mario.jacques (Mario J.)
    'bWFyaW9vdWVsbGV0dGVAcGh5c2lwcm8uY29t':         ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // marioouellette (Mario O.)
    'bWFnYXNpbmF0cDJAcGh5c2lwcm8uY29t':             ['calcmat','jobsattente'],                                                                         // magasinatp2 (Sylvain)
    'bWFnYXNpbmF0cDNAcGh5c2lwcm8uY29t':             ['calcmat','jobsattente'],                                                                         // magasinatp3 (Stéphane Del.)
    'cmhAcGh5c2lwcm8uY29t':                         ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente'],  // rh (Roxanne)
    'Y29vcmRvLm1hZy5hdHBAcGh5c2lwcm8uY29t':         ['calcmat','jobsattente'],                                                                         // coordo.mag.atp (Patrick C.)
    'ZWx5c2UuYm9sZHVjQHBoeXNpcHJvLmNvbQ==':         ['calcmat','jobsattente'],                                                                         // elyse.bolduc (Élyse)
    'ZXJpYy5wb2lyaWVyQHBoeXNpcHJvLmNvbQ==':         ['calcmat','jobsattente'],                                                                         // eric.poirier (Éric)
    'Y29udGFjdEBwaHlzaXByby5mcg==':                 ['calcmat','jobsattente'],                                                                         // contact (France)
    'amVhbmNocmlzdG9waGVkYW5qb3VAcGh5c2lwcm8uY29t': ['moulage','serie','inspection','inspcouture','inspfinale','psm','jobs','calcmat','jobsattente']   // jeanchristophedanjou (Jean-Christophe)
  };

  // ══════════════════════════════════════
  //  CSS DU MODAL (injecté une seule fois)
  // ══════════════════════════════════════
  var NAV_CSS = '\
.ppnav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99990;display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:ppnavFadeIn .2s ease;}\
.ppnav-overlay.visible{display:flex;}\
.ppnav-modal{background:linear-gradient(160deg,#04152c 0%,#0f2847 50%,#1a3a5c 100%);border:2px solid rgba(74,142,245,0.3);border-radius:20px;padding:24px 20px 20px;max-width:520px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.7),0 0 60px rgba(59,130,246,0.08);animation:ppnavScaleIn .25s cubic-bezier(.34,1.56,.64,1);position:relative;}\
.ppnav-header{text-align:center;margin-bottom:16px;}\
.ppnav-title{font-size:16px;font-weight:700;color:#fff;letter-spacing:.3px;}\
.ppnav-subtitle{font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;}\
.ppnav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}\
.ppnav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 6px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);cursor:pointer;text-decoration:none;transition:all .2s;position:relative;}\
.ppnav-item:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.3);}\
.ppnav-item.current{border-color:rgba(74,142,245,0.4);background:rgba(74,142,245,0.1);}\
.ppnav-item.current::after{content:"actuel";position:absolute;top:4px;right:4px;font-size:7px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px;}\
.ppnav-icon{font-size:26px;line-height:1;}\
.ppnav-label{font-size:11px;font-weight:600;color:#fff;text-align:center;line-height:1.2;}\
.ppnav-close{position:absolute;top:10px;right:14px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:20px;cursor:pointer;padding:4px;transition:color .2s;}\
.ppnav-close:hover{color:#fff;}\
@keyframes ppnavFadeIn{from{opacity:0}to{opacity:1}}\
@keyframes ppnavScaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}\
@media(max-width:500px){.ppnav-grid{grid-template-columns:repeat(3,1fr);gap:8px;}.ppnav-modal{padding:18px 14px 14px;}}\
@media(max-width:360px){.ppnav-grid{grid-template-columns:repeat(2,1fr);}}\
';

  // ══════════════════════════════════════
  //  FONCTIONS INTERNES
  // ══════════════════════════════════════
  var _navInjected = false;
  var _overlayEl = null;

  function _injectNavDOM() {
    if (_navInjected) return;
    _navInjected = true;

    // CSS
    var style = document.createElement('style');
    style.textContent = NAV_CSS;
    document.head.appendChild(style);

    // HTML overlay
    var overlay = document.createElement('div');
    overlay.className = 'ppnav-overlay';
    overlay.id = 'ppnavOverlay';
    overlay.onclick = function (e) { if (e.target === overlay) _closeNav(); };
    overlay.innerHTML =
      '<div class="ppnav-modal">' +
        '<button class="ppnav-close" onclick="window._ppnavClose()">&times;</button>' +
        '<div class="ppnav-header">' +
          '<div class="ppnav-title">📍 Navigation PhysiPro</div>' +
          '<div class="ppnav-subtitle">Sélectionnez un module</div>' +
        '</div>' +
        '<div class="ppnav-grid" id="ppnavGrid"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    _overlayEl = overlay;

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _overlayEl && _overlayEl.classList.contains('visible')) {
        _closeNav();
        e.stopPropagation();
      }
    });
  }

  function _openNav() {
    if (_overlayEl) _overlayEl.classList.add('visible');
  }

  function _closeNav() {
    if (_overlayEl) _overlayEl.classList.remove('visible');
  }

  function _getAccess(email) {
    if (!email) return [];
    try { return HUB_ACCESS[btoa(email)] || []; }
    catch (e) { return []; }
  }

  function _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  // ══════════════════════════════════════
  //  API PUBLIQUE
  // ══════════════════════════════════════

  /**
   * initPhysiProNav(currentModuleId, userEmail)
   *
   *   currentModuleId : string — clé du module courant (ex: 'calcmat', 'moulage', 'serie')
   *   userEmail       : string — email de l'utilisateur connecté
   *
   * Appeler une seule fois après l'auth Firebase.
   */
  window.initPhysiProNav = function (currentMod, email) {
    _injectNavDOM();

    var grid = document.getElementById('ppnavGrid');
    if (!grid) return;

    var access = _getAccess(email);
    var mobile = _isMobile();
    var mobileList = (email && email.toLowerCase() === 'atelieratp@physipro.com') ? MOBILE_ALLOWED_ADMIN : MOBILE_ALLOWED;

    grid.innerHTML = '';

    DISPLAY_ORDER.forEach(function (mod) {
      if (access.indexOf(mod) === -1) return;
      if (mobile && mobileList.indexOf(mod) === -1) return;
      var m = NAV_MODULES[mod];
      if (!m) return;

      var a = document.createElement('a');
      a.className = 'ppnav-item' + (mod === currentMod ? ' current' : '');
      a.href = m.file;
      a.innerHTML =
        '<span class="ppnav-icon">' + m.icon + '</span>' +
        '<span class="ppnav-label" style="color:' + m.color + '">' + m.label + '</span>';
      grid.appendChild(a);
    });

    // Attacher le clic sur le logo
    var logo = document.getElementById('logoFlipContainer')
            || document.querySelector('.topbar-logo')
            || document.querySelector('[id*="logoFlip"] img');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        _openNav();
      };
    }
  };

  // Exposer open/close pour usage inline (onclick dans le HTML)
  window._ppnavOpen = _openNav;
  window._ppnavClose = _closeNav;

  // ══════════════════════════════════════
  //  RÉTRO-COMPATIBILITÉ
  // ══════════════════════════════════════
  //  Si une app appelle encore les anciennes fonctions,
  //  on les redirige silencieusement.
  window.initLogoMenu = function (currentMod) {
    // Trouver l'email depuis les variables globales des apps
    var email = '';
    if (typeof currentUser !== 'undefined' && currentUser) email = currentUser.email || currentUser;
    else if (typeof fbUser !== 'undefined' && fbUser) email = fbUser.email || fbUser;
    if (typeof email !== 'string') { try { email = email.email || ''; } catch (e) { email = ''; } }
    window.initPhysiProNav(currentMod, email);
  };
  window.openNavModal = _openNav;
  window.closeNavModal = _closeNav;

})();
