# PhysiPro Moulage

Application web de gestion des moulages pour Physipro.

## Version 6.9.0

### Fonctionnalités principales

- 📋 **Tableau Kanban** - 8 colonnes pour suivre les moulages
- 🔥 **Firebase** - Synchronisation en temps réel
- 👥 **Multi-utilisateurs** - Gestion des rôles (admin, éditeur, viewer)
- 📸 **Galerie photo** - Support OneDrive, SharePoint, Google Drive
- ⏱️ **Délais automatiques** - Calcul par région (Québec, Ontario, Maritime)
- 📊 **Tracking département** - Suivi du temps par étape

### Déploiement sur GitHub Pages

1. Créer un nouveau dépôt sur GitHub
2. Téléverser le fichier `index.html`
3. Aller dans **Settings** > **Pages**
4. Sous "Source", sélectionner **Deploy from a branch**
5. Choisir la branche **main** et le dossier **/ (root)**
6. Cliquer sur **Save**

Votre application sera disponible à:
`https://VOTRE-USERNAME.github.io/NOM-DU-REPO/`

### Configuration Firebase

L'application utilise Firebase pour la synchronisation. La configuration est intégrée dans le fichier.

### Utilisateurs par défaut

| Rôle | Mot de passe |
|------|--------------|
| Admin | physipro2024 |
| Éditeur | edit2024 |
| Viewer | view2024 |

---

© 2024 Physipro - Outil de gestion des moulages
