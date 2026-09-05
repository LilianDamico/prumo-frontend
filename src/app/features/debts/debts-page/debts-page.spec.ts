import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of } from 'rxjs';

import { Debt, DebtStatus, DebtType } from '../../../core/models';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import {
  CreateDebtInput,
  DebtFilters,
  DebtService,
  UpdateDebtInput,
} from '../../../core/services/debt.service';
import { LocalDebtService } from '../../../core/services/local/local-debt.service';
import { DebtsPage } from './debts-page';

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    creditor: 'Banco X',
    description: 'Empréstimo',
    type: DebtType.PERSONAL_LOAN,
    originalAmount: 1000,
    currentBalance: 800,
    dueDay: 15,
    startDate: '2026-01-01',
    status: DebtStatus.ACTIVE,
    ...overrides,
  };
}

/** Dublê de `DebtService` cujas emissões de `getAll` são controladas manualmente pelo teste. */
class ControlledDebtService extends DebtService {
  readonly subject = new Subject<Debt[]>();
  override getAll(_filters?: DebtFilters): Observable<Debt[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<Debt | undefined> {
    throw new Error('not implemented');
  }
  override create(_input: CreateDebtInput): Observable<Debt> {
    throw new Error('not implemented');
  }
  override update(_id: string, _changes: UpdateDebtInput): Observable<Debt> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

describe('DebtsPage', () => {
  let component: DebtsPage;
  let fixture: ComponentFixture<DebtsPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DebtsPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
        // A tela é testada com o `DebtService` local: os testes de
        // componente não exercitam a integração HTTP (coberta em
        // http-debt.service.spec.ts) e não devem depender de rede.
        { provide: DebtService, useClass: LocalDebtService },
      ],
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
    expect(component.loading()).toBe(false);
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

  it('edita uma dívida existente', () => {
    component.startCreate();
    component.form.patchValue({
      creditor: 'Banco X',
      description: 'Empréstimo',
      originalAmount: 1000,
      currentBalance: 800,
      dueDay: 10,
      startDate: '2026-01-01',
      status: DebtStatus.ACTIVE,
    });
    component.save();

    const created = component.debts()[0];
    component.startEdit(created);
    component.form.patchValue({ currentBalance: 600 });
    component.save();

    expect(component.debts()[0].currentBalance).toBe(600);
  });

  it('remove uma dívida existente após confirmação', () => {
    component.startCreate();
    component.form.patchValue({
      creditor: 'Banco X',
      description: 'Empréstimo',
      originalAmount: 1000,
      currentBalance: 800,
      dueDay: 10,
      startDate: '2026-01-01',
      status: DebtStatus.ACTIVE,
    });
    component.save();

    const created = component.debts()[0];
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

    component.remove(created);

    expect(component.debts()).toEqual([]);
  });

  describe('invariante status × saldo', () => {
    beforeEach(() => component.startCreate());

    it('não-PAID com saldo zero é inválido', () => {
      component.form.patchValue({ status: DebtStatus.ACTIVE, currentBalance: 0 });
      expect(component.form.errors?.['activeRequiresPositiveBalance']).toBe(true);
    });

    it('não-PAID com saldo positivo é válido', () => {
      component.form.patchValue({ status: DebtStatus.ACTIVE, currentBalance: 100 });
      expect(component.form.errors?.['activeRequiresPositiveBalance']).toBeUndefined();
      expect(component.form.errors?.['paidRequiresZeroBalance']).toBeUndefined();
    });

    it('ao selecionar PAID, força currentBalance para zero automaticamente', () => {
      component.form.patchValue({ currentBalance: 500 });
      component.form.patchValue({ status: DebtStatus.PAID });
      expect(component.form.controls.currentBalance.value).toBe(0);
      expect(component.form.errors?.['paidRequiresZeroBalance']).toBeUndefined();
    });

    it('mudar de PAID para ACTIVE mantendo saldo zero permanece inválido (sem inventar saldo)', () => {
      component.form.patchValue({ currentBalance: 500 });
      component.form.patchValue({ status: DebtStatus.PAID });
      expect(component.form.controls.currentBalance.value).toBe(0);

      component.form.patchValue({ status: DebtStatus.ACTIVE });
      expect(component.form.controls.currentBalance.value).toBe(0);
      expect(component.form.errors?.['activeRequiresPositiveBalance']).toBe(true);
    });
  });

  describe('invariante de parcelas', () => {
    beforeEach(() => component.startCreate());

    it('ambos os campos vazios é válido', () => {
      component.form.patchValue({ currentBalance: 100 });
      expect(component.form.errors?.['installmentsPairMismatch']).toBeUndefined();
    });

    it('ambos os campos preenchidos coerentemente é válido', () => {
      component.form.patchValue({ currentBalance: 100, totalInstallments: 10, remainingInstallments: 5 });
      expect(component.form.errors?.['installmentsPairMismatch']).toBeUndefined();
    });

    it('apenas totalInstallments preenchido é inválido', () => {
      component.form.patchValue({ currentBalance: 100, totalInstallments: 10 });
      expect(component.form.errors?.['installmentsPairMismatch']).toBe(true);
    });

    it('apenas remainingInstallments preenchido é inválido', () => {
      component.form.patchValue({ currentBalance: 100, remainingInstallments: 5 });
      expect(component.form.errors?.['installmentsPairMismatch']).toBe(true);
    });

    it('remainingInstallments maior que totalInstallments é inválido', () => {
      component.form.patchValue({ currentBalance: 100, totalInstallments: 5, remainingInstallments: 10 });
      expect(component.form.errors?.['remainingExceedsTotal']).toBe(true);
    });

    it('PAID com remainingInstallments=0 é válido', () => {
      component.form.patchValue({ totalInstallments: 10, remainingInstallments: 0, currentBalance: 500 });
      component.form.patchValue({ status: DebtStatus.PAID });
      expect(component.form.controls.remainingInstallments.value).toBe(0);
      expect(component.form.errors?.['paidRequiresZeroRemaining']).toBeUndefined();
    });

    it('PAID com remainingInstallments>0 é inválido', () => {
      component.form.patchValue({
        status: DebtStatus.PAID,
        totalInstallments: 10,
        remainingInstallments: 3,
        currentBalance: 0,
      });
      expect(component.form.errors?.['paidRequiresZeroRemaining']).toBe(true);
    });

    it('ACTIVE com remainingInstallments=0 é inválido', () => {
      component.form.patchValue({
        status: DebtStatus.ACTIVE,
        totalInstallments: 10,
        remainingInstallments: 0,
        currentBalance: 100,
      });
      expect(component.form.errors?.['activeRequiresPositiveRemaining']).toBe(true);
    });
  });

  describe('valores monetários opcionais', () => {
    beforeEach(() => component.startCreate());

    it('minimumPayment vazio é válido', () => {
      expect(component.form.controls.minimumPayment.valid).toBe(true);
    });

    it('minimumPayment igual a zero é inválido', () => {
      component.form.patchValue({ minimumPayment: 0 });
      expect(component.form.controls.minimumPayment.hasError('min')).toBe(true);
    });

    it('installmentAmount vazio é válido', () => {
      expect(component.form.controls.installmentAmount.valid).toBe(true);
    });

    it('installmentAmount igual a zero é inválido', () => {
      component.form.patchValue({ installmentAmount: 0 });
      expect(component.form.controls.installmentAmount.hasError('min')).toBe(true);
    });

    it('interestRateMonthly vazio é válido', () => {
      expect(component.form.controls.interestRateMonthly.valid).toBe(true);
    });

    it('interestRateMonthly igual a zero é válido', () => {
      component.form.patchValue({ interestRateMonthly: 0 });
      expect(component.form.controls.interestRateMonthly.valid).toBe(true);
    });
  });
});

describe('DebtsPage (lista controlada)', () => {
  let component: DebtsPage;
  let fixture: ComponentFixture<DebtsPage>;
  let debts: ControlledDebtService;

  beforeEach(async () => {
    debts = new ControlledDebtService();

    await TestBed.configureTestingModule({
      imports: [DebtsPage],
      providers: [provideNoopAnimations(), { provide: DebtService, useValue: debts }],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('mantém o carregamento até a primeira resposta, sem mostrar o estado vazio antes disso', () => {
    expect(component.loading()).toBe(true);
    expect(component.debts()).toEqual([]);

    debts.subject.next([]);

    expect(component.loading()).toBe(false);
    expect(component.debts()).toEqual([]);
  });

  it('encerra o carregamento após receber as dívidas', () => {
    debts.subject.next([debt()]);

    expect(component.loading()).toBe(false);
    expect(component.debts()).toEqual([debt()]);
  });

  it('encerra o carregamento mesmo quando a requisição falha', () => {
    debts.subject.error(new Error('falha de rede'));

    expect(component.loading()).toBe(false);
  });
});


