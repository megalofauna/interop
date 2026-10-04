# interop CLI

Specification. Nothing on this page is built yet.

`interop` sets up Interop components in a project. It makes new components, wires shipped
ones into the project's styles, and writes starter files for a component's theme and template.

```sh
npx interop                   # choose a command from a list
npx interop theme button      # or name it
```

## Usage

```
USAGE
    interop <command> [<component>...] [options]

COMMANDS
    init                   Create a project. `npm create interop` runs this.    planned
    new <name>             Create a new component: a blueprint and its config entry.
    add <component>...     Wire shipped components' stylesheets into the project.
    theme <component>      Create a component's theme file.
    template <component>   Create a custom template starter for a component.

OPTIONS
    --script <ts|js>              Script language. Default: the project setting.
    --styles <css|scss>           Style language. Default: the project setting.
    --framework <angular|html>    Template format. Default: the project setting.
    --out <path>                  Directory for written files. Default: the project setting.
    --dry-run                     List the files that would be written. Write nothing.
    --force                       Overwrite existing files.
    -y, --yes                     Take every default. Never prompt.
    -h, --help                    Show help for interop, or for one command.
    -v, --version                 Show the version.

EXIT STATUS
    0    Files written, or nothing to do.
    1    A target file exists and --force was not given, or a component name is unknown.
    2    Bad usage: an unknown option, or a prompt needed where there is no terminal.
```

With no command, `interop` lists the commands. With a command and no component, it lists the
components the command applies to.

## How it asks

Each command asks only for what it cannot find out. Every question has a flag, and a flag
skips its question.

| Situation | Behavior |
| --- | --- |
| Terminal attached | Asks for each missing answer, with the default selected. |
| `--yes` | Takes every default. Asks nothing. |
| No terminal (CI, a pipe) | Asks nothing. A missing answer with no default exits with status 2 and names the flag. |
| `NO_COLOR` set | Same prompts, no color. |

A session looks like this:

```
┌  interop theme
│
◇  Component
│  button
│
◆  Categories
│  ◼ layout  ◼ shape  ◼ border  ◼ outline  ◼ type  ◼ paint  ◼ cursor
│
◇  Wrote src/interop/button/theme.css
│
└  Uncomment a token to change it.
```

