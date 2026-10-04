export interface ColumnGlossaryEntry {
  column: string;
  description: string;
}

/**
 * Column definitions adapted from the BLS OEWS "Field Descriptions" sheet published alongside
 * the May 2025 National, State, Metropolitan, and Nonmetropolitan Area Occupational Employment
 * and Wage Estimates: https://www.bls.gov/oes/tables.htm
 */
export const COLUMN_GLOSSARY: ColumnGlossaryEntry[] = [
  {
    column: 'SOC Code',
    description:
      'The 6-digit Standard Occupational Classification (SOC) code for the occupation, assigned by BLS.',
  },
  {
    column: 'SOC Group',
    description:
      'The SOC major group this occupation rolls up into (e.g. "Management Occupations"). There are 22 major groups represented in the OEWS national data (SOC has a 23rd, military-specific, group that OEWS does not cover).',
  },
  {
    column: 'Job Title',
    description: 'The SOC title, or OEWS-specific title, for the occupation.',
  },
  {
    column: 'Total Employment',
    description:
      'Estimated total U.S. employment in the occupation, rounded to the nearest 10. Excludes the self-employed.',
  },
  {
    column: 'Median Annual Wage',
    description:
      'The 50th-percentile annual wage — half of workers in the occupation earn more, half earn less. Some occupations that are typically paid and worked on an hourly basis (e.g. actors, musicians) are released hourly-only by BLS, so their annual figure is not available.',
  },
  {
    column: 'Mean Annual Wage',
    description: 'The average (arithmetic mean) annual wage across all workers in the occupation.',
  },
  {
    column: '10th / 90th Percentile Annual Wage',
    description:
      'The annual wage below which 10% (or 90%) of workers in the occupation fall. The gap between these two figures is a rough measure of pay spread within an occupation.',
  },
  {
    column: 'Annual/Hourly-Only Wages',
    description:
      'BLS releases only annual wages for occupations that typically work fewer than 2,080 hours/year but are paid annually (e.g. teachers, pilots, athletes), and only hourly wages for occupations typically paid hourly with irregular hours (e.g. actors, dancers, musicians).',
  },
];
