# Other Modules — Idea Backlog

Ideas for new modules to add to Other Modules, captured here so they don't get lost
while we're heads-down on a different one. Not a commitment or a schedule — just a
holding pen.

## New module ideas

- **Japanese reference charts** — Kana-style reference/quiz modules for other
  vocab categories. Could reuse the Kana module's tile-grid/practice/mastery-badge
  patterns per category rather than building each from scratch. Candidate
  categories, roughly in order of how often they actually come up:
  - Greetings & common phrases (こんにちは, ありがとう, すみません, etc.) — arguably
    the single highest-value chart for an absolute beginner.
  - Question words (who/what/when/where/why/how — だれ, なに, いつ, どこ, なぜ, どう)
  - Numbers + counters (counters are notoriously fiddly: people, flat objects,
    long objects, small animals, cups, books, machines/vehicles)
  - Months and seasons (一月〜十二月 and the four seasons — days of the week and
    calendar/relative-day vocabulary are already done, see below)
  - Time expressions (telling time, today/yesterday/tomorrow, last/next week, etc.)
  - Colors, shapes
  - Family terms (own family vs. others' family — the two sets of words are a
    common early stumbling block)
  - Weather terms (sunny, rainy, cloudy, snow, hot, cold) — common small talk
  - Body parts
  - Food & drink basics (common foods, fruits, vegetables, drinks)
  - Animals (common pets/animals)
  - Places (station, school, hospital, restaurant, store, park)
  - Directions & position words (left/right, near/far, in front/behind, N/S/E/W)
  - Transportation (train, car, bus, bicycle, airplane)
  - Common verbs (dictionary vs. polite form pairs — eat, drink, go, come, see, do)
  - Common adjectives (i-adjectives and na-adjectives — big, small, hot, good, bad)
  - Clothing items
  - Money & shopping (yen, price, expensive/cheap, buy/sell)
  - Nationalities & countries
  - Occupations/jobs
  - School subjects

  The days-of-the-week/calendar category has been built into the Japanese
  Reference Charts module (`pages/reference-charts`) — use that module's
  data-driven table/flashcard pattern (`core/models/ReferenceChart.ts`,
  `core/data/reference-charts.ts`) as the template for the remaining categories
  above, rather than building each from scratch.
- **Song transcription practice** — an interactive practice tool: show song
  lyrics (or play audio) and have the user transcribe/translate them, as a way
  to drill kana writing and listening/reading comprehension. Example source:
  animesonglyrics.com, e.g.
  https://www.animesonglyrics.com/clannad-after-story/toki-o-kizamu-uta

## Notes

- Existing modules: Quiz, LocalFlix, Japanese Kana, Investment Calculator, US Career Data, Japanese Learning Resources, Japanese Grammar, Japanese Reference Charts.
- When picking one up, move it out of this list and into the actual module work —
  don't let this file describe something that's already been built.
