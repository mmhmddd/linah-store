import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenBooksComponent } from './children-books.component';

describe('ChildrenBooksComponent', () => {
  let component: ChildrenBooksComponent;
  let fixture: ComponentFixture<ChildrenBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildrenBooksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChildrenBooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
