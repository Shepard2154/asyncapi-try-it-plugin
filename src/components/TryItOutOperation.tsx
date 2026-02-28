import React from 'react';
import { OperationSlotSchema, TryItOutProps, UnknownObject } from '../types';
import { asObject } from '../utils/object';
import {
  castInputValue,
  ensureRawMetadata,
  stringifyRaw,
} from '../utils/payload';
import { getOperationAction, getOperationId } from '../utils/operation';
import {
  buildDefaultPayload,
  extractSchemaProperties,
  isArraySchema,
  normalizeSchema,
  resolvePayloadSchema,
  sanitizeSchema,
  isPrimitiveSchema,
  PRIMITIVE_PAYLOAD_FIELD,
} from '../utils/schema';
import { ModeTabs } from './ui/ModeTabs';
import { PayloadFormFields } from './ui/PayloadFormFields';
import { ArrayEditor } from './ui/ArrayEditor';
import { BrokerToggle } from './ui/BrokerToggle';
import { ActionButtons } from './ui/ActionButtons';
import { PayloadSchemaPreview } from './ui/PayloadSchemaPreview';
import { EndpointInput } from './ui/EndpointInput';
import { RawJsonEditor } from './ui/RawJsonEditor';

interface TryItOutState {
  opened: boolean;
  mode: 'form' | 'raw';
  formData: UnknownObject;
  arrayData: unknown[];
  raw: string;
  url: string;
  sendToRealBroker: boolean;
  loading: boolean;
  error: string;
  response: unknown;
}

export class TryItOutOperation extends React.Component<
  TryItOutProps,
  TryItOutState
