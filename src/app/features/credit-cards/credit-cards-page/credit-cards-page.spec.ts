import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of } from 'rxjs';
import { vi } from 'vitest';

import { CreditCard } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { CreditCardPurchaseService } from '../../../core/services/credit-card-purchase.service';
import {
  CreateCreditCardInput,
  CreditCardFilters,
  CreditCardService,
  UpdateCreditCardInput,
} from '../../../core/services/credit-card.service';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { LocalCreditCardPurchaseService } from '../../../core/services/local/local-credit-card-purchase.service';
import { LocalCreditCardService } from '../../../core/services/local/local-credit-card.service';
import { CreditCardsPage } from './credit-cards-page';

function creditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: 'card-1',
    name: 'Cartão Roxo',
    institution: 'Banco X',
    creditLimit: 5000,
    closingDay: 5,
    dueDay: 15,
    active: true,
    ...overrides,
  };
}

/** Dublê de `CreditCardService` cujas emissões de `getAll` são controladas manualmente pelo teste. */
class ControlledCreditCardService extends CreditCardService {
  readonly subject = new Subject<CreditCard[]>();
  override getAll(_filters?: CreditCardFilters): Observable<CreditCard[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<CreditCard | undefined> {
    throw new Error('not implemented');
  }
  override create(_input: CreateCreditCardInput): Observable<CreditCard> {
    throw new Error('not implemented');
  }
  override update(_id: string, _changes: UpdateCreditCardInput): Observable<CreditCard> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

describe('CreditCardsPage', () => {
  let component: CreditCardsPage;
  let fixture: ComponentFixture<CreditCardsPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CreditCardsPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
        // A tela é testada com o `CreditCardService` local: os testes de
        // componente não exercitam a integração HTTP (coberta em
        // http-credit-card.service.spec.ts) e não devem depender de rede.
        { provide: CreditCardService, useClass: LocalCreditCardService },
        // Categorias continuam locais nos testes de componente: eles não
        // exercitam a integração HTTP (coberta em http-category.service.spec.ts)
        // e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditCardsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há cartões cadastrados, e o carregamento terminou', () => {
    expect(component.cards()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('cria um cartão e calcula a parcela aproximada de uma compra', () => {
    component.startCardCreate();
    component.cardForm.setValue({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    component.saveCard();

    expect(component.cards().length).toBe(1);

    const card = component.cards()[0];
    component.viewPurchases(card);
    component.startPurchaseCreate();
    component.purchaseForm.patchValue({ totalAmount: 1200, installmentsCount: 6 });

    expect(component.installmentEstimate()).toBe(200);
  });

  it('edita um cartão existente', () => {
    component.startCardCreate();
    component.cardForm.setValue({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    component.saveCard();

    const card = component.cards()[0];
    component.startCardEdit(card);
    component.cardForm.patchValue({ creditLimit: 8000, active: false });
    component.saveCard();

    expect(component.cards().length).toBe(1);
    expect(component.cards()[0].creditLimit).toBe(8000);
    expect(component.cards()[0].active).toBe(false);
  });

  it('exclui um cartão após confirmação', () => {
    component.startCardCreate();
    component.cardForm.setValue({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    component.saveCard();

    const card = component.cards()[0];
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);

    component.removeCard(card);

    expect(component.cards()).toEqual([]);
  });

  it('não exclui um cartão quando a confirmação é cancelada', () => {
    component.startCardCreate();
    component.cardForm.setValue({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    component.saveCard();

    const card = component.cards()[0];
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(false),
    } as ReturnType<MatDialog['open']>);

    component.removeCard(card);

    expect(component.cards().length).toBe(1);
  });

  it('não salva um cartão com formulário inválido', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ name: '' });
    component.saveCard();

    expect(component.cards()).toEqual([]);
  });

  it('rejeita creditLimit negativo', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ creditLimit: -1 });

    expect(component.cardForm.controls.creditLimit.valid).toBe(false);
  });

  it('rejeita closingDay igual a 0', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ closingDay: 0 });

    expect(component.cardForm.controls.closingDay.valid).toBe(false);
  });

  it('rejeita closingDay igual a 32', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ closingDay: 32 });

    expect(component.cardForm.controls.closingDay.valid).toBe(false);
  });

  it('rejeita dueDay igual a 0', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ dueDay: 0 });

    expect(component.cardForm.controls.dueDay.valid).toBe(false);
  });

  it('rejeita dueDay igual a 32', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ dueDay: 32 });

    expect(component.cardForm.controls.dueDay.valid).toBe(false);
  });

  it('rejeita name com mais de 100 caracteres', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ name: 'a'.repeat(101) });

    expect(component.cardForm.controls.name.valid).toBe(false);
  });

  it('rejeita institution com mais de 100 caracteres', () => {
    component.startCardCreate();
    component.cardForm.patchValue({ institution: 'a'.repeat(101) });

    expect(component.cardForm.controls.institution.valid).toBe(false);
  });

  it('preserva active=false ao editar um cartão', () => {
    component.startCardCreate();
    component.cardForm.setValue({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: false,
    });
    component.saveCard();

    const card = component.cards()[0];
    expect(card.active).toBe(false);

    component.startCardEdit(card);
    expect(component.cardForm.controls.active.value).toBe(false);
  });
});

describe('CreditCardsPage (loading)', () => {
  let component: CreditCardsPage;
  let fixture: ComponentFixture<CreditCardsPage>;
  let creditCards: ControlledCreditCardService;

  beforeEach(async () => {
    creditCards = new ControlledCreditCardService();

    await TestBed.configureTestingModule({
      imports: [CreditCardsPage],
      providers: [
        provideNoopAnimations(),
        { provide: CreditCardService, useValue: creditCards },
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: CreditCardPurchaseService, useClass: LocalCreditCardPurchaseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditCardsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('mantém o carregamento até a primeira resposta, sem mostrar o estado vazio antes disso', () => {
    expect(component.loading()).toBe(true);
    expect(component.cards()).toEqual([]);

    creditCards.subject.next([]);

    expect(component.loading()).toBe(false);
    expect(component.cards()).toEqual([]);
  });

  it('encerra o carregamento após receber os cartões', () => {
    creditCards.subject.next([creditCard()]);

    expect(component.loading()).toBe(false);
    expect(component.cards()).toEqual([creditCard()]);
  });

  it('encerra o carregamento mesmo quando a requisição falha', () => {
    creditCards.subject.error(new Error('falha de rede'));

    expect(component.loading()).toBe(false);
  });
});

