import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";

import {
	InteropCheckboxRig,
	CheckboxOption,
} from "./interop-checkbox-rig";
import { InteropAttribute } from "../../services/interop-attribute.service";

const TOPPING_CONTROLS: CheckboxOption[] = [
	{ id: "pepperoni", value: "pepperoni", label: "Pepperoni" },
	{ id: "mushrooms", value: "mushrooms", label: "Mushrooms" },
	{ id: "olives", value: "olives", label: "Olives" },
];

const CONTROLS_WITH_DISABLED: CheckboxOption[] = [
	{ id: "pepperoni", value: "pepperoni", label: "Pepperoni" },
	{ id: "mushrooms", value: "mushrooms", label: "Mushrooms", disabled: true },
	{ id: "olives", value: "olives", label: "Olives" },
];

/**
 * Test host for hands-off + declarative mode.
 */
@Component({
	standalone: true,
	imports: [InteropCheckboxRig],
	template: `
		<interop-checkbox-rig
			[options]="options"
			[groupName]="'toppings'"
			[legend]="legend"
			[selectAll]="selectAll"
			[selectAllLabel]="selectAllLabel"
			[disabled]="disabled"
			[required]="required"
			[(value)]="selectedValues"
			(valueChange)="onValueChange($event)"
		>
		</interop-checkbox-rig>
	`,
})
class HandsOffDeclarativeHost {
	options = TOPPING_CONTROLS;
	legend = "Choose toppings";
	selectAll = false;
	selectAllLabel = "Select all";
	disabled = false;
	required = false;
	selectedValues: (string | number | boolean)[] = [];
	onValueChange = jasmine.createSpy("onValueChange");
}

/**
 * Test host for content projection mode.
 */
@Component({
	standalone: true,
	imports: [InteropCheckboxRig],
	template: `
		<interop-checkbox-rig [(value)]="selectedValues">
			<div class="projected-content">Projected checkboxes here</div>
		</interop-checkbox-rig>
	`,
})
class ContentProjectionHost {
	selectedValues: (string | number | boolean)[] = [];
}

