import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DebtStatus, DebtType } from '../../../core/models';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { DebtsPage } from './debts-page';

describe('DebtsPage', () => {
  let component: DebtsPage;
  let fixture: ComponentFixture<DebtsPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DebtsPage],
      providers: [...CORE_SERVICE_PROVIDERS, provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há dívidas cadastradas', () => {
    expect(component.debts()).toEqual([]);
  });

  it('cria uma dívida sem taxa de juros informada', () => {
    component.startCreate();
    component.form.patchValue({
      creditor: 'Banco X',
      description: 'Empréstimo pessoal',
      type: DebtType.PERSONAL_LOAN,
      originalAmount: 1000,
      currentBalance: 800,
      dueDay: 10,
      startDate: '2026-01-01',
      status: DebtStatus.ACTIVE,
    });
    component.save();

    expect(component.debts().length).toBe(1);
    expect(component.debts()[0].interestRateMonthly).toBeUndefined();
    expect(component.interestExplanation(component.debts()[0])).toBeNull();
  });

  it('calcula a aproximação de juros quando a taxa é informada', () => {
    component.startCreate();
    component.form.patchValue({ interestRateMonthly: 8 });
    expect(component.monthlyInterestPerThousand()).toBe(80);
  });
});

