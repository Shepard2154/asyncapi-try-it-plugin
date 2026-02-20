# asyncapi-try-it-plugin

[![npm](https://img.shields.io/npm/v/asyncapi-try-it-plugin.svg)](https://www.npmjs.com/package/asyncapi-try-it-plugin)

Plugin for `@asyncapi/react-component` that adds a `Try it out` action for operation blocks.

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

Default endpoint:

`/${endpointBase}`

## Behavior

- Two input modes are supported: `Form` and `Raw JSON`.
- `operation_id` and `operation_type` are always added to outgoing payload automatically.
- In `Form` mode these metadata fields are hidden from the form.
- In `Raw JSON` mode these metadata fields are prefilled and kept in sync.

POST body:

```json
{
  "channelName": "string",
  "message": {
    "operation_id": "string",
    "operation_type": "string",
    "message": {}
  },
  "options": {
    "sendToRealBroker": false,
    "timestamp": "ISO string"
  }
}
```
