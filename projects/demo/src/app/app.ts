import { Component, signal, computed, inject, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { Observable, of, delay, timer, map } from "rxjs";
import {
	InteropButton,
	InteropCodeBlock,
	InteropCollectionService,
	InteropIcon,
	InteropList,
	InteropRadioGroup,
	InteropTable,
	InteropToolbar,
	ManageAttributesDirective,
	PhAcorn,
	PhHeart,
	PhStar,
	PhUser,
	PhosphorIconRegistry,
	TableColumn,
	registerGlobalPhosphorIcons,
	type HighlightedCode,
} from "src/public-api";
import { InteropAppMetadata } from "./app.metadata";
import { SiteHeader } from "./components/site-header/site-header";

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
}

interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	inStock: boolean;
	rating: number;
}

interface Employee {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	department: string;
	salary: number;
	startDate: Date;
	active: boolean;
}

@Component({
	selector: "app-root",
	imports: [
		CommonModule,
		RouterOutlet,
		InteropList,
		InteropButton,
		InteropCodeBlock,
		InteropTable,
		InteropToolbar,
		ManageAttributesDirective,
		InteropIcon,
		SiteHeader,
	],
	providers: [registerGlobalPhosphorIcons(PhAcorn, PhUser, PhHeart, PhStar)],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class App {
	protected readonly title = signal("interop");

	meta = InteropAppMetadata;

	private collectionService = inject(InteropCollectionService);
	private iconRegistry = inject(PhosphorIconRegistry);

	// Basic array data
	readonly basicItems = signal([
		"Apple",
		"Banana",
		"Cherry",
		"Date",
		"Elderberry",
	]);

	// Object array data
	readonly users = signal<User[]>([
		{ id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
		{ id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
		{ id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Moderator" },
		{ id: 4, name: "Alice Brown", email: "alice@example.com", role: "User" },
	]);

	// Observable data (simulated API call)
	readonly productsObservable = signal<Observable<Product[]>>(
		timer(1500).pipe(
			map(() => [
				{
					id: "p1",
					name: "Laptop Pro",
					price: 1299,
					category: "Electronics",
					inStock: true,
					rating: 4.5,
				},
				{
					id: "p2",
					name: "Coffee Mug",
					price: 15,
					category: "Home",
					inStock: true,
					rating: 4.2,
				},
				{
					id: "p3",
					name: "Running Shoes",
					price: 89,
					category: "Sports",
					inStock: false,
					rating: 4.7,
				},
				{
					id: "p4",
					name: "Bluetooth Headphones",
					price: 199,
					category: "Electronics",
					inStock: true,
					rating: 4.3,
				},
			]),
		),
	);

	// Employee data for table demo
	readonly employees = signal<Employee[]>([
		{
			id: 1,
			firstName: "John",
			lastName: "Doe",
			email: "john.doe@company.com",
			department: "Engineering",
			salary: 95000,
			startDate: new Date("2022-03-15"),
			active: true,
		},
		{
			id: 2,
			firstName: "Jane",
			lastName: "Smith",
			email: "jane.smith@company.com",
			department: "Marketing",
			salary: 78000,
			startDate: new Date("2021-07-20"),
			active: true,
		},
		{
			id: 3,
			firstName: "Bob",
			lastName: "Johnson",
			email: "bob.johnson@company.com",
			department: "Sales",
			salary: 65000,
			startDate: new Date("2023-01-10"),
			active: false,
		},
		{
			id: 4,
			firstName: "Alice",
			lastName: "Brown",
			email: "alice.brown@company.com",
			department: "Engineering",
			salary: 102000,
			startDate: new Date("2020-11-05"),
			active: true,
		},
		{
			id: 5,
			firstName: "Charlie",
			lastName: "Wilson",
			email: "charlie.wilson@company.com",
			department: "HR",
			salary: 72000,
			startDate: new Date("2022-09-12"),
			active: true,
		},
	]);

	// Basic table column definitions (bedrock functionality)
	readonly basicEmployeeColumns = signal<TableColumn<Employee>[]>([
		{ key: "firstName", label: "First Name" },
		{ key: "lastName", label: "Last Name" },
		{ key: "department", label: "Department" },
		{ key: "active", label: "Status" },
	]);

	// Collection for async table demo
	readonly employeeCollection = signal(
		this.collectionService.create({
			source: [] as Employee[],
			loading: false,
		}),
	);

	// Promise data
	readonly promiseData = signal<Promise<string[]>>(
		new Promise((resolve) => {
			setTimeout(() => {
				resolve([
					"Item from Promise 1",
					"Item from Promise 2",
					"Item from Promise 3",
				]);
			}, 2000);
		}),
	);

	// Empty data for testing empty state
	readonly emptyData = signal<string[]>([]);

	// Collection objects - use signals directly, let component handle reactivity
	readonly userCollection = signal(
		this.collectionService.create({
			source: [] as User[],
			loading: false,
		}),
	);

	constructor() {
		// Update collection when users change
		effect(() => {
			const currentUsers = this.users();
			this.userCollection().setItems(currentUsers);
		});

		// Update employee collection when employees change
		effect(() => {
			const currentEmployees = this.employees();
			this.employeeCollection().setItems(currentEmployees);
		});
	}

	// Dynamic data manipulation
	readonly dynamicItems = signal<string[]>(["Dynamic 1", "Dynamic 2"]);

	// Large dataset for performance testing
	readonly largeDataset = signal<{ id: number; value: string }[]>(
		Array.from({ length: 1000 }, (_, i) => ({
			id: i + 1,
			value: `Item ${i + 1}`,
		})),
	);

	// Dynamic attributes for demo
	readonly dynamicAttrs = signal<Record<string, string | number>>({
		"data-testid": "demo-list",
		"aria-label": "Demo items list",
		class: "demo-styled-list",
		tabindex: 0,
	});

	readonly userListAttrs = signal<Record<string, string | number>>({
		"data-testid": "user-list",
		"aria-label": "User directory",
		class: "user-list-container",
		role: "list",
	});

	// Methods for dynamic demo
	addDynamicItem(): void {
		const current = this.dynamicItems();
		const newItem = `Dynamic ${current.length + 1}`;
		this.dynamicItems.set([...current, newItem]);
	}

	removeDynamicItem(): void {
		const current = this.dynamicItems();
		if (current.length > 0) {
			this.dynamicItems.set(current.slice(0, -1));
		}
	}

	shuffleDynamicItems(): void {
		const current = [...this.dynamicItems()];
		for (let i = current.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[current[i], current[j]] = [current[j], current[i]];
		}
		this.dynamicItems.set(current);
	}

	// Custom track by functions
	trackByUserId = (index: number, user: User): number => user.id;
	trackByProductId = (index: number, product: Product): string => product.id;

	// Method to toggle attributes dynamically
	toggleAttributes(): void {
		const current = this.dynamicAttrs();
		const newAttrs: Record<string, string | number> = {
			...current,
			class:
				current["class"] === "demo-styled-list"
					? "demo-styled-list active"
					: "demo-styled-list",
		};

		// Type-safe way to conditionally add/remove attributes
		if (current["data-status"]) {
			// Remove data-status by not including it
			delete newAttrs["data-status"];
		} else {
			// Add data-status
			newAttrs["data-status"] = "interactive";
		}

		this.dynamicAttrs.set(newAttrs);
	}

	// Table demo methods
	addEmployee(): void {
		const current = this.employees();
		const newEmployee: Employee = {
			id: Math.max(...current.map((e) => e.id)) + 1,
			firstName: "New",
			lastName: "Employee",
			email: "new.employee@company.com",
			department: "Engineering",
			salary: 75000,
			startDate: new Date(),
			active: true,
		};
		this.employees.set([...current, newEmployee]);
	}

	removeEmployee(): void {
		const current = this.employees();
		if (current.length > 0) {
			this.employees.set(current.slice(0, -1));
		}
	}

	toggleEmployeeStatus(employee: Employee): void {
		const current = this.employees();
		const updated = current.map((emp) =>
			emp.id === employee.id ? { ...emp, active: !emp.active } : emp,
		);
		this.employees.set(updated);
	}

	// ── Code block demo data ────────────────────────────────────────────────────
	// Literal code strings for projected <pre><code> examples.
	// Defined here (not inline in the template) because Angular's template compiler
	// misinterprets raw '{' / '}' as ICU message syntax and '@' as block syntax.

	readonly demoFilenameCode =
`@Component({
  selector: 'button[interop-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropButton {
  readonly onActivate = input<ActivationHandler | null>(null);
  readonly loading    = input<boolean>(false);
}`;

	readonly demoWrapTokens = signal<HighlightedCode>([{
		tokens: [
			{ text: '{ ', color: '#d4d4d4' },
			{ text: '"name"', color: '#9cdcfe' },
			{ text: ': ', color: '#d4d4d4' },
			{ text: '"@interop/components"', color: '#ce9178' },
			{ text: ', ', color: '#d4d4d4' },
			{ text: '"version"', color: '#9cdcfe' },
			{ text: ': ', color: '#d4d4d4' },
			{ text: '"0.1.0"', color: '#ce9178' },
			{ text: ', ', color: '#d4d4d4' },
			{ text: '"description"', color: '#9cdcfe' },
			{ text: ': ', color: '#d4d4d4' },
			{ text: '"Angular component library providing interoperable, semantically correct, accessible UI components for Angular applications. HTML-first, platform-forward."', color: '#ce9178' },
			{ text: ', ', color: '#d4d4d4' },
			{ text: '"peerDependencies"', color: '#9cdcfe' },
			{ text: ': { ', color: '#d4d4d4' },
			{ text: '"@angular/core"', color: '#9cdcfe' },
			{ text: ': ', color: '#d4d4d4' },
			{ text: '">=21.0.0"', color: '#ce9178' },
			{ text: ', ', color: '#d4d4d4' },
			{ text: '"rxjs"', color: '#9cdcfe' },
			{ text: ': ', color: '#d4d4d4' },
			{ text: '">=7.8.0"', color: '#ce9178' },
			{ text: ' } }', color: '#d4d4d4' },
		],
	}]);

	// Pre-tokenized syntax highlighting using VS Code Dark+ theme colors.
	// In a real app, this would be produced by Shiki or Prism at build time.

	readonly tsTokens = signal<HighlightedCode>([
		{ tokens: [
			{ text: "import", color: "#c586c0" },
			{ text: " { signal, computed } from ", color: "#d4d4d4" },
			{ text: "'@angular/core'", color: "#ce9178" },
			{ text: ";", color: "#d4d4d4" },
		]},
		{ tokens: [{ text: "" }] },
		{ tokens: [
			{ text: "const", color: "#569cd6" },
			{ text: " count", color: "#9cdcfe" },
			{ text: " = ", color: "#d4d4d4" },
			{ text: "signal", color: "#dcdcaa" },
			{ text: "<", color: "#d4d4d4" },
			{ text: "number", color: "#4ec9b0" },
			{ text: ">(", color: "#d4d4d4" },
			{ text: "0", color: "#b5cea8" },
			{ text: ");", color: "#d4d4d4" },
		]},
		{ tokens: [
			{ text: "const", color: "#569cd6" },
			{ text: " doubled", color: "#9cdcfe" },
			{ text: " = ", color: "#d4d4d4" },
			{ text: "computed", color: "#dcdcaa" },
			{ text: "<", color: "#d4d4d4" },
			{ text: "number", color: "#4ec9b0" },
			{ text: ">(() => ", color: "#d4d4d4" },
			{ text: "count", color: "#dcdcaa" },
			{ text: "() * ", color: "#d4d4d4" },
			{ text: "2", color: "#b5cea8" },
			{ text: ");", color: "#d4d4d4" },
		]},
		{ tokens: [{ text: "" }] },
		{ tokens: [
			{ text: "count", color: "#9cdcfe" },
			{ text: ".", color: "#d4d4d4" },
			{ text: "set", color: "#dcdcaa" },
			{ text: "(", color: "#d4d4d4" },
			{ text: "5", color: "#b5cea8" },
			{ text: "); ", color: "#d4d4d4" },
			{ text: "// doubled() is now 10", color: "#6a9955" },
		]},
	]);

	readonly jsTokens = signal<HighlightedCode>([
		{ tokens: [
			{ text: "import", color: "#c586c0" },
			{ text: " { signal, computed } from ", color: "#d4d4d4" },
			{ text: "'@angular/core'", color: "#ce9178" },
			{ text: ";", color: "#d4d4d4" },
		]},
		{ tokens: [{ text: "" }] },
		{ tokens: [
			{ text: "const", color: "#569cd6" },
			{ text: " count", color: "#9cdcfe" },
			{ text: " = ", color: "#d4d4d4" },
			{ text: "signal", color: "#dcdcaa" },
			{ text: "(", color: "#d4d4d4" },
			{ text: "0", color: "#b5cea8" },
			{ text: ");", color: "#d4d4d4" },
		]},
		{ tokens: [
			{ text: "const", color: "#569cd6" },
			{ text: " doubled", color: "#9cdcfe" },
			{ text: " = ", color: "#d4d4d4" },
			{ text: "computed", color: "#dcdcaa" },
			{ text: "(() => ", color: "#d4d4d4" },
			{ text: "count", color: "#dcdcaa" },
			{ text: "() * ", color: "#d4d4d4" },
			{ text: "2", color: "#b5cea8" },
			{ text: ");", color: "#d4d4d4" },
		]},
		{ tokens: [{ text: "" }] },
		{ tokens: [
			{ text: "count", color: "#9cdcfe" },
			{ text: ".", color: "#d4d4d4" },
			{ text: "set", color: "#dcdcaa" },
			{ text: "(", color: "#d4d4d4" },
			{ text: "5", color: "#b5cea8" },
			{ text: "); ", color: "#d4d4d4" },
			{ text: "// doubled() is now 10", color: "#6a9955" },
		]},
	]);
}
