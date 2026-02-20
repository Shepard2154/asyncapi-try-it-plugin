interface ActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ActionButtons({
  loading,
  onCancel,
  onSubmit,
}: ActionButtonsProps) {
  return (
    <div
      style={{
        marginTop: '14px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        style={{
          backgroundColor: 'transparent',
          color: '#666',
          padding: '7px 14px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '12px',
          transition: 'all 0.2s',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        style={{
          backgroundColor: '#61affe',
          color: 'white',
          padding: '7px 14px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '12px',
          transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}
        disabled={loading}
        onClick={onSubmit}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
}
