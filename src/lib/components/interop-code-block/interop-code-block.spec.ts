import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { InteropActivation } from "../../services/interop-activation.service";
import {
  InteropCodeBlock,
  type HighlightedCode,
} from "./interop-code-block";
import { INTEROP_CODE_BLOCK_CONTEXT } from "./interop-code-block-context.token";

// ── Test host ──────────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  imports: [InteropCodeBlock],
  template: `
    <figure interop-code-block
      [language]="language"
      [filename]="filename"
      [lineNumbers]="lineNumbers"
      [wrap]="wrap"
      [wrapToggle]="wrapToggle"
      [tokens]="tokens"
      [syncKey]="syncKey"
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
  wrapToggle = false;
  tokens: HighlightedCode | null = null;
  syncKey: string | null = null;
}

// ── Sample token data ──────────────────────────────────────────────────────────

const sampleTokens: HighlightedCode = [
  { tokens: [{ text: "const ", color: "#569cd6" }, { text: "x", color: "#9cdcfe" }, { text: " = ", color: "#d4d4d4" }, { text: "1", color: "#b5cea8" }, { text: ";", color: "#d4d4d4" }] },
  { tokens: [{ text: "const ", color: "#569cd6" }, { text: "y", color: "#9cdcfe" }, { text: " = ", color: "#d4d4d4" }, { text: "2", color: "#b5cea8" }, { text: ";", color: "#d4d4d4" }] },
  { tokens: [{ text: "const ", color: "#569cd6" }, { text: "z", color: "#9cdcfe" }, { text: " = ", color: "#d4d4d4" }, { text: "3", color: "#b5cea8" }, { text: ";", color: "#d4d4d4" }] },
];

// ── Spec ───────────────────────────────────────────────────────────────────────

describe("InteropCodeBlock", () => {
  let host: TestHost;
  let fixture: ComponentFixture<TestHost>;
  let figureEl: HTMLElement;
  let activationSpy: jasmine.SpyObj<InteropActivation>;

  beforeEach(async () => {
    activationSpy = jasmine.createSpyObj("InteropActivation", [
      "register",
      "trigger",
      "has",
    ]);
    // register returns a fake registration with a no-op unregister
    activationSpy.register.and.returnValue({ unregister: () => {} } as any);

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: InteropActivation, useValue: activationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();

    figureEl = fixture.debugElement.query(By.directive(InteropCodeBlock)).nativeElement;
  });

  // ── Structure ────────────────────────────────────────────────────────────────

  it("should create", () => {
    expect(host).toBeTruthy();
  });

  it("should attach to figure[interop-code-block]", () => {
    expect(figureEl.tagName).toBe("FIGURE");
  });

  it("should render a figcaption header", () => {
    const caption = figureEl.querySelector("figcaption");
    expect(caption).not.toBeNull();
  });

  it("should render the code body wrapper", () => {
    const body = figureEl.querySelector(".itx-code-block__body");
    expect(body).not.toBeNull();
  });

  // ── Label ────────────────────────────────────────────────────────────────────

  it("shows filename in header when filename is set", () => {
    host.filename = "app.component.ts";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("app.component.ts");
  });

  it("shows language label when only language is set", () => {
    host.language = "typescript";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("TypeScript");
  });

  it("filename takes precedence over language label", () => {
    host.filename = "main.ts";
    host.language = "typescript";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("main.ts");
  });

  it("shows no label text when neither filename nor language is set", () => {
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("");
  });

  // ── Language canonicalization ────────────────────────────────────────────────

  it("canonicalizes 'ts' to 'TypeScript'", () => {
    host.language = "ts";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("TypeScript");
  });

  it("canonicalizes 'js' to 'JavaScript'", () => {
    host.language = "js";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("JavaScript");
  });

  it("canonicalizes 'bash' to 'Shell'", () => {
    host.language = "bash";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("Shell");
  });

  it("canonicalizes 'py' to 'Python'", () => {
    host.language = "py";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("Python");
  });

  it("passes unknown language through unchanged", () => {
    host.language = "brainfuck";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("brainfuck");
  });

  it("is case-insensitive for language canonicalization", () => {
    host.language = "TypeScript";
    fixture.detectChanges();
    const label = figureEl.querySelector<HTMLElement>(".itx-code-block__label");
    expect(label?.textContent?.trim()).toBe("TypeScript");
  });

  // ── Content rendering ────────────────────────────────────────────────────────

  it("projects ng-content when tokens is null", () => {
    // tokens is null by default; projected <pre><code> should be present
    const code = figureEl.querySelector("pre code");
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe("const x = 1;");
  });

  it("renders token lines when tokens input is provided", () => {
    host.tokens = sampleTokens;
    fixture.detectChanges();
    const lines = figureEl.querySelectorAll(".itx-code-block__line");
    expect(lines.length).toBe(3);
  });

  it("renders the correct number of tokens within each line", () => {
    host.tokens = sampleTokens;
    fixture.detectChanges();
    const firstLineTokens = figureEl.querySelectorAll(
      ".itx-code-block__line:first-child .itx-code-block__token",
    );
    expect(firstLineTokens.length).toBe(sampleTokens[0].tokens.length);
  });

  it("does not render ng-content when tokens are provided", () => {
    host.tokens = sampleTokens;
    fixture.detectChanges();
    // The projected pre>code comes from ng-content; it should not be present
    // when the tokens path is active (the @if renders the other branch)
    const projectedCode = figureEl.querySelector("pre > code:not(.itx-code-block__code)");
    expect(projectedCode).toBeNull();
  });

  // ── Line numbers ─────────────────────────────────────────────────────────────

  it("does not render line numbers by default", () => {
    host.tokens = sampleTokens;
    fixture.detectChanges();
    const lineNumbers = figureEl.querySelectorAll(".itx-code-block__line-number");
    expect(lineNumbers.length).toBe(0);
  });

  it("renders line numbers when lineNumbers=true and tokens provided", () => {
    host.tokens = sampleTokens;
    host.lineNumbers = true;
    fixture.detectChanges();
    const lineNumbers = figureEl.querySelectorAll(".itx-code-block__line-number");
    expect(lineNumbers.length).toBe(3);
  });

  it("line numbers start at 1", () => {
    host.tokens = sampleTokens;
    host.lineNumbers = true;
    fixture.detectChanges();
    const firstNumber = figureEl.querySelector<HTMLElement>(".itx-code-block__line-number");
    expect(firstNumber?.textContent?.trim()).toBe("1");
  });

  it("line number spans are aria-hidden", () => {
    host.tokens = sampleTokens;
    host.lineNumbers = true;
    fixture.detectChanges();
    const lineNumbers = figureEl.querySelectorAll(".itx-code-block__line-number");
    lineNumbers.forEach((el) => {
      expect(el.getAttribute("aria-hidden")).toBe("true");
    });
  });

  // ── Copy button ───────────────────────────────────────────────────────────────

  it("renders the copy button", () => {
    const copyBtn = figureEl.querySelector(".itx-code-block__copy-btn");
    expect(copyBtn).not.toBeNull();
  });

  it("copy button has initial aria-label 'Copy code'", () => {
    const copyBtn = figureEl.querySelector<HTMLElement>(".itx-code-block__copy-btn");
    expect(copyBtn?.getAttribute("aria-label")).toBe("Copy code");
  });

  it("copy button calls navigator.clipboard.writeText with projected code text", fakeAsync(async () => {
    const clipboardSpy = spyOn(navigator.clipboard, "writeText").and.returnValue(
      Promise.resolve(),
    );
    const copyBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__copy-btn");
    copyBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(clipboardSpy).toHaveBeenCalledWith("const x = 1;");
  }));

  it("copy button calls navigator.clipboard.writeText with token text when tokens provided", fakeAsync(async () => {
    host.tokens = sampleTokens;
    fixture.detectChanges();
    const clipboardSpy = spyOn(navigator.clipboard, "writeText").and.returnValue(
      Promise.resolve(),
    );
    const copyBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__copy-btn");
    copyBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(clipboardSpy).toHaveBeenCalledWith("const x = 1;\nconst y = 2;\nconst z = 3;");
  }));

  it("copy button aria-label changes to 'Copied to clipboard' after successful copy", fakeAsync(async () => {
    spyOn(navigator.clipboard, "writeText").and.returnValue(Promise.resolve());
    const copyBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__copy-btn");
    copyBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(copyBtn?.getAttribute("aria-label")).toBe("Copied to clipboard");
  }));

  it("aria-live region announces after copy", fakeAsync(async () => {
    spyOn(navigator.clipboard, "writeText").and.returnValue(Promise.resolve());
    const copyBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__copy-btn");
    copyBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const liveRegion = figureEl.querySelector<HTMLElement>(".itx-code-block__sr-announce");
    expect(liveRegion?.textContent?.trim()).toBe("Copied to clipboard");
  }));

  it("copy state resets to idle after 2000ms", fakeAsync(async () => {
    spyOn(navigator.clipboard, "writeText").and.returnValue(Promise.resolve());
    const copyBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__copy-btn");
    copyBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Verify copied state
    expect(copyBtn?.getAttribute("aria-label")).toBe("Copied to clipboard");

    // Advance past the 2000ms reset timer
    tick(2001);
    fixture.detectChanges();
    expect(copyBtn?.getAttribute("aria-label")).toBe("Copy code");

    const liveRegion = figureEl.querySelector<HTMLElement>(".itx-code-block__sr-announce");
    expect(liveRegion?.textContent?.trim()).toBe("");
  }));

  it("aria-live region is present in DOM from the start (required for reliable announcement)", () => {
    const liveRegion = figureEl.querySelector(".itx-code-block__sr-announce");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.getAttribute("aria-atomic")).toBe("true");
  });

  // ── Word wrap toggle ──────────────────────────────────────────────────────────

  it("does not render wrap toggle when wrapToggle=false (default)", () => {
    const wrapBtn = figureEl.querySelector(".itx-code-block__wrap-btn");
    expect(wrapBtn).toBeNull();
  });

  it("renders wrap toggle when wrapToggle=true", () => {
    host.wrapToggle = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector(".itx-code-block__wrap-btn");
    expect(wrapBtn).not.toBeNull();
  });

  it("wrap toggle has aria-pressed='false' initially", () => {
    host.wrapToggle = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector<HTMLElement>(".itx-code-block__wrap-btn");
    expect(wrapBtn?.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking wrap toggle sets aria-pressed to 'true'", () => {
    host.wrapToggle = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__wrap-btn");
    wrapBtn?.click();
    fixture.detectChanges();
    expect(wrapBtn?.getAttribute("aria-pressed")).toBe("true");
  });

  it("clicking wrap toggle again resets aria-pressed to 'false'", () => {
    host.wrapToggle = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector<HTMLButtonElement>(".itx-code-block__wrap-btn");
    wrapBtn?.click();
    fixture.detectChanges();
    wrapBtn?.click();
    fixture.detectChanges();
    expect(wrapBtn?.getAttribute("aria-pressed")).toBe("false");
  });

  it("wrap toggle aria-label is 'Enable word wrap' when not wrapped", () => {
    host.wrapToggle = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector<HTMLElement>(".itx-code-block__wrap-btn");
    expect(wrapBtn?.getAttribute("aria-label")).toBe("Enable word wrap");
  });

  it("wrap toggle aria-label is 'Disable word wrap' when wrapped", () => {
    host.wrapToggle = true;
    host.wrap = true;
    fixture.detectChanges();
    const wrapBtn = figureEl.querySelector<HTMLElement>(".itx-code-block__wrap-btn");
    expect(wrapBtn?.getAttribute("aria-label")).toBe("Disable word wrap");
  });

  // ── White-space host binding ──────────────────────────────────────────────────

  it("host --itx-code-block-white-space is 'pre' when not wrapped", () => {
    const style = figureEl.style.getPropertyValue("--itx-code-block-white-space");
    expect(style).toBe("pre");
  });

  it("host --itx-code-block-white-space is 'pre-wrap' when wrap=true", () => {
    host.wrap = true;
    fixture.detectChanges();
    const style = figureEl.style.getPropertyValue("--itx-code-block-white-space");
    expect(style).toBe("pre-wrap");
  });

  // ── DI context token ──────────────────────────────────────────────────────────

  it("provides INTEROP_CODE_BLOCK_CONTEXT token", () => {
    const codeBlockDe = fixture.debugElement.query(By.directive(InteropCodeBlock));
    const context = codeBlockDe.injector.get(INTEROP_CODE_BLOCK_CONTEXT, null);
    expect(context).not.toBeNull();
    expect(context?.uid).toMatch(/^itx-code-block-/);
  });

  // ── InteropActivation sync key ────────────────────────────────────────────────

  it("registers with InteropActivation when syncKey is provided", () => {
    host.syncKey = "lang-preference";
    fixture.detectChanges();
    expect(activationSpy.register).toHaveBeenCalledWith(
      "lang-preference",
      jasmine.any(Function),
    );
  });

  it("does not register with InteropActivation when syncKey is null", () => {
    // syncKey is null by default
    fixture.detectChanges();
    expect(activationSpy.register).not.toHaveBeenCalled();
  });

  // ── Actions toolbar ARIA ──────────────────────────────────────────────────────

  it("actions container has role='toolbar'", () => {
    const toolbar = figureEl.querySelector(".itx-code-block__actions");
    expect(toolbar?.getAttribute("role")).toBe("toolbar");
  });

  it("actions container has a descriptive aria-label", () => {
    const toolbar = figureEl.querySelector<HTMLElement>(".itx-code-block__actions");
    expect(toolbar?.getAttribute("aria-label")).toContain("code block actions");
  });

  it("actions aria-label includes the filename when set", () => {
    host.filename = "app.ts";
    fixture.detectChanges();
    const toolbar = figureEl.querySelector<HTMLElement>(".itx-code-block__actions");
    expect(toolbar?.getAttribute("aria-label")).toContain("app.ts");
  });
});
