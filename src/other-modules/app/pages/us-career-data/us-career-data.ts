import { Component, OnDestroy, WritableSignal, computed, inject, signal } from '@angular/core';
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

type RangeFilterKey =
  | 'medianAnnualWage'
  | 'meanAnnualWage'
  | 'pct10AnnualWage'
  | 'pct90AnnualWage'
  | 'totalEmployment'
  | 'projectedAnnualOpenings';

interface RangeFilterConfig {
  key: RangeFilterKey;
  label: string;
  hint: string;
  format: 'currency' | 'number';
}

interface RangeFilterSignals {
  bounds: WritableSignal<Range>;
  min: WritableSignal<number>;
  max: WritableSignal<number>;
}

const RANGE_FILTER_CONFIGS: RangeFilterConfig[] = [
  {
    key: 'medianAnnualWage',
    label: 'Median Annual Salary',
    hint: 'Only show jobs that typically pay in this range.',
    format: 'currency',
  },
  {
    key: 'meanAnnualWage',
    label: 'Average Salary',
    hint: 'Only show jobs whose average pay falls in this range.',
    format: 'currency',
  },
  {
    key: 'pct10AnnualWage',
    label: 'Low-End Pay',
    hint: 'Only show jobs whose lowest-paid workers (bottom 10%) earn in this range.',
    format: 'currency',
  },
  {
    key: 'pct90AnnualWage',
    label: 'High-End Pay',
    hint: 'Only show jobs whose highest-paid workers (top 10%) earn in this range.',
    format: 'currency',
  },
  {
    key: 'totalEmployment',
    label: 'Total Employment',
    hint: 'Only show jobs with about this many people currently working in them.',
    format: 'number',
  },
  {
    key: 'projectedAnnualOpenings',
    label: 'Annual Openings',
    hint: 'Only show jobs with about this many expected job openings per year.',
    format: 'number',
  },
];

const PAGE_SIZE = 25;
const MIN_COLUMN_WIDTH = 80;

// Starting pixel width for each table column. Users can drag a column's right edge to resize it;
// these are just the initial sizes.
const DEFAULT_COLUMN_WIDTHS: Record<SortField, number> = {
  jobTitle: 220,
  socMajorGroup: 240,
  totalEmployment: 140,
  medianAnnualWage: 150,
  meanAnnualWage: 140,
  pct10AnnualWage: 130,
  pct90AnnualWage: 130,
  typicalEducationNeeded: 200,
  workExperienceRequired: 190,
  projectedEmploymentChangePercent: 140,
  jobOutlookTier: 170,
  projectedAnnualOpenings: 140,
  jobEnvironment: 150,
  aiExposure: 130,
  remoteWorkPotential: 180,
};

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

// Plain-language versions of the real BLS category names, shown in the UI instead of the
// official wording. Sorting, filtering, and the underlying data still use the real BLS text
// above (the keys here) -- these are display-only.
const JOB_OUTLOOK_LABELS: Record<string, string> = {
  Declining: 'Shrinking (Fewer Jobs)',
  'Little or No Change': 'About the Same',
  'Slower Than Average': 'Growing Slowly',
  Average: 'Growing at a Normal Rate',
  'Faster Than Average': 'Growing Fast',
  'Much Faster Than Average': 'Growing Very Fast',
};

const EDUCATION_LABELS: Record<string, string> = {
  'No formal educational credential': 'No Degree Needed',
  'High school diploma or equivalent': 'High School Diploma',
  'Some college, no degree': 'Some College, No Degree',
  'Postsecondary nondegree award': 'Trade School / Certificate',
  "Associate's degree": '2-Year College Degree',
  "Bachelor's degree": '4-Year College Degree',
  "Master's degree": "Master's Degree (Grad School)",
  'Doctoral or professional degree': 'Doctorate or Professional Degree (PhD, MD, JD)',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  None: 'No Experience Needed',
  'Less than 5 years': 'Some Experience (Under 5 Years)',
  '5 years or more': 'Lots of Experience (5+ Years)',
};

// Hover-tooltip text for each table column, reusing the exact same explanations shown in the
// "What do these columns mean?" glossary panel above the table.
const glossaryByColumn = new Map(COLUMN_GLOSSARY.map((e) => [e.column, e.description]));
const ESTIMATE_COLUMNS_TOOLTIP = glossaryByColumn.get(
  'Job Environment, AI Exposure, Remote-Work Potential',
)!;
const LOW_HIGH_PAY_TOOLTIP = glossaryByColumn.get('Low-End / High-End Pay')!;

