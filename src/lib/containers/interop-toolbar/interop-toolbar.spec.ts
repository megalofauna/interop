import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteropToolbar } from './interop-toolbar';

describe('InteropToolbar', () => {
  let component: InteropToolbar;
  let fixture: ComponentFixture<InteropToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteropToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
