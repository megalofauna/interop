# Interop

**Interop is a platform-first UI system for the web.**
Write the HTML; Interop styles it and adds the behavior the platform lacks. Use it on any page, with any framework, or none.

```html
<button interop-button type="button" commandfor="rename" command="show-modal">
	Rename…
</button>
<dialog id="rename" interop-dialog aria-labelledby="rename-title">
	<h2 id="rename-title">Rename file</h2>
	<form method="dialog">
		<label for="file-name">Name</label> <input id="file-name" autofocus />
		<button interop-button type="submit" value="save">Save</button>
	</form>
</dialog>
```

The browser opens the dialog, keeps focus in it, closes it on Escape and returns focus to the button. Interop adds the look. No script runs.

## What it is made of

- **Markup.** Native elements with `interop-*` attributes for what a thing is and `itx-*` attributes for how it is configured (`itx-size`, `itx-color`).
- **CSS.** One stylesheet, `interop.css`, with every value in an `--itx-*` custom property.
- **Behavior.** Framework-free functions from `interop`, such as `bindTabs()` and `toast()`, for what the platform does not do yet.

Angular directives in `interop/<name>` call those functions for Angular apps.

## Setup

```css
@import "interop/interop.css";
```

```ts
import { watchInteropInDevMode } from "interop";

// The accessibility audit: warnings in the console while developing, removed from production builds.
watchInteropInDevMode();
```

Outside Angular, call `watchInterop()` in development instead.

## Working in this repo

| Command                | Does                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `npm run demo`         | Serves the demo at port 1337                                   |
| `npx ng build interop` | Builds the package into `dist/interop`                         |
| `npm test`             | Runs the package's unit tests                                  |
| `npm run test:pages`   | Checks every demo page: axe, reflow, focus ring, forced colors |
| `npm run lint`         | Formatting, CSS and token checks                               |

The package is `projects/interop`, one folder per component. The demo is `projects/demo`. `projects/interop_deprecated` and `projects/demo_deprecated` hold the previous library.
