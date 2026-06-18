import { useState } from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid ${p => p.theme.colors.borderLight};
  border-radius: 8px;
  margin-bottom: 16px;
  background: ${p => p.theme.colors.surface};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  background: ${p => p.theme.colors.surfaceAlt};
`;

const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
  color: ${p => p.theme.colors.textSecondary};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RandomBtn = styled.button`
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: #1565c0;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.85; }
`;

const Chevron = styled.span<{ $open: boolean }>`
  transform: ${p => (p.$open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
  display: inline-block;
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textMuted};
`;

const Body = styled.div`
  padding: 10px 16px;
`;

const SongItem = styled.div`
  padding: 5px 0;
  font-size: 0.9rem;
  color: ${p => p.theme.colors.text};
  border-bottom: 1px solid ${p => p.theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 12px;
  padding: 32px 28px;
  width: 320px;
  max-width: 92vw;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
`;

const ModalLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${p => p.theme.colors.textMuted};
  margin-bottom: 16px;
`;

const SongName = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${p => p.theme.colors.link};
  margin-bottom: 24px;
  line-height: 1.3;
`;

const CloseBtn = styled.button`
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  background: #757575;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.85; }
`;

interface Props {
  songs: string[];
}

export default function SongListCard({ songs }: Props) {
  const [open, setOpen] = useState(false);
  const [randomSong, setRandomSong] = useState<string | null>(null);

  if (songs.length === 0) return null;

  const sorted = [...songs].sort((a, b) => a.localeCompare(b));

  const handleRandomize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRandomSong(songs[Math.floor(Math.random() * songs.length)]);
  };

  return (
    <>
      <Card>
        <Header onClick={() => setOpen(o => !o)}>
          <HeaderTitle>Song List</HeaderTitle>
          <HeaderRight>
            <RandomBtn onClick={handleRandomize}>Randomize</RandomBtn>
            <Chevron $open={open}>▼</Chevron>
          </HeaderRight>
        </Header>
        {open && (
          <Body>
            {sorted.map((song, i) => <SongItem key={i}>{song}</SongItem>)}
          </Body>
        )}
      </Card>

      {randomSong && (
        <Overlay>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalLabel>Your Song</ModalLabel>
            <SongName>{randomSong}</SongName>
            <CloseBtn onClick={() => setRandomSong(null)}>Close</CloseBtn>
          </ModalBox>
        </Overlay>
      )}
    </>
  );
}
