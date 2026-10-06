#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
## user_problem_statement: "ZZZ Companion — refinements batch (A→G): move Projection & Historique into the bottom tab bar; display/capture dates in JJ.MM.AAAA; show 'Délai restant' on Home; exact manual number inputs for patch revenues/expenses and session pull count; ZZZdex reduced filters + sort by banner date; agent names readable in light theme."

## frontend:
##   - task: "Projection & Historique as bottom tabs"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/projection.tsx, frontend/app/(tabs)/history.tsx, frontend/app/(tabs)/_layout.tsx, frontend/app/_layout.tsx"
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "Moved projection.tsx and history.tsx from stack into (tabs). Now 6 bottom tabs: Accueil, Farm, Projection, Historique, ZZZdex, Réglages. History add-session moved from sticky footer to a header + button. Home cards still navigate to these tab routes."
##   - task: "Dates in JJ.MM.AAAA (DateField)"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/store/format.ts, frontend/src/components/ui.tsx, frontend/app/(tabs)/history.tsx, frontend/app/farm/objective.tsx, frontend/app/(tabs)/farm.tsx"
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "New DateField masks input to JJ.MM.AAAA and stores ISO (YYYY-MM-DD). Used in session date and objective target date. Display via fmtDate on history cards and farm objective card."
##   - task: "Exact manual number inputs"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/components/ui.tsx (InlineNumber), frontend/app/(tabs)/projection.tsx, frontend/app/(tabs)/history.tsx"
##     priority: "medium"
##     needs_retesting: true
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "InlineNumber editable field replaces steppers for patch event income, patch expense pullCost, and session pull count."
##   - task: "Home Délai restant + ZZZdex sort/reduced filters + light-theme names"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/index.tsx, frontend/app/(tabs)/zzzdex.tsx, frontend/src/components/AgentPortrait.tsx"
##     priority: "medium"
##     needs_retesting: true
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "Home shows 'Délai restant' (calendar days to objective target date, red if farm time exceeds it). ZZZdex: removed rank chips, added cycling 'Tri' chip (Récent/Nom/Rareté), default sort by lastBanner date desc. Agent portrait name forced white for readability on the dark scrim in both themes."

## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 3
##   run_ui: true

## test_plan:
##   current_focus:
##     - "Projection & Historique as bottom tabs"
##     - "Dates in JJ.MM.AAAA (DateField)"
##     - "Exact manual number inputs"
##   test_all: false
##   test_priority: "high_first"

## agent_communication:
##     -agent: "main"
##     -message: "Frontend-only refinements. Please test: (1) 6-tab bottom bar navigation incl. Projection & Historique, and Home cards still open those tabs; (2) DateField in Add Session and Add Objective accepts digits and formats JJ.MM.AAAA, saves, and re-displays correctly (stored ISO). Verify the History pity/50-50 example still computes after entering date via new field; (3) InlineNumber exact entry for patch income, patch expense cost, and session pulls persists and recomputes projection/stats; (4) ZZZdex sort chip cycles Récent/Nom/Rareté and reorders; reduced filters (no rank chips) still filter. App is 100% local (AsyncStorage/IndexedDB), no backend."

## ITERATION 4 — editable option lists + dropdowns + banner dates + stock title
## frontend:
##   - task: "Banner dates JJ.MM.AAAA in agent detail + remove internal-farm card"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/agent/[id].tsx"
##     needs_retesting: true
##   - task: "Dropdowns (Select/MultiSelect) fed by editable option lists"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/components/ui.tsx, frontend/app/agent/[id].tsx"
##     needs_retesting: true
##   - task: "Editable option lists in Données du jeu"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/gamedata.tsx, frontend/src/store/AppStore.tsx, frontend/src/store/types.ts, frontend/src/store/gameData.ts"
##     needs_retesting: true
##   - task: "État des stocks title on farm list"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/farm.tsx"
##     needs_retesting: true
## agent_communication:
##     -agent: "main"
##     -message: "Iteration 4: added user-editable option lists (elements, specializations, disc sets, build main stats, build sub stats) persisted in state.optionLists, edited via new EditableList sections in Données du jeu. Agent detail Element/Specialization and build Set4/Set2/mainStat4-6 are now Select dropdowns; build substats is a MultiSelect; all fed from optionLists. Banner dates (release/lastBanner) now use DateField (JJ.MM.AAAA display + ISO storage). Removed the 'Données de farm (interne)' card. Added 'État des stocks' title atop the farm list."

