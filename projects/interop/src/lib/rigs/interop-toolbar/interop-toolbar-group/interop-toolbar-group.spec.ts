import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteropToolbarGroup } from './interop-toolbar-group';

describe('InteropToolbarGroup', () => {
  let component: InteropToolbarGroup;
  let fixture: ComponentFixture<InteropToolbarGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropToolbarGroup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteropToolbarGroup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
