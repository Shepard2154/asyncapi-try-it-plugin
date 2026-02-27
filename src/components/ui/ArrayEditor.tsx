import React from 'react';
import { asObject } from '../../utils/object';
import { castInputValue, toInputValue } from '../../utils/payload';

interface ArrayEditorProps {
  items: unknown[];
  itemSchema: unknown;
  onChange: (items: unknown[]) => void;
}

export function ArrayEditor({ items, itemSchema, onChange }: ArrayEditorProps) {
  const s = asObject(itemSchema);
  const itemType = typeof s?.type === 'string' ? s.type : 'string';

  const defaultItemValue = (): unknown =>
    itemType === 'number' || itemType === 'integer'
      ? 0
      : itemType === 'boolean'
        ? false
        : '';

  const addItem = () => onChange([...items, defaultItemValue()]);

  const removeItem = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, rawValue: string) => {
    const next = [...items];
    next[idx] = castInputValue(rawValue, itemSchema);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) =>
        itemType === 'boolean' ? (
          <div key={idx} className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 flex-1">
              <input
                type="checkbox"
                checked={item === true}
                onChange={(e) =>
                  updateItem(idx, e.target.checked ? 'true' : 'false')
                }
              />
              Item {idx + 1}
            </label>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded"
            >
              Remove
            </button>
          </div>
        ) : (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type={
                itemType === 'number' || itemType === 'integer'
                  ? 'number'
                  : 'text'
              }
              value={toInputValue(item)}
              onChange={(e) => updateItem(idx, e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm bg-white"
              placeholder={`Item ${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded"
            >
              Remove
            </button>
          </div>
        ),
      )}
      <button
        type="button"
        onClick={addItem}
        className="text-blue-500 hover:text-blue-700 text-xs px-3 py-1 border border-blue-300 rounded"
      >
        + Add item
      </button>
    </div>
  );
}
