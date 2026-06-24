import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import type { Part } from '../types';
import { BASE_URL } from '../api/apiClient';

interface AchieverDto { singerId: number; badgeName: string; lastName: string; part: Part; }
interface PartProgressDto { part: Part; averageProgress: number; }
interface EventNumbersDto {
  totalSingers: number;
  appUsers: number;
  trampCount: number;
  partProgress: PartProgressDto[];
}
interface EventStatsDto {
  eventName: string;
  allowBusyBee: boolean;
  tramps: AchieverDto[];
  superTramps: AchieverDto[];
  busyBees: AchieverDto[];
  closeToTramp: AchieverDto[];
  closeToSuperTramp: AchieverDto[];
  closeToBusyBee: AchieverDto[];
  numbers: EventNumbersDto;
}

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
`;

const BackLink = styled(Link)`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textMuted};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 12px;
  &:hover { text-decoration: underline; }
`;

const PageTitle = styled.h1`
  font-size: 1.3rem;
  margin: 0 0 4px;
  text-align: center;
  color: ${p => p.theme.colors.text};
  font-weight: 700;
`;

const EventName = styled.div`
  font-size: 0.9rem;
  text-align: center;
  color: ${p => p.theme.colors.textMuted};
  margin-bottom: 20px;
`;

const Card = styled.div`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.cardBorderRadius};
  overflow: hidden;
  margin-bottom: 16px;
`;

const CardHeader = styled.div<{ $color?: string }>`
  padding: 10px 16px;
  background: ${p => p.$color ?? p.theme.colors.surfaceAlt};
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardBody = styled.div`
  padding: 12px 16px;
`;

const AchieverGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const AchieverChip = styled.div<{ $part: Part }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 600;
  background: ${p => p.theme.parts[p.$part]?.light ?? '#eee'};
  color: ${p => p.theme.parts[p.$part]?.labelColor ?? '#333'};
  border: 1px solid ${p => p.theme.parts[p.$part]?.dark ?? '#ccc'};
`;

const PART_ABBR: Record<Part, string> = { Tenor: 'T', Lead: 'L', Baritone: 'Br', Bass: 'Bs' };

const PartDot = styled.span<{ $part: Part }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.parts[p.$part]?.dark ?? '#888'};
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const EmptyMsg = styled.div`
  color: ${p => p.theme.colors.textMuted};
  font-size: 0.9rem;
  font-style: italic;
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const NumberBox = styled.div`
  background: ${p => p.theme.colors.surfaceAlt};
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const NumberValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${p => p.theme.colors.text};
  line-height: 1;
`;

const NumberLabel = styled.div`
  font-size: 0.78rem;
  color: ${p => p.theme.colors.textMuted};
  margin-top: 4px;
`;

const ProgressSection = styled.div`
  border-top: 1px solid ${p => p.theme.colors.borderLight};
  padding-top: 12px;
`;

const ProgressLabel = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
`;

const ProgressPartName = styled.span<{ $part: Part }>`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${p => p.theme.parts[p.$part]?.labelColor ?? '#333'};
  width: 70px;
  flex-shrink: 0;
`;

const ProgressBarTrack = styled.div`
  flex: 1;
  height: 10px;
  background: ${p => p.theme.colors.surfaceAlt};
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $pct: number; $part: Part }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: ${p => p.theme.parts[p.$part]?.dark ?? '#888'};
  border-radius: 5px;
  transition: width 0.4s ease;
`;

const ProgressPct = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
  width: 42px;
  text-align: right;
  flex-shrink: 0;
`;