describe("InteropCheckboxRig", () => {
	describe("Hands-off + Declarative Mode", () => {
		let fixture: ComponentFixture<HandsOffDeclarativeHost>;
		let host: HandsOffDeclarativeHost;
		let groupElement: HTMLElement;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [HandsOffDeclarativeHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(HandsOffDeclarativeHost);
			host = fixture.componentInstance;
			groupElement = fixture.nativeElement.querySelector(
				"interop-checkbox-rig",
			);

			fixture.detectChanges();
			await fixture.whenStable();
		});

		it("should create", () => {
			expect(groupElement).toBeTruthy();
		});

		it("should render a fieldset in hands-off mode", () => {
			const fieldset = groupElement.querySelector("fieldset");
			expect(fieldset).toBeTruthy();
		});

		it("should render a legend when provided", () => {
			const legend = groupElement.querySelector("legend");
			expect(legend).toBeTruthy();
			expect(legend!.textContent).toContain("Choose toppings");
		});

		it("should render checkboxes from options array", () => {
			const checkboxes = groupElement.querySelectorAll(
				'input[type="checkbox"]',
			);
			expect(checkboxes.length).toBe(3);
		});

		it("should render labels for each control", () => {
			const labels = groupElement.querySelectorAll(".checkbox-control");
			expect(labels.length).toBe(3);
			expect(labels[0].textContent).toContain("Pepperoni");
			expect(labels[1].textContent).toContain("Mushrooms");
			expect(labels[2].textContent).toContain("Olives");
		});

		it("should toggle value when checkbox is clicked", async () => {
			const checkboxes = groupElement.querySelectorAll(
				'input[type="checkbox"]',
			);
			const pepperoniInput = checkboxes[0] as HTMLInputElement;

			pepperoniInput.checked = true;
			pepperoniInput.dispatchEvent(new Event("change", { bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalled();
			const lastCall = host.onValueChange.calls.mostRecent().args[0];
			expect(lastCall).toContain("pepperoni");
		});

		it("should remove value when checkbox is unchecked", async () => {
			// Start with pepperoni selected
			host.selectedValues = ["pepperoni"];
			fixture.detectChanges();
			await fixture.whenStable();

			const checkboxes = groupElement.querySelectorAll(
				'input[type="checkbox"]',
			);
			const pepperoniInput = checkboxes[0] as HTMLInputElement;

			pepperoniInput.checked = false;
			pepperoniInput.dispatchEvent(new Event("change", { bubbles: true }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(host.onValueChange).toHaveBeenCalled();
			const lastCall = host.onValueChange.calls.mostRecent().args[0];
			expect(lastCall).not.toContain("pepperoni");
		});

		it("should disable all checkboxes when group is disabled", async () => {
			host.disabled = true;
			fixture.detectChanges();
			await fixture.whenStable();

			const fieldset = groupElement.querySelector("fieldset");
			expect(fieldset!.disabled).toBe(true);
		});

		it("should set role=group on the fieldset", () => {
			const fieldset = groupElement.querySelector("fieldset");
			expect(fieldset!.getAttribute("role")).toBe("group");
		});
	});

	describe("Select-All", () => {
		let fixture: ComponentFixture<HandsOffDeclarativeHost>;
		let host: HandsOffDeclarativeHost;
		let groupElement: HTMLElement;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [HandsOffDeclarativeHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(HandsOffDeclarativeHost);
			host = fixture.componentInstance;
			host.selectAll = true;
			groupElement = fixture.nativeElement.querySelector(
				"interop-checkbox-rig",
			);

			fixture.detectChanges();
			await fixture.whenStable();
		});

		it("should render a select-all checkbox when enabled", () => {
			const selectAllLabel = groupElement.querySelector(".checkbox-select-all");
			expect(selectAllLabel).toBeTruthy();
			expect(selectAllLabel!.textContent).toContain("Select all");
		});

		it("should render select-all with custom label", async () => {
			host.selectAllLabel = "Grant all permissions";
			fixture.detectChanges();
			await fixture.whenStable();

			const selectAllLabel = groupElement.querySelector(".checkbox-select-all");
			expect(selectAllLabel!.textContent).toContain("Grant all permissions");
		});

		it("should have aria-controls listing all checkbox IDs", () => {
			const selectAllLabel = groupElement.querySelector(".checkbox-select-all");
			const ariaControls = selectAllLabel!.getAttribute("aria-controls");
			expect(ariaControls).toBe("pepperoni mushrooms olives");
		});

		it("should render 4 checkboxes total (select-all + 3 options)", () => {
			const checkboxes = groupElement.querySelectorAll(
				'input[type="checkbox"]',
			);
			expect(checkboxes.length).toBe(4);
		});
	});

	describe("Select-All State Derivation", () => {
		let fixture: ComponentFixture<HandsOffDeclarativeHost>;
		let host: HandsOffDeclarativeHost;
		let component: InteropCheckboxRig;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [HandsOffDeclarativeHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(HandsOffDeclarativeHost);
			host = fixture.componentInstance;
			host.selectAll = true;

			fixture.detectChanges();
			await fixture.whenStable();

			// Access the InteropCheckboxRig component instance
			const groupDebugEl = fixture.debugElement.children[0];
			component = groupDebugEl.componentInstance;
		});

		it("should report isAllSelected=false when nothing is selected", () => {
			expect(component.isAllSelected()).toBe(false);
		});

		it("should report isPartialSelected=false when nothing is selected", () => {
			expect(component.isPartialSelected()).toBe(false);
		});

		it("should report isPartialSelected=true when some are selected", async () => {
			host.selectedValues = ["pepperoni"];
			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.isPartialSelected()).toBe(true);
			expect(component.isAllSelected()).toBe(false);
		});

		it("should report isAllSelected=true when all are selected", async () => {
			host.selectedValues = ["pepperoni", "mushrooms", "olives"];
			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.isAllSelected()).toBe(true);
			expect(component.isPartialSelected()).toBe(false);
		});
	});

	describe("Select-All with Disabled Items", () => {
		let fixture: ComponentFixture<HandsOffDeclarativeHost>;
		let host: HandsOffDeclarativeHost;
		let component: InteropCheckboxRig;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [HandsOffDeclarativeHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(HandsOffDeclarativeHost);
			host = fixture.componentInstance;
			host.options = CONTROLS_WITH_DISABLED;
			host.selectAll = true;

			fixture.detectChanges();
			await fixture.whenStable();

			const groupDebugEl = fixture.debugElement.children[0];
			component = groupDebugEl.componentInstance;
		});

		it("should only consider enabled items for isAllSelected", async () => {
			// Select only enabled items (pepperoni, olives — mushrooms is disabled)
			host.selectedValues = ["pepperoni", "olives"];
			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.isAllSelected()).toBe(true);
		});

		it("should preserve disabled items' selection state during toggleAll", () => {
			// mushrooms is disabled but selected
			component.writeValue(["mushrooms"]);

			// toggleAll should select all enabled items and keep mushrooms
			component.toggleAll();
			const result = component.effectiveValue();

			expect(result).toContain("pepperoni");
			expect(result).toContain("olives");
			expect(result).toContain("mushrooms");
		});
	});

	describe("Content Projection Mode", () => {
		let fixture: ComponentFixture<ContentProjectionHost>;
		let component: InteropCheckboxRig;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [ContentProjectionHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(ContentProjectionHost);
			fixture.detectChanges();
			await fixture.whenStable();

			const groupDebugEl = fixture.debugElement.children[0];
			component = groupDebugEl.componentInstance;
		});

		it("should be in non-declarative mode when no options are provided", () => {
			expect(component.isDeclarativeMode()).toBe(false);
		});

		it("should be in hands-off mode when using element selector", () => {
			expect(component.isHandsOffMode()).toBe(true);
		});
	});

	describe("ControlValueAccessor", () => {
		let fixture: ComponentFixture<HandsOffDeclarativeHost>;
		let component: InteropCheckboxRig;

		beforeEach(async () => {
			const attrsManagerSpy = jasmine.createSpyObj("InteropAttribute", [], {
				Presets: {},
			});

			await TestBed.configureTestingModule({
				imports: [HandsOffDeclarativeHost],
				providers: [{ provide: InteropAttribute, useValue: attrsManagerSpy }],
			}).compileComponents();

			fixture = TestBed.createComponent(HandsOffDeclarativeHost);
			fixture.detectChanges();
			await fixture.whenStable();

			const groupDebugEl = fixture.debugElement.children[0];
			component = groupDebugEl.componentInstance;
		});

		it("should accept an array via writeValue", () => {
			component.writeValue(["pepperoni", "olives"]);
			expect(component.effectiveValue()).toEqual(["pepperoni", "olives"]);
		});

		it("should handle null/undefined in writeValue", () => {
			component.writeValue(null);
			expect(component.effectiveValue()).toEqual([]);

			component.writeValue(undefined);
			expect(component.effectiveValue()).toEqual([]);
		});

		it("should call registered onChange callback", () => {
			const changeSpy = jasmine.createSpy("onChange");
			component.registerOnChange(changeSpy);

			component.onCheckboxToggle("pepperoni", true);
			fixture.detectChanges();

			expect(changeSpy).toHaveBeenCalled();
		});

		it("should call registered onTouched callback", () => {
			const touchedSpy = jasmine.createSpy("onTouched");
			component.registerOnTouched(touchedSpy);

			component.onCheckboxToggle("pepperoni", true);

			expect(touchedSpy).toHaveBeenCalled();
		});
	});
});