const COLUMN_TOOLTIPS: Record<string, string> = {
  jobTitle: glossaryByColumn.get('Job Title')!,
  socMajorGroup: glossaryByColumn.get('Job Category')!,
  totalEmployment: glossaryByColumn.get('Total Employment')!,
  medianAnnualWage: glossaryByColumn.get('Median Annual Salary')!,
  meanAnnualWage: glossaryByColumn.get('Average Salary (Mean Annual Wage)')!,
  pct10AnnualWage: LOW_HIGH_PAY_TOOLTIP,
  pct90AnnualWage: LOW_HIGH_PAY_TOOLTIP,
  typicalEducationNeeded: glossaryByColumn.get('Education Needed')!,
  workExperienceRequired: glossaryByColumn.get('Experience Required')!,
  jobOutlookTier: glossaryByColumn.get('Job Outlook')!,
  projectedAnnualOpenings: glossaryByColumn.get('Annual Openings')!,
  jobEnvironment: ESTIMATE_COLUMNS_TOOLTIP,
  aiExposure: ESTIMATE_COLUMNS_TOOLTIP,
  remoteWorkPotential: ESTIMATE_COLUMNS_TOOLTIP,
};

@Component({
  selector: 'app-us-career-data',
  imports: [FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './us-career-data.html',
  styleUrl: './us-career-data.scss',
})
export class UsCareerData implements OnDestroy {
  private readonly http = inject(HttpClient);

  columnWidths = signal<Record<SortField, number>>({ ...DEFAULT_COLUMN_WIDTHS });
  resizingField = signal<SortField | null>(null);
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  selectedRowCode = signal<string | null>(null);

  loading = signal(true);
  loadError = signal(false);

  occupations = signal<CareerRow[]>([]);

  search = signal('');
  socGroupFilter = signal<ReadonlySet<string>>(new Set());
  jobEnvironmentFilter = signal<ReadonlySet<string>>(new Set());
  aiExposureFilter = signal<ReadonlySet<string>>(new Set());
  remoteWorkFilter = signal<ReadonlySet<string>>(new Set());
  jobOutlookFilter = signal<ReadonlySet<string>>(new Set());
  educationFilter = signal<ReadonlySet<string>>(new Set());
  experienceFilter = signal<ReadonlySet<string>>(new Set());

  private readonly tileFilterSignals: WritableSignal<ReadonlySet<string>>[] = [
    this.socGroupFilter,
    this.jobEnvironmentFilter,
    this.aiExposureFilter,
    this.remoteWorkFilter,
    this.jobOutlookFilter,
    this.educationFilter,
    this.experienceFilter,
  ];

  readonly rangeFilterConfigs = RANGE_FILTER_CONFIGS;

  private readonly rangeSignals: Map<RangeFilterKey, RangeFilterSignals> = new Map(
    RANGE_FILTER_CONFIGS.map((config) => [
      config.key,
      { bounds: signal<Range>({ min: 0, max: 0 }), min: signal(0), max: signal(0) },
    ]),
  );

  sortField = signal<SortField>('medianAnnualWage');
  sortDirection = signal<SortDirection>('desc');

  page = signal(1);

  showGlossary = signal(false);
  filtersExpanded = signal(false);
  socGroupExpanded = signal(false);
  educationExpanded = signal(false);

  readonly columnGlossary = COLUMN_GLOSSARY;

  private distinctValues(field: keyof CareerRow, rankMap?: Record<string, number>): string[] {
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
  experienceOptions = computed(() =>
    this.distinctValues('workExperienceRequired', EXPERIENCE_RANK),
  );

  filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const socGroup = this.socGroupFilter();
    const jobEnvironment = this.jobEnvironmentFilter();
    const aiExposure = this.aiExposureFilter();
    const remoteWork = this.remoteWorkFilter();
    const jobOutlook = this.jobOutlookFilter();
    const education = this.educationFilter();
    const experience = this.experienceFilter();
    const field = this.sortField();
    const direction = this.sortDirection();

    const activeRanges = RANGE_FILTER_CONFIGS.map((config) => {
      const group = this.rangeSignals.get(config.key)!;
      const bounds = group.bounds();
      const min = group.min();
      const max = group.max();
      return { key: config.key, min, max, active: min > bounds.min || max < bounds.max };
    }).filter((r) => r.active);

    const rows = this.occupations().filter((o) => {
      if (socGroup.size > 0 && !socGroup.has(o.socMajorGroup)) return false;
      if (jobEnvironment.size > 0 && !jobEnvironment.has(o.jobEnvironment)) return false;
      if (aiExposure.size > 0 && !aiExposure.has(o.aiExposure)) return false;
      if (remoteWork.size > 0 && !remoteWork.has(o.remoteWorkPotential)) return false;
      if (jobOutlook.size > 0 && !jobOutlook.has(o.jobOutlookTier)) return false;
      if (education.size > 0 && !education.has(o.typicalEducationNeeded)) return false;
      if (experience.size > 0 && !experience.has(o.workExperienceRequired)) return false;
      if (search && !o.jobTitle.toLowerCase().includes(search)) return false;
      for (const r of activeRanges) {
        const value = o[r.key] as number | null;
        if (value === null || value < r.min || value > r.max) return false;
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

  hasActiveFilters = computed(() => {
    if (this.search().trim().length > 0) return true;
    if (this.tileFilterSignals.some((sig) => sig().size > 0)) return true;
    return RANGE_FILTER_CONFIGS.some((config) => {
      const group = this.rangeSignals.get(config.key)!;
      const bounds = group.bounds();
      return group.min() > bounds.min || group.max() < bounds.max;
    });
  });

  averageMedianAnnualWage = computed(() => {
    const rows = this.filtered().filter((o) => o.medianAnnualWage !== null);
    if (rows.length === 0) return 0;
    return rows.reduce((sum, o) => sum + (o.medianAnnualWage ?? 0), 0) / rows.length;
  });

  // Summed once (via computed()'s own caching) across every occupation in the dataset, not just
  // the filtered rows -- this is the fixed denominator each row's employment share is based on.
  totalEmploymentSum = computed(() =>
    this.occupations().reduce((sum, o) => sum + (o.totalEmployment ?? 0), 0),
  );

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

        for (const config of RANGE_FILTER_CONFIGS) {
          const values = data
            .map((o) => o[config.key] as number | null)
            .filter((v): v is number => v !== null);
          const bounds = { min: Math.min(...values), max: Math.max(...values) };
          const group = this.rangeSignals.get(config.key)!;
          group.bounds.set(bounds);
          group.min.set(bounds.min);
          group.max.set(bounds.max);
        }

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

  toggleFilterValue(sig: WritableSignal<ReadonlySet<string>>, value: string) {
    const next = new Set(sig());
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    sig.set(next);
    this.page.set(1);
  }

  clearFilterGroup(sig: WritableSignal<ReadonlySet<string>>) {
    sig.set(new Set());
    this.page.set(1);
  }

  resetAllFilters() {
    this.search.set('');
    for (const sig of this.tileFilterSignals) {
      sig.set(new Set());
    }
    for (const config of RANGE_FILTER_CONFIGS) {
      const group = this.rangeSignals.get(config.key)!;
      const bounds = group.bounds();
      group.min.set(bounds.min);
      group.max.set(bounds.max);
    }
    this.page.set(1);
  }

  selectedValues(sig: WritableSignal<ReadonlySet<string>>): string[] {
    return [...sig()];
  }

  rangeBounds(key: RangeFilterKey): Range {
    return this.rangeSignals.get(key)!.bounds();
  }

  rangeMin(key: RangeFilterKey): number {
    return this.rangeSignals.get(key)!.min();
  }

  rangeMax(key: RangeFilterKey): number {
    return this.rangeSignals.get(key)!.max();
  }

  setRangeMin(key: RangeFilterKey, value: number) {
    const group = this.rangeSignals.get(key)!;
    group.min.set(Math.min(value, group.max()));
    this.page.set(1);
  }

  setRangeMax(key: RangeFilterKey, value: number) {
    const group = this.rangeSignals.get(key)!;
    group.max.set(Math.max(value, group.min()));
    this.page.set(1);
  }

  toggleGlossary() {
    this.showGlossary.set(!this.showGlossary());
  }

  toggleExpanded(sig: WritableSignal<boolean>) {
    sig.set(!sig());
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

  toggleRowSelection(socCode: string) {
    this.selectedRowCode.set(this.selectedRowCode() === socCode ? null : socCode);
  }

  columnWidth(field: SortField): number {
    return this.columnWidths()[field];
  }

  startResize(event: MouseEvent, field: SortField) {
    event.preventDefault();
    event.stopPropagation();
    this.resizingField.set(field);
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.columnWidths()[field];
    window.addEventListener('mousemove', this.onResizeMove);
    window.addEventListener('mouseup', this.onResizeEnd);
  }

  resetColumnWidth(event: MouseEvent, field: SortField) {
    event.preventDefault();
    event.stopPropagation();
    this.columnWidths.update((widths) => ({ ...widths, [field]: DEFAULT_COLUMN_WIDTHS[field] }));
  }

  private onResizeMove = (event: MouseEvent) => {
    const field = this.resizingField();
    if (!field) return;
    const delta = event.clientX - this.resizeStartX;
    const newWidth = Math.max(MIN_COLUMN_WIDTH, this.resizeStartWidth + delta);
    this.columnWidths.update((widths) => ({ ...widths, [field]: newWidth }));
  };

  private onResizeEnd = () => {
    this.resizingField.set(null);
    window.removeEventListener('mousemove', this.onResizeMove);
    window.removeEventListener('mouseup', this.onResizeEnd);
  };

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.onResizeMove);
    window.removeEventListener('mouseup', this.onResizeEnd);
  }

  jobOutlookLabel(tier: string): string {
    return JOB_OUTLOOK_LABELS[tier] ?? tier;
  }

  educationLabel(level: string): string {
    return EDUCATION_LABELS[level] ?? level;
  }

  experienceLabel(level: string): string {
    return EXPERIENCE_LABELS[level] ?? level;
  }

  columnTooltip(field: SortField): string {
    return COLUMN_TOOLTIPS[field] ?? '';
  }

  employmentShareTooltip(value: number | null): string {
    if (value === null) return '';
    const total = this.totalEmploymentSum();
    if (total === 0) return '';
    const pct = (value / total) * 100;
    const pctText = pct < 0.01 ? pct.toFixed(4) : pct < 1 ? pct.toFixed(3) : pct.toFixed(2);
    return `${pctText}% of the ${total.toLocaleString()} total jobs summed across every occupation in this dataset`;
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
