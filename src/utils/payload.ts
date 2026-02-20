import { asObject } from './object';
import { UnknownObject } from '../types';

export function stringifyRaw(value: UnknownObject): string {
  return JSON.stringify(value, null, 2);
}

export function toInputValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function castInputValue(value: string, schema: unknown): unknown {
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

export function ensureRawMetadata(
  raw: string,
  metadata: { operation_id: string; operation_type: string },
): string {
  let parsed: UnknownObject | undefined;
  try {
    parsed = asObject(JSON.parse(raw));
  } catch {
    parsed = undefined;
  }
  return stringifyRaw({
    ...(parsed ?? {}),
    operation_id: metadata.operation_id,
    operation_type: metadata.operation_type,
  });
}
