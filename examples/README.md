# Examples

This folder contains browser demos for `asyncapi-try-it-plugin`.

On the **`standalone-compat`** branch both demos use the [official standalone](https://www.npmjs.com/package/@asyncapi/react-component) (`browser/standalone/index.js`) and `AsyncApiStandalone.render()`, so you can test the plugin with a single-script setup.

## Files

- `demo.dev.html` — local demo: standalone script from unpkg + plugin from this repo (`../dist/index.iife.js`).
- `demo.prod.html` — CDN demo: standalone + published plugin from jsDelivr.

## Quick start

From the plugin root:

```bash
npm run build:iife
npx serve .
```

Then open:

- http://localhost:3000/examples/demo.dev.html
- http://localhost:3000/examples/demo.prod.html

## Notes

- A static server is required (opening files via `file://` is not reliable for script loading). Run `npx serve .` from the **plugin root** so that `../dist/index.iife.js` resolves.
- Demos send POST requests to `https://httpbin.org/post` to avoid `405 Method Not Allowed` from local static servers.
- On `standalone-compat`: demos use `@asyncapi/react-component` standalone and `AsyncApiStandalone.render()`; the plugin is built without hooks (class component) for compatibility with the bundled React in the standalone.
