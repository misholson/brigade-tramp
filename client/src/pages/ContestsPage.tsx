import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSelector } from '../hooks/useAppDispatch';
import { BASE_URL } from '../api/apiClient';

const BREAKPOINT = '640px';

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 16px;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
`;

const TitleBlock = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const Sub = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textMuted};
  margin-top: 3px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${p =>
    p.$variant === 'primary' ? '#1565c0'
    : p.$variant === 'danger' ? '#c62828'
    : '#757575'};
  color: #fff;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const ContestCard = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  margin-bottom: 14px;
  background: ${p => p.theme.colors.surface};
  overflow: hidden;
`;

const ContestHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${p => p.theme.colors.surfaceAlt};
  gap: 12px;
  flex-wrap: wrap;
`;

const ContestName = styled.div`
  font-weight: 700;
  font-size: 1rem;
`;

const ContestActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

/* ── Responsive visibility ── */

const DesktopOnly = styled.div`
  display: none;
  @media (min-width: ${BREAKPOINT}) { display: block; }
`;

const MobileOnly = styled.div`
  display: block;
  @media (min-width: ${BREAKPOINT}) { display: none; }
`;

/* ── Desktop table ── */

const QuartetTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const Th = styled.th<{ $part?: string }>`
  padding: 7px 10px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  border-bottom: 2px solid ${p => p.theme.colors.border};
  white-space: nowrap;
  color: ${p => p.$part
    ? (p.theme.parts[p.$part as 'Tenor' | 'Lead' | 'Baritone' | 'Bass']?.labelColor ?? p.theme.colors.textSecondary)
    : p.theme.colors.textSecondary};
`;

const Td = styled.td`
  padding: 6px 10px;
  border-bottom: 1px solid ${p => p.theme.colors.borderLight};
  white-space: nowrap;
  color: ${p => p.theme.colors.text};
`;

const NameInput = styled.input`
  width: 120px;
  padding: 3px 6px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 4px;
  font-size: 0.85rem;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const ScoreInput = styled.input`
  width: 72px;
  padding: 3px 6px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: right;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

/* ── Mobile cards ── */

const MobileQuartetCard = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
  padding: 10px 14px;
`;

const MobileCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const MobileNum = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${p => p.theme.colors.textMuted};
  flex-shrink: 0;
