import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../api/usersApi';
import Avatar from './Avatar';
import type { User } from '../types';

const STATIC_ACTIONS = [
  { label: 'Go to Feed', path: '/feed' },
  { label: 'Go to Search', path: '/search' },
  { label: 'Go to Connections', path: '/connections' },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setUsers([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await searchApi.search(query, 'user');
      setUsers(res.users ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  const filteredActions = STATIC_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, or jump to a page…"
          className="cmdk-input"
        />
        <div className="cmdk-results">
          {filteredActions.map((a) => (
            <button key={a.path} className="cmdk-item" onClick={() => go(a.path)}>
              → {a.label}
            </button>
          ))}
          {users.map((u) => (
            <button key={u._id} className="cmdk-item" onClick={() => go(`/profile/${u._id}`)}>
              <Avatar id={u._id} name={u.name} size={24} />
              <span>{u.name}</span>
            </button>
          ))}
          {query && filteredActions.length === 0 && users.length === 0 && (
            <div className="cmdk-empty">No results</div>
          )}
        </div>
        <div className="cmdk-footer">Esc to close</div>
      </div>
    </div>
  );
}
