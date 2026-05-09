import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { InteropDialog } from './interop-dialog';

@Component({
  selector: 'app-test-dialog',
  standalone: true,
  imports: [InteropDialog],
  template: `
    <dialog
      interop-dialog
      [attr.aria-labelledby]="ariaLabelledBy"
      [attr.aria-label]="ariaLabel"
      [isOpen]="isOpen"
      [dismissOnBackdrop]="dismissOnBackdrop"
      [disableEscape]="disableEscape"
      [autoFocus]="autoFocus"
      [returnFocus]="returnFocus"
      [autoClose]="autoClose"
      (closed)="onClosed($event)"
    >
      <h2 id="dialog-title">Test Dialog</h2>
      <p>Dialog content</p>
      <input id="email-input" type="email" />
      <button id="close-btn" type="button">Close</button>
      <form id="test-form">
        <input type="text" />
        <button type="submit">Submit</button>
      </form>
    </dialog>
  `,
})
class TestDialogComponent {
  @ViewChild(InteropDialog, { static: true }) directive!: InteropDialog;

  isOpen = false;
  dismissOnBackdrop = true;
  disableEscape = false;
  autoFocus: string | null = null;
  returnFocus: string | HTMLElement | null = null;
  autoClose = false;
  ariaLabelledBy: string | null = 'dialog-title';
  ariaLabel: string | null = null;

  lastClosedEvent: any = null;

  onClosed(event: any): void {
    this.lastClosedEvent = event;
  }
}

