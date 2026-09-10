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
  readonly loading = signal(true);
  readonly categories = signal<Category[]>([]);

  readonly showCardForm = signal(false);
  readonly editingCardId = signal<string | null>(null);

  readonly selectedCardId = signal<string | null>(null);
  readonly purchases = signal<CreditCardPurchase[]>([]);
  readonly showPurchaseForm = signal(false);

  readonly categoryNameById = computed(
    () => new Map(this.categories().map((category) => [category.id, category.name])),
  );

  readonly cardForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    institution: ['', [Validators.required, Validators.maxLength(100)]],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    closingDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
    active: [true],
  });

  readonly purchaseForm = this.formBuilder.nonNullable.group({
    description: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    purchaseDate: ['', Validators.required],
    installmentsCount: [1, [Validators.required, Validators.min(1)]],
    categoryId: ['', Validators.required],
  });

  private readonly purchaseFormValue = toSignal(this.purchaseForm.valueChanges, {
    initialValue: this.purchaseForm.getRawValue(),
  });

  readonly installmentEstimate = computed(() => {
    const value = this.purchaseFormValue();
    const totalAmount = value.totalAmount ?? 0;
    const installmentsCount = value.installmentsCount ?? 1;
    return estimateInstallmentAmount(totalAmount, installmentsCount);
  });

  constructor() {
    this.reloadCards();
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
      installmentsCount: 1,
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
      installmentsCount: value.installmentsCount,
      categoryId: value.categoryId,
    };

    this.purchaseService.create(input).subscribe(() => {
      this.showPurchaseForm.set(false);
      this.reloadPurchases();
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
        this.purchaseService.remove(purchase.id).subscribe(() => this.reloadPurchases());
      }
    });
  }

  purchaseInstallmentAmount(purchase: CreditCardPurchase): number {
    return estimateInstallmentAmount(purchase.totalAmount, purchase.installmentsCount);
  }

  private finishCardSave(): void {
    this.cancelCardForm();
    this.reloadCards();
  }

  private reloadCards(): void {
    this.loading.set(true);
    this.creditCardService.getAll().subscribe({
      next: (cards) => {
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private reloadPurchases(): void {
    const cardId = this.selectedCardId();
    if (!cardId) {
      this.purchases.set([]);
      return;
    }
    this.purchaseService.getByCard(cardId).subscribe((purchases) => this.purchases.set(purchases));
  }
}

