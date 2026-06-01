import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSelector } from '../hooks/useAppDispatch';
import { BASE_URL } from '../api/apiClient';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const Title = styled.h1`
  font-size: 1.4rem;
  margin: 0 0 20px;
`;

const Section = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid ${p => p.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  margin: 0 0 10px;
  color: ${p => p.theme.colors.textSecondary};
  font-weight: 600;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-family: monospace;
  font-size: 0.82rem;
  resize: vertical;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textMuted};
  margin: 6px 0 0;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  background: ${p => p.$variant === 'primary' ? '#1565c0' : '#757575'};
  color: #fff;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const StatusMsg = styled.div<{ $ok: boolean }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 14px;
  font-size: 0.9rem;
  background: ${p => p.$ok ? p.theme.colors.statusColors.Active.bg : p.theme.colors.statusColors.Inactive.bg};
  color: ${p => p.$ok ? p.theme.colors.statusColors.Active.text : p.theme.colors.statusColors.Inactive.text};
`;

export default function ImportPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  const token = useAppSelector(s => s.auth.token);

  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!eventId || !csvText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: csvText,
      });
      if (res.ok) {
        const data = await res.json() as { imported: number };
        setResult({ ok: true, message: `Successfully imported ${data.imported} singers.` });
        setCsvText('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setResult({ ok: false, message: `Import failed (HTTP ${res.status}).` });
      }
    } catch {
      setResult({ ok: false, message: 'Connection error.' });
    } finally {
      setLoading(false);
    }
  };

  if (!eventId) {
    return (
      <Container>
        <Title>No event selected.</Title>
        <Btn $variant="secondary" onClick={() => navigate('/admin')}>Back to Admin</Btn>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Import Singers — Event #{eventId}</Title>

      <Section>
        <SectionTitle>Upload CSV file</SectionTitle>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <Hint>Columns: BadgeName, FirstName, LastName, Part, Email (optional), Status (optional — Active/Optional/Inactive, defaults to Active)</Hint>
      </Section>

      <Section>
        <SectionTitle>Or paste CSV text</SectionTitle>
        <Textarea
          placeholder={`BadgeName,FirstName,LastName,Part,Email,Status\nBubba,John,Smith,Tenor,bubba@example.com,\nDoc,Bill,Jones,Lead,,Optional`}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
        />
      </Section>

      <BtnRow>
        <Btn $variant="primary" disabled={loading || !csvText.trim()} onClick={handleImport}>
          {loading ? 'Importing...' : 'Import'}
        </Btn>
        <Btn $variant="secondary" onClick={() => navigate('/admin')}>Back to Admin</Btn>
      </BtnRow>

      {result && <StatusMsg $ok={result.ok}>{result.message}</StatusMsg>}
    </Container>
  );
}
