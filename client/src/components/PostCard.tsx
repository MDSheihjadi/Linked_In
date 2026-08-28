import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleLikeThunk, sharePostThunk, deletePostThunk } from '../store/postsSlice';
import CommentSection from './CommentSection';
import type { Post } from '../types';

export default function PostCard({ post }: { post: Post }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const liked = currentUser ? post.likes.includes(currentUser._id) : false;
  const isOwner = currentUser?._id === post.author._id;

  const handleShare = () => {
    dispatch(sharePostThunk(post._id));
  };

  const handleDelete = () => {
    if (confirm('Delete this post?')) {
      dispatch(deletePostThunk(post._id));
    }
  };

  return (
    <div className="post-card">
      <div className="post-card__header">
        <Link to={`/profile/${post.author._id}`} className="post-card__author-link">
          <strong>{post.author.name}</strong>
        </Link>
        {isOwner && (
          <button onClick={handleDelete} className="post-card__delete-btn">
            Delete
          </button>
        )}
      </div>
      {post.author.headline && (
        <div className="post-card__headline">{post.author.headline}</div>
      )}
      <p className="post-card__content">{post.content}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="post-card__image" />
      )}

      <div className="post-card__actions">
        <button
          onClick={() => dispatch(toggleLikeThunk(post._id))}
          className={liked ? 'post-card__action post-card__action--active' : 'post-card__action'}
        >
          {liked ? '♥ Liked' : '♡ Like'} ({post.likes.length})
        </button>
        <span className="post-card__action">{post.commentsCount} comments</span>
        <button onClick={handleShare} className="post-card__action">
          ↗ Share ({post.sharesCount})
        </button>
      </div>

      <CommentSection postId={post._id} />
    </div>
  );
}
