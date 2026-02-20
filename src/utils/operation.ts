import { asObject } from './object';

export function getOperationId(operation: unknown): string {
  const op = asObject(operation);
  if (!op) return 'operation';

  const meta = typeof op.meta === 'function' ? asObject(op.meta()) : undefined;
  const metaId = typeof meta?.id === 'string' ? meta.id : undefined;
  if (metaId && metaId.length > 0) return metaId;

  const id = typeof op.id === 'function' ? op.id() : undefined;
  if (typeof id === 'string' && id.length > 0) return id;

  return 'operation';
}

export function getOperationAction(
  operation: unknown,
  fallbackType: string,
): string {
  const op = asObject(operation);
  if (!op) return fallbackType;

  const meta = typeof op.meta === 'function' ? asObject(op.meta()) : undefined;
  const action = typeof meta?.action === 'string' ? meta.action : undefined;
  if (action && action.length > 0) return action;

  return fallbackType;
}
