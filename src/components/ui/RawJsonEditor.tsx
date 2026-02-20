import React from 'react';

interface RawJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RawJsonEditor({ value, onChange }: RawJsonEditorProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-600">Message JSON</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm font-mono bg-white"
        rows={12}
      />
    </div>
  );
}
