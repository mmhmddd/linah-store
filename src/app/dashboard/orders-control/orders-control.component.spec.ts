import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersControlComponent } from './orders-control.component';

describe('OrdersControlComponent', () => {
  let component: OrdersControlComponent;
  let fixture: ComponentFixture<OrdersControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersControlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdersControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
