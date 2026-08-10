# Modification d’un devis depuis le pipeline

## Objectif

Permettre de modifier un devis sans quitter la page Pipeline. Le bouton « Modifier le devis », disponible uniquement pour les devis en brouillon ou refusés, ouvre un éditeur complet dans une modale.

## Expérience utilisateur

- Le clic sur « Modifier le devis » ouvre une grande modale et ne modifie ni l’URL ni la page active.
- Les informations existantes sont préremplies : client, coordonnées, adresse du chantier, prestations, options, quantités, prix et TVA.
- Le total HT, la TVA et le total TTC sont recalculés en direct.
- L’utilisateur peut ajouter, modifier ou retirer une prestation ou une option.
- « Enregistrer les modifications » met à jour le devis, ferme la modale et affiche une confirmation.
- « Annuler » ferme la modale sans modifier le devis.
- Sur téléphone, la modale utilise presque tout l’écran et son contenu reste défilable.

## Architecture

Le formulaire de devis devient un composant réutilisable plutôt qu’une copie ajoutée dans `pipeline.tsx`. Il reçoit le devis à modifier, les clients et le catalogue nécessaires, puis renvoie le devis validé au parent. La page Pipeline conserve seulement l’état du devis sélectionné et appelle `updateQuote` après validation.

Le statut du devis est conservé pendant l’ouverture de la modale. Si l’utilisateur annule, aucune donnée ne change. Lorsqu’un devis refusé est effectivement enregistré après correction, il repasse automatiquement au statut « Brouillon » afin d’être renvoyé au client.

## Données et règles

- L’identifiant et le numéro du devis ne changent pas.
- Le `clientId` existant est conservé lorsque le client n’est pas remplacé.
- Pour un brouillon, les métadonnées existantes sont conservées.
- Pour un devis refusé corrigé, `status` devient « Brouillon » et les champs `refusedAt`, `closedAt`, `sentAt`, `signedAt` et `signatureData` sont retirés afin de démarrer un nouveau cycle d’envoi propre.
- L’éditeur n’est accessible que lorsque `canEditQuote` autorise le statut.
- Un devis déjà signé, facturé ou payé ne peut pas être modifié depuis le pipeline.

## Gestion des erreurs

- Les champs client obligatoires et les lignes invalides empêchent l’enregistrement.
- Si le devis disparaît pendant l’ouverture, la modale se ferme sans écriture.
- Fermer la modale ou cliquer sur Annuler ne déclenche aucune mise à jour.

## Vérification

- Test métier du préremplissage et de la conservation des métadonnées d’un brouillon.
- Test du retour d’un devis refusé vers « Brouillon » uniquement après enregistrement.
- Test du calcul des totaux après modification d’une ligne.
- Vérification TypeScript et compilation de production.
- Contrôle manuel : ouverture depuis Brouillon et Refusé, enregistrement sans navigation, fermeture sans sauvegarde et comportement mobile.
