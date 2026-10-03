import { useState, type FormEvent } from 'react';
import { commentsApi } from '../api/socialApi';
import Avatar from './Avatar';
import { useAppDispatch } from '../store/hooks';
import { commentCountChanged } from '../store/postsSlice';
import type { Comment } from '../types';

export default function CommentSection({ postId }: { postId: string }) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  const loadComments = async () => {
    if (expanded) {
      setExpanded(false);
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
    setComments((prev) => [newComment, ...prev]);
    setText('');
    dispatch(commentCountChanged({ postId, delta: 1 }));
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={loadComments} className="comment-toggle">
        {expanded ? 'Hide comments' : 'View comments'}
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <form onSubmit={handleAddComment} className="comment-input-row">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              className="comment-input"
            />
            <button type="submit" className="comment-send">Send</button>
          </form>

          {loading && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading comments…</p>}

          {comments.map((c) => (
            <div key={c._id} className="comment-row">
              <Avatar id={c.author._id} name={c.author.name} size={26} />
              <div><strong>{c.author.name}</strong>: {c.text}</div>
            </div>
          ))}
          {!loading && comments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
