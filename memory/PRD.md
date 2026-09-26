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
