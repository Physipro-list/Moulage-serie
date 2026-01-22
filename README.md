# PhysiPro v1046 - Corrections PWA et Firebase

## 📁 Fichiers inclus

```
physipro-fixes/
├── index.html          # Fichier HTML corrigé (v1046)
├── manifest.json       # Manifest PWA
├── sw.js              # Service Worker
├── icons/             # Icônes PWA
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-167x167.png
│   ├── icon-180x180.png
│   ├── icon-192x192.png
│   ├── icon-256x256.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── splash-640x1136.png
│   ├── splash-750x1334.png
│   └── splash-1242x2208.png
└── README.md          # Ce fichier
```

## 🚀 Instructions de déploiement

### 1. Déployer sur GitHub Pages

Copier tous les fichiers dans votre repository `Moulage-serie/` :

```bash
# Structure finale sur GitHub
physipro-list.github.io/
└── Moulage-serie/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    └── icons/
        ├── icon-16x16.png
        ├── icon-32x32.png
        └── ... (toutes les icônes)
```

### 2. Corriger les règles Firebase

⚠️ **IMPORTANT** : L'erreur `PERMISSION_DENIED` sur `/serieCommandes` nécessite une mise à jour des règles Firebase.

Allez dans la **Console Firebase** > **Realtime Database** > **Règles** et ajoutez :

```json
{
  "rules": {
    "serieCommandes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "physipro": {
      ".read": "auth != null",
      ".write": "auth != null",
      "moulages": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "notifications": {
        "$userKey": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      },
      "jobs": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "backups": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "logs": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "cards": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## ✅ Corrections appliquées

### 1. Meta tag déprécié
- **Avant** : `<meta name="apple-mobile-web-app-capable" content="yes">`
- **Après** : Ajout de `<meta name="mobile-web-app-capable" content="yes">` (ligne précédente)

### 2. Fichiers PWA manquants
- ✅ `manifest.json` créé
- ✅ `sw.js` (Service Worker) créé
- ✅ Toutes les icônes créées (13 tailles)
- ✅ Splash screens iOS créés (3 tailles)

### 3. Version mise à jour
- Titre mis à jour : `PhysiPro v1046`

## 🔧 Problèmes restants à résoudre manuellement

### Règles Firebase
L'erreur `PERMISSION_DENIED` sur `/serieCommandes` doit être corrigée dans la console Firebase.

### Migration des données `/cards`
Le log indique : `⚠️ Données détectées dans /cards (ancien format) - Migration recommandée`

Si vous souhaitez migrer les anciennes données, vous pouvez exécuter cette migration dans la console Firebase ou via un script.

## 📱 Test de la PWA

Après déploiement, testez :

1. **Manifest** : Ouvrez Chrome DevTools > Application > Manifest
2. **Service Worker** : DevTools > Application > Service Workers
3. **Installation** : Sur mobile, vous devriez voir "Ajouter à l'écran d'accueil"

## 🎨 Personnalisation des icônes

Les icônes générées sont basiques (lettre P stylisée sur fond bleu).
Pour des icônes personnalisées, remplacez les fichiers PNG dans le dossier `icons/`.

Couleurs utilisées :
- Fond : `#3b82f6` (bleu)
- Texte : `#ffffff` (blanc)
- Accent : `#0a1628` (bleu foncé)
