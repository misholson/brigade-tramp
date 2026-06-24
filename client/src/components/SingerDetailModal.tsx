import { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { Part, SingerDto } from '../types';
import { BASE_URL } from '../api/apiClient';

interface SingerProfileDto { photoUrl: string | null; showEmail: boolean; }

interface Props {
  singer: SingerDto;
  isChecked: boolean;
  onSang: () => void;
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
  max-width: 320px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`;

const PhotoCircle = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: ${p => p.theme.colors.surfaceAlt};
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
  font-size: 2.5rem;
  line-height: 1;
  color: ${p => p.theme.colors.textMuted};
  user-select: none;
`;

const BadgeName = styled.div`
  font-size: 1.3rem;
  font-weight: 800;
  color: ${p => p.theme.colors.text};
  text-align: center;
`;

const FullName = styled.div`
  font-size: 0.9rem;
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  margin-top: -8px;
`;

const PartBadge = styled.div<{ $part: Part }>`
  padding: 3px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  background: ${p => p.theme.parts[p.$part].dark};
  color: #fff;
`;

const EmailRow = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  word-break: break-all;
`;

const SangBtn = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: #1565c0;
  color: #fff;
  &:hover { opacity: 0.85; }
`;

const CloseBtn = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: ${p => p.theme.colors.surfaceAlt};
  color: ${p => p.theme.colors.text};
  &:hover { opacity: 0.85; }
`;

export default function SingerDetailModal({ singer, isChecked, onSang, onClose }: Props) {
  const [profile, setProfile] = useState<SingerProfileDto | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/singer/${singer.code}/profile`)
      .then(r => r.ok ? r.json() as Promise<SingerProfileDto> : null)
      .then(data => { if (data) setProfile(data); })
      .catch(() => {});
  }, [singer.code]);

  return (
    <Overlay onClick={onClose}>
      <Box onClick={e => e.stopPropagation()}>
        <PhotoCircle>
          {profile?.photoUrl
            ? <Photo src={profile.photoUrl} alt={singer.badgeName} />
            : <PhotoPlaceholder>👤</PhotoPlaceholder>
          }
        </PhotoCircle>

        <BadgeName>{singer.badgeName}</BadgeName>
        <FullName>{singer.firstName} {singer.lastName}</FullName>
        <PartBadge $part={singer.part}>{singer.part}</PartBadge>

        {profile?.showEmail && singer.email && (
          <EmailRow>{singer.email}</EmailRow>
        )}

        {!isChecked && (
          <SangBtn onClick={onSang}>I sang with {singer.badgeName}</SangBtn>
        )}
        <CloseBtn onClick={onClose}>Close</CloseBtn>
      </Box>
    </Overlay>
  );
}
