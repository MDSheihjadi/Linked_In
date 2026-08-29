import { useEffect, useState } from 'react';
import { connectionsApi } from '../api/socialApi';
import type { ConnectionRequest } from '../types';
import Avatar from '../components/Avatar';
import { getAccentForId } from '../utils/avatarColor';
import type { CSSProperties } from 'react';

export default function ConnectionsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    setLoading(true);
    try {
      setRequests(await connectionsApi.getPending());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const handleAccept = async (id: string) => {
    await connectionsApi.acceptRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };
  const handleReject = async (id: string) => {
    await connectionsApi.rejectRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <div className="page-container">
      <h2>Connection requests</h2>
      {loading && <p>Loading…</p>}
      {!loading && requests.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No pending requests.</p>}
      {requests.map((req) => {
        const accent = getAccentForId(req.from._id);
        const style = { '--card-accent': accent.bg } as CSSProperties;
        return (
          <div key={req._id} className="request-card" style={style}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar id={req.from._id} name={req.from.name} size={40} />
              <div>
                <strong>{req.from.name}</strong>
                {req.from.headline && <div className="post-card__headline">{req.from.headline}</div>}
              </div>
            </div>
            <div>
              <button onClick={() => handleAccept(req._id)} className="request-card__accept">Accept</button>
              <button onClick={() => handleReject(req._id)} className="request-card__reject">Reject</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}