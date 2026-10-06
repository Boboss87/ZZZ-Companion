# PRD — ZZZ Companion

## Original problem statement
Créer une application mobile personnelle "ZZZ Companion" pour remplacer une Google Sheet utilisée quotidiennement pour gérer un compte Zenless Zone Zero. Application mono-utilisateur, 100% locale, hors-ligne, sans serveur ni synchronisation. Sauvegardes via export/import d'un fichier unique. Base de données du jeu maintenue manuellement par l'utilisateur. Modules: Assistant de farm, Projection de pulls, Historique de pulls, ZZZdex (collection/base), Assistant de tri des Discs, Accueil, Paramètres, Sauvegarde.

## User choices (confirmés)
- Architecture 100% locale (store JSON persisté via AsyncStorage), sauvegarde fichier unique partageable (Drive via menu de partage OS).
- Base pré-remplie avec quelques agents réels + éditeur complet.
- Premier livrable: Accueil + Assistant de farm + ZZZdex + Sauvegarde (+ Réglages).
- Style sombre "gaming" ZZZ (jaune #FEEE00 / noir), mobile-first.

## Architecture technique
- **Frontend uniquement** (Expo Router, React Native). Aucun backend, aucune DB distante.
- **Store**: React Context (`src/store/AppStore.tsx`) tenant tout l'état applicatif, persisté en un seul blob JSON (`AsyncStorage` clé `zzz_companion_state_v1`) → export/import triviaux.
- **Moteur métier**: `src/store/farmEngine.ts` (calcul besoins, consommation des stocks communs par priorité, estimations de temps selon énergie allouée) + `src/store/gameData.ts` (tables de coûts approximatives, presets, agents seed).
- **ZZZdex = source unique de vérité** des agents; les autres modules lisent ces données.
- **Sauvegarde**: `src/store/backup.ts` (expo-file-system legacy + expo-sharing + expo-document-picker; download blob sur web).
- **UI**: thème dans `src/theme.ts` (palette dark, tokens spacing/radius/fonts, ELEMENT_COLORS). Composants dans `src/components/` (ui, BottomSheet, AgentPortrait). Polices Bebas Neue (display) + IBM Plex Sans (texte).
- **Navigation**: bottom tabs (Accueil, Farm, ZZZdex, Réglages) + stack (agent/[id], farm/objective, backup).

## Personas
- Joueur unique et avancé de ZZZ qui prépare ses personnages avant leur sortie, farme quotidiennement, planifie ses pulls, et maintient sa propre base de données de jeu.

## Core requirements (statiques)
- 100% local / offline, une seule saisie par information, communication automatique entre modules.
- Assistant de farm: objectifs (1 par perso) avec preset + priorité, liste de farm priorisée recalculée, MAJ manuelle du stock actuel, stocks communs partagés consommés par priorité, matériaux spécifiques par objectif, paramètres d'énergie, batteries (informatif uniquement).
- ZZZdex: grille de portraits (grisé si non possédé), recherche/filtres/tri, fiche détaillée (général, collection perso, bannières, builds multiples, notes, données de farm internes), CRUD agents & builds.
- Sauvegarde: export/import d'un fichier unique JSON, réinitialisation.

## Implémenté (2026-06)
- [x] Accueil: cartes Assistant de farm (perso courant, prochain matériau, temps restant, progression), Projection (placeholder "Bientôt"), ZZZdex (possédés/total), Batteries (jours de farm), Énergie du jour.
- [x] Assistant de farm: onglets Liste de farm / Objectifs; liste priorisée (matériau, quantité restante, temps estimé, personnage); MAJ stock via bottom sheet (stepper + saisie exacte) avec recalcul auto; CRUD objectifs + réordonnancement priorité; presets Build normal / Build VH.
- [x] ZZZdex: grille (portraits colorés/grisés, badge Mindscape, étoile wishlist), recherche, chips filtres (statut/élément/rang), ajout d'agent, fiche détaillée éditable (4 onglets), CRUD builds, build actif, notes.
- [x] Réglages: gestion énergie (énergie/jour, runs Discs, batterie quotidienne réservée, énergie farm calculée), batteries, presets CRUD, lien Sauvegarde, infos app.
- [x] Sauvegarde: export (partage/Drive natif, download web), import (document picker + validation), réinitialisation avec confirmation.
- [x] Persistance locale AsyncStorage; thème dark ZZZ; polices; toasts; haptique.
- [x] Testé end-to-end (testing_agent iteration_1) — tous les flux passent.

## Implémenté — itération 2 (2026-06)
- [x] Projection de pulls (`/projection`): situation actuelle (tickets/polychromes/monochromes → total dispo, 160 poly = 1 ticket), projection patch par patch (entrées permanentes + événements, dépenses prévues/réelles, solde, ≈ N perso), détection de déficit, éditeur de patch (nom, durée, revenus, dépenses), clôture de patch avec report du solde + archive.
- [x] Historique de pulls (`/history`): sessions par bannière (Perso/Moteur/Bangboo/Standard), calcul pity courant, moyenne par S-Rank, coût moyen du perso souhaité, taux 50/50 & 75/25, éditeur de session (date, tirages, S-Ranks avec position, souhaité, résultat). Vérifié conforme à l'exemple du cahier des charges (pity 8, moyenne 56, coût souhaité 112).
- [x] Revenus permanents configurables + coût moyen souhaité (auto depuis l'historique) dans Réglages.
- [x] Cartes Accueil Projection & Historique fonctionnelles (Budget OK/insuffisant, coût moyen, 50/50, pity).
- [x] Thème clair pastel + sélecteur Système/Clair/Sombre (piloté par contexte, fonctionne aussi sur web), persistant.
- [x] Testé end-to-end (testing_agent iteration_2) — tous les flux passent.

## Implémenté — itération 3 (2026-06)
- [x] Sauvegarde auto : suivi des modifications non exportées (`dirty`) + date de dernière sauvegarde (`lastExportAt`). Quand l'app revient au premier plan avec des modifications en attente, une invite « Sauvegarde recommandée » propose d'exporter (composant `AutoBackupGate`, écoute `AppState`). Interrupteur « Sauvegarde auto » dans Réglages, date de dernière sauvegarde affichée sur l'écran Sauvegarde. Vérifié via simulation background→foreground.

## Implémenté — itération 4 (2026-06)
- [x] Barème de farm éditable (`GameConfig` dans le store) : les coûts (personnage, moteur, compétences 1→12, core A→F) par rang S/A et les vitesses de farm (unités par run de 60 énergie) ne sont plus codés en dur. Le moteur (`computeRequirements`, `computeFarm`) lit `state.gameConfig`. Écran « Données du jeu » (`/gamedata`) éditable depuis Réglages, avec réinitialisation. Les valeurs par défaut restent des placeholders en attendant le fichier de vraies valeurs fourni par l'utilisateur.

## Implémenté — itération 5 (2026-06) : vraies données du fichier
- [x] Barème réel intégré (fichier ZZZ Database) : tables **par palier** (agent, moteur, skill 1→12, core A→F) + rendements de farm réels (base 20 énergie). Un seul barème universel (pas S/A). Le moteur somme les paliers réellement franchis selon le preset. Éditable dans « Données du jeu ».
- [x] Matériaux complets : Dennies, Journaux, Modules, Cage à hamster, Sceaux (spé), Composants (spé), Puces (élément), Expert (agent), Infâme (agent). Règle d'exclusion : Cage à hamster & Infâme affichés comme manquants mais jamais comptés dans le temps de farm.
- [x] Revenus permanents en polychromes/jour → projection selon la durée du patch (÷160). Situation actuelle : Master Tapes, Polychromes, Monochromes, Residual Signals → total en pulls. Clôture de patch = archivage seul (aucune modif des ressources).

### Reste à faire (remarques A→G du fichier, prochaine itération)
- Onglets bas d'écran Projection & Historique ; format de date JJ.MM.AAAA ; « Délai restant » sur l'Accueil ; titre « État des stocks » sur la liste de farm ; saisie manuelle exacte (patch revenus/dépenses, session nb tirages) ; ZZZdex filtres réduits + tri par date de bannière + nom lisible en thème clair ; listes déroulantes de stats de build pilotées par la table Stat ; spécialisations/éléments/bannières/sets éditables.

## Implémenté — itération 6 (2026-06) : peaufinages A→G (1ère vague)
- [x] Projection & Historique déplacés dans la barre d'onglets du bas (6 onglets : Accueil, Farm, Projection, Historique, ZZZdex, Réglages). En-têtes adaptés (sans bouton retour) ; bouton « + » d'ajout de session déplacé dans l'en-tête de l'Historique (plus de footer collant). Les cartes d'Accueil ouvrent toujours ces onglets.
- [x] Dates au format JJ.MM.AAAA : nouveau composant `DateField` (masque la saisie en JJ.MM.AAAA, stocke en ISO AAAA-MM-JJ pour un tri correct) + `fmtDate`/`daysUntil` dans `src/store/format.ts`. Utilisé pour la date de session et la date cible d'objectif ; affichage JJ.MM.AAAA sur les cartes.
- [x] « Délai restant » sur l'Accueil : jours calendaires jusqu'à la date cible de l'objectif courant (rouge si le temps de farm estimé dépasse l'échéance).
- [x] Saisie manuelle exacte : nouveau composant `InlineNumber` (champ éditable) remplace les steppers pour les revenus d'événement de patch, le coût des dépenses, et le nombre de tirages d'une session. Sélection auto du texte au focus (web + natif).
- [x] ZZZdex : filtres réduits (retrait des puces Rang S/A) + puce « Tri » cyclable (Récent = date de bannière ↓, Nom, Rareté), tri par défaut sur la date de bannière.
- [x] Noms d'agents lisibles en thème clair (texte blanc forcé sur le voile sombre du portrait).
- [x] Correctif : `pointerEvents` du toast déplacé dans le style (fin de dépréciation RN).
- [x] Testé end-to-end (testing_agent iteration_3) — les 7 points passent (navigation 6 onglets, DateField, InlineNumber, exemple pity 8 / moyenne 56 / souhaité 112 / 50-50 0%, tri ZZZdex, persistance après reload).

## Implémenté — itération 7 (2026-06) : listes déroulantes éditables + dates de bannière + titre stocks
- [x] Dates de bannière (première sortie & dernière bannière) de la fiche d'agent affichées et saisies en JJ.MM.AAAA (composant DateField, stockage ISO).
- [x] Carte « Données de farm (interne) » supprimée de l'onglet Général de la fiche d'agent.
- [x] Nouveaux composants `Select` (choix unique) et `MultiSelect` (choix multiple) — menus déroulants accordéon inline.
- [x] Fiche d'agent : Élément et Spécialisation en menus déroulants ; Builds : Set 4 pièces, Set 2 pièces, Stats principales disque 4/5/6 en menus déroulants, Sous-stats prioritaires en multi-sélection.
- [x] Listes personnalisables persistées dans `state.optionLists` (éléments, spécialisations, sets de disques, stats principales, sous-stats), éditables (ajout/rename/suppression) via de nouvelles sections dans « Données du jeu ». Les menus déroulants se remplissent depuis ces listes.
- [x] Titre « État des stocks » + sous-titre ajouté en tête de la liste de farm.
- [x] Testé end-to-end (testing_agent iteration_4) — les 7 points passent, y compris l'ajout d'une option qui apparaît dans le menu déroulant et la persistance après rechargement.

## Backlog priorisé
### P1 (modules restants du cahier des charges)
- Assistant de tri des Discs (regroupement des builds par set/combinaison de stats, filtres agents/builds).

### P2 (raffinements)
- Sauvegarde automatique à la fermeture de l'app (proposition d'enregistrer).
- Tables de coûts de matériaux exactes/éditables (valeurs actuelles approximatives).
- Tri ZZZdex (nom, date de sortie, prochain rerun estimé).
- Import de portraits d'agents réels.
- NativeTabs iOS 26 (actuellement Tabs JS classiques cross-platform).

