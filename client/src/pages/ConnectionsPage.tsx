import { useEffect, useState } from 'react';
import { connectionsApi } from '../api/socialApi';
import type { ConnectionRequest } from '../types';

export default function ConnectionsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await connectionsApi.getPending();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAccept = async (id: string) => {
    await connectionsApi.acceptRequest(id);
    // Remove it from the local list immediately rather than refetching
    // — we already know the outcome, no need for a round trip just to
    // confirm what we just did.
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
      {!loading && requests.length === 0 && <p>No pending requests.</p>}
      {requests.map((req) => (
        <div key={req._id} className="post-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <strong>{req.from.name}</strong>
            {req.from.headline && (
              <div className="post-card__headline">{req.from.headline}</div>
            )}
          </div>
          <div>
            <button onClick={() => handleAccept(req._id)} className="composer__submit" style={{ marginRight: 8, padding: '6px 14px' }}>
              Accept
            </button>
            <button onClick={() => handleReject(req._id)} className="post-card__delete-btn">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
