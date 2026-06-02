import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { EventWithSingersDto } from '../types';

interface Props {
  event: EventWithSingersDto;
}

const Card = styled(Link)`
  display: block;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  margin-bottom: 12px;
  background: ${p => p.theme.colors.surface};
  padding: 16px;
  text-decoration: none;
  color: inherit;
  &:hover { background: ${p => p.theme.colors.surfaceHover}; }
`;

const EventName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: ${p => p.theme.colors.text};
`;

const EventDate = styled.div`
  font-size: 0.8rem;
  color: ${p => p.theme.colors.textMuted};
  margin-top: 2px;
`;

export default function EventCard({ event }: Props) {
  return (
    <Card to={`/admin/events/${event.id}`}>
      <EventName>{event.name}</EventName>
      <EventDate>
        {event.date}{event.endDate ? ` – ${event.endDate}` : ''} · {event.singers.length} singers
      </EventDate>
    </Card>
  );
}
