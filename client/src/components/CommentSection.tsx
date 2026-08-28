import { useState, type FormEvent } from 'react';
import { commentsApi } from '../api/socialApi';
import type { Comment } from '../types';

export default function CommentSection({ postId }: { postId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  const loadComments = async () => {
    if (expanded) {
      setExpanded(false); // collapse if already open
      return;
    }
    setExpanded(true);
    setLoading(true);
    try {
      const res = await commentsApi.getComments(postId);
      setComments(res.comments);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const newComment = await commentsApi.addComment(postId, text);
    // Prepend locally instead of refetching the whole list — avoids
    // an unnecessary round trip just to show what we already know
    // the server accepted.
    setComments((prev) => [newComment, ...prev]);
    setText('');
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={loadComments}
        style={{ background: 'none', border: 'none', color: '#0a66c2', cursor: 'pointer', padding: 0 }}
      >
        {expanded ? 'Hide comments' : 'View comments'}
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              style={{ flex: 1, padding: 6 }}
            />
            <button type="submit">Send</button>
          </form>

          {loading && <p style={{ fontSize: 13, color: '#666' }}>Loading comments…</p>}

          {comments.map((c) => (
            <div key={c._id} style={{ fontSize: 13, marginBottom: 6 }}>
              <strong>{c.author.name}</strong>: {c.text}
            </div>
          ))}
          {!loading && comments.length === 0 && (
            <p style={{ fontSize: 13, color: '#666' }}>No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
