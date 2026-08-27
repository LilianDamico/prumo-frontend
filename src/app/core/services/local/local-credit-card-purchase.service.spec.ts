import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LocalCreditCardPurchaseService } from './local-credit-card-purchase.service';

describe('LocalCreditCardPurchaseService', () => {
  let service: LocalCreditCardPurchaseService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalCreditCardPurchaseService);
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
        installmentsCount: 6,
        categoryId: 'compras',
      }),
    );

    expect(created.id).toBeTruthy();
    expect(await firstValueFrom(service.getByCard('card-1'))).toEqual([created]);
    expect(await firstValueFrom(service.getByCard('card-2'))).toEqual([]);
  });

  it('should remove a purchase', async () => {
    const created = await firstValueFrom(
      service.create({
        creditCardId: 'card-1',
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentsCount: 6,
        categoryId: 'compras',
      }),
    );

    await firstValueFrom(service.remove(created.id));

    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });
});