## ITERATION 5 — V1.1 Phase 1-3: migration/seed removal + Projection refonte + Accueil dashboard
## frontend:
##   - task: "V1->V2 migration: clear example data, backfill new fields"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/store/AppStore.tsx, frontend/src/store/gameData.ts, frontend/src/store/types.ts"
##     needs_retesting: true
##   - task: "Projection refonte (chained dates, time-aware income, event coefficient, planned/done expenses with Effectuer+deduct, Passer au patch suivant)"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/store/projectionEngine.ts, frontend/app/(tabs)/projection.tsx, frontend/app/gamedata.tsx, frontend/src/store/AppStore.tsx"
##     needs_retesting: true
##   - task: "Accueil farm dashboard (all objectives, cumulative time, delta)"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/index.tsx"
##     needs_retesting: true
## agent_communication:
##     -agent: "main"
##     -message: "Phase 1-3 of V1.1. The app now starts empty (seed agents/objectives/patches/sessions removed; presets + barème + dropdown lists kept). Projection fully reworked (see steps). Accueil farm card replaced by a compact dashboard."

## ITERATION 6 — V1.1 Phase 4: ZZZdex consultation/edit + grid badges + sorting (+ next-patch confirm fix)
## frontend:
##   - task: "Agent fiche consultation + edit sheet + wishlist heart"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/agent/[id].tsx"
##     needs_retesting: true
##   - task: "ZZZdex grid badges (rank/spec/element/MxWx/wishlist) + unowned opacity"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/components/AgentPortrait.tsx"
##     needs_retesting: true
##   - task: "ZZZdex sorting (rerun desc / name / element / spec)"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/zzzdex.tsx"
##     needs_retesting: true
##   - task: "Projection next-patch inline confirm (replaces web-broken Alert.alert)"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/(tabs)/projection.tsx"
##     needs_retesting: true
## agent_communication:
##     -agent: "main"
##     -message: "Phase 4 done. Agent detail is now consultation-first (FICHE tab read-only + BUILDS tab) with a ✏️ edit BottomSheet and ❤️ wishlist. Grid tiles show rank+spec+element badges, MxWx for owned, wishlist heart, dimmed if unowned. Sorting: rerun(desc)/name/element/spec. Also fixed the Passer-au-patch-suivant confirm to an inline pane."

## ITERATION 7 — build edits ( ">" separator + skills dropdown) + Phase 5 resources (settings UI; folder native-only)
## frontend:
##   - task: "Build substats & skills use ' > ' priority separator; skills is a dropdown (Core/Basic/EX/Ultimate/Assist/Dodge)"
##     implemented: true
##     working: "NA"
##     file: "frontend/app/agent/[id].tsx, frontend/src/components/ui.tsx, frontend/src/store/gameData.ts"
##     needs_retesting: true
##   - task: "Resource system: resolver + ResourcesProvider + Settings card (folder pick Android / remote URL) + portrait/badge images with fallback"
##     implemented: true
##     working: "NA"
##     file: "frontend/src/store/resources.tsx, frontend/app/_layout.tsx, frontend/app/(tabs)/settings.tsx, frontend/src/components/AgentPortrait.tsx, frontend/app/agent/[id].tsx"
##     needs_retesting: true
## agent_communication:
##     -agent: "main"
##     -message: "Build edits: substats MultiSelect and new skills MultiSelect (SKILL_TYPES) both render/store with ' > '. Resources: generic resolver (normalized webp filenames), provider, settings card with remote URL (testable) + Android folder pick (native-only, shows a note on web). Portraits/badges use ResImage with fallback to initials/badges when no source — so in web preview nothing visually changes (expected)."
