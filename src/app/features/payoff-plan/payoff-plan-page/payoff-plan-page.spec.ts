import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DebtPayoffStrategyType, PayoffPlanOutput } from '../../../core/models';
import { DebtService } from '../../../core/services/debt.service';
import { PayoffPlanService } from '../../../core/services/payoff-plan.service';
import { PayoffPlanPage } from './payoff-plan-page';

describe('PayoffPlanPage', () => {
  let component: PayoffPlanPage;
  let fixture: ComponentFixture<PayoffPlanPage>;
  let getPlanSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getPlanSpy = vi.fn().mockReturnValue(
      of<PayoffPlanOutput>({
        status: 'INSUFFICIENT_DATA',
        missingData: { message: 'Ainda não há dívidas ativas para montar um plano de quitação.' },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PayoffPlanPage],
      providers: [
        provideRouter([]),
        { provide: PayoffPlanService, useValue: { getPlan: getPlanSpy } },
        { provide: DebtService, useValue: { getAll: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PayoffPlanPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows insufficient data message when there are no active debts', () => {
    fixture.detectChanges();

    expect(component.output()?.status).toBe('INSUFFICIENT_DATA');
  });

  it('shows a plan with both strategies when data is sufficient', () => {
    getPlanSpy.mockReturnValue(
      of<PayoffPlanOutput>({
        status: 'OK',
        result: {
          progress: { totalOriginalAmount: 1000, totalCurrentBalance: 400, totalEliminated: 600 },
          simulations: [
            {
              strategy: DebtPayoffStrategyType.AVALANCHE,
              title: 'Pagar primeiro as dívidas mais caras',
              technicalName: 'estratégia avalanche',
              totalDebtAmount: 400,
              totalEliminated: 600,
              monthlyAvailableForPayoff: 200,
              steps: [{ debtId: 'debt-1', order: 1, estimatedPayoffMonth: '2026-06' }],
              estimatedMonthsToPayoff: 3,
              estimatedInterestPaid: 20,
              hasUnknownInterestRate: false,
            },
            {
              strategy: DebtPayoffStrategyType.SNOWBALL,
              title: 'Eliminar primeiro as menores dívidas',
              technicalName: 'estratégia snowball',
              totalDebtAmount: 400,
              totalEliminated: 600,
              monthlyAvailableForPayoff: 200,
              steps: [{ debtId: 'debt-1', order: 1, estimatedPayoffMonth: '2026-06' }],
              estimatedMonthsToPayoff: 3,
              hasUnknownInterestRate: true,
            },
          ],
        },
      }),
    );

    const newFixture = TestBed.createComponent(PayoffPlanPage);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    const currentOutput = newComponent.output();
    expect(currentOutput?.status).toBe('OK');
    if (currentOutput?.status === 'OK') {
      expect(newComponent.timeEstimateLabel(currentOutput.result.simulations[0])).toContain('meses');
    }
  });
});
