import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { UsOccupation } from '../../core/models/UsOccupation';
import { CareerOutlook } from '../../core/models/CareerOutlook';
import { COLUMN_GLOSSARY } from './column-glossary';

export type CareerRow = UsOccupation & Omit<CareerOutlook, 'socCode' | 'jobTitle'>;

type SortField =
  | 'jobTitle'
  | 'socMajorGroup'
  | 'totalEmployment'
  | 'medianAnnualWage'
  | 'meanAnnualWage'
  | 'pct10AnnualWage'
  | 'pct90AnnualWage'
  | 'typicalEducationNeeded'
  | 'workExperienceRequired'
  | 'projectedEmploymentChangePercent'
  | 'projectedAnnualOpenings'
  | 'jobOutlookTier'
  | 'jobEnvironment'
  | 'aiExposure'
  | 'remoteWorkPotential';

type SortDirection = 'asc' | 'desc';

interface Range {
  min: number;
  max: number;
}

const PAGE_SIZE = 25;

// Ordinal ranks for the categorical fields so sorting reflects their natural order rather than
// alphabetical order. Education/experience ranks come from how BLS itself orders these
// categories (least to most); the exposure/outlook ranks are this site's own scale (see
// CareerOutlook.ts for what's real BLS data vs. this site's own estimate).
const EDUCATION_RANK: Record<string, number> = {
  'No formal educational credential': 1,
  'High school diploma or equivalent': 2,
  'Some college, no degree': 3,
  'Postsecondary nondegree award': 4,
  "Associate's degree": 5,
  "Bachelor's degree": 6,
  "Master's degree": 7,
  'Doctoral or professional degree': 8,
};

const EXPERIENCE_RANK: Record<string, number> = {
  None: 1,
  'Less than 5 years': 2,
  '5 years or more': 3,
};

const EXPOSURE_RANK: Record<string, number> = { Low: 1, Moderate: 2, High: 3 };
const REMOTE_RANK: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

const OUTLOOK_RANK: Record<string, number> = {
  Declining: 1,
  'Little or No Change': 2,
  'Slower Than Average': 3,
  Average: 4,
  'Faster Than Average': 5,
  'Much Faster Than Average': 6,
};

const RANK_MAPS: Partial<Record<SortField, Record<string, number>>> = {
  typicalEducationNeeded: EDUCATION_RANK,
  workExperienceRequired: EXPERIENCE_RANK,
  aiExposure: EXPOSURE_RANK,
  remoteWorkPotential: REMOTE_RANK,
  jobOutlookTier: OUTLOOK_RANK,
};

