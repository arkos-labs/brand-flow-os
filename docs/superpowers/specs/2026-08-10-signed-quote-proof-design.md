# Affichage et export de la signature client

## Objectif

Une fois un devis signé par le client, empêcher tout nouvel envoi depuis la fiche Client et rendre la preuve de signature visible dans l’aperçu comme dans le PDF téléchargé.

## Actions d’un devis signé

Dans `Clients → fiche du client → Devis`, un devis « Signé » affiche uniquement :

- Aperçu du devis signé.
- Téléchargement du PDF signé.

Les actions Modifier, Copier le lien et Envoyer ne sont plus proposées. Le lien du portail reste techniquement disponible pour la consultation déjà ouverte, mais l’interface interne n’encourage pas un nouvel envoi.

## Données de signature

Lors de la signature depuis le portail client, l’application conserve :

- le nom du signataire ;
- la date et l’heure ISO ;
- le consentement explicite ;
- le mode de signature, dessiné ou tapé ;
- l’image PNG de la signature lorsqu’elle est dessinée.

Une signature tapée est rendue sous forme de nom manuscrit stylisé. Les anciens devis qui ne possèdent pas d’image affichent le nom du signataire ou, à défaut, le nom du client avec la mention « Signature électronique validée ».

## Aperçu

Le bas du devis contient un encart « Signé électroniquement » comprenant la signature visuelle, le nom du signataire et la date de signature. Cet encart apparaît uniquement lorsqu’une signature est enregistrée ou que le devis possède le statut « Signé », « Facturé » ou « Payé » avec une date de signature.

## PDF

Le générateur PDF ajoute le même bloc de preuve après les mentions légales :

- image PNG pour une signature dessinée valide ;
- nom stylisé pour une signature tapée ou ancienne ;
- nom et date lisibles dans tous les cas.

Une image de signature illisible ne bloque pas le téléchargement : le PDF utilise automatiquement le nom du signataire comme solution de repli.

## Vérification

- Un devis signé expose exactement Aperçu et Télécharger.
- Le portail sauvegarde le mode et l’image de signature dessinée.
- L’aperçu de la fiche Client affiche la preuve.
- Le PDF signé contient la preuve ou son repli textuel.
- Les anciens devis signés restent consultables.
- Tests métier, TypeScript et build de production réussis.
