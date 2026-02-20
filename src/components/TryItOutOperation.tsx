import { useEffect, useMemo, useState } from 'react';
import { OperationSlotSchema, TryItOutProps, UnknownObject } from '../types';
import { asObject } from '../utils/object';
import {
  castInputValue,
  ensureRawMetadata,
  stringifyRaw,
} from '../utils/payload';
import { getOperationAction, getOperationId } from '../utils/operation';
import {
  extractSchemaProperties,
  normalizeSchema,
  resolvePayloadSchema,
  sanitizeSchema,
} from '../utils/schema';
import { ModeTabs } from './ui/ModeTabs';
import { PayloadFormFields } from './ui/PayloadFormFields';
import { BrokerToggle } from './ui/BrokerToggle';
import { ActionButtons } from './ui/ActionButtons';
import { PayloadSchemaPreview } from './ui/PayloadSchemaPreview';
import { EndpointInput } from './ui/EndpointInput';
import { RawJsonEditor } from './ui/RawJsonEditor';

export function TryItOutOperation(props: TryItOutProps) {
  const slot = asObject(props.context?.schema) as
    | OperationSlotSchema
    | undefined;
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
  }, [props.options, operationId, operationAction, channelName, type]);

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
    setRaw((prev) => ensureRawMetadata(prev, metadata));
  }, [metadata, mode]);

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
            <EndpointInput value={url} onChange={setUrl} />
          )}

          <ModeTabs mode={mode} onChange={setMode} />

          {mode === 'form' && (
            <PayloadFormFields
              payloadProperties={payloadProperties}
              formData={formData}
              onFieldChange={onFormFieldChange}
            />
          )}

          {mode === 'raw' && <RawJsonEditor value={raw} onChange={setRaw} />}

          {props.options.showRealBrokerToggle && (
            <BrokerToggle
              checked={sendToRealBroker}
              onChange={setSendToRealBroker}
            />
          )}

          <ActionButtons
            loading={loading}
            onCancel={() => setOpened(false)}
            onSubmit={submit}
          />

          {error && <div className="text-sm text-red-600">{String(error)}</div>}
          {response !== null && (
            <pre className="max-h-72 overflow-auto rounded border bg-white p-3 text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
          {props.options.showPayloadSchema &&
            payloadSchema !== undefined &&
            payloadSchema !== null && (
              <PayloadSchemaPreview payloadSchema={payloadSchema} />
            )}
        </div>
      )}
    </div>
  );
}
