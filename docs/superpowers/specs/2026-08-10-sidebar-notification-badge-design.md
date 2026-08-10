# Compteur unique dans la barre latérale

## Objectif

Supprimer le doublon visuel du nombre de factures en retard dans la navigation.

## Comportement

- Aucun compteur n’est superposé sur l’icône d’un menu.
- Lorsqu’un menu possède des notifications, un seul badge rouge apparaît à l’extrémité droite de sa ligne.
- Le nombre et sa logique de calcul ne changent pas.
- La règle s’applique à tous les menus afin d’éviter de futurs doublons.
- Lorsqu’il n’y a aucune notification, aucun badge n’est affiché.

## Vérification

- « Factures » avec une facture en retard affiche un seul `1`, à droite.
- L’icône Factures reste visible sans pastille superposée.
- Le panneau de notifications de la cloche n’est pas modifié.
- TypeScript et le build de production réussissent.
