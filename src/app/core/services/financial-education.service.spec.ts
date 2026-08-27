import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { FinancialEducationCategory } from '../models';
import { FinancialEducationService } from './financial-education.service';

describe('FinancialEducationService', () => {
  let service: FinancialEducationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialEducationService);
  });

  it('lista todos os conteúdos cadastrados', async () => {
    const topics = await firstValueFrom(service.getAll());
    expect(topics.length).toBeGreaterThanOrEqual(20);
  });

  it('localiza um conteúdo por slug', async () => {
    const topic = await firstValueFrom(service.getBySlug('valor-realmente-disponivel'));
    expect(topic?.title).toBe('Valor realmente disponível');
  });

  it('busca por título', async () => {
    const results = await firstValueFrom(service.search('Amortização'));
    expect(results.some((topic) => topic.id === 'amortizacao')).toBe(true);
  });

  it('busca por palavra-chave', async () => {
    const results = await firstValueFrom(service.search('custo do emprestimo'));
    expect(results.some((topic) => topic.id === 'cet')).toBe(true);
  });

  it('busca por expressão popular sem termo técnico', async () => {
    const results = await firstValueFrom(service.search('pagar só uma parte do cartão'.replace('só', 'so')));
    expect(results.some((topic) => topic.id === 'pagamento-minimo-cartao')).toBe(true);

    const results2 = await firstValueFrom(service.search('quanto posso gastar'));
    expect(results2.some((topic) => topic.id === 'valor-realmente-disponivel')).toBe(true);
  });

  it('filtra por categoria', async () => {
    const results = await firstValueFrom(service.getByCategory(FinancialEducationCategory.CREDIT_CARD));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((topic) => topic.category === FinancialEducationCategory.CREDIT_CARD)).toBe(true);
  });

  it('retorna conceitos relacionados', async () => {
    const topic = await firstValueFrom(service.getBySlug('valor-realmente-disponivel'));
    expect(topic).toBeDefined();
    const related = await firstValueFrom(service.getRelatedTopics(topic!));
    expect(related.some((candidate) => candidate.id === 'renda-comprometida')).toBe(true);
  });

  it('retorna lista vazia para uma busca inexistente', async () => {
    const results = await firstValueFrom(service.search('xablau inexistente 123'));
    expect(results).toEqual([]);
  });

  it('normaliza maiúsculas e minúsculas na busca', async () => {
    const lower = await firstValueFrom(service.search('juros'));
    const upper = await firstValueFrom(service.search('JUROS'));
    expect(upper.map((topic) => topic.id)).toEqual(lower.map((topic) => topic.id));
  });

  it('busca funciona com e sem acentos', async () => {
    const withAccent = await firstValueFrom(service.search('amortização'));
    const withoutAccent = await firstValueFrom(service.search('amortizacao'));
    expect(withAccent.some((topic) => topic.id === 'amortizacao')).toBe(true);
    expect(withoutAccent.some((topic) => topic.id === 'amortizacao')).toBe(true);
  });

  it('busca inexistente não inventa nenhum resultado', async () => {
    const results = await firstValueFrom(service.search('criptomoeda inexistente no prumo'));
    expect(results).toHaveLength(0);
  });
});
