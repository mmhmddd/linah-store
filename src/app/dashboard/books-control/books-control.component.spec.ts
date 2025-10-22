import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooksControlComponent } from './books-control.component';

describe('BooksControlComponent', () => {
  let component: BooksControlComponent;
  let fixture: ComponentFixture<BooksControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooksControlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BooksControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
