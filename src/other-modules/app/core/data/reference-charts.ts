import { FuriganaSegment, ReferenceCategory } from '../models/ReferenceChart';

/** Shared 曜日 ("-day") tail — 曜 is always よう, and this second 日 is read び, in every weekday name. */
const YOUBI_TAIL: FuriganaSegment[] = [
  { text: '曜', reading: 'よう' },
  { text: '日', reading: 'び' },
];

function dayKanji(firstKanji: string, firstReading: string): FuriganaSegment[] {
  return [{ text: firstKanji, reading: firstReading }, ...YOUBI_TAIL];
}

interface DayDef {
  day: string;
  elementMeaning: string;
  kanji: string;
  reading: string;
}

const DAYS: DayDef[] = [
  { day: 'Sunday', elementMeaning: 'sun', kanji: '日', reading: 'にち' },
  { day: 'Monday', elementMeaning: 'moon', kanji: '月', reading: 'げつ' },
  { day: 'Tuesday', elementMeaning: 'fire', kanji: '火', reading: 'か' },
  { day: 'Wednesday', elementMeaning: 'water', kanji: '水', reading: 'すい' },
  { day: 'Thursday', elementMeaning: 'wood / tree', kanji: '木', reading: 'もく' },
  { day: 'Friday', elementMeaning: 'gold / metal', kanji: '金', reading: 'きん' },
  { day: 'Saturday', elementMeaning: 'earth / soil', kanji: '土', reading: 'ど' },
];

export const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  {
    id: 'days-of-week-and-calendar',
    label: 'Days of the Week & Calendar',
    description:
      'The seven weekdays (each built from an elemental kanji + 曜日, "-day"), and common calendar/relative-day vocabulary.',
    tables: [
      {
        id: 'days-of-week',
        title: 'Days of the Week',
        description:
          'Every weekday name is its elemental kanji followed by 曜日 ("-day") — calendars often abbreviate a weekday to just that first kanji.',
        columns: [
          { key: 'day', label: 'Day' },
          { key: 'element', label: 'Element' },
          { key: 'kanji', label: [{ text: '日本語', reading: 'にほんご' }], tooltip: 'Japanese' },
        ],
        practiceFrontKey: 'kanji',
        size: 'half',
        rows: DAYS.map((d) => ({
          day: d.day,
          element: [{ text: d.kanji, reading: d.reading }, { text: ` ${d.elementMeaning}` }],
          kanji: dayKanji(d.kanji, d.reading),
        })),
      },
      {
        id: 'calendar-vocab',
        title: 'Calendar & Time-Unit Vocabulary',
        columns: [
          { key: 'english', label: [{ text: '英語', reading: 'えいご' }], tooltip: 'English' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'japanese',
        size: 'full',
        rows: [
          { english: 'Day', japanese: [{ text: '日', reading: 'ひ' }] },
          { english: 'Days', japanese: [{ text: '日々', reading: 'ひび' }] },
          {
            english: 'Week',
            japanese: [
              { text: '週', reading: 'しゅう' },
              { text: '間', reading: 'かん' },
            ],
            note: 'Counts a duration (一週間 = "one week"). Plain 週 (しゅう) appears in compounds like 今週, "this week".',
          },
          {
            english: 'Weekend',
            japanese: [
              { text: '週', reading: 'しゅう' },
              { text: '末', reading: 'まつ' },
            ],
          },
          {
            english: 'Month',
            japanese: [{ text: '月', reading: 'げつ' }],
            note: 'げつ appears in relative-month compounds (今月/来月/先月). Counting months (January, "one month", etc.) instead uses がつ/かげつ.',
          },
          { english: 'Year', japanese: [{ text: '年', reading: 'とし・ねん' }] },
        ],
      },
      {
        id: 'relative-day-words',
        title: 'Relative Day Words',
        columns: [
          { key: 'english', label: [{ text: '英語', reading: 'えいご' }], tooltip: 'English' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
        ],
        practiceFrontKey: 'japanese',
        size: 'half',
        rows: [
          { english: 'Today', japanese: [{ text: '今日', reading: 'きょう' }] },
          { english: 'Tomorrow', japanese: [{ text: '明日', reading: 'あした' }] },
          { english: 'Yesterday', japanese: [{ text: '昨日', reading: 'きのう' }] },
          {
            english: 'The day before yesterday',
            japanese: [{ text: '一昨日', reading: 'おととい' }],
          },
          {
            english: 'The day after tomorrow',
            japanese: [{ text: '明後日', reading: 'あさって' }],
          },
          {
            english: 'Everyday',
            japanese: [
              { text: '毎', reading: 'まい' },
              { text: '日', reading: 'にち' },
            ],
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'Sunday — 日曜日',
        title: 'A Sun Day',
        body: 'Literally a sun day.',
      },
      {
        term: 'Monday — 月曜日',
        title: 'The Moon Follows the Sun',
        body: '月曜日 (getsuyoubi) starts with 月 (getsu/tsuki among other readings), meaning "moon". Imagine Monday morning after Sunday night, just like the moon does when the sun goes down.',
      },
      {
        term: 'Tuesday — 火曜日',
        title: 'A Fiery Day',
        body: 'The 火 in 火曜日 (kayoubi) means "fire" — also associated with the planet Mars, 火星 (kasei).',
      },
      {
        term: 'Wednesday — 水曜日',
        title: "The Wave's Crest",
        body: '水曜日 (suiyoubi) uses 水 (sui/mizu), meaning "water". Wednesday could be the cool drink of water you need after Tuesday\'s fire — or picture the crest of a wave to remember "suiyoubi".',
      },
      {
        term: 'Thursday — 木曜日',
        title: 'A Tree in the Week',
        body: '木 (moku) means "wood"/"tree". Imagine the water from Wednesday nourished a tree that, by Thursday, had grown into a magnificent one.',
      },
      {
        term: 'Friday — 金曜日',
        title: 'A Golden Day Before the Weekend',
        body: 'Fridays are the best — the weekend\'s adventure is approaching. Perhaps that\'s why the first character of kinyoubi is 金, "gold"/"money".',
      },
      {
        term: 'Saturday — 土曜日',
        title: 'The Earth Is Yours',
        body: 'It\'s Saturday at last! The first kanji, 土 (do), means "soil"/"earth".',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'days-of-week',
  },
];
