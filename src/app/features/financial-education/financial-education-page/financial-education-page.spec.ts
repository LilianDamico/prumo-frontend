import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FinancialEducationPage } from './financial-education-page';

describe('FinancialEducationPage', () => {
  let component: FinancialEducationPage;
  let fixture: ComponentFixture<FinancialEducationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialEducationPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialEducationPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists all topics by default', () => {
    fixture.detectChanges();
    expect(component.visibleTopics().length).toBeGreaterThan(0);
  });

  it('searches topics by popular expression', () => {
    fixture.detectChanges();
    component.searchForm.controls.query.setValue('quanto posso gastar');
    component.search();
    fixture.detectChanges();

    expect(component.visibleTopics().some((topic) => topic.id === 'valor-realmente-disponivel')).toBe(true);
  });

  it('filters by category', () => {
    fixture.detectChanges();
    const category = component.categories[0];
    component.filterByCategory(category);
    fixture.detectChanges();

    expect(component.visibleTopics().every((topic) => topic.category === category)).toBe(true);
  });

  it('opens a topic and shows related topics', () => {
    fixture.detectChanges();
    const topic = component.visibleTopics().find((candidate) => candidate.id === 'valor-realmente-disponivel')!;
    component.open(topic);
    fixture.detectChanges();

    expect(component.selectedTopic()?.id).toBe('valor-realmente-disponivel');
    expect(component.relatedTopics().length).toBeGreaterThan(0);
  });

  it('closes the topic detail and returns to the list', () => {
    fixture.detectChanges();
    const topic = component.visibleTopics()[0];
    component.open(topic);
    component.closeTopic();
    fixture.detectChanges();

    expect(component.selectedTopic()).toBeNull();
  });
});
