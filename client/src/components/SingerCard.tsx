import styled from 'styled-components';
import type { Part } from '../types';

interface Props {
  badgeName: string;
  firstName: string;
  lastName: string;
  part: Part;
  isSelected: boolean;
  isSelf: boolean;
  isOptional?: boolean;
  onClick: () => void;
}

const Card = styled.div<{ $part: Part; $selected: boolean; $isSelf: boolean }>`
  border-radius: ${p => p.theme.cardBorderRadius};
  padding: 10px 8px;
  cursor: pointer;
  background-color: ${p =>
    p.$selected || p.$isSelf
      ? p.theme.parts[p.$part].dark
      : p.theme.parts[p.$part].light};
  color: ${p => (p.$selected || p.$isSelf ? '#fff' : '#222')};
  transition: background-color 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
  position: relative;
  min-width: 0;
`;

const BadgeName = styled.span`
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 18px;
`;

const FullName = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Check = styled.span`
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.9rem;
`;

const OptionalMark = styled.span`
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.75;
  margin-left: 2px;
`;

export default function SingerCard({ badgeName, firstName, lastName, part, isSelected, isSelf, isOptional, onClick }: Props) {
  return (
    <Card $part={part} $selected={isSelected} $isSelf={isSelf} onClick={onClick}>
      {(isSelected || isSelf) && <Check>✓</Check>}
      <BadgeName>{badgeName}{isOptional && <OptionalMark>*</OptionalMark>}</BadgeName>
      <FullName>{firstName} {lastName}</FullName>
    </Card>
  );
}
