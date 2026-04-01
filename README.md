# Radar Conformité — Guide de déploiement Looker Studio

## Fichiers inclus
- `manifest.json` — décrit la visualisation à Looker Studio
- `config.json`   — définit les champs de données et options de style
- `viz.js`        — code principal du graphique radar (Chart.js)

---

## Étape 1 — Créer un bucket Google Cloud Storage

1. Va sur https://console.cloud.google.com/storage
2. Clique **Créer un bucket**
3. Nom : `mon-radar-conformite` (ou ce que tu veux, doit être unique)
4. Région : `europe-west1`
5. Contrôle d'accès : **Uniforme**
6. Clique **Créer**

---

## Étape 2 — Remplacer VOTRE_BUCKET dans manifest.json

Ouvre `manifest.json` et remplace les deux occurrences de `VOTRE_BUCKET`
par le nom exact de ton bucket. Exemple :

  "js":     "gs://mon-radar-conformite/radar-conformite/viz.js"
  "config": "gs://mon-radar-conformite/radar-conformite/config.json"

---

## Étape 3 — Uploader les fichiers

### Via l'interface web (plus simple)
1. Dans ton bucket, clique **Uploader des fichiers**
2. Crée un dossier `radar-conformite`
3. Upload dans ce dossier : `manifest.json`, `config.json`, `viz.js`

### Via gsutil (terminal)
```bash
gsutil cp manifest.json gs://mon-radar-conformite/radar-conformite/
gsutil cp config.json   gs://mon-radar-conformite/radar-conformite/
gsutil cp viz.js        gs://mon-radar-conformite/radar-conformite/

# Rendre les fichiers publics (requis par Looker Studio)
gsutil iam ch allUsers:objectViewer gs://mon-radar-conformite
```

---

## Étape 4 — Rendre le bucket public (si pas fait)

1. Dans ton bucket → onglet **Autorisations**
2. **Accorder l'accès** → Principal : `allUsers` → Rôle : `Lecteur des objets Storage`
3. Clique **Enregistrer**

---

## Étape 5 — Ajouter dans Looker Studio

1. Ouvre ton rapport Looker Studio
2. Menu **Insérer → Visualisations communautaires**
3. Clique **Créer votre propre visualisation**
4. Colle le chemin du manifest :
   `gs://mon-radar-conformite/radar-conformite/manifest.json`
5. Clique **Soumettre**

---

## Étape 6 — Mapper tes données

Dans le panneau de données à droite, assigne :
| Champ Looker Studio | Ta colonne |
|---|---|
| Phase (Dimension) | Phase |
| Conformité (%) | Conformity (%) |
| Durée planifiée | Planned Duration |
| Durée réelle | Actual Duration |

---

## Options de style disponibles

Dans l'onglet **Style** du panneau droit :
- **Couleur du radar** — couleur principale du graphique
- **Couleur cible** — couleur de la ligne de référence 100%
- **Valeur max de l'échelle** — par défaut 260 (adapté à tes données)
- **Afficher la ligne cible** — afficher/masquer la ligne 100%

---

## Dépannage

| Problème | Solution |
|---|---|
| "Manifest introuvable" | Vérifier que les fichiers sont bien dans GCS et que le bucket est public |
| Graphique vide | Vérifier que les métriques sont bien mappées (Conformité % en premier) |
| Erreur CORS | Le bucket doit être en accès public uniforme |
| "dscc non disponible" | Ce fichier ne fonctionne que dans Looker Studio, pas dans un navigateur seul |
