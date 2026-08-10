# Page d'accueil marketing Devizia

Date : 10 août 2026

## Objectif

Refondre la route publique `/` en une page d'accueil professionnelle qui transforme les visiteurs en inscriptions. Devizia s'adresse aux artisans, indépendants et petites entreprises qui veulent créer leurs devis, facturer, suivre leurs paiements et piloter leur activité sans perdre leurs soirées dans l'administratif.

La page combine trois arguments, dans cet ordre :

1. gain de temps et sérénité comme promesse principale ;
2. performance et croissance comme bénéfice économique ;
3. conformité et contrôle comme preuve de sérieux.

## Positionnement et message

La promesse principale sera : « Vos devis, factures et paiements. Sans perdre vos soirées. »

Le discours emploie des mots simples, des résultats concrets et un ton chaleureux. Il évite le jargon de logiciel de gestion dans les premiers écrans. Les détails comme Factur-X, la traçabilité et la trésorerie apparaissent ensuite pour rassurer les visiteurs plus exigeants.

La marque affichée partout est **Devizia**. Les références visibles à InvoicePro sur la page d'accueil doivent disparaître.

## Publics

- Artisans et professionnels du bâtiment qui travaillent souvent depuis leur téléphone.
- Indépendants et consultants qui veulent produire des documents professionnels rapidement.
- Petites entreprises qui souhaitent centraliser ventes, facturation et paiements.

Les exemples doivent rester assez variés pour que ces trois publics se reconnaissent, sans donner l'impression que le produit est réservé au BTP.

## Direction visuelle

L'identité est éditoriale, premium et accessible : bleu pétrole profond, fond ivoire et accent cuivre. Une typographie de caractère sert les titres, associée à une sans-serif très lisible pour les contenus et l'interface produit.

La composition repose sur de grands espaces, quelques formes graphiques inspirées des documents et une démonstration réaliste de l'application. Les cartes standardisées sont limitées au profit de sections plus narratives et asymétriques. Les animations restent légères : apparition progressive, survols précis et mouvement discret dans l'aperçu du produit.

Le résultat doit être lisible sur mobile, respecter `prefers-reduced-motion`, conserver des contrastes accessibles et fournir des états de focus visibles.

## Parcours de la page

### 1. En-tête

L'en-tête contient le logo Devizia, des ancres vers les bénéfices, le fonctionnement et les tarifs, puis les accès connexion et inscription. Sur mobile, un menu compact et accessible remplace la navigation horizontale.

### 2. Hero

Le hero présente la promesse principale, un paragraphe expliquant la proposition de valeur et deux actions : démarrer gratuitement et découvrir le fonctionnement. Une micro-réassurance précise l'absence de carte bancaire ou d'installation uniquement si cela correspond au parcours actuel.

Un aperçu produit crédible montre un devis en création et un petit résumé d'activité. Il sert de démonstration visuelle, pas de décoration générique.

### 3. Bandeau de confiance

Un bandeau identifie clairement les trois publics : artisans, indépendants et petites entreprises. Il mentionne des qualités vérifiables du produit, par exemple utilisation mobile, documents Factur-X et centralisation de l'activité. Aucun nombre d'utilisateurs, avis ou gain chiffré non démontré ne sera inventé.

### 4. Problèmes transformés en bénéfices

Cette section part de situations concrètes : devis terminés le soir, relances oubliées et vision floue des paiements. Chacune est associée à une réponse Devizia et à un résultat compréhensible.

### 5. Fonctionnement en trois étapes

1. Créer un devis à partir d'informations simples ou avec l'assistance IA.
2. Envoyer un document professionnel et suivre son statut.
3. Transformer le devis en facture, relancer et suivre l'encaissement.

Les liens et actions doivent utiliser les routes réelles du produit.

### 6. Démonstration des fonctionnalités

Une section visuelle présente les fonctions existantes les plus fortes : devis assistés, facturation Factur-X, suivi des clients, pipeline commercial, trésorerie et gestion des dépenses. Les visuels peuvent être construits en HTML/CSS pour rester rapides et nets sur tous les écrans.

### 7. Les trois piliers

- **Temps et sérénité** : automatiser et centraliser le travail administratif.
- **Performance et croissance** : envoyer plus vite, mieux suivre les opportunités et réduire les oublis de paiement.
- **Conformité et contrôle** : générer des documents professionnels, garder une trace des actions et préparer la facturation électronique.

### 8. Identification par profil

Une courte section montre comment Devizia s'adapte aux artisans, indépendants et petites équipes. Chaque profil reçoit une phrase spécifique et un exemple d'usage. Cette section ne crée pas trois produits séparés.

### 9. Tarifs et FAQ

La page donne un accès clair à la route `/tarifs` plutôt que de dupliquer une grille susceptible de diverger. Une FAQ courte répond aux objections principales : prise en main, mobile, conformité, sécurité des données et résiliation.

### 10. Appel final et pied de page

Le dernier appel à l'action reprend la promesse de temps gagné et mène à `/inscription`. Le pied de page contient la marque Devizia, les liens produit utiles et les informations légales déjà disponibles. Les liens fictifs ne doivent pas être présentés comme fonctionnels.

## Architecture d'implémentation

La refonte reste dans la stack existante TanStack Router, React, Tailwind CSS et Lucide. La route `src/routes/index.tsx` est la source de vérité de l'accueil applicatif ; les fichiers HTML marketing statiques ne doivent pas remplacer la route React.

La page sera découpée en composants locaux et tableaux de contenu simples pour garder chaque section lisible. Aucune nouvelle dépendance n'est requise. Les textes destinés à être traduits utiliseront le système i18n existant si les traductions correspondantes sont ajoutées ; sinon, la page française reste cohérente sans clés manquantes.

## Données et comportements

La page n'effectue aucun appel réseau. Les aperçus utilisent uniquement des données de démonstration explicitement fictives. Les boutons dirigent vers les routes existantes `/inscription`, `/connexion` et `/tarifs`, ou vers des ancres internes valides.

Le menu mobile conserve un état local. Il se ferme après sélection d'un lien et expose un libellé accessible ainsi que l'état d'ouverture.

## SEO

Le titre, la description, les métadonnées Open Graph et la carte Twitter utilisent la marque Devizia et la cible élargie. Le contenu principal contient une seule balise `h1`, une hiérarchie de titres cohérente et du texte utile sans accumulation artificielle de mots-clés.

Les affirmations juridiques seront formulées prudemment. La page pourra mentionner la génération Factur-X lorsque cette capacité est effectivement présente, sans annoncer une certification ou un hébergement précis non vérifié.

## Gestion des erreurs

La page est essentiellement statique et ne crée pas de nouveau scénario d'erreur métier. La navigation doit rester utilisable si les animations sont désactivées. Les éléments décoratifs ne doivent jamais masquer le texte ou bloquer les interactions.

## Vérification

- Exécuter le typecheck et le build de production.
- Vérifier que toutes les routes et ancres appelées existent.
- Contrôler la page aux largeurs mobile, tablette et bureau.
- Tester le menu au clavier et les focus visibles.
- Vérifier les contrastes et `prefers-reduced-motion`.
- Rechercher les anciennes mentions visibles d'InvoicePro sur la route d'accueil.
- S'assurer qu'aucune preuve sociale ou statistique invérifiable n'a été ajoutée.

## Hors périmètre

- Refonte des écrans authentifiés.
- Modification du moteur de devis ou de facturation.
- Création de nouvelles offres tarifaires.
- Ajout d'un CMS, d'analytics ou d'un backend marketing.
- Réécriture des pages statiques secondaires sans lien direct avec la route d'accueil.
