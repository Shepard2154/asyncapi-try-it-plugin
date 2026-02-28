import { AdditionalField, UnknownObject } from '../types';
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

const PRIMITIVE_TYPES = new Set(['string', 'number', 'integer', 'boolean']);

export function isPrimitiveSchema(schema: unknown): boolean {
  const root = asObject(schema);
  if (!root) return false;
  const type = root.type;
  if (typeof type === 'string' && PRIMITIVE_TYPES.has(type)) {
    return !asObject(root.properties);
  }
  return false;
}

/** Synthetic field name for primitive payload schemas (e.g. `{"type":"string"}`). */
export const PRIMITIVE_PAYLOAD_FIELD = 'message';

export function extractSchemaProperties(schema: unknown): UnknownObject {
  const root = asObject(schema);
  const properties = asObject(root?.properties);
  if (properties && Object.keys(properties).length > 0) {
    return properties;
  }
  if (root && typeof root.type === 'string' && PRIMITIVE_TYPES.has(root.type)) {
    return { [PRIMITIVE_PAYLOAD_FIELD]: { type: root.type } };
  }
  return {};
}

/**
 * Returns the default value to place under `message.message` when building
 * the initial raw payload.
 * - primitive schema  → scalar zero-value (0, false, "")
 * - object schema     → plain object with defaults from additionalFields
 */
export function isArraySchema(schema: unknown): boolean {
  const root = asObject(schema);
  return root != null && root.type === 'array';
}

export function buildDefaultPayload(
  payloadSchema: unknown,
  additionalFields: AdditionalField[] = [],
): unknown {
  const schemaType = (asObject(payloadSchema) as UnknownObject)?.type;
  if (schemaType === 'null') return null;
  if (schemaType === 'array') return [];
  if (isPrimitiveSchema(payloadSchema)) {
    return schemaType === 'number' || schemaType === 'integer'
      ? 0
      : schemaType === 'boolean'
        ? false
        : '';
  }
  const obj: UnknownObject = {};
  for (const f of additionalFields) {
    obj[f.key] =
      f.defaultValue !== undefined
        ? f.defaultValue
        : f.type === 'number' || f.type === 'integer'
          ? 0
          : f.type === 'boolean'
            ? false
            : '';
  }
  return obj;
}
