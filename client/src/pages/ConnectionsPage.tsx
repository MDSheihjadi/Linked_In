import { useEffect, useState } from 'react';
import { connectionsApi } from '../api/socialApi';
import type { ConnectionRequest } from '../types';
import Avatar from '../components/Avatar';
import { useToast } from '../context/ToastContext';

export default function ConnectionsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
    showToast('Connection accepted', 'success');
  };
  const handleReject = async (id: string) => {
    await connectionsApi.rejectRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
    showToast('Request declined', 'info');
  };

  return (
    <div className="page-container">
      <h2>Connection requests</h2>
      {loading && <p>Loading…</p>}
      {!loading && requests.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>}
      {requests.map((req) => (
        <div key={req._id} className="request-card">
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
      ))}
    </div>
  );
}
