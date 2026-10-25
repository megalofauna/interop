/** The markup the theme switcher page shows, written to be copied. */
export const examples = {
	html: `<fieldset interop-radio-group="segmented" itx-size="sm" interopColorScheme>
	<legend itx-visually-hidden>Theme</legend>
	<label><input type="radio" name="theme" value="light" /> Light</label>
	<label><input type="radio" name="theme" value="dark" /> Dark</label>
	<label><input type="radio" name="theme" value="system" /> System</label>
</fieldset>
`,
	head: `<meta name="color-scheme" content="light dark" />
<!-- The remembered theme, before the first paint. -->
<script>
	try {
		var s = localStorage.getItem("itx-color-scheme");
		if (s === "light" || s === "dark")
			document.documentElement.setAttribute("itx-color-scheme", s);
	} catch (e) {}
</script>
`,
	css: `/* In interop.css, styles/color.css: every page follows the system until a scheme is chosen. */
:where(:root) {
	color-scheme: light dark;
}

:where(:root[itx-color-scheme="light"]) {
	color-scheme: light;
}

:where(:root[itx-color-scheme="dark"]) {
	color-scheme: dark;
}
`,
	ts: `import { bindColorScheme } from "interop";

// Without Angular. Returns a function that removes the behavior.
bindColorScheme(document.querySelector("fieldset"));
`,
	toggle: `<!-- Only if two states are required. It loses "System": one press stops following the OS. -->
<button interop-button type="button" aria-pressed="false">Dark theme</button>
`,
};