The prompts use [`@clack/prompts`](https://github.com/bombshell-dev/clack). The CLI is its own
package, so the generator keeps no dependencies.

## Naming a component

A component is named by its blueprint name: `button`, `visually-hidden`. The CLI reads the
names from `manifest.json` and checks every name against it. A misspelled name gets the
closest match as a suggestion.

The list a command offers is filtered to what it can act on. `theme` and `template` offer
themeable components only, so `visually-hidden` does not appear.

A written file records its component in its path: `src/interop/button/theme.css`.

## Project settings

`interop.project.json`, at the project root, holds the settings every command reads.
`interop.config.json` holds token values only.

```json
{
	"script": "ts",
	"styles": "css",
	"framework": "angular",
	"out": "src/interop",
	"stylesEntry": "src/styles.css"
}
```

| Setting | Values | Detected from |
| --- | --- | --- |
| `script` | `ts`, `js` | `ts` if `tsconfig.json` exists |
| `styles` | `css`, `scss` | `scss` if the project compiles `.scss` files |
| `framework` | `angular`, `html` | `angular` if `package.json` depends on `@angular/core` |
| `out` | a directory | `src/interop` |
| `stylesEntry` | a stylesheet | Angular: the first entry of `styles` in `angular.json`. Otherwise `src/styles.css` or `src/styles.scss` |

When the file is absent, the first command detects each setting, shows the results for
confirmation, and writes the file. `init` writes it when it creates a project. A flag
overrides a setting for one run and does not change the file.

## Files and who owns them

| File | Written by | Owner |
| --- | --- | --- |
| `structure.css`, `base.css`, `properties.css`, `manifest.json`, `docs.md` | the build | the build. Rewritten every run. |
| `<out>/<component>/theme.css` | `interop theme` | the consumer |
| `<out>/<component>/template.html` | `interop template` | the consumer |
| `<out>/<name>/<name>.blueprint.ts` | `interop new` | the consumer |
| `interop.project.json` | the first command, or `init` | the consumer |

The CLI never writes a generated file. It writes a starter file once. After that the file
belongs to the consumer, and the CLI does not overwrite it without `--force`.

Three commands edit a consumer file in place. `add` and `theme` insert import lines into
`stylesEntry`. `new` adds an entry to `interop.config.json`. None of them changes a line
already there.

---

## `interop new <name>`

Creates a component of your own on the Interop system: a blueprint and its config entry. The
build then generates its stylesheets, docs and manifest entry, the same as for a shipped
component.

```sh
npx interop new rating
```

### Asks

| Question | Flag | Default |
| --- | --- | --- |
| Name, kebab-case | the argument | none |
| Selector | `--selector` | `:where([interop-<name>])` |
| Themeable | `--no-themeable` | yes |
| Levers, by category | `--properties` | none |
| States | `--states` | none |
| Sizes | `--sizes` | none. Not sizable. |

Lever selection lists each category with its levers and one-line descriptions. The cursor
question appears only once a state is chosen, because a cursor requires states.

### Writes

| File | Contents |
| --- | --- |
| `<out>/<name>/<name>.blueprint.ts` (or `.js`) | The blueprint, with the answers filled in. |
| `interop.config.json` | A `<name>` entry. Every base token gets the value `initial`, and every size other than `base` gets an empty entry. |

`initial` means no value: the property takes its CSS initial value until you set one. The
build accepts it, so a new component builds as soon as it is created.

A JavaScript blueprint types itself with JSDoc:

```js
/** @type {import('<package>').Blueprint} */
export const rating = {
	name: 'rating',
	selector: ':where([interop-rating])',
	themeable: true,
	properties: {},
};
```

### Constraints

- The name is kebab-case and not already taken by a shipped component or a blueprint in the
  project.
- The blueprint passes the validator before it is written.

---

## `interop add <component>...`

Wires shipped components into the project. It inserts each component's stylesheet imports
into `stylesEntry`, in cascade order. It changes nothing in Interop's files.

```sh
npx interop add button
```

### Asks

| Question | Flag | Default |
| --- | --- | --- |
| Components, multiselect | the arguments | none |
| Then create a theme | `--theme` | no |
| Then create a template starter | `--template` | no |

### Writes

Into `stylesEntry`:

```css
@import '<package>/layers.css';
@import '<package>/button/properties.css';
@import '<package>/button/structure.css';
@import '<package>/button/base.css';
```

`layers.css` comes first and appears once, however many components are added. It declares
the layer order, so it has to load before any file that uses a layer. After it, the order of
the lines does not affect the cascade.

### Constraints

- Running `add` twice adds no line twice.
- A component that is not themeable gets `structure.css` only.

---

## `interop theme <component>`

Creates the component's theme file. It lists every token the component has, commented out,
with its current value. Uncomment a token to change it.

```sh
npx interop theme button
```

### Asks

| Question | Flag | Default |
| --- | --- | --- |
| Component | the argument | none |
| Categories, multiselect | `--categories` | all |
| Scopes, multiselect | `--scopes` | all |

### Writes

`<out>/<component>/theme.css` (or `.scss`):

```css
/*
 * button theme. Uncomment a token to change it.
 * Written by `interop theme button`. This file is yours.
 */

@layer interop.default.theme {
	/* default */
	:where(button[interop-button]) {
		/* paint */
		/* --itx-button-background-color: var(--itx-color-value); */
		/* --itx-button-background-color-hover: var(--itx-button-background-color); */
		/* --itx-button-background-color-focus-visible: var(--itx-button-background-color); */
		/* --itx-button-background-color-active: var(--itx-button-background-color); */
		/* --itx-button-background-color-disabled: var(--itx-button-background-color); */
		/* … */
	}
}

@layer interop.variant.theme {
	/* variant: danger */
	:where(button[interop-button])[itx-variant="danger"] {
		/* --itx-button-background-color: var(--itx-color-value); */
		/* … */
	}
}

@layer interop.size.theme {
	/* size: lg */
	:where(button[interop-button])[itx-size="lg"] {
		/* --itx-button-padding-block: var(--itx-size-value); */
		/* … */
	}
}
```

It also inserts `@import './interop/button/theme.css';` into `stylesEntry`, if the component
has been added and the line is not there.

### Scopes

The file repeats the scopes of `base.css`, each in its own layer. A token set in the default
scope reaches every element except those whose variant or size sets the same token. To change
a variant, set the token in that variant's scope.

| Scope | Lists |
| --- | --- |
| default | Every base token, each followed by its state tokens. |
| a variant or size | The tokens `base.css` sets in that scope, each followed by its state tokens. |

A state token is shown with its fallback, `var(<base token>)`. Uncommented unchanged, it
behaves the same as leaving it unset.

### Constraints

- Themeable components only.
- In SCSS, the commented lines use `//`. Nothing else differs.

---

## `interop template <component>`

Creates a markup starter for a custom template. It holds what the component needs to work and
nothing else. Hand-written templates work the same way. This command is a convenience.

```sh
npx interop template button
```

### What the starter carries

Each requirement comes from the blueprint:

| Requirement | Source | For button |
| --- | --- | --- |
| The host element | the element in `selector` | `<button>`. `:disabled` and `:focus-visible` depend on it. |
| The host attribute | the attribute in `selector` | `interop-button` |
| One attribute per element | each selector in `elements` | `interop-icon`, a direct child |

Everything else belongs to the consumer: content, other attributes, wrapping markup.

### Asks

| Question | Flag | Default |
| --- | --- | --- |
| Component | the argument | none |
| Format | `--framework` | the project setting |

### Writes

`<out>/<component>/template.html`.

Angular:

```html
<ng-template>
	<button interop-button>
		<!-- <svg interop-icon aria-hidden="true"></svg> -->
	</button>
</ng-template>
```

HTML:

```html
<button interop-button>
	<!-- <svg interop-icon aria-hidden="true"></svg> -->
</button>
```

An element the blueprint names is optional, so it is written commented out.

### Constraints

- Themeable components only.

---

## `interop init`

Planned. Creates a project with Interop installed, writes `interop.project.json`, and runs
`add` for the components chosen. `npm create interop` runs it.

---

## Open

| Question | Blocks |
| --- | --- |
| The package name, written as `<package>` above | `add` |
| How the build finds blueprints in a consumer project | `new` |
| `manifest.json` carries no host element, host attribute, or element selectors | `template` |
| The template context contract: what data a custom template receives | `template` |
| A browser view for `theme`, rendering the component as tokens change | none |
