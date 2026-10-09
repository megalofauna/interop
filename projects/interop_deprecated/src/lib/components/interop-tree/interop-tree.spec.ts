import { Component, forwardRef, input, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InteropTree } from "./interop-tree";
import { InteropTreeItem } from "./interop-tree-item";
import { InteropTreeToggle } from "./interop-tree-toggle";
import { InteropTreeGroup } from "./interop-tree-group";

// ── Helpers ────────────────────────────────────────────────────────────────

function key(el: HTMLElement, k: string): void {
	el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
}

function item(fixture: ComponentFixture<unknown>, k: string): HTMLElement {
	return fixture.nativeElement.querySelector(`[key="${k}"]`) as HTMLElement;
}

function focused(fixture: ComponentFixture<unknown>): string | null {
	const el = fixture.nativeElement.querySelector(
		'[interop-tree-item][tabindex="0"]',
	) as HTMLElement | null;
	return el?.getAttribute("key") ?? null;
}

// ── Test hosts ─────────────────────────────────────────────────────────────

/**
 * src ┬ lib ┬ tree.ts
 *     │     └ tree.css
 *     └ main.ts
 * docs ─ readme.md
 */
const TREE_TEMPLATE = `
  <ul interop-tree="select" aria-label="Files"
      [multiselectable]="multi()" [(selected)]="picked">
    <li interop-tree-item key="src" label="src">
      <span interop-tree-row><span interop-tree-toggle></span>src</span>
      <ul interop-tree-group>
        <li interop-tree-item key="lib" label="lib">
          <span interop-tree-row><span interop-tree-toggle></span>lib</span>
          <ul interop-tree-group>
            <li interop-tree-item key="tree.ts" label="tree.ts">
              <span interop-tree-row><span interop-tree-toggle></span>tree.ts</span>
            </li>
            <li interop-tree-item key="tree.css" label="tree.css">
              <span interop-tree-row><span interop-tree-toggle></span>tree.css</span>
            </li>
          </ul>
        </li>
        <li interop-tree-item key="main.ts" label="main.ts">
          <span interop-tree-row><span interop-tree-toggle></span>main.ts</span>
        </li>
      </ul>
    </li>
    <li interop-tree-item key="docs" label="docs">
      <span interop-tree-row><span interop-tree-toggle></span>docs</span>
      <ul interop-tree-group>
        <li interop-tree-item key="readme.md" label="readme.md">
          <span interop-tree-row><span interop-tree-toggle></span>readme.md</span>
        </li>
      </ul>
    </li>
  </ul>
`;

@Component({
	standalone: true,
	imports: [InteropTree, InteropTreeItem, InteropTreeToggle, InteropTreeGroup],
	template: TREE_TEMPLATE,
})
class TreeHost {
	multi = signal(false);
	picked = signal<string[]>([]);
}

@Component({
	standalone: true,
	imports: [InteropTree, InteropTreeItem, InteropTreeToggle, InteropTreeGroup],
	template: `
		<ul interop-tree>
			<li interop-tree-item key="guide">
				<span interop-tree-row>
					<button interop-tree-toggle></button>
					<a href="/guide">Guide</a>
				</span>
				<ul interop-tree-group>
					<li interop-tree-item key="install">
						<span interop-tree-row>
							<button interop-tree-toggle></button>
							<a href="/install">Install</a>
						</span>
					</li>
				</ul>
			</li>
		</ul>
	`,
})
class NavHost {}

/**
 * Depth is derived from the ancestor chain via DI, so *how* nested items are
 * rendered matters. A recursive component's element injector sits at its
 * insertion point and resolves correctly; an `ngTemplateOutlet` embedded view
 * resolves from where the template was declared and cannot see the tree at all.
 */
@Component({
	selector: "[recursive-nodes]",
	standalone: true,
	imports: [
		InteropTreeItem,
		InteropTreeToggle,
		InteropTreeGroup,
		forwardRef(() => RecursiveNodes),
	],
	template: `
		@for (node of nodes(); track node.key) {
			<li interop-tree-item [key]="node.key" [expanded]="true">
				<span interop-tree-row
					><span interop-tree-toggle></span>{{ node.key }}</span
				>
				@if (node.children) {
					<ul interop-tree-group recursive-nodes [nodes]="node.children"></ul>
				}
			</li>
		}
	`,
})
class RecursiveNodes {
	readonly nodes = input.required<{ key: string; children?: unknown[] }[]>();
}

@Component({
	standalone: true,
	imports: [InteropTree, RecursiveNodes],
	template: `
		<ul
			interop-tree="select"
			aria-label="Generated"
			recursive-nodes
			[nodes]="nodes"
		></ul>
	`,
})
class RecursiveHost {
	nodes = [{ key: "r1", children: [{ key: "r2", children: [{ key: "r3" }] }] }];
}

// ── Tier semantics ─────────────────────────────────────────────────────────

