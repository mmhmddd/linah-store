import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenStoriesComponent } from './children-stories.component';

describe('ChildrenStoriesComponent', () => {
  let component: ChildrenStoriesComponent;
  let fixture: ComponentFixture<ChildrenStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildrenStoriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChildrenStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
