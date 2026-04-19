import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { InteropCodeRenderer, type HighlightedCode } from "./interop-code-renderer";

@Component({
	standalone: true,
	imports: [InteropCodeRenderer],
	template: `
		<figure
			interop-code-renderer
			[language]="language"
			[filename]="filename"
			[lineNumbers]="lineNumbers"
			[wrap]="wrap"
			[tokens]="tokens"
		>
			<pre><code>const x = 1;</code></pre>
		</figure>
	`,
})
class TestHost {
	language: string | null = null;
	filename: string | null = null;
	lineNumbers = false;
	wrap = false;
	tokens: HighlightedCode | null = null;
}

const sampleTokens: HighlightedCode = [
	{ tokens: [{ text: "const ", color: "#569cd6" }, { text: "x", color: "#9cdcfe" }, { text: " = 1;", color: "#d4d4d4" }] },
	{ tokens: [{ text: "const ", color: "#569cd6" }, { text: "y", color: "#9cdcfe" }, { text: " = 2;", color: "#d4d4d4" }] },
];

describe("InteropCodeRenderer", () => {
	let host: TestHost;
	let fixture: ComponentFixture<TestHost>;
	let figureEl: HTMLElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestHost],
		}).compileComponents();

		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		fixture.detectChanges();
		figureEl = fixture.debugElement.query(By.directive(InteropCodeRenderer)).nativeElement;
	});

	// ── Structure ────────────────────────────────────────────────────────────────

	it("should create on a figure element", () => {
		expect(figureEl.tagName).toBe("FIGURE");
	});

	it("renders the code body", () => {
		expect(figureEl.querySelector(".itx-cr__body")).not.toBeNull();
	});

	// ── Caption ──────────────────────────────────────────────────────────────────

	it("shows no figcaption when neither filename nor language is set", () => {
		expect(figureEl.querySelector("figcaption")).toBeNull();
	});

	it("shows figcaption with filename when set", () => {
		host.filename = "app.ts";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("app.ts");
	});

	it("shows canonicalized language when no filename", () => {
		host.language = "typescript";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("TypeScript");
	});

	it("filename takes precedence over language", () => {
		host.filename = "main.ts";
		host.language = "typescript";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("main.ts");
	});

	// ── Language canonicalization ────────────────────────────────────────────────

	it("canonicalizes 'ts' → 'TypeScript'", () => {
		host.language = "ts";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("TypeScript");
	});

	it("canonicalizes 'bash' → 'Shell'", () => {
		host.language = "bash";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("Shell");
	});

	it("passes unknown language through unchanged", () => {
		host.language = "brainfuck";
		fixture.detectChanges();
		expect(figureEl.querySelector("figcaption")?.textContent?.trim()).toBe("brainfuck");
	});

	// ── Content rendering ────────────────────────────────────────────────────────

	it("projects ng-content when tokens is null", () => {
		const code = figureEl.querySelector("pre code");
		expect(code?.textContent).toBe("const x = 1;");
	});

	it("renders token lines when tokens are provided", () => {
		host.tokens = sampleTokens;
		fixture.detectChanges();
		expect(figureEl.querySelectorAll(".itx-cr__line").length).toBe(2);
	});

	it("renders correct token spans per line", () => {
		host.tokens = sampleTokens;
		fixture.detectChanges();
		const firstLineTokens = figureEl.querySelectorAll(".itx-cr__line:first-child .itx-cr__token");
		expect(firstLineTokens.length).toBe(sampleTokens[0].tokens.length);
	});

	// ── Line numbers ─────────────────────────────────────────────────────────────

	it("omits line numbers by default", () => {
		host.tokens = sampleTokens;
		fixture.detectChanges();
		expect(figureEl.querySelectorAll(".itx-cr__line-number").length).toBe(0);
	});

	it("renders line numbers when lineNumbers=true", () => {
		host.tokens = sampleTokens;
		host.lineNumbers = true;
		fixture.detectChanges();
		expect(figureEl.querySelectorAll(".itx-cr__line-number").length).toBe(2);
	});

	it("line numbers are aria-hidden", () => {
		host.tokens = sampleTokens;
		host.lineNumbers = true;
		fixture.detectChanges();
		figureEl.querySelectorAll(".itx-cr__line-number").forEach((el) => {
			expect(el.getAttribute("aria-hidden")).toBe("true");
		});
	});

	// ── Word wrap ────────────────────────────────────────────────────────────────

	it("sets --itx-cr-white-space to 'pre' by default", () => {
		expect(figureEl.style.getPropertyValue("--itx-cr-white-space")).toBe("pre");
	});

	it("sets --itx-cr-white-space to 'pre-wrap' when wrap=true", () => {
		host.wrap = true;
		fixture.detectChanges();
		expect(figureEl.style.getPropertyValue("--itx-cr-white-space")).toBe("pre-wrap");
	});
});
