import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of } from 'rxjs';
import { vi } from 'vitest';

import { CreditCard, CreditCardPurchase } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import {
  CreateCreditCardPurchaseInput,
  CreditCardPurchaseFilters,
  CreditCardPurchaseService,
  UpdateCreditCardPurchaseInput,
} from '../../../core/services/credit-card-purchase.service';
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

function creditCardPurchase(overrides: Partial<CreditCardPurchase> = {}): CreditCardPurchase {
  return {
    id: 'purchase-1',
    creditCardId: 'card-1',
    categoryId: 'cat-1',
    description: 'Geladeira',
    purchaseDate: '2026-01-10',
    totalAmount: 1200,
    installmentCount: 6,
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

/**
 * Dublê de `CreditCardPurchaseService` com emissões controladas
 * manualmente. Distingue a consulta "todas as compras" (`allSubject`) da
 * consulta "compras de um cartão" (`byCardSubject`), assim como o backend
 * real diferencia esses dois usos do mesmo endpoint filtrado por query
 * param — permitindo simular as duas ordens de chegada possíveis entre o
 * GET de cartões e os GETs de compras.
 */
class ControlledCreditCardPurchaseService extends CreditCardPurchaseService {
  readonly allSubject = new Subject<CreditCardPurchase[]>();
  readonly byCardSubject = new Subject<CreditCardPurchase[]>();
  override getAll(filters?: CreditCardPurchaseFilters): Observable<CreditCardPurchase[]> {
    if (filters?.creditCardId) {
      return this.byCardSubject.asObservable();
    }
    return this.allSubject.asObservable();
  }
  override getByCard(creditCardId: string): Observable<CreditCardPurchase[]> {
    return this.getAll({ creditCardId });
  }
  override getById(): Observable<CreditCardPurchase | undefined> {
    throw new Error('not implemented');
  }
  override create(_input: CreateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    throw new Error('not implemented');
  }
  override update(_id: string, _changes: UpdateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

describe('CreditCardsPage', () => {
  let component: CreditCardsPage;
  let fixture: ComponentFixture<CreditCardsPage>;

  function createCard(): CreditCard {
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
    return component.cards()[0];
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CreditCardsPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
        // A tela é testada com os serviços locais: os testes de componente
        // não exercitam a integração HTTP (coberta em
        // http-credit-card.service.spec.ts e
        // http-credit-card-purchase.service.spec.ts) e não devem depender de
        // rede.
        { provide: CreditCardService, useClass: LocalCreditCardService },
        { provide: CreditCardPurchaseService, useClass: LocalCreditCardPurchaseService },
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
    expect(component.cardsLoading()).toBe(false);
  });

  it('cria um cartão e calcula a parcela aproximada de uma compra', () => {
    const card = createCard();
    component.viewPurchases(card);
    component.startPurchaseCreate();
    component.purchaseForm.patchValue({ totalAmount: 1200, installmentCount: 6 });

    expect(component.installmentEstimate()).toBe(200);
  });

  it('edita um cartão existente', () => {
    createCard();

    const card = component.cards()[0];
    component.startCardEdit(card);
    component.cardForm.patchValue({ creditLimit: 8000, active: false });
    component.saveCard();

    expect(component.cards().length).toBe(1);
    expect(component.cards()[0].creditLimit).toBe(8000);
    expect(component.cards()[0].active).toBe(false);
  });

  it('exclui um cartão após confirmação', () => {
    const card = createCard();
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);

    component.removeCard(card);

    expect(component.cards()).toEqual([]);
  });

  it('não exclui um cartão quando a confirmação é cancelada', () => {
    createCard();

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

  describe('compras', () => {
    it('cria uma compra válida vinculada ao cartão selecionado', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      expect(component.purchases().length).toBe(1);
      expect(component.purchases()[0].creditCardId).toBe(card.id);
      expect(component.purchases()[0].installmentCount).toBe(6);
    });

    it('edita uma compra existente', async () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      const purchase = component.purchases()[0];
      const purchaseService = TestBed.inject(CreditCardPurchaseService);
      await new Promise<void>((resolve) => {
        purchaseService.update(purchase.id, { totalAmount: 1500 }).subscribe(() => resolve());
      });

      expect(component).toBeTruthy();
    });

    it('exclui uma compra após confirmação', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      const purchase = component.purchases()[0];
      const dialog = TestBed.inject(MatDialog);
      vi.spyOn(dialog, 'open').mockReturnValue({
        afterClosed: () => of(true),
      } as ReturnType<MatDialog['open']>);

      component.removePurchase(purchase);

      expect(component.purchases()).toEqual([]);
    });

    it('não exclui uma compra quando a confirmação é cancelada', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Geladeira',
        totalAmount: 1200,
        purchaseDate: '2026-01-10',
        installmentCount: 6,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      const purchase = component.purchases()[0];
      const dialog = TestBed.inject(MatDialog);
      vi.spyOn(dialog, 'open').mockReturnValue({
        afterClosed: () => of(false),
      } as ReturnType<MatDialog['open']>);

      component.removePurchase(purchase);

      expect(component.purchases().length).toBe(1);
    });

    it('não salva compra com formulário inválido', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ description: '' });
      component.savePurchase();

      expect(component.purchases()).toEqual([]);
    });

    it('aceita installmentCount = 1', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ installmentCount: 1 });

      expect(component.purchaseForm.controls.installmentCount.valid).toBe(true);
    });

    it('aceita installmentCount = 99', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ installmentCount: 99 });

      expect(component.purchaseForm.controls.installmentCount.valid).toBe(true);
    });

    it('rejeita installmentCount = 0', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ installmentCount: 0 });

      expect(component.purchaseForm.controls.installmentCount.valid).toBe(false);
    });

    it('rejeita installmentCount = 100', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ installmentCount: 100 });

      expect(component.purchaseForm.controls.installmentCount.valid).toBe(false);
    });

    it('aceita totalAmount > 0', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ totalAmount: 0.01 });

      expect(component.purchaseForm.controls.totalAmount.valid).toBe(true);
    });

    it('rejeita totalAmount igual a 0', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ totalAmount: 0 });

      expect(component.purchaseForm.controls.totalAmount.valid).toBe(false);
    });

    it('rejeita description com mais de 150 caracteres', () => {
      component.startPurchaseCreate();
      component.purchaseForm.patchValue({ description: 'a'.repeat(151) });

      expect(component.purchaseForm.controls.description.valid).toBe(false);
    });

    it('preserva purchaseDate literalmente, sem transformação de fuso', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Compra com data',
        totalAmount: 300,
        purchaseDate: '2026-12-31',
        installmentCount: 1,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      expect(component.purchases()[0].purchaseDate).toBe('2026-12-31');
    });

    it('exibe installmentAmount do backend quando presente, em vez da estimativa local', () => {
      const purchase = creditCardPurchase({ totalAmount: 1000, installmentCount: 3, installmentAmount: 333.34 });

      expect(component.displayInstallmentAmount(purchase)).toBe(333.34);
    });

    it('usa a estimativa local quando installmentAmount não está presente', () => {
      const purchase = creditCardPurchase({ totalAmount: 1200, installmentCount: 6, installmentAmount: undefined });

      expect(component.displayInstallmentAmount(purchase)).toBe(200);
    });
  });

  describe('dados órfãos', () => {
    it('compra que referencia um cartão inexistente permanece visível com fallback', async () => {
      const purchaseService = TestBed.inject(CreditCardPurchaseService);
      await new Promise<void>((resolve) => {
        purchaseService
          .create({
            creditCardId: 'cartao-inexistente',
            description: 'Compra órfã',
            totalAmount: 500,
            purchaseDate: '2025-01-01',
            installmentCount: 1,
            categoryId: 'cat-1',
          })
          .subscribe(() => resolve());
      });

      // Recarrega a página para simular a leitura inicial dos dados locais.
      fixture = TestBed.createComponent(CreditCardsPage);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.orphanPurchases().length).toBe(1);
      expect(component.orphanPurchases()[0].description).toBe('Compra órfã');
      expect(component.cardName('cartao-inexistente')).toBe('Cartão não disponível');
    });

    it('não lança exceção e não quebra a página com dados órfãos', async () => {
      const purchaseService = TestBed.inject(CreditCardPurchaseService);
      await new Promise<void>((resolve) => {
        purchaseService
          .create({
            creditCardId: 'cartao-inexistente',
            description: 'Compra órfã',
            totalAmount: 500,
            purchaseDate: '2025-01-01',
            installmentCount: 1,
            categoryId: 'cat-1',
          })
          .subscribe(() => resolve());
      });

      expect(() => {
        fixture = TestBed.createComponent(CreditCardsPage);
        component = fixture.componentInstance;
      }).not.toThrow();
    });

    it('cartão referenciado por uma compra, mas depois excluído/inativo, continua representável no histórico', () => {
      const card = createCard();
      component.viewPurchases(card);
      component.startPurchaseCreate();
      component.purchaseForm.setValue({
        description: 'Compra antiga',
        totalAmount: 100,
        purchaseDate: '2025-01-01',
        installmentCount: 1,
        categoryId: 'cat-1',
      });
      component.savePurchase();

      // O cartão ainda existe (ativo ou não) na lista carregada: o nome
      // resolve normalmente, sem fallback.
      expect(component.cardName(card.id)).toBe(card.name);
    });

    it('cartão inativo em histórico continua representável (não vira fallback)', () => {
      const card = createCard();
      component.startCardEdit(card);
      component.cardForm.patchValue({ active: false });
      component.saveCard();

      expect(component.cardName(card.id)).toBe(card.name);
    });
  });

  describe('carregamento e compras locais', () => {
    it('carregamento de cartões não apaga compras locais já exibidas', async () => {
      const purchaseService = TestBed.inject(CreditCardPurchaseService);
      await new Promise<void>((resolve) => {
        purchaseService
          .create({
            creditCardId: 'card-x',
            description: 'Compra local',
            totalAmount: 50,
            purchaseDate: '2025-01-01',
            installmentCount: 1,
            categoryId: 'cat-1',
          })
          .subscribe(() => resolve());
      });

      fixture = TestBed.createComponent(CreditCardsPage);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.allPurchases().length).toBe(1);
      expect(component.cardsLoading()).toBe(false);
    });
  });
});

