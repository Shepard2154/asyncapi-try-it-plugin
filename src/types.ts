export type UnknownObject = Record<string, unknown>;

export interface OperationSlotSchema {
  operation?: unknown;
  channelName?: string;
  type?: string;
}

export interface ComponentSlotProps {
  context: {
    schema?: unknown;
  };
  onClose?: () => void;
}

export interface AdditionalField {
  key: string;
  type: 'string' | 'number' | 'integer' | 'boolean';
  label?: string;
  defaultValue?: unknown;
}

export interface TryItOutPluginOptions {
  endpointBase?: string;
  showEndpointInput?: boolean;
  showPayloadSchema?: boolean;
  showRealBrokerToggle?: boolean;
  buttonLabel?: string;
  additionalFields?: AdditionalField[];
  resolveEndpoint?: (ctx: {
    operationId: string;
    operationAction: string;
    channelName: string;
    type: string;
    endpointBase: string;
  }) => string;
}

export type ResolvedTryItOutPluginOptions = Required<
  Omit<TryItOutPluginOptions, 'resolveEndpoint'>
> &
  Pick<TryItOutPluginOptions, 'resolveEndpoint'>;

export interface TryItOutProps extends ComponentSlotProps {
  options: ResolvedTryItOutPluginOptions;
}
