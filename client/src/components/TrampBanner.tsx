import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
`;

const Banner = styled.div<{ $super: boolean }>`
  text-align: center;
  padding: 18px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 3px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  background: ${p =>
    p.$super
      ? 'linear-gradient(135deg, #f9a825, #e65100)'
      : 'linear-gradient(135deg, #1565c0, #0d47a1)'};
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const BusyBeeAchieved = styled.div`
  text-align: center;
  padding: 18px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 3px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  background: linear-gradient(135deg, #7b1fa2, #4a0072);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const BusyBeePrompt = styled.div`
  text-align: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #7b1fa2, #4a0072);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

interface Props {
  isTramp: boolean;
  isSuperTramp: boolean;
  allowBusyBee?: boolean;
  isBusyBee?: boolean;
}

export default function TrampBanner({ isTramp, isSuperTramp, allowBusyBee, isBusyBee }: Props) {
  return (
    <>
      {isSuperTramp && <Banner $super>SUPER TRAMP!!</Banner>}
      {!isSuperTramp && isTramp && <Banner $super={false}>TRAMP!</Banner>}
      {allowBusyBee && isTramp && !isBusyBee && (
        <BusyBeePrompt>Sing with everyone again to be a Busy Bee!</BusyBeePrompt>
      )}
      {allowBusyBee && isBusyBee && <BusyBeeAchieved>You're a busy bee!</BusyBeeAchieved>}
    </>
  );
}