@Component({
  selector: 'app-us-career-data',
  imports: [FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './us-career-data.html',
  styleUrl: './us-career-data.scss',
})
export class UsCareerData {
  private readonly http = inject(HttpClient);

  loading = signal(true);
  loadError = signal(false);

  occupations = signal<CareerRow[]>([]);

  search = signal('');
  socGroupFilter = signal('All');
  jobEnvironmentFilter = signal('All');
  aiExposureFilter = signal('All');
  remoteWorkFilter = signal('All');
  jobOutlookFilter = signal('All');
  educationFilter = signal('All');

  salaryBounds = signal<Range>({ min: 0, max: 0 });
  salaryMin = signal(0);
  salaryMax = signal(0);

  employmentBounds = signal<Range>({ min: 0, max: 0 });
  employmentMin = signal(0);
  employmentMax = signal(0);

  sortField = signal<SortField>('medianAnnualWage');
  sortDirection = signal<SortDirection>('desc');

  page = signal(1);

  showGlossary = signal(false);

  readonly columnGlossary = COLUMN_GLOSSARY;

  private distinctValues(
    field: keyof CareerRow,
    rankMap?: Record<string, number>,
  ): string[] {
    const values = new Set(this.occupations().map((o) => String(o[field])));
    const arr = [...values];
    arr.sort((a, b) => (rankMap ? (rankMap[a] ?? 0) - (rankMap[b] ?? 0) : a.localeCompare(b)));
    return arr;
  }

  socGroups = computed(() => this.distinctValues('socMajorGroup'));
  jobEnvironmentOptions = computed(() => this.distinctValues('jobEnvironment'));
  aiExposureOptions = computed(() => this.distinctValues('aiExposure', EXPOSURE_RANK));
  remoteWorkOptions = computed(() => this.distinctValues('remoteWorkPotential', REMOTE_RANK));
  jobOutlookOptions = computed(() => this.distinctValues('jobOutlookTier', OUTLOOK_RANK));
  educationOptions = computed(() => this.distinctValues('typicalEducationNeeded', EDUCATION_RANK));

  filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const socGroup = this.socGroupFilter();
    const jobEnvironment = this.jobEnvironmentFilter();
    const aiExposure = this.aiExposureFilter();
    const remoteWork = this.remoteWorkFilter();
    const jobOutlook = this.jobOutlookFilter();
    const education = this.educationFilter();
    const field = this.sortField();
    const direction = this.sortDirection();

    const salaryBounds = this.salaryBounds();
    const salaryMin = this.salaryMin();
    const salaryMax = this.salaryMax();
    const salaryFilterActive = salaryMin > salaryBounds.min || salaryMax < salaryBounds.max;

    const employmentBounds = this.employmentBounds();
    const employmentMin = this.employmentMin();
    const employmentMax = this.employmentMax();
    const employmentFilterActive =
      employmentMin > employmentBounds.min || employmentMax < employmentBounds.max;

    const rows = this.occupations().filter((o) => {
      if (socGroup !== 'All' && o.socMajorGroup !== socGroup) return false;
      if (jobEnvironment !== 'All' && o.jobEnvironment !== jobEnvironment) return false;
      if (aiExposure !== 'All' && o.aiExposure !== aiExposure) return false;
      if (remoteWork !== 'All' && o.remoteWorkPotential !== remoteWork) return false;
      if (jobOutlook !== 'All' && o.jobOutlookTier !== jobOutlook) return false;
      if (education !== 'All' && o.typicalEducationNeeded !== education) return false;
      if (search && !o.jobTitle.toLowerCase().includes(search)) return false;
      if (salaryFilterActive) {
        if (o.medianAnnualWage === null) return false;
        if (o.medianAnnualWage < salaryMin || o.medianAnnualWage > salaryMax) return false;
      }
      if (employmentFilterActive) {
        if (o.totalEmployment === null) return false;
        if (o.totalEmployment < employmentMin || o.totalEmployment > employmentMax) return false;
      }
      return true;
    });

    const rankMap = RANK_MAPS[field];

    const sorted = [...rows].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      let cmp: number;
      if (rankMap) {
        cmp = (rankMap[String(aValue)] ?? 0) - (rankMap[String(bValue)] ?? 0);
      } else if (aValue === null && bValue === null) {
        cmp = 0;
      } else if (aValue === null) {
        cmp = -1;
      } else if (bValue === null) {
        cmp = 1;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        cmp = aValue - bValue;
      } else {
        cmp = String(aValue).localeCompare(String(bValue));
      }
      return direction === 'asc' ? cmp : -cmp;
    });

    return sorted;
  });

  resultCount = computed(() => this.filtered().length);

  averageMedianAnnualWage = computed(() => {
    const rows = this.filtered().filter((o) => o.medianAnnualWage !== null);
    if (rows.length === 0) return 0;
    return rows.reduce((sum, o) => sum + (o.medianAnnualWage ?? 0), 0) / rows.length;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.resultCount() / PAGE_SIZE)));

  pagedRows = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    forkJoin({
      base: this.http.get<UsOccupation[]>('/data/us-career-data.json'),
      outlook: this.http.get<CareerOutlook[]>('/data/us-career-outlook.json'),
    }).subscribe({
      next: ({ base, outlook }) => {
        const outlookByCode = new Map(outlook.map((o) => [o.socCode, o]));
        const data: CareerRow[] = base.map((o) => {
          const match = outlookByCode.get(o.socCode);
          return { ...o, ...match } as CareerRow;
        });
        this.occupations.set(data);

        const wages = data
          .map((o) => o.medianAnnualWage)
          .filter((w): w is number => w !== null);
        const salaryBounds = { min: Math.min(...wages), max: Math.max(...wages) };
        this.salaryBounds.set(salaryBounds);
        this.salaryMin.set(salaryBounds.min);
        this.salaryMax.set(salaryBounds.max);

        const employment = data
          .map((o) => o.totalEmployment)
          .filter((e): e is number => e !== null);
        const employmentBounds = { min: Math.min(...employment), max: Math.max(...employment) };
        this.employmentBounds.set(employmentBounds);
        this.employmentMin.set(employmentBounds.min);
        this.employmentMax.set(employmentBounds.max);

        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  setFilter<T>(sig: WritableSignal<T>, value: T) {
    sig.set(value);
    this.page.set(1);
  }

  setSalaryMin(value: number) {
    this.salaryMin.set(Math.min(value, this.salaryMax()));
    this.page.set(1);
  }

  setSalaryMax(value: number) {
    this.salaryMax.set(Math.max(value, this.salaryMin()));
    this.page.set(1);
  }

  setEmploymentMin(value: number) {
    this.employmentMin.set(Math.min(value, this.employmentMax()));
    this.page.set(1);
  }

  setEmploymentMax(value: number) {
    this.employmentMax.set(Math.max(value, this.employmentMin()));
    this.page.set(1);
  }

  toggleGlossary() {
    this.showGlossary.set(!this.showGlossary());
  }

  sortBy(field: SortField) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.page.set(1);
  }

  sortIndicator(field: SortField): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  goToPage(page: number) {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  outlookClass(tier: string): string {
    switch (tier) {
      case 'Much Faster Than Average':
      case 'Faster Than Average':
        return 'chip chip-positive';
      case 'Average':
        return 'chip chip-neutral';
      case 'Slower Than Average':
      case 'Little or No Change':
        return 'chip chip-caution';
      default:
        return 'chip chip-negative';
    }
  }

  exposureClass(level: string): string {
    switch (level) {
      case 'Low':
        return 'chip chip-positive';
      case 'Moderate':
        return 'chip chip-caution';
      default:
        return 'chip chip-negative';
    }
  }

  remoteClass(level: string): string {
    switch (level) {
      case 'High':
        return 'chip chip-positive';
      case 'Medium':
        return 'chip chip-caution';
      default:
        return 'chip chip-neutral';
    }
  }
}
