export interface LearningResourceLink {
  title: string;
  /** Omitted for resources with no stable public URL to link to (e.g. an Anki deck name only). */
  url?: string;
  note?: string;
}

export interface LearningResourceCategory {
  id: string;
  label: string;
  description?: string;
  resources: LearningResourceLink[];
}
