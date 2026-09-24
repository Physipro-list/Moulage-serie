/* ================================================================
   PhysiPro_Conso.js \u2014 v1 (2026-09-24)
   COMPTEUR DE T\u00c9L\u00c9CHARGEMENT FIREBASE, PARTAG\u00c9 PAR TOUTES LES PAGES

   \u00c0 inclure AVANT les scripts Firebase de chaque page :
       <script src="PhysiPro_Conso.js"></script>

   Ce qu'il fait :
   1. Compte les octets RE\u00c7US de la Realtime Database par cette page
      (messages WebSocket + lectures REST vers firebaseio.com). C'est
      ce que Firebase facture sous \u00ab T\u00e9l\u00e9chargements \u00bb.
   2. Aux 15 minutes, ajoute ce qui a \u00e9t\u00e9 re\u00e7u depuis la derni\u00e8re fois
      au TOTAL DU JOUR, partag\u00e9 par tous les postes :
         consoTotal/<date>                 un seul nombre (octets)
         consoDetail/<date>/<poste_page>   le d\u00e9tail, pour trouver
                                           quelle page consomme
      L'op\u00e9ration co\u00fbte ~200 octets : n\u00e9gligeable.
   3. Pr\u00e8s de la limite : bandeau orange d'avertissement.
      \u00c0 la limite : la page se D\u00c9CONNECTE de Firebase (goOffline) et
      un \u00e9cran rouge explique pourquoi. Plus rien n'est t\u00e9l\u00e9charg\u00e9
      jusqu'au changement de jour Firebase (minuit heure du Pacifique,
      soit 3 h du matin au Qu\u00e9bec).
   4. Daniel (atelieratp@physipro.com) voit une petite pastille en bas
      \u00e0 gauche avec le total du jour ; un clic ouvre le d\u00e9tail par
      page. Lui seul peut \u00ab Continuer quand m\u00eame \u00bb apr\u00e8s l'arr\u00eat.

   LIMITES : un estim\u00e9. Firebase compte aussi un peu d'enveloppe
   r\u00e9seau, et seules les pages qui incluent ce fichier sont compt\u00e9es.
   ================================================================ */
