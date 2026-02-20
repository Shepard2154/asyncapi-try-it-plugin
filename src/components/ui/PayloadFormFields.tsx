import React from 'react';
import { UnknownObject } from '../../types';
import { asObject } from '../../utils/object';
import { toInputValue } from '../../utils/payload';

interface PayloadFormFieldsProps {
  payloadProperties: UnknownObject;
  formData: UnknownObject;
  onFieldChange: (field: string, value: string, schema: unknown) => void;
}

export function PayloadFormFields({
  payloadProperties,
  formData,
  onFieldChange,
}: PayloadFormFieldsProps) {
  return (
    <div className="space-y-3">
      {Object.entries(payloadProperties).map(([field, fieldSchema]) => {
        if (field === 'operation_id' || field === 'operation_type') {
          return null;
        }
        const s = asObject(fieldSchema);
        const schemaType = typeof s?.type === 'string' ? s.type : 'string';
        const value = formData[field];
        if (schemaType === 'boolean') {
          return (
            <label
              key={field}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) =>
                  onFieldChange(
                    field,
                    e.target.checked ? 'true' : 'false',
                    fieldSchema,
                  )
                }
              />
              {field}
            </label>
          );
        }
        return (
          <div key={field} className="space-y-1">
            <div className="text-xs text-gray-600">{field}</div>
            <input
              value={toInputValue(value)}
              onChange={(e) =>
                onFieldChange(field, e.target.value, fieldSchema)
              }
              className="w-full rounded border px-3 py-2 text-sm bg-white"
            />
          </div>
        );
      })}
    </div>
  );
}
