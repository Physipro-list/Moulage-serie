/*  ═══════════════════════════════════════════════════════════
    PhysiPro_Nav.js — Navigation centralisée
    ─────────────────────────────────────────────────────────
    Un seul fichier pour gérer le menu logo dans TOUTES les apps.

    USAGE dans chaque app HTML :
      1) Ajouter dans le <head> ou avant </body> :
           <script src="PhysiPro_Nav.js"></script>

      2) Après l'authentification Firebase, appeler :
           initPhysiProNav('moulage', user.email);

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
    serviceClient:        { icon: '🎧', label: 'Service Client',    sub: 'Service Client',             file: 'PhysiPro_ServiceClient.html',           color: '#f59e0b' },
    photos:      { icon: '📷', label: 'Photo Sender',      sub: 'Envoi de photos',            file: 'PhysiPro_PhotoSender.html',              color: '#06b6d4' },
    inspfinale:  { icon: '🔍', label: 'Insp. Finale',      sub: 'Inspection finale',          file: 'PhysiPro_Inspection_Finale.html',        color: '#6366f1' }
  };

  // Ordre d'affichage dans le modal
  var DISPLAY_ORDER = [
    'moulage', 'serviceClient', 'inspection', 'inspcouture', 'inspfinale'
  ];

  // Modules autorisés sur mobile
  var MOBILE_ALLOWED = ['moulage', 'serviceClient'];
  var MOBILE_ALLOWED_ADMIN = ['moulage', 'serviceClient'];

  // Emails qui voient TOUS leurs modules sur mobile (pas limités à MOBILE_ALLOWED)
  // Daniel, Valérie, Michelle Bouchard, Stéphanie, Sylvain, Stéphane Delorme, Pierre
  var MOBILE_FULL_ACCESS = [
    'atelieratp@physipro.com',
    'valerie18@videotron.ca',
    'michelle.bouchard@physipro.com',
    'sroy@physipro.com',
    'magasinatp2@physipro.com',
    'magasinatp3@physipro.com',
    'peterbass76@gmail.com',
    'contact@physipro.fr',
    'guillaumepichon@physipro.fr'
  ];

  // ══════════════════════════════════════
  //  ACCÈS PAR UTILISATEUR (emails en base64)
  // ══════════════════════════════════════
  var HUB_ACCESS = {
    'YXRlbGllcmF0cEBwaHlzaXByby5jb20=':             ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'], // atelieratp (Daniel)
    'dmFsZXJpZTE4QHZpZGVvdHJvbi5jYQ==':             ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'],   // valerie18 (Valérie)
    'c2ltZHV0QHBoeXNpcHJvLmNvbQ==':                 ['moulage','serie','inspection','inspcouture','serviceClient'],                              // simdut (Cassie)
    'bWljaGVsbGUuYm91Y2hhcmRAcGh5c2lwcm8uY29t':     ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'],                // michelle.bouchard
    'c3JveUBwaHlzaXByby5jb20=':                     ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'],                // sroy (Stéphanie)
    'c29uaWEuYm91bGFuZ2VyQHBoeXNpcHJvLmNvbQ==':     ['moulage','serie','inspfinale','serviceClient'],                                            // sonia.boulanger
    'c2VydmljZTNAcGh5c2lwcm8uY29t':                 ['moulage','serviceClient'],                                                                 // service3 (Jacynthe)
    'c2VydmljZTFAcGh5c2lwcm8uY29t':                 ['moulage','serviceClient'],                                                                 // service1 (Jonathan)
    'bmdhZ25lQHBoeXNpcHJvLmNvbQ==':                 ['moulage','serie','inspfinale','serviceClient'],                                            // ngagne (Nadia)
    'bXBsYW5ndWVkb2NAcGh5c2lwcm8uY29t':             ['moulage','serviceClient'],                                                                 // mplanguedoc (Marie-Pier)
    'bWFyaWVzb2xlaWxyQHBoeXNpcHJvLmNvbQ==':         ['moulage','serviceClient'],                                                                 // mariesoleilr (Marie-Soleil)
    'ZmFicnlzLmZyZWNoZXR0ZUBwaHlzaXByby5jb20=':     ['moulage','serie','serviceClient'],                                                         // fabrys.frechette
    'Y25jYXRwQHBoeXNpcHJvLmNvbQ==':                 ['moulage','inspfinale','serviceClient'],                                                    // cncatp (Sina)
    'cGV0ZXJiYXNzNzZAZ21haWwuY29t':                 ['moulage'],                                                                        // peterbass76 (Pierre)
    'bWFyaW8uamFjcXVlc0BwaHlzaXByby5jb20=':         ['moulage','serviceClient'],                                                                 // mario.jacques (Mario J.)
    'bWFyaW9vdWVsbGV0dGVAcGh5c2lwcm8uY29t':         ['moulage'],                                                                        // marioouellette (Mario O.)
    'bWFnYXNpbmF0cDJAcGh5c2lwcm8uY29t':             [],                                                                                 // magasinatp2 (Sylvain)
    'bWFnYXNpbmF0cDNAcGh5c2lwcm8uY29t':             [],                                                                                 // magasinatp3 (Stéphane Del.)
    'cmhAcGh5c2lwcm8uY29t':                         ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'],          // rh (Roxanne)
    'ZXJpYy5wb2lyaWVyQHBoeXNpcHJvLmNvbQ==':         [],                                                                            // eric.poirier (Éric)
    'Y29udGFjdEBwaHlzaXByby5mcg==':                 ['serviceClient'],                                                                            // contact (France)
    'amVhbmNocmlzdG9waGVkYW5qb3VAcGh5c2lwcm8uY29t': ['moulage','serie','inspection','inspcouture','inspfinale','serviceClient'],                // jeanchristophedanjou (Jean-Christophe)
    'Z3VpbGxhdW1lcGljaG9uQHBoeXNpcHJvLmZy':         ['serviceClient']                                                                             // guillaumepichon (Guillaume PICHON)
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
.ppnav-grid{display:flex;flex-direction:column;gap:10px;}\
.ppnav-row{display:grid;gap:10px;}\
.ppnav-row.row1{grid-template-columns:1fr 1fr;}\
.ppnav-row.row2{grid-template-columns:1fr 1fr 1fr;}\
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
@media(max-width:500px){.ppnav-row.row2{grid-template-columns:1fr 1fr;}.ppnav-modal{padding:18px 14px 14px;}}\
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
   *   currentModuleId : string — clé du module courant (ex:  'moulage', 'serie')
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
    var emailLower = (email || '').toLowerCase();
    var hasFullMobile = MOBILE_FULL_ACCESS.indexOf(emailLower) !== -1;
    var mobileList = (emailLower === 'atelieratp@physipro.com') ? MOBILE_ALLOWED_ADMIN : MOBILE_ALLOWED;

    grid.innerHTML = '';

    // Rangée 1 : moulage + jobs (2 colonnes)
    var ROW1 = ['moulage', 'serviceClient'];
    // Rangée 2 : inspection + inspcouture + inspfinale (3 colonnes)
    var ROW2 = ['inspection', 'inspcouture', 'inspfinale'];

    function _buildItem(mod) {
      if (access.indexOf(mod) === -1) return null;
      if (mobile && !hasFullMobile && mobileList.indexOf(mod) === -1) return null;
      var m = NAV_MODULES[mod];
      if (!m) return null;
      var a = document.createElement('a');
      a.className = 'ppnav-item' + (mod === currentMod ? ' current' : '');
      a.href = m.file;
      a.innerHTML =
        '<span class="ppnav-icon">' + m.icon + '</span>' +
        '<span class="ppnav-label" style="color:' + m.color + '">' + m.label + '</span>';
      return a;
    }

    var row1El = document.createElement('div');
    row1El.className = 'ppnav-row row1';
    ROW1.forEach(function(mod) {
      var el = _buildItem(mod);
      if (el) row1El.appendChild(el);
    });
    if (row1El.children.length) grid.appendChild(row1El);

    var row2El = document.createElement('div');
    row2El.className = 'ppnav-row row2';
    ROW2.forEach(function(mod) {
      var el = _buildItem(mod);
      if (el) row2El.appendChild(el);
    });
    if (row2El.children.length) grid.appendChild(row2El);

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
