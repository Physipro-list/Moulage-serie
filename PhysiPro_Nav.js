/*  ═══════════════════════════════════════════════════════════
    PhysiPro_Nav.js — Navigation centralisée
    ─────────────────────────────────────────────────────────
    v_nav11 (2026-10-14) : la suite est réduite à DEUX programmes,
              Moulage et Inspection Atelier. Toutes les autres tuiles
              (Questionnements, Quest. actifs, Couture, Insp. Finale, PSM,
              Codes, Série+, Photo Sender) et leurs listes d'accès
              (QUEST_ALLOWED, PSM_ALLOWED, CODES_ALLOWED) sont retirées.
              Sur téléphone : Moulage seulement (comme avant pour l'atelier).

    USAGE dans chaque app HTML :
      <script src="PhysiPro_Nav.js"></script>, puis après la connexion
      Firebase : initLogoMenu('moulage')  ou  initLogoMenu('inspection').
      Le clic sur #logoFlipContainer ouvre le menu.

    Ce menu décide seulement QUELLES TUILES chacun voit. Les vrais droits
    restent dans la table _P de chaque programme.
    ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var NAV_MODULES = {
    moulage:    { icon: '🏭', label: 'Moulage',       file: 'Physipro_moulage.html',            color: '#3b82f6' },
    inspection: { icon: '☑️', label: 'Insp. Atelier', file: 'PhysiPro_Inspection_Atelier.html', color: '#22c55e' }
  };
  var ORDRE = ['moulage', 'inspection'];
  var MOBILE_BASE = ['moulage'];

  // Accès par utilisateur (courriels en base64) — seulement moulage / inspection
  var HUB_ACCESS = {
    'YXRlbGllcmF0cEBwaHlzaXByby5jb20=':             ['moulage','inspection'], // atelieratp (Daniel)
    'dmFsZXJpZTE4QHZpZGVvdHJvbi5jYQ==':             ['moulage','inspection'], // valerie18 (Valérie)
    'c2ltZHV0QHBoeXNpcHJvLmNvbQ==':                 ['moulage','inspection'], // simdut (Cassie)
    'bWljaGVsbGUuYm91Y2hhcmRAcGh5c2lwcm8uY29t':     ['moulage','inspection'], // michelle.bouchard
    'c3JveUBwaHlzaXByby5jb20=':                     ['moulage','inspection'], // sroy (Stéphanie)
    'cmhAcGh5c2lwcm8uY29t':                         ['moulage','inspection'], // rh (Roxanne)
    'amVhbmNocmlzdG9waGVkYW5qb3VAcGh5c2lwcm8uY29t': ['moulage','inspection'], // jeanchristophedanjou (Jean-Christophe)
    'c29uaWEuYm91bGFuZ2VyQHBoeXNpcHJvLmNvbQ==':     ['moulage'],              // sonia.boulanger
    'c2VydmljZTNAcGh5c2lwcm8uY29t':                 ['moulage'],              // service3 (Jacynthe)
    'c2VydmljZTFAcGh5c2lwcm8uY29t':                 ['moulage'],              // service1 (Jonathan)
    'bmdhZ25lQHBoeXNpcHJvLmNvbQ==':                 ['moulage'],              // ngagne (Nadia)
    'bXBsYW5ndWVkb2NAcGh5c2lwcm8uY29t':             ['moulage'],              // mplanguedoc (Marie-Pier)
    'bWFyaWVzb2xlaWxyQHBoeXNpcHJvLmNvbQ==':         ['moulage'],              // mariesoleilr (Marie-Soleil)
    'ZmFicnlzLmZyZWNoZXR0ZUBwaHlzaXByby5jb20=':     ['moulage'],              // fabrys.frechette
    'Y25jYXRwQHBoeXNpcHJvLmNvbQ==':                 ['moulage'],              // cncatp (Sina)
    'cGV0ZXJiYXNzNzZAZ21haWwuY29t':                 ['moulage'],              // peterbass76 (Pierre)
    'bWFyaW8uamFjcXVlc0BwaHlzaXByby5jb20=':         ['moulage'],              // mario.jacques (Mario J.)
    'bWFyaW9vdWVsbGV0dGVAcGh5c2lwcm8uY29t':         ['moulage']               // marioouellette (Mario O.)
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
@media(max-width:500px){.ppnav-modal{padding:18px 14px 14px;}}\
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
  window.initPhysiProNav = function (currentMod, email) {
    _injectNavDOM();
    var grid = document.getElementById('ppnavGrid');
    if (!grid) return;
    var access = _getAccess(email);
    var mobile = _isMobile();
    grid.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'ppnav-row row1';
    ORDRE.forEach(function (mod) {
      if (access.indexOf(mod) === -1) return;
      if (mobile && MOBILE_BASE.indexOf(mod) === -1) return;
      var m = NAV_MODULES[mod];
      var a = document.createElement('a');
      a.className = 'ppnav-item' + (mod === currentMod ? ' current' : '');
      a.href = m.file;
      a.innerHTML = '<span class="ppnav-icon">' + m.icon + '</span>' +
        '<span class="ppnav-label" style="color:' + m.color + '">' + m.label + '</span>';
      row.appendChild(a);
    });
    if (row.children.length) {
      row.style.gridTemplateColumns = 'repeat(' + row.children.length + ', 1fr)';
      grid.appendChild(row);
    }
    var logo = document.getElementById('logoFlipContainer')
            || document.querySelector('.topbar-logo')
            || document.querySelector('[id*="logoFlip"] img');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.onclick = function (e) { e.preventDefault(); e.stopPropagation(); _openNav(); };
    }
  };

  window._ppnavOpen = _openNav;
  window._ppnavClose = _closeNav;

  // Rétro-compatibilité : les apps appellent initLogoMenu('module')
  window.initLogoMenu = function (currentMod) {
    var email = '';
    if (typeof currentUser !== 'undefined' && currentUser) email = currentUser.email || currentUser;
    else if (typeof fbUser !== 'undefined' && fbUser) email = fbUser.email || fbUser;
    if (typeof email !== 'string') { try { email = email.email || ''; } catch (e) { email = ''; } }
    window.initPhysiProNav(currentMod, email);
  };
  window.openNavModal = _openNav;
  window.closeNavModal = _closeNav;

})();
