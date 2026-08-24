# PRtion. Ne conclus PAS "publiable" si tu as le moindre doute sur les limites de plan côté serveur, la conformité Factur-X/PAF, ou l'isolation multi-comptes.
OMPT DE TEST PRE-PUBLICATION — ClearQuote (InvoicePro / Brand Flow OS)

> Copie-colle le bloc suivant (entre les marqueurs `<<<PROMPT>>>` et `<<</PROMPT>>>`) à Claude.
> Ce prompt lance un audit de pré-publication complet : connexion, 3 formules, restrictions par compte,
> et te dit précisément POURQUOI tu ne peux PAS encore publier + tout ce qui doit être corrigé.

---

<<<PROMPT>>>

Tu es un expert en audit de production SaaS B2B (facturation, devis, conformité Factur-X/FR 2026) et en tests de sécurité. Ta mission est un **audit de pré-publication exhaustif et impitoyable** du projet dont voici le contexte. Tu dois TOUT tester, TOUT vérifier, et conclure clairement si l'app est publiable en l'état, avec la liste exacte de ce qui bloque et de ce qui doit être corrigé.

## Contexte produit

C'est un SaaS B2B français de gestion commerciale : devis web signables, facturation conforme Factur-X (PDF+XML), CRM Kanban, trésorerie prédictive. Stack : TanStack Start (React 19), Supabase (PostgreSQL, RLS, Auth), Stripe (abonnements SaaS), Resend (email), DocuSeal (signature eIDAS, auto-hébergé, optionnel), Google OAuth + Google Calendar.

**3 formules d'abonnement** (`src/routes/tarifs.tsx`) :
- **Solo** : 0 €/mois — 3 devis ET 3 factures par mois, **1 client actif**, PDF standard, Factur-X, conformité 2026, support email.
- **Pro** : 19,99 €/mois — devis/factures illimités, clients illimités, catalogue, PDF aux couleurs (logo/marque), Factur-X + Piste d'Audit Fiable, **signature électronique client**, relances automatiques, trésorerie prédictive, export comptable (FEC/CSV), portail client avec accès PIN, support prioritaire.
- **Agency** : 49,99 €/mois — tout Pro + jusqu'à 5 utilisateurs, marque blanche (domaine custom), emails depuis votre domaine, rôles/permissions avancés, multi-sociétés, suivi du temps, analyse rentabilité, API & webhooks, intégrations Pennylane/Xero.

## Ce que tu DOIS tester (liste exhaustive)

### 1. AUTHENTIFICATION & COMPTES
- Inscription (email/mot de passe + Google OAuth), confirmation email, connexion, mot de passe oublié, déconnexion.
- Création automatique de l'organisation à l'inscription (le profil sans organisation doit être rattaché — vérifie `getMyOrgId()` dans `src/lib/supabase.ts`).
- Le `plan_tier` du nouveau compte est bien "solo" par défaut partout (profiles ET organizations).
- Sécurité : un utilisateur non authentifié ne peut accéder à aucune route `/tableau-de-bord`, `/devis`, `/factures`, etc. (redirection vers /connexion).
- Idempotence : pas de double création d'organisation au refresh.

### 2. LES 3 FORMULES — RESTRICTIONS PAR COMPTE (point critique)
**⚠️ Vérifie si les limites sont réellement appliquées côté SERVEUR, pas seulement côté frontend.** Regarde `src/routes/api/*` : les routes `/api/quotes/sign`, `/api/quotes/send`, `/api/invoices/*`, etc. utilisent-elles le `plan_tier` pour bloquer ? Vérifie les endpoints `src/lib/data-context.tsx` (upsertQuote, upsertInvoice, upsertClient) et `src/lib/supabase-context.tsx`.

Pour chaque plan, teste côté app (UI) **ET** côté API (requête directe) :
- **Solo** :
  - Blocage à 3 documents/mois (devis+factures combinés ? ou séparés ? — vérifie la logique `>= 3` dans `devis.tsx` l.656 et `factures.tsx` l.253/518/637).
  - Blocage à 1 client actif (`clients.tsx` l.236 `clients.length >= 1`).
  - Vérifie le message/modal d'upgrade affiché (titre, description, plan cible).
  - **PEUT-ON OUTREPASSER en appelant directement l'API ?** Ex: POST un devis/facture/client via supabase ou via les routes API sans passer par l'UI. Si oui → BLOCAGE PUBLICATION.
  - La génération PDF en Solo doit être "standard ClearQuote" (sans logo/marque) — vérifie `companyToDocCompany`/`plan === "solo"` dans `pdf-export.ts`.
- **Pro** : illimité documents/clients, signature électronique client active, relances actives, trésorerie active. Vérifie que le flag `docusealEnabled` est bien renvoyé par `/api/quotes/get`.
- **Agency** : multi-sociétés (switch d'organisation), marque blanche. Vérifie `parametres.tsx` l.415 (fonctionnalités team/brand bloquées pour solo ET pro), l.1094 (multi-org bloqué sauf agency).

### 3. FLUX DEVIS (le cœur du produit)
- Création devis → ajout prestations catalogue → TVA (20/10/5.5/0) → totaux HT/TTC corrects.
- Numérotation DV-YYYY-NNN séquentielle et inaltérable.
- Envoi par email (Resend) : le PDF joint, le lien `/portail/{publicToken}` fonctionne, **l'URL ne contient AUCUNE donnée du devis** (vérifie `email-templates.ts` — on a retiré l'encodage base64, confirme).
- Le client reçoit l'email, clique, consulte le devis, et peut : **signer** (canvas maison + consentement CGV) OU **refuser**.
- Après signature : le statut passe à "Signé"/accepted EN BASE (via `/api/quotes/sign`), pas seulement en local. Vérifie que la colonne `status` ET le payload sont tous deux mis à jour.
- La re-signature d'un devis déjà signé est impossible (409/alreadySigned).
- Test DocuSeal : si configuré, le webhook `form.completed` réconcilie via `docusealSubmissionId` et verrouille. Si non configuré, le fallback signature maison fonctionne.
- Conversion devis signé → facture (`invoice-from-quote.ts`).

