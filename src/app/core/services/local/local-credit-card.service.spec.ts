import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LocalCreditCardService } from './local-credit-card.service';

describe('LocalCreditCardService', () => {
  let service: LocalCreditCardService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalCreditCardService);
  });

  it('should start empty', async () => {
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should create a credit card', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );

    expect(created.id).toBeTruthy();
    expect(await firstValueFrom(service.getById(created.id))).toEqual(created);
  });

  it('should return undefined from getById for a non-existent id', async () => {
    expect(await firstValueFrom(service.getById('missing'))).toBeUndefined();
  });

  it('should update a credit card', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );

    const updated = await firstValueFrom(service.update(created.id, { creditLimit: 4000 }));

    expect(updated.creditLimit).toBe(4000);
    expect(updated.name).toBe('Cartão Roxo');
    expect(await firstValueFrom(service.getById(created.id))).toEqual(updated);
  });

  it('should throw when updating a non-existent id', () => {
    expect(() => service.update('missing', { creditLimit: 1000 })).toThrow(
      'Cartão "missing" não encontrado.',
    );
  });

  it('should remove a credit card', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );

    await firstValueFrom(service.remove(created.id));

    expect(await firstValueFrom(service.getById(created.id))).toBeUndefined();
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should return all credit cards when getAll is called without filters', async () => {
    await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );
    await firstValueFrom(
      service.create({
        name: 'Cartão Azul',
        institution: 'Banco Y',
        creditLimit: 2000,
        closingDay: 10,
        dueDay: 20,
        active: false,
      }),
    );

    expect(await firstValueFrom(service.getAll())).toHaveLength(2);
  });

  it('should filter by active=true, without excluding inactive cards from the collection', async () => {
    await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );
    await firstValueFrom(
      service.create({
        name: 'Cartão Azul',
        institution: 'Banco Y',
        creditLimit: 2000,
        closingDay: 10,
        dueDay: 20,
        active: false,
      }),
    );

    const result = await firstValueFrom(service.getAll({ active: true }));

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Cartão Roxo');
  });

  it('should filter by active=false without treating it as "no filter"', async () => {
    await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );
    await firstValueFrom(
      service.create({
        name: 'Cartão Azul',
        institution: 'Banco Y',
        creditLimit: 2000,
        closingDay: 10,
        dueDay: 20,
        active: false,
      }),
    );

    const result = await firstValueFrom(service.getAll({ active: false }));

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Cartão Azul');
  });

  it('should not fabricate createdAt/updatedAt timestamps', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 3000,
        closingDay: 20,
        dueDay: 27,
        active: true,
      }),
    );

    expect(created.createdAt).toBeUndefined();
    expect(created.updatedAt).toBeUndefined();
  });
});

