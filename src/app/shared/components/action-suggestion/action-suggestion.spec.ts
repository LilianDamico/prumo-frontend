import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionSuggestion } from './action-suggestion';

describe('ActionSuggestion', () => {
  let component: ActionSuggestion;
  let fixture: ComponentFixture<ActionSuggestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionSuggestion],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionSuggestion);
    fixture.componentRef.setInput(
      'message',
      'Você gastou R$ 320 a mais do que havia planejado.',
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
