import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import { postsApi } from '../api/postsApi';
import { connectionsApi } from '../api/socialApi';
import { useAppSelector } from '../store/hooks';
import type { User, Post } from '../types';
import PostCard from '../components/PostCard';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([usersApi.getProfile(userId), postsApi.getUserPosts(userId)])
      .then(([profileData, postsData]) => {
        setProfile(profileData);
        setPosts(postsData.posts);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleConnect = async () => {
    if (!userId) return;
    try {
      await connectionsApi.sendRequest(userId);
      setConnectStatus('sent');
    } catch {
      setConnectStatus('error');
    }
  };

  if (loading) return <p className="page-container">Loading profile…</p>;
  if (!profile) return <p className="page-container">User not found.</p>;

  const isOwnProfile = currentUser?._id === profile._id;
  const alreadyConnected = currentUser
    ? profile.connections?.includes(currentUser._id)
    : false;

  return (
    <div className="page-container">
      <div className="profile-header">
        <h2>{profile.name}</h2>
        {profile.headline && <p className="profile-headline">{profile.headline}</p>}
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="profile-meta">
          {profile.connections?.length ?? 0} connections
        </p>

        {!isOwnProfile && (
          <button
            onClick={handleConnect}
            disabled={connectStatus === 'sent' || alreadyConnected}
            className="connect-btn"
          >
            {alreadyConnected
              ? 'Connected'
              : connectStatus === 'sent'
              ? 'Request sent'
              : 'Connect'}
          </button>
        )}
        {connectStatus === 'error' && (
          <p style={{ color: 'red', fontSize: 13 }}>
            Could not send request (maybe already sent).
          </p>
        )}
      </div>

      <h3>Posts</h3>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
