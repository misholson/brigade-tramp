import { useState } from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #fff;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  background: #f5f5f5;
`;

const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
  color: #444;
`;

const Chevron = styled.span<{ $open: boolean }>`
  transform: ${p => (p.$open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
  display: inline-block;
  font-size: 0.75rem;
  color: #888;
`;

const Body = styled.div`
  padding: 14px 16px;
  font-size: 0.88rem;
  color: #444;
  line-height: 1.6;
`;

const Item = styled.div`
  margin-bottom: 8px;
  display: flex;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Icon = styled.span`
  flex-shrink: 0;
  width: 20px;
  text-align: center;
`;

export default function HelpCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Header onClick={() => setOpen(o => !o)}>
        <HeaderTitle>Help</HeaderTitle>
        <Chevron $open={open}>▼</Chevron>
      </Header>
      {open && (
        <Body>
          <Item>
            <Icon>👆</Icon>
            <span>Tap a singer's card to mark that you've sung with them. Tap again to unmark.</span>
          </Item>
          <Item>
            <Icon>✓</Icon>
            <span>Your own card is always marked. Cards turn darker when checked off.</span>
          </Item>
          <Item>
            <Icon>🎵</Icon>
            <span>Singers are grouped by part — Tenor, Lead, Baritone, Bass. Each group shows how many singers you still need to sing with.</span>
          </Item>
          <Item>
            <Icon>*</Icon>
            <span>Singers marked with an asterisk (*) are optional and don't count toward your total.</span>
          </Item>
          <Item>
            <Icon>🏆</Icon>
            <span><strong>TRAMP!</strong> appears when you've sung with everyone outside your own part.</span>
          </Item>
          <Item>
            <Icon>⭐</Icon>
            <span><strong>SUPER TRAMP!!</strong> appears when you've sung with everyone at the event.</span>
          </Item>
        </Body>
      )}
    </Card>
  );
}
