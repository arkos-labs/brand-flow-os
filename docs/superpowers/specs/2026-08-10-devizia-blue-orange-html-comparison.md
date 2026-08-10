# Comparatif HTML bleu et orange Devizia

Date : 10 août 2026

## Objectif

Créer quatre maquettes HTML statiques pour comparer deux identités colorées Devizia sans modifier l'application React actuelle : accueil bleu, accueil orange, dashboard bleu et dashboard orange.

## Principe de comparaison

Les deux versions d'un même écran utilisent exactement la même structure, les mêmes textes, les mêmes données de démonstration et les mêmes dimensions. Seule la palette change. Cette contrainte permet de juger la couleur plutôt qu'une différence de mise en page.

## Fichiers

- `public/accueil-bleu.html`
- `public/accueil-orange.html`
- `public/dashboard-bleu.html`
- `public/dashboard-orange.html`
- `public/comparatif-couleurs.css`

## Accueils

Les deux accueils reprennent la direction terrain validée : navigation compacte, promesse forte, aperçu d'un devis, bénéfices, trois étapes, fonctionnalités et appel à l'action. Ils restent suffisamment courts pour faciliter la comparaison visuelle.

## Dashboards

Les deux dashboards reprennent l'organisation réelle de Devizia : sidebar, recherche, actions rapides, indicateurs principaux, aperçu du pipeline et activité récente. Les données sont fictives et clairement utilisées comme démonstration.

## Palettes

### Bleu dominant

- Bleu profond pour la navigation et les titres.
- Bleu vif pour les boutons, sélections et graphiques.
- Bleu pâle pour les fonds et surfaces secondaires.
- Vert, ambre et rouge conservés pour les statuts.

### Orange dominant

- Bleu nuit pour la navigation et les titres.
- Orange cuivre pour les boutons, sélections et graphiques.
- Ivoire pour les fonds et surfaces secondaires.
- Vert, ambre et rouge conservés pour les statuts.

## Navigation comparative

Chaque fichier contient un sélecteur visible permettant d'ouvrir les quatre variantes. Les liens sont relatifs et fonctionnent avec le serveur Vite existant.

## Contraintes

- HTML et CSS statiques, sans dépendance externe obligatoire.
- Responsive aux largeurs mobile et bureau.
- Aucun envoi de formulaire ni écriture de données.
- Aucun changement des routes ou composants React existants.
- Accessibilité minimale : structure sémantique, contraste, focus et libellés lisibles.

## Vérification

- Ouvrir les quatre URL avec le serveur local.
- Vérifier les liens entre variantes.
- Contrôler les rendus à environ 390 px et 1440 px.
- Vérifier l'absence de débordement horizontal et d'erreur console.
- Confirmer que les paires bleu/orange ont une structure identique.
