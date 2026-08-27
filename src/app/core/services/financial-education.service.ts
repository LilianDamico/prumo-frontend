import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { FinancialEducationCategory, FinancialEducationTopic } from '../models';
import { normalizeSearchText } from '../utils/text.util';
import { FINANCIAL_EDUCATION_TOPICS } from './data/financial-education-topics.data';

/**
 * Fornece os conceitos financeiros de "Me explica". Centraliza a única
 * fonte de conteúdo explicativo do Prumo (`FINANCIAL_EDUCATION_TOPICS`),
 * usada tanto pela página de busca quanto pelas explicações contextuais
 * (`InfoExplanation`) em outras telas.
 *
 * Os conteúdos são locais nesta etapa, mas o contrato (retornar
 * `Observable`) permite trocar a fonte por uma chamada ao backend no
 * futuro, sem que os componentes precisem mudar.
 */
@Injectable({ providedIn: 'root' })
export class FinancialEducationService {
  private readonly topics: FinancialEducationTopic[] = FINANCIAL_EDUCATION_TOPICS;

  /** Todos os conceitos cadastrados. */
  getAll(): Observable<FinancialEducationTopic[]> {
    return of(this.topics);
  }

  /** Busca um conceito pelo `id`. */
  getById(id: string): Observable<FinancialEducationTopic | undefined> {
    return of(this.topics.find((topic) => topic.id === id));
  }

  /** Busca um conceito pelo `slug` (usado em navegação/URLs). */
  getBySlug(slug: string): Observable<FinancialEducationTopic | undefined> {
    return of(this.topics.find((topic) => topic.slug === slug));
  }

  /** Filtra conceitos por categoria. */
  getByCategory(category: FinancialEducationCategory): Observable<FinancialEducationTopic[]> {
    return of(this.topics.filter((topic) => topic.category === category));
  }

  /** Conceitos relacionados a um determinado conceito (por `id`). */
  getRelatedTopics(topic: FinancialEducationTopic): Observable<FinancialEducationTopic[]> {
    const relatedIds = new Set(topic.relatedTopics);
    return of(this.topics.filter((candidate) => relatedIds.has(candidate.id)));
  }

  /**
   * Pesquisa por palavras, sem exigir termo técnico exato: compara o texto
   * digitado (normalizado, sem acentos e sem diferenciar maiúsculas de
   * minúsculas) com título, palavras-chave e nomes dos tópicos
   * relacionados, para que expressões populares (ex.: "quanto posso
   * gastar") encontrem o conceito técnico correspondente (ex.: "Valor
   * realmente disponível").
   */
  search(query: string): Observable<FinancialEducationTopic[]> {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return of(this.topics);
    }

    const relatedTitleById = new Map(this.topics.map((topic) => [topic.id, topic.title]));

    return of(
      this.topics.filter((topic) => {
        const haystack = [
          topic.title,
          topic.shortExplanation,
          ...topic.keywords,
          ...topic.relatedTopics.map((relatedId) => relatedTitleById.get(relatedId) ?? ''),
        ]
          .map(normalizeSearchText)
          .join(' | ');

        return haystack.includes(normalizedQuery);
      }),
    );
  }
}
