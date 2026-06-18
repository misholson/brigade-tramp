import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchEvents, createEvent } from '../store/adminSlice';
import { clearAuth, selectIsSiteAdmin } from '../store/authSlice';
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

const Textarea = styled.textarea`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
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

interface EventFormState { name: string; date: string; endDate: string; allowBusyBee: boolean; emailFooter: string; }

function nextSunday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const daysToAdd = dt.getDay() === 0 ? 7 : 7 - dt.getDay();
  dt.setDate(dt.getDate() + daysToAdd);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { events, status } = useAppSelector(s => s.admin);
  const token = useAppSelector(s => s.auth.token);
  const isSiteAdmin = useAppSelector(selectIsSiteAdmin);

  // Create event
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>({ name: '', date: '', endDate: '', allowBusyBee: false, emailFooter: '' });

  // Site admin management
  const [siteAdminModal, setSiteAdminModal] = useState(false);
  const [siteAdmins, setSiteAdmins] = useState<{ id: number; email: string; name: string }[]>([]);
  const [siteAdminLoading, setSiteAdminLoading] = useState(false);
  const [siteAdminSearch, setSiteAdminSearch] = useState('');
  const [siteAdminSearchResults, setSiteAdminSearchResults] = useState<{ id: number; email: string; name: string }[]>([]);
  const [siteAdminSearching, setSiteAdminSearching] = useState(false);
  const [siteAdminSearchDone, setSiteAdminSearchDone] = useState(false);
  const [selectedSiteAdminUser, setSelectedSiteAdminUser] = useState<{ id: number; email: string; name: string } | null>(null);

  useEffect(() => { dispatch(fetchEvents()); }, [dispatch]);

  const openCreateEvent = () => {
    setEventForm({ name: '', date: '', endDate: '', allowBusyBee: false, emailFooter: '' });
    setIsCreatingEvent(true);
  };

  const handleSaveEvent = () => {
    dispatch(createEvent({ name: eventForm.name, date: eventForm.date, endDate: eventForm.endDate || null, allowBusyBee: eventForm.allowBusyBee, emailFooter: eventForm.emailFooter }));
    setIsCreatingEvent(false);
  };

  const openSiteAdminModal = async () => {
    setSiteAdminModal(true);
    setSiteAdminSearch('');
    setSiteAdminSearchResults([]);
    setSiteAdminSearchDone(false);
    setSelectedSiteAdminUser(null);
    setSiteAdminLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) {
        const all: { id: number; email: string; name: string; isSiteAdmin: boolean }[] = await res.json();
        setSiteAdmins(all.filter(u => u.isSiteAdmin));
      }
    } finally {
      setSiteAdminLoading(false);
    }
  };

  const handleSiteAdminSearch = async (q: string) => {
    setSiteAdminSearch(q);
    setSelectedSiteAdminUser(null);
    setSiteAdminSearchDone(false);
    if (q.length < 2) { setSiteAdminSearchResults([]); return; }
    setSiteAdminSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/users/search?email=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setSiteAdminSearchResults(await res.json());
    } finally {
      setSiteAdminSearching(false);
      setSiteAdminSearchDone(true);
    }
  };

  const handleAddSiteAdmin = async () => {
    if (!selectedSiteAdminUser) return;
    await fetch(`${BASE_URL}/users/${selectedSiteAdminUser.id}/site-admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ isSiteAdmin: true }),
    });
    setSiteAdmins(prev =>
      prev.some(u => u.id === selectedSiteAdminUser.id) ? prev : [...prev, selectedSiteAdminUser]
    );
    setSiteAdminSearch('');
    setSiteAdminSearchResults([]);
    setSiteAdminSearchDone(false);
    setSelectedSiteAdminUser(null);
  };

  const handleRemoveSiteAdmin = async (id: number) => {
    await fetch(`${BASE_URL}/users/${id}/site-admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ isSiteAdmin: false }),
    });
    setSiteAdmins(prev => prev.filter(u => u.id !== id));
  };

  return (
    <Container>
      <Header>
        <Title>Events</Title>
        <TopActions>
          {isSiteAdmin && <Btn $variant="primary" onClick={openCreateEvent}>+ New Event</Btn>}
          <Btn $variant="secondary" onClick={() => navigate('/my-events')}>My Events</Btn>
          <Btn $variant="danger" onClick={() => { dispatch(clearAuth()); navigate('/login'); }}>
            Logout
          </Btn>
        </TopActions>
      </Header>

      {status === 'loading' && <StatusMsg>Loading...</StatusMsg>}
      {status === 'succeeded' && events.length === 0 && (
        <StatusMsg>No events yet. Create one to get started.</StatusMsg>
      )}

      {events.map(ev => <EventCard key={ev.id} event={ev} />)}

      {/* Create event modal */}
      {isCreatingEvent && (
        <Overlay>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>New Event</ModalTitle>
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
              <Input
                id="ev-end-date"
                type="date"
                value={eventForm.endDate}
                onChange={e => setEventForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
            <Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={eventForm.allowBusyBee}
                  onChange={e => setEventForm(f => ({ ...f, allowBusyBee: e.target.checked }))}
                />
                Allow Busy Bee
              </label>
            </Field>
            <Field>
              <Label htmlFor="ev-footer">Email Footer</Label>
              <Textarea
                id="ev-footer"
                value={eventForm.emailFooter}
                onChange={e => setEventForm(f => ({ ...f, emailFooter: e.target.value }))}
              />
              <Hint>Appended to all emails sent for this event.</Hint>
            </Field>
            <ModalActions>
              <Btn $variant="secondary" onClick={() => setIsCreatingEvent(false)}>Cancel</Btn>
              <Btn $variant="primary" onClick={handleSaveEvent} disabled={!eventForm.name || !eventForm.date}>
                Save
              </Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {/* Site admin management */}
      {isSiteAdmin && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Btn $variant="secondary" onClick={openSiteAdminModal}>Manage Site Admins</Btn>
        </div>
      )}

      {siteAdminModal && (
        <Overlay>
          <ModalBox onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <ModalTitle>Site Admins</ModalTitle>

            {siteAdminLoading ? (
              <StatusMsg>Loading…</StatusMsg>
            ) : siteAdmins.length === 0 ? (
              <StatusMsg style={{ padding: '0 0 16px' }}>No site admins yet.</StatusMsg>
            ) : (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {siteAdmins.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{u.name || u.email}</strong>
                      {u.name && <Label as="span" style={{ marginLeft: 6, fontWeight: 400 }}>{u.email}</Label>}
                    </span>
                    <Btn $variant="danger" style={{ padding: '3px 8px', fontSize: '0.75rem' }} disabled={siteAdmins.length <= 1} onClick={() => handleRemoveSiteAdmin(u.id)}>Remove</Btn>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: `1px solid`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label as="div">Add Site Admin</Label>
              <div style={{ position: 'relative' }}>
                <Input
                  placeholder="Search by email…"
                  value={siteAdminSearch}
                  onChange={e => handleSiteAdminSearch(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                {selectedSiteAdminUser && (
                  <Hint>Selected: {selectedSiteAdminUser.name || selectedSiteAdminUser.email}</Hint>
                )}
                {siteAdminSearchDone && !selectedSiteAdminUser && siteAdminSearchResults.length === 0 && (
                  <Hint>No users found.</Hint>
                )}
                {siteAdminSearching && (
                  <SearchDropdown style={{ padding: '6px 10px' }}>
                    <Label as="span">Searching…</Label>
                  </SearchDropdown>
                )}
                {!siteAdminSearching && siteAdminSearchResults.length > 0 && (
                  <SearchDropdown>
                    {siteAdminSearchResults.map(u => (
                      <SearchDropdownItem
                        key={u.id}
                        onMouseDown={() => {
                          setSelectedSiteAdminUser(u);
                          setSiteAdminSearch(u.email);
                          setSiteAdminSearchResults([]);
                          setSiteAdminSearchDone(false);
                        }}
                      >
                        <strong>{u.name}</strong>
                        <Label as="span" style={{ marginLeft: 6, fontWeight: 400 }}>{u.email}</Label>
                      </SearchDropdownItem>
                    ))}
                  </SearchDropdown>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn $variant="primary" disabled={!selectedSiteAdminUser} onClick={handleAddSiteAdmin}>Add</Btn>
              </div>
            </div>

            <ModalActions>
              <Btn $variant="secondary" onClick={() => setSiteAdminModal(false)}>Close</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}
    </Container>
  );
}
