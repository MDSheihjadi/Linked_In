import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFeed, createPostThunk, toggleLikeThunk, postsSelectors } from '../store/postsSlice';
import PostCard from '../components/PostCard';
import { uploadApi } from '../api/uploadApi';
import { useToast } from '../context/ToastContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(postsSelectors.selectAll);
  const { status, hasMore, nextCursor } = useAppSelector((state) => state.posts);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchFeed(null));
  }, [dispatch]);

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await dispatch(createPostThunk({ content, imageUrl: imageUrl || undefined })).unwrap();
      setContent('');
      setImageUrl('');
      showToast('Post published', 'success');
    } catch {
      showToast('Could not publish post', 'error');
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setImageUrl(res.url);
      showToast('Image uploaded', 'success');
    } catch {
      showToast('Image upload failed — check Cloudinary is configured on the server', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleLoadMore = () => {
    if (hasMore) dispatch(fetchFeed(nextCursor));
  };

  useKeyboardShortcuts({
    n: () => textareaRef.current?.focus(),
    j: () => setFocusedIndex((i) => Math.min(i + 1, posts.length - 1)),
    k: () => setFocusedIndex((i) => Math.max(i - 1, 0)),
    l: () => {
      const post = posts[focusedIndex];
      if (post) dispatch(toggleLikeThunk(post._id));
    },
  });

  useEffect(() => {
    if (focusedIndex < 0) return;
    const post = posts[focusedIndex];
    if (post) {
      cardRefs.current.get(post._id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [focusedIndex, posts]);

  return (
    <div className="page-container">
      <h2>Feed {currentUser ? `— welcome, ${currentUser.name}` : ''}</h2>

      <form onSubmit={handleCreatePost} className="composer">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? (press N to focus)"
          className="composer__textarea"
        />
        {imageUrl && (
          <div className="composer__preview">
            <img src={imageUrl} alt="" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="composer__preview-remove"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        )}
        <div className="composer__footer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="composer__image-btn"
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '📷 Add image'}
          </button>
          <button type="submit" className="composer__submit">Post</button>
        </div>
      </form>

      {status === 'loading' && posts.length === 0 && (
        <>
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </>
      )}

      {posts.map((post, i) => (
        <div
          key={post._id}
          ref={(el) => {
            if (el) cardRefs.current.set(post._id, el);
          }}
          className={i === focusedIndex ? 'feed-item feed-item--focused' : 'feed-item'}
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          <PostCard post={post} />
        </div>
      ))}

      {hasMore && status !== 'loading' && (
        <button onClick={handleLoadMore} className="load-more-btn">
          Load more
        </button>
      )}
    </div>
  );
}
