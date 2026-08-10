# Actions rapides des devis brouillons

## Objectif

Donner accès à toutes les actions utiles d’un devis brouillon directement depuis sa ligne sur la page Devis, sans navigation vers une autre page.

## Barre d’actions

Chaque devis au statut « Brouillon » affiche cinq boutons compacts avec une info-bulle et un libellé accessible :

1. Modifier : ouvre l’éditeur complet dans une modale préremplie.
2. Aperçu : ouvre l’aperçu du devis dans la modale existante.
3. Télécharger : génère le PDF du devis.
4. Copier le lien : copie l’URL du portail client.
5. Envoyer : ouvre la modale d’envoi existante.

La barre utilise des icônes seules sur ordinateur et téléphone afin de rester compacte. Les boutons restent suffisamment grands pour être utilisés au toucher.

## Comportement

- Aucune action ne redirige l’utilisateur vers une autre page.
- Modifier conserve le numéro, le statut et les métadonnées du devis jusqu’à une action explicite d’envoi.
- L’envoi validé passe le devis à « Envoyé » et renseigne `sentAt`.
- Copier le lien affiche une confirmation non bloquante au lieu d’une alerte navigateur.
- Une erreur de génération PDF ou de copie du lien laisse le devis inchangé et affiche un message compréhensible.

## Réutilisation

La modale `QuoteEditorDialog` créée pour le pipeline est réutilisée sur la page Devis. Les modales d’aperçu et d’envoi existantes sont conservées. La barre d’actions ne duplique donc aucune logique métier.

## Vérification

- Un brouillon expose bien les cinq actions.
- Modifier ouvre une modale préremplie et sauvegarde sans navigation.
- Envoyer ouvre la modale puis met à jour le statut et la date d’envoi.
- Les tests métier, TypeScript et le build de production passent.
