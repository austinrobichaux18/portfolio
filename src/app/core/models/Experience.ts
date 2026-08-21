export interface Experience {
  id: string;

  role: string;

  company: string;

  startDate: string;

  endDate: string;

  description: string;

  technologies?: string[];

  highlights?: string[];

  accomplishments?: string[];

  impact?: { value: string; label: string }[];

  clients?: {
    name: string;

    dateRange: string;

    focus: string;

    work: string;

    technologies?: string[];

    results?: string;
  }[];
}
