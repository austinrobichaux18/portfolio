export interface UsOccupation {
  /** 6-digit SOC code, e.g. "11-1011". */
  socCode: string;
  /** SOC major group title this occupation rolls up into, e.g. "Management Occupations". */
  socMajorGroup: string;
  /** SOC/OEWS occupation title, e.g. "Chief Executives". */
  jobTitle: string;
  /** Estimated total U.S. employment, rounded to the nearest 10 (excludes self-employed). */
  totalEmployment: number | null;
  /** Annual median wage (50th percentile). Null for occupations BLS reports hourly-only. */
  medianAnnualWage: number | null;
  /** Hourly median wage (50th percentile). */
  medianHourlyWage: number | null;
  /** Annual mean wage. Null for occupations BLS reports hourly-only. */
  meanAnnualWage: number | null;
  /** Hourly mean wage. */
  meanHourlyWage: number | null;
  /** Annual 10th-percentile wage. Null for occupations BLS reports hourly-only. */
  pct10AnnualWage: number | null;
  /** Annual 90th-percentile wage. Null for occupations BLS reports hourly-only. */
  pct90AnnualWage: number | null;
  /** True if BLS releases only annual wages for this occupation (e.g. teachers, pilots). */
  annualWagesOnly: boolean;
  /** True if BLS releases only hourly wages for this occupation (e.g. actors, musicians). */
  hourlyWagesOnly: boolean;
}
