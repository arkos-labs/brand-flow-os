# Instructions de Test : Formules d'Abonnement (ClearQuote)

**Application à tester :** ClearQuote
**Environnement (URL) :** [https://devie-ia.vercel.app](https://devie-ia.vercel.app) (Vous pouvez également tester en local via `http://localhost:5173` lors du développement).

Ce document décrit le comportement attendu de l'application selon la formule d'abonnement (plan tier) de l'utilisateur, afin de permettre au développeur/testeur de valider l'ensemble des restrictions et fonctionnalités.

Les 3 plans disponibles sont : **Solo** (Gratuit), **Pro** et **Agency**.

---

## 1. Plan "Solo" (Gratuit / Par défaut)

C'est le plan par défaut lorsqu'un utilisateur s'inscrit sans souscrire à un abonnement payant, ou lorsque `plan_tier = "solo"`.

### Comportements attendus à vérifier :
- **Limite de documents mensuels :** L'utilisateur est limité à **3 documents par mois** (Devis + Factures confondus).
  - *Test :* Dans la page Devis ou Factures, créez 3 documents pour le mois en cours. Essayez d'en créer un 4ème ou de dupliquer un document existant.
  - *Résultat attendu :* Une modale "Passer à la vitesse supérieure" (Upgrade) doit s'ouvrir et bloquer la création.
- **Export PDF (Marque Blanche / Personnalisation désactivée) :**
  - *Test :* Téléchargez ou prévisualisez un PDF de devis/facture.
  - *Résultat attendu :* Le logo de l'entreprise et la couleur principale (primary color) de l'entreprise **ne doivent pas** apparaître sur le PDF, même s'ils sont configurés dans les paramètres.
- **Multi-sociétés bloqué :**
  - *Test :* Dans le menu déroulant en haut à gauche ou dans la page Paramètres, tentez de cliquer sur "Créer une entreprise".
  - *Résultat attendu :* La modale d'upgrade doit s'afficher au lieu de permettre la création.

---

## 2. Plan "Pro"

Plan destiné aux freelances nécessitant plus de liberté. Identifiant en base de données : `plan_tier = "pro"`.

### Comportements attendus à vérifier :
- **Création illimitée de documents :**
  - *Test :* Créez plus de 3 devis ou factures dans le mois courant.
  - *Résultat attendu :* Aucune modale de restriction ne doit s'afficher, la création est libre.
- **Export PDF complet :**
  - *Test :* Assurez-vous d'avoir configuré un logo et une couleur principale dans "Paramètres > Mon Entreprise". Générez un PDF de devis ou facture.
  - *Résultat attendu :* Le PDF doit s'afficher avec le logo et utiliser la couleur choisie pour les éléments visuels (entêtes, etc.).
- **Multi-sociétés toujours restreint :**
  - *Test :* Tentez de créer une nouvelle entreprise.
  - *Résultat attendu :* L'action doit toujours être bloquée et proposer de passer au plan Agency.

---

## 3. Plan "Agency"

Plan pour les agences ou multi-activités. Identifiant en base de données : `plan_tier = "agency"`.

### Comportements attendus à vérifier :
- **Fonctionnalités du plan Pro incluses :** Documents illimités et export PDF complet.
- **Multi-sociétés débloqué :**
  - *Test :* Depuis le menu de sélection de l'entreprise ou les paramètres, cliquez sur "Créer une entreprise".
  - *Résultat attendu :* Vous pouvez créer une seconde entité. Vous pouvez basculer d'une entreprise à l'autre via le menu déroulant en haut à gauche.
- **Rétrogradation (Downgrade) :**
  - *Test :* Tout en ayant plus d'une entreprise dans votre compte, allez dans Paramètres > "Gérer mon abonnement" et essayez de choisir le forfait "Pro" ou "Solo".
  - *Résultat attendu :* L'application doit bloquer le changement et afficher un message d'erreur/modale demandant de supprimer d'abord les autres entreprises avant de pouvoir réduire le plan (un message devrait indiquer qu'une seule entreprise est autorisée pour rétrograder).

---

## 🛠 Comment effectuer ces tests facilement ?

Pour le développeur, il n'est pas nécessaire de passer par de vrais paiements Stripe pour tester.
Vous pouvez modifier la formule d'un compte directement en base de données ou via le tableau de bord Supabase :

1. Ouvrez votre dashboard Supabase.
2. Allez dans l'éditeur de table (`Table Editor`) > Table **`profiles`**.
3. Trouvez la ligne correspondant à l'utilisateur de test.
4. Modifiez la colonne `plan_tier` en inscrivant :
   - `solo` (ou NULL) pour le plan gratuit
   - `pro` pour tester le plan Pro
   - `agency` pour tester le plan Agency
5. Allez également dans la table **`organizations`** et assurez-vous que la colonne `plan_tier` de l'entreprise correspondante est alignée sur celle du profil, car certains composants (comme l'AppShell pour la création d'entreprise) se basent sur le `plan_tier` de l'organisation.
6. Rechargez la page de l'application (ou déconnectez/reconnectez-vous) pour appliquer les changements.

---

## 💳 Tester les paiements avec Stripe (Mode Test)

Si vous souhaitez simuler de vraies souscriptions d'abonnement (ou des paiements de factures) sans utiliser une vraie carte bancaire, assurez-vous que l'application est configurée avec les clés Stripe de **Test** (`sk_test_...` et `pk_test_...`).

Vous pouvez alors utiliser les cartes bancaires virtuelles fournies par Stripe pour simuler des paiements réussis :

| Type de Carte | Numéro de Carte | Date d'Expiration | CVC | Code Postal |
| :--- | :--- | :--- | :--- | :--- |
| **Paiement réussi (Visa)** | `4242 4242 4242 4242` | N'importe quelle date future (ex: `12/30`) | N'importe quel CVC (ex: `123`) | N'importe lequel |
| **Paiement refusé (Erreur générique)** | `4000 0000 0000 0002` | N'importe quelle date future | N'importe quel CVC | N'importe lequel |
| **Fonds insuffisants** | `4000 0000 0000 0004` | N'importe quelle date future | N'importe quel CVC | N'importe lequel |

> [!TIP]
> Pour tester la plupart des flux (Upgrade vers Pro/Agency), utilisez simplement la carte `4242 4242 4242 4242` pour valider le succès de l'abonnement.
