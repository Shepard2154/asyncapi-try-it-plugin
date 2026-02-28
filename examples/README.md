# Examples

This folder contains browser demos for `asyncapi-try-it-plugin`.

## Files

- `demo.dev.html` — local demo using plugin bundle from this repository (`../dist/index.iife.js`).
- `demo.prod.html` — CDN demo using published plugin version from jsDelivr.

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

- A static server is required (opening files via `file://` is not reliable for script loading).
- Demos send POST requests to `https://httpbin.org/post` to avoid `405 Method Not Allowed` from local static servers.
- Demos use `@asyncapi/react-component/browser/index.js` and render via `ReactDOM.createRoot(...)` to keep host and plugin on the same React runtime.