describe("InteropTree — tier semantics", () => {
	it("navigate tier authors no tree roles and no roving tabindex", () => {
		const fixture = TestBed.createComponent(NavHost);
		fixture.detectChanges();

		const tree = fixture.nativeElement.querySelector("[interop-tree]");
		expect(tree.getAttribute("role")).toBeNull();
		expect(item(fixture, "guide").getAttribute("role")).toBeNull();
		expect(item(fixture, "guide").getAttribute("tabindex")).toBeNull();
		expect(item(fixture, "guide").getAttribute("aria-selected")).toBeNull();
	});

	it("select tier applies tree / treeitem / group roles", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		const tree = fixture.nativeElement.querySelector("[interop-tree]");
		expect(tree.getAttribute("role")).toBe("tree");
		expect(item(fixture, "src").getAttribute("role")).toBe("treeitem");
		expect(
			fixture.nativeElement
				.querySelector("[interop-tree-group]")
				.getAttribute("role"),
		).toBe("group");
	});

	it("emits aria-level and the matching --itx-tree-level for indentation", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-level")).toBe("1");
		expect(item(fixture, "lib").getAttribute("aria-level")).toBe("2");
		expect(item(fixture, "tree.ts").getAttribute("aria-level")).toBe("3");
		expect(
			item(fixture, "tree.ts").style.getPropertyValue("--itx-tree-level"),
		).toBe("3");
	});

	it("marks branches expandable and leaves not, from group presence alone", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("false");
		expect(item(fixture, "main.ts").getAttribute("aria-expanded")).toBeNull();
		expect(item(fixture, "main.ts").hasAttribute("data-leaf")).toBe(true);
	});
});

describe("InteropTree — recursive rendering", () => {
	it("derives depth through a recursive component, not just static markup", () => {
		const fixture = TestBed.createComponent(RecursiveHost);
		fixture.detectChanges();

		// `[key]` is an input, not a DOM attribute, so these are read in DOM order.
		const items = Array.from(
			fixture.nativeElement.querySelectorAll("[interop-tree-item]"),
		) as HTMLElement[];

		expect(items.map((el) => el.getAttribute("aria-level"))).toEqual([
			"1",
			"2",
			"3",
		]);
		expect(items[2].style.getPropertyValue("--itx-tree-level")).toBe("3");
	});

	it("keeps <li> as the direct child of its list — no wrapper element", () => {
		const fixture = TestBed.createComponent(RecursiveHost);
		fixture.detectChanges();

		for (const group of Array.from(
			fixture.nativeElement.querySelectorAll(
				"[interop-tree], [interop-tree-group]",
			),
		) as HTMLElement[]) {
			for (const child of Array.from(group.children)) {
				expect(child.tagName).toBe("LI");
			}
		}
	});
});

// ── Findability ────────────────────────────────────────────────────────────

describe("InteropTree — collapsed groups", () => {
	it('hides with hidden="until-found" so find-in-page still reaches them', () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		const group = fixture.nativeElement.querySelector("[interop-tree-group]");
		expect(group.getAttribute("hidden")).toBe("until-found");
	});

	it("adopts a browser reveal (beforematch) as real expansion", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		const group = fixture.nativeElement.querySelector("[interop-tree-group]");
		group.dispatchEvent(new Event("beforematch", { bubbles: true }));
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");
		expect(group.getAttribute("hidden")).toBeNull();
	});

	it("wires the group id to the toggle's aria-controls in the navigate tier", () => {
		const fixture = TestBed.createComponent(NavHost);
		fixture.detectChanges();

		const toggle = item(fixture, "guide").querySelector(
			"[interop-tree-toggle]",
		) as HTMLElement;
		const group = fixture.nativeElement.querySelector("[interop-tree-group]");
		expect(toggle.getAttribute("aria-controls")).toBe(group.id);
		expect(group.id).toBeTruthy();
	});
});

// ── Toggle forms ───────────────────────────────────────────────────────────

describe("InteropTreeToggle", () => {
	it("is a real disclosure button on a <button> host", () => {
		const fixture = TestBed.createComponent(NavHost);
		fixture.detectChanges();

		const toggle = item(fixture, "guide").querySelector(
			"button[interop-tree-toggle]",
		) as HTMLElement;
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(toggle.getAttribute("aria-hidden")).toBeNull();
	});

	// The name is read from the row after render, not during it — the row's own
	// text may still be an unfilled interpolation on the creation pass.
	it("names an icon-only button toggle from its row's text", async () => {
		const fixture = TestBed.createComponent(NavHost);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		const toggle = item(fixture, "guide").querySelector(
			"button[interop-tree-toggle]",
		) as HTMLElement;
		expect(toggle.getAttribute("aria-label")).toBe("Guide");
	});

	it("is an aria-hidden affordance on a non-button host", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		const toggle = item(fixture, "src").querySelector(
			"[interop-tree-toggle]",
		) as HTMLElement;
		expect(toggle.getAttribute("aria-hidden")).toBe("true");
		expect(toggle.getAttribute("aria-expanded")).toBeNull();
	});

	it("disables the button form on a leaf — nothing to disclose", () => {
		const fixture = TestBed.createComponent(NavHost);
		fixture.detectChanges();

		const toggle = item(fixture, "install").querySelector(
			"button[interop-tree-toggle]",
		) as HTMLElement;
		expect(toggle.hasAttribute("disabled")).toBe(true);
	});

	it("expands on click without selecting the row", () => {
		const fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();

		const toggle = item(fixture, "src").querySelector(
			"[interop-tree-toggle]",
		) as HTMLElement;
		toggle.click();
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");
		expect(fixture.componentInstance.picked()).toEqual([]);
	});
});

