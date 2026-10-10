# Sandbox

A consumer project for trying the interop CLI by hand. It depends on the `interop` package
one directory up through a `file:` link, so the CLI and the stylesheets come from source.

```sh
npm install
npx interop add button visually-hidden --theme
npm run dev
```

`add` writes `src/styles.css`, the styles entry, with the package's imports. `--theme` writes
`src/interop/button/theme.css` and imports it. Uncomment a token there and the page updates.

The CLI also writes `interop.project.json` on its first run. All of these are ignored; delete
them to start over. `src/app.css` holds the sandbox's own rules.
