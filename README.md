# asyncapi-try-it-plugin

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
  showRealBrokerToggle?: boolean;
  buttonLabel?: string;
  resolveEndpoint?: (ctx) => string;
});
```

Default endpoint is:

`/${endpointBase}/${operationId}/${operationAction}`

POST body:

```json
{
  "channelName": "string",
  "message": {},
  "options": {
    "sendToRealBroker": false,
    "timestamp": "ISO string"
  }
}
```
