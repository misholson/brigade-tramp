import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { BASE_URL } from '../api/apiClient';
import PhotoCropper from './PhotoCropper';

interface SingerProfileDto { photoUrl: string | null; showEmail: boolean; }

interface Props {
  code: string;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const Box = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 12px;
  padding: 28px 24px;
  max-width: 340px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
`;

const Title = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${p => p.theme.colors.text};
  align-self: flex-start;
`;

const PhotoCircle = styled.div<{ $hasPhoto: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${p => p.$hasPhoto ? 'transparent' : p.theme.colors.surfaceAlt};
  border: 2px solid ${p => p.theme.colors.border};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PhotoPlaceholder = styled.div`
  font-size: 3rem;
  color: ${p => p.theme.colors.textMuted};
  line-height: 1;
  user-select: none;
`;

const PhotoBtn = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: #1565c0;
  color: #fff;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.92rem;
  color: ${p => p.theme.colors.text};
  cursor: pointer;
  align-self: flex-start;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #1565c0;
`;

const ErrorMsg = styled.div`
  font-size: 0.85rem;
  color: #c62828;
  text-align: center;
`;

const CloseBtn = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: ${p => p.theme.colors.surfaceAlt};
  color: ${p => p.theme.colors.text};
  align-self: stretch;
  &:hover { opacity: 0.85; }
`;

export default function ProfileModal({ code, onClose }: Props) {
  const [profile, setProfile] = useState<SingerProfileDto | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/singer/${code}/profile`)
      .then(r => r.ok ? r.json() as Promise<SingerProfileDto> : null)
      .then(data => { if (data) setProfile(data); })
      .catch(() => {});
  }, [code]);

  const handleShowEmailChange = async (checked: boolean) => {
    if (!profile) return;
    setProfile(p => p && ({ ...p, showEmail: checked }));
    try {
      const res = await fetch(`${BASE_URL}/singer/${code}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showEmail: checked }),
      });
      if (!res.ok) setProfile(p => p && ({ ...p, showEmail: !checked }));
    } catch {
      setProfile(p => p && ({ ...p, showEmail: !checked }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadBlob = async (blob: Blob) => {
    setCropFile(null);
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', blob, 'photo.jpg');
      const res = await fetch(`${BASE_URL}/singer/${code}/photo`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json() as SingerProfileDto;
        setProfile(data);
      } else if (res.status === 503) {
        setError('Photo upload is not available at this event.');
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Overlay onClick={cropFile ? undefined : onClose}>
      <Box onClick={e => e.stopPropagation()}>
        {cropFile ? (
          <PhotoCropper
            file={cropFile}
            onSave={uploadBlob}
            onCancel={() => setCropFile(null)}
          />
        ) : (
          <>
            <Title>My Profile</Title>

            <PhotoCircle $hasPhoto={!!profile?.photoUrl}>
              {profile?.photoUrl
                ? <Photo src={profile.photoUrl} alt="Profile photo" />
                : <PhotoPlaceholder>👤</PhotoPlaceholder>
              }
            </PhotoCircle>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <PhotoBtn disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? 'Uploading…' : profile?.photoUrl ? 'Change Photo' : 'Upload Photo'}
            </PhotoBtn>

            {error && <ErrorMsg>{error}</ErrorMsg>}

            {profile !== null && (
              <CheckRow>
                <Checkbox
                  type="checkbox"
                  checked={profile.showEmail}
                  onChange={e => handleShowEmailChange(e.target.checked)}
                />
                Show my email to others
              </CheckRow>
            )}

            <CloseBtn onClick={onClose}>Close</CloseBtn>
          </>
        )}
      </Box>
    </Overlay>
  );
}
