import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateSingerStatus } from '../store/adminSlice';
import type { EventWithSingersDto, SingerDto, SingerStatus } from '../types';

interface Props {
  event: EventWithSingersDto;
  onEdit: (event: EventWithSingersDto) => void;
  onDelete: (id: number) => void;
  onImport: (id: number) => void;
  onDownloadPdf: (id: number) => void;
  onAddSinger: (eventId: number) => void;
  onEditSinger: (singer: SingerDto) => void;
}

const Card = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  cursor: pointer;
  gap: 12px;
`;

const EventInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const EventName = styled.div`
  font-weight: 700;
  font-size: 1rem;
`;

const EventDate = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const Btn = styled.button<{ $variant?: 'danger' | 'primary' | 'secondary' | 'success' }>`
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  background: ${p =>
    p.$variant === 'danger' ? '#c62828'
    : p.$variant === 'primary' ? '#1565c0'
    : p.$variant === 'success' ? '#2e7d32'
    : '#757575'};
  color: #fff;
  white-space: nowrap;
  &:hover { opacity: 0.85; }
`;

const SingerList = styled.div`
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SingerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const PartBadge = styled.span<{ $part: string }>`
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${p => {
    switch (p.$part) {
      case 'Tenor': return '#F9A825';
      case 'Lead': return '#1565C0';
      case 'Baritone': return '#2E7D32';
      case 'Bass': return '#C62828';
      default: return '#888';
    }
  }};
  color: #fff;
`;

const SingerLink = styled(Link)`
  font-size: 0.9rem;
  color: #1565c0;
  text-decoration: none;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { text-decoration: underline; }
`;

const StatusSelect = styled.select<{ $status: SingerStatus }>`
  font-size: 0.78rem;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: ${p =>
    p.$status === 'Inactive' ? '#ffebee'
    : p.$status === 'Optional' ? '#fff8e1'
    : '#e8f5e9'};
  color: ${p =>
    p.$status === 'Inactive' ? '#c62828'
    : p.$status === 'Optional' ? '#f57f17'
    : '#2e7d32'};
  font-weight: 600;
`;

const EmptyMsg = styled.span`
  color: #999;
  font-size: 0.9rem;
`;

export default function EventCard({ event, onEdit, onDelete, onImport, onDownloadPdf, onAddSinger, onEditSinger }: Props) {
  const [expanded, setExpanded] = useState(false);
  const dispatch = useAppDispatch();

  const handleStatusChange = (singerId: number, status: string) => {
    dispatch(updateSingerStatus({ singerId, status }));
  };

  return (
    <Card>
      <CardHeader onClick={() => setExpanded(e => !e)}>
        <EventInfo>
          <EventName>{event.name} {expanded ? '▲' : '▼'}</EventName>
          <EventDate>{event.date} · {event.singers.length} singers</EventDate>
        </EventInfo>
        <Actions onClick={e => e.stopPropagation()}>
          <Btn $variant="secondary" onClick={() => onEdit(event)}>Edit</Btn>
          <Btn $variant="success" onClick={() => onAddSinger(event.id)}>+ Singer</Btn>
          <Btn $variant="secondary" onClick={() => onImport(event.id)}>Import</Btn>
          <Btn $variant="primary" onClick={() => onDownloadPdf(event.id)}>QR PDF</Btn>
          <Btn $variant="danger" onClick={() => onDelete(event.id)}>Delete</Btn>
        </Actions>
      </CardHeader>

      {expanded && (
        <SingerList>
          {event.singers.length === 0 ? (
            <EmptyMsg>No singers yet.</EmptyMsg>
          ) : (
            event.singers.map(s => (
              <SingerRow key={s.id}>
                <PartBadge $part={s.part}>{s.part[0]}</PartBadge>
                <SingerLink to={`/singer/${s.code}`}>
                  {s.badgeName} — {s.firstName} {s.lastName}
                </SingerLink>
                <StatusSelect
                  $status={s.status as SingerStatus}
                  value={s.status}
                  onChange={e => handleStatusChange(s.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="Active">Active</option>
                  <option value="Optional">Optional</option>
                  <option value="Inactive">Inactive</option>
                </StatusSelect>
                <Btn onClick={e => { e.stopPropagation(); onEditSinger(s); }}>Edit</Btn>
              </SingerRow>
            ))
          )}
        </SingerList>
      )}
    </Card>
  );
}