`;

const MobileNameInput = styled.input<{ $readOnly?: boolean }>`
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 4px;
  font-size: 0.88rem;
  background: ${p => p.$readOnly ? p.theme.colors.surfaceAlt : p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  cursor: ${p => p.$readOnly ? 'default' : 'text'};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const MobileScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

const MobileScoreLabel = styled.span`
  font-size: 0.82rem;
  color: ${p => p.theme.colors.textMuted};
`;

const MobileScoreInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 4px;
  font-size: 0.88rem;
  text-align: right;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const MobileSingerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
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
  background: ${p => p.theme.parts[p.$part as 'Tenor' | 'Lead' | 'Baritone' | 'Bass']?.dark ?? '#888'};
`;

const MobileSingerName = styled.span`
  font-size: 0.88rem;
`;

const CheckRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 0.9rem;
  color: ${p => p.theme.colors.text};
`;

const Round2Section = styled.div`
  border-top: 2px solid ${p => p.theme.colors.link};
  background: ${p => p.theme.colors.accentSurface};
`;

const Round2SectionHeader = styled.div`
  padding: 6px 10px 6px 16px;
  font-weight: 700;
  font-size: 0.88rem;
  color: ${p => p.theme.colors.link};
  background: ${p => p.theme.colors.accentHeader};
  border-bottom: 1px solid ${p => p.theme.colors.accentBorder};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid ${p => p.theme.colors.borderLight};
  background: ${p => p.theme.colors.surfaceHover};
`;

const SmallBtn = styled.button`
  padding: 3px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: #757575;
  color: #fff;
  &:hover { opacity: 0.85; }
`;

const R1Score = styled.span`
  color: ${p => p.theme.colors.textMuted};
  font-size: 0.82rem;
`;

/* ── Misc ── */

const EmptyMsg = styled.div`
  padding: 12px 16px;
  font-size: 0.88rem;
  color: ${p => p.theme.colors.textMuted};
`;

const Msg = styled.div<{ $err?: boolean }>`
  padding: 20px;
  text-align: center;
  color: ${p => p.$err ? '#c62828' : p.theme.colors.textMuted};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 10px;
  padding: 28px;
  width: 380px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
`;

const WideModalBox = styled(ModalBox)`
  width: 520px;
`;

const Textarea = styled.textarea`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const HelpCard = styled.div`
  background: ${p => p.theme.colors.accentSurface};
  border: 1px solid ${p => p.theme.colors.accentBorder};
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 14px;
`;

const HelpTitle = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
  color: ${p => p.theme.colors.link};
`;

const HelpGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 10px;
`;

const HelpToken = styled.code`
  color: ${p => p.theme.colors.link};
  font-size: 0.75rem;
  white-space: nowrap;
`;

const JudgeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
  & > * { min-width: 0; }
  input { width: 100%; box-sizing: border-box; }
`;

const JudgeTotal = styled.div`
  text-align: right;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 14px;
`;

const ScoringQuartetName = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

const ScoringSong = styled.div`
  font-size: 0.9rem;
  color: ${p => p.theme.colors.textMuted};
  margin-bottom: 18px;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #2e7d32;
  color: #fff;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  white-space: nowrap;
`;

const ModalTitle = styled.h2`
  margin: 0 0 18px;
  font-size: 1.1rem;
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

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

/* ── Types ── */

interface ContestSinger {
  id: number;
  badgeName: string;
  firstName: string;
  lastName: string;
  part: string;
}

interface ContestQuartet {
  id: number;
  name: string;
  score: number | null;
  score2: number | null;
  songTitle: string | null;
  song2Title: string | null;
  sortOrder2: number;
  singers: ContestSinger[];
}

interface ContestData {
  id: number;
  name: string;
  eventId: number;
  round2Count: number | null;
  quartets: ContestQuartet[];
}

const PARTS = ['Tenor', 'Lead', 'Baritone', 'Bass'];

const DEFAULT_EMAIL_SUBJECT = '{{event}} {{contest}} Quartet Assignment: {{quartet}}';
const DEFAULT_EMAIL_BODY = `Your quartet assignment for the {{contest}} at {{event}} is below. If you are assigned to two quartets you may receive two e-mails, please watch your e-mail for this possibility:

Tenor: {{tenor}} - {{tenorEmail}}
Lead: {{lead}} - {{leadEmail}}
Baritone: {{baritone}} - {{baritoneEmail}}
Bass: {{bass}} - {{bassEmail}}`;

export default function ContestsPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  const token = useAppSelector(s => s.auth.token);
  const user = useAppSelector(s => s.auth.user);

  const [eventName, setEventName] = useState('');
  const [showScores, setShowScores] = useState(false);
  const [contests, setContests] = useState<ContestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState<{ id: number; name: string } | null>(null);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [scores2, setScores2] = useState<Record<number, string>>({});
  const [names, setNames] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState<number | null>(null);
  const [round2Modal, setRound2Modal] = useState<number | null>(null);
  const [round2CountStr, setRound2CountStr] = useState('4');
  const [round2AssignSongs, setRound2AssignSongs] = useState(true);
  const [preparingRound2, setPreparingRound2] = useState(false);
  const [emailModal, setEmailModal] = useState<number | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scoringModal, setScoringModal] = useState<{ quartets: ContestQuartet[]; index: number; round: 1 | 2 } | null>(null);
  const [judgeScores, setJudgeScores] = useState<[string, string, string, string]>(['', '', '', '']);
  const judgeRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const numericEventId = eventId ? parseInt(eventId, 10) : null;
  const canManageContest = numericEventId != null && (
    user?.isSiteAdmin ||
    user?.eventRoles.some(r => r.eventId === numericEventId && ['EventAdmin', 'ContestAdmin'].includes(r.role))
  ) || false;

  const authHeader = `Bearer ${token ?? ''}`;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (scoringModal !== null) judgeRefs.current[0]?.focus();
  }, [scoringModal?.index]);

  const openEmailModal = (contestId: number) => {
    setEmailSubject(DEFAULT_EMAIL_SUBJECT);
    setEmailBody(DEFAULT_EMAIL_BODY);
    setEmailModal(contestId);
  };

  const handleSendEmails = async () => {
    if (emailModal === null) return;
    setSendingEmails(true);
    try {
      const res = await fetch(`${BASE_URL}/contests/${emailModal}/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ subject: emailSubject, body: emailBody }),
      });
      if (!res.ok) {
        alert('Failed to send emails. Check that ACS is configured on the server.');
        return;
      }
      setEmailModal(null);
      setToast('Emails have been scheduled successfully.');
    } finally {
      setSendingEmails(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/contests`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) { setError(`Failed to load (HTTP ${res.status})`); return; }
      const data = await res.json() as { eventName: string; contests: ContestData[]; showScores: boolean };
      setEventName(data.eventName);
      setContests(data.contests);
      setShowScores(data.showScores);
      const scoreMap: Record<number, string> = {};
      const score2Map: Record<number, string> = {};
      const nameMap: Record<number, string> = {};
      data.contests.forEach(c => c.quartets.forEach(q => {
        scoreMap[q.id] = q.score != null ? String(q.score) : '';
        score2Map[q.id] = q.score2 != null ? String(q.score2) : '';
        nameMap[q.id] = q.name;
      }));
      setScores(scoreMap);
      setScores2(score2Map);
      setNames(nameMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (eventId) load(); }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch(`${BASE_URL}/events/${eventId}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName('');
    setShowCreate(false);
    load();
  };

  const handleRename = async () => {
    if (!editingName?.name.trim()) return;
    await fetch(`${BASE_URL}/contests/${editingName.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ name: editingName.name.trim() }),
    });
    setEditingName(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this contest and all its quartets?')) return;
    await fetch(`${BASE_URL}/contests/${id}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });
    load();
  };

  const handleGenerate = async (id: number) => {
    const contest = contests.find(c => c.id === id);
    if (contest && contest.quartets.length > 0) {
      if (!window.confirm('This will delete all existing quartets and generate new ones. Continue?')) return;
    }
    setGenerating(id);
    try {
      const res = await fetch(`${BASE_URL}/contests/${id}/generate`, {
        method: 'POST',
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        const text = await res.text();
        alert(text || 'Failed to generate quartets.');
        return;
      }
      load();
    } finally {
      setGenerating(null);
    }
  };

  const handleNameSave = async (quartetId: number) => {
    await fetch(`${BASE_URL}/quartets/${quartetId}/name`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ name: names[quartetId] ?? '' }),
    });
  };

  const handleScoreSave = async (quartetId: number) => {
    const raw = scores[quartetId] ?? '';
    const score = raw === '' ? null : parseFloat(raw);
    if (raw !== '' && isNaN(score as number)) return;
    await fetch(`${BASE_URL}/quartets/${quartetId}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ score }),
    });
  };

  const handleScore2Save = async (quartetId: number) => {
    const raw = scores2[quartetId] ?? '';
    const score2 = raw === '' ? null : parseFloat(raw);
    if (raw !== '' && isNaN(score2 as number)) return;
    await fetch(`${BASE_URL}/quartets/${quartetId}/score2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ score2 }),
    });
  };

  const openScoringModal = (contest: ContestData) => {
    const firstUnscored = contest.quartets.findIndex(q => scores[q.id] === '' || scores[q.id] == null);
    setScoringModal({ quartets: contest.quartets, index: firstUnscored === -1 ? 0 : firstUnscored, round: 1 });
    setJudgeScores(['', '', '', '']);
  };

  const openScoringModalRound2 = (quartets: ContestQuartet[]) => {
    const firstUnscored = quartets.findIndex(q => scores2[q.id] === '' || scores2[q.id] == null);
    setScoringModal({ quartets, index: firstUnscored === -1 ? 0 : firstUnscored, round: 2 });
    setJudgeScores(['', '', '', '']);
  };

  const handleScoringNext = async () => {
    if (!scoringModal) return;
    const quartet = scoringModal.quartets[scoringModal.index];
    const total = judgeScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0);
    const field = scoringModal.round === 2 ? 'score2' : 'score';
    await fetch(`${BASE_URL}/quartets/${quartet.id}/${field}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ [field]: total }),
    });
    if (scoringModal.round === 2) {
      setScores2(s => ({ ...s, [quartet.id]: String(total) }));
    } else {
      setScores(s => ({ ...s, [quartet.id]: String(total) }));
    }
    if (scoringModal.index + 1 >= scoringModal.quartets.length) {
      setScoringModal(null);
      load();
    } else {
      setScoringModal(m => m && ({ ...m, index: m.index + 1 }));
      setJudgeScores(['', '', '', '']);
    }
  };

  const openRound2Modal = (contest: ContestData) => {
    setRound2CountStr(String(contest.round2Count ?? 4));
    setRound2AssignSongs(true);
    setRound2Modal(contest.id);
  };

  const handlePrepareRound2 = async () => {
    if (round2Modal === null) return;
    const count = parseInt(round2CountStr, 10);
    if (isNaN(count) || count < 1) return;
    setPreparingRound2(true);
    try {
      const res = await fetch(`${BASE_URL}/contests/${round2Modal}/prepare-round2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ count, assignSongs: round2AssignSongs }),
      });
      if (!res.ok) { alert('Failed to prepare Round 2.'); return; }
      setRound2Modal(null);
      load();
    } finally {
      setPreparingRound2(false);
    }
  };

  const renderRound2 = (contest: ContestData) => {
    if (!contest.round2Count) return null;

    const baseTop = [...contest.quartets]
      .filter(q => q.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, contest.round2Count);

    const handleR2Randomize = async () => {
      const ids = [...baseTop].sort(() => Math.random() - 0.5).map(q => q.id);
      await fetch(`${BASE_URL}/contests/${contest.id}/reorder2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ ids }),
      });
      load();
    };

    const hasSortOrder2 = baseTop.length > 0 && baseTop.every(q => q.sortOrder2 > 0);
    const top = hasSortOrder2
      ? [...baseTop].sort((a, b) => a.sortOrder2 - b.sortOrder2)
      : baseTop;

    if (baseTop.length === 0) {
      return (
        <Round2Section>
          <Round2SectionHeader>Round 2 — Top {contest.round2Count}</Round2SectionHeader>
          <EmptyMsg>Enter Round 1 scores to see which quartets advance.</EmptyMsg>
        </Round2Section>
      );
    }

    const singerR2Indices: Record<number, number[]> = {};
    top.forEach((quartet, idx) => {
      quartet.singers.forEach(s => {
        (singerR2Indices[s.id] ??= []).push(idx);
      });
    });

    const fmtR2 = (quartet: ContestQuartet, quartetIdx: number, part: string) => {
      const s = quartet.singers.find(s => s.part === part);
      if (!s) return '—';
      const name = `${s.badgeName} ${s.lastName}`;
      const indices = singerR2Indices[s.id];
      if (indices.length < 2) return name;
      return `${name} (${indices.indexOf(quartetIdx) + 1})`;
    };

    return (
      <Round2Section>
        <Round2SectionHeader>
          <span>Round 2 — Top {contest.round2Count}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {showScores && <SmallBtn onClick={() => openScoringModalRound2(top)}>Score Quartets</SmallBtn>}
            {canManageContest && <SmallBtn onClick={handleR2Randomize}>Randomize Order</SmallBtn>}
          </div>
        </Round2SectionHeader>

        <DesktopOnly>
          <QuartetTable>
            <thead>
              <tr>
                <Th>Rank</Th>
                <Th>Name</Th>
                <Th $part="Tenor">Tenor</Th>
                <Th $part="Lead">Lead</Th>
                <Th $part="Baritone">Baritone</Th>
                <Th $part="Bass">Bass</Th>
                <Th>Song</Th>
                <Th>R1 Score</Th>
                <Th>Round 2 Score</Th>
              </tr>
            </thead>
            <tbody>
              {top.map((quartet, idx) => (
                <tr key={quartet.id}>
                  <Td>{idx + 1}</Td>
                  <Td>{names[quartet.id] ?? quartet.name}</Td>
                  <Td>{fmtR2(quartet, idx, 'Tenor')}</Td>
                  <Td>{fmtR2(quartet, idx, 'Lead')}</Td>
                  <Td>{fmtR2(quartet, idx, 'Baritone')}</Td>
                  <Td>{fmtR2(quartet, idx, 'Bass')}</Td>
                  <Td>{quartet.song2Title ?? '—'}</Td>
                  <Td><R1Score>{quartet.score}</R1Score></Td>
                  <Td>
                    <ScoreInput
                      type="number"
                      step="0.1"
                      value={scores2[quartet.id] ?? ''}
                      placeholder="—"
                      onChange={e => setScores2(s => ({ ...s, [quartet.id]: e.target.value }))}
                      onBlur={() => handleScore2Save(quartet.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleScore2Save(quartet.id); }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </QuartetTable>
        </DesktopOnly>

        <MobileOnly>
          {top.map((quartet, idx) => (
            <MobileQuartetCard key={quartet.id}>
              <MobileCardTop>
                <MobileNum>#{idx + 1}</MobileNum>
                <MobileNameInput
                  value={names[quartet.id] ?? quartet.name}
                  readOnly
                  $readOnly
                />
              </MobileCardTop>
              <MobileScoreRow>
                <MobileScoreLabel>R1:</MobileScoreLabel>
                <R1Score>{quartet.score}</R1Score>
                <MobileScoreLabel>R2:</MobileScoreLabel>
                <MobileScoreInput
                  type="number"
                  step="0.1"
                  value={scores2[quartet.id] ?? ''}
                  placeholder="—"
                  onChange={e => setScores2(s => ({ ...s, [quartet.id]: e.target.value }))}
                  onBlur={() => handleScore2Save(quartet.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScore2Save(quartet.id); }}
                />
              </MobileScoreRow>
              {PARTS.map(part => (
                <MobileSingerRow key={part}>
                  <PartDot $part={part}>{part[0]}</PartDot>
                  <MobileSingerName>{fmtR2(quartet, idx, part)}</MobileSingerName>
                </MobileSingerRow>
              ))}
              {quartet.song2Title && (
                <MobileScoreRow style={{ marginTop: 6 }}>
                  <MobileScoreLabel>Song:</MobileScoreLabel>
                  <MobileSingerName>{quartet.song2Title}</MobileSingerName>
                </MobileScoreRow>
              )}
            </MobileQuartetCard>
          ))}
        </MobileOnly>
      </Round2Section>
    );
  };

  if (!eventId) {
    return (
      <Container>
        <Btn onClick={() => navigate('/admin')}>← Back to Admin</Btn>
      </Container>
    );
  }

  if (!loading && !canManageContest) {
    return (
      <Container>
        <Msg $err>You do not have permission to view contests for this event.</Msg>
        <div style={{ textAlign: 'center' }}>
          <Btn onClick={() => navigate('/admin')}>← Back to Admin</Btn>
        </div>
      </Container>
    );
  }

  const renderQuartets = (contest: ContestData) => {
    if (contest.quartets.length === 0) {
      return <EmptyMsg>No quartets yet — click Generate Quartets.</EmptyMsg>;
    }

    const orderedQuartets = contest.quartets;

    const handleR1Randomize = async () => {
      const ids = [...contest.quartets].sort(() => Math.random() - 0.5).map(q => q.id);
      await fetch(`${BASE_URL}/contests/${contest.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ ids }),
      });
      load();
    };

    // Map singerId → ordered list of quartet indices they appear in
    const singerQuartetIndices: Record<number, number[]> = {};
    orderedQuartets.forEach((quartet, idx) => {
      quartet.singers.forEach(s => {
        (singerQuartetIndices[s.id] ??= []).push(idx);
      });
    });

    const fmt = (quartet: ContestQuartet, quartetIdx: number, part: string) => {
      const s = quartet.singers.find(s => s.part === part);
      if (!s) return '—';
      const name = `${s.badgeName} ${s.lastName}`;
      const indices = singerQuartetIndices[s.id];
      if (indices.length < 2) return name;
      return `${name} (${indices.indexOf(quartetIdx) + 1})`;
    };

    return (
      <>
        <SectionToolbar>
          {showScores && <SmallBtn onClick={() => openScoringModal(contest)}>Score Quartets</SmallBtn>}
          <SmallBtn onClick={() => openEmailModal(contest.id)}>Email Quartets</SmallBtn>
          {canManageContest && <SmallBtn onClick={handleR1Randomize}>Randomize Order</SmallBtn>}
        </SectionToolbar>
        {/* Desktop table */}
        <DesktopOnly>
          <QuartetTable>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th $part="Tenor">Tenor</Th>
                <Th $part="Lead">Lead</Th>
                <Th $part="Baritone">Baritone</Th>
                <Th $part="Bass">Bass</Th>
                <Th>Song</Th>
                {showScores && <Th>Round 1 Score</Th>}
              </tr>
            </thead>
            <tbody>
              {orderedQuartets.map((quartet, idx) => (
                <tr key={quartet.id}>
                  <Td>{idx + 1}</Td>
                  <Td>
                    <NameInput
                      value={names[quartet.id] ?? ''}
                      placeholder="—"
                      onChange={e => setNames(n => ({ ...n, [quartet.id]: e.target.value }))}
                      onBlur={() => handleNameSave(quartet.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleNameSave(quartet.id); }}
                    />
                  </Td>
                  <Td>{fmt(quartet, idx, 'Tenor')}</Td>
                  <Td>{fmt(quartet, idx, 'Lead')}</Td>
                  <Td>{fmt(quartet, idx, 'Baritone')}</Td>
                  <Td>{fmt(quartet, idx, 'Bass')}</Td>
                  <Td>{quartet.songTitle ?? '—'}</Td>
                  {showScores && (
                    <Td>
                      <ScoreInput
                        type="number"
                        step="0.1"
                        value={scores[quartet.id] ?? ''}
                        placeholder="—"
                        onChange={e => setScores(s => ({ ...s, [quartet.id]: e.target.value }))}
                        onBlur={() => handleScoreSave(quartet.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleScoreSave(quartet.id); }}
                      />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </QuartetTable>
        </DesktopOnly>

        {/* Mobile cards */}
        <MobileOnly>
          {orderedQuartets.map((quartet, idx) => (
            <MobileQuartetCard key={quartet.id}>
              <MobileCardTop>
                <MobileNum>#{idx + 1}</MobileNum>
                <MobileNameInput
                  value={names[quartet.id] ?? ''}
                  placeholder="Quartet name"
                  onChange={e => setNames(n => ({ ...n, [quartet.id]: e.target.value }))}
                  onBlur={() => handleNameSave(quartet.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(quartet.id); }}
                />
              </MobileCardTop>
              {showScores && (
                <MobileScoreRow>
                  <MobileScoreLabel>Round 1:</MobileScoreLabel>
                  <MobileScoreInput
                    type="number"
                    step="0.1"
                    value={scores[quartet.id] ?? ''}
                    placeholder="—"
                    onChange={e => setScores(s => ({ ...s, [quartet.id]: e.target.value }))}
                    onBlur={() => handleScoreSave(quartet.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleScoreSave(quartet.id); }}
                  />
                </MobileScoreRow>
              )}
              {PARTS.map(part => (
                <MobileSingerRow key={part}>
                  <PartDot $part={part}>{part[0]}</PartDot>
                  <MobileSingerName>{fmt(quartet, idx, part)}</MobileSingerName>
                </MobileSingerRow>
              ))}
              {quartet.songTitle && (
                <MobileScoreRow style={{ marginTop: 6 }}>
                  <MobileScoreLabel>Song:</MobileScoreLabel>
                  <MobileSingerName>{quartet.songTitle}</MobileSingerName>
                </MobileScoreRow>
              )}
            </MobileQuartetCard>
          ))}
        </MobileOnly>
      </>
    );
  };

  return (
    <Container>
      <Header>
        <TitleBlock>
          <Title>Contests</Title>
          {eventName && <Sub>{eventName}</Sub>}
        </TitleBlock>
        <HeaderActions>
          {canManageContest && <Btn $variant="primary" onClick={() => { setNewName(''); setShowCreate(true); }}>+ New Contest</Btn>}
          <Btn onClick={() => navigate('/admin')}>← Admin</Btn>
        </HeaderActions>
      </Header>

      {loading && <Msg>Loading...</Msg>}
      {error && <Msg $err>{error}</Msg>}
      {!loading && contests.length === 0 && !error && (
        <Msg>No contests yet. Create one to get started.</Msg>
      )}

      {contests.map(contest => (
        <ContestCard key={contest.id}>
          <ContestHeader>
            <ContestName>{contest.name}</ContestName>
            <ContestActions>
              {canManageContest && <Btn onClick={() => setEditingName({ id: contest.id, name: contest.name })}>Rename</Btn>}
              {canManageContest && (
                <Btn
                  $variant="primary"
                  disabled={generating === contest.id}
                  onClick={() => handleGenerate(contest.id)}
                >
                  {generating === contest.id ? 'Generating…' : 'Generate Quartets'}
                </Btn>
              )}
              {showScores && (
                <Btn
                  disabled={contest.quartets.length === 0}
                  onClick={() => openScoringModal(contest)}
                >
                  Score Quartets
                </Btn>
              )}
              {canManageContest && (
                <Btn
                  disabled={contest.quartets.length === 0}
                  onClick={() => openRound2Modal(contest)}
                >
                  Prepare Round 2
                </Btn>
              )}
              {canManageContest && <Btn $variant="danger" onClick={() => handleDelete(contest.id)}>Delete</Btn>}
            </ContestActions>
          </ContestHeader>
          {renderQuartets(contest)}
          {renderRound2(contest)}
        </ContestCard>
      ))}

      {showCreate && (
        <Overlay onClick={() => setShowCreate(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>New Contest</ModalTitle>
            <Field>
              <Label>Name</Label>
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              />
            </Field>
            <ModalActions>
              <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn $variant="primary" disabled={!newName.trim()} onClick={handleCreate}>Create</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {editingName && (
        <Overlay onClick={() => setEditingName(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Rename Contest</ModalTitle>
            <Field>
              <Label>Name</Label>
              <Input
                autoFocus
                value={editingName.name}
                onChange={e => setEditingName(en => en && ({ ...en, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
              />
            </Field>
            <ModalActions>
              <Btn onClick={() => setEditingName(null)}>Cancel</Btn>
              <Btn $variant="primary" disabled={!editingName.name.trim()} onClick={handleRename}>Save</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {round2Modal !== null && (
        <Overlay onClick={() => setRound2Modal(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Prepare Round 2</ModalTitle>
            <Field>
              <Label>Quartets advancing</Label>
              <Input
                autoFocus
                type="number"
                min={1}
                value={round2CountStr}
                onChange={e => setRound2CountStr(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePrepareRound2(); }}
              />
            </Field>
            <CheckRow>
              <input
                id="r2-songs"
                type="checkbox"
                checked={round2AssignSongs}
                onChange={e => setRound2AssignSongs(e.target.checked)}
              />
              <label htmlFor="r2-songs">Assign songs to advancing quartets</label>
            </CheckRow>
            <ModalActions>
              <Btn onClick={() => setRound2Modal(null)}>Cancel</Btn>
              <Btn
                $variant="primary"
                disabled={preparingRound2 || !round2CountStr || parseInt(round2CountStr, 10) < 1}
                onClick={handlePrepareRound2}
              >
                {preparingRound2 ? 'Preparing…' : 'Prepare'}
              </Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}

      {emailModal !== null && (
        <Overlay onClick={() => setEmailModal(null)}>
          <WideModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Email Quartets</ModalTitle>
            <Field>
              <Label>Subject</Label>
              <Input
                autoFocus
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
              />
            </Field>
            <Field>
              <Label>Body</Label>
              <Textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
              />
            </Field>
            <HelpCard>
              <HelpTitle>Available tokens</HelpTitle>
              <HelpGrid>
                <HelpToken>{'{{event}}'}</HelpToken><span>Event name</span>
                <HelpToken>{'{{contest}}'}</HelpToken><span>Contest name</span>
                <HelpToken>{'{{quartet}}'}</HelpToken><span>Quartet name</span>
                <HelpToken>{'{{tenor}}'}</HelpToken><span>Tenor's name</span>
                <HelpToken>{'{{tenorEmail}}'}</HelpToken><span>Tenor's email</span>
                <HelpToken>{'{{lead}}'}</HelpToken><span>Lead's name</span>
                <HelpToken>{'{{leadEmail}}'}</HelpToken><span>Lead's email</span>
                <HelpToken>{'{{baritone}}'}</HelpToken><span>Baritone's name</span>
                <HelpToken>{'{{baritoneEmail}}'}</HelpToken><span>Baritone's email</span>
                <HelpToken>{'{{bass}}'}</HelpToken><span>Bass's name</span>
                <HelpToken>{'{{bassEmail}}'}</HelpToken><span>Bass's email</span>
              </HelpGrid>
            </HelpCard>
            <ModalActions>
              <Btn onClick={() => setEmailModal(null)}>Cancel</Btn>
              <Btn
                $variant="primary"
                disabled={sendingEmails || !emailSubject.trim() || !emailBody.trim()}
                onClick={handleSendEmails}
              >
                {sendingEmails ? 'Sending…' : 'Send Emails'}
              </Btn>
            </ModalActions>
          </WideModalBox>
        </Overlay>
      )}

      {scoringModal !== null && (() => {
        const quartet = scoringModal.quartets[scoringModal.index];
        const total = judgeScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0);
        const allFilled = judgeScores.every(s => s !== '' && !isNaN(parseFloat(s)));
        const isLast = scoringModal.index + 1 >= scoringModal.quartets.length;
        return (
          <Overlay>
            <ModalBox onClick={e => e.stopPropagation()}>
              <ModalTitle>
                Score Quartets ({scoringModal.index + 1} of {scoringModal.quartets.length})
              </ModalTitle>
              <ScoringQuartetName>{names[quartet.id] ?? quartet.name}</ScoringQuartetName>
              {quartet.songTitle
                ? <ScoringSong>{quartet.songTitle}</ScoringSong>
                : <ScoringSong>&nbsp;</ScoringSong>}
              <JudgeGrid>
                {([0, 1, 2, 3] as const).map(i => (
                  <Field key={i}>
                    <Label>Judge {i + 1}</Label>
                    <Input
                      ref={el => { judgeRefs.current[i] = el; }}
                      autoFocus={i === 0}
                      type="number"
                      step="0.1"
                      value={judgeScores[i]}
                      onChange={e => setJudgeScores(prev => {
                        const next = [...prev] as [string, string, string, string];
                        next[i] = e.target.value;
                        return next;
                      })}
                      onKeyDown={e => {
                        if (e.key !== 'Enter') return;
                        if (i < 3) { judgeRefs.current[i + 1]?.focus(); }
                        else if (allFilled) { handleScoringNext(); }
                      }}
                    />
                  </Field>
                ))}
              </JudgeGrid>
              <JudgeTotal>Total: {allFilled ? total.toFixed(1) : '—'}</JudgeTotal>
              <ModalActions>
                <Btn onClick={() => setScoringModal(null)}>Cancel</Btn>
                <Btn $variant="primary" disabled={!allFilled} onClick={handleScoringNext}>
                  {isLast ? 'Finish' : 'Next'}
                </Btn>
              </ModalActions>
            </ModalBox>
          </Overlay>
        );
      })()}

      {toast && <Toast>{toast}</Toast>}
    </Container>
  );
}
