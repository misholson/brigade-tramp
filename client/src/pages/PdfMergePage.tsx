import { useRef, useState } from 'react';
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

const FileList = styled.ul`
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FileItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${p => p.theme.colors.surfaceAlt};
  border-radius: 6px;
  border: 1px solid ${p => p.theme.colors.borderLight};
  font-size: 0.88rem;
  color: ${p => p.theme.colors.text};
`;

const FileName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
`;

const FileSize = styled.span`
  color: ${p => p.theme.colors.textMuted};
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-right: 8px;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme.colors.textMuted};
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9rem;
  flex-shrink: 0;
  &:hover { color: #c62828; background: ${p => p.theme.colors.surfaceHover}; }
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

const ErrorMsg = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 14px;
  font-size: 0.9rem;
  background: ${p => p.theme.colors.statusColors.Inactive.bg};
  color: ${p => p.theme.colors.statusColors.Inactive.text};
`;

const Hint = styled.p`
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textMuted};
  margin: 8px 0 0;
`;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfMergePage() {
  const token = useAppSelector(s => s.auth.token);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter(f =>
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    setFiles(prev => [...prev, ...selected]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 1) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));

      const res = await fetch(`${BASE_URL}/pdf/merge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `Merge failed (HTTP ${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Merge PDFs</Title>

      <Section>
        <SectionTitle>Select PDF files</SectionTitle>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileChange}
        />
        <Hint>Select one or more PDF files. They will be merged in the order shown below.</Hint>

        {files.length > 0 && (
          <FileList>
            {files.map((f, i) => (
              <FileItem key={i}>
                <FileName>{f.name}</FileName>
                <FileSize>{formatBytes(f.size)}</FileSize>
                <RemoveBtn onClick={() => removeFile(i)} title="Remove">✕</RemoveBtn>
              </FileItem>
            ))}
          </FileList>
        )}
      </Section>

      <BtnRow>
        <Btn
          $variant="primary"
          disabled={loading || files.length < 1}
          onClick={handleMerge}
        >
          {loading ? 'Merging...' : `Merge${files.length > 1 ? ` ${files.length} PDFs` : ' PDF'}`}
        </Btn>
        <Btn $variant="secondary" onClick={() => setFiles([])}>
          Clear
        </Btn>
      </BtnRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Container>
  );
}
