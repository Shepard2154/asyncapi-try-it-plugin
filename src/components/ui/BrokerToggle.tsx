interface BrokerToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BrokerToggle({ checked, onChange }: BrokerToggleProps) {
  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e1e4e8',
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            marginRight: '8px',
            width: '14px',
            height: '14px',
            cursor: 'pointer',
          }}
        />
        <span style={{ fontWeight: 500, fontSize: '12px' }}>
          Send to real message broker
        </span>
      </label>
      <p
        style={{
          marginTop: '6px',
          color: '#666',
          fontSize: '12px',
          lineHeight: '1.35',
        }}
      >
        When enabled, the message will be published to the actual broker instead
        of test environment.
      </p>
    </div>
  );
}
