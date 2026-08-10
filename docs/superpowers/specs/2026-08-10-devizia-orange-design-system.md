# Design system orange Devizia

Date : 10 août 2026

## Objectif

Harmoniser toute la plateforme Devizia autour d'une identité orange cuivre, bleu nuit et ivoire. La page d'accueil, l'authentification, le tableau de bord et toutes les pages métier doivent utiliser les mêmes couleurs sémantiques.

## Palette

- **Orange cuivre principal** : actions principales, boutons, liens actifs, focus, sélection et série de graphique principale.
- **Orange clair** : surfaces d'accent, survols et arrière-plans sélectionnés.
- **Bleu nuit** : sidebar, titres, texte principal et sections sombres.
- **Ivoire** : fond général de l'application et surfaces secondaires.
- **Blanc** : cartes, tableaux, formulaires et fenêtres.
- **Vert** : paiements reçus, succès et documents validés.
- **Ambre** : avertissements et échéances proches.
- **Rouge** : erreurs, retards critiques et actions destructrices.

## Règles sémantiques

L'orange remplace le violet de marque mais ne remplace pas les couleurs de statut. Un paiement reçu reste vert, un avertissement reste ambre et une erreur reste rouge. Les composants doivent utiliser les variables sémantiques existantes plutôt que des couleurs orange écrites directement dans chaque fichier.

Les états de focus utilisent l'orange principal avec un contraste visible. Les textes sur fond orange utilisent une couleur très claire ou bleu nuit selon le contraste mesuré. Les fonds ivoire gardent un texte bleu nuit.

## Architecture

La source de vérité est `src/styles.css`. Les variables globales `--primary`, `--secondary`, `--accent`, `--ring`, `--chart-1`, `--sidebar-primary` et les gradients associés passent à la famille orange. Les variables de fond, de texte, de sidebar et de statut sont ajustées uniquement si nécessaire pour produire la palette validée.

La page publique utilise `src/routes/homepage.css` et doit reprendre les mêmes valeurs de marque. Ses variables locales deviennent des alias visuels cohérents : bleu nuit, ivoire, blanc, orange cuivre, vert et ambre.

Le mode sombre conserve des surfaces sombres et reçoit un orange suffisamment lumineux pour les actions et focus. Il ne doit pas simplement copier les valeurs du mode clair.

## Périmètre

La modification couvre :

- accueil public ;
- connexion, inscription et mot de passe oublié ;
- tableau de bord et navigation ;
- devis, factures, clients, catalogue et pipeline ;
- paiements, dépenses, trésorerie, situations et abonnements ;
- paramètres, tarifs et portail client ;
- composants partagés, graphiques et états interactifs.

Les mises en page, parcours métier et contenus ne changent pas.

## Accessibilité

- Conserver des contrastes lisibles sur boutons, badges et graphiques.
- Garder un focus visible au clavier.
- Ne jamais transmettre un statut uniquement par la couleur.
- Vérifier les surfaces orange avec texte clair et texte bleu nuit.
- Tester le rendu mobile et le mode sombre lorsqu'il est disponible.

## Vérification

- Rechercher les anciennes valeurs violettes écrites directement dans les fichiers de l'application.
- Vérifier les pages accueil, connexion, tableau de bord, devis, factures, clients et tarifs.
- Contrôler les états actif, survol, focus, succès, avertissement et erreur.
- Exécuter les tests métier, le typecheck et le build de production.
- Inspecter les rendus desktop et mobile sans débordement horizontal.

## Hors périmètre

- Refonte structurelle des pages.
- Modification des règles métier.
- Changement des couleurs de succès, avertissement et erreur vers l'orange.
- Création de nouveaux composants ou nouvelles fonctionnalités.