const CenteredMsg = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${p => p.theme.colors.textMuted};
`;

export default function StatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<EventStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/events/${id}/stats`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() as Promise<EventStatsDto> : null;
      })
      .then(data => { if (data) setStats(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CenteredMsg>Loading…</CenteredMsg>;
  if (notFound || !stats) return <CenteredMsg>Event not found.</CenteredMsg>;

  const { eventName, allowBusyBee, tramps, superTramps, busyBees, closeToTramp, closeToSuperTramp, closeToBusyBee, numbers } = stats;

  return (
    <Container>
      <BackLink to={`/events/${id}/stats`} onClick={e => { e.preventDefault(); window.history.back(); }}>← Back</BackLink>
      <PageTitle>Stats</PageTitle>
      <EventName>{eventName}</EventName>

      <Card>
        <CardHeader>Tramp ({tramps.length})</CardHeader>
        <CardBody>
          {tramps.length === 0 ? (
            <EmptyMsg>No Tramps yet — keep singing!</EmptyMsg>
          ) : (
            <AchieverGrid>
              {tramps.map(a => (
                <AchieverChip key={a.singerId} $part={a.part}>
                  <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                  {a.badgeName} {a.lastName}
                </AchieverChip>
              ))}
            </AchieverGrid>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Super Tramp ({superTramps.length})</CardHeader>
        <CardBody>
          {superTramps.length === 0 ? (
            <EmptyMsg>No Super Tramps yet — keep singing!</EmptyMsg>
          ) : (
            <AchieverGrid>
              {superTramps.map(a => (
                <AchieverChip key={a.singerId} $part={a.part}>
                  <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                  {a.badgeName} {a.lastName}
                </AchieverChip>
              ))}
            </AchieverGrid>
          )}
        </CardBody>
      </Card>

      {allowBusyBee && (
        <Card>
          <CardHeader>Busy Bee ({busyBees.length})</CardHeader>
          <CardBody>
            {busyBees.length === 0 ? (
              <EmptyMsg>No Busy Bees yet — keep singing!</EmptyMsg>
            ) : (
              <AchieverGrid>
                {busyBees.map(a => (
                  <AchieverChip key={a.singerId} $part={a.part}>
                    <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                    {a.badgeName} {a.lastName}
                  </AchieverChip>
                ))}
              </AchieverGrid>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>Close to Tramp ({closeToTramp.length})</CardHeader>
        <CardBody>
          {closeToTramp.length === 0 ? (
            <EmptyMsg>No one is close yet — keep singing!</EmptyMsg>
          ) : (
            <AchieverGrid>
              {closeToTramp.map(a => (
                <AchieverChip key={a.singerId} $part={a.part}>
                  <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                  {a.badgeName} {a.lastName}
                </AchieverChip>
              ))}
            </AchieverGrid>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Close to Super Tramp ({closeToSuperTramp.length})</CardHeader>
        <CardBody>
          {closeToSuperTramp.length === 0 ? (
            <EmptyMsg>No one is close yet — keep singing!</EmptyMsg>
          ) : (
            <AchieverGrid>
              {closeToSuperTramp.map(a => (
                <AchieverChip key={a.singerId} $part={a.part}>
                  <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                  {a.badgeName} {a.lastName}
                </AchieverChip>
              ))}
            </AchieverGrid>
          )}
        </CardBody>
      </Card>

      {allowBusyBee && (
        <Card>
          <CardHeader>Close to Busy Bee ({closeToBusyBee.length})</CardHeader>
          <CardBody>
            {closeToBusyBee.length === 0 ? (
              <EmptyMsg>No one is close yet — keep singing!</EmptyMsg>
            ) : (
              <AchieverGrid>
                {closeToBusyBee.map(a => (
                  <AchieverChip key={a.singerId} $part={a.part}>
                    <PartDot $part={a.part}>{PART_ABBR[a.part]}</PartDot>
                    {a.badgeName} {a.lastName}
                  </AchieverChip>
                ))}
              </AchieverGrid>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>By the Numbers</CardHeader>
        <CardBody>
          <NumbersGrid>
            <NumberBox>
              <NumberValue>{numbers.totalSingers}</NumberValue>
              <NumberLabel>Total Singers</NumberLabel>
            </NumberBox>
            <NumberBox>
              <NumberValue>{numbers.appUsers}</NumberValue>
              <NumberLabel>Using the App</NumberLabel>
            </NumberBox>
            <NumberBox>
              <NumberValue>{numbers.trampCount}</NumberValue>
              <NumberLabel>Finished Tramp</NumberLabel>
            </NumberBox>
            <NumberBox>
              <NumberValue>
                {numbers.totalSingers > 0
                  ? `${Math.round(numbers.trampCount / numbers.totalSingers * 100)}%`
                  : '—'}
              </NumberValue>
              <NumberLabel>Tramp Rate</NumberLabel>
            </NumberBox>
          </NumbersGrid>

          {numbers.partProgress.length > 0 && (
            <ProgressSection>
              <ProgressLabel>Avg. Progress Towards Tramp by Part</ProgressLabel>
              {numbers.partProgress.map(pp => (
                <ProgressRow key={pp.part}>
                  <ProgressPartName $part={pp.part}>{pp.part}</ProgressPartName>
                  <ProgressBarTrack>
                    <ProgressBarFill $pct={pp.averageProgress} $part={pp.part} />
                  </ProgressBarTrack>
                  <ProgressPct>{pp.averageProgress}%</ProgressPct>
                </ProgressRow>
              ))}
            </ProgressSection>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
