# Migration de marque vers ClearQuote

## Objectif

Faire de **ClearQuote** le nom officiel visible du SaaS et installer le logo fourni sur tous les emplacements de marque pertinents, sans modifier les fonctionnalités, les routes, les données métier ni le thème bleu validé.

## Source du logo

Fichier fourni : `ClearQuote_logo_design_2K_202608102217-removebg-preview.png`.

Le fichier source sera copié dans les ressources publiques du projet puis décliné en deux usages :

- **Logo horizontal** : symbole et mot-symbole ClearQuote pour les espaces suffisamment larges.
- **Symbole compact** : partie graphique bleue seule, utilisée dans les emplacements carrés ou étroits.

Les marges transparentes inutiles seront retirées sans redessiner le logo. Le ratio, les couleurs et la transparence seront préservés.

## Emplacements visuels

### Pages publiques

- En-tête de la page d’accueil.
- Navigation mobile de l’accueil.
- Page de connexion.
- Page d’inscription.
- Page de mot de passe oublié lorsqu’une marque y est affichée.
- Page des tarifs lorsqu’une marque y est affichée.

### Application

- En-tête de la barre latérale desktop.
- En-tête compact ou mobile de l’application.
- Écrans ou états vides contenant actuellement la marque du produit.

### Métadonnées et sorties produit

- Titres et descriptions des routes utilisant encore « Devizia » ou « InvoicePro » comme nom du SaaS.
- Favicon et icône d’application basés sur le symbole compact ClearQuote.
- Mentions de l’outil dans les exports Factur-X et modèles techniques lorsqu’elles identifient le logiciel générateur.
- Modèles d’e-mails lorsque le nom désigne la plateforme elle-même.

## Règles de remplacement

- Remplacer les marques produit « Devizia » et « InvoicePro » par « ClearQuote ».
- Ne pas remplacer les noms d’entreprises clientes, les références de devis, les noms de fichiers métier ou le logo personnalisable d’un client.
- Ne pas utiliser le logo ClearQuote à la place du logo d’entreprise chargé dans Paramètres et affiché sur les devis, factures, portails clients ou e-mails du client.
- Conserver les traductions et textes fonctionnels existants, en ne modifiant que les références à la marque.

## Intégration graphique

- Le logo horizontal doit être affiché avec `object-contain`, sans déformation.
- Une hauteur adaptée sera définie selon le contexte : navigation publique, authentification ou barre latérale.
- Sur fond sombre, le logo doit rester lisible. Si le mot-symbole marine manque de contraste, il sera placé sur une petite surface claire cohérente avec les cartes du design, ou seul le symbole bleu sera utilisé avec le texte ClearQuote rendu en clair.
- Les contrôles, couleurs, bordures et ombres existants ne changent pas.
- Le texte alternatif sera « ClearQuote » pour le logo horizontal et « Symbole ClearQuote » pour l’icône seule.

## Hors périmètre

- Renommage du dépôt GitHub.
- Modification du nom de package, des routes ou des clés de stockage.
- Changement de domaine ou déploiement.
- Refonte des pages ou du système de design.
- Remplacement du logo propre aux entreprises utilisatrices.
- Modification des fichiers HTML de comparaison non utilisés par l’application en production.

## Validation

- Inventaire automatisé des anciennes marques dans le code de production.
- Contrôle visuel de l’accueil, de la connexion et de la barre latérale sur desktop et mobile.
- Vérification de la lisibilité du logo sur fonds clair et sombre.
- Vérification que les logos d’entreprise personnalisables restent inchangés.
- Tests TypeScript et build de production.
- Absence de débordement horizontal et de déformation du logo.
