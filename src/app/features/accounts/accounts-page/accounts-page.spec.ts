import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { AccountsPage } from './accounts-page';

describe('AccountsPage', () => {
  let component: AccountsPage;
  let fixture: ComponentFixture<AccountsPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AccountsPage],
      providers: [...CORE_SERVICE_PROVIDERS, provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há contas cadastradas', () => {
    expect(component.accounts()).toEqual([]);
  });

  it('cria uma nova conta a partir do formulário', () => {
    component.startCreate();
    component.form.setValue({
      name: 'Conta corrente',
      institution: 'Banco X',
      type: component.form.controls.type.value,
      currentBalance: 100,
      active: true,
    });
    component.save();

    expect(component.accounts().length).toBe(1);
    expect(component.accounts()[0].name).toBe('Conta corrente');
  });
});

