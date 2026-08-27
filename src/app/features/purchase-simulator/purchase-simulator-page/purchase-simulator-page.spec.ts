import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PurchaseSimulationOutcome, PurchaseSimulationOutput } from '../../../core/models';
import { PurchaseSimulationService } from '../../../core/services/purchase-simulation.service';
import { currentReferenceMonth } from '../../../core/utils/date.util';
import { PurchaseSimulatorPage } from './purchase-simulator-page';

describe('PurchaseSimulatorPage', () => {
  let component: PurchaseSimulatorPage;
  let fixture: ComponentFixture<PurchaseSimulatorPage>;
  let simulateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    simulateSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PurchaseSimulatorPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: PurchaseSimulationService, useValue: { simulate: simulateSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseSimulatorPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not simulate when the form is invalid', () => {
    component.form.controls.amount.setValue(0);
    component.simulate();

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(component.form.controls.amount.touched).toBe(true);
  });

  it('shows the comfortable outcome after a successful simulation', () => {
    const referenceMonth = currentReferenceMonth();
    const output: PurchaseSimulationOutput = {
      status: 'OK',
      result: {
        request: {
          amount: 300,
          paymentMethod: component.paymentMethods.CASH,
          installmentsCount: 1,
          firstChargeMonth: referenceMonth,
        },
        monthlyImpact: [
          {
            referenceMonth,
            projectedIncome: 4800,
            projectedCommitments: 3920,
            purchaseAmount: 300,
            projectedAvailableBeforePurchase: 880,
            projectedAvailableAfterPurchase: 580,
          },
        ],
        tightestMonth: {
          referenceMonth,
          projectedIncome: 4800,
          projectedCommitments: 3920,
          purchaseAmount: 300,
          projectedAvailableBeforePurchase: 880,
          projectedAvailableAfterPurchase: 580,
        },
        outcome: PurchaseSimulationOutcome.CONFORTAVEL,
      },
    };
    simulateSpy.mockReturnValue(of(output));

    component.form.setValue({
      amount: 300,
      paymentMethod: component.paymentMethods.CASH,
      installmentsCount: 2,
      firstChargeMonth: referenceMonth,
    });
    component.simulate();
    fixture.detectChanges();

    expect(component.submitted()).toBe(true);
    expect(component.output()).toEqual(output);
  });

  it('shows the insufficient data message when there is no income registered', () => {
    const output: PurchaseSimulationOutput = {
      status: 'INSUFFICIENT_DATA',
      missingData: {
        message: 'Ainda faltam algumas informações para fazer uma simulação confiável.',
        hint: 'Cadastre sua renda mensal para continuarmos.',
      },
    };
    simulateSpy.mockReturnValue(of(output));

    component.form.setValue({
      amount: 300,
      paymentMethod: component.paymentMethods.CASH,
      installmentsCount: 2,
      firstChargeMonth: currentReferenceMonth(),
    });
    component.simulate();
    fixture.detectChanges();

    expect(component.output()).toEqual(output);
  });

  it('resets the form and result', () => {
    component.output.set({
      status: 'INSUFFICIENT_DATA',
      missingData: { message: 'teste' },
    });
    component.submitted.set(true);

    component.reset();

    expect(component.output()).toBeNull();
    expect(component.submitted()).toBe(false);
    expect(component.form.controls.amount.value).toBe(0);
  });
});
