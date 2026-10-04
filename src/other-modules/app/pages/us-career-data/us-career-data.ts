import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { UsOccupation } from '../../core/models/UsOccupation';
import { COLUMN_GLOSSARY } from './column-glossary';

type SortField =
  | 'jobTitle'
  | 'socMajorGroup'
  | 'totalEmployment'
  | 'medianAnnualWage'
  | 'meanAnnualWage'
  | 'pct10AnnualWage'
  | 'pct90AnnualWage';

type SortDirection = 'asc' | 'desc';

interface Range {
  min: number;
  max: number;
}

const PAGE_SIZE = 25;

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

  occupations = signal<UsOccupation[]>([]);

  search = signal('');
  socGroupFilter = signal('All');

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

  socGroups = computed(() => {
    const values = new Set(this.occupations().map((o) => o.socMajorGroup));
    return [...values].sort((a, b) => a.localeCompare(b));
  });

  filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const socGroup = this.socGroupFilter();
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

    const sorted = [...rows].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      let cmp: number;
      if (aValue === null && bValue === null) {
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
    this.http.get<UsOccupation[]>('/data/us-career-data.json').subscribe({
      next: (data) => {
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
}
