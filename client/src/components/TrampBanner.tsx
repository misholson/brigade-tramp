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

interface Props {
  isTramp: boolean;
  isSuperTramp: boolean;
}

export default function TrampBanner({ isTramp, isSuperTramp }: Props) {
  if (isSuperTramp) return <Banner $super>SUPER TRAMP!!</Banner>;
  if (isTramp) return <Banner $super={false}>TRAMP!</Banner>;
  return null;
}