> {
  constructor(props: TryItOutProps) {
    super(props);
    const slot = asObject(props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    const operation = slot?.operation;
    const operationId = getOperationId(operation);
    const operationAction = getOperationAction(operation, slot?.type ?? 'send');
    const metadata = {
      operation_id: operationId,
      operation_type: operationAction,
    };
    const payloadSchema = sanitizeSchema(
      normalizeSchema(resolvePayloadSchema(operation)),
    );
    const initialMessage = buildDefaultPayload(
      payloadSchema,
      props.options.additionalFields,
    );
    this.state = {
      opened: false,
      mode: 'form',
      formData: {},
      arrayData: [],
      raw: stringifyRaw({ ...metadata, message: initialMessage }),
      url: this.getEndpoint(props),
      sendToRealBroker: false,
      loading: false,
      error: '',
      response: null,
    };
  }

  private getOperationId(): string {
    const slot = asObject(this.props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    return getOperationId(slot?.operation);
  }

  private getOperationAction(): string {
    const slot = asObject(this.props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    return getOperationAction(slot?.operation, slot?.type ?? 'send');
  }

  private getMetadata(): { operation_id: string; operation_type: string } {
    return {
      operation_id: this.getOperationId(),
      operation_type: this.getOperationAction(),
    };
  }

  private getEndpoint(props: TryItOutProps = this.props): string {
    const slot = asObject(props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    const channelName = slot?.channelName ?? 'unknown';
    const type = slot?.type ?? 'send';
    const operationId = getOperationId(slot?.operation);
    const operationAction = getOperationAction(slot?.operation, type);
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
  }

  private getPayloadSchema(): unknown {
    const slot = asObject(this.props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    return sanitizeSchema(
      normalizeSchema(resolvePayloadSchema(slot?.operation)),
    );
  }

  private getPayloadProperties(): UnknownObject {
    const payloadSchema = this.getPayloadSchema();
    const fromSchema = extractSchemaProperties(payloadSchema);
    const extra = this.props.options.additionalFields ?? [];
    if (extra.length === 0) return fromSchema;
    const merged = { ...fromSchema };
    for (const f of extra) {
      merged[f.key] = { type: f.type, title: f.label ?? f.key };
    }
    return merged;
  }

  componentDidUpdate(prevProps: TryItOutProps): void {
    const endpoint = this.getEndpoint();
    if (endpoint !== this.getEndpoint(prevProps)) {
      this.setState({ url: endpoint });
    }
    if (this.state.mode === 'raw') {
      const metadata = this.getMetadata();
      const prevSlot = asObject(prevProps.context?.schema) as
        | OperationSlotSchema
        | undefined;
      const prevMetadata = prevSlot
        ? {
            operation_id: getOperationId(prevSlot?.operation),
            operation_type: getOperationAction(
              prevSlot?.operation,
              prevSlot?.type ?? 'send',
            ),
          }
        : null;
      const metadataChanged =
        !prevMetadata ||
        metadata.operation_id !== prevMetadata.operation_id ||
        metadata.operation_type !== prevMetadata.operation_type;
      if (metadataChanged) {
        this.setState((s) => ({
          raw: ensureRawMetadata(s.raw, metadata),
        }));
      }
    }
  }

  private submit = async (): Promise<void> => {
    this.setState({ loading: true, error: '', response: null });
    const payloadSchema = this.getPayloadSchema();
    const metadata = this.getMetadata();
    const slot = asObject(this.props.context?.schema) as
      | OperationSlotSchema
      | undefined;
    const channelName = slot?.channelName ?? 'unknown';

    try {
      let messageContent: unknown;
      if (this.state.mode === 'raw') {
        const parsed = JSON.parse(this.state.raw);
        const parsedObj = asObject(parsed);
        if (!parsedObj) {
          throw new Error('Raw payload must be a JSON object');
        }
        messageContent = parsedObj['message'];
      } else {
        if (isPrimitiveSchema(payloadSchema)) {
          messageContent = this.state.formData[PRIMITIVE_PAYLOAD_FIELD];
        } else if (isArraySchema(payloadSchema)) {
          messageContent = this.state.arrayData;
        } else {
          messageContent = buildDefaultPayload(payloadSchema, []);
          if (messageContent !== null) {
            messageContent = { ...this.state.formData };
          }
        }
      }

      const message: UnknownObject = {
        operation_id: metadata.operation_id,
        operation_type: metadata.operation_type,
        message: messageContent,
      };
      const res = await fetch(this.state.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          message,
          options: {
            sendToRealBroker: this.state.sendToRealBroker,
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
      this.setState({ response: body });
    } catch (e) {
      this.setState({
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  private onFormFieldChange = (
    field: string,
    value: string,
    schema: unknown,
  ): void => {
    const nextValue = castInputValue(value, schema);
    const next = { ...this.state.formData };
    if (nextValue === undefined || nextValue === '') {
      delete next[field];
    } else {
      next[field] = nextValue;
    }
    const payloadSchema = this.getPayloadSchema();
    const msgContent: unknown = isPrimitiveSchema(payloadSchema)
      ? next[PRIMITIVE_PAYLOAD_FIELD]
      : { ...next };
    this.setState({
      formData: next,
      raw: stringifyRaw({
        operation_id: this.getMetadata().operation_id,
        operation_type: this.getMetadata().operation_type,
        message: msgContent,
      }),
    });
  };

  private onArrayChange = (next: unknown[]): void => {
    this.setState({
      arrayData: next,
      raw: stringifyRaw({
        operation_id: this.getMetadata().operation_id,
        operation_type: this.getMetadata().operation_type,
        message: next,
      }),
    });
  };

  render(): React.ReactNode {
    const { props, state } = this;
    const payloadSchema = this.getPayloadSchema();
    const payloadProperties = this.getPayloadProperties();
    const itemSchema = isArraySchema(payloadSchema)
      ? (asObject(payloadSchema) as UnknownObject)?.items
      : undefined;

    return (
      <div className="mt-4">
        <button
          type="button"
          className="border border-solid border-blue-300 hover:bg-blue-300 hover:text-blue-600 text-blue-500 font-bold no-underline text-xs uppercase rounded px-3 py-1"
          onClick={() => this.setState((s) => ({ opened: !s.opened }))}
        >
          {props.options.buttonLabel}
        </button>

        {state.opened && (
          <div className="mt-4 min-w-0 rounded-lg border bg-gray-100 p-4 space-y-4">
            {props.options.showEndpointInput && (
              <EndpointInput
                value={state.url}
                onChange={(url) => this.setState({ url })}
              />
            )}

            <ModeTabs
              mode={state.mode}
              onChange={(mode) => this.setState({ mode })}
            />

            {state.mode === 'form' &&
              (isArraySchema(payloadSchema) ? (
                <ArrayEditor
                  items={state.arrayData}
                  itemSchema={itemSchema}
                  onChange={this.onArrayChange}
                />
              ) : (
                <PayloadFormFields
                  payloadProperties={payloadProperties}
                  formData={state.formData}
                  onFieldChange={this.onFormFieldChange}
                />
              ))}

            {state.mode === 'raw' && (
              <RawJsonEditor
                value={state.raw}
                onChange={(raw) => this.setState({ raw })}
              />
            )}

            {props.options.showRealBrokerToggle && (
              <BrokerToggle
                checked={state.sendToRealBroker}
                onChange={(sendToRealBroker) =>
                  this.setState({ sendToRealBroker })
                }
              />
            )}

            <ActionButtons
              loading={state.loading}
              onCancel={() => this.setState({ opened: false })}
              onSubmit={this.submit}
            />

            {state.error && (
              <div className="text-sm text-red-600">{String(state.error)}</div>
            )}
            {state.response !== null && (
              <pre className="mt-2 max-h-72 max-w-full overflow-x-auto overflow-y-auto rounded border bg-white p-4 text-xs">
                {JSON.stringify(state.response, null, 2)}
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
}