### 4. FLUX FACTURES
- Création, envoi, statuts (brouillon/envoyée/en attente/payée/en retard/avoir).
- Numérotation FA-YYYY-NNNN.
- Relances manuelles (J+7/J+15/J+30) via `ReminderModal`.
- Pénalités de retard légales (taux BCE+10%, indemnité 40 €).
- Avoir (annulation sans édition directe).
- Paiement partiel / total.

### 5. CONFORMITÉ LÉGALE FRANCE 2026
- **Factur-X** : le PDF exporté embarque le XML (vérifie `facturx-embed.ts`, `facturx-xml.ts`). Un vrai outil type Chorus Pro / validateur EN16931 accepterait-il ce XML ?
- **PAF (Piste d'Audit Fiable)** : chaque action (création, envoi, signature, modification) est-elle horodatée avec IP ? Y a-t-il une table `audit_logs` réellement écrite ?
- **Loi anti-fraude TVA** : un document signé/validé est-il verrouillé (impossible de l'éditer directement) ?
- Mentions légales obligatoires sur documents : SIRET, TVA intracom, adresse, capital, RCS.
- RGPD : pas de données clients exposées dans les URLs, logs, referer.

### 6. PAIEMENT STRIPE & ABONNEMENTS
- Checkout Pro/Agency → webhook → mise à jour `plan_tier` sur profiles ET organizations.
- Portail de facturation Stripe (changement de plan).
- Status de l'abonnement reflété dans l'app.
- Edge case : webhook reçu 2 fois (idempotence), annulation, échec de paiement.

### 7. SÉCURITÉ (OWASP)
- **IDOR / ACL** : un utilisateur peut-il accéder, signer, modifier les devis/factures d'un AUTRE compte en changeant un id/number dans l'URL ou le corps de requête ? (vérifie que `/api/quotes/get`, `/sign`, `/refuse`, `/docuseal-start` cherchent STRICTEMENT par `publicToken`).
- **Restauration du token public** : `dbQuoteToLegacyQuote` retombe sur `row.id` si pas de `publicToken` — un devis sans token est-il inaccessible (lien mort) ou pire accessible par UUID devinable ?
- **Limites de plan contournables par l'API** (le point critique du §2).
- **Secrets** : `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `DOCUSEAL_*` sont-ils côté serveur uniquement (jamais dans le bundle client) ? Vérifie qu'aucun `process.env.*` sensible n'est exposé via VITE_.
- **RLS Supabase** : les tables sont-elles protégées ? Un client peut-il lire/écrire directement les tables d'un autre workspace via le client Supabase anon ?
- **CSRF** sur les routes d'état, XSS dans les champs libres (nom client, description prestation, refus), redirections ouvertes (Google OAuth `returnTo`).

### 8. PERFORMANCE & STABILITÉ
- Chargement des gros fichiers : `devis.tsx` (80 Ko), `portail.$id.tsx`.
- Le portail client se charge-t-il vite pour un client externe ?
- Erreurs console, 404 fantômes, loading infini.
- Les données sont-elles persistées en Supabase au refresh (pas perdues) ?

## Méthodologie de test exigée
1. **Ouvre chaque fichier** cité pour vérifier la logique réelle (ne te fie pas au marketing).
2. Pour chaque restriction : teste le chemin heureux (UI) ET le chemin hostile (appel API direct / curl / supabase client pour contourner).
3. Note chaque problème avec : fichier + ligne, impact (bloquant / majeur / mineur), et correction proposée.

## Sortie attendue (structure obligatoire)
1. **VERDICT GLOBAL** : ✅ PUBLIABLE / ⛔ PAS PUBLIABLE, en 2-3 phrases.
2. **🚨 BLOCAGES PUBLICATION** (raisons précises pour lesquelles tu ne peux pas publier) — liste numérotée avec fichier:ligne et preuve.
3. **🟠 MAJEURS** (à corriger avant prod ou rapidement après) — liste.
4. **🟡 MINEURS / SUGGESTIONS** — liste.
5. **✅ Ce qui est OK** (pour rassurer sur ce qui tient).
6. Pour chaque élément bloquant, une correction concrète et actionnable.

Sois impitoyable et factuel. Un SaaS de facturation conforme ne pardonne pas l'approxima
<<</PROMPT>>>

---

**Notes d'implémentation à connaître (déjà vérifiées) pour orienter le testeur :**
- Les **limites Solo (3 documents/mois, 1 client) sont actuellement appliquées UNIQUEMENT côté frontend** (grep : `plan === "solo"` dans `devis.tsx`, `factures.tsx`, `clients.tsx`). Aucune route `/api/*` ne vérifie le `plan_tier` → suspect n°1 de contournement.
- Les routes publiques du portail (`/api/quotes/get`, `/sign`, `/refuse`, `/docuseal-start`) identifient STRICTEMENT par `payload->>publicToken`, pas par id/number (correctif IDOR déjà en place).
- `dbQuoteToLegacyQuote` (`src/lib/portal-adapters.ts`) retombe sur `row.id` quand `publicToken` absent — à vérifier (lien mort / exposé).
- Le **typecheck TS est déjà à 0 erreur** ; `data-context.tsx` a été restauré (c'est le context principal).
