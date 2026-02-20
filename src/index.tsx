import React, { useEffect, useMemo, useState } from 'react';

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

function extractSchemaProperties(schema: unknown): UnknownObject {
  const root = asObject(schema);
  const properties = asObject(root?.properties);
  return properties ?? {};
}

function stringifyRaw(value: UnknownObject): string {
  return JSON.stringify(value, null, 2);
}

function toInputValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

function castInputValue(value: string, schema: unknown): unknown {
  const s = asObject(schema);
  const type = s?.type;
  if (type === 'number' || type === 'integer') {
    if (value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (type === 'boolean') {
    return value === 'true';
  }
  return value;
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
    return `/${props.options.endpointBase}`;
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
  const payloadProperties = useMemo(
    () => extractSchemaProperties(payloadSchema),
    [payloadSchema],
  );
  const metadata = useMemo(
    () => ({
      operation_id: operationId,
      operation_type: operationAction,
    }),
    [operationId, operationAction],
  );

  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<'form' | 'raw'>('form');
  const [formData, setFormData] = useState<UnknownObject>({});
  const [raw, setRaw] = useState<string>(() => stringifyRaw(metadata));
  const [url, setUrl] = useState(endpoint);
  const [sendToRealBroker, setSendToRealBroker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<unknown>(null);

  useEffect(() => {
    setUrl(endpoint);
  }, [endpoint]);

  useEffect(() => {
    if (mode !== 'raw') return;
    setRaw((prev) => {
      let parsed: UnknownObject | undefined;
      try {
        parsed = asObject(JSON.parse(prev));
      } catch {
        parsed = undefined;
      }
      return stringifyRaw({
        ...(parsed ?? {}),
        operation_id: metadata.operation_id,
        operation_type: metadata.operation_type,
      });
    });
  }, [metadata.operation_id, metadata.operation_type, mode]);

  const submit = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      let userPayload: UnknownObject = {};
      if (mode === 'raw') {
        const parsed = JSON.parse(raw);
        const parsedObj = asObject(parsed);
        if (!parsedObj) {
          throw new Error('Raw payload must be a JSON object');
        }
        userPayload = parsedObj;
      } else {
        userPayload = formData;
      }

      const message: UnknownObject = {
        ...userPayload,
        operation_id: metadata.operation_id,
        operation_type: metadata.operation_type,
      };
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

  const onFormFieldChange = (field: string, value: string, schema: unknown) => {
    const nextValue = castInputValue(value, schema);
    const next = { ...formData };
    if (nextValue === undefined || nextValue === '') {
      delete next[field];
    } else {
      next[field] = nextValue;
    }
    setFormData(next);
    setRaw(
      stringifyRaw({
        ...next,
        operation_id: metadata.operation_id,
        operation_type: metadata.operation_type,
      }),
    );
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
        <div className="mt-4 rounded-lg border bg-gray-100 p-4 space-y-4">
          {props.options.showEndpointInput && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Endpoint</div>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm bg-white"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              style={{
                background: mode === 'raw' ? 'none' : '#f0f0f0',
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px',
                fontWeight: mode === 'raw' ? 'normal' : '600',
                color: mode === 'raw' ? '#666' : '#333',
                transition: 'all 0.2s',
                fontSize: '12px',
              }}
              onClick={() => setMode('form')}
            >
              Form
            </button>
            <button
              type="button"
              style={{
                background: mode === 'raw' ? '#f0f0f0' : 'none',
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                borderTopRightRadius: '6px',
                borderBottomRightRadius: '6px',
                fontWeight: mode === 'raw' ? '600' : 'normal',
                color: mode === 'raw' ? '#333' : '#666',
                transition: 'all 0.2s',
                fontSize: '12px',
              }}
              onClick={() => setMode('raw')}
            >
              Raw JSON
            </button>
          </div>

          {mode === 'form' && (
            <div className="space-y-3">
              {Object.entries(payloadProperties).map(([field, fieldSchema]) => {
                if (field === 'operation_id' || field === 'operation_type') {
                  return null;
                }
                const s = asObject(fieldSchema);
                const type = typeof s?.type === 'string' ? s.type : 'string';
                const value = formData[field];
                if (type === 'boolean') {
                  return (
                    <label
                      key={field}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(e) =>
                          onFormFieldChange(
                            field,
                            e.target.checked ? 'true' : 'false',
                            fieldSchema,
                          )
                        }
                      />
                      {field}
                    </label>
                  );
                }
                return (
                  <div key={field} className="space-y-1">
                    <div className="text-xs text-gray-600">{field}</div>
                    <input
                      value={toInputValue(value)}
                      onChange={(e) =>
                        onFormFieldChange(field, e.target.value, fieldSchema)
                      }
                      className="w-full rounded border px-3 py-2 text-sm bg-white"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'raw' && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Message JSON</div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm font-mono bg-white"
                rows={12}
              />
            </div>
          )}

          {props.options.showRealBrokerToggle && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sendToRealBroker}
                onChange={(e) => setSendToRealBroker(e.target.checked)}
              />
              Send to real broker
            </label>
          )}

          <div className="pt-1">
            <button
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              disabled={loading}
              onClick={submit}
            >
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>

          {error && <div className="text-sm text-red-600">{String(error)}</div>}
          {response !== null && (
            <pre className="max-h-72 overflow-auto rounded border bg-white p-3 text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
          {props.options.showPayloadSchema &&
            payloadSchema !== undefined &&
            payloadSchema !== null && (
              <details>
                <summary className="cursor-pointer text-xs text-gray-600">
                  Payload schema
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded border bg-white p-4 text-xs leading-relaxed">
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
    showEndpointInput: options.showEndpointInput ?? false,
    showPayloadSchema: options.showPayloadSchema ?? false,
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
