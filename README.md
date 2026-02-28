# asyncapi-try-it-plugin

[![npm](https://img.shields.io/npm/v/asyncapi-try-it-plugin.svg)](https://www.npmjs.com/package/asyncapi-try-it-plugin)

Plugin for `@asyncapi/react-component` that adds a `Try it out` action for operation blocks.

## Branch `standalone-compat`

The **`standalone-compat`** branch is a separate line of development for compatibility with the [official standalone build](https://www.npmjs.com/package/@asyncapi/react-component) (single script from CDN). On this branch the plugin UI is implemented as a **class component** (no React hooks), so it can be used together with `AsyncApiStandalone.render()` without "Invalid hook call" errors. The default branch may use hooks and targets the browser bundle (`browser/index.js`) with a shared React instance.

## Install

```bash
npm i asyncapi-try-it-plugin
```

## Usage

```tsx
import AsyncApiComponent from '@asyncapi/react-component';
import { createTryItOutPlugin } from 'asyncapi-try-it-plugin';

const tryItOutPlugin = createTryItOutPlugin({
  endpointBase: 'asyncapi/try',
});

<AsyncApiComponent schema={schema} plugins={[tryItOutPlugin]} />;
```

## API

```ts
createTryItOutPlugin({
  endpointBase?: string;
  showEndpointInput?: boolean;
  showPayloadSchema?: boolean;
  showRealBrokerToggle?: boolean;
  buttonLabel?: string;
  additionalFields?: Array<{
    key: string;
    type: 'string' | 'number' | 'integer' | 'boolean';
    label?: string;
    defaultValue?: unknown;
  }>;
  resolveEndpoint?: (ctx: {
    operationId: string;
    operationAction: string;
    channelName: string;
    type: string;
    endpointBase: string;
  }) => string;
});
```

Defaults:

- `endpointBase: 'asyncapi/try'`
- `showEndpointInput: false`
- `showPayloadSchema: false`
- `showRealBrokerToggle: true`
- `buttonLabel: 'Try it out'`
- `additionalFields: []`

Default endpoint:

`/${endpointBase}`

## Behavior

- Two input modes are supported: `Form` and `Raw JSON`.
- `operation_id` and `operation_type` are always added to outgoing payload automatically.
- In `Form` mode these metadata fields are hidden from the form.
- In `Raw JSON` mode these metadata fields are prefilled and kept in sync.
- For array payload schemas, the `Form` mode renders an add/remove item editor.

POST body:

```json
{
  "channelName": "string",
  "message": {
    "operation_id": "string",
    "operation_type": "string",
    "message": "<payload>"
  },
  "options": {
    "sendToRealBroker": false,
    "timestamp": "ISO string"
  }
}
```

`message.message` matches the AsyncAPI payload schema type:

| Schema type | `message.message` value |
|-------------|-------------------------|
| `object`    | `{ "field": "value", ... }` |
| `string`    | `"hello"` |
| `integer` / `number` | `42` |
| `boolean`   | `true` |
| `array`     | `["a", "b"]` |
| `null`      | `null` |
