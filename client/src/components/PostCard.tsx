import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleLikeThunk, sharePostThunk, deletePostThunk } from '../store/postsSlice';
import CommentSection from './CommentSection';
import Avatar from './Avatar';
import { getAccentForId } from '../utils/avatarColor';
import type { Post } from '../types';
import type { CSSProperties } from 'react';

export default function PostCard({ post }: { post: Post }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const liked = currentUser ? post.likes.includes(currentUser._id) : false;
  const isOwner = currentUser?._id === post.author._id;
  const accent = getAccentForId(post.author._id);

  const handleShare = () => dispatch(sharePostThunk(post._id));
  const handleDelete = () => {
    if (confirm('Delete this post?')) dispatch(deletePostThunk(post._id));
  };

  const cardStyle = { '--card-accent': accent.bg } as CSSProperties;

  return (
    <div className="post-card" style={cardStyle}>
      <Link to={`/profile/${post.author._id}`}>
        <Avatar id={post.author._id} name={post.author.name} />
      </Link>
      <div className="post-card__body">
        <div className="post-card__header">
          <Link to={`/profile/${post.author._id}`} className="post-card__author-link">
            {post.author.name}
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
    </div>
  );
}