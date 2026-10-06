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
        size: 'third',
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
        size: 'third',
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
        size: 'third',
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
        size: 'third',
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
        ],
        practiceFrontKey: 'japanese',
        size: 'third',
        rows: [
          { english: 'Thank you', japanese: 'ありがとう' },
          { english: 'Thank you very much', japanese: 'ありがとうございます' },
          { english: "You're welcome", japanese: 'どういたしまして' },
          { english: 'Excuse me / Sorry', japanese: 'すみません' },
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
    mnemonicsSize: 'third',
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
        size: 'half',
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
    mnemonicsSize: 'half',
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
        size: 'quarter',
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
        size: 'quarter',
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
        size: 'half',
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
        size: 'third',
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
        size: 'third',
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
    mnemonicsSize: 'third',
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
        size: 'quarter',
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
        size: 'quarter',
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
        size: 'half',
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
        size: 'half',
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
    mnemonicsSize: 'half',
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
        size: 'third',
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
        size: 'third',
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
    mnemonicsSize: 'third',
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
        size: 'third',
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
        size: 'third',
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
    mnemonicsSize: 'third',
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
        size: 'third',
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
        size: 'third',
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
    mnemonicsSize: 'third',
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
        size: 'third',
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
        size: 'third',
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
    mnemonicsSize: 'third',
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
        size: 'third',
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
        size: 'third',
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
        size: 'third',
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
        size: 'half',
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
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'meal-phrases',
  },
  {
    id: 'animals',
    label: 'Animals',
    description:
      'Common pets and animals you\'ll meet in conversation, at the zoo, or out in nature.',
    tables: [
      {
        id: 'pets-and-farm-animals',
        title: 'Pets & Farm Animals',
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
        size: 'third',
        rows: [
          { english: 'Dog', japanese: [{ text: '犬', reading: 'いぬ' }] },
          { english: 'Cat', japanese: [{ text: '猫', reading: 'ねこ' }] },
          { english: 'Bird', japanese: [{ text: '鳥', reading: 'とり' }] },
          { english: 'Rabbit', japanese: 'うさぎ' },
          { english: 'Hamster', japanese: 'ハムスター' },
          { english: 'Horse', japanese: [{ text: '馬', reading: 'うま' }] },
          { english: 'Cow', japanese: [{ text: '牛', reading: 'うし' }] },
          { english: 'Pig', japanese: [{ text: '豚', reading: 'ぶた' }] },
          {
            english: 'Goldfish',
            japanese: [{ text: '金魚', reading: 'きんぎょ' }],
            note: 'The common pet fish — distinct from 魚 (さかな), the general word for "fish" used in Food & Drink Basics.',
          },
        ],
      },
      {
        id: 'wild-animals',
        title: 'Wild Animals',
        columns: [
          { key: 'english', label: [{ text: '英語', reading: 'えいご' }], tooltip: 'English' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
        ],
        practiceFrontKey: 'japanese',
        size: 'third',
        rows: [
          { english: 'Lion', japanese: 'ライオン' },
          { english: 'Tiger', japanese: [{ text: '虎', reading: 'とら' }] },
          { english: 'Elephant', japanese: [{ text: '象', reading: 'ぞう' }] },
          { english: 'Monkey', japanese: [{ text: '猿', reading: 'さる' }] },
          { english: 'Bear', japanese: [{ text: '熊', reading: 'くま' }] },
          { english: 'Fox', japanese: [{ text: '狐', reading: 'きつね' }] },
          { english: 'Wolf', japanese: [{ text: '狼', reading: 'おおかみ' }] },
          { english: 'Snake', japanese: [{ text: '蛇', reading: 'へび' }] },
          { english: 'Frog', japanese: [{ text: '蛙', reading: 'かえる' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '犬 vs 大',
        title: 'One Extra Dot',
        body: '犬 ("dog") is 大 ("big") with one extra dot — picture a little dog\'s tail poking out next to its big friend.',
      },
      {
        term: '牛 vs 午',
        title: "The Cow's Horn",
        body: '牛 ("cow") and 午 (as in 午前/午後, "a.m./p.m.") look nearly identical — 牛 has one extra stroke poking through the top, like a horn.',
      },
    ],
    mnemonicsSize: 'third',
    mnemonicsAfterTableId: 'wild-animals',
  },
  {
    id: 'places',
    label: 'Places',
    description:
      'Everyday locations around town — where you catch a train, see a doctor, or grab a bite.',
    tables: [
      {
        id: 'places-around-town',
        title: 'Places Around Town',
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
          { english: 'Station', japanese: [{ text: '駅', reading: 'えき' }] },
          { english: 'School', japanese: [{ text: '学校', reading: 'がっこう' }] },
          { english: 'Hospital', japanese: [{ text: '病院', reading: 'びょういん' }] },
          { english: 'Restaurant', japanese: 'レストラン' },
          { english: 'Store / Shop', japanese: [{ text: '店', reading: 'みせ' }] },
          { english: 'Park', japanese: [{ text: '公園', reading: 'こうえん' }] },
          { english: 'Library', japanese: [{ text: '図書館', reading: 'としょかん' }] },
          { english: 'Bank', japanese: [{ text: '銀行', reading: 'ぎんこう' }] },
          { english: 'Supermarket', japanese: 'スーパー' },
          { english: 'Convenience store', japanese: 'コンビニ' },
        ],
      },
      {
        id: 'more-places-and-services',
        title: 'More Places & Services',
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
          { english: 'Post office', japanese: [{ text: '郵便局', reading: 'ゆうびんきょく' }] },
          { english: 'Airport', japanese: [{ text: '空港', reading: 'くうこう' }] },
          { english: 'Hotel', japanese: 'ホテル' },
          { english: 'Home / House', japanese: [{ text: '家', reading: 'いえ' }] },
          { english: 'Company / Workplace', japanese: [{ text: '会社', reading: 'かいしゃ' }] },
          { english: 'Museum', japanese: [{ text: '博物館', reading: 'はくぶつかん' }] },
          { english: 'Movie theater', japanese: [{ text: '映画館', reading: 'えいがかん' }] },
          {
            english: 'Restroom',
            japanese: [{ text: 'お手洗い', reading: 'おてあらい' }],
            note: 'トイレ is the common casual synonym.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '駅 — the horse radical',
        title: 'A Relic of the Relay Station',
        body: '駅 (えき, "station") contains 馬 ("horse") on the left — a nod to the old horse relay stations that trains later replaced.',
      },
      {
        term: '院 as an institution suffix',
        title: 'Recognize the Building',
        body: '院 shows up in 病院 ("hospital") and other institution words like 美容院 (びよういん, "beauty salon") — a useful suffix once you can spot it.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'more-places-and-services',
  },
  {
    id: 'directions-and-position',
    label: 'Directions & Position Words',
    description:
      'Compass directions plus the relative position words that attach to another noun with の (in front of, behind, near, far).',
    tables: [
      {
        id: 'compass-directions',
        title: 'Compass Directions',
        columns: [
          { key: 'english', label: [{ text: '英語', reading: 'えいご' }], tooltip: 'English' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
        ],
        practiceFrontKey: 'japanese',
        size: 'quarter',
        rows: [
          { english: 'North', japanese: [{ text: '北', reading: 'きた' }] },
          { english: 'South', japanese: [{ text: '南', reading: 'みなみ' }] },
          { english: 'East', japanese: [{ text: '東', reading: 'ひがし' }] },
          { english: 'West', japanese: [{ text: '西', reading: 'にし' }] },
        ],
      },
      {
        id: 'left-right-and-distance',
        title: 'Left, Right & Distance',
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
        size: 'third',
        rows: [
          { english: 'Left', japanese: [{ text: '左', reading: 'ひだり' }] },
          { english: 'Right', japanese: [{ text: '右', reading: 'みぎ' }] },
          {
            english: 'Near',
            japanese: [{ text: '近', reading: 'ちか' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          {
            english: 'Far',
            japanese: [{ text: '遠', reading: 'とお' }, { text: 'い' }],
            note: 'i-adjective.',
          },
          { english: 'Straight ahead', japanese: 'まっすぐ' },
        ],
      },
      {
        id: 'relative-position-words',
        title: 'Relative Position Words',
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
            english: 'In front (of)',
            japanese: [{ text: '前', reading: 'まえ' }],
            note: 'Attaches to another noun with の, e.g. 家の前 ("in front of the house").',
          },
          { english: 'Behind', japanese: [{ text: '後ろ', reading: 'うしろ' }] },
          { english: 'Inside', japanese: [{ text: '中', reading: 'なか' }] },
          { english: 'Outside', japanese: [{ text: '外', reading: 'そと' }] },
          { english: 'Above / On top', japanese: [{ text: '上', reading: 'うえ' }] },
          { english: 'Below / Under', japanese: [{ text: '下', reading: 'した' }] },
          { english: 'Next to / Beside', japanese: [{ text: '隣', reading: 'となり' }] },
          { english: 'Between', japanese: [{ text: '間', reading: 'あいだ' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '東西南北',
        title: 'One Set, Not Four Separate Words',
        body: 'The four compass kanji are often learned together as the compound 東西南北 (とうざいなんぼく), "the four directions" — if you know the compound, you already know all four.',
      },
      {
        term: 'Position nouns + の',
        title: 'Grammar, Not Just Vocabulary',
        body: 'Words like 前, 後ろ, 中, and 上 are nouns, not prepositions — they attach to another noun with の (テーブルの上, "on top of the table") rather than standing alone the way English "above"/"behind" do.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'relative-position-words',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    description:
      'Common modes of transportation and the vocabulary for getting around by train, car, or plane.',
    tables: [
      {
        id: 'vehicles',
        title: 'Vehicles',
        columns: [
          { key: 'english', label: [{ text: '英語', reading: 'えいご' }], tooltip: 'English' },
          {
            key: 'japanese',
            label: [{ text: '日本語', reading: 'にほんご' }],
            tooltip: 'Japanese',
          },
        ],
        practiceFrontKey: 'japanese',
        size: 'third',
        rows: [
          { english: 'Train', japanese: [{ text: '電車', reading: 'でんしゃ' }] },
          { english: 'Car', japanese: [{ text: '車', reading: 'くるま' }] },
          { english: 'Bus', japanese: 'バス' },
          { english: 'Bicycle', japanese: [{ text: '自転車', reading: 'じてんしゃ' }] },
          { english: 'Airplane', japanese: [{ text: '飛行機', reading: 'ひこうき' }] },
          { english: 'Taxi', japanese: 'タクシー' },
          { english: 'Subway', japanese: [{ text: '地下鉄', reading: 'ちかてつ' }] },
          { english: 'Ship / Boat', japanese: [{ text: '船', reading: 'ふね' }] },
          { english: 'Motorcycle', japanese: 'バイク' },
        ],
      },
      {
        id: 'getting-around-vocabulary',
        title: 'Getting Around',
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
          { english: 'Ticket', japanese: [{ text: '切符', reading: 'きっぷ' }] },
          { english: 'Fare', japanese: [{ text: '料金', reading: 'りょうきん' }] },
          { english: 'Platform', japanese: 'ホーム' },
          { english: 'Transfer (trains)', japanese: [{ text: '乗り換え', reading: 'のりかえ' }] },
          {
            english: 'To get on / board',
            japanese: [{ text: '乗', reading: 'の' }, { text: 'る' }],
          },
          {
            english: 'To get off (a vehicle)',
            japanese: [{ text: '降', reading: 'お' }, { text: 'りる' }],
          },
          {
            english: 'By (means of transport)',
            japanese: 'で',
            note: 'Attaches to the vehicle: 電車で行きます, "go by train".',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '車 as the "wheeled vehicle" root',
        title: 'Not Just "Car"',
        body: '車 shows up inside 電車 ("train," literally "electric car") and 自転車 ("bicycle," literally "self-turning car") — the kanji marks anything with wheels, not specifically an automobile.',
      },
      {
        term: '乗る vs 降りる',
        title: 'Boarding and Alighting Are a Pair',
        body: 'These opposite verbs for getting on and off a vehicle are worth memorizing together rather than separately — one almost always implies the other nearby in a sentence.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'getting-around-vocabulary',
  },
  {
    id: 'common-verbs',
    label: 'Common Verbs',
    description:
      'High-frequency verbs in both dictionary (plain) and polite (ます) form — the two forms you\'ll see constantly as a beginner.',
    tables: [
      {
        id: 'everyday-verbs',
        title: 'Everyday Verbs',
        description:
          'The dictionary form is plain/casual speech; the ます form is the polite form used with people you don\'t know well.',
        columns: [
          { key: 'english', label: 'English' },
          {
            key: 'dictionary',
            label: [{ text: '辞書形', reading: 'じしょけい' }],
            tooltip: 'Dictionary form',
          },
          {
            key: 'polite',
            label: [{ text: 'ます' }, { text: '形', reading: 'けい' }],
            tooltip: 'Polite ます form',
          },
          { key: 'note', label: 'Note' },
        ],
        practiceFrontKey: 'dictionary',
        size: 'full',
        rows: [
          {
            english: 'Eat',
            dictionary: [{ text: '食', reading: 'た' }, { text: 'べる' }],
            polite: [{ text: '食', reading: 'た' }, { text: 'べます' }],
          },
          {
            english: 'Drink',
            dictionary: [{ text: '飲', reading: 'の' }, { text: 'む' }],
            polite: [{ text: '飲', reading: 'の' }, { text: 'みます' }],
          },
          {
            english: 'Go',
            dictionary: [{ text: '行', reading: 'い' }, { text: 'く' }],
            polite: [{ text: '行', reading: 'い' }, { text: 'きます' }],
          },
          {
            english: 'Come',
            dictionary: [{ text: '来', reading: 'く' }, { text: 'る' }],
            polite: [{ text: '来', reading: 'き' }, { text: 'ます' }],
            note: 'Irregular — the reading shifts from く to き in the ます form and elsewhere.',
          },
          {
            english: 'See / Watch',
            dictionary: [{ text: '見', reading: 'み' }, { text: 'る' }],
            polite: [{ text: '見', reading: 'み' }, { text: 'ます' }],
          },
          {
            english: 'Do',
            dictionary: 'する',
            polite: 'します',
            note: 'Irregular — one of only two irregular verbs in Japanese (with 来る).',
          },
          {
            english: 'Read',
            dictionary: [{ text: '読', reading: 'よ' }, { text: 'む' }],
            polite: [{ text: '読', reading: 'よ' }, { text: 'みます' }],
          },
          {
            english: 'Write',
            dictionary: [{ text: '書', reading: 'か' }, { text: 'く' }],
            polite: [{ text: '書', reading: 'か' }, { text: 'きます' }],
          },
          {
            english: 'Listen / Hear',
            dictionary: [{ text: '聞', reading: 'き' }, { text: 'く' }],
            polite: [{ text: '聞', reading: 'き' }, { text: 'きます' }],
          },
          {
            english: 'Speak / Say',
            dictionary: [{ text: '話', reading: 'はな' }, { text: 'す' }],
            polite: [{ text: '話', reading: 'はな' }, { text: 'します' }],
          },
          {
            english: 'Buy',
            dictionary: [{ text: '買', reading: 'か' }, { text: 'う' }],
            polite: [{ text: '買', reading: 'か' }, { text: 'います' }],
          },
          {
            english: 'Make',
            dictionary: [{ text: '作', reading: 'つく' }, { text: 'る' }],
            polite: [{ text: '作', reading: 'つく' }, { text: 'ります' }],
          },
          {
            english: 'Wait',
            dictionary: [{ text: '待', reading: 'ま' }, { text: 'つ' }],
            polite: [{ text: '待', reading: 'ま' }, { text: 'ちます' }],
          },
          {
            english: 'Return (go home)',
            dictionary: [{ text: '帰', reading: 'かえ' }, { text: 'る' }],
            polite: [{ text: '帰', reading: 'かえ' }, { text: 'ります' }],
            note: 'Looks ichidan but is godan — 帰ります, not 帰ます.',
          },
          {
            english: 'Understand',
            dictionary: [{ text: '分', reading: 'わ' }, { text: 'かる' }],
            polite: [{ text: '分', reading: 'わ' }, { text: 'かります' }],
            note: 'Often used with が: 日本語が分かります, "I understand Japanese."',
          },
          {
            english: 'Exist / Have (inanimate)',
            dictionary: 'ある',
            polite: 'あります',
            note: 'Existence or possession for inanimate things and plants.',
          },
          {
            english: 'Exist (animate)',
            dictionary: 'いる',
            polite: 'います',
            note: 'Existence for people and animals.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'する and 来る — the only two irregulars',
        title: 'Everything Else Is Regular',
        body: 'Every other Japanese verb is either ichidan (stem + る, like 食べる/見る) or godan (regular stem changes, like 飲む/行く) — する and 来る are the sole exceptions, so once you\'ve memorized these two the rest is pattern-based.',
      },
      {
        term: 'ます form = stem + ます',
        title: 'One Suffix, Any Verb',
        body: 'Swap the final kana for its い-row equivalent and add ます: 飲む→飲みます, 書く→書きます, 話す→話します — the same mechanical swap produces the polite form for nearly every verb.',
      },
    ],
    mnemonicsSize: 'full',
    mnemonicsAfterTableId: 'everyday-verbs',
  },
  {
    id: 'common-adjectives',
    label: 'Common Adjectives',
    description:
      'i-adjectives conjugate on their own (ending in い); na-adjectives are grammatically closer to nouns and need な to directly modify one.',
    tables: [
      {
        id: 'i-adjectives',
        title: 'i-Adjectives',
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
            english: 'Good',
            japanese: 'いい',
            note: 'いい is the modern plain-present form; every other conjugation reverts to よい as the stem — よくない ("not good"), not いくない.',
          },
          { english: 'Bad', japanese: [{ text: '悪', reading: 'わる' }, { text: 'い' }] },
          { english: 'Big', japanese: [{ text: '大', reading: 'おお' }, { text: 'きい' }] },
          { english: 'Small', japanese: [{ text: '小', reading: 'ちい' }, { text: 'さい' }] },
          { english: 'New', japanese: [{ text: '新', reading: 'あたら' }, { text: 'しい' }] },
          { english: 'Old (things)', japanese: [{ text: '古', reading: 'ふる' }, { text: 'い' }] },
          {
            english: 'Expensive / High',
            japanese: [{ text: '高', reading: 'たか' }, { text: 'い' }],
            note: 'Also means "tall" — context (a price vs. a building) tells them apart.',
          },
          { english: 'Cheap / Low', japanese: [{ text: '安', reading: 'やす' }, { text: 'い' }] },
          { english: 'Long', japanese: [{ text: '長', reading: 'なが' }, { text: 'い' }] },
          {
            english: 'Short (length)',
            japanese: [{ text: '短', reading: 'みじか' }, { text: 'い' }],
          },
          { english: 'Fast / Quick', japanese: [{ text: '速', reading: 'はや' }, { text: 'い' }] },
          { english: 'Slow', japanese: [{ text: '遅', reading: 'おそ' }, { text: 'い' }] },
          {
            english: 'Difficult',
            japanese: [{ text: '難', reading: 'むずか' }, { text: 'しい' }],
          },
          {
            english: 'Easy',
            japanese: [{ text: '易', reading: 'やさ' }, { text: 'しい' }],
            note: 'Homophone of 優しい ("kind") — different kanji, same reading.',
          },
          {
            english: 'Fun / Enjoyable',
            japanese: [{ text: '楽', reading: 'たの' }, { text: 'しい' }],
          },
          {
            english: 'Interesting',
            japanese: [{ text: '面', reading: 'おも' }, { text: '白', reading: 'しろ' }, { text: 'い' }],
          },
          { english: 'Boring', japanese: 'つまらない' },
        ],
      },
      {
        id: 'na-adjectives',
        title: 'na-Adjectives',
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
            english: 'Kind',
            japanese: [{ text: '親切', reading: 'しんせつ' }],
            note: '親切な人, "a kind person".',
          },
          {
            english: 'Quiet',
            japanese: [{ text: '静か', reading: 'しずか' }],
            note: '静かな部屋, "a quiet room".',
          },
          { english: 'Lively / Bustling', japanese: [{ text: '賑やか', reading: 'にぎやか' }] },
          { english: 'Convenient', japanese: [{ text: '便利', reading: 'べんり' }] },
          { english: 'Important', japanese: [{ text: '大切', reading: 'たいせつ' }] },
          { english: 'Famous', japanese: [{ text: '有名', reading: 'ゆうめい' }] },
          { english: 'Simple / Easy', japanese: [{ text: '簡単', reading: 'かんたん' }] },
          {
            english: 'Like / Favorite',
            japanese: [{ text: '好き', reading: 'すき' }],
            note: 'Grammatically a na-adjective, used where English uses the verb "to like".',
          },
          { english: 'Dislike', japanese: [{ text: '嫌い', reading: 'きらい' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'いい vs よい',
        title: 'One Word, Two Stems',
        body: 'いい is only used in the plain present tense — every other form (negative, past, te-form) reverts to よい as the stem: よくない, よかった, よくて.',
      },
      {
        term: '高い — two meanings',
        title: '"Expensive" and "Tall" Share a Word',
        body: '高い describes both price and height — a 高い建物 is a tall building, a 高い本 is an expensive book.',
      },
      {
        term: 'Why な-adjectives need な',
        title: 'Closer to Nouns Than Adjectives',
        body: 'な-adjectives are grammatically closer to nouns than true adjectives, which is why they need な to directly modify a noun (静かな部屋) instead of conjugating on their own the way い-adjectives do.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'na-adjectives',
  },
  {
    id: 'clothing-items',
    label: 'Clothing Items',
    description:
      'Common clothing and accessories, plus the verbs for "wearing" each category — Japanese splits this by body part rather than using one universal verb.',
    tables: [
      {
        id: 'clothing',
        title: 'Clothing',
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
          { english: 'Clothes (general)', japanese: [{ text: '服', reading: 'ふく' }] },
          { english: 'Shirt', japanese: 'シャツ' },
          { english: 'T-shirt', japanese: 'Tシャツ' },
          { english: 'Pants', japanese: 'ズボン' },
          { english: 'Skirt', japanese: 'スカート' },
          { english: 'Dress', japanese: 'ワンピース' },
          { english: 'Jacket / Coat', japanese: [{ text: '上着', reading: 'うわぎ' }] },
          { english: 'Sweater', japanese: 'セーター' },
          { english: 'Shoes', japanese: [{ text: '靴', reading: 'くつ' }] },
          { english: 'Socks', japanese: [{ text: '靴下', reading: 'くつした' }] },
          { english: 'Hat', japanese: [{ text: '帽子', reading: 'ぼうし' }] },
          { english: 'Glasses', japanese: [{ text: '眼鏡', reading: 'めがね' }] },
        ],
      },
      {
        id: 'wearing-verbs',
        title: '"To Wear", by Body Part',
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
            english: 'To wear (upper body)',
            japanese: [{ text: '着', reading: 'き' }, { text: 'る' }],
            note: 'Shirts, jackets, sweaters — anything you put your arms through.',
          },
          {
            english: 'To wear (lower body / feet)',
            japanese: [{ text: '履', reading: 'は' }, { text: 'く' }],
            note: 'Pants, skirts, shoes, socks — anything you step into.',
          },
          {
            english: 'To wear (on the head)',
            japanese: 'かぶる',
            note: 'Hats and other headwear.',
          },
          {
            english: 'To wear (hooked on)',
            japanese: 'かける',
            note: 'Glasses.',
          },
          {
            english: 'To put on (accessories)',
            japanese: 'する',
            note: '時計をする, "to wear a watch" — rings, watches, and similar small accessories.',
          },
          {
            english: 'To take off',
            japanese: [{ text: '脱', reading: 'ぬ' }, { text: 'ぐ' }],
            note: 'The general opposite of 着る/履く, for clothes and shoes alike.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'One English verb, four Japanese ones',
        title: 'Pick the Verb by Category, Not a Blanket Word',
        body: 'English uses "wear" for everything; Japanese picks the verb based on what you\'re putting on and where — 着る for the torso, 履く for the legs/feet, かぶる for the head, かける for hooked items like glasses.',
      },
      {
        term: '靴 vs 靴下',
        title: '"Under-Shoe"',
        body: '靴下 ("socks") is literally 靴 ("shoe") + 下 ("under") — 下 shows up as a suffix meaning "underneath" in other compounds too.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'wearing-verbs',
  },
  {
    id: 'money-and-shopping',
    label: 'Money & Shopping',
    description: 'Currency, prices, and the vocabulary for buying and selling.',
    tables: [
      {
        id: 'money-and-prices',
        title: 'Money & Prices',
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
          { english: 'Money', japanese: [{ text: 'お' }, { text: '金', reading: 'かね' }] },
          { english: 'Yen', japanese: [{ text: '円', reading: 'えん' }] },
          { english: 'Price', japanese: [{ text: '値段', reading: 'ねだん' }] },
          { english: 'Expensive', japanese: [{ text: '高', reading: 'たか' }, { text: 'い' }] },
          { english: 'Cheap', japanese: [{ text: '安', reading: 'やす' }, { text: 'い' }] },
          { english: 'Receipt', japanese: 'レシート' },
          {
            english: 'Change (money returned)',
            japanese: [{ text: 'お' }, { text: '釣', reading: 'つ' }, { text: 'り' }],
          },
          { english: 'Coin', japanese: [{ text: '硬貨', reading: 'こうか' }] },
          { english: 'Bill (paper money)', japanese: [{ text: 'お' }, { text: '札', reading: 'さつ' }] },
          { english: 'Wallet', japanese: [{ text: '財布', reading: 'さいふ' }] },
        ],
      },
      {
        id: 'shopping-verbs-and-phrases',
        title: 'Shopping Verbs & Phrases',
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
          { english: 'To buy', japanese: [{ text: '買', reading: 'か' }, { text: 'う' }] },
          { english: 'To sell', japanese: [{ text: '売', reading: 'う' }, { text: 'る' }] },
          { english: 'To pay', japanese: [{ text: '払', reading: 'はら' }, { text: 'う' }] },
          {
            english: 'How much is it?',
            japanese: 'いくらですか',
          },
          { english: "I'll take this", japanese: 'これをください' },
          { english: 'Discount / Sale', japanese: [{ text: '割引', reading: 'わりびき' }] },
          { english: 'Cash', japanese: [{ text: '現金', reading: 'げんきん' }] },
          { english: 'Credit card', japanese: 'クレジットカード' },
        ],
      },
    ],
    mnemonics: [
      {
        term: 'お釣り vs 財布',
        title: 'Two Sides of the Same Transaction',
        body: 'お釣り is what the cashier hands back to you; 財布 is where it goes next — both show up in the same moment at the register.',
      },
      {
        term: 'いくら vs いくつ',
        title: 'Price vs. Count',
        body: 'いくら asks "how much" (price) and いくつ asks "how many" (count) — the same pair introduced in Question Words, worth remembering together whenever money comes up.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'shopping-verbs-and-phrases',
  },
  {
    id: 'nationalities-and-countries',
    label: 'Nationalities & Countries',
    description:
      'Common countries and the 人 (じん) suffix pattern used to name the nationality of someone from each one.',
    tables: [
      {
        id: 'countries',
        title: 'Countries',
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
          { english: 'Japan', japanese: [{ text: '日本', reading: 'にほん' }] },
          { english: 'America / USA', japanese: 'アメリカ' },
          { english: 'China', japanese: [{ text: '中国', reading: 'ちゅうごく' }] },
          { english: 'Korea', japanese: [{ text: '韓国', reading: 'かんこく' }] },
          { english: 'England / UK', japanese: 'イギリス' },
          { english: 'France', japanese: 'フランス' },
          { english: 'Germany', japanese: 'ドイツ' },
          { english: 'Canada', japanese: 'カナダ' },
          { english: 'Australia', japanese: 'オーストラリア' },
          { english: 'Brazil', japanese: 'ブラジル' },
        ],
      },
      {
        id: 'nationalities',
        title: 'Nationalities',
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
            english: 'Japanese (person)',
            japanese: [{ text: '日本', reading: 'にほん' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'American (person)',
            japanese: [{ text: 'アメリカ' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'Chinese (person)',
            japanese: [{ text: '中国', reading: 'ちゅうごく' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'Korean (person)',
            japanese: [{ text: '韓国', reading: 'かんこく' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'British (person)',
            japanese: [{ text: 'イギリス' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'French (person)',
            japanese: [{ text: 'フランス' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'German (person)',
            japanese: [{ text: 'ドイツ' }, { text: '人', reading: 'じん' }],
          },
          {
            english: 'Foreigner (general)',
            japanese: [{ text: '外国', reading: 'がいこく' }, { text: '人', reading: 'じん' }],
            note: '外国 ("foreign country") + 人 — anyone from outside Japan, not a specific nationality.',
          },
        ],
      },
    ],
    mnemonics: [
      {
        term: '人 (じん) as the nationality suffix',
        title: 'One Suffix, Any Country',
        body: 'Attach 人 to almost any country name to get "a person from there" — 日本+人=日本人, アメリカ+人=アメリカ人 — the same suffix applies across the board.',
      },
      {
        term: '外国 — "outside country"',
        title: 'Everywhere That Isn\'t Japan',
        body: '外 (そと, "outside") + 国 ("country") literally means "outside country" — 外国人 is a catch-all for anyone from outside Japan, not one specific nationality.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'nationalities',
  },
  {
    id: 'occupations-and-jobs',
    label: 'Occupations & Jobs',
    description: 'Common jobs and the vocabulary for talking about work.',
    tables: [
      {
        id: 'common-occupations',
        title: 'Common Occupations',
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
            english: 'Teacher',
            japanese: [{ text: '先生', reading: 'せんせい' }],
            note: 'Also used as a respectful title for doctors and other experienced professionals, not just classroom teachers.',
          },
          { english: 'Student', japanese: [{ text: '学生', reading: 'がくせい' }] },
          { english: 'Doctor', japanese: [{ text: '医者', reading: 'いしゃ' }] },
          { english: 'Nurse', japanese: [{ text: '看護師', reading: 'かんごし' }] },
          {
            english: 'Company employee',
            japanese: [{ text: '会社', reading: 'かいしゃ' }, { text: '員', reading: 'いん' }],
          },
          { english: 'Engineer', japanese: 'エンジニア' },
          { english: 'Police officer', japanese: [{ text: '警察官', reading: 'けいさつかん' }] },
          {
            english: 'Chef / Cook',
            japanese: [{ text: '料理', reading: 'りょうり' }, { text: '人', reading: 'にん' }],
          },
          {
            english: 'Shop staff / Clerk',
            japanese: [{ text: '店', reading: 'てん' }, { text: '員', reading: 'いん' }],
          },
          { english: 'Farmer', japanese: [{ text: '農家', reading: 'のうか' }] },
        ],
      },
      {
        id: 'talking-about-work',
        title: 'Talking About Work',
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
          { english: 'Job / Occupation', japanese: [{ text: '仕事', reading: 'しごと' }] },
          { english: 'Company', japanese: [{ text: '会社', reading: 'かいしゃ' }] },
          {
            english: "What's your job?",
            japanese: [
              { text: 'お' },
              { text: '仕事', reading: 'しごと' },
              { text: 'は' },
              { text: '何', reading: 'なん' },
              { text: 'ですか' },
            ],
          },
          { english: 'To work', japanese: [{ text: '働', reading: 'はたら' }, { text: 'く' }] },
          {
            english: 'Part-time job',
            japanese: 'アルバイト',
            note: 'Often shortened to バイト in casual speech.',
          },
          { english: 'Salary', japanese: [{ text: '給料', reading: 'きゅうりょう' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '先生 beyond "teacher"',
        title: '"Born Before"',
        body: '先生 literally combines 先 ("before") and 生 ("born/life") — used respectfully for teachers, doctors, and other experienced professionals, not only classroom teachers.',
      },
      {
        term: '員 as a "member of" suffix',
        title: 'Recognize the Pattern',
        body: '員 appears in many job words — 会社員, 店員, and others — each meaning "a member of ~". Spotting the suffix helps you guess the meaning of new job words.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'talking-about-work',
  },
  {
    id: 'school-subjects',
    label: 'School Subjects',
    description: 'Common academic subjects taught in school.',
    tables: [
      {
        id: 'subjects',
        title: 'Subjects',
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
            english: 'Japanese (subject)',
            japanese: [{ text: '国語', reading: 'こくご' }],
            note: 'The school-subject word for "Japanese" — distinct from 日本語, the word used when learning Japanese as a second language.',
          },
          { english: 'Math', japanese: [{ text: '数学', reading: 'すうがく' }] },
          { english: 'Science', japanese: [{ text: '理科', reading: 'りか' }] },
          { english: 'Social studies', japanese: [{ text: '社会', reading: 'しゃかい' }] },
          { english: 'English', japanese: [{ text: '英語', reading: 'えいご' }] },
          { english: 'History', japanese: [{ text: '歴史', reading: 'れきし' }] },
          { english: 'Geography', japanese: [{ text: '地理', reading: 'ちり' }] },
          { english: 'Physical education', japanese: [{ text: '体育', reading: 'たいいく' }] },
          { english: 'Art', japanese: [{ text: '美術', reading: 'びじゅつ' }] },
          { english: 'Music', japanese: [{ text: '音楽', reading: 'おんがく' }] },
          { english: 'Home economics', japanese: [{ text: '家庭科', reading: 'かていか' }] },
        ],
      },
    ],
    mnemonics: [
      {
        term: '国語 vs 日本語',
        title: 'Same Language, Two Labels',
        body: '国語 ("national language") is how Japanese schools refer to the Japanese subject itself, while 日本語 ("Japanese language") is the word foreigners use when learning it as a second language — the same language, labeled differently depending on who\'s speaking.',
      },
      {
        term: '科 as a "subject/department" suffix',
        title: 'Spotting an Academic Department',
        body: '科 marks an academic department in words like 理科 ("science") and 家庭科 ("home ec") — the same kanji also appears in medical department names like 外科 ("surgery"), a different but related sense.',
      },
    ],
    mnemonicsSize: 'half',
    mnemonicsAfterTableId: 'subjects',
  },
];
