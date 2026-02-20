import React from 'react';

interface EndpointInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function EndpointInput({ value, onChange }: EndpointInputProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-600">Endpoint</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}
