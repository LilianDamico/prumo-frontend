import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CreditCardPurchase } from '../../models';
import { LocalStorageService } from '../storage/local-storage.service';
import { LocalCreditCardPurchaseService } from './local-credit-card-purchase.service';

const STORAGE_KEY = 'prumo.credit-card-purchases';

describe('LocalCreditCardPurchaseService', () => {
  let service: LocalCreditCardPurchaseService;
  let storage: LocalStorageService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalCreditCardPurchaseService);
    storage = TestBed.inject(LocalStorageService);
  });

  it('should start with no purchases (no fictional data)', async () => {
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should create a purchase linked to a card', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'compras',
      }),
    );

    expect(created.id).toBeTruthy();
    expect(created.installmentCount).toBe(6);
    expect(await firstValueFrom(service.getByCard('card-1'))).toEqual([created]);
    expect(await firstValueFrom(service.getByCard('card-2'))).toEqual([]);
  });

  it('should get a purchase by id', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'compras',
      }),
    );

    expect(await firstValueFrom(service.getById(created.id))).toEqual(created);
    expect(await firstValueFrom(service.getById('inexistente'))).toBeUndefined();
  });

  it('should update an existing purchase', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'compras',
      }),
    );

    const updated = await firstValueFrom(service.update(created.id, { totalAmount: 1500, installmentCount: 3 }));

    expect(updated.totalAmount).toBe(1500);
    expect(updated.installmentCount).toBe(3);
    expect(updated.description).toBe('Geladeira');
  });

  it('should throw when updating an id that does not exist', () => {
    expect(() => service.update('inexistente', { totalAmount: 10 })).toThrow();
  });

  it('should remove a purchase', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'compras',
      }),
    );

    await firstValueFrom(service.remove(created.id));

    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should support getByCard filtering purchases from other cards', async () => {
    await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Compra A',
        totalAmount: 100,
        purchaseDate: '2026-01-01',
        installmentCount: 1,
        categoryId: 'compras',
      }),
    );
    await firstValueFrom(
      service.create({
        creditCardId: 'card-2',
        description: 'Compra B',
        totalAmount: 200,
        purchaseDate: '2026-01-02',
        installmentCount: 1,
        categoryId: 'compras',
      }),
    );

    const cardOnePurchases = await firstValueFrom(service.getByCard('card-1'));
    expect(cardOnePurchases.length).toBe(1);
    expect(cardOnePurchases[0].description).toBe('Compra A');
  });

  it('should read legacy records stored with the old installmentsCount field', async () => {
    const legacy = {
      id: 'legacy-1',
      creditCardId: 'card-1',
      description: 'Compra antiga',
      totalAmount: 900,
      purchaseDate: '2025-05-10',
      installmentsCount: 3,
      categoryId: 'compras',
    } as unknown as CreditCardPurchase;
    storage.setItem(STORAGE_KEY, [legacy]);

    const all = await firstValueFrom(service.getAll());

    expect(all.length).toBe(1);
    expect(all[0].installmentCount).toBe(3);
    expect((all[0] as unknown as { installmentsCount?: number }).installmentsCount).toBeUndefined();
  });

  it('should not rewrite the localStorage when normalizing legacy records on read', async () => {
    const legacy = {
      id: 'legacy-1',
      creditCardId: 'card-1',
      description: 'Compra antiga',
      totalAmount: 900,
      purchaseDate: '2025-05-10',
      installmentsCount: 3,
      categoryId: 'compras',
    } as unknown as CreditCardPurchase;
    storage.setItem(STORAGE_KEY, [legacy]);

    await firstValueFrom(service.getAll());
    await firstValueFrom(service.getById('legacy-1'));

    const rawStored = storage.getItem<Array<Record<string, unknown>>>(STORAGE_KEY);
    expect(rawStored?.[0]['installmentsCount']).toBe(3);
    expect(rawStored?.[0]['installmentCount']).toBeUndefined();
  });

  it('should preserve timestamps if present, without fabricating new ones', async () => {
    const withTimestamps = {
      id: 'with-ts',
      creditCardId: 'card-1',
      description: 'Compra com timestamps',
      totalAmount: 300,
      purchaseDate: '2026-02-01',
      installmentCount: 2,
      categoryId: 'compras',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-02T10:00:00Z',
    } as CreditCardPurchase;
    storage.setItem(STORAGE_KEY, [withTimestamps]);

    const [purchase] = await firstValueFrom(service.getAll());

    expect(purchase.createdAt).toBe('2026-02-01T10:00:00Z');
    expect(purchase.updatedAt).toBe('2026-02-02T10:00:00Z');
  });

  it('should not fabricate timestamps for records that never had them', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Sem timestamps',
        totalAmount: 300,
        purchaseDate: '2026-02-01',
        installmentCount: 1,
        categoryId: 'compras',
      }),
    );

    expect(created.createdAt).toBeUndefined();
    expect(created.updatedAt).toBeUndefined();
  });

  it('should preserve installmentAmount if already present, without calculating it locally', async () => {
    const withInstallmentAmount = {
      id: 'with-amount',
      creditCardId: 'card-1',
      description: 'Compra com installmentAmount',
      totalAmount: 300,
      purchaseDate: '2026-02-01',
      installmentCount: 3,
      categoryId: 'compras',
      installmentAmount: 100,
    } as CreditCardPurchase;
    storage.setItem(STORAGE_KEY, [withInstallmentAmount]);

    const [purchase] = await firstValueFrom(service.getAll());

    expect(purchase.installmentAmount).toBe(100);
  });

  it('should not compute or persist installmentAmount when creating a purchase', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Sem installmentAmount',
        totalAmount: 300,
        purchaseDate: '2026-02-01',
        installmentCount: 3,
        categoryId: 'compras',
      }),
    );

    expect(created.installmentAmount).toBeUndefined();
  });

  it('should preserve purchaseDate literally, without any date transformation', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Data literal',
        totalAmount: 300,
        purchaseDate: '2026-12-31',
        installmentCount: 1,
        categoryId: 'compras',
      }),
    );

    expect(created.purchaseDate).toBe('2026-12-31');
  });

  it('should preserve totalAmount without rounding or transformation', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Valor preciso',
        totalAmount: 199.99,
        purchaseDate: '2026-02-01',
        installmentCount: 1,
        categoryId: 'compras',
      }),
    );

    expect(created.totalAmount).toBe(199.99);
  });
});
