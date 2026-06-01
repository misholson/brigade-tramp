import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateSingerStatus } from '../store/adminSlice';
import type { EventWithSingersDto, SingerDto, SingerStatus } from '../types';
import type { Part } from '../types';

interface Props {
  event: EventWithSingersDto;
  onEdit: (event: EventWithSingersDto) => void;
  onDelete: (id: number) => void;
  onImport: (id: number) => void;
  onDownloadPdf: (id: number) => void;
  onAddSinger: (eventId: number) => void;
  onEditSinger: (singer: SingerDto, readOnly: boolean) => void;
  onContests: (eventId: number) => void;
  onSongs: (eventId: number) => void;
  onEmail: (event: EventWithSingersDto) => void;
  onManageRoles: (eventId: number) => void;
  canDelete?: boolean;
  canManage?: boolean;
  canViewContest?: boolean;
  canView?: boolean;
}

const Card = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  background: ${p => p.theme.colors.surface};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${p => p.theme.colors.surfaceAlt};
  cursor: pointer;
  gap: 8px;
  flex-wrap: wrap;
`;

const EventInfo = styled.div`
  flex: 1;
  min-width: 0;
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

const Actions = styled.div`
  display: flex;
  gap: 6px;
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
  background: ${p => p.theme.parts[p.$part as Part]?.dark ?? '#888'};
  color: #fff;
`;

const SingerLink = styled(Link)`
  font-size: 0.9rem;
  color: ${p => p.theme.colors.link};
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
  border: 1px solid ${p => p.theme.colors.inputBorder};
  cursor: pointer;
  background: ${p => p.theme.colors.statusColors[p.$status].bg};
  color: ${p => p.theme.colors.statusColors[p.$status].text};
  font-weight: 600;
`;

const EmptyMsg = styled.span`
  color: ${p => p.theme.colors.textMuted};
  font-size: 0.9rem;
`;

export default function EventCard({ event, onEdit, onDelete, onImport, onDownloadPdf, onAddSinger, onEditSinger, onContests, onSongs, onEmail, onManageRoles, canDelete, canManage = true, canViewContest = true, canView = true }: Props) {
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
          <EventDate>
            {event.date}{event.endDate ? ` – ${event.endDate}` : ''} · {event.singers.length} singers
          </EventDate>
        </EventInfo>
        <Actions onClick={e => e.stopPropagation()}>
          {canManage && <Btn $variant="secondary" onClick={() => onEdit(event)}>Edit</Btn>}
          {canManage && <Btn $variant="success" onClick={() => onAddSinger(event.id)}>+ Singer</Btn>}
          {canManage && <Btn $variant="secondary" onClick={() => onImport(event.id)}>Import</Btn>}
          {canViewContest && <Btn $variant="secondary" onClick={() => onContests(event.id)}>Contests</Btn>}
          {(canManage || canView) && <Btn $variant="secondary" onClick={() => onSongs(event.id)}>Songs</Btn>}
          {(canManage || canView) && <Btn $variant="secondary" onClick={() => onDownloadPdf(event.id)}>QR PDF</Btn>}
          {(canManage || canView) && <Btn $variant="secondary" onClick={() => onEmail(event)}>Email</Btn>}
          {canManage && <Btn $variant="secondary" onClick={() => onManageRoles(event.id)}>Roles</Btn>}
          {canDelete && <Btn $variant="danger" onClick={() => onDelete(event.id)}>Delete</Btn>}
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
                {canManage ? (
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
                ) : (
                  <span style={{ fontSize: '0.78rem' }}>{s.status}</span>
                )}
                {(canManage || canView) && (
                  <Btn onClick={e => { e.stopPropagation(); onEditSinger(s, !canManage); }}>
                    {canManage ? 'Edit' : 'View'}
                  </Btn>
                )}
              </SingerRow>
            ))
          )}
        </SingerList>
      )}
    </Card>
  );
}
