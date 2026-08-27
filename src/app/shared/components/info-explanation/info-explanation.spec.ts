import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InfoExplanation } from './info-explanation';

describe('InfoExplanation', () => {
  let component: InfoExplanation;
  let fixture: ComponentFixture<InfoExplanation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoExplanation],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoExplanation);
    fixture.componentRef.setInput('title', 'CET');
    fixture.componentRef.setInput(
      'description',
      'CET é o custo total de um empréstimo ou financiamento.',
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
