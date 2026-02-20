import { UnknownObject } from '../types';
import { asObject } from './object';

export function normalizeSchema(schema: unknown): unknown {
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

export function sanitizeSchema(schema: unknown): unknown {
  if (schema === true) return {};
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map((item) => sanitizeSchema(item));

  const source = schema as UnknownObject;
  const clean: UnknownObject = {};

  for (const [key, value] of Object.entries(source)) {
    if (
      [
        'additionalProperties',
        'dependencies',
        'patternProperties',
        'definitions',
      ].includes(key) &&
      value === true
    ) {
      clean[key] = {};
      continue;
    }
    clean[key] = sanitizeSchema(value);
  }

  return clean;
}

export function resolvePayloadSchema(operation: unknown): unknown {
  const op = asObject(operation);
  if (!op) return undefined;

  const messagesResult =
    typeof op.messages === 'function' ? op.messages() : undefined;
  const messages = asObject(messagesResult);
  const all =
    messages && typeof messages.all === 'function' ? messages.all() : undefined;

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

  const opJson =
    typeof op.json === 'function' ? asObject(op.json()) : undefined;
  return asObject(opJson?.message)?.payload;
}

export function extractSchemaProperties(schema: unknown): UnknownObject {
  const root = asObject(schema);
  const properties = asObject(root?.properties);
  return properties ?? {};
}
