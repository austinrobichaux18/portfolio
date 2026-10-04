import { Component, computed, signal } from '@angular/core';
import { LEARNING_RESOURCE_CATEGORIES } from '../../core/data/learning-resources';
import { LearningResourceCategory } from '../../core/models/LearningResource';

@Component({
  selector: 'app-learning-resources',
  imports: [],
  templateUrl: './learning-resources.html',
  styleUrl: './learning-resources.scss',
})
export class LearningResources {
  readonly categories = LEARNING_RESOURCE_CATEGORIES;

  search = signal('');

  filteredCategories = computed<LearningResourceCategory[]>(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.categories;

    return this.categories
      .map((category) => ({
        ...category,
        resources: category.resources.filter(
          (r) =>
            r.title.toLowerCase().includes(query) || (r.note ?? '').toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.resources.length > 0);
  });

  resultCount = computed(() =>
    this.filteredCategories().reduce((sum, c) => sum + c.resources.length, 0),
  );
}
