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

/** Kanji for 1–12, shared by the numbers, months, and hours tables below. */
const NUMBER_KANJI: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
  11: '十一',
  12: '十二',
};

interface MonthDef {
  value: number;
  reading: string;
  exceptionNote?: string;
}

/** 4, 7, and 9 use an irregular reading instead of the expected よん/なな/きゅう. */
const MONTHS: MonthDef[] = [
  { value: 1, reading: 'いち' },
  { value: 2, reading: 'に' },
  { value: 3, reading: 'さん' },
  { value: 4, reading: 'し', exceptionNote: 'Exception — read しがつ, never よんがつ.' },
  { value: 5, reading: 'ご' },
  { value: 6, reading: 'ろく' },
  { value: 7, reading: 'しち', exceptionNote: 'Exception — read しちがつ, never なながつ.' },
  { value: 8, reading: 'はち' },
  { value: 9, reading: 'く', exceptionNote: 'Exception — read くがつ, never きゅうがつ.' },
  { value: 10, reading: 'じゅう' },
  { value: 11, reading: 'じゅういち' },
  { value: 12, reading: 'じゅうに' },
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function monthKanji(value: number, reading: string): FuriganaSegment[] {
  return [
    { text: NUMBER_KANJI[value], reading },
    { text: '月', reading: 'がつ' },
  ];
}

/** 4, 7, and 9 are also irregular for telling time, but land on different readings than the months table. */
const HOURS: MonthDef[] = [
  { value: 1, reading: 'いち' },
  { value: 2, reading: 'に' },
  { value: 3, reading: 'さん' },
  { value: 4, reading: 'よ', exceptionNote: 'Exception — read よじ, never よんじ.' },
  { value: 5, reading: 'ご' },
  { value: 6, reading: 'ろく' },
  { value: 7, reading: 'しち', exceptionNote: 'Exception — read しちじ, never ななじ.' },
  { value: 8, reading: 'はち' },
  { value: 9, reading: 'く', exceptionNote: 'Exception — read くじ, never きゅうじ.' },
  { value: 10, reading: 'じゅう' },
  { value: 11, reading: 'じゅういち' },
  { value: 12, reading: 'じゅうに' },
];

const HOUR_NAMES = [
  "One o'clock",
  "Two o'clock",
  "Three o'clock",
  "Four o'clock",
  "Five o'clock",
  "Six o'clock",
  "Seven o'clock",
  "Eight o'clock",
  "Nine o'clock",
  "Ten o'clock",
  "Eleven o'clock",
  "Twelve o'clock",
];

function hourKanji(value: number, reading: string): FuriganaSegment[] {
  return [
    { text: NUMBER_KANJI[value], reading },
    { text: '時', reading: 'じ' },
  ];
}

interface MinuteDef {
  value: number;
  numberReading: string;
  funReading: string;
  note?: string;
}

/** 分 alternates between ふん and ぷん, and several numbers themselves contract (いち→いっ, etc.). */
const MINUTES: MinuteDef[] = [
  { value: 1, numberReading: 'いっ', funReading: 'ぷん' },
  { value: 2, numberReading: 'に', funReading: 'ふん' },
  { value: 3, numberReading: 'さん', funReading: 'ぷん' },
  { value: 4, numberReading: 'よん', funReading: 'ぷん' },
  { value: 5, numberReading: 'ご', funReading: 'ふん' },
  { value: 6, numberReading: 'ろっ', funReading: 'ぷん' },
  { value: 7, numberReading: 'なな', funReading: 'ふん' },
  { value: 8, numberReading: 'はっ', funReading: 'ぷん' },
  { value: 9, numberReading: 'きゅう', funReading: 'ふん' },
  { value: 10, numberReading: 'じゅっ', funReading: 'ぷん', note: 'Also heard as じっぷん.' },
];

function minuteKanji(value: number, numberReading: string, funReading: string): FuriganaSegment[] {
  return [
    { text: NUMBER_KANJI[value], reading: numberReading },
    { text: '分', reading: funReading },
  ];
}

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
  {
    id: 'greetings-and-phrases',
    label: 'Greetings & Common Phrases',
    description:
      'Everyday greetings and set phrases for starting, continuing, and ending a conversation.',
    tables: [
      {
        id: 'greetings',
        title: 'Greetings',
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
          { english: 'Good morning', japanese: 'おはようございます' },
          { english: 'Hello / Good afternoon', japanese: 'こんにちは' },
          { english: 'Good evening', japanese: 'こんばんは' },
          { english: 'Good night', japanese: 'おやすみなさい' },
          { english: 'Goodbye', japanese: 'さようなら' },
          { english: 'See you later', japanese: 'またね' },
          {
            english: 'Long time no see',
            japanese: [{ text: 'お' }, { text: '久', reading: 'ひさ' }, { text: 'しぶりです' }],
          },
        ],
      },
      {
        id: 'common-phrases',
        title: 'Common Phrases',
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
          { english: 'Thank you', japanese: 'ありがとう' },
          { english: 'Thank you very much', japanese: 'ありがとうございます' },
          { english: "You're welcome", japanese: 'どういたしまして' },
          {
            english: 'Excuse me / Sorry',
            japanese: 'すみません',
            note: 'Also doubles as "excuse me" to get someone\'s attention.',
          },
          { english: "I'm sorry", japanese: 'ごめんなさい' },
          {
            english: 'Please (asking for something)',
            japanese: [{ text: 'お' }, { text: '願', reading: 'ねが' }, { text: 'いします' }],
          },
          { english: 'Please (go ahead / after you)', japanese: 'どうぞ' },
          { english: 'Nice to meet you', japanese: 'はじめまして' },
          {
            english: 'How are you?',
            japanese: [{ text: 'お' }, { text: '元気', reading: 'げんき' }, { text: 'ですか' }],
          },
          {
            english: "I'm fine",
            japanese: [{ text: '元気', reading: 'げんき' }, { text: 'です' }],
          },
          { english: 'Yes', japanese: 'はい' },
          { english: 'No', japanese: 'いいえ' },
          {
            english: 'Excuse me (entering/leaving, interrupting)',
            japanese: [{ text: '失礼', reading: 'しつれい' }, { text: 'します' }],
          },
          { english: 'Welcome! (said by shop staff)', japanese: 'いらっしゃいませ' },
        ],
      },
    ],
    mnemonics: [
      {
        term: '久しぶり — hisashiburi',
        title: 'A Long Gap',
        body: '久 on its own means "a long time" — 久しぶり literally marks that a long interval has passed since you last met.',
      },
      {
        term: '元気 — genki',
        title: 'Spirit Energy',
        body: '元 ("origin") + 気 ("energy/spirit") — asking if someone is "genki" is asking whether their life-energy is in good shape.',
      },
      {
        term: '失礼します — shitsurei shimasu',
        title: 'Committing a Small Rudeness',
        body: '失 ("to lose") + 礼 ("courtesy") — literally "I commit a discourtesy," said when interrupting, entering a room, or stepping away.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'common-phrases',
  },
  {
    id: 'question-words',
    label: 'Question Words',
    description: 'The core question words — who, what, when, where, why, how — plus "which".',
    tables: [
      {
        id: 'question-words-table',
        title: 'Question Words',
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
          { english: 'Who', japanese: 'だれ', note: 'Polite form: どなた.' },
          {
            english: 'What',
            japanese: [{ text: '何', reading: 'なに・なん' }],
            note: 'なん before で/と/の and before counters; なに elsewhere.',
          },
          { english: 'When', japanese: 'いつ' },
          { english: 'Where', japanese: 'どこ' },
          {
            english: 'Why',
            japanese: 'なぜ',
            note: 'どうして and 何で (なんで) are common casual alternatives.',
          },
          {
            english: 'How',
            japanese: 'どう',
            note: 'どうやって = "how" when asking about a method.',
          },
          { english: 'Which (of two)', japanese: 'どちら', note: 'Casual: どっち.' },
          { english: 'Which (of three or more)', japanese: 'どれ' },
          { english: 'How much (price)', japanese: 'いくら' },
          { english: 'How many', japanese: 'いくつ' },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'ど〜 words',
        title: 'The "Do-" Question Family',
        body: 'Most question words besides だれ・いつ・なに・なぜ start with ど — どこ, どう, どちら, どれ, どうして. Spotting that "do" prefix is a fast signal a word is asking a question.',
      },
    ],
    mnemonicsSize: 'full',
  },
  {
    id: 'numbers-and-counters',
    label: 'Numbers & Counters',
    description:
      'Numbers 1–10 (plus 100 and 1000), the native-Japanese counting sequence used for generic objects, and the specific counter words that attach to people, animals, and other categories of thing.',
    tables: [
      {
        id: 'numbers',
        title: 'Numbers',
        columns: [
          { key: 'value', label: 'Number' },
          {
            key: 'kanji',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'kanji',
        size: 'half',
        rows: [
          { value: '0', kanji: 'ゼロ', note: 'Native alternative: 〇 (れい).' },
          { value: '1', kanji: [{ text: '一', reading: 'いち' }] },
          { value: '2', kanji: [{ text: '二', reading: 'に' }] },
          { value: '3', kanji: [{ text: '三', reading: 'さん' }] },
          {
            value: '4',
            kanji: [{ text: '四', reading: 'よん' }],
            note: 'Alternative reading: し (avoided in some contexts since it sounds like 死, "death").',
          },
          { value: '5', kanji: [{ text: '五', reading: 'ご' }] },
          { value: '6', kanji: [{ text: '六', reading: 'ろく' }] },
          {
            value: '7',
            kanji: [{ text: '七', reading: 'なな' }],
            note: 'Alternative reading: しち.',
          },
          { value: '8', kanji: [{ text: '八', reading: 'はち' }] },
          {
            value: '9',
            kanji: [{ text: '九', reading: 'きゅう' }],
            note: 'Alternative reading: く (as in 九月, くがつ).',
          },
          { value: '10', kanji: [{ text: '十', reading: 'じゅう' }] },
          { value: '100', kanji: [{ text: '百', reading: 'ひゃく' }] },
          { value: '1,000', kanji: [{ text: '千', reading: 'せん' }] },
        ],
      },
      {
        id: 'tsu-counter',
        title: 'Counting Objects (native-Japanese 1–10)',
        description:
          'The "つ" counter is the generic, catch-all way to count objects, and uses the older native-Japanese number sequence rather than the いち・に・さん readings above.',
        columns: [
          { key: 'value', label: 'Number' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
        ],
        practiceFrontKey: 'japanese',
        size: 'half',
        rows: [
          { value: '1', japanese: [{ text: '一', reading: 'ひと' }, { text: 'つ' }] },
          { value: '2', japanese: [{ text: '二', reading: 'ふた' }, { text: 'つ' }] },
          { value: '3', japanese: [{ text: '三', reading: 'みっ' }, { text: 'つ' }] },
          { value: '4', japanese: [{ text: '四', reading: 'よっ' }, { text: 'つ' }] },
          { value: '5', japanese: [{ text: '五', reading: 'いつ' }, { text: 'つ' }] },
          { value: '6', japanese: [{ text: '六', reading: 'むっ' }, { text: 'つ' }] },
          { value: '7', japanese: [{ text: '七', reading: 'なな' }, { text: 'つ' }] },
          { value: '8', japanese: [{ text: '八', reading: 'やっ' }, { text: 'つ' }] },
          { value: '9', japanese: [{ text: '九', reading: 'ここの' }, { text: 'つ' }] },
          { value: '10', japanese: [{ text: '十', reading: 'とお' }] },
        ],
      },
      {
        id: 'common-counters',
        title: 'Common Counters',
        description:
          "Japanese attaches a different counter word to a number depending on what's being counted.",
        columns: [
          { key: 'category', label: 'Counts' },
          {
            key: 'counter',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'counter',
        size: 'full',
        rows: [
          {
            category: 'People',
            counter: [{ text: '人', reading: 'にん' }],
            note: '1 and 2 people are exceptions: 一人 (ひとり), 二人 (ふたり). 3+ uses にん (三人, 四人…).',
          },
          {
            category: 'Thin, flat objects (paper, tickets, plates)',
            counter: [{ text: '枚', reading: 'まい' }],
          },
          {
            category: 'Long, thin objects (pens, bottles, umbrellas)',
            counter: [{ text: '本', reading: 'ほん' }],
            note: 'Shifts to ぼん after 3 and ぽん after 1/6/8/10 for ease of pronunciation.',
          },
          {
            category: 'Small animals (cats, dogs, insects)',
            counter: [{ text: '匹', reading: 'ひき' }],
            note: 'Shifts to びき/ぴき the same way 本 does.',
          },
          {
            category: 'Bound volumes (books, magazines)',
            counter: [{ text: '冊', reading: 'さつ' }],
          },
          {
            category: 'Machines & vehicles (cars, bikes, TVs)',
            counter: [{ text: '台', reading: 'だい' }],
          },
          {
            category: 'Cups or glasses of liquid',
            counter: [{ text: '杯', reading: 'はい' }],
            note: 'Shifts to ばい/ぱい the same way 本 does.',
          },
          {
            category: 'Floors of a building',
            counter: [{ text: '階', reading: 'かい' }],
          },
          {
            category: 'Age, in years',
            counter: [{ text: '歳', reading: 'さい' }],
            note: '20 years old has a special reading, はたち, instead of にじゅっさい.',
          },
          {
            category: 'Generic / miscellaneous objects',
            counter: 'つ',
            note: 'The catch-all native-Japanese sequence (一つ・二つ…) in the table above — use it whenever nothing more specific applies.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '本・匹・杯 sound changes',
        title: 'One Shared Pattern',
        body: '本, 匹, and 杯 all soften the same way after 1, 6, 8, and 10 (いっぽん, ろっぽん, はっぽん, じゅっぽん) — learn the pattern once on 本 and it transfers to the other two.',
      },
      {
        term: '一人・二人',
        title: 'The Two People Exceptions',
        body: 'Nearly every counter is regular from 1 onward, but people are the odd one out: 一人 (ひとり) and 二人 (ふたり) use old native readings instead of いちにん/ににん.',
      },
      {
        term: '十 → とお',
        title: 'Ten Breaks the Pattern',
        body: 'Every other native-Japanese count word ends in つ (みっつ, よっつ…), but 10 is simply とお — no つ attached.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'common-counters',
  },
  {
    id: 'months-and-seasons',
    label: 'Months & Seasons',
    description:
      'Months are literally numbered ("month one" through "month twelve") — the hard part is the three irregular readings at 4, 7, and 9.',
    tables: [
      {
        id: 'months',
        title: 'Months',
        columns: [
          { key: 'month', label: 'Month' },
          {
            key: 'kanji',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'kanji',
        size: 'full',
        rows: MONTHS.map((m) => {
          const row: Record<string, string | FuriganaSegment[]> = {
            month: MONTH_NAMES[m.value - 1],
            kanji: monthKanji(m.value, m.reading),
          };
          if (m.exceptionNote) row['note'] = m.exceptionNote;
          return row;
        }),
      },
      {
        id: 'seasons',
        title: 'Seasons',
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
          { english: 'Spring', japanese: [{ text: '春', reading: 'はる' }] },
          { english: 'Summer', japanese: [{ text: '夏', reading: 'なつ' }] },
          { english: 'Autumn / Fall', japanese: [{ text: '秋', reading: 'あき' }] },
          { english: 'Winter', japanese: [{ text: '冬', reading: 'ふゆ' }] },
          { english: 'The four seasons', japanese: [{ text: '四季', reading: 'しき' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '4, 7, 9 are always the oddballs',
        title: 'The Recurring Exceptions',
        body: "The same three numbers — 4, 7, and 9 — break the regular pattern in months, hours, and ages alike. Once you've memorized しがつ/しちがつ/くがつ here, you'll recognize the same shape everywhere else.",
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'months',
  },
  {
    id: 'time-expressions',
    label: 'Time Expressions',
    description:
      'Telling the time (hours and minutes), the vocabulary for describing it, and relative week/month/year expressions — the today/yesterday/tomorrow set lives in Days of the Week & Calendar.',
    tables: [
      {
        id: 'hours',
        title: 'Hours (〜時)',
        columns: [
          { key: 'hour', label: 'Hour' },
          {
            key: 'kanji',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'kanji',
        size: 'half',
        rows: HOURS.map((h) => {
          const row: Record<string, string | FuriganaSegment[]> = {
            hour: HOUR_NAMES[h.value - 1],
            kanji: hourKanji(h.value, h.reading),
          };
          if (h.exceptionNote) row['note'] = h.exceptionNote;
          return row;
        }),
      },
      {
        id: 'minutes',
        title: 'Minutes (〜分)',
        columns: [
          { key: 'minute', label: 'Minutes' },
          {
            key: 'kanji',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'kanji',
        size: 'half',
        rows: MINUTES.map((m) => {
          const row: Record<string, string | FuriganaSegment[]> = {
            minute: `${m.value} minute${m.value === 1 ? '' : 's'}`,
            kanji: minuteKanji(m.value, m.numberReading, m.funReading),
          };
          if (m.note) row['note'] = m.note;
          return row;
        }),
      },
      {
        id: 'asking-and-describing-time',
        title: 'Asking & Describing Time',
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
          {
            english: 'What time is it?',
            japanese: [
              { text: '何', reading: 'なん' },
              { text: '時', reading: 'じ' },
              { text: 'ですか' },
            ],
          },
          {
            english: "At ... o'clock",
            japanese: [{ text: '時', reading: 'じ' }, { text: 'に' }],
            note: 'に marks the time something happens, e.g. 三時に (さんじに), "at three o\'clock".',
          },
          { english: 'Now', japanese: [{ text: '今', reading: 'いま' }] },
          {
            english: 'Half past / :30',
            japanese: [{ text: '半', reading: 'はん' }],
            note: '三時半 (さんじはん) = "half past three".',
          },
          { english: 'AM', japanese: [{ text: '午前', reading: 'ごぜん' }] },
          { english: 'PM', japanese: [{ text: '午後', reading: 'ごご' }] },
          { english: "o'clock (hour counter)", japanese: [{ text: '時', reading: 'じ' }] },
          { english: 'minute (minute counter)', japanese: [{ text: '分', reading: 'ふん・ぷん' }] },
        ],
      },
      {
        id: 'relative-time-weeks-months-years',
        title: 'Weeks, Months & Years',
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
          { english: 'This week', japanese: [{ text: '今週', reading: 'こんしゅう' }] },
          { english: 'Last week', japanese: [{ text: '先週', reading: 'せんしゅう' }] },
          { english: 'Next week', japanese: [{ text: '来週', reading: 'らいしゅう' }] },
          { english: 'This month', japanese: [{ text: '今月', reading: 'こんげつ' }] },
          { english: 'Last month', japanese: [{ text: '先月', reading: 'せんげつ' }] },
          { english: 'Next month', japanese: [{ text: '来月', reading: 'らいげつ' }] },
          {
            english: 'This year',
            japanese: [{ text: '今年', reading: 'ことし' }],
            note: 'Irregular reading — not こんねん in everyday speech.',
          },
          {
            english: 'Last year',
            japanese: [{ text: '去年', reading: 'きょねん' }],
            note: '昨年 (さくねん) is a more formal synonym.',
          },
          { english: 'Next year', japanese: [{ text: '来年', reading: 'らいねん' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '今・先・来 + 週・月・年',
        title: 'A Grammar Formula, Not Six New Words',
        body: '今 ("this"), 先 ("previous"), and 来 ("next") combine with 週 ("week"), 月 ("month"), and 年 ("year") to produce all nine this/last/next expressions above — learn the two small sets and multiply them together instead of memorizing nine separate words.',
      },
      {
        term: '4, 7, 9 strike again',
        title: 'Same Exceptions as the Months Chart',
        body: 'よじ, しちじ, and くじ break the pattern for the exact same three numbers that are irregular for months — the exceptions are consistent across the language, not random per chart.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'relative-time-weeks-months-years',
  },
];
