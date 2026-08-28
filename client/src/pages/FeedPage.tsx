import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFeed, createPostThunk, postsSelectors } from '../store/postsSlice';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(postsSelectors.selectAll); // reads normalized state as an array
  const { status, hasMore, nextCursor } = useAppSelector((state) => state.posts);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState('');

  useEffect(() => {
    dispatch(fetchFeed(null));
  }, [dispatch]);

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await dispatch(createPostThunk({ content })).unwrap();
    setContent('');
  };

  const handleLoadMore = () => {
    if (hasMore) dispatch(fetchFeed(nextCursor));
  };

  return (
    <div className="page-container">
      <h2>Feed {currentUser ? `— welcome, ${currentUser.name}` : ''}</h2>

      <form onSubmit={handleCreatePost} className="composer">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="composer__textarea"
        />
        <button type="submit" className="composer__submit">
          Post
        </button>
      </form>

      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {status === 'loading' && <p>Loading…</p>}
      {hasMore && status !== 'loading' && (
        <button onClick={handleLoadMore} className="load-more-btn">
          Load more
        </button>
      )}
    </div>
  );
}
