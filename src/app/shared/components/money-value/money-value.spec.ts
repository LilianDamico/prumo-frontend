import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyValue } from './money-value';

describe('MoneyValue', () => {
  let component: MoneyValue;
  let fixture: ComponentFixture<MoneyValue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyValue],
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyValue);
    fixture.componentRef.setInput('value', 1234.5);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the value formatted as BRL', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('R$');
    expect(text).toContain('1.234,50');
  });

  it('should mark negative values visually without relying only on color', () => {
    fixture.componentRef.setInput('value', -50);
    fixture.detectChanges();
    const span = (fixture.nativeElement as HTMLElement).querySelector('.money-value');
    expect(span?.classList.contains('money-value--negative')).toBe(true);
  });
});
