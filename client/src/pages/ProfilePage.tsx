import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import { postsApi } from '../api/postsApi';
import { connectionsApi } from '../api/socialApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { userUpdated } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import type { User, Post } from '../types';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import EditProfileModal from '../components/EditProfileModal';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [editOpen, setEditOpen] = useState(false);

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
      showToast('Connection request sent', 'success');
    } catch {
      setConnectStatus('error');
      showToast('Could not send request', 'error');
    }
  };

  const handleProfileSaved = (updated: User) => {
    setProfile(updated);
    if (currentUser?._id === updated._id) {
      dispatch(userUpdated(updated));
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
        <div className="profile-header__content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar id={profile._id} name={profile.name} size={56} />
            )}
            <div>
              <h2 style={{ margin: 0 }}>{profile.name}</h2>
              {profile.headline && <p className="profile-headline">{profile.headline}</p>}
            </div>
          </div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <p className="profile-meta">{profile.connections?.length ?? 0} CONNECTIONS</p>

          {isOwnProfile ? (
            <button onClick={() => setEditOpen(true)} className="connect-btn">
              Edit profile
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connectStatus === 'sent' || alreadyConnected}
              className="connect-btn"
            >
              {alreadyConnected ? 'Connected' : connectStatus === 'sent' ? 'Request sent' : 'Connect'}
            </button>
          )}
          {connectStatus === 'error' && (
            <p style={{ color: '#B24020', fontSize: 13 }}>Could not send request (maybe already sent).</p>
          )}
        </div>
      </div>

      <h3>Posts</h3>
      {posts.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No posts yet.</p>}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {isOwnProfile && (
        <EditProfileModal
          user={profile}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
