# Corrections visuelles finales Devizia

## Objectif

Corriger les dernières incohérences signalées sans retoucher les zones déjà validées.

## Périmètre

### Pipeline

Tous les boutons présents dans les cartes du pipeline reprennent la géométrie commune : rayon court, bordure visible, graisse cohérente et états de survol/focus identiques.

- Modifier, envoyer et créer une facture : hiérarchie bleue ou secondaire selon l’importance.
- Confirmer un encaissement : vert sémantique avec la même forme.
- Clôturer ou corriger un refus : variante discrète ou destructive selon l’action.

Les actions et transitions entre colonnes ne changent pas.

### Devis — Générer maintenant

Le bouton « Générer maintenant » de la proposition IA conserve sa position et son ouverture de l’assistant. Il adopte une bordure nette, une ombre décalée et le comportement de survol Devizia, tout en restant lisible sur le fond sombre de la carte.

### Factures — Valider

Le bouton « Valider » conserve le vert indiquant la confirmation d’un paiement. Sa hauteur, son rayon, sa bordure, son ombre et sa typographie deviennent identiques aux autres boutons d’action.

### Cartes

Les cartes internes utilisent le système déjà défini : rayon court, bordure de 2 px atténuée, fond carte et ombre courte. Les cartes de statut peuvent conserver leur couleur ou leur bandeau sémantique. La densité et la structure des contenus ne changent pas.

## Éléments exclus

- Catalogue, déjà validé.
- Modales, déjà validées.
- Animation de lecture/analyse de l’assistant, déjà validée.
- Logique métier, données, glisser-déposer et navigation.

## Accessibilité

- Focus clavier visible.
- Couleurs sémantiques accompagnées d’un texte ou d’une icône.
- Boutons utilisables sur mobile sans débordement.
- États désactivés et chargements conservés.

## Vérification

- Contrat statique ciblant les trois boutons signalés.
- Tests métier, TypeScript et compilation complète.
- Contrôle visuel de Pipeline, Devis et Factures sur ordinateur et mobile.
- Vérification de l’ouverture de l’assistant, du dialogue de paiement et des actions du Pipeline.

## Critères de réussite

- Aucun bouton du Pipeline ne paraît provenir d’un autre design system.
- « Générer maintenant » correspond au style de l’accueil.
- « Valider » reste vert mais partage la forme des autres boutons.
- Les cartes principales ont une apparence cohérente avec l’accueil.
- Les zones exclues restent inchangées.
