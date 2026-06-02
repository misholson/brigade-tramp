import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchEvents, updateEvent, addSinger, editSinger, deleteEvent, updateSingerStatus } from '../store/adminSlice';
import { selectIsSiteAdmin } from '../store/authSlice';
import type { SingerDto, SingerStatus, EventUserRoleItemDto } from '../types';
import type { Part } from '../types';
import { BASE_URL } from '../api/apiClient';

/* ── Layout ── */

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px;
`;

const BackLink = styled(Link)`
  font-size: 0.88rem;
  color: ${p => p.theme.colors.textMuted};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 12px;
  &:hover { text-decoration: underline; }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const TitleBlock = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 4px;
`;

const Subtitle = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textMuted};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
`;

const Btn = styled.button<{ $variant?: 'danger' | 'primary' | 'secondary' | 'success' }>`
  padding: 9px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${p =>
    p.$variant === 'danger' ? '#c62828'
    : p.$variant === 'primary' ? '#1565c0'
    : p.$variant === 'success' ? '#2e7d32'
    : '#757575'};
  color: #fff;
  white-space: nowrap;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

/* ── Singer list ── */

const SingerSection = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  background: ${p => p.theme.colors.surface};
`;

const SingerSectionHeader = styled.div`
  padding: 10px 16px;
  background: ${p => p.theme.colors.surfaceAlt};
  font-weight: 700;
  font-size: 0.9rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
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

const SmallBtn = styled.button`
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  background: #757575;
  color: #fff;
  white-space: nowrap;
  &:hover { opacity: 0.85; }
`;

const EmptyMsg = styled.span`
  color: ${p => p.theme.colors.textMuted};
  font-size: 0.9rem;
`;

/* ── Modals ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 10px;
  padding: 28px;
  width: 400px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
`;

const WideModalBox = styled(ModalBox)`
  width: 480px;
`;

const ModalTitle = styled.h2`
  margin: 0 0 20px;
  font-size: 1.2rem;
`;

const Field = styled.div`
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.95rem;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const Select = styled.select`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.95rem;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const Textarea = styled.textarea<{ $readOnly?: boolean }>`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: ${p => p.$readOnly ? 'none' : 'vertical'};
  min-height: 180px;
  background: ${p => p.$readOnly ? p.theme.colors.surfaceAlt : p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  cursor: ${p => p.$readOnly ? 'default' : 'auto'};
  &:focus { outline: ${p => p.$readOnly ? 'none' : `2px solid ${p.theme.colors.focus}`}; border-color: transparent; }
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textMuted};
  margin: 4px 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const RoleBadge = styled.span`
  background: ${p => p.theme.colors.surfaceAlt};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textSecondary};
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.78rem;
  flex-shrink: 0;
`;

const RolesDivider = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SearchDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 4px;
  z-index: 10;
`;

const SearchDropdownItem = styled.div`
  padding: 7px 10px;
  cursor: pointer;
  font-size: 0.88rem;
  border-bottom: 1px solid ${p => p.theme.colors.borderLight};
  color: ${p => p.theme.colors.text};
  &:hover { background: ${p => p.theme.colors.surfaceHover}; }
  &:last-child { border-bottom: none; }
`;

const StatusMsg = styled.div`
  text-align: center;
  padding: 40px;
  color: ${p => p.theme.colors.textMuted};
`;

/* ── Types ── */

interface EventFormState { name: string; date: string; endDate: string; allowBusyBee: boolean; emailFooter: string; }

interface SingerFormState {
  eventId: number;
  badgeName: string;
  firstName: string;
  lastName: string;
  part: string;
  email: string;
  status: string;
}

/* ── Helpers ── */

function nextSunday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const daysToAdd = dt.getDay() === 0 ? 7 : 7 - dt.getDay();
  dt.setDate(dt.getDate() + daysToAdd);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const emptySingerForm = (eventId: number): SingerFormState => ({
  eventId, badgeName: '', firstName: '', lastName: '', part: 'Tenor', email: '', status: 'Active',
});

