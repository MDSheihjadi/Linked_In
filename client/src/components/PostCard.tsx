import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleLikeThunk, sharePostThunk, deletePostThunk } from '../store/postsSlice';
import CommentSection from './CommentSection';
import Avatar from './Avatar';
import { useToast } from '../context/ToastContext';
import type { Post } from '../types';

export default function PostCard({ post }: { post: Post }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { showToast } = useToast();

  const effective = post.sharedFrom ?? post;
  const isRepost = Boolean(post.sharedFrom);

  const liked = currentUser ? effective.likes.includes(currentUser._id) : false;
  const isOwner = currentUser?._id === post.author._id;

  const handleShare = () => {
    dispatch(sharePostThunk(effective._id));
    showToast('Reposted to your network', 'success');
  };
  const handleDelete = () => {
    if (confirm(isRepost ? 'Remove this repost?' : 'Delete this post?')) {
      dispatch(deletePostThunk(post._id));
      showToast(isRepost ? 'Repost removed' : 'Post deleted', 'info');
    }
  };

  return (
    <div className="post-card">
      {isRepost && (
        <div className="post-card__repost-banner">
          🔁 <Link to={`/profile/${post.author._id}`}>{post.author.name}</Link> reposted this
        </div>
      )}
      <div className="post-card__row">
        <Link to={`/profile/${effective.author._id}`}>
          <Avatar id={effective.author._id} name={effective.author.name} />
        </Link>
        <div className="post-card__body">
          <div className="post-card__header">
            <Link to={`/profile/${effective.author._id}`} className="post-card__author-link">
              {effective.author.name}
            </Link>
            {isOwner && (
              <button onClick={handleDelete} className="post-card__delete-btn">
                {isRepost ? 'Remove' : 'Delete'}
              </button>
            )}
          </div>
          {effective.author.headline && (
            <div className="post-card__headline">{effective.author.headline}</div>
          )}
          <p className="post-card__content">{effective.content}</p>
          {effective.imageUrl && (
            <img src={effective.imageUrl} alt="" className="post-card__image" />
          )}

          <div className="post-card__actions">
            <button
              onClick={() => dispatch(toggleLikeThunk(effective._id))}
              className={liked ? 'post-card__action post-card__action--active' : 'post-card__action'}
            >
              {liked ? '👍 Liked' : '👍 Like'} ({effective.likes.length})
            </button>
            <span className="post-card__action">{effective.commentsCount} comments</span>
            <button onClick={handleShare} className="post-card__action">
              🔁 Repost ({effective.sharesCount})
            </button>
          </div>

          <CommentSection postId={effective._id} />
        </div>
      </div>
    </div>
  );
}
