/*
 * Layer 2 in action — replace each markdown code fence (<pre><code>) with a real
 * itx-code-block *instance*.
 *
 * This is the line Layer 1 can't cross. A code block isn't styling — it's
 * behaviour: shiki highlighting, a copy button, an optional wrap toggle. None
 * of that can be faked with a class skeleton, so here we actually instantiate
 * the Angular component.
 *
 * Mechanics:
 *   - `code` goes in as an INPUT — the legitimate content-as-input case, because
 *     source is atomic string data, not nested prose.
 *   - `language` is read from marked's `language-*` class on the <code>.
 *   - The host is a real <itx-code-block> element so the component CSS applies;
 *     `hostElement` reuses it instead of creating a detached anchor.
 *   - `injector` carries the shiki highlighter (scoped, see ContentPage), and
 *     `appRef.attachView` puts each instance under change detection.
 *
 * The returned refs MUST be destroyed by the caller on re-render / teardown,
 * or instances leak across navigations.
 */
import {
	ApplicationRef,
	ComponentRef,
	EnvironmentInjector,
	createComponent,
} from "@angular/core";
import { CodeBlock } from "interop";

export function hydrateCodeBlocks(
	root: HTMLElement,
	injector: EnvironmentInjector,
	appRef: ApplicationRef,
): ComponentRef<CodeBlock>[] {
	const refs: ComponentRef<CodeBlock>[] = [];

	for (const pre of Array.from(root.querySelectorAll("pre"))) {
		const codeEl = pre.querySelector("code");
		if (!codeEl) continue;

		const code = codeEl.textContent ?? "";
		const language = /language-(\S+)/.exec(codeEl.className)?.[1] ?? null;

		const host = document.createElement("itx-code-block");
		pre.replaceWith(host);

		const ref = createComponent(CodeBlock, {
			environmentInjector: injector,
			hostElement: host,
		});
		if (language) ref.setInput("language", language);
		ref.setInput("code", code);
		appRef.attachView(ref.hostView);
		refs.push(ref);
	}

	return refs;
}