## Notes
- Aucune authentification, aucun backend, aucune clé API (voir /app/memory/test_credentials.md).
- Les valeurs des tables de matériaux (gameData.ts) sont approximatives et destinées à être ajustées par l'utilisateur.

## V1.1 — refonte Projection, Dashboard, ZZZdex + migration robuste (2026)
**Phase 1 — Fondations** : migrate() v1->v2 avec backfill champ-par-champ (agents/builds/objectifs/patchs/depenses) ; suppression one-time des donnees exemple (agents/objectifs/patchs/sessions) en gardant presets + bareme + listes. Nouveaux champs : agent.reruns, patch.startDate, gameConfig.eventRewardCoefficient, settings.resourceFolderUri.
**Phase 2 — Projection** : Situation actuelle (4 monnaies + total auto) ; dates de patchs auto-enchainees ; revenus selon temps ecoule (jours restants, quotidien lineaire, events restants via coefficient exposant editable) ; depenses prevues/effectuees + bouton Effectuer (cout reel deduit des Master Tapes) ; Passer au patch suivant avec confirmation inline (archivage).
**Phase 3 — Dashboard Accueil** : vue d'ensemble compacte de tous les objectifs (progression, temps restant, temps cumule, delai, Delta colore).
**Phase 4 — ZZZdex** : fiche consultation (lecture seule) + edition (BottomSheet) + wishlist ; onglet Builds conserve ; grille visuelle (badges rang/spe/element, MxWx si possede, coeur wishlist, grise si non possede) ; tris Rerun(decroissant)/Nom/Element/Spe.
- Teste : iteration_5 (Phase 1-3) et iteration_6 (Phase 4), tous verts.
**Phase 5 — Systeme de ressources (A FAIRE, natif Android uniquement)** : resolution auto des images WebP par nom normalise (portraits/badges/icones), dossier local via SAF puis URL distante ; non testable en apercu Expo Go/web.

## V1.1 — ajustements builds + Phase 5 (ressources) — fait
- Builds : sous-stats prioritaires et priorite des competences affichees avec " > " ; competences en liste deroulante (Core/Basic/EX/Ultimate/Assist/Dodge). Teste iteration_7.
- Phase 5 (fondation) : resolveur de ressources generique (noms WebP normalises : zhu_yuan.webp, rank_s.webp, fire.webp, anomaly.webp), ResourcesProvider, carte Reglages (choix dossier Android via SAF / URL distante / retirer), portraits + badges via ResImage avec fallback initiales+badges. L'URL distante est testable ; le choix de dossier local Android n'est testable que sur build natif. Teste iteration_7 (5/5).