// ── Keyboard (APG treeview) ────────────────────────────────────────────────

describe("InteropTree — keyboard", () => {
	let fixture: ComponentFixture<TreeHost>;
	let tree: HTMLElement;

	beforeEach(() => {
		fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();
		tree = fixture.nativeElement.querySelector("[interop-tree]");
	});

	it("gives the whole widget one tab stop", () => {
		expect(
			fixture.nativeElement.querySelectorAll(
				'[interop-tree-item][tabindex="0"]',
			).length,
		).toBe(1);
		expect(focused(fixture)).toBe("src");
	});

	it("ArrowRight opens a closed branch in place, then descends", () => {
		key(tree, "ArrowRight");
		fixture.detectChanges();
		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");
		expect(focused(fixture)).toBe("src");

		key(tree, "ArrowRight");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("lib");
	});

	it("ArrowLeft closes an open branch, then moves to the parent", () => {
		key(tree, "ArrowRight");
		key(tree, "ArrowRight");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("lib");

		key(tree, "ArrowLeft");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("src");
		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");

		key(tree, "ArrowLeft");
		fixture.detectChanges();
		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("false");
	});

	it("ArrowDown skips over collapsed subtrees", () => {
		key(tree, "ArrowDown");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("docs");
	});

	it("ArrowDown walks into an expanded subtree", () => {
		key(tree, "ArrowRight");
		fixture.detectChanges();
		key(tree, "ArrowDown");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("lib");
	});

	it("Home and End go to the first and last visible node", () => {
		key(tree, "End");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("docs");

		key(tree, "Home");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("src");
	});

	it("* expands every sibling at the focused level", () => {
		key(tree, "*");
		fixture.detectChanges();
		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");
		expect(item(fixture, "docs").getAttribute("aria-expanded")).toBe("true");
	});

	it("typeahead jumps to the next matching visible node", () => {
		key(tree, "d");
		fixture.detectChanges();
		expect(focused(fixture)).toBe("docs");
	});

	it("Enter selects the focused node", () => {
		key(tree, "ArrowDown");
		key(tree, "Enter");
		fixture.detectChanges();
		expect(fixture.componentInstance.picked()).toEqual(["docs"]);
		expect(item(fixture, "docs").getAttribute("aria-selected")).toBe("true");
	});

	it("single-select replaces, multi-select accumulates", () => {
		key(tree, "Enter");
		key(tree, "ArrowDown");
		key(tree, "Enter");
		fixture.detectChanges();
		expect(fixture.componentInstance.picked()).toEqual(["docs"]);

		fixture.componentInstance.multi.set(true);
		fixture.componentInstance.picked.set([]);
		fixture.detectChanges();

		key(tree, "Home");
		key(tree, " ");
		key(tree, "ArrowDown");
		key(tree, " ");
		fixture.detectChanges();
		expect(fixture.componentInstance.picked()).toEqual(["src", "docs"]);
	});

	it("authors no keyboard model in the navigate tier", () => {
		const nav = TestBed.createComponent(NavHost);
		nav.detectChanges();
		const navTree = nav.nativeElement.querySelector("[interop-tree]");

		key(navTree, "ArrowRight");
		nav.detectChanges();
		expect(item(nav, "guide").getAttribute("aria-expanded")).toBe("false");
	});
});

// ── Imperative API ─────────────────────────────────────────────────────────

describe("InteropTree — reveal / expandAll / collapseAll", () => {
	let fixture: ComponentFixture<TreeHost>;
	let tree: InteropTree;

	beforeEach(() => {
		fixture = TestBed.createComponent(TreeHost);
		fixture.detectChanges();
		tree = fixture.debugElement
			.query((n) => !!n.injector.get(InteropTree, null))
			.injector.get(InteropTree);
	});

	it("reveal() expands every ancestor of a buried node and focuses it", () => {
		tree.reveal("tree.css");
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("true");
		expect(item(fixture, "lib").getAttribute("aria-expanded")).toBe("true");
		expect(focused(fixture)).toBe("tree.css");
	});

	it("collapseAll() moves focus out to the root rather than losing it", () => {
		tree.reveal("tree.css");
		fixture.detectChanges();

		tree.collapseAll();
		fixture.detectChanges();

		expect(item(fixture, "src").getAttribute("aria-expanded")).toBe("false");
		expect(focused(fixture)).toBe("src");
	});

	it("expandAll() opens every branch", () => {
		tree.expandAll();
		fixture.detectChanges();

		for (const k of ["src", "lib", "docs"]) {
			expect(item(fixture, k).getAttribute("aria-expanded")).toBe("true");
		}
	});
});
