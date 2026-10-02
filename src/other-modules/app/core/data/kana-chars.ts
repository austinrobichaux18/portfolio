import { KanaChar, KanaScript } from '../models/KanaChar';
import { KanaRowGroup, KanaRowKind } from '../models/KanaRowGroup';

interface KanaCell {
  hiragana: string;
  katakana: string;
  romaji: string;
  alt?: string[];
}

interface RowDef {
  id: string;
  label: string;
  kind: KanaRowKind;
  cells: KanaCell[];
}

const ROW_DEFS: RowDef[] = [
  {
    id: 'a',
    label: 'A row (a i u e o)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'あ', katakana: 'ア', romaji: 'a' },
      { hiragana: 'い', katakana: 'イ', romaji: 'i' },
      { hiragana: 'う', katakana: 'ウ', romaji: 'u' },
      { hiragana: 'え', katakana: 'エ', romaji: 'e' },
      { hiragana: 'お', katakana: 'オ', romaji: 'o' },
    ],
  },
  {
    id: 'ka',
    label: 'Ka row (ka ki ku ke ko)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'か', katakana: 'カ', romaji: 'ka' },
      { hiragana: 'き', katakana: 'キ', romaji: 'ki' },
      { hiragana: 'く', katakana: 'ク', romaji: 'ku' },
      { hiragana: 'け', katakana: 'ケ', romaji: 'ke' },
      { hiragana: 'こ', katakana: 'コ', romaji: 'ko' },
    ],
  },
  {
    id: 'sa',
    label: 'Sa row (sa shi su se so)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'さ', katakana: 'サ', romaji: 'sa' },
      { hiragana: 'し', katakana: 'シ', romaji: 'shi', alt: ['si'] },
      { hiragana: 'す', katakana: 'ス', romaji: 'su' },
      { hiragana: 'せ', katakana: 'セ', romaji: 'se' },
      { hiragana: 'そ', katakana: 'ソ', romaji: 'so' },
    ],
  },
  {
    id: 'ta',
    label: 'Ta row (ta chi tsu te to)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'た', katakana: 'タ', romaji: 'ta' },
      { hiragana: 'ち', katakana: 'チ', romaji: 'chi', alt: ['ti'] },
      { hiragana: 'つ', katakana: 'ツ', romaji: 'tsu', alt: ['tu'] },
      { hiragana: 'て', katakana: 'テ', romaji: 'te' },
      { hiragana: 'と', katakana: 'ト', romaji: 'to' },
    ],
  },
  {
    id: 'na',
    label: 'Na row (na ni nu ne no)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'な', katakana: 'ナ', romaji: 'na' },
      { hiragana: 'に', katakana: 'ニ', romaji: 'ni' },
      { hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu' },
      { hiragana: 'ね', katakana: 'ネ', romaji: 'ne' },
      { hiragana: 'の', katakana: 'ノ', romaji: 'no' },
    ],
  },
  {
    id: 'ha',
    label: 'Ha row (ha hi fu he ho)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'は', katakana: 'ハ', romaji: 'ha' },
      { hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi' },
      { hiragana: 'ふ', katakana: 'フ', romaji: 'fu', alt: ['hu'] },
      { hiragana: 'へ', katakana: 'ヘ', romaji: 'he' },
      { hiragana: 'ほ', katakana: 'ホ', romaji: 'ho' },
    ],
  },
  {
    id: 'ma',
    label: 'Ma row (ma mi mu me mo)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'ま', katakana: 'マ', romaji: 'ma' },
      { hiragana: 'み', katakana: 'ミ', romaji: 'mi' },
      { hiragana: 'む', katakana: 'ム', romaji: 'mu' },
      { hiragana: 'め', katakana: 'メ', romaji: 'me' },
      { hiragana: 'も', katakana: 'モ', romaji: 'mo' },
    ],
  },
  {
    id: 'ya',
    label: 'Ya row (ya yu yo)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'や', katakana: 'ヤ', romaji: 'ya' },
      { hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu' },
      { hiragana: 'よ', katakana: 'ヨ', romaji: 'yo' },
    ],
  },
  {
    id: 'ra',
    label: 'Ra row (ra ri ru re ro)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'ら', katakana: 'ラ', romaji: 'ra' },
      { hiragana: 'り', katakana: 'リ', romaji: 'ri' },
      { hiragana: 'る', katakana: 'ル', romaji: 'ru' },
      { hiragana: 'れ', katakana: 'レ', romaji: 're' },
      { hiragana: 'ろ', katakana: 'ロ', romaji: 'ro' },
    ],
  },
  {
    id: 'wa',
    label: 'Wa row (wa wo)',
    kind: 'gojuon',
    cells: [
      { hiragana: 'わ', katakana: 'ワ', romaji: 'wa' },
      { hiragana: 'を', katakana: 'ヲ', romaji: 'wo', alt: ['o'] },
    ],
  },
  {
    id: 'n',
    label: 'N (ん)',
    kind: 'gojuon',
    cells: [{ hiragana: 'ん', katakana: 'ン', romaji: 'n', alt: ['nn'] }],
  },
  {
    id: 'ga',
    label: 'Ga row (ga gi gu ge go)',
    kind: 'dakuten',
    cells: [
      { hiragana: 'が', katakana: 'ガ', romaji: 'ga' },
      { hiragana: 'ぎ', katakana: 'ギ', romaji: 'gi' },
      { hiragana: 'ぐ', katakana: 'グ', romaji: 'gu' },
      { hiragana: 'げ', katakana: 'ゲ', romaji: 'ge' },
      { hiragana: 'ご', katakana: 'ゴ', romaji: 'go' },
    ],
  },
  {
    id: 'za',
    label: 'Za row (za ji zu ze zo)',
    kind: 'dakuten',
    cells: [
      { hiragana: 'ざ', katakana: 'ザ', romaji: 'za' },
      { hiragana: 'じ', katakana: 'ジ', romaji: 'ji', alt: ['zi'] },
      { hiragana: 'ず', katakana: 'ズ', romaji: 'zu' },
      { hiragana: 'ぜ', katakana: 'ゼ', romaji: 'ze' },
      { hiragana: 'ぞ', katakana: 'ゾ', romaji: 'zo' },
    ],
  },
  {
    id: 'da',
    label: 'Da row (da ji zu de do)',
    kind: 'dakuten',
    cells: [
      { hiragana: 'だ', katakana: 'ダ', romaji: 'da' },
      { hiragana: 'ぢ', katakana: 'ヂ', romaji: 'ji', alt: ['di'] },
      { hiragana: 'づ', katakana: 'ヅ', romaji: 'zu', alt: ['du'] },
      { hiragana: 'で', katakana: 'デ', romaji: 'de' },
      { hiragana: 'ど', katakana: 'ド', romaji: 'do' },
    ],
  },
  {
    id: 'ba',
    label: 'Ba row (ba bi bu be bo)',
    kind: 'dakuten',
    cells: [
      { hiragana: 'ば', katakana: 'バ', romaji: 'ba' },
      { hiragana: 'び', katakana: 'ビ', romaji: 'bi' },
      { hiragana: 'ぶ', katakana: 'ブ', romaji: 'bu' },
      { hiragana: 'べ', katakana: 'ベ', romaji: 'be' },
      { hiragana: 'ぼ', katakana: 'ボ', romaji: 'bo' },
    ],
  },
  {
    id: 'pa',
    label: 'Pa row (pa pi pu pe po)',
    kind: 'handakuten',
    cells: [
      { hiragana: 'ぱ', katakana: 'パ', romaji: 'pa' },
      { hiragana: 'ぴ', katakana: 'ピ', romaji: 'pi' },
      { hiragana: 'ぷ', katakana: 'プ', romaji: 'pu' },
      { hiragana: 'ぺ', katakana: 'ペ', romaji: 'pe' },
      { hiragana: 'ぽ', katakana: 'ポ', romaji: 'po' },
    ],
  },
  {
    id: 'kya',
    label: 'Kya row (kya kyu kyo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'きゃ', katakana: 'キャ', romaji: 'kya' },
      { hiragana: 'きゅ', katakana: 'キュ', romaji: 'kyu' },
      { hiragana: 'きょ', katakana: 'キョ', romaji: 'kyo' },
    ],
  },
  {
    id: 'sha',
    label: 'Sha row (sha shu sho)',
    kind: 'yoon',
    cells: [
      { hiragana: 'しゃ', katakana: 'シャ', romaji: 'sha', alt: ['sya'] },
      { hiragana: 'しゅ', katakana: 'シュ', romaji: 'shu', alt: ['syu'] },
      { hiragana: 'しょ', katakana: 'ショ', romaji: 'sho', alt: ['syo'] },
    ],
  },
  {
    id: 'cha',
    label: 'Cha row (cha chu cho)',
    kind: 'yoon',
    cells: [
      { hiragana: 'ちゃ', katakana: 'チャ', romaji: 'cha', alt: ['tya'] },
      { hiragana: 'ちゅ', katakana: 'チュ', romaji: 'chu', alt: ['tyu'] },
      { hiragana: 'ちょ', katakana: 'チョ', romaji: 'cho', alt: ['tyo'] },
    ],
  },
  {
    id: 'nya',
    label: 'Nya row (nya nyu nyo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'にゃ', katakana: 'ニャ', romaji: 'nya' },
      { hiragana: 'にゅ', katakana: 'ニュ', romaji: 'nyu' },
      { hiragana: 'にょ', katakana: 'ニョ', romaji: 'nyo' },
    ],
  },
  {
    id: 'hya',
    label: 'Hya row (hya hyu hyo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'ひゃ', katakana: 'ヒャ', romaji: 'hya' },
      { hiragana: 'ひゅ', katakana: 'ヒュ', romaji: 'hyu' },
      { hiragana: 'ひょ', katakana: 'ヒョ', romaji: 'hyo' },
    ],
  },
  {
    id: 'mya',
    label: 'Mya row (mya myu myo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'みゃ', katakana: 'ミャ', romaji: 'mya' },
      { hiragana: 'みゅ', katakana: 'ミュ', romaji: 'myu' },
      { hiragana: 'みょ', katakana: 'ミョ', romaji: 'myo' },
    ],
  },
  {
    id: 'rya',
    label: 'Rya row (rya ryu ryo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'りゃ', katakana: 'リャ', romaji: 'rya' },
      { hiragana: 'りゅ', katakana: 'リュ', romaji: 'ryu' },
      { hiragana: 'りょ', katakana: 'リョ', romaji: 'ryo' },
    ],
  },
  {
    id: 'gya',
    label: 'Gya row (gya gyu gyo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'ぎゃ', katakana: 'ギャ', romaji: 'gya' },
      { hiragana: 'ぎゅ', katakana: 'ギュ', romaji: 'gyu' },
      { hiragana: 'ぎょ', katakana: 'ギョ', romaji: 'gyo' },
    ],
  },
  {
    id: 'ja',
    label: 'Ja row (ja ju jo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'じゃ', katakana: 'ジャ', romaji: 'ja', alt: ['jya', 'zya'] },
      { hiragana: 'じゅ', katakana: 'ジュ', romaji: 'ju', alt: ['jyu', 'zyu'] },
      { hiragana: 'じょ', katakana: 'ジョ', romaji: 'jo', alt: ['jyo', 'zyo'] },
    ],
  },
  {
    id: 'bya',
    label: 'Bya row (bya byu byo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'びゃ', katakana: 'ビャ', romaji: 'bya' },
      { hiragana: 'びゅ', katakana: 'ビュ', romaji: 'byu' },
      { hiragana: 'びょ', katakana: 'ビョ', romaji: 'byo' },
    ],
  },
  {
    id: 'pya',
    label: 'Pya row (pya pyu pyo)',
    kind: 'yoon',
    cells: [
      { hiragana: 'ぴゃ', katakana: 'ピャ', romaji: 'pya' },
      { hiragana: 'ぴゅ', katakana: 'ピュ', romaji: 'pyu' },
      { hiragana: 'ぴょ', katakana: 'ピョ', romaji: 'pyo' },
    ],
  },
];

export const KANA_ROW_GROUPS: KanaRowGroup[] = ROW_DEFS.map(({ id, label, kind }) => ({
  id,
  label,
  kind,
}));

const SCRIPTS: KanaScript[] = ['hiragana', 'katakana'];

export const KANA_CHARS: KanaChar[] = ROW_DEFS.flatMap((row) =>
  row.cells.flatMap((cell) =>
    SCRIPTS.map((script) => ({
      id: `${script}:${cell[script]}`,
      char: cell[script],
      romaji: cell.romaji,
      altRomaji: cell.alt ?? [],
      script,
      rowId: row.id,
    })),
  ),
);

const CHARS_BY_ROW_KEY = new Map<string, KanaChar[]>();
for (const c of KANA_CHARS) {
  const key = `${c.script}:${c.rowId}`;
  const list = CHARS_BY_ROW_KEY.get(key);
  if (list) {
    list.push(c);
  } else {
    CHARS_BY_ROW_KEY.set(key, [c]);
  }
}

export function charsForRow(script: KanaScript, rowId: string): KanaChar[] {
  return CHARS_BY_ROW_KEY.get(`${script}:${rowId}`) ?? [];
}
