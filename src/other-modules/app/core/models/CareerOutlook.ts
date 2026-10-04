export type JobEnvironment = 'Desk Job' | 'Hybrid' | 'Physical Job';
export type ExposureLevel = 'Low' | 'Moderate' | 'High';
export type RemoteWorkPotential = 'Low' | 'Medium' | 'High';
export type JobOutlookTier =
  | 'Declining'
  | 'Little or No Change'
  | 'Slower Than Average'
  | 'Average'
  | 'Faster Than Average'
  | 'Much Faster Than Average';

/**
 * Supplementary per-occupation data, joined to UsOccupation by socCode. Two different kinds of
 * field live here side by side -- see us-career-data.html's "About this data" panel and
 * column-glossary.ts for the full explanation shown in the app:
 *
 * REAL, sourced from the BLS Employment Projections program (2025-35 cycle, National Employment
 * Matrix, Table 1.2 "Occupational projections and worker characteristics",
 * https://www.bls.gov/emp/tables.htm): typicalEducationNeeded, workExperienceRequired,
 * typicalOnTheJobTraining, projectedEmploymentChangePercent, projectedAnnualOpenings,
 * percentSelfEmployed, and jobOutlookTier (our own tier label applied to BLS's real percent-change
 * figure).
 *
 * SITE ESTIMATE, not from BLS or any named study -- a simple, documented rule-based
 * categorization (SOC major group baseline + job-title keyword overrides) for general
 * orientation only: jobEnvironment, aiExposure, remoteWorkPotential.
 */
export interface CareerOutlook {
  socCode: string;
  jobTitle: string;

  typicalEducationNeeded: string;
  workExperienceRequired: string;
  typicalOnTheJobTraining: string;
  projectedEmploymentChangePercent: number;
  projectedAnnualOpenings: number;
  percentSelfEmployed: number;
  jobOutlookTier: JobOutlookTier;

  jobEnvironment: JobEnvironment;
  aiExposure: ExposureLevel;
  remoteWorkPotential: RemoteWorkPotential;
}
