# My Kitchen — Plan

Recipe module for Other Modules. Route `my-kitchen`, group `Local Folder`.
Planned 2026-10-12. Nothing built yet. Update this file as phases ship, and move ideas out of
the "Later" sections once they're built so it doesn't describe things that already exist.

## Goal

A kitchen app for what our family actually cooks — possibly opened to other users later.
It should be genuinely useful day to day and easy to use: fast to add recipes, rate them, log
that we cooked something, and keep pantry totals up to date. No bloat (no life stories, no SEO
filler, no features we won't use) and no "gotcha" bad recipes sneaking in looking trustworthy.
Recipes support options within a dish (Ramen with egg, or with broccoli, chicken or tofu).

Long-term, once there are ~100+ real recipes: ingredient prices and cost per meal, full nutrition,
and weekly meal planning. The data model is shaped so those don't need a migration.

## Grading criteria

Use these to check any future change to this plan. A change that lowers a score needs a reason.

| # | Criterion | What a 5/5 looks like |
| --- | --- | --- |
| 1 | **Useful for how the family actually cooks** | Fast to answer "what are we making", easy to follow while cooking, fits a weekly routine |
| 2 | **Options within a dish** | One recipe holds add-ins and swaps; they flow into scaling, cook mode, cook log, and later cost/nutrition/shopping |
| 3 | **No bloat** | Recipes hold only what's needed to cook; the app has no features we won't use; few fields to fill in |
| 4 | **Trust** | Untested or badly imported recipes are clearly marked until proven; import mistakes are caught before saving |
| 5 | **Ready for long-term features** | Price, pantry, nutrition and planning can be added without converting saved files |
| 6 | **Ready for other users** | Shared recipe content is separate from each household's personal data; IDs and storage don't assume one user |
| 7 | **Scope and ordering** | Something usable ships early; risky parts are isolated; each phase is usable on its own |
| 8 | **Safety and testability** | Import function can't be abused; logic is well tested; nothing private leaks |
| 9 | **Easy to use** | Adding, rating, logging a cook and updating pantry each take a handful of clicks with sensible defaults (see flow budgets) |

### Grading history

| # | Criterion | Round 1 (original plan) | Round 2 (options, household, trust, split phases) | Round 3 (ease-of-use pass) |
| --- | --- | --- | --- | --- |
| 1 | Useful | 4 | 4 | 4.5 |
| 2 | Options | 1 | 4.5 | 4.5 |
| 3 | No bloat | 3 | 4 | 4.5 |
| 4 | Trust | 2.5 | 4 | 4.5 |
| 5 | Long-term ready | 4.5 | 4.5 | 4.5 |
| 6 | Other users | 2 | 4 | 4 |
| 7 | Scope | 3.5 | 4.5 | 4.5 |
| 8 | Safety/tests | 4.5 | 4.5 | 4.5 |
| 9 | Easy to use | — | 2.5 | 4.5 |
| | **Overall** | ~3.1 | ~4.0 | **~4.4** |

What moved each round:

- **Round 1 → 2:** option groups inside a recipe; recipe content separated from household data
  (`household` sub-object, random `uid`); trust status + import/save checks; description skipped
  on import, classification fields folded into prefixed tags; v1 split into v1a–v1d.
- **Round 2 → 3 (ease of use):** text-first editor (ingredients and steps as typed lines with live
  parsing, not per-field forms); "Quick add" paste of a whole recipe; drafts (title is the only
  required field) with autosave; one "Made it" sheet that logs the cook, rates, records options,
  handles the first-cook trust prompt and applies pantry deductions in one place; editable cook log
  entries that reverse pantry changes; "What should we make?" suggestions row; unrated-cooks
  reminder; light pantry moved up to v2 (opt-in, only items you choose to track) instead of waiting
  for the full ingredient catalog.

Remaining known weaknesses (accepted for now):

- **Other users (4):** real multi-user needs Firestore + Auth + security rules; v1 only keeps the
  data shaped for it.
- **Phone use:** desktop Chrome/Edge only until a cloud-backed `KitchenStore` exists. Pantry
  updates while unpacking groceries would be nicer on a phone.

## Flow budgets (ease of use)

Targets the UI is built and tested against. "Action" = click, keypress, or paste.

| Flow | Target |
| --- | --- |
| Import from URL | Paste URL → review → Save: **≤ 3 actions** |
| Add from pasted text (Quick add) | Paste → review → Save: **≤ 3 actions** |
| Add from scratch | Only the title is required; type ingredient lines and step lines, Ctrl+S |
| Log a cook | "Made it" → Save: **2 clicks** (date, servings and options prefilled) |
| Rate a recipe | One tap on a 1–10 row, in the Made-it sheet or inline on the recipe view |
| Update pantry after cooking | Deductions prefilled and checked in the Made-it sheet: **0 extra clicks** |
| Restock pantry | One click per item ("+1 package" / "Bought" from the low list) |
| Fix a mistaken cook log | Edit or delete the entry; pantry deductions reverse automatically |
| Decide what to make | Library opens on a "What should we make?" row |

## v1 decisions

| Topic | Decision |
| --- | --- |
| Devices | Desktop Chrome/Edge now (File System Access API, like LocalFlix). Phone later: all storage goes through a `KitchenStore` interface so a cloud backend can replace `FolderKitchenStore`. |
| Folder layout | One subfolder per recipe, named by the recipe's stable `id`: `recipe.json` + images + thumbnails. Shared files (`_pantry.json`, later `_ingredients.json`, `_meal-plans/`) go at the root. |
| Recipe IDs | `id`: readable slug generated once from the title (`-2` suffix on collision), used as the folder name, **never changed** — renaming changes `title` only. `uid`: random ID stored on every recipe so IDs never collide when libraries are merged or shared. |
| Content vs. household data | Recipe content (title, ingredients, steps, options, images, source, times, tags) is separate from our family's take on it (`household`: rating, frequency, trust, favorite options, notes, cook log). Both live in `recipe.json` in v1; with other users, `household` moves to a per-household record keyed by `uid`. |
| Options | Option groups inside a recipe: `pickOne` (swap, e.g. protein) or `pickAny` (add-ins, e.g. toppings). Each option has its own ingredients and steps, shown as its own section. **Rule:** options are small add-ons/swaps picked at cook time; a `parentId` fork is for a materially different dish (changes more than ~⅓ of the steps). |
| Trust | `untested` (imported/typed, never cooked) → `tested` (cooked, kept) → `ours` (family-approved, adjustments folded in). Untested recipes show a badge and sort below tested ones by default. |
| Recipe checks | On import and save, show warnings (never blocks): missing ingredients or steps, ingredient lines that didn't parse (shown next to their raw text), ingredients never mentioned in any step, steps mentioning something not listed, times that don't add up, steps over ~400 characters ("probably includes tips"). |
| No bloat | Import skips `description` unless a checkbox is ticked; never imports comments/reviews. Recipe view: title, photo, times, options, then ingredients and steps; notes and source collapsed at the bottom. Classification lives in prefixed tags (`cuisine:japanese`, `meal:dinner`, `equip:instant-pot`, `diet:vegetarian`, `effort:weeknight`) — one autocomplete field instead of five. |
| Editor | Text-first: ingredients are typed lines (one per line, `## Sauce` starts a group) with live parsed chips and warnings beside them; steps are typed paragraphs (blank line between steps, `##` headings for groups). Fixing a parse = editing the text. Option groups get the same two text boxes per option. Details (servings, times, tags, source) in a collapsed section. Ctrl+S saves. |
| Drafts | Only the title is required to save. Incomplete recipes show a "draft" badge (derived from the checks, not a stored field). Unsaved editor content autosaves to localStorage per recipe and is offered back on reopen. |
| Quick add | One big "Paste a recipe" box; splits on headings like Ingredients / Instructions / Directions / Method and opens the editor prefilled. Same code path as the editor's text boxes. |
| Made-it sheet | One "Made it" button opens a sheet prefilled with today, current scaler servings and current options. Optional: 1–10 rating row, note, photo. First cook of an `untested` recipe adds "Keep it? Anything to change?" in the same sheet (edits save as `origin: 'adapted'`, trust → `tested`; a low rating offers Retired). From v2: pantry deductions listed and prechecked. |
| Suggestions | Library opens on "What should we make?": Staples/Regulars overdue for their frequency (based on last made), plus "Want to try" picks. Pure function over existing data; no extra fields. |
| Unrated reminder | Cooks logged without a rating show a small "rate these" list in the library. |
| URL import | Turnstile-gated `importRecipe` Cloud Function is a **thin fetch proxy**: verifies the token, applies URL safety checks, returns the page HTML and cover image. The JSON-LD parser runs **in the browser**. |
| Import fallback | "Paste page source" option that runs the same browser-side parser. Needed because many large recipe sites block server-side fetches from cloud IPs. |
| Imported text | JSON-LD strings are decoded (`&amp;`, `&#39;`) and stripped of tags (`<p>`, `<br>`). HTML is parsed with `DOMParser` and never inserted into the page via `innerHTML`. |
| AI fallback | Not in v1. |
| Frequency | Staple / Regular / Occasional / Rare / Want to try / Retired |
| Rating | `household.rating` (integer 1–10) is the overall opinion, set by hand. A cook log entry's `rating` describes that one attempt and never changes `household.rating` automatically. |
| Photos | Multiple per recipe; drag-drop or paste from clipboard; resized to ~1600px WebP on save, plus a ~400px `thumb` used by the library grid. |
| Content origin | Each recipe and image records `origin: 'imported' \| 'own' \| 'adapted'`, so it's known later what's safe to publish (a site's instructions text and photos can be copyrighted; ingredient lists generally can't). |
| Units | Parser saves canonical unit codes (`tbsp`, `cup`, `g`, `oz`, …). Original wording stays in `raw`. |
| Dates | Cook log dates stored as **local** `YYYY-MM-DD`, never via `toISOString()` (that shifts evening cooks to the next day in UTC). Timestamps (`createdAt`/`updatedAt`) are full ISO strings. |
| Deleting | Deleting a recipe or photo moves it to `_trash/` in the folder instead of deleting it (a local folder has no undo). The loader ignores any folder starting with `_`. |
| Demo mode | Read-only demo with 4–6 sample recipes (own content, `origin: 'own'`, at least one with options) so portfolio visitors without a folder — or on Firefox/Safari, which can't pick one — can still see the module. Same pattern as Quiz's `sample-quizzes.ts`. |
| Test store | `InMemoryKitchenStore` implements `KitchenStore` for specs (jsdom has no File System Access API) and also backs demo mode. |
| Backups | Recommend keeping the recipes folder inside OneDrive or a git repo for free backups and history until real export exists. |
| Privacy | Deferred. Local folder only for now; decide public vs. private once a real data set exists. |

### Folder layout

```
MyRecipes/                  ← folder the user picks
  ramen/                    ← stable id, not renamed with the title
    recipe.json
    cover.webp
    cover.thumb.webp
  smash-burgers/
    recipe.json
    cover.webp
    cover.thumb.webp
  _pantry.json              ← v2: tracked pantry items
  _trash/                   ← deleted recipes/photos land here; ignored by the loader
```

### Data model (draft)

Each ingredient keeps its original text and also gets parsed into parts. `ingredientId` stays
empty until it's linked to a pantry item (v2) or the full ingredient catalog (later).

```ts
type ContentOrigin = 'imported' | 'own' | 'adapted';
type RecipeTrust = 'untested' | 'tested' | 'ours';

// Canonical unit codes; the parser maps aliases ("T", "Tbsp", "tablespoons") onto these.
type UnitCode =
  | 'tsp' | 'tbsp' | 'cup' | 'floz' | 'pt' | 'qt' | 'gal' | 'ml' | 'l'
  | 'oz' | 'lb' | 'g' | 'kg'
  | 'pinch' | 'dash' | 'handful'
  | 'clove' | 'slice' | 'can' | 'package' | 'stick' | 'bunch' | 'sprig' | 'piece';

interface RecipeIngredient {
  raw: string;              // "1 (14 oz) can diced tomatoes, drained" — never thrown away
  quantity?: number;        // 1
  quantityMax?: number;     // for "2–3 cloves"
  unit?: UnitCode;          // "can"
  packageQuantity?: number; // 14  — from "(14 oz)"
  packageUnit?: UnitCode;   // "oz"
  name?: string;            // "diced tomatoes"
  prep?: string;            // "drained"
  optional?: boolean;
  toTaste?: boolean;        // "salt to taste" — excluded from cost/nutrition/pantry math
  scales?: false;           // pinch of salt, bay leaf — scaler leaves the amount alone
  ingredientId?: string;    // link to pantry item (v2) / ingredient catalog (later)
  recipeRef?: string;       // ingredient is another recipe ("1 batch pizza dough")
}

// Steps are objects (not strings) so step timers, step photos and inline ingredient amounts
// can be added later without converting every saved file.
interface RecipeStep {
  text: string;
  image?: string;
  timerMinutes?: number;
}

interface RecipeOptionGroup {
  id: string;                     // stable within the recipe, e.g. "toppings"
  name: string;                   // "Toppings", "Protein", "Broth"
  kind: 'pickOne' | 'pickAny';    // swap vs. add-ins
  defaultOptionIds: string[];     // what "the usual" is
  options: RecipeOption[];
}

interface RecipeOption {
  id: string;                     // "soft-egg"
  name: string;                   // "Soft-boiled egg"
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];            // shown as its own section in view + cook mode
  note?: string;
}

interface RecipeImage {
  file: string;             // "cover.webp"
  thumb: string;            // "cover.thumb.webp"
  caption?: string;
  isCover?: boolean;
  origin: ContentOrigin;
}

interface PantryDeduction {
  pantryItemId: string;
  amount: number;
  unit?: UnitCode;
}

interface CookLogEntry {
  id: string;
  date: string;               // local YYYY-MM-DD
  servingsMade?: number;      // from the scaler
  optionIds: string[];        // which version was made ("with egg + chashu")
  rating?: number;            // this attempt only; does not change household.rating
  note?: string;              // "a bit dry, cut 5 min"
  images?: string[];
  pantryDeductions?: PantryDeduction[]; // v2: what was subtracted, so edit/delete can reverse it
}

// Our family's take on a recipe. With other users, this moves to a per-household record keyed by uid.
interface HouseholdRecipeData {
  rating?: number;            // integer 1–10, overall opinion
  frequency: RecipeFrequency;
  trust: RecipeTrust;
  favoriteOptionIds?: string[];
  notes?: string;
  cookLog: CookLogEntry[];
}

// Shareable recipe content.
interface Recipe {
  schemaVersion: 1;
  id: string;                 // stable slug = folder name; never changes after creation
  uid: string;                // random, globally unique
  parentId?: string;          // fork for a materially different dish
  origin: ContentOrigin;
  title: string;
  description?: string;       // not imported unless asked for
  source?: { url?: string; siteName?: string; author?: string };
  servings?: number;
  servingsMax?: number;       // "Serves 4–6"
  yieldText?: string;         // "24 cookies", "1 loaf"
  prepMinutes?: number;
  cookMinutes?: number;
  restMinutes?: number;       // marinating, resting, rising
  totalMinutes?: number;      // as given by the site; often ≠ prep + cook
  ingredientGroups: { name?: string; items: RecipeIngredient[] }[];  // "For the sauce"
  stepGroups: { name?: string; steps: RecipeStep[] }[];
  optionGroups: RecipeOptionGroup[];
  tags: string[];             // lowercase, prefixed: cuisine:, meal:, equip:, diet:, effort:
  images: RecipeImage[];
  sourceNutrition?: Nutrition; // whatever the recipe site provides, kept as-is
  household: HouseholdRecipeData;
  createdAt: string;
  updatedAt: string;          // also used for last-write-wins if a cloud backend syncs later
}

// v2 light pantry (`_pantry.json`). Each tracked item doubles as the first entry of the future
// ingredient catalog, so linking work done now carries forward.
interface PantryItem {
  id: string;                 // "eggs"
  name: string;
  aliases: string[];          // "large eggs", "egg"
  location: 'fridge' | 'freezer' | 'pantry' | 'spices' | 'other';
  staple?: boolean;           // assumed always on hand; never deducted (salt, oil)
  amount?: number;            // exact tracking, e.g. 12
  unit?: UnitCode;            // matching recipe unit for deductions
  level?: 'plenty' | 'low' | 'out'; // coarse tracking when amount isn't worth counting
  lowAt?: number;             // amount at or below which it shows as low
  packageAmount?: number;     // "+1 package" adds this (e.g. 12 eggs)
  updatedAt: string;
}
```

Option example — Ramen: the base holds noodles, broth and aromatics. "Toppings" (`pickAny`):
soft-boiled egg, broccoli, scallions, chili oil. "Protein" (`pickOne`): chashu, chicken, tofu.
The recipe view shows checkboxes/radios above the ingredients with the defaults preselected;
ingredients, scaler and cook mode only show what's selected. JSON-LD has no concept of options, so
imported recipes start with none.

### Loading and validation

`schemaVersion` only helps if something acts on it. Every `recipe.json` read goes through one
`loadRecipe(json)` function that:

- Upgrades older schema versions to the current one
- Fills in missing optional arrays/defaults (`tags: []`, `optionGroups: []`, `household.cookLog: []`, …)
- Generates a `uid` if one is missing
- Validates required fields and value ranges (rating 1–10 integer, known frequency/trust, option
  ids unique within a group, etc.)
- On a broken or hand-edited file: skip it and list it in a visible "couldn't load" panel —
  never crash the library
- Ignores any root folder starting with `_` (`_trash/`, and later `_meal-plans/` etc.)

## Build phases

Each phase is usable on its own.

### v1a — Capture (start entering recipes here)

- [ ] Models under `src/other-modules/app/core/models/`: `Recipe`, `HouseholdRecipeData`,
      `RecipeIngredient`, `RecipeStep`, `RecipeOptionGroup`, `RecipeOption`, `RecipeImage`,
      `CookLogEntry`, `RecipeFrequency`, `RecipeTrust`, `UnitCode`, `ContentOrigin`, `Nutrition`
- [ ] `ingredient-parser.ts` + spec, covering:
  - [ ] Fractions (`2 1/2`, `½`, `1½`) and decimals
  - [ ] Ranges (`2–3`, `2-3`, `2 to 3`)
  - [ ] Unit aliases mapped to canonical `UnitCode` (`T`, `Tbsp`, `tablespoons` → `tbsp`)
  - [ ] Package sizes: `1 (14 oz) can tomatoes`
  - [ ] Non-numeric amounts: `pinch`, `dash`, `a handful`
  - [ ] `salt to taste`, `salt and pepper` → `toTaste`
  - [ ] `(optional)`
  - [ ] Prep notes after the comma
  - [ ] Unparseable lines keep `raw` and leave parsed fields empty (never throw)
- [ ] `recipe-text.ts` + spec: text-first editor format ↔ model (ingredient lines with `##`
      groups, blank-line-separated steps with `##` groups) and Quick add splitting on headings
- [ ] `recipe-loader.ts` + spec: `loadRecipe` upgrade/defaults/validation (see above)
- [ ] `recipe-id.ts` + spec: slug from title, collision suffix, random `uid`
- [ ] `kitchen-store.ts`: `KitchenStore` interface (recipes now; pantry v2; catalog/plans later) +
      `FolderKitchenStore` (reopen last folder via IndexedDB like LocalFlix, read every
      `*/recipe.json` through `loadRecipe`, write one recipe at a time, image files, delete =
      move to `_trash/`)
- [ ] `InMemoryKitchenStore` implementing the same interface, for specs and demo mode
- [ ] `image-resize.ts`: ~1600px WebP + ~400px thumbnail via canvas; revoke object URLs when done
- [ ] Folder screen: unsupported-browser message, empty state for picking/creating the folder,
      "couldn't load" panel for bad files
- [ ] Editor: text-first ingredients/steps with live parse chips, option groups, drag-drop/paste
      photos and pick the cover, collapsed Details (servings, times, tags with prefix
      autocomplete, source), Ctrl+S, localStorage autosave of unsaved edits, unsaved-changes
      warning on leave, title-only drafts
- [ ] Quick add: paste a whole recipe → editor prefilled
- [ ] Library: thumbnail grid, search across titles, tags **and ingredient names**, filter chips
      grouped by tag prefix plus frequency/rating/trust, sort (rating, last made, newest),
      untested and draft badges
- [ ] Recipe view: option checkboxes/radios (defaults preselected), ingredients and steps first,
      inline 1–10 rating, notes/source collapsed at the bottom, photo gallery, delete (→ `_trash/`)

### v1b — Cooking

- [ ] `recipe-scaler.ts` + spec:
  - [ ] Rescale quantities (base + selected options), round to sensible kitchen fractions
  - [ ] Countable units round sensibly ("1.5 eggs" → 2, or show "1–2 eggs")
  - [ ] Respect `scales: false`; leave `toTaste` items alone
- [ ] `recipe-checks.ts` + spec: the warnings listed under "Recipe checks"; shown in editor and import review
- [ ] `suggestions.ts` + spec: overdue Staples/Regulars by frequency vs. last made, plus "Want to try" picks
- [ ] Cook mode: large text, one step at a time (base steps + a section per selected option),
      ingredient checkboxes, screen stays awake (Wake Lock API), arrow keys / space to move
- [ ] Made-it sheet: prefilled date/servings/options, optional rating/note/photo, first-cook trust
      prompt, 2-click happy path
- [ ] Cook log list on the recipe view: edit/delete entries; "last made N days ago"
- [ ] Library: "What should we make?" row and "rate these" reminder for unrated cooks
- [ ] Site-provided nutrition shown on the recipe view (no calculation of our own)

### v1c — Import

Function (`functions/src/import-recipe.ts`), kept thin:

- [ ] POST `{ url, token }`; verify Turnstile first
- [ ] Safety checks (otherwise it's an open proxy):
  - [ ] `http`/`https` only
  - [ ] Resolve the hostname and block localhost/private/link-local IPs by the **resolved IP**, not
        the hostname text (a domain can point at `127.0.0.1`)
  - [ ] `redirect: 'manual'`; re-check every redirect hop, with a hop limit (a public URL can
        redirect to a private IP)
  - [ ] Timeout and page size cap
  - [ ] Image: only `image/*` content types, separate size cap
  - [ ] CORS restricted to `https://austinrobichaux.com` + `localhost` (not `origin: true` like the
        contact function)
- [ ] Fetch page HTML; find the cover image URL from the JSON-LD/`og:image` and fetch it too
- [ ] Return `{ html, image: { base64, contentType } }` in one response (Turnstile tokens are
      single-use)
- [ ] Clear error for blocked fetches (403/503/challenge page) so the UI can offer the paste fallback
- [ ] Manual deploy: `npm --prefix functions run deploy` (CI doesn't deploy functions)

Frontend:

- [ ] `jsonld-recipe-parser.ts` + spec, using saved real-site HTML/JSON-LD as test fixtures:
      `@graph`, arrays, `HowToSection`, ISO 8601 durations (`PT1H30M`), image as
      string/object/array, `NutritionInformation`, `recipeYield` as number or text; parse with
      `DOMParser`; decode HTML entities and strip tags from every string; steps become
      `RecipeStep` objects; `description` dropped unless requested
- [ ] Import dialog: URL box + Turnstile widget (site key must allow `localhost` for dev),
      "include description" checkbox
- [ ] Duplicate-URL detection before fetching ("you already have this recipe")
- [ ] "Paste page source" fallback using the same parser
- [ ] Result opens in the editor with recipe checks shown, `origin: 'imported'`,
      `trust: 'untested'`, frequency "Want to try"

### v1d — Showcase

- [ ] `core/data/sample-recipes.ts`: 4–6 self-written sample recipes, at least one with options
- [ ] Demo mode: "Try the demo" button; read-only library/view/cook mode over sample recipes
      (editing, import and Made-it disabled, clearly labeled as a demo)
- [ ] Registration (per CLAUDE.md checklist): `core/data/modules.ts` entry with `lastUpdated`,
      `other-modules.routes.ts` lazy route, case-study entry in `src/app/core/data/projects.ts`

### v2 — Light pantry

Opt-in: the pantry is empty until items are added, and only tracked items are ever deducted.

- [ ] `PantryItem` model + `_pantry.json` in `KitchenStore`
- [ ] Auto-link: an ingredient whose `name` matches a pantry item's name/alias gets that
      `ingredientId`; unmatched lines can be linked by hand from the recipe view
- [ ] `pantry-math.ts` + spec: deductions for base + selected options × servings, unit
      conversion within the same family (tsp/tbsp/cup, oz/lb, g/kg), skip `toTaste` and staples,
      clamp at 0, reverse a cook log entry's `pantryDeductions`
- [ ] Made-it sheet: list deductions prechecked; uncheck or adjust before saving
- [ ] Editing/deleting a cook log entry reverses its deductions
- [ ] Pantry page: grouped by location, quick +/− and "+1 package", level buttons for coarse
      items, "Low / out" filter
- [ ] Low list → "Copy shopping list" as plain text (paste into a phone note until phone support)
- [ ] Recipe view: small "have it / low / out" marker on linked ingredients

## Design notes for later

### Ingredient catalog

Grows out of the v2 pantry items. Cost and nutrition depend on converting between how something
is bought and how a recipe uses it (buy a 5 lb bag of flour; the recipe uses 2½ cups). Each
catalog entry adds:

- Density (grams per cup) for volume ↔ weight
- Weight of one item (1 medium onion ≈ 150 g)
- Package sizes it's bought in
- Waste/trim percentage (edible portion)
- Category / store aisle
- Substitutions (buttermilk = milk + lemon juice), which make "What can I make right now?" much
  more useful

Without these, cost and nutrition numbers are guesses.

### Linking ingredients to the catalog

The most tedious part of reaching 100 recipes. Plan a "review unmatched ingredients" screen that:

- Groups free-text names ("yellow onion", "onion, diced", "1 med onion")
- Suggests a likely catalog match (fuzzy match on name + aliases)
- Confirms in bulk, setting `ingredientId` on every matching line
- Saves each confirmed spelling as an alias, so future imports link automatically

### Household profile

Number of people, portion multipliers, dislikes, and allergies (separate from `diet:` tags). Meal
planning, shopping amounts and nutrition targets all depend on it. Per-member ratings can live
here too.

### Pantry beyond v2

- Optional use-by dates for perishables, with alerts
- "What can I make right now?" ranked by percent of linked ingredients on hand (selected options
  count)
- Restock from a checked-off shopping list in one step

### Price data

- Manual entry per catalog item, with date and store (keeps price history)
- Store unit price per standard unit, with a sale/regular flag so a one-time sale doesn't skew
  average meal cost
- Save a cost snapshot on each cook log entry for history
- Later: receipt photo + AI to pull out prices
- Later: Kroger developer API for product prices, if a Kroger-family store is nearby

### Nutrition

The goal is a "reasonable understanding", and the UI should say the numbers are estimates:

- Source per-ingredient data from USDA FoodData Central (free API), stored on the catalog entry
- Computed for base + selected options
- Exclude `toTaste` ingredients
- Use raw vs. cooked values consistently
- Show a confidence level ("8/10 ingredients matched")

### Meal plan model

Each slot: local date, meal type, recipe id, selected options, servings, and a flag for whether
it's a leftovers slot (so batch cooking fills multiple slots from one cook).

Link plans to the cook log: a planned meal that gets cooked opens the Made-it sheet prefilled; one
that doesn't gets rolled forward or marked skipped, so suggestions stay accurate.

### Shopping lists on the phone

A shopping list will probably be the first thing wanted on a phone, before recipes. v2 starts with
"copy as text"; next steps are a share link or printable page, then real phone support.

### Other users

- Firestore + Auth: households → members; recipes shareable by `uid`; `household` data stored per
  household; security rules scoped to household membership
- Last-write-wins on `updatedAt` for sync conflicts

### Moving recipes into the repo

- Write a small Node script that converts the folder into `core/data` files plus images under
  `public/`, rather than copying by hand
- Size is fine: ~100 recipes × ~3 WebP photos ≈ 30–50 MB
- Use `origin` to decide what can be published if the site goes public
- Recipe content fits static repo data; `household` data, pantry and meal plans change daily and
  will likely stay in the local folder or move to Firestore with a login

### Storage

`KitchenStore` covers recipes, pantry, and later catalog and plans, so the swap to a cloud backend
happens once.

## Later — deferred from v1

- AI fallback for sites without JSON-LD (Claude extracts recipe JSON)
- Photo of a printed/handwritten recipe card transcribed by AI
- Phone support / cloud-backed `KitchenStore`
- Public vs. private decision once a real data set exists

## Later — idea backlog

### Capture and organization

- Recipes used inside other recipes (uses `recipeRef`), rolled up for cost and nutrition
- Named, ordered collections ("Thanksgiving", "Freezer meals", "Date night")
- Dishes-count estimate for meal planning
- Bulk import: list of URLs, or Paprika/Mealie export files (also schema.org-based)
- Version history: keep the previous `recipe.json` on save (a local folder has no undo)

### Cooking experience

- Step timers detected from text ("simmer 20 minutes")
- Ingredient amounts shown inline in step text
- Metric/imperial toggle; grams for baking (needs catalog densities)
- Prep timeline ("start the marinade the night before"), using `restMinutes`

### Planning and shopping

- Shopping list from a meal plan: combine across recipes, subtract pantry, group by aisle
- Leftovers and batch cooking accounted for in the planner
- Ingredient overlap suggestions (use up the rest of the cilantro)
- Seasonality boost for in-season produce
- Calendar export (.ics) for the weekly plan

### Cost and nutrition

- Cost per serving and per meal-plan week; price history
- Store comparison across multiple stores
- Daily/weekly macro totals for a meal plan, with targets
- Ratios like cost per gram of protein

### Sharing and output

- Print view / recipe card PDF
- Share a single recipe as a public link while the collection stays private
- Export everything as a zip or single JSON file

### AI (later)

- "Suggest a recipe from what's in my pantry"
- Auto-tagging imported recipes
- Receipt photo → prices
