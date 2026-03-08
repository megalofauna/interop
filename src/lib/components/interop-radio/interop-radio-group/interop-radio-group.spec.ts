import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteropRadioGroup } from './interop-radio-group';

describe('InteropRadioGroup', () => {
  let component: InteropRadioGroup;
  let fixture: ComponentFixture<InteropRadioGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropRadioGroup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteropRadioGroup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
