import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Category, CategoryType, CreditCard, CreditCardPurchase } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import {
  CreateCreditCardPurchaseInput,
  CreditCardPurchaseService,
} from '../../../core/services/credit-card-purchase.service';
import { CreateCreditCardInput, CreditCardService } from '../../../core/services/credit-card.service';
import { estimateInstallmentAmount } from '../../../core/utils/interest.util';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/**
 * Cadastro de cartões de crédito e das compras feitas neles. A parcela de
 * cada compra é apenas uma aproximação (valor total dividido pelo número de
 * parcelas), sempre explicada como estimativa.
 */
@Component({
  selector: 'app-credit-cards-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    PageHeader,
    EmptyState,
    MoneyValue,
  ],
  templateUrl: './credit-cards-page.html',
  styleUrl: './credit-cards-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditCardsPage {
  private readonly creditCardService = inject(CreditCardService);
  private readonly purchaseService = inject(CreditCardPurchaseService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);

  readonly cards = signal<CreditCard[]>([]);
  readonly cardsLoading = signal(true);
  readonly categories = signal<Category[]>([]);

  readonly showCardForm = signal(false);
  readonly editingCardId = signal<string | null>(null);

  readonly selectedCardId = signal<string | null>(null);
  readonly purchases = signal<CreditCardPurchase[]>([]);
  readonly purchasesLoading = signal(false);
  readonly showPurchaseForm = signal(false);

  readonly categoryNameById = computed(
    () => new Map(this.categories().map((category) => [category.id, category.name])),
  );

  readonly cardNameById = computed(() => new Map(this.cards().map((card) => [card.id, card.name])));

  readonly cardForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    institution: ['', [Validators.required, Validators.maxLength(100)]],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    closingDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
    active: [true],
  });

  readonly purchaseForm = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(150)]],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    purchaseDate: ['', Validators.required],
    installmentCount: [1, [Validators.required, Validators.min(1), Validators.max(99)]],
    categoryId: ['', Validators.required],
  });

  private readonly purchaseFormValue = toSignal(this.purchaseForm.valueChanges, {
    initialValue: this.purchaseForm.getRawValue(),
  });

  /** Estimativa de UI (total ÷ parcelas) — o backend é a autoridade para `installmentAmount`. */
  readonly installmentEstimate = computed(() => {
    const value = this.purchaseFormValue();
    const totalAmount = value.totalAmount ?? 0;
    const installmentCount = value.installmentCount ?? 1;
    return estimateInstallmentAmount(totalAmount, installmentCount);
  });

  /** Todas as compras (HTTP), carregadas independentemente do GET de cartões. */
  readonly allPurchases = signal<CreditCardPurchase[]>([]);

  /**
   * Compras cujo `creditCardId` não corresponde a nenhum cartão retornado
   * pelo backend. Com a FK do backend, isso não deveria mais ocorrer para
   * compras criadas via HTTP — mas a tolerância defensiva é preservada
   * (ex.: dados legados de `localStorage` de antes desta integração, ou uma
   * futura divergência de dados). Essas compras continuam visíveis aqui —
   * nunca são ocultadas silenciosamente.
   */
  readonly orphanPurchases = computed(() => {
    const cardIds = new Set(this.cards().map((card) => card.id));
    return this.allPurchases().filter((purchase) => !cardIds.has(purchase.creditCardId));
  });

  constructor() {
    this.reloadCards();
    this.reloadAllPurchases();
    this.categoryService
      .getByType(CategoryType.EXPENSE)
      .subscribe((categories) => this.categories.set(categories));
  }

  startCardCreate(): void {
    this.editingCardId.set(null);
    this.cardForm.reset({
      name: '',
      institution: '',
      creditLimit: 0,
      closingDay: 1,
      dueDay: 10,
      active: true,
    });
    this.showCardForm.set(true);
  }

  startCardEdit(card: CreditCard): void {
    this.editingCardId.set(card.id);
    this.cardForm.reset({
      name: card.name,
      institution: card.institution,
      creditLimit: card.creditLimit,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      active: card.active,
    });
    this.showCardForm.set(true);
  }

  cancelCardForm(): void {
    this.showCardForm.set(false);
    this.editingCardId.set(null);
  }

  saveCard(): void {
    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      return;
    }

    const value = this.cardForm.getRawValue();
    const editingId = this.editingCardId();

    if (editingId) {
      this.creditCardService.update(editingId, value).subscribe(() => this.finishCardSave());
      return;
    }

    const input: CreateCreditCardInput = value;
    this.creditCardService.create(input).subscribe(() => this.finishCardSave());
  }

  removeCard(card: CreditCard): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir cartão',
        message: `Quer mesmo excluir o cartão "${card.name}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.creditCardService.remove(card.id).subscribe(() => {
          if (this.selectedCardId() === card.id) {
            this.selectedCardId.set(null);
          }
          this.reloadCards();
        });
      }
    });
  }

  viewPurchases(card: CreditCard): void {
    this.selectedCardId.set(card.id);
    this.showPurchaseForm.set(false);
    this.reloadPurchases();
  }

  closePurchases(): void {
    this.selectedCardId.set(null);
    this.purchases.set([]);
    this.showPurchaseForm.set(false);
  }

  startPurchaseCreate(): void {
    this.purchaseForm.reset({
      description: '',
      totalAmount: 0,
      purchaseDate: '',
      installmentCount: 1,
      categoryId: '',
    });
    this.showPurchaseForm.set(true);
  }

  cancelPurchaseForm(): void {
    this.showPurchaseForm.set(false);
  }

  savePurchase(): void {
    const cardId = this.selectedCardId();
    if (!cardId || this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    const value = this.purchaseForm.getRawValue();
    const input: CreateCreditCardPurchaseInput = {
      creditCardId: cardId,
      description: value.description,
      totalAmount: value.totalAmount,
      purchaseDate: value.purchaseDate,
      installmentCount: value.installmentCount,
      categoryId: value.categoryId,
    };

    this.purchaseService.create(input).subscribe(() => {
      this.showPurchaseForm.set(false);
      this.reloadPurchases();
      this.reloadAllPurchases();
    });
  }

  removePurchase(purchase: CreditCardPurchase): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir compra',
        message: `Quer mesmo excluir a compra "${purchase.description}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.purchaseService.remove(purchase.id).subscribe(() => {
          this.reloadPurchases();
          this.reloadAllPurchases();
        });
      }
    });
  }

  purchaseInstallmentAmount(purchase: CreditCardPurchase): number {
    return estimateInstallmentAmount(purchase.totalAmount, purchase.installmentCount);
  }

  /**
   * Valor de parcela para exibição: prioriza `installmentAmount` vindo do
   * backend (autoridade) quando disponível; só usa a estimativa local
   * (`totalAmount ÷ installmentCount`) para registros que ainda não têm
   * esse campo na resposta.
   */
  displayInstallmentAmount(purchase: CreditCardPurchase): number {
    return purchase.installmentAmount ?? this.purchaseInstallmentAmount(purchase);
  }

  /** Nome do cartão para exibição, com fallback tolerante a dados órfãos. */
  cardName(creditCardId: string): string {
    return this.cardNameById().get(creditCardId) ?? 'Cartão não disponível';
  }

  /** Nome da categoria para exibição, com fallback caso não esteja carregada. */
  categoryName(categoryId: string): string {
    return this.categoryNameById().get(categoryId) ?? 'Categoria não disponível';
  }

  private finishCardSave(): void {
    this.cancelCardForm();
    this.reloadCards();
  }

  private reloadCards(): void {
    this.cardsLoading.set(true);
    this.creditCardService.getAll().subscribe({
      next: (cards) => {
        this.cards.set(cards);
        this.cardsLoading.set(false);
      },
      error: () => this.cardsLoading.set(false),
    });
  }

  private reloadPurchases(): void {
    const cardId = this.selectedCardId();
    if (!cardId) {
      this.purchases.set([]);
      return;
    }
    this.purchasesLoading.set(true);
    this.purchaseService.getByCard(cardId).subscribe({
      next: (purchases) => {
        this.purchases.set(purchases);
        this.purchasesLoading.set(false);
      },
      error: () => this.purchasesLoading.set(false),
    });
  }

  /**
   * Carrega todas as compras (HTTP), independentemente do carregamento de
   * cartões, para que compras já existentes continuem aparecendo mesmo
   * que o GET de cartões ainda esteja em andamento (ou vice-versa).
   */
  private reloadAllPurchases(): void {
    this.purchaseService.getAll().subscribe((purchases) => this.allPurchases.set(purchases));
  }
}

