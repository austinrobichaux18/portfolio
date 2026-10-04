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
  {
    column: 'Education Needed',
    description:
      'The typical education needed to enter the occupation, from the BLS Employment Projections program\'s 2025–35 National Employment Matrix (Table 1.2). One of 8 standard BLS categories, from "No formal educational credential" to "Doctoral or professional degree."',
  },
  {
    column: 'Experience Required',
    description:
      'Typical work experience in a related occupation needed to enter the role: "None," "Less than 5 years," or "5 years or more." Also from BLS Employment Projections Table 1.2.',
  },
  {
    column: 'Job Outlook',
    description:
      'This site\'s own tier label (Declining / Little or No Change / Slower Than Average / Average / Faster Than Average / Much Faster Than Average), applied to BLS\'s real projected percent change in employment, 2025–35, relative to the real national average (3.5%) over the same period. Hover a row\'s Job Outlook cell to see the exact BLS percent-change figure.',
  },
  {
    column: 'Annual Openings',
    description:
      'The real BLS-projected average number of annual job openings in the occupation, 2025–35 (from new jobs created plus workers leaving the occupation permanently).',
  },
  {
    column: 'Job Environment, AI Exposure, Remote-Work Potential',
    description:
      'Not BLS data. This site\'s own simple, rule-based estimate — a baseline per SOC major group adjusted by keyword matches on the job title — meant as a rough general-orientation guide, not a scientific index.',
  },
];
