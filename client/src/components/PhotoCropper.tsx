import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  file: File;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const CROP_SIZE = 220;
const OUTPUT_SIZE = 400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const CropContainer = styled.div`
  position: relative;
  width: ${CROP_SIZE}px;
  height: ${CROP_SIZE}px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${p => p.theme.colors.border};
  cursor: grab;
  touch-action: none;
  flex-shrink: 0;
  background: ${p => p.theme.colors.surfaceAlt};
  &:active { cursor: grabbing; }
`;

const ZoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const ZoomBtn = styled.button`
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 50%;
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.text};
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: ${p => p.theme.colors.surfaceAlt}; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const ZoomSlider = styled.input`
  flex: 1;
  accent-color: #1565c0;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 11px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  background: ${p => p.$primary ? '#1565c0' : p.theme.colors.surfaceAlt};
  color: ${p => p.$primary ? '#fff' : p.theme.colors.text};
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

export default function PhotoCropper({ file, onSave, onCancel }: Props) {
  const [src, setSrc] = useState('');
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setImgDims({ w: 0, h: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clamp = useCallback((ox: number, oy: number, z: number, dims: { w: number; h: number }, base: number) => {
    const ds = base * z;
    const maxX = Math.max(0, (dims.w * ds - CROP_SIZE) / 2);
    const maxY = Math.max(0, (dims.h * ds - CROP_SIZE) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, []);

  const handleLoad = () => {
    const img = imgRef.current!;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const base = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    setImgDims({ w, h });
    setBaseScale(base);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.px;
    const dy = e.clientY - dragRef.current.py;
    setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, zoom, imgDims, baseScale));
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const changeZoom = (newZoom: number) => {
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(newZoom);
    setOffset(prev => clamp(prev.x, prev.y, newZoom, imgDims, baseScale));
  };

  const handleSave = () => {
    if (!imgDims.w || !imgDims.h) return;
    setSaving(true);
    const ds = baseScale * zoom;
    // Which portion of the natural image corresponds to the visible crop area
    const srcX = imgDims.w / 2 - CROP_SIZE / (2 * ds) - offset.x / ds;
    const srcY = imgDims.h / 2 - CROP_SIZE / (2 * ds) - offset.y / ds;
    const srcW = CROP_SIZE / ds;
    const srcH = CROP_SIZE / ds;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgRef.current!, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob(blob => {
      setSaving(false);
      if (blob) onSave(blob);
    }, 'image/jpeg', 0.92);
  };

  const ds = baseScale * zoom;
  const imgLeft = imgDims.w ? CROP_SIZE / 2 + offset.x - (imgDims.w * ds) / 2 : 0;
  const imgTop  = imgDims.h ? CROP_SIZE / 2 + offset.y - (imgDims.h * ds) / 2 : 0;

  return (
    <Wrapper>
      <CropContainer
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {src && (
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={handleLoad}
            style={{
              position: 'absolute',
              left: `${imgLeft}px`,
              top: `${imgTop}px`,
              width: imgDims.w ? `${imgDims.w * ds}px` : undefined,
              height: imgDims.h ? `${imgDims.h * ds}px` : undefined,
              display: imgDims.w ? 'block' : 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
      </CropContainer>

      <ZoomRow>
        <ZoomBtn onClick={() => changeZoom(zoom - ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}>−</ZoomBtn>
        <ZoomSlider
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={e => changeZoom(Number(e.target.value))}
        />
        <ZoomBtn onClick={() => changeZoom(zoom + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>+</ZoomBtn>
      </ZoomRow>

      <BtnRow>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn $primary onClick={handleSave} disabled={saving || !imgDims.w}>
          {saving ? 'Saving…' : 'Save Photo'}
        </Btn>
      </BtnRow>
    </Wrapper>
  );
}
