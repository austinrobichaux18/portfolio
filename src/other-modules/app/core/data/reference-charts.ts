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
  {
    id: 'colors-and-shapes',
    label: 'Colors & Shapes',
    description:
      'Basic colors and shapes — note that several colors are i-adjectives (end in い and conjugate on their own) while others are nouns that need の to describe something.',
    tables: [
      {
        id: 'colors',
        title: 'Colors',
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
        size: 'half',
        rows: [
          {
            english: 'Red',
            japanese: [{ text: '赤', reading: 'あか' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'Blue',
            japanese: [{ text: '青', reading: 'あお' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'Yellow',
            japanese: [{ text: '黄色', reading: 'きいろ' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'Black',
            japanese: [{ text: '黒', reading: 'くろ' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'White',
            japanese: [{ text: '白', reading: 'しろ' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'Green',
            japanese: [{ text: '緑', reading: 'みどり' }],
            note: 'Noun — use 緑の to describe something. Often paired with 色 as 緑色 (みどりいろ).',
          },
          {
            english: 'Brown',
            japanese: [{ text: '茶色', reading: 'ちゃいろ' }],
            note: 'Noun — use 茶色の to describe something.',
          },
          {
            english: 'Purple',
            japanese: [{ text: '紫', reading: 'むらさき' }],
            note: 'Noun — use 紫の to describe something.',
          },
          { english: 'Pink', japanese: 'ピンク', note: 'Noun (loanword) — use ピンクの.' },
          { english: 'Orange', japanese: 'オレンジ', note: 'Noun (loanword) — use オレンジの.' },
          {
            english: 'Gray',
            japanese: [{ text: '灰色', reading: 'はいいろ' }],
            note: 'Noun — use 灰色の to describe something.',
          },
        ],
      },
      {
        id: 'shapes',
        title: 'Shapes',
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
          { english: 'Circle', japanese: [{ text: '丸', reading: 'まる' }] },
          { english: 'Triangle', japanese: [{ text: '三角', reading: 'さんかく' }] },
          { english: 'Square', japanese: [{ text: '四角', reading: 'しかく' }] },
          { english: 'Rectangle', japanese: [{ text: '長方形', reading: 'ちょうほうけい' }] },
          { english: 'Star', japanese: [{ text: '星', reading: 'ほし' }] },
          { english: 'Heart', japanese: 'ハート' },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'い colors vs. noun colors',
        title: 'Two Different Grammar Patterns',
        body: '赤・青・黄色・黒・白 are true i-adjectives — they conjugate on their own (赤くない, "not red"). 緑・茶色・紫・ピンク・オレンジ・灰色 are nouns, so they need の to modify something (緑の車, "a green car") and can\'t conjugate the same way.',
      },
      {
        term: '色 — "color"',
        title: 'The Shared Suffix',
        body: '色 (いろ) literally means "color" and shows up inside several noun-colors — 茶色 ("tea color" = brown), 灰色 ("ash color" = gray) — a useful hook for remembering which colors are nouns.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'colors',
  },
  {
    id: 'family-terms',
    label: 'Family Terms',
    description:
      "Japanese uses one set of plain words for your own family and a separate, more honorific set for someone else's family — the honorific set doubles as how you address your own relatives directly.",
    tables: [
      {
        id: 'own-family',
        title: 'Your Own Family',
        description: 'Used when talking about your own family to someone else.',
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
          { english: 'Father', japanese: [{ text: '父', reading: 'ちち' }] },
          { english: 'Mother', japanese: [{ text: '母', reading: 'はは' }] },
          { english: 'Older brother', japanese: [{ text: '兄', reading: 'あに' }] },
          { english: 'Older sister', japanese: [{ text: '姉', reading: 'あね' }] },
          { english: 'Younger brother', japanese: [{ text: '弟', reading: 'おとうと' }] },
          { english: 'Younger sister', japanese: [{ text: '妹', reading: 'いもうと' }] },
          { english: 'Grandfather', japanese: [{ text: '祖父', reading: 'そふ' }] },
          { english: 'Grandmother', japanese: [{ text: '祖母', reading: 'そぼ' }] },
          { english: 'Husband', japanese: [{ text: '夫', reading: 'おっと' }] },
          { english: 'Wife', japanese: [{ text: '妻', reading: 'つま' }] },
          { english: 'Son', japanese: [{ text: '息子', reading: 'むすこ' }] },
          { english: 'Daughter', japanese: [{ text: '娘', reading: 'むすめ' }] },
          { english: 'Family', japanese: [{ text: '家族', reading: 'かぞく' }] },
        ],
      },
      {
        id: 'other-family',
        title: "Someone Else's Family (honorific)",
        description:
          "Used when talking about someone else's family — and also when addressing your own relatives directly, e.g. calling out お母さん to your own mother.",
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
          { english: 'Father', japanese: [{ text: 'お父', reading: 'おとう' }, { text: 'さん' }] },
          { english: 'Mother', japanese: [{ text: 'お母', reading: 'おかあ' }, { text: 'さん' }] },
          {
            english: 'Older brother',
            japanese: [{ text: 'お兄', reading: 'おにい' }, { text: 'さん' }],
          },
          {
            english: 'Older sister',
            japanese: [{ text: 'お姉', reading: 'おねえ' }, { text: 'さん' }],
          },
          {
            english: 'Younger brother',
            japanese: [{ text: '弟', reading: 'おとうと' }, { text: 'さん' }],
          },
          {
            english: 'Younger sister',
            japanese: [{ text: '妹', reading: 'いもうと' }, { text: 'さん' }],
          },
          { english: 'Grandfather', japanese: 'おじいさん' },
          { english: 'Grandmother', japanese: 'おばあさん' },
          {
            english: 'Husband',
            japanese: [{ text: '旦那', reading: 'だんな' }, { text: 'さん' }],
          },
          { english: 'Wife', japanese: [{ text: '奥', reading: 'おく' }, { text: 'さん' }] },
          {
            english: 'Son',
            japanese: [{ text: '息子', reading: 'むすこ' }, { text: 'さん' }],
          },
          {
            english: 'Daughter',
            japanese: [{ text: '娘', reading: 'むすめ' }, { text: 'さん' }],
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'さん makes it honorific',
        title: 'The Same Suffix, Every Time',
        body: 'Nearly every "someone else\'s family" word is the plain word (or its respectful root) plus さん — 弟さん, 息子さん, 娘さん — the same pattern used for people\'s names.',
      },
      {
        term: '兄・姉 vs 弟・妹',
        title: 'No Plain Word for "Brother" or "Sister"',
        body: 'Japanese has no single word for "brother" or "sister" without specifying age — 兄/姉 always mean older, 弟/妹 always mean younger. There\'s no way to say just "sibling" without picking one.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'other-family',
  },
  {
    id: 'weather-terms',
    label: 'Weather Terms',
    description: 'Common weather vocabulary for small talk and forecasts.',
    tables: [
      {
        id: 'weather-conditions',
        title: 'Weather Conditions',
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
          { english: 'Sunny / Clear', japanese: [{ text: '晴れ', reading: 'はれ' }] },
          { english: 'Cloudy', japanese: [{ text: '曇り', reading: 'くもり' }] },
          { english: 'Rain', japanese: [{ text: '雨', reading: 'あめ' }] },
          { english: 'Snow', japanese: [{ text: '雪', reading: 'ゆき' }] },
          { english: 'Wind', japanese: [{ text: '風', reading: 'かぜ' }] },
          { english: 'Typhoon', japanese: [{ text: '台風', reading: 'たいふう' }] },
          { english: 'Thunder / Lightning', japanese: [{ text: '雷', reading: 'かみなり' }] },
          { english: 'Fog', japanese: [{ text: '霧', reading: 'きり' }] },
        ],
      },
      {
        id: 'describing-weather',
        title: 'Describing the Weather',
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
            english: 'Hot (weather/air)',
            japanese: [{ text: '暑', reading: 'あつ' }, { text: 'い' }],
            note: 'For weather and ambient temperature — not the same word as 熱い below.',
          },
          {
            english: 'Cold (weather)',
            japanese: [{ text: '寒', reading: 'さむ' }, { text: 'い' }],
          },
          {
            english: 'Cold (to the touch)',
            japanese: [{ text: '冷た', reading: 'つめた' }, { text: 'い' }],
            note: 'For objects and drinks, not air temperature — e.g. 冷たい水, "cold water".',
          },
          {
            english: 'Hot (to the touch)',
            japanese: [{ text: '熱', reading: 'あつ' }, { text: 'い' }],
            note: 'Same pronunciation as 暑い but a different kanji — for objects/liquids, e.g. 熱いお茶, "hot tea".',
          },
          { english: 'Warm', japanese: [{ text: '暖か', reading: 'あたたか' }, { text: 'い' }] },
          { english: 'Cool', japanese: [{ text: '涼し', reading: 'すずし' }, { text: 'い' }] },
          {
            english: "What's the weather like?",
            japanese: [{ text: '天気', reading: 'てんき' }, { text: 'はどうですか' }],
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '暑い vs 熱い',
        title: 'Same Sound, Different Kanji',
        body: 'Both read あつい, but 暑い describes the weather or the air around you, while 熱い describes a hot object or liquid — the kanji tells you which "hot" is meant.',
      },
      {
        term: '寒い vs 冷たい',
        title: 'Weather-Cold vs. Object-Cold',
        body: '寒い is only for ambient/weather cold ("it\'s cold outside"); 冷たい is for a specific cold object or drink ("this water is cold"). Mixing them up is a classic beginner slip.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'describing-weather',
  },
  {
    id: 'body-parts',
    label: 'Body Parts',
    description: 'Common body-part vocabulary, head to toe.',
    tables: [
      {
        id: 'head-and-face',
        title: 'Head & Face',
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
          { english: 'Head', japanese: [{ text: '頭', reading: 'あたま' }] },
          { english: 'Face', japanese: [{ text: '顔', reading: 'かお' }] },
          { english: 'Eye', japanese: [{ text: '目', reading: 'め' }] },
          { english: 'Ear', japanese: [{ text: '耳', reading: 'みみ' }] },
          { english: 'Nose', japanese: [{ text: '鼻', reading: 'はな' }] },
          { english: 'Mouth', japanese: [{ text: '口', reading: 'くち' }] },
          { english: 'Tooth / teeth', japanese: [{ text: '歯', reading: 'は' }] },
          { english: 'Hair', japanese: [{ text: '髪', reading: 'かみ' }] },
          { english: 'Neck', japanese: [{ text: '首', reading: 'くび' }] },
        ],
      },
      {
        id: 'body-and-limbs',
        title: 'Body & Limbs',
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
        size: 'half',
        rows: [
          { english: 'Shoulder', japanese: [{ text: '肩', reading: 'かた' }] },
          { english: 'Arm', japanese: [{ text: '腕', reading: 'うで' }] },
          { english: 'Hand', japanese: [{ text: '手', reading: 'て' }] },
          { english: 'Finger', japanese: [{ text: '指', reading: 'ゆび' }] },
          { english: 'Stomach / belly', japanese: [{ text: 'お腹', reading: 'おなか' }] },
          { english: 'Back', japanese: [{ text: '背中', reading: 'せなか' }] },
          {
            english: 'Leg / foot',
            japanese: [{ text: '足', reading: 'あし' }],
            note: 'One word covers both "leg" and "foot" — context decides which.',
          },
          { english: 'Knee', japanese: [{ text: '膝', reading: 'ひざ' }] },
          {
            english: 'Heart (organ)',
            japanese: [{ text: '心臓', reading: 'しんぞう' }],
            note: 'The physical organ. 心 (こころ) means "heart" in the emotional/mind sense instead.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '目・耳・鼻・口',
        title: 'The Face, Front and Center',
        body: 'These four kanji for eye, ear, nose, and mouth are among the first ever taught precisely because they\'re simple pictograms of the body part itself — worth learning to actually "see" rather than just memorize.',
      },
      {
        term: '心 vs 心臓',
        title: 'Heart the Feeling vs. Heart the Organ',
        body: '心 (こころ) is the figurative heart — feelings, mind, spirit. 心臓 (しんぞう) is the physical organ that pumps blood. English uses "heart" for both; Japanese keeps them separate.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'body-and-limbs',
  },
  {
    id: 'food-and-drink-basics',
    label: 'Food & Drink Basics',
    description:
      'Common foods, fruits, vegetables, and drinks, plus the set phrases said before and after a meal.',
    tables: [
      {
        id: 'meals-and-staples',
        title: 'Meals & Staples',
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
        size: 'half',
        rows: [
          {
            english: 'Rice / A meal',
            japanese: [{ text: 'ご' }, { text: '飯', reading: 'はん' }],
            note: 'Means both "cooked rice" and "a meal" in general.',
          },
          { english: 'Bread', japanese: 'パン' },
          { english: 'Meat', japanese: [{ text: '肉', reading: 'にく' }] },
          { english: 'Fish', japanese: [{ text: '魚', reading: 'さかな' }] },
          { english: 'Vegetables', japanese: [{ text: '野菜', reading: 'やさい' }] },
          { english: 'Fruit', japanese: [{ text: '果物', reading: 'くだもの' }] },
          { english: 'Egg', japanese: [{ text: '卵', reading: 'たまご' }] },
          { english: 'Soup', japanese: 'スープ' },
          { english: 'Noodles', japanese: [{ text: '麺', reading: 'めん' }] },
        ],
      },
      {
        id: 'fruits-and-vegetables',
        title: 'Common Fruits & Vegetables',
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
          { english: 'Apple', japanese: 'りんご' },
          { english: 'Banana', japanese: 'バナナ' },
          { english: 'Mandarin orange', japanese: 'みかん' },
          { english: 'Strawberry', japanese: 'いちご' },
          { english: 'Grape', japanese: 'ぶどう' },
          { english: 'Tomato', japanese: 'トマト' },
          { english: 'Carrot', japanese: 'にんじん' },
          { english: 'Potato', japanese: 'じゃがいも' },
          { english: 'Onion', japanese: 'たまねぎ' },
        ],
      },
      {
        id: 'drinks',
        title: 'Drinks',
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
        size: 'half',
        rows: [
          { english: 'Water', japanese: [{ text: '水', reading: 'みず' }] },
          { english: 'Tea', japanese: [{ text: 'お茶', reading: 'おちゃ' }] },
          { english: 'Coffee', japanese: 'コーヒー' },
          {
            english: 'Milk',
            japanese: [{ text: '牛乳', reading: 'ぎゅうにゅう' }],
            note: 'Casual synonym: ミルク.',
          },
          { english: 'Juice', japanese: 'ジュース' },
          {
            english: 'Alcohol',
            japanese: [{ text: 'お酒', reading: 'おさけ' }],
            note: 'General word for alcoholic drinks, not just sake.',
          },
          { english: 'Beer', japanese: 'ビール' },
        ],
      },
      {
        id: 'meal-phrases',
        title: 'Meal Phrases',
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
            english: 'Said before eating',
            japanese: 'いただきます',
            note: 'Roughly "I gratefully receive this" — said before starting a meal.',
          },
          {
            english: 'Said after finishing a meal',
            japanese: 'ごちそうさまでした',
            note: 'Roughly "thank you for the feast" — said after eating.',
          },
          { english: 'Delicious', japanese: 'おいしい', note: 'i-adjective.' },
          { english: 'Not tasty', japanese: 'まずい', note: 'i-adjective.' },
          {
            english: "I'm hungry",
            japanese: [
              { text: 'お' },
              { text: '腹', reading: 'なか' },
              { text: 'が' },
              { text: '空', reading: 'す' },
              { text: 'いた' },
            ],
          },
          {
            english: "I'm full",
            japanese: [{ text: 'お' }, { text: '腹', reading: 'なか' }, { text: 'がいっぱい' }],
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'いただきます・ごちそうさまでした',
        title: 'Bracketing the Meal',
        body: "English has no exact equivalent to either phrase — they're fixed social bookends said at the start and end of a meal, regardless of who cooked it or whether anyone else is present.",
      },
      {
        term: 'ご飯 — rice and "a meal"',
        title: 'One Word, Two Meanings',
        body: 'ご飯 literally means cooked rice, but because rice is the centerpiece of a traditional meal, it also casually means "a meal" in general — 朝ご飯 (asagohan) is "breakfast," not "morning rice".',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'meal-phrases',
  },
];
