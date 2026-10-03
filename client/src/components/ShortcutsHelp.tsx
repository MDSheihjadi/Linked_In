export default function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const shortcuts: [string, string][] = [
    ['Ctrl/Cmd + K', 'Open command palette'],
    ['N', 'Focus the new post box'],
    ['J / K', 'Move down / up the feed'],
    ['L', 'Like the focused post'],
    ['?', 'Show this help'],
    ['Esc', 'Close any open panel'],
  ];

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Keyboard shortcuts</h3>
        <table className="shortcuts-table">
          <tbody>
            {shortcuts.map(([key, desc]) => (
              <tr key={key}>
                <td><kbd>{key}</kbd></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cmdk-footer">Esc to close</div>
      </div>
    </div>
  );
}
