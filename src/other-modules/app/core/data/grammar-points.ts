import { GrammarCategory } from '../models/GrammarPoint';

export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  {
    id: 'parts-of-speech',
    label: 'Parts of Speech',
    points: [
      {
        term: 'Noun',
        summary: 'A person, place, or thing.',
        examples: [
          { japanese: 'いずみ', translation: 'Izumi (a name)' },
          { japanese: 'うち', translation: 'home' },
          { japanese: 'いえ', translation: 'house' },
          { japanese: 'ねこ', translation: 'cat' },
          { japanese: 'たべもの', translation: 'food' },
        ],
      },
      {
        term: 'Verb',
        summary: 'An action. (Ends with う stem)',
        examples: [
          { japanese: 'あるく', translation: 'to walk' },
          { japanese: 'たべる', translation: 'to eat' },
          { japanese: 'ねる', translation: 'to sleep' },
        ],
      },
      {
        term: 'Adjective',
        summary: 'A describing word. (Ends with い stem)',
        examples: [
          { japanese: 'あかい', translation: 'red' },
          { japanese: 'たかい', translation: 'tall / expensive' },
          { japanese: 'やすい', translation: 'cheap' },
        ],
      },
    ],
  },
  {
    id: 'particles',
    label: 'Particles',
    points: [
      {
        term: 'は',
        summary: 'Non-logical. Flags the topic of the sentence ("As for X...").',
      },
      {
        term: 'が',
        summary: 'Marks the subject of the sentence.',
      },
      {
        term: 'を',
        summary: 'Marks the object of the sentence — what is being verbed/adjectived.',
      },
      {
        term: 'に',
        summary:
          'Marks the target of the sentence — the target/thing/person/object that is being verbed/adjectived.',
      },
      {
        term: 'の',
        summary: "Possessive. 「A の B」means A's B.",
      },
      {
        term: 'と',
        summary: 'And.',
      },
      {
        term: 'も',
        summary: 'Too, also.',
      },
    ],
  },
  {
    id: 'sentence-enders',
    label: 'Sentence Enders',
    points: [
      {
        term: 'だ / です',
        summary: 'Used after nouns, for an "A is B" sentence.',
      },
      {
        term: 'い',
        summary: 'Used after adjectives, for an "A is B" sentence.',
      },
      {
        term: 'う',
        summary: 'Used after verbs, for an "A does B" sentence.',
      },
    ],
  },
  {
    id: 'te-form',
    label: 'て Form',
    points: [
      {
        term: 'Verbs',
        summary: 'Follows the usual て form conjugation chart for the verb type.',
      },
      {
        term: 'Adjectives',
        summary: 'Replace the final い with く, then add て.',
      },
    ],
  },
  {
    id: 'past-tense',
    label: 'Past Tense',
    points: [
      {
        term: 'Verbs',
        summary: 'Use the て form conversion, but with た instead of て.',
      },
      {
        term: 'Adjectives',
        summary: 'Replace the final い with かった.',
      },
    ],
  },
  {
    id: 'nouns-verbs-to-adjectives',
    label: 'Nouns/Verbs → Adjectives',
    description: 'Some nouns take な, some take の, when used to modify another noun.',
    points: [
      {
        term: 'な',
        summary: 'Replaces だ when turning a describable noun into an adjective form.',
        examples: [
          { japanese: 'いぬがやんちゃだ', translation: 'The dog is mischievous.' },
          { japanese: 'やんちゃないぬがいる', translation: 'There is a mischievous dog.' },
        ],
      },
      {
        term: 'の',
        summary: 'Shows belonging to a class or category.',
        examples: [
          { japanese: 'ぴんくいろ', translation: 'pink color (a noun)' },
          {
            japanese: 'ぴんくいろのどれす',
            translation: "pink color's dress — i.e. a dress belonging to the class \"pink\"",
          },
        ],
      },
    ],
  },
  {
    id: 'adjectives-to-nouns',
    label: 'Adjectives → Nouns',
    points: [
      {
        term: 'い stem',
        summary: 'Drop the final い to turn an adjective (or certain verbs) into a noun form.',
        examples: [
          { japanese: 'まわる → まわり', translation: '"go around" (verb) → "surroundings" (noun)' },
        ],
      },
    ],
  },
  {
    id: 'self-other-move',
    label: 'Self Move / Other Move',
    points: [
      {
        term: 'Self Move',
        summary: 'Ends with る — the subject moves/changes on its own.',
        examples: [{ japanese: 'まわる', translation: 'to go around (by itself)' }],
      },
      {
        term: 'Other Move',
        summary: 'Ends with す — the subject causes something else to move/change.',
        examples: [{ japanese: 'まわす', translation: 'to send/make something go around' }],
      },
    ],
  },
  {
    id: 'time-expressions',
    label: 'Absolute and Relative Time Expressions',
    points: [
      {
        term: 'Relative',
        summary: 'Placed at the front of the sentence, with no particle.',
        examples: [{ japanese: 'あした わたしが あるく', translation: 'Tomorrow, I will walk.' }],
      },
      {
        term: 'Absolute',
        summary: 'Placed at the front of the sentence, with the に particle.',
        examples: [{ japanese: 'さんじに わたしが あるく', translation: 'At 3 o\'clock, I will walk.' }],
      },
    ],
  },
  {
    id: 'negative',
    label: 'Negative',
    points: [
      {
        term: 'Nouns',
        summary: 'Replace だ with では, then add ない.',
        examples: [
          { japanese: 'これは、ぺんだ → これは、ぺんではない', translation: 'This is a pen. → This is not a pen.' },
        ],
      },
      {
        term: 'Verbs',
        summary: 'Swap to the あ stem (ichidan verbs just drop る), then add ない.',
      },
      {
        term: 'Adjectives',
        summary: 'Replace the final い with く, then add ない.',
      },
      {
        term: 'Past tense negative',
        summary: 'ない becomes なかった.',
      },
      {
        term: 'Exception: ます',
        summary: 'The formal ます ending negates irregularly, to ません.',
      },
    ],
  },
  {
    id: 'helper-verbs',
    label: '"Helper" Verbs',
    points: [
      {
        term: 'たい',
        summary: 'い stem + たい — expresses wanting to do something.',
      },
      {
        term: 'ください',
        summary: 'Attaches to a verb in て form to politely request something.',
        examples: [{ japanese: 'またあそんでください', translation: 'Please play (with me) again.' }],
      },
      {
        term: 'てみる',
        summary: '"Try and see" — attaches to the て form, somewhat formal in tone.',
        examples: [
          { japanese: 'たべてみる', translation: 'to try eating / eat and see' },
          { japanese: 'やってみる / してみる', translation: 'to give it a try / do and see (やる＝する)' },
        ],
      },
    ],
  },
  {
    id: 'formal',
    label: 'Formal Speech',
    points: [
      {
        term: 'Verbs',
        summary: 'い stem + ます.',
      },
    ],
  },
  {
    id: 'verb-stem-swaps',
    label: 'Verb Stem Swaps',
    description: 'What each verb stem attaches to, and what meaning it produces.',
    points: [
      {
        term: 'あ stem + ない',
        summary:
          'Negative. う-ending verbs change to わ instead of あ (e.g. かう → かわない, not かあない).',
        group: 'あ',
      },
      {
        term: 'あ stem + れる (られる for ichidan)',
        summary: 'Receptive/passive — "get verbed".',
        group: 'あ',
      },
      {
        term: 'あ stem + せる (させる for ichidan)',
        summary: 'Causative — to allow or make someone do the verb.',
        group: 'あ',
      },
      {
        term: 'い stem + ます',
        summary: 'Formal speech.',
        group: 'い',
      },
      {
        term: 'い stem + たい',
        summary: 'Wanting to do the verb.',
        group: 'い',
      },
      {
        term: 'い stem + そう',
        summary: 'Seems like / looks like the verb is about to happen.',
        group: 'い',
      },
      {
        term: 'え stem + る (られる for ichidan)',
        summary: 'Potential — "you CAN do the verb".',
        group: 'え',
      },
      {
        term: 'お stem + う (よう for ichidan)',
        summary: 'Volitional — "let\'s do the verb".',
        group: 'お',
      },
    ],
  },
];
