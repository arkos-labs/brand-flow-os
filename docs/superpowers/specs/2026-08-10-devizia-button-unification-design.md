# Uniformisation globale des boutons Devizia

## Objectif

Supprimer les différences de forme, hauteur, bordure, ombre et interaction entre les boutons de la plateforme. Le bouton « Nouvelle prestation » doit également être placé complètement à droite dans la barre d’actions du Catalogue.

## Direction retenue

Tous les boutons interactifs suivent le design system bleu Devizia déjà appliqué : forme rectangulaire, rayon court, typographie ferme, focus visible et ombre décalée lorsque l’action doit être mise en avant.

L’approche retenue privilégie le composant partagé `Button`. Les boutons HTML locaux sont remplacés par ce composant lorsque leur comportement le permet. Les contrôles très spécifiques qui doivent rester des éléments natifs utilisent les mêmes classes de variantes.

## Variantes

- `default` : fond bleu, texte blanc, bordure marine et ombre décalée. Réservé à l’action principale d’une zone.
- `outline` : fond blanc, texte marine, bordure marine et ombre courte. Utilisé pour les actions secondaires.
- `secondary` : fond bleu pâle et bordure atténuée. Utilisé pour les actions de soutien.
- `ghost` : sans ombre, bordure transparente, fond léger au survol. Utilisé pour les petites actions et boutons d’icône.
- `destructive` : rouge, uniquement pour supprimer, refuser ou annuler définitivement.
- Variantes sémantiques locales : vert pour confirmer un paiement ou un succès ; ambre pour une attente ou un avertissement. Elles conservent la même géométrie.

## Dimensions

- Hauteur standard : 36 px.
- Petite action : 32 px.
- Grande action : 40 px.
- Bouton icône : carré correspondant à la hauteur de sa taille.
- Rayon : `--shape-control`.
- Bordure principale : 2 px.
- Focus : anneau bleu visible, sans déplacement du contenu.

## Comportement

- Survol des actions principales : translation de 2 px et réduction de l’ombre.
- État actif : ombre supprimée et translation complète.
- Désactivé : opacité réduite et curseur non interactif.
- Chargement : dimensions stables, indicateur sans changement de largeur.
- Mobile : libellé masqué uniquement lorsque l’espace est insuffisant et que l’icône reste explicite ou possède un libellé accessible.

## Catalogue

Dans la rangée de recherche et d’actions :

- recherche et filtres conservent leur espace ;
- import et export restent regroupés ;
- « Nouvelle prestation » est séparé par `margin-left: auto` et reste complètement à droite ;
- sur mobile, son libellé peut être masqué mais l’action reste à droite et possède un titre accessible.

## Architecture

1. Renforcer les variantes du composant `src/components/ui/button.tsx` sans changer son API publique.
2. Ajouter un test statique qui détecte les boutons HTML utilisant encore des signatures principales incohérentes.
3. Migrer en priorité les actions des pages Catalogue, Clients, Devis, Factures, Pipeline, Paiements, Paramètres et écrans publics.
4. Conserver les boutons natifs uniquement lorsqu’une primitive ou une interaction l’exige, avec les classes du design system.

## Accessibilité

- Tous les boutons d’icône possèdent un `aria-label` ou un `title` explicite.
- Le focus clavier reste visible.
- Les couleurs ne sont pas le seul indicateur d’une action destructive ou sémantique.
- Les zones tactiles ne passent pas sous 32 px.

## Vérification

- Test du contrat visuel des boutons.
- Vérification TypeScript et compilation complète.
- Recherche des anciennes signatures `rounded-xl bg-primary`, `rounded-lg bg-primary` et boutons principaux avec `shadow-sm`.
- Contrôle visuel des pages Catalogue, Clients, Devis, Pipeline et Connexion sur ordinateur et mobile.
- Vérification du fonctionnement de création d’une prestation et des principales actions.

## Critères de réussite

- Une action principale est immédiatement reconnaissable sur chaque page.
- Les boutons de même importance ont la même apparence.
- « Nouvelle prestation » est complètement à droite dans Catalogue.
- Les couleurs de statut restent compréhensibles sans créer de nouveau style de bouton.
- Aucun parcours fonctionnel n’est modifié.
