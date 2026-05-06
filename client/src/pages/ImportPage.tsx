import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSelector } from '../hooks/useAppDispatch';

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
  background: #fff;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid #e0e0e0;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  margin: 0 0 10px;
  color: #444;
  font-weight: 600;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: monospace;
  font-size: 0.82rem;
  resize: vertical;
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: #888;
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
  background: ${p => p.$ok ? '#e8f5e9' : '#ffebee'};
  color: ${p => p.$ok ? '#2e7d32' : '#c62828'};
`;

export default function ImportPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  const credentials = useAppSelector(s => s.auth.credentials);

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
      const res = await fetch(`/api/events/${eventId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          Authorization: `Basic ${credentials ?? ''}`,
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
        <Hint>Columns: BadgeName, FirstName, LastName, Part, Status (optional — Active/Optional/Inactive, defaults to Active)</Hint>
      </Section>

      <Section>
        <SectionTitle>Or paste CSV text</SectionTitle>
        <Textarea
          placeholder={`BadgeName,FirstName,LastName,Part,Status\nBubba,John,Smith,Tenor,\nDoc,Bill,Jones,Lead,Optional`}
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