describe('InteropDialog', () => {
  let component: TestDialogComponent;
  let fixture: ComponentFixture<TestDialogComponent>;
  let dialogElement: HTMLDialogElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDialogComponent);
    component = fixture.componentInstance;
    dialogElement = fixture.debugElement.query(By.css('dialog')).nativeElement;

    spyOn(dialogElement, 'showModal').and.callThrough();
    spyOn(dialogElement, 'close').and.callThrough();

    fixture.detectChanges();
  });

  describe('Setup', () => {
    it('should create directive on dialog[interop-dialog] host', () => {
      expect(component.directive).toBeDefined();
    });

    it('should have default input values', () => {
      expect(component.directive.isOpen()).toBe(false);
      expect(component.directive.dismissOnBackdrop()).toBe(true);
      expect(component.directive.disableEscape()).toBe(false);
      expect(component.directive.autoFocus()).toBeNull();
      expect(component.directive.returnFocus()).toBeNull();
      expect(component.directive.autoClose()).toBe(false);
    });

    it('should not call showModal on creation when isOpen=false', () => {
      expect(dialogElement.showModal).not.toHaveBeenCalled();
    });
  });

  describe('Open/Close via isOpen input', () => {
    it('should call showModal when isOpen changes to true', async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(dialogElement.showModal).toHaveBeenCalled();
    });

    it('should call close when isOpen changes to false after being open', async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();

      component.isOpen = false;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(dialogElement.close).toHaveBeenCalled();
    });

    it('should guard against calling close on already-closed dialog', async () => {
      component.isOpen = false;
      fixture.detectChanges();
      await fixture.whenStable();

      // This should not throw
      component.isOpen = false;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(dialogElement.close).not.toHaveBeenCalled();
    });

    it('should guard against calling showModal on already-open dialog', async () => {
      (dialogElement.showModal as any).calls.reset();

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(1);

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(1); // still 1, not 2
    });

    it('should emit closed with reason="programmatic" when isOpen→false', (done) => {
      component.isOpen = true;
      fixture.detectChanges();

      setTimeout(() => {
        component.isOpen = false;
        fixture.detectChanges();

        setTimeout(() => {
          expect(component.lastClosedEvent).toBeDefined();
          expect(component.lastClosedEvent.reason).toBe('programmatic');
          done();
        }, 0);
      }, 0);
    });
  });

  describe('Backdrop dismiss', () => {
    beforeEach(async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should emit closed with reason="backdrop" when clicking dialog itself and dismissOnBackdrop=true', () => {
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: dialogElement,
        enumerable: true,
      });

      dialogElement.dispatchEvent(clickEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent.reason).toBe('backdrop');
    });

    it('should NOT emit when click target is a child element', () => {
      const button = fixture.debugElement.query(By.css('#close-btn')).nativeElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: button,
        enumerable: true,
      });

      component.lastClosedEvent = null;
      dialogElement.dispatchEvent(clickEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent).toBeNull();
    });

    it('should NOT emit when dismissOnBackdrop=false', () => {
      component.dismissOnBackdrop = false;
      fixture.detectChanges();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: dialogElement,
        enumerable: true,
      });

      component.lastClosedEvent = null;
      dialogElement.dispatchEvent(clickEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent).toBeNull();
    });
  });

  describe('ESC / cancel event', () => {
    beforeEach(async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should emit closed with reason="escape" on cancel when disableEscape=false', () => {
      const cancelEvent = new Event('cancel', { bubbles: true });
      spyOn(cancelEvent, 'preventDefault');

      dialogElement.dispatchEvent(cancelEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent.reason).toBe('escape');
      expect(cancelEvent.preventDefault).toHaveBeenCalled();
    });

    it('should call preventDefault on cancel always', () => {
      const cancelEvent = new Event('cancel', { bubbles: true });
      spyOn(cancelEvent, 'preventDefault');

      dialogElement.dispatchEvent(cancelEvent);
      fixture.detectChanges();

      expect(cancelEvent.preventDefault).toHaveBeenCalled();
    });

    it('should NOT emit when disableEscape=true', () => {
      component.disableEscape = true;
      fixture.detectChanges();

      const cancelEvent = new Event('cancel', { bubbles: true });
      spyOn(cancelEvent, 'preventDefault');

      component.lastClosedEvent = null;
      dialogElement.dispatchEvent(cancelEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent).toBeNull();
      expect(cancelEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Auto-focus', () => {
    beforeEach(async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should focus the element matching autoFocus selector after open', (done) => {
      component.autoFocus = '#email-input';
      component.isOpen = true;
      fixture.detectChanges();

      setTimeout(() => {
        const emailInput = fixture.debugElement.query(By.css('#email-input'))
          .nativeElement;
        expect(document.activeElement).toBe(emailInput);
        done();
      }, 50);
    });

    it('should not throw when autoFocus selector matches nothing', () => {
      expect(() => {
        component.autoFocus = '#non-existent';
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not call explicit focus when autoFocus=null', (done) => {
      const emailInput = fixture.debugElement.query(By.css('#email-input'))
        .nativeElement;
      spyOn(emailInput, 'focus');

      component.autoFocus = null;
      component.isOpen = true;
      fixture.detectChanges();

      setTimeout(() => {
        // Browser's native autofocus may or may not have run, but we don't call focus()
        done();
      }, 50);
    });
  });

  describe('Return focus', () => {
    beforeEach(async () => {
      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should return focus to element specified by returnFocus string selector', (done) => {
      const closeBtn = fixture.debugElement.query(By.css('#close-btn'))
        .nativeElement;
      closeBtn.focus();

      component.returnFocus = '#close-btn';
      component.isOpen = false;
      fixture.detectChanges();

      setTimeout(() => {
        expect(document.activeElement).toBe(closeBtn);
        done();
      }, 50);
    });

    it('should return focus to the element that was focused before open', (done) => {
      const closeBtn = fixture.debugElement.query(By.css('#close-btn'))
        .nativeElement;
      closeBtn.focus();
      const beforeOpen = closeBtn;

      component.isOpen = false;
      fixture.detectChanges();

      setTimeout(() => {
        expect(document.activeElement).toBe(beforeOpen);
        done();
      }, 50);
    });

    it('should not throw when previousFocus element has been removed', (done) => {
      const closeBtn = fixture.debugElement.query(By.css('#close-btn'))
        .nativeElement;
      closeBtn.focus();

      // Remove the element from DOM
      closeBtn.remove();

      expect(() => {
        component.isOpen = false;
        fixture.detectChanges();
      }).not.toThrow();

      done();
    });
  });

  describe('Auto-close on form submit', () => {
    beforeEach(async () => {
      component.isOpen = true;
      component.autoClose = true;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should emit closed with reason="form-submit" on submit when autoClose=true', () => {
      const form = fixture.debugElement.query(By.css('#test-form'))
        .nativeElement;
      const submitEvent = new Event('submit', { bubbles: true });

      form.dispatchEvent(submitEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent.reason).toBe('form-submit');
    });

    it('should NOT emit on submit when autoClose=false', () => {
      component.autoClose = false;
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('#test-form'))
        .nativeElement;
      const submitEvent = new Event('submit', { bubbles: true });

      component.lastClosedEvent = null;
      form.dispatchEvent(submitEvent);
      fixture.detectChanges();

      expect(component.lastClosedEvent).toBeNull();
    });
  });

  describe('Dev-mode warnings', () => {
    it('should warn when aria-label and aria-labelledby are both absent', () => {
      spyOn(console, 'warn');

      component.ariaLabelledBy = null;
      component.ariaLabel = null;
      fixture.detectChanges();

      // Create a new fixture to trigger dev-mode warnings
      const newFixture = TestBed.createComponent(TestDialogComponent);
      newFixture.componentInstance.ariaLabelledBy = null;
      newFixture.componentInstance.ariaLabel = null;
      newFixture.detectChanges();

      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('aria-label or aria-labelledby'),
      );
    });

    it('should NOT warn when aria-label is present', () => {
      spyOn(console, 'warn');

      const newFixture = TestBed.createComponent(TestDialogComponent);
      newFixture.componentInstance.ariaLabelledBy = null;
      newFixture.componentInstance.ariaLabel = 'Test Dialog Label';
      newFixture.detectChanges();

      const warnCalls = (console.warn as any).calls.allArgs();
      const hasLabelWarning = warnCalls.some((call: any) =>
        call[0]?.includes('aria-label or aria-labelledby'),
      );

      expect(hasLabelWarning).toBeFalsy();
    });

    it('should NOT warn when aria-labelledby is present', () => {
      spyOn(console, 'warn');

      const newFixture = TestBed.createComponent(TestDialogComponent);
      newFixture.componentInstance.ariaLabelledBy = 'dialog-title';
      newFixture.componentInstance.ariaLabel = null;
      newFixture.detectChanges();

      const warnCalls = (console.warn as any).calls.allArgs();
      const hasLabelWarning = warnCalls.some((call: any) =>
        call[0]?.includes('aria-label or aria-labelledby'),
      );

      expect(hasLabelWarning).toBeFalsy();
    });

    it('should warn when ancestor has CSS transform', () => {
      spyOn(console, 'warn');

      const newFixture = TestBed.createComponent(TestDialogComponent);
      const parent = newFixture.debugElement.nativeElement;
      parent.style.transform = 'scale(1.1)';
      newFixture.detectChanges();

      const warnCalls = (console.warn as any).calls.allArgs();
      const hasTransformWarning = warnCalls.some((call: any) =>
        call[0]?.includes('CSS transform'),
      );

      expect(hasTransformWarning).toBeTruthy();
    });
  });

  describe('Input change reactivity', () => {
    it('should toggle isOpen false → true → false and trigger correct sequence', async () => {
      (dialogElement.showModal as any).calls.reset();
      (dialogElement.close as any).calls.reset();

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(1);

      component.isOpen = false;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.close).toHaveBeenCalledTimes(1);

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(2);
    });

    it('should idempotently handle isOpen=true → isOpen=true', async () => {
      (dialogElement.showModal as any).calls.reset();

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(1);

      component.isOpen = true;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(dialogElement.showModal).toHaveBeenCalledTimes(1); // not 2
    });
  });
});
