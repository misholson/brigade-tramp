import { useState } from 'react';
import styled from 'styled-components';

export interface PublicSinger {
  badgeName: string;
  lastName: string;
  part: string;
  email: string;
}

export interface PublicQuartet {
  name: string;
  singers: PublicSinger[];
}

export interface PublicContest {
  name: string;
  quartets: PublicQuartet[];
}

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
  padding: 10px 16px;
`;

const QuartetSection = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
`;

const QuartetName = styled.div`
  font-weight: 600;
  font-size: 0.88rem;
  color: #555;
  margin-bottom: 6px;
`;

const SingerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  flex-wrap: wrap;
`;

const PartDot = styled.span<{ $part: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: ${p => {
    switch (p.$part) {
      case 'Tenor':    return '#F9A825';
      case 'Lead':     return '#1565C0';
      case 'Baritone': return '#2E7D32';
      case 'Bass':     return '#C62828';
      default:         return '#888';
    }
  }};
`;

const SingerName = styled.span`
  font-size: 0.88rem;
  color: #333;
`;

const EmailLink = styled.a`
  font-size: 0.82rem;
  color: #1565c0;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

interface Props {
  contest: PublicContest;
}

export default function ContestInfoCard({ contest }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Header onClick={() => setOpen(o => !o)}>
        <HeaderTitle>Contest — {contest.name}</HeaderTitle>
        <Chevron $open={open}>▼</Chevron>
      </Header>
      {open && (
        <Body>
          {contest.quartets.map((quartet, i) => (
            <QuartetSection key={i}>
              <QuartetName>{quartet.name}</QuartetName>
              {quartet.singers.map((singer, j) => (
                <SingerRow key={j}>
                  <PartDot $part={singer.part}>{singer.part[0]}</PartDot>
                  <SingerName>{singer.badgeName} {singer.lastName}</SingerName>
                  {singer.email && (
                    <EmailLink href={`mailto:${singer.email}`}>{singer.email}</EmailLink>
                  )}
                </SingerRow>
              ))}
            </QuartetSection>
          ))}
        </Body>
      )}
    </Card>
  );
}
