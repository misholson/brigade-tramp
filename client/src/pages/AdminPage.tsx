import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchEvents, createEvent, updateEvent, deleteEvent, addSinger, editSinger } from '../store/adminSlice';
import { clearCredentials } from '../store/authSlice';
import type { EventWithSingersDto, SingerDto } from '../types';
import EventCard from '../components/EventCard';
import { BASE_URL } from '../api/apiClient';

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const TopActions = styled.div`
  display: flex;
  gap: 8px;
`;

const Btn = styled.button<{ $variant?: 'danger' | 'primary' | 'secondary' }>`
  padding: 9px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${p =>
    p.$variant === 'danger' ? '#c62828' : p.$variant === 'primary' ? '#1565c0' : '#757575'};
  color: #fff;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

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

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Textarea = styled.textarea`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 180px;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textMuted};
  margin: 4px 0 0;
`;

const StatusMsg = styled.div`
  text-align: center;
  padding: 40px;
  color: ${p => p.theme.colors.textMuted};
`;

interface EventFormState { name: string; date: string; }
interface SingerFormState {
  eventId: number;
  badgeName: string;
  firstName: string;
  lastName: string;
  part: string;
  email: string;
  status: string;
}

const emptySingerForm = (eventId: number): SingerFormState => ({
  eventId, badgeName: '', firstName: '', lastName: '', part: 'Tenor', email: '', status: 'Active',
});

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { events, status } = useAppSelector(s => s.admin);
  const credentials = useAppSelector(s => s.auth.credentials);

  const [editEvent, setEditEvent] = useState<EventWithSingersDto | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>({ name: '', date: '' });

  const [singerForm, setSingerForm] = useState<SingerFormState | null>(null);
  const [editSingerForm, setEditSingerForm] = useState<(SingerFormState & { singerId: number }) | null>(null);
  const [songsModal, setSongsModal] = useState<{ eventId: number; text: string } | null>(null);
  const [songsSaving, setSongsSaving] = useState(false);

  useEffect(() => { dispatch(fetchEvents()); }, [dispatch]);

  const openCreateEvent = () => {
    setEventForm({ name: '', date: '' });
    setIsCreatingEvent(true);
  };

  const openEditEvent = (ev: EventWithSingersDto) => {
    setEventForm({ name: ev.name, date: ev.date });
    setEditEvent(ev);
  };

  const closeEventModal = () => {
    setIsCreatingEvent(false);
    setEditEvent(null);
  };

  const handleSaveEvent = () => {
    if (editEvent) {
      dispatch(updateEvent({ id: editEvent.id, ...eventForm }));
    } else {
      dispatch(createEvent(eventForm));
    }
    closeEventModal();
  };

  const handleDeleteEvent = (id: number) => {
    if (window.confirm('Delete this event and all its singers?')) dispatch(deleteEvent(id));
  };

  const handleDownloadPdf = async (id: number) => {
    const res = await fetch(`${BASE_URL}/events/${id}/qr-pdf?origin=${encodeURIComponent(window.location.origin)}`, {
      headers: { Authorization: `Basic ${credentials ?? ''}` },
    });
    if (!res.ok) { alert('Failed to generate PDF'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcodes-event-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSinger = () => {
    if (!singerForm) return;
    dispatch(addSinger(singerForm));
    setSingerForm(null);
  };

  const openEditSinger = (singer: SingerDto) => {
    setEditSingerForm({
      singerId: singer.id,
      eventId: 0,
      badgeName: singer.badgeName,
      firstName: singer.firstName,
      lastName: singer.lastName,
      part: singer.part,
      email: singer.email,
      status: singer.status,
    });
  };

  const openSongs = async (eventId: number) => {
    const res = await fetch(`${BASE_URL}/events/${eventId}/songs`, {
      headers: { Authorization: `Basic ${credentials ?? ''}` },
    });
    const titles: string[] = res.ok ? await res.json() : [];
    setSongsModal({ eventId, text: titles.join('\n') });
  };

  const handleSaveSongs = async () => {
    if (!songsModal) return;
    setSongsSaving(true);
    const titles = songsModal.text.split('\n').map(t => t.trim()).filter(Boolean);
    await fetch(`${BASE_URL}/events/${songsModal.eventId}/songs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${credentials ?? ''}` },
      body: JSON.stringify({ titles }),
    });
    setSongsSaving(false);
    setSongsModal(null);
  };

  const handleSaveEditSinger = () => {
    if (!editSingerForm) return;
    dispatch(editSinger(editSingerForm));
    setEditSingerForm(null);
  };

  return (
    <Container>
      <Header>
        <Title>Events</Title>
        <TopActions>
          <Btn $variant="primary" onClick={openCreateEvent}>+ New Event</Btn>
          <Btn $variant="danger" onClick={() => { dispatch(clearCredentials()); navigate('/login'); }}>
            Logout
          </Btn>
        </TopActions>
      </Header>

      {status === 'loading' && <StatusMsg>Loading...</StatusMsg>}
      {status === 'succeeded' && events.length === 0 && (
        <StatusMsg>No events yet. Create one to get started.</StatusMsg>
      )}

      {events.map(ev => (
        <EventCard
          key={ev.id}
          event={ev}
          onEdit={openEditEvent}
          onDelete={handleDeleteEvent}
          onImport={id => navigate(`/import?eventId=${id}`)}
          onDownloadPdf={handleDownloadPdf}
          onAddSinger={id => setSingerForm(emptySingerForm(id))}
          onEditSinger={openEditSinger}
          onContests={id => navigate(`/contests?eventId=${id}`)}
          onSongs={openSongs}
        />
      ))}

      {/* Event create/edit modal */}
      {(isCreatingEvent || editEvent) && (
        <Overlay onClick={closeEventModal}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>{editEvent ? 'Edit Event' : 'New Event'}</ModalTitle>
            <Field>
              <Label htmlFor="ev-name">Name</Label>
              <Input
                id="ev-name"
                value={eventForm.name}
                onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field>
              <Label htmlFor="ev-date">Date</Label>
              <Input
                id="ev-date"
                type="date"
                value={eventForm.date}
                onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={closeEventModal}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveEvent} disabled={!eventForm.name || !eventForm.date}>
                Save
              </Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Edit singer modal */}
      {editSingerForm && (
        <Overlay onClick={() => setEditSingerForm(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Edit Singer</ModalTitle>
            <Field>
              <Label>Badge Name</Label>
              <Input
                value={editSingerForm.badgeName}
                onChange={e => setEditSingerForm(f => f && ({ ...f, badgeName: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field>
              <Label>First Name</Label>
              <Input
                value={editSingerForm.firstName}
                onChange={e => setEditSingerForm(f => f && ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={editSingerForm.lastName}
                onChange={e => setEditSingerForm(f => f && ({ ...f, lastName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Email</Label>
              <Input
                type="email"
                value={editSingerForm.email}
                onChange={e => setEditSingerForm(f => f && ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Part</Label>
              <Select
                value={editSingerForm.part}
                onChange={e => setEditSingerForm(f => f && ({ ...f, part: e.target.value }))}
              >
                <option>Tenor</option>
                <option>Lead</option>
                <option>Baritone</option>
                <option>Bass</option>
              </Select>
            </Field>
            <Field>
              <Label>Status</Label>
              <Select
                value={editSingerForm.status}
                onChange={e => setEditSingerForm(f => f && ({ ...f, status: e.target.value }))}
              >
                <option>Active</option>
                <option>Optional</option>
                <option>Inactive</option>
              </Select>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setEditSingerForm(null)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveEditSinger} disabled={!editSingerForm.badgeName}>
                Save
              </Btn>
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
                value={songsModal.text}
                onChange={e => setSongsModal(m => m && ({ ...m, text: e.target.value }))}
              />
              <Hint>One song title per line.</Hint>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setSongsModal(null)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveSongs} disabled={songsSaving}>
                {songsSaving ? 'Saving…' : 'Save'}
              </Btn>
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
              <Input
                value={singerForm.badgeName}
                onChange={e => setSingerForm(f => f && ({ ...f, badgeName: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field>
              <Label>First Name</Label>
              <Input
                value={singerForm.firstName}
                onChange={e => setSingerForm(f => f && ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={singerForm.lastName}
                onChange={e => setSingerForm(f => f && ({ ...f, lastName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Email</Label>
              <Input
                type="email"
                value={singerForm.email}
                onChange={e => setSingerForm(f => f && ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field>
              <Label>Part</Label>
              <Select
                value={singerForm.part}
                onChange={e => setSingerForm(f => f && ({ ...f, part: e.target.value }))}
              >
                <option>Tenor</option>
                <option>Lead</option>
                <option>Baritone</option>
                <option>Bass</option>
              </Select>
            </Field>
            <Field>
              <Label>Status</Label>
              <Select
                value={singerForm.status}
                onChange={e => setSingerForm(f => f && ({ ...f, status: e.target.value }))}
              >
                <option>Active</option>
                <option>Optional</option>
                <option>Inactive</option>
              </Select>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setSingerForm(null)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveSinger} disabled={!singerForm.badgeName}>
                Add
              </Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}
    </Container>
  );
}