/* ── Component ── */

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const events = useAppSelector(s => s.admin.events);
  const adminStatus = useAppSelector(s => s.admin.status);
  const token = useAppSelector(s => s.auth.token);
  const user = useAppSelector(s => s.auth.user);
  const isSiteAdmin = useAppSelector(selectIsSiteAdmin);

  const event = events.find(e => e.id === eventId) ?? null;

  const canManage = isSiteAdmin || user?.eventRoles.some(r => r.eventId === eventId && r.role === 'EventAdmin') || false;
  const canViewContest = isSiteAdmin || user?.eventRoles.some(r => r.eventId === eventId && ['EventAdmin', 'ContestAdmin'].includes(r.role)) || false;
  const canView = isSiteAdmin || user?.eventRoles.some(r => r.eventId === eventId) || false;

  // Edit event modal
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>({ name: '', date: '', endDate: '', allowBusyBee: false, emailFooter: '' });

  // Add singer modal
  const [singerForm, setSingerForm] = useState<SingerFormState | null>(null);

  // Edit/view singer modal
  const [editSingerForm, setEditSingerForm] = useState<(SingerFormState & { singerId: number; readOnly: boolean }) | null>(null);

  // Songs modal
  const [songsModal, setSongsModal] = useState<{ text: string; readOnly: boolean } | null>(null);
  const [songsSaving, setSongsSaving] = useState(false);

  // Email modal
  const [emailModal, setEmailModal] = useState(false);
  const [emailSingers, setEmailSingers] = useState<'All' | 'ActiveOnly' | 'NonOptional'>('ActiveOnly');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  // Roles modal
  const [rolesModal, setRolesModal] = useState(false);
  const [eventRoles, setEventRoles] = useState<EventUserRoleItemDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleSearchResults, setRoleSearchResults] = useState<{ id: number; email: string; name: string }[]>([]);
  const [roleSearching, setRoleSearching] = useState(false);
  const [roleSearchDone, setRoleSearchDone] = useState(false);
  const [selectedRoleUserId, setSelectedRoleUserId] = useState<number | null>(null);
  const [selectedRoleUserName, setSelectedRoleUserName] = useState('');
  const [newRole, setNewRole] = useState('EventAdmin');
  const [roleAdding, setRoleAdding] = useState(false);
  const [roleEmailSending, setRoleEmailSending] = useState(false);

  useEffect(() => { dispatch(fetchEvents()); }, [dispatch]);

  useEffect(() => {
    if (adminStatus === 'succeeded' && !event) navigate('/admin');
  }, [adminStatus, event, navigate]);

  if (!event) {
    return <Container><StatusMsg>{adminStatus === 'loading' ? 'Loading…' : 'Event not found.'}</StatusMsg></Container>;
  }

  /* ── Handlers ── */

  const openEditEvent = () => {
    setEventForm({ name: event.name, date: event.date, endDate: event.endDate ?? '', allowBusyBee: event.allowBusyBee, emailFooter: event.emailFooter });
    setEditingEvent(true);
  };

  const handleSaveEvent = () => {
    dispatch(updateEvent({ id: eventId, name: eventForm.name, date: eventForm.date, endDate: eventForm.endDate || null, allowBusyBee: eventForm.allowBusyBee, emailFooter: eventForm.emailFooter }));
    setEditingEvent(false);
  };

  const handleDeleteEvent = () => {
    if (window.confirm('Delete this event and all its singers?')) {
      dispatch(deleteEvent(eventId));
      navigate('/admin');
    }
  };

  const handleDownloadPdf = async () => {
    const res = await fetch(`${BASE_URL}/events/${eventId}/qr-pdf?origin=${encodeURIComponent(window.location.origin)}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) { alert('Failed to generate PDF'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcodes-event-${eventId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSinger = () => {
    if (!singerForm) return;
    dispatch(addSinger(singerForm));
    setSingerForm(null);
  };

  const openEditSinger = (singer: SingerDto, readOnly = false) => {
    setEditSingerForm({
      singerId: singer.id,
      eventId,
      badgeName: singer.badgeName,
      firstName: singer.firstName,
      lastName: singer.lastName,
      part: singer.part,
      email: singer.email,
      status: singer.status,
      readOnly,
    });
  };

  const handleSaveEditSinger = () => {
    if (!editSingerForm) return;
    dispatch(editSinger(editSingerForm));
    setEditSingerForm(null);
  };

  const openSongs = async () => {
    const res = await fetch(`${BASE_URL}/events/${eventId}/songs`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    const titles: string[] = res.ok ? await res.json() : [];
    setSongsModal({ text: titles.join('\n'), readOnly: !canManage });
  };

  const handleSaveSongs = async () => {
    if (!songsModal) return;
    setSongsSaving(true);
    const titles = songsModal.text.split('\n').map(t => t.trim()).filter(Boolean);
    await fetch(`${BASE_URL}/events/${eventId}/songs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ titles }),
    });
    setSongsSaving(false);
    setSongsModal(null);
  };

  const openEmailModal = () => {
    setEmailSingers('ActiveOnly');
    setEmailSubject('');
    setEmailBody('');
    setEmailModal(true);
  };

  const handleSendEmails = async () => {
    setSendingEmails(true);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ singers: emailSingers, subject: emailSubject, body: emailBody }),
      });
      if (!res.ok) { alert('Failed to send emails. Check that ACS is configured on the server.'); return; }
      setEmailModal(false);
    } finally {
      setSendingEmails(false);
    }
  };

  const openRolesModal = async () => {
    setRolesModal(true);
    setRoleSearch('');
    setRoleSearchResults([]);
    setRoleSearchDone(false);
    setSelectedRoleUserId(null);
    setSelectedRoleUserName('');
    setNewRole('EventAdmin');
    setRolesLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/users`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setEventRoles(await res.json());
    } finally {
      setRolesLoading(false);
    }
  };

  const handleRoleSearch = async (q: string) => {
    setRoleSearch(q);
    setSelectedRoleUserId(null);
    setSelectedRoleUserName('');
    setRoleSearchDone(false);
    if (q.length < 2) { setRoleSearchResults([]); return; }
    setRoleSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/users/search?email=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setRoleSearchResults(await res.json());
    } finally {
      setRoleSearching(false);
      setRoleSearchDone(true);
    }
  };

  const selectRoleSearchUser = (u: { id: number; email: string; name: string }) => {
    setSelectedRoleUserId(u.id);
    setSelectedRoleUserName(u.name || u.email);
    setRoleSearch(u.email);
    setRoleSearchResults([]);
    setRoleSearchDone(false);
  };

  const handleAddRole = async () => {
    if (selectedRoleUserId == null) return;
    setRoleAdding(true);
    try {
      await fetch(`${BASE_URL}/users/event-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ userId: selectedRoleUserId, eventId, role: newRole }),
      });
      fetch(`${BASE_URL}/events/${eventId}/send-role-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ email: roleSearch, role: newRole }),
      });
      const res = await fetch(`${BASE_URL}/events/${eventId}/users`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setEventRoles(await res.json());
      setRoleSearch('');
      setRoleSearchDone(false);
      setSelectedRoleUserId(null);
      setSelectedRoleUserName('');
    } finally {
      setRoleAdding(false);
    }
  };

  const handleSendInvite = async () => {
    if (!roleSearch.includes('@')) return;
    setRoleEmailSending(true);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/send-role-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ email: roleSearch, role: newRole }),
      });
      if (!res.ok) alert('Failed to send invite. Check that ACS is configured on the server.');
    } finally {
      setRoleEmailSending(false);
    }
  };

  const handleRemoveRole = async (item: EventUserRoleItemDto) => {
    await fetch(`${BASE_URL}/users/event-roles`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ userId: item.userId, eventId, role: item.role }),
    });
    setEventRoles(prev => prev.filter(r => !(r.userId === item.userId && r.role === item.role)));
  };

  /* ── Render ── */

  return (
    <Container>
      <BackLink to="/admin">← Events</BackLink>

      <TitleRow>
        <TitleBlock>
          <Title>{event.name}</Title>
          <Subtitle>
            {event.date}{event.endDate ? ` – ${event.endDate}` : ''} · {event.singers.length} singers
          </Subtitle>
        </TitleBlock>
        <ActionRow>
          {canManage && <Btn $variant="secondary" onClick={openEditEvent}>Edit</Btn>}
          {canManage && <Btn $variant="success" onClick={() => setSingerForm(emptySingerForm(eventId))}>+ Singer</Btn>}
          {canManage && <Btn $variant="secondary" onClick={() => navigate(`/import?eventId=${eventId}`)}>Import</Btn>}
          {canViewContest && <Btn $variant="secondary" onClick={() => navigate(`/contests?eventId=${eventId}`)}>Contests</Btn>}
          {(canManage || canView) && <Btn $variant="secondary" onClick={openSongs}>Songs</Btn>}
          {(canManage || canView) && <Btn $variant="primary" onClick={handleDownloadPdf}>QR PDF</Btn>}
          {(canManage || canView) && <Btn $variant="secondary" onClick={openEmailModal}>Email</Btn>}
          {canManage && <Btn $variant="secondary" onClick={openRolesModal}>Roles</Btn>}
          {isSiteAdmin && <Btn $variant="danger" onClick={handleDeleteEvent}>Delete</Btn>}
        </ActionRow>
      </TitleRow>

      <SingerSection>
        <SingerSectionHeader>Singers ({event.singers.length})</SingerSectionHeader>
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
                    onChange={e => dispatch(updateSingerStatus({ singerId: s.id, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Optional">Optional</option>
                    <option value="Inactive">Inactive</option>
                  </StatusSelect>
                ) : (
                  <span style={{ fontSize: '0.78rem' }}>{s.status}</span>
                )}
                {(canManage || canView) && (
                  <SmallBtn onClick={() => openEditSinger(s, !canManage)}>
                    {canManage ? 'Edit' : 'View'}
                  </SmallBtn>
                )}
              </SingerRow>
            ))
          )}
        </SingerList>
      </SingerSection>

      {/* Edit event modal */}
      {editingEvent && (
        <Overlay onClick={() => setEditingEvent(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Edit Event</ModalTitle>
            <Field>
              <Label htmlFor="ev-name">Name</Label>
              <Input id="ev-name" value={eventForm.name} onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </Field>
            <Field>
              <Label htmlFor="ev-date">Start Date</Label>
              <Input
                id="ev-date"
                type="date"
                value={eventForm.date}
                onChange={e => {
                  const date = e.target.value;
                  setEventForm(f => ({ ...f, date, endDate: date ? nextSunday(date) : '' }));
                }}
              />
            </Field>
            <Field>
              <Label htmlFor="ev-end-date">End Date</Label>
              <Input id="ev-end-date" type="date" value={eventForm.endDate} onChange={e => setEventForm(f => ({ ...f, endDate: e.target.value }))} />
            </Field>
            <Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={eventForm.allowBusyBee} onChange={e => setEventForm(f => ({ ...f, allowBusyBee: e.target.checked }))} />
                Allow Busy Bee
              </label>
            </Field>
            <Field>
              <Label htmlFor="ev-footer">Email Footer</Label>
              <Textarea id="ev-footer" value={eventForm.emailFooter} onChange={e => setEventForm(f => ({ ...f, emailFooter: e.target.value }))} style={{ minHeight: '80px' }} />
              <Hint>Appended to all emails sent for this event.</Hint>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setEditingEvent(false)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveEvent} disabled={!eventForm.name || !eventForm.date}>Save</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Edit/view singer modal */}
      {editSingerForm && (
        <Overlay onClick={() => setEditSingerForm(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>{editSingerForm.readOnly ? 'Singer Details' : 'Edit Singer'}</ModalTitle>
            <Field>
              <Label>Badge Name</Label>
              <Input value={editSingerForm.badgeName} readOnly={editSingerForm.readOnly} autoFocus onChange={e => setEditSingerForm(f => f && ({ ...f, badgeName: e.target.value }))} />
            </Field>
            <Field>
              <Label>First Name</Label>
              <Input value={editSingerForm.firstName} readOnly={editSingerForm.readOnly} onChange={e => setEditSingerForm(f => f && ({ ...f, firstName: e.target.value }))} />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input value={editSingerForm.lastName} readOnly={editSingerForm.readOnly} onChange={e => setEditSingerForm(f => f && ({ ...f, lastName: e.target.value }))} />
            </Field>
            <Field>
              <Label>Email</Label>
              <Input type="email" value={editSingerForm.email} readOnly={editSingerForm.readOnly} onChange={e => setEditSingerForm(f => f && ({ ...f, email: e.target.value }))} />
            </Field>
            <Field>
              <Label>Part</Label>
              <Select value={editSingerForm.part} disabled={editSingerForm.readOnly} onChange={e => setEditSingerForm(f => f && ({ ...f, part: e.target.value }))}>
                <option>Tenor</option><option>Lead</option><option>Baritone</option><option>Bass</option>
              </Select>
            </Field>
            <Field>
              <Label>Status</Label>
              <Select value={editSingerForm.status} disabled={editSingerForm.readOnly} onChange={e => setEditSingerForm(f => f && ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Optional</option><option>Inactive</option>
              </Select>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setEditSingerForm(null)}>{editSingerForm.readOnly ? 'Close' : 'Cancel'}</Btn>
              {!editSingerForm.readOnly && <Btn $variant="primary" onClick={handleSaveEditSinger} disabled={!editSingerForm.badgeName}>Save</Btn>}
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Add singer modal */}
      {singerForm && (
        <Overlay onClick={() => setSingerForm(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Add Singer</ModalTitle>
            <Field>
              <Label>Badge Name</Label>
              <Input value={singerForm.badgeName} autoFocus onChange={e => setSingerForm(f => f && ({ ...f, badgeName: e.target.value }))} />
            </Field>
            <Field>
              <Label>First Name</Label>
              <Input value={singerForm.firstName} onChange={e => setSingerForm(f => f && ({ ...f, firstName: e.target.value }))} />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input value={singerForm.lastName} onChange={e => setSingerForm(f => f && ({ ...f, lastName: e.target.value }))} />
            </Field>
            <Field>
              <Label>Email</Label>
              <Input type="email" value={singerForm.email} onChange={e => setSingerForm(f => f && ({ ...f, email: e.target.value }))} />
            </Field>
            <Field>
              <Label>Part</Label>
              <Select value={singerForm.part} onChange={e => setSingerForm(f => f && ({ ...f, part: e.target.value }))}>
                <option>Tenor</option><option>Lead</option><option>Baritone</option><option>Bass</option>
              </Select>
            </Field>
            <Field>
              <Label>Status</Label>
              <Select value={singerForm.status} onChange={e => setSingerForm(f => f && ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Optional</option><option>Inactive</option>
              </Select>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setSingerForm(null)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveSinger} disabled={!singerForm.badgeName}>Add</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Songs modal */}
      {songsModal && (
        <Overlay onClick={() => setSongsModal(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Songs</ModalTitle>
            <Field>
              <Label>Song list</Label>
              <Textarea
                autoFocus
                readOnly={songsModal.readOnly}
                $readOnly={songsModal.readOnly}
                value={songsModal.text}
                onChange={e => !songsModal.readOnly && setSongsModal(m => m && ({ ...m, text: e.target.value }))}
              />
              {!songsModal.readOnly && <Hint>One song title per line.</Hint>}
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setSongsModal(null)}>{songsModal.readOnly ? 'Close' : 'Cancel'}</Btn>
              {!songsModal.readOnly && <Btn $variant="primary" onClick={handleSaveSongs} disabled={songsSaving}>{songsSaving ? 'Saving…' : 'Save'}</Btn>}
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Email singers modal */}
      {emailModal && (
        <Overlay onClick={() => setEmailModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Email Singers</ModalTitle>
            <Field>
              <Label htmlFor="email-singers">Singers</Label>
              <Select id="email-singers" value={emailSingers} onChange={e => setEmailSingers(e.target.value as 'All' | 'ActiveOnly' | 'NonOptional')}>
                <option value="All">All</option>
                <option value="ActiveOnly">Active only</option>
                <option value="NonOptional">All non-optional</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="email-subject">Subject</Label>
              <Input id="email-subject" autoFocus value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
              <Hint>Event name will be prepended in square brackets, e.g. [{event.name}] Your Subject</Hint>
            </Field>
            <Field>
              <Label htmlFor="email-body">Body</Label>
              <Textarea id="email-body" value={emailBody} onChange={e => setEmailBody(e.target.value)} />
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setEmailModal(false)}>Cancel</Btn>
              <Btn $variant="primary" disabled={sendingEmails || !emailSubject.trim() || !emailBody.trim()} onClick={handleSendEmails}>
                {sendingEmails ? 'Sending…' : 'Send Emails'}
              </Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Manage event roles modal */}
      {rolesModal && (
        <Overlay onClick={() => setRolesModal(false)}>
          <WideModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Event Roles</ModalTitle>

            {rolesLoading ? (
              <StatusMsg>Loading…</StatusMsg>
            ) : eventRoles.length === 0 ? (
              <StatusMsg style={{ padding: '0 0 16px' }}>No roles assigned yet.</StatusMsg>
            ) : (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eventRoles.map(r => (
                  <div key={`${r.userId}-${r.role}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'inherit' }}>
                      <strong>{r.name || r.email}</strong>
                      {r.name && <Label as="span" style={{ marginLeft: 6, fontWeight: 400 }}>{r.email}</Label>}
                    </span>
                    <RoleBadge>{r.role}</RoleBadge>
                    <Btn $variant="danger" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleRemoveRole(r)}>Remove</Btn>
                  </div>
                ))}
              </div>
            )}

            <RolesDivider>
              <Label as="div">Add Role</Label>
              <div style={{ position: 'relative' }}>
                <Input placeholder="Search by email…" value={roleSearch} onChange={e => handleRoleSearch(e.target.value)} autoComplete="off" />
                {selectedRoleUserId != null && <Hint>Selected: {selectedRoleUserName}</Hint>}
                {roleSearchDone && selectedRoleUserId == null && roleSearchResults.length === 0 && roleSearch.includes('@') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <Hint style={{ margin: 0 }}>No account found.</Hint>
                    <Btn $variant="secondary" style={{ padding: '3px 10px', fontSize: '0.8rem' }} disabled={roleEmailSending} onClick={handleSendInvite}>
                      {roleEmailSending ? 'Sending…' : 'Email Invite'}
                    </Btn>
                  </div>
                )}
                {roleSearching && (
                  <SearchDropdown style={{ padding: '6px 10px' }}>
                    <Label as="span">Searching…</Label>
                  </SearchDropdown>
                )}
                {!roleSearching && roleSearchResults.length > 0 && (
                  <SearchDropdown>
                    {roleSearchResults.map(u => (
                      <SearchDropdownItem key={u.id} onMouseDown={() => selectRoleSearchUser(u)}>
                        <strong>{u.name}</strong>
                        <Label as="span" style={{ marginLeft: 6, fontWeight: 400 }}>{u.email}</Label>
                      </SearchDropdownItem>
                    ))}
                  </SearchDropdown>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ flex: 1 }}>
                  <option value="EventAdmin">EventAdmin</option>
                  <option value="EventUser">EventUser</option>
                  <option value="ContestAdmin">ContestAdmin</option>
                </Select>
                <Btn $variant="primary" disabled={selectedRoleUserId == null || roleAdding} onClick={handleAddRole}>
                  {roleAdding ? 'Adding…' : 'Add'}
                </Btn>
              </div>
            </RolesDivider>

            <ModalActions>
              <Btn $variant="secondary" onClick={() => setRolesModal(false)}>Close</Btn>
            </ModalActions>
          </WideModalBox>
        </Overlay>
      )}
    </Container>
  );
}
