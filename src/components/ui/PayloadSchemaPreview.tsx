interface PayloadSchemaPreviewProps {
  payloadSchema: unknown;
}

export function PayloadSchemaPreview({
  payloadSchema,
}: PayloadSchemaPreviewProps) {
  return (
    <details>
      <summary className="cursor-pointer text-xs text-gray-600">
        Payload schema
      </summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded border bg-white p-4 text-xs leading-relaxed">
        {JSON.stringify(payloadSchema, null, 2)}
      </pre>
    </details>
  );
}
