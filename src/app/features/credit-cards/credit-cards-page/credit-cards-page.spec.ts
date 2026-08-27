import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { CreditCardsPage } from './credit-cards-page';

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

  it('mostra estado vazio quando não há cartões cadastrados', () => {
    expect(component.cards()).toEqual([]);
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
});

