import { UnknownObject } from '../types';

export function asObject(value: unknown): UnknownObject | undefined {
  return typeof value === 'object' && value !== null
    ? (value as UnknownObject)
    : undefined;
}
