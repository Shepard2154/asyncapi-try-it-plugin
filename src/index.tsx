import React, { useMemo, useState } from 'react';

type UnknownObject = Record<string, unknown>;

interface OperationSlotSchema {
  operation?: unknown;
  channelName?: string;
  type?: string;
}

interface ComponentSlotProps {
  context: {
    schema?: unknown;
  };
  onClose?: () => void;
}

export interface TryItOutPluginOptions {
  endpointBase?: string;
  showRealBrokerToggle?: boolean;
  buttonLabel?: string;
  resolveEndpoint?: (ctx: {
    operationId: string;
    operationAction: string;
    channelName: string;
    type: string;
    endpointBase: string;
  }) => string;
}

interface TryItOutProps extends ComponentSlotProps {
  options: Required<Omit<TryItOutPluginOptions, 'resolveEndpoint'>> &
    Pick<TryItOutPluginOptions, 'resolveEndpoint'>;
}

function asObject(value: unknown): UnknownObject | undefined {
  return typeof value === 'object' && value !== null
    ? (value as UnknownObject)
    : undefined;
}

function normalizeSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map((item) => normalizeSchema(item));

  const source = schema as UnknownObject;
  const clean: UnknownObject = {};
  const blocked = new Set([
    'x-parser-schema-id',
    'anySchema',
    'cannotBeDefined',
    'maximum',
    'minimum',
    'oneOf',
    'readOnly',
    'writeOnly',
    'description',
  ]);

  for (const [key, value] of Object.entries(source)) {
    if (blocked.has(key)) continue;
    clean[key] = normalizeSchema(value);
  }

  return clean;
}

function sanitizeSchema(schema: unknown): unknown {
  if (schema === true) return {};
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map((item) => sanitizeSchema(item));

  const source = schema as UnknownObject;
  const clean: UnknownObject = {};

  for (const [key, value] of Object.entries(source)) {
    if (
      ['additionalProperties', 'dependencies', 'patternProperties', 'definitions'].includes(
        key,
      ) &&
      value === true
    ) {
      clean[key] = {};
      continue;
    }
    clean[key] = sanitizeSchema(value);
  }

  return clean;
}

function resolvePayloadSchema(operation: unknown): unknown {
  const op = asObject(operation);
  if (!op) return undefined;

  const messagesResult = typeof op.messages === 'function' ? op.messages() : undefined;
  const messages = asObject(messagesResult);
  const all = messages && typeof messages.all === 'function' ? messages.all() : undefined;
  if (Array.isArray(all) && all.length > 0) {
    const firstMessage = asObject(all[0]);
    const payload =
      firstMessage && typeof firstMessage.payload === 'function'
        ? firstMessage.payload()
        : undefined;
    const payloadObj = asObject(payload);
    if (payloadObj && typeof payloadObj.json === 'function') {
      return payloadObj.json();
    }
  }

  const opJson = typeof op.json === 'function' ? asObject(op.json()) : undefined;
  return asObject(opJson?.message)?.payload;
}

function getOperationId(operation: unknown): string {
  const op = asObject(operation);
  if (!op) return 'operation';

  const meta = typeof op.meta === 'function' ? asObject(op.meta()) : undefined;
  const metaId = typeof meta?.id === 'string' ? meta.id : undefined;
  if (metaId && metaId.length > 0) return metaId;

  const id = typeof op.id === 'function' ? op.id() : undefined;
  if (typeof id === 'string' && id.length > 0) return id;

  return 'operation';
}

function getOperationAction(operation: unknown, fallbackType: string): string {
  const op = asObject(operation);
  if (!op) return fallbackType;

  const meta = typeof op.meta === 'function' ? asObject(op.meta()) : undefined;
  const action = typeof meta?.action === 'string' ? meta.action : undefined;
  if (action && action.length > 0) return action;

  return fallbackType;
}

function TryItOutOperation(props: TryItOutProps) {
  const slot = asObject(props.context?.schema) as OperationSlotSchema | undefined;
  const operation = slot?.operation;
  const channelName = slot?.channelName ?? 'unknown';
  const type = slot?.type ?? 'send';

  const operationId = useMemo(() => getOperationId(operation), [operation]);
  const operationAction = useMemo(
    () => getOperationAction(operation, type),
    [operation, type],
  );

  const endpoint = useMemo(() => {
    if (props.options.resolveEndpoint) {
      return props.options.resolveEndpoint({
        operationId,
        operationAction,
        channelName,
        type,
        endpointBase: props.options.endpointBase,
      });
    }
    return `/${props.options.endpointBase}/${operationId}/${operationAction}`;
  }, [
    props.options,
    operationId,
    operationAction,
    channelName,
    type,
  ]);

  const payloadSchema = useMemo(
    () => sanitizeSchema(normalizeSchema(resolvePayloadSchema(operation))),
    [operation],
  );

  const [opened, setOpened] = useState(false);
  const [raw, setRaw] = useState('{}');
  const [url, setUrl] = useState(endpoint);
  const [sendToRealBroker, setSendToRealBroker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<unknown>(null);

  const submit = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const message = JSON.parse(raw);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          message,
          options: {
            sendToRealBroker,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body?.message === 'string'
            ? body.message
            : `Request failed with status ${res.status}`,
        );
      }
      setResponse(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        className="border border-solid border-blue-300 hover:bg-blue-300 hover:text-blue-600 text-blue-500 font-bold no-underline text-xs uppercase rounded px-3 py-1"
        onClick={() => setOpened((prev) => !prev)}
      >
        {props.options.buttonLabel}
      </button>

      {opened && (
        <div className="mt-3 border rounded p-3 bg-gray-100">
          <div className="text-xs text-gray-600 mb-2">Endpoint</div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />

          <div className="text-xs text-gray-600 mt-3 mb-2">Message JSON</div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm font-mono"
            rows={10}
          />

          {props.options.showRealBrokerToggle && (
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sendToRealBroker}
                onChange={(e) => setSendToRealBroker(e.target.checked)}
              />
              Send to real broker
            </label>
          )}

          <div className="mt-3">
            <button
              type="button"
              className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-60"
              disabled={loading}
              onClick={submit}
            >
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{String(error)}</div>}
          {response !== null && (
            <pre className="mt-3 text-xs bg-white border rounded p-2 overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
          {payloadSchema !== undefined && payloadSchema !== null && (
            <details className="mt-3">
              <summary className="text-xs text-gray-600 cursor-pointer">
                Payload schema
              </summary>
              <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-auto">
                {JSON.stringify(payloadSchema, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function createTryItOutPlugin(
  options: TryItOutPluginOptions = {},
): any {
  const normalized: Required<Omit<TryItOutPluginOptions, 'resolveEndpoint'>> &
    Pick<TryItOutPluginOptions, 'resolveEndpoint'> = {
    endpointBase: options.endpointBase ?? 'asyncapi/try',
    showRealBrokerToggle: options.showRealBrokerToggle ?? true,
    buttonLabel: options.buttonLabel ?? 'Try it out',
    resolveEndpoint: options.resolveEndpoint,
  };

  return {
    name: 'asyncapi-try-it-plugin',
    version: '0.1.0',
    install(api: any) {
      api.registerComponent('operation', (props: ComponentSlotProps) => (
        <TryItOutOperation {...props} options={normalized} />
      ));
    },
  };
}

export default createTryItOutPlugin;
