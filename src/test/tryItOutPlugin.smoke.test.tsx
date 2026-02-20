import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createTryItOutPlugin } from '../createTryItOutPlugin';
import { TryItOutOperation } from '../components/TryItOutOperation';
import { ResolvedTryItOutPluginOptions, TryItOutProps } from '../types';

const baseOptions: ResolvedTryItOutPluginOptions = {
  endpointBase: 'asyncapi/try',
  showEndpointInput: false,
  showPayloadSchema: false,
  showRealBrokerToggle: true,
  buttonLabel: 'Try it out',
  resolveEndpoint: undefined,
};

function createMockOperation() {
  return {
    meta: () => ({
      id: 'publishUserCreated',
      action: 'send',
    }),
    id: () => 'publishUserCreated',
    messages: () => ({
      all: () => [
        {
          payload: () => ({
            json: () => ({
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            }),
          }),
        },
      ],
    }),
  };
}

function renderOperation(props: Partial<TryItOutProps> = {}) {
  return render(
    <TryItOutOperation
      context={{
        schema: {
          operation: createMockOperation(),
          channelName: 'users.created',
          type: 'send',
        },
      }}
      options={baseOptions}
      {...props}
    />,
  );
}

describe('try-it plugin smoke tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers plugin component to operation slot', () => {
    const plugin = createTryItOutPlugin();
    const registerComponent = vi.fn();

    plugin.install({ registerComponent });

    expect(registerComponent).toHaveBeenCalledTimes(1);
    expect(registerComponent).toHaveBeenCalledWith(
      'operation',
      expect.any(Function),
    );
  });

  it('renders "Try it out" button', () => {
    renderOperation();

    expect(
      screen.getByRole('button', { name: /try it out/i }),
    ).toBeInTheDocument();
  });

  it('switches between form and raw json modes', () => {
    renderOperation();

    fireEvent.click(screen.getByRole('button', { name: /try it out/i }));

    expect(screen.getByText('name')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /raw json/i }));
    expect(screen.getByText('Message JSON')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^form$/i }));
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('sends POST request to /asyncapi/try', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderOperation();
    fireEvent.click(screen.getByRole('button', { name: /try it out/i }));
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/asyncapi/try',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('includes operation_id and operation_type in outgoing payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderOperation();
    fireEvent.click(screen.getByRole('button', { name: /try it out/i }));
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(requestInit.body as string) as {
      message: { operation_id?: string; operation_type?: string };
    };

    expect(body.message.operation_id).toBe('publishUserCreated');
    expect(body.message.operation_type).toBe('send');
  });
});
