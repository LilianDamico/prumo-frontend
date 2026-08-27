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
});
