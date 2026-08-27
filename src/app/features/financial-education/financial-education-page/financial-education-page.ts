import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { FinancialEducationCategory, FinancialEducationTopic } from '../../../core/models';
import { FinancialEducationService } from '../../../core/services/financial-education.service';
import { FINANCIAL_EDUCATION_CATEGORY_LABELS } from '../../../core/utils/labels.util';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/**
 * "Me explica": área de educação financeira contextual do Prumo. Toda a
 * busca e o conteúdo vêm de `FinancialEducationService`; este componente
 * só exibe listas, filtros e o conceito selecionado.
 */
@Component({
  selector: 'app-financial-education-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    EmptyState,
    PageHeader,
  ],
  templateUrl: './financial-education-page.html',
  styleUrl: './financial-education-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialEducationPage {
  private readonly financialEducationService = inject(FinancialEducationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categoryLabels = FINANCIAL_EDUCATION_CATEGORY_LABELS;
  readonly categories = Object.values(FinancialEducationCategory);

  readonly searchForm = this.formBuilder.nonNullable.group({ query: '' });
  private readonly query = toSignal(this.searchForm.controls.query.valueChanges, { initialValue: '' });

  readonly selectedCategory = signal<FinancialEducationCategory | null>(null);
  readonly selectedTopic = signal<FinancialEducationTopic | null>(null);
  readonly relatedTopics = signal<FinancialEducationTopic[]>([]);

  private readonly allTopics = signal<FinancialEducationTopic[]>([]);
  private readonly searchResults = signal<FinancialEducationTopic[] | null>(null);

  readonly visibleTopics = computed(() => {
    const results = this.searchResults() ?? this.allTopics();
    const category = this.selectedCategory();
    return category ? results.filter((topic) => topic.category === category) : results;
  });

  constructor() {
    this.financialEducationService.getAll().subscribe((topics) => this.allTopics.set(topics));

    const initialSlug = this.route.snapshot.queryParamMap.get('topico');
    if (initialSlug) {
      this.openBySlug(initialSlug);
    }
  }

  search(): void {
    const query = this.query().trim();
    if (!query) {
      this.searchResults.set(null);
      return;
    }
    this.financialEducationService.search(query).subscribe((results) => this.searchResults.set(results));
  }

  clearSearch(): void {
    this.searchForm.reset({ query: '' });
    this.searchResults.set(null);
  }

  filterByCategory(category: FinancialEducationCategory | null): void {
    this.selectedCategory.set(category);
  }

  open(topic: FinancialEducationTopic): void {
    this.selectedTopic.set(topic);
    this.financialEducationService
      .getRelatedTopics(topic)
      .subscribe((related) => this.relatedTopics.set(related));
    this.router.navigate([], { queryParams: { topico: topic.slug }, relativeTo: this.route });
  }

  closeTopic(): void {
    this.selectedTopic.set(null);
    this.relatedTopics.set([]);
    this.router.navigate([], { queryParams: {}, relativeTo: this.route });
  }

  openRelated(topic: FinancialEducationTopic): void {
    this.open(topic);
  }

  private openBySlug(slug: string): void {
    this.financialEducationService.getBySlug(slug).subscribe((topic) => {
      if (topic) {
        this.selectedTopic.set(topic);
        this.financialEducationService
          .getRelatedTopics(topic)
          .subscribe((related) => this.relatedTopics.set(related));
      }
    });
  }
}
