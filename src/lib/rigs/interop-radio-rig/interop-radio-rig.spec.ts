import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteropRadioRig } from './interop-radio-rig';

describe('InteropRadioRig', () => {
  let component: InteropRadioRig;
  let fixture: ComponentFixture<InteropRadioRig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteropRadioRig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteropRadioRig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
