import React from 'react';
import {
  ComponentSlotProps,
  ResolvedTryItOutPluginOptions,
  TryItOutPluginOptions,
} from './types';
import { TryItOutOperation } from './components/TryItOutOperation';

export function createTryItOutPlugin(options: TryItOutPluginOptions = {}): any {
  const normalized: ResolvedTryItOutPluginOptions = {
    endpointBase: options.endpointBase ?? 'asyncapi/try',
    showEndpointInput: options.showEndpointInput ?? false,
    showPayloadSchema: options.showPayloadSchema ?? false,
    showRealBrokerToggle: options.showRealBrokerToggle ?? true,
    buttonLabel: options.buttonLabel ?? 'Try it out',
    additionalFields: options.additionalFields ?? [],
    resolveEndpoint: options.resolveEndpoint,
  };

  return {
    name: 'asyncapi-try-it-plugin',
    version: '0.2.0-beta.3',
    install(api: any) {
      api.registerComponent('operation', (props: ComponentSlotProps) => (
        <TryItOutOperation {...props} options={normalized} />
      ));
    },
  };
}
