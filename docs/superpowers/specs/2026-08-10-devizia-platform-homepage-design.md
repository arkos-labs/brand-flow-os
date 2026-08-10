# Design system plateforme Devizia — continuité avec l’accueil

## Objectif

Étendre à toutes les pages internes l’identité visuelle déjà validée sur la page d’accueil, sans modifier les parcours, les données ni les comportements métier.

La plateforme doit donner l’impression d’un seul produit : direct, robuste et professionnel, pensé pour les artisans, indépendants et petites entreprises.

## Direction retenue

Le langage visuel est « terrain éditorial » : bleu Devizia dominant, encre marine, fonds bleu très pâle, contours francs, typographie condensée pour les titres et détails inspirés des documents d’atelier. L’interface reste dense et efficace dans les écrans métier.

Deux alternatives ont été écartées :

- une simple recoloration bleue, trop faible pour créer une vraie continuité avec l’accueil ;
- une reproduction brutale de chaque section marketing, trop encombrante pour les tableaux et formulaires de gestion.

Le compromis retenu reprend les signatures fortes de l’accueil tout en adaptant leur intensité aux usages quotidiens.

## Fondations visuelles

- Bleu principal : couleur des actions, sélections, liens actifs et accents de marque.
- Marine : navigation, texte fort, bordures importantes et ombres décalées.
- Fond : bleu très pâle avec une grille discrète sur les grandes surfaces.
- Blanc : cartes, tableaux, menus et fenêtres.
- Vert, ambre et rouge : réservés aux réussites, avertissements, retards et erreurs.
- Titres : Barlow Condensed, en capitales lorsque le contexte s’y prête.
- Texte courant : Barlow, lisible dans les interfaces denses.
- Données techniques et micro-libellés : IBM Plex Mono avec parcimonie.

## Composants

### Boutons

Les actions principales sont rectangulaires, avec bordure marine de 2 px et ombre décalée. Au survol, le bouton se déplace légèrement et l’ombre se resserre. Les actions secondaires utilisent un fond blanc ; les actions fantômes gardent une présence plus légère. Les boutons d’icône restent compacts mais adoptent les mêmes contours et états de focus.

### Cartes et panneaux

Les cartes utilisent des coins très légèrement arrondis, une bordure visible et une ombre courte. Les cartes importantes peuvent recevoir un bandeau, un repère bleu ou une ombre décalée plus forte. Les contenus denses ne doivent pas perdre d’espace utile.

### Formulaires

Les champs, listes et zones de texte utilisent un fond blanc, une bordure marine atténuée et un focus bleu net. Les libellés sont plus structurés. Les erreurs restent rouges et accessibles.

### Tableaux et listes

Les en-têtes sont plus graphiques, avec typographie compacte et fond bleu pâle. Les lignes conservent leur lisibilité, avec un survol discret. Les menus contextuels et la pagination suivent le même système.

### Fenêtres, menus et onglets

Les dialogues, tiroirs, menus déroulants, popovers et onglets reprennent les bordures et ombres de la marque. Les surfaces superposées doivent rester lisibles et ne pas devenir décoratives au détriment de l’usage.

### Navigation

La barre latérale marine est conservée. L’élément actif reçoit un traitement bleu clairement identifiable. L’en-tête, la recherche globale et les actions de compte utilisent les mêmes règles que les autres composants.

## Architecture d’implémentation

La transformation passe d’abord par les jetons CSS globaux et les composants partagés de `src/components/ui`. Cela propage le style à l’ensemble des routes et limite les corrections page par page. `AppShell` reçoit ensuite les traitements de navigation et de fond. Enfin, les styles locaux qui contredisent le système sont corrigés dans les pages concernées.

Aucune logique métier, structure de données, route ou action utilisateur ne doit changer.

## Accessibilité et responsive

- Contraste suffisant pour le texte et les actions.
- Focus clavier toujours visible.
- Zones tactiles conservées sur mobile.
- Ombres et transformations sans déplacement de mise en page.
- Respect de `prefers-reduced-motion`.
- Aucun débordement horizontal sur les pages principales.

## Vérification

- Tests métier et vérification TypeScript existants.
- Compilation de production.
- Contrôle visuel au minimum sur accueil, tableau de bord, clients, pipeline, devis, connexion et une fenêtre modale.
- Contrôle ordinateur et mobile.
- Vérification que les couleurs sémantiques restent compréhensibles.

## Critères de réussite

- Les pages internes sont immédiatement reconnaissables comme la continuité de l’accueil.
- Les principaux composants ont une apparence cohérente partout.
- Le bleu est dominant sans effacer les statuts métier.
- Les parcours et fonctionnalités existants fonctionnent sans régression.
- La densité des écrans de gestion reste adaptée au travail quotidien.