describe('CreditCardsPage (carregamento e condição de corrida)', () => {
  let component: CreditCardsPage;
  let fixture: ComponentFixture<CreditCardsPage>;
  let creditCards: ControlledCreditCardService;
  let purchases: ControlledCreditCardPurchaseService;

  beforeEach(async () => {
    creditCards = new ControlledCreditCardService();
    purchases = new ControlledCreditCardPurchaseService();

    await TestBed.configureTestingModule({
      imports: [CreditCardsPage],
      providers: [
        provideNoopAnimations(),
        { provide: CreditCardService, useValue: creditCards },
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: CreditCardPurchaseService, useValue: purchases },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditCardsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('mantém o carregamento de cartões até a primeira resposta, sem mostrar o estado vazio antes disso', () => {
    expect(component.cardsLoading()).toBe(true);
    expect(component.cards()).toEqual([]);

    creditCards.subject.next([]);

    expect(component.cardsLoading()).toBe(false);
    expect(component.cards()).toEqual([]);
  });

  it('encerra o carregamento de cartões após receber os cartões', () => {
    creditCards.subject.next([creditCard()]);

    expect(component.cardsLoading()).toBe(false);
    expect(component.cards()).toEqual([creditCard()]);
  });

  it('encerra o carregamento de cartões mesmo quando a requisição falha', () => {
    creditCards.subject.error(new Error('falha de rede'));

    expect(component.cardsLoading()).toBe(false);
  });

  it('purchasesLoading fica true assim que uma compra é buscada por cartão, e false após a resposta', () => {
    creditCards.subject.next([creditCard()]);
    component.viewPurchases(creditCard());

    expect(component.purchasesLoading()).toBe(true);

    purchases.byCardSubject.next([creditCardPurchase()]);

    expect(component.purchasesLoading()).toBe(false);
    expect(component.purchases()).toEqual([creditCardPurchase()]);
  });

  it('purchasesLoading encerra mesmo quando a busca por cartão falha', () => {
    creditCards.subject.next([creditCard()]);
    component.viewPurchases(creditCard());

    purchases.byCardSubject.error(new Error('falha de rede'));

    expect(component.purchasesLoading()).toBe(false);
  });

  it('cardsLoading e purchasesLoading são independentes: cartões resolvem primeiro', () => {
    creditCards.subject.next([creditCard()]);
    expect(component.cardsLoading()).toBe(false);

    component.viewPurchases(creditCard());
    expect(component.purchasesLoading()).toBe(true);

    purchases.byCardSubject.next([creditCardPurchase()]);
    expect(component.purchasesLoading()).toBe(false);
  });

  it('cardsLoading e purchasesLoading são independentes: compras resolvem primeiro', () => {
    component.viewPurchases(creditCard());
    expect(component.purchasesLoading()).toBe(true);
    expect(component.cardsLoading()).toBe(true);

    purchases.byCardSubject.next([creditCardPurchase()]);
    expect(component.purchasesLoading()).toBe(false);
    expect(component.cardsLoading()).toBe(true);

    creditCards.subject.next([creditCard()]);
    expect(component.cardsLoading()).toBe(false);
  });

  it('todas as compras (allPurchases) chegam antes dos cartões sem quebrar a página', () => {
    expect(() => purchases.allSubject.next([creditCardPurchase({ creditCardId: 'card-1' })])).not.toThrow();

    expect(component.allPurchases().length).toBe(1);
    // Sem os cartões ainda carregados, a compra é temporariamente tratada
    // como órfã — não é ocultada, apenas ainda não resolvida.
    expect(component.orphanPurchases().length).toBe(1);

    creditCards.subject.next([creditCard({ id: 'card-1' })]);

    // Assim que os cartões chegam, a compra deixa de ser órfã.
    expect(component.orphanPurchases().length).toBe(0);
  });

  it('cartões chegam antes de todas as compras (allPurchases) sem quebrar a página', () => {
    creditCards.subject.next([creditCard({ id: 'card-1' })]);
    expect(component.cardsLoading()).toBe(false);

    expect(() => purchases.allSubject.next([creditCardPurchase({ creditCardId: 'card-1' })])).not.toThrow();

    expect(component.allPurchases().length).toBe(1);
    expect(component.orphanPurchases().length).toBe(0);
  });

  it('compras locais (allPurchases) aparecem mesmo antes do GET de cartões terminar', () => {
    expect(component.cardsLoading()).toBe(true);

    purchases.allSubject.next([creditCardPurchase()]);

    expect(component.allPurchases().length).toBeGreaterThan(0);
    expect(component.cardsLoading()).toBe(true);
  });
});
