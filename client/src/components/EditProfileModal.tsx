import { useState, type FormEvent, type ChangeEvent } from 'react';
import { usersApi } from '../api/usersApi';
import { uploadApi } from '../api/uploadApi';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import type { User } from '../types';

export default function EditProfileModal({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(user.headline ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  if (!open) return null;

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setAvatarUrl(res.url);
    } catch {
      showToast('Photo upload failed — check Cloudinary is configured on the server', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(user._id, { name, headline, bio, avatarUrl });
      onSaved(updated);
      showToast('Profile updated', 'success');
      onClose();
    } catch {
      showToast('Could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Edit profile</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar id={user._id} name={name || user.name} size={56} />
            )}
            <label className="composer__image-btn" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="auth-input"
          />
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Headline (e.g. Software Engineer at Acme)"
            className="auth-input"
            maxLength={150}
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="About you"
            className="composer__textarea"
            maxLength={2000}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="request-card__reject">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="composer__submit">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