(function () {
  'use strict';

  /* ---------------- R\u00c9GLAGES ---------------- */
  var QUOTA_MO        = 360;   // quota gratuit quotidien de Firebase
  var AVERTIR_MO      = 270;   // bandeau orange \u00e0 partir d'ici (~80 %)
  var ARRETER_MO      = 330;   // d\u00e9connexion \u00e0 partir d'ici (marge de 30 Mo : le total n'est connu qu'aux 15 min)
  var ENVOI_MS        = 15 * 60 * 1000;  // mise \u00e0 jour du total aux 15 min
  var ADMIN           = 'atelieratp@physipro.com';

  var MO = 1024 * 1024;
  if (window.__physiproConso) return;          // d\u00e9j\u00e0 charg\u00e9
  var C = window.__physiproConso = { octets: 0, envoyes: 0, total: null, arrete: false };

  /* jour Firebase = date du Pacifique */
  function jour() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '') || 'index';
  var POSTE = lsGet('physiproPoste');
  if (!POSTE) { POSTE = 'p' + Math.random().toString(36).slice(2, 8); lsSet('physiproPoste', POSTE); }
  var CLE_DETAIL = (POSTE + '_' + PAGE).replace(/[.#$\[\]\/]/g, '_');

  /* ---------------- 1. COMPTAGE ---------------- */
  function compter(n) { if (n > 0) C.octets += n; }
  function taille(d) {
    if (typeof d === 'string') return d.length;
    if (d && typeof d.byteLength === 'number') return d.byteLength;
    if (d && typeof d.size === 'number') return d.size;
    return 0;
  }
  var WS = window.WebSocket;
  if (WS) {
    var WS2 = function (url, prot) {
      var s = (prot === undefined) ? new WS(url) : new WS(url, prot);
      if (/firebaseio\.com|firebasedatabase\.app/i.test(String(url))) {
        s.addEventListener('message', function (ev) { compter(taille(ev.data)); });
      }
      return s;
    };
    WS2.prototype = WS.prototype;
    ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { WS2[k] = WS[k]; });
    window.WebSocket = WS2;
  }
  if (window.fetch) {
    var F = window.fetch;
    window.fetch = function (input, init) {
      var url = (typeof input === 'string') ? input : (input && input.url) || '';
      var p = F.apply(this, arguments);
      if (/firebaseio\.com|firebasedatabase\.app/i.test(url)) {
        p.then(function (r) {
          try { r.clone().arrayBuffer().then(function (b) { compter(b.byteLength); }); } catch (e) {}
        }).catch(function () {});
      }
      return p;
    };
  }

  /* ---------------- 2. INTERFACE ---------------- */
  function el(id) { return document.getElementById(id); }
  function mo(o) { return (o / MO).toFixed(o < 10 * MO ? 1 : 0) + ' Mo'; }
  function estAdmin() {
    try { var u = window.firebase && firebase.auth && firebase.auth().currentUser;
          return !!(u && String(u.email || '').toLowerCase() === ADMIN); } catch (e) { return false; }
  }
  function style() {
    if (el('pcStyle')) return;
    var s = document.createElement('style'); s.id = 'pcStyle';
    s.textContent =
      '#pcPastille{position:fixed;left:8px;bottom:8px;z-index:2147483000;background:#04152c;color:#fff;' +
      'font:700 11px Segoe UI,Arial,sans-serif;padding:4px 9px;border-radius:12px;cursor:pointer;opacity:.85;' +
      'box-shadow:0 2px 6px rgba(0,0,0,.3)}#pcPastille:hover{opacity:1}' +
      '#pcBande{position:fixed;left:0;right:0;top:0;z-index:2147483001;background:#e65100;color:#fff;' +
      'font:700 14px Segoe UI,Arial,sans-serif;padding:9px 44px 9px 14px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}' +
      '#pcBande button{position:absolute;right:8px;top:5px;background:rgba(255,255,255,.25);border:0;color:#fff;' +
      'font:700 16px sans-serif;width:28px;height:28px;border-radius:6px;cursor:pointer}' +
      '#pcArret{position:fixed;inset:0;z-index:2147483002;background:rgba(120,10,10,.94);color:#fff;display:flex;' +
      'align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif;text-align:center;padding:20px}' +
      '#pcArret .b{max-width:560px}#pcArret h2{font-size:26px;margin:0 0 12px}#pcArret p{font-size:16px;line-height:1.5;margin:8px 0}' +
      '#pcArret button{margin-top:18px;background:#fff;color:#8b0000;border:0;border-radius:8px;padding:10px 20px;' +
      'font:800 14px Segoe UI,Arial,sans-serif;cursor:pointer}' +
      '#pcDetail{position:fixed;left:8px;bottom:36px;z-index:2147483000;background:#fff;color:#11243a;border:1px solid #cfd9e6;' +
      'border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);font:12px Segoe UI,Arial,sans-serif;padding:10px 12px;' +
      'max-height:60vh;overflow:auto;min-width:260px}#pcDetail table{border-collapse:collapse;width:100%}' +
      '#pcDetail td{padding:2px 6px;border-bottom:1px solid #eef2f6}#pcDetail td.n{text-align:right;font-weight:700}';
    (document.head || document.documentElement).appendChild(s);
  }
  function pastille() {
    if (!document.body || !estAdmin()) return;
    style();
    var p = el('pcPastille');
    if (!p) {
      p = document.createElement('div'); p.id = 'pcPastille';
      p.title = 'T\u00e9l\u00e9chargement Firebase aujourd\u2019hui (tous les postes) \u2014 cliquer pour le d\u00e9tail';
      p.onclick = basculerDetail;
      document.body.appendChild(p);
    }
    var t = (C.total == null) ? null : C.total + (C.octets - C.envoyes);
    p.textContent = '\u2601 ' + (t == null ? '\u2026' : mo(t) + ' / ' + QUOTA_MO + ' Mo') + '  \u00b7  cette page ' + mo(C.octets);
    p.style.background = (t != null && t >= AVERTIR_MO * MO) ? '#b3261e' : '#04152c';
  }
  function basculerDetail() {
    var d = el('pcDetail');
    if (d) { d.parentNode.removeChild(d); return; }
    d = document.createElement('div'); d.id = 'pcDetail'; d.textContent = 'Lecture\u2026';
    document.body.appendChild(d);
    try {
      firebase.database().ref('consoDetail/' + jour()).once('value').then(function (s) {
        var v = s.val() || {}, lignes = Object.keys(v).map(function (k) { return [k, v[k] && v[k].o || 0, v[k] && v[k].u || '']; });
        lignes.sort(function (a, b) { return b[1] - a[1]; });
        var h = '<b>Aujourd\u2019hui par poste et page</b><table>';
        lignes.forEach(function (l) {
          h += '<tr><td>' + l[0].replace(/^p[a-z0-9]{6}_/, '') + '<br><span style="color:#8d9cb0">' + l[2] +
               ' \u00b7 ' + l[0].slice(0, 7) + '</span></td><td class="n">' + mo(l[1]) + '</td></tr>';
        });
        d.innerHTML = h + '</table>';
      }).catch(function (e) { d.textContent = 'Lecture impossible : ' + e.message; });
    } catch (e) { d.textContent = 'Firebase indisponible.'; }
  }
  function bande(t) {
    if (!document.body || el('pcBande') || lsGet('pcBandeVue') === jour()) return;
    style();
    var b = document.createElement('div'); b.id = 'pcBande';
    b.innerHTML = '\u26a0\ufe0f Firebase : ' + mo(t) + ' t\u00e9l\u00e9charg\u00e9s aujourd\u2019hui sur ' + QUOTA_MO +
      ' Mo gratuits. \u00c0 ' + ARRETER_MO + ' Mo, les logiciels se mettent en pause jusqu\u2019\u00e0 3 h du matin.' +
      '<button type="button" title="Fermer">\u00d7</button>';
    b.querySelector('button').onclick = function () { lsSet('pcBandeVue', jour()); b.parentNode.removeChild(b); };
    document.body.appendChild(b);
  }

  /* ---------------- 3. ARR\u00caT ---------------- */
  function deconnecter() {
    try {
      (window.firebase && firebase.apps || []).forEach(function (a) {
        try { a.database().goOffline(); } catch (e) {}
      });
    } catch (e) {}
  }
  function arreter(t) {
    if (lsGet('pcOutrepasse') === jour()) return;     // Daniel a choisi de continuer
    C.arrete = true;
    lsSet('pcArret', jour());
    deconnecter();
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { arreter(t); }); return; }
    if (el('pcArret')) return;
    style();
    var o = document.createElement('div'); o.id = 'pcArret';
    o.innerHTML = '<div class="b"><h2>\u26d4 Pause Firebase</h2>' +
      '<p>Les logiciels PhysiPro ont t\u00e9l\u00e9charg\u00e9 <b>' + (t ? mo(t) : 'plus de ' + ARRETER_MO + ' Mo') +
      '</b> aujourd\u2019hui, tout pr\u00e8s des ' + QUOTA_MO + ' Mo gratuits par jour.</p>' +
      '<p>Pour \u00e9viter des frais, cette page est d\u00e9connect\u00e9e de Firebase jusqu\u2019au changement de jour ' +
      '(3 h du matin, heure du Qu\u00e9bec). Ce qui est d\u00e9j\u00e0 \u00e0 l\u2019\u00e9cran reste visible, mais rien n\u2019est enregistr\u00e9.</p>' +
      '<p>Avise Daniel.</p>' +
      (estAdmin() ? '<button type="button" id="pcContinuer">Continuer quand m\u00eame aujourd\u2019hui (frais possibles)</button>' : '') +
      '</div>';
    document.body.appendChild(o);
    var b = el('pcContinuer');
    if (b) b.onclick = function () {
      lsSet('pcOutrepasse', jour()); lsSet('pcArret', '');
      C.arrete = false; o.parentNode.removeChild(o);
      try { (firebase.apps || []).forEach(function (a) { try { a.database().goOnline(); } catch (e) {} }); } catch (e) {}
    };
  }

  /* ---------------- 4. TOTAL PARTAG\u00c9 ---------------- */
  var jourEnCours = jour();
  function envoyer() {
    if (C.arrete || !window.firebase || !firebase.apps || !firebase.apps.length) return;
    var u = null;
    try { u = firebase.auth && firebase.auth().currentUser; } catch (e) {}
    if (!u) return;
    var j = jour();
    if (j !== jourEnCours) { jourEnCours = j; C.total = null; }
    var delta = C.octets - C.envoyes, db;
    try { db = firebase.database(); } catch (e) { return; }
    var deja = C.envoyes;
    C.envoyes = C.octets;
    db.ref('consoTotal/' + j).transaction(function (v) { return (v || 0) + delta; }, function (err, ok, snap) {
      if (err) { C.envoyes = deja; return; }                       // on r\u00e9essaiera
      C.total = (snap && snap.val()) || 0;
      verifier();
    }, false);
    if (delta > 0) {
      db.ref('consoDetail/' + j + '/' + CLE_DETAIL).transaction(function (v) {
        v = v || { o: 0 }; v.o = (v.o || 0) + delta; v.u = u.email || ''; v.t = Date.now(); return v;
      }, null, false);
    }
  }
  function verifier() {
    var t = (C.total || 0) + (C.octets - C.envoyes);
    if (t >= ARRETER_MO * MO) arreter(t);
    else if (t >= AVERTIR_MO * MO) bande(t);
    pastille();
  }

  /* au d\u00e9marrage : si la pause est d\u00e9j\u00e0 en vigueur aujourd'hui sur ce poste,
     on se d\u00e9connecte d\u00e8s que Firebase existe, avant de t\u00e9l\u00e9charger quoi que ce soit */
  var deja = (lsGet('pcArret') === jour() && lsGet('pcOutrepasse') !== jour());
  if (deja && !window.firebase) {
    /* Pause d\u00e9j\u00e0 en vigueur : on attrape Firebase au moment o\u00f9 son script le
       cr\u00e9e, et chaque application est mise hors ligne d\u00e8s son ouverture --
       avant la toute premi\u00e8re connexion, donc sans rien t\u00e9l\u00e9charger. */
    try {
      var _fb;
      Object.defineProperty(window, 'firebase', { configurable: true,
        get: function () { return _fb; },
        set: function (v) {
          _fb = v;
          if (v && v.initializeApp && !v.__pcEnrobe) {
            var ini = v.initializeApp;
            v.initializeApp = function () {
              var app = ini.apply(this, arguments);
              try { app.database().goOffline(); } catch (e) {}
              return app;
            };
            v.__pcEnrobe = true;
          }
        } });
    } catch (e) {}
  }
  var essais = 0;
  var attente = setInterval(function () {
    essais++;
    if (window.firebase && firebase.apps && firebase.apps.length) {
      if (deja) { arreter(null); clearInterval(attente); return; }
      try {
        if (firebase.auth && firebase.auth().currentUser) {
          clearInterval(attente);
          setTimeout(envoyer, 15000);           // premier point apr\u00e8s le chargement initial
          setInterval(envoyer, ENVOI_MS);
          setInterval(pastille, 30000);
        }
      } catch (e) {}
    }
    if (essais > 600) clearInterval(attente);   // 5 min sans connexion : on abandonne
  }, deja ? 20 : 500);
  window.addEventListener('pagehide', function () { try { envoyer(); } catch (e) {} });
  C.envoyerMaintenant = envoyer;
})();
