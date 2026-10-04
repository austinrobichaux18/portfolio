export interface ColumnGlossaryEntry {
  column: string;
  description: string;
}

/**
 * Plain-language column definitions. The underlying figures come from the BLS OEWS "Field
 * Descriptions" sheet (May 2025 wage data) and the BLS Employment Projections program's 2025-35
 * National Employment Matrix, Table 1.2 (education/experience/outlook data):
 * https://www.bls.gov/oes/tables.htm and https://www.bls.gov/emp/tables.htm
 */
export const COLUMN_GLOSSARY: ColumnGlossaryEntry[] = [
  {
    column: 'Job Category',
    description:
      'The broad field this job is part of, like "Management Jobs" or "Healthcare Jobs." The government calls this a "SOC major group" — there are 22 of them in this data.',
  },
  {
    column: 'Job Title',
    description: 'The name of the job.',
  },
  {
    column: 'Total Employment',
    description: 'About how many people in the U.S. currently have this job.',
  },
  {
    column: 'Median Annual Salary',
    description:
      'The middle pay for this job per year — half of workers in this job earn more than this, half earn less. This is usually a better "typical" number than the average, since a few very high earners can\'t skew it. Some jobs that are usually paid by the hour with irregular schedules (like acting or music) don\'t have a yearly pay number — those show as "—".',
  },
  {
    column: 'Average Salary (Mean Annual Wage)',
    description:
      'The average pay for this job per year (add up everyone\'s pay and divide by the number of workers). A few very high earners can pull this number up higher than what most people actually make.',
  },
  {
    column: 'Low-End / High-End Pay',
    description:
      'Low-End Pay: only about 1 in 10 workers in this job make less than this. High-End Pay: only about 1 in 10 workers make more than this. Together, they show the typical range of pay in this job, from low to high.',
  },
  {
    column: 'Education Needed',
    description:
      'The schooling most people need to get hired for this job, from "No Degree Needed" up to a doctorate.',
  },
  {
    column: 'Experience Required',
    description: 'Whether you usually need past work experience in a related job to get hired.',
  },
  {
    column: 'Job Outlook',
    description:
      'Will there be more of these jobs by the year 2035, or fewer? This compares the government\'s real growth forecast for this job against the average job over the same years. Hover a row\'s Job Outlook cell to see the exact forecast number.',
  },
  {
    column: 'Annual Openings',
    description:
      'About how many job openings are expected each year in the U.S. for this job — counting both new jobs and spots left open when people retire or leave.',
  },
  {
    column: 'Job Environment, AI Exposure, Remote-Work Potential',
    description:
      'These 3 are not official government numbers. They are this site\'s own best guess, based on the job\'s title and category — a rough guide, not a fact. Job Environment: do you mostly sit at a desk, work with your hands, or both? AI Exposure: how easily a computer could do this job instead of a person. Remote-Work Potential: how likely you could do this job from home.',
  },
];
