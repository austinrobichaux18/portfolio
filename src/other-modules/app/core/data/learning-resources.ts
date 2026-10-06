import { LearningResourceCategory } from '../models/LearningResource';

export const LEARNING_RESOURCE_CATEGORIES: LearningResourceCategory[] = [
  {
    id: 'dictionary',
    label: 'Dictionary',
    resources: [
      {
        title: 'Jisho',
        url: 'https://jisho.org/',
        note: 'Free online Japanese-English dictionary with example sentences and kanji lookup.',
      },
    ],
  },
  {
    id: 'grammar',
    label: 'Grammar',
    resources: [
      {
        title: 'Cure Dolly Grammar',
        url: 'https://www.youtube.com/watch?v=pSvH9vH60Ig&list=PLg9uYxuZf8x_A-vcqqyOFZu06WlhnypWj',
        note: 'Popular video series on Japanese grammar, taught from a structural/cognitive-linguistics angle.',
      },
      {
        title: "Tae Kim's Guide to Japanese",
        url: 'https://www.guidetojapanese.org/grammar_guide.pdf',
        note: 'A full grammar guide in one PDF, from basic particles through advanced sentence patterns.',
      },
      {
        title: 'Bunpro grammar-point spreadsheet',
        url: 'https://www.reddit.com/r/LearnJapanese/s/6YOFMogUar',
        note: 'Community-maintained spreadsheet covering all 927 grammar points tracked by Bunpro.',
      },
      {
        title: 'Grammar point video playlist',
        url: 'https://www.youtube.com/playlist?list=PLg9uYxuZf8x_A-vcqqyOFZu06WlhnypWj',
        note: 'Video walkthroughs of individual grammar points.',
      },
      {
        title: 'Te-form & conjugation practice tool',
        url: 'https://steven-kraft.com/projects/japanese/',
        note: 'Interactive drills for verb conjugation forms like te-form.',
      },
    ],
  },
  {
    id: 'comprehensible-input',
    label: 'Comprehensible Input',
    resources: [
      {
        title: 'Comprehensible input playlist',
        url: 'https://www.youtube.com/playlist?list=PLPdNX2arS9Mb1iiA0xHkxj3KVwssHQxYP',
        note: "Listening practice pitched at a learner's current level instead of native speed and vocabulary.",
      },
    ],
  },
  {
    id: 'graded-readers',
    label: 'Graded Readers',
    resources: [
      {
        title: 'Tadoku',
        url: 'https://tadoku.org/japanese/en/free-books-en/#ls',
        note: 'Free graded readers sorted by difficulty level.',
      },
    ],
  },
  {
    id: 'immersion-practice',
    label: 'Immersion Practice',
    resources: [
      {
        title: 'Song lyric transcription practice',
        url: 'https://www.animesonglyrics.com/clannad-after-story/toki-o-kizamu-uta',
        note: "Transcribe/translate song lyrics as kana-writing and listening practice (example song linked). Also on this site's module backlog as an interactive tool.",
      },
      {
        title: 'jimaku.cc',
        url: 'https://jimaku.cc',
        note: 'Downloadable Japanese subtitle files for anime and shows.',
      },
      {
        title: 'asbplayer',
        url: 'https://github.com/killergerbah/asbplayer',
        note: 'Browser extension/app for watching video with subtitles, built for language-immersion study.',
      },
      {
        title: 'Condensed Audio Catalog',
        url: 'https://condensedaudiocatalog.com/',
        note: 'Catalog of condensed audio (dialogue-only) tracks pulled from shows, for listening immersion.',
      },
    ],
  },
  {
    id: 'anki-decks',
    label: 'Anki Decks',
    resources: [
      {
        title: 'Kaishi 1.5k',
        url: 'https://ankiweb.net/shared/info/1196762551',
        note: 'Core vocabulary deck covering about 1,500 of the most common words.',
      },
      {
        title: 'RTK 450 (Remembering the Kanji, first 450)',
        url: 'https://ankiweb.net/shared/info/1843881818',
        note: 'The first 450 kanji from the Remembering the Kanji method.',
      },
    ],
  },
  {
    id: 'podcasts',
    label: 'Podcasts',
    resources: [
      {
        title: 'ゆゆの日本語Podcast',
        url: 'https://www.listennotes.com/podcasts/yuyuの日本語podcastjapan/第二回ポッドキャスト-男女の表現について-WKlaQgFph8r/',
        note: 'Example episode of a Japanese-language podcast.',
      },
      {
        title: 'Podcast recommendations spreadsheet',
        url: 'https://docs.google.com/spreadsheets/d/17P2dBQHnBnHcG3ua_24IO6sP9RDC-5b3WHV9Ri2N5qU/edit?gid=0#gid=0',
        note: 'Community-sourced list of Japanese-learning podcast recommendations.',
      },
    ],
  },
  {
    id: 'community-recommendations',
    label: 'Community Recommendations',
    resources: [
      {
        title: 'YouTuber recommendations (Reddit thread)',
        url: 'https://www.reddit.com/r/LearnJapanese/s/ZJFg9cc3g9',
        note: 'Community recommendations for Japanese-learning and immersion YouTubers.',
      },
    ],
  },
  {
    id: 'media-recommendations',
    label: 'Media Recommendations',
    resources: [
      {
        title: 'Jiten media decks',
        url: 'https://jiten.moe/decks/media?offset=0',
        note: 'Browsable catalog of Japanese media (anime, games, novels, etc.) with vocabulary/difficulty stats.',
      },
      {
        title: 'Huge Japanese resource list (donkuri/japanese-resources)',
        url: 'https://github.com/donkuri/japanese-resources',
        note: 'A large, categorized GitHub list of Japanese learning resources.',
      },
      {
        title: 'Media recommendations spreadsheet',
        url: 'https://docs.google.com/spreadsheets/d/1w42HEKEu2AzZg9K7PI0ma9ICmr2qYEKQ9IF4XxFSnQU/edit?gid=1999205540#gid=1999205540',
        note: 'Community-sourced recommendations for shows, games, and other media to use for immersion.',
      },
      {
        title: 'Games list spreadsheet',
        url: 'https://docs.google.com/spreadsheets/d/14TKRFvnDmBsgfxCJzkaNKTKmx4qDcsv7QSmfyzIKxQ4/edit?gid=0#gid=0',
        note: 'Community-sourced list of games recommended for Japanese-language immersion.',
      },
    ],
  },
];
