'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, X, RotateCcw, FlipHorizontal, Grid, 
  Sparkles, Edit3, Check, Maximize2, Zap, AlertCircle
} from 'lucide-react';
import { InputMode } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface CameraModalProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setInputMode: (m: InputMode) => void;
  setCamFront: React.Dispatch<React.SetStateAction<boolean>>;
  camFront: boolean;
  onPhotoCaptured: (file: File, mode: 'ai' | 'manual') => void;
}

export function CameraModal({ 
  videoRef, 
  canvasRef, 
  setInputMode, 
  setCamFront, 
  camFront,
  onPhotoCaptured 
}: CameraModalProps) {
  const { t } = useI18n();
  const [showGrid, setShowGrid] = useState(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [capturedBlob, setCapturedBlob] = useState<{ blob: Blob; url: string } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Check torch capability
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }
    }
  }, [videoRef, camFront]);

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      }
    } catch {
      // Torch not supported on desktop or device
    }
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 1920;
    c.height = v.videoHeight || 1080;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    
    // Draw crisp image directly from hardware stream
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedBlob({ blob, url });
    }, 'image/jpeg', 0.98);
  };

  const handleRetake = () => {
    if (capturedBlob) {
      URL.revokeObjectURL(capturedBlob.url);
      setCapturedBlob(null);
    }
  };

  const handleConfirm = (mode: 'ai' | 'manual') => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob.blob], `manuscrit_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setInputMode('upload');
    onPhotoCaptured(file, mode);
  };

  const handleClose = () => {
    if (capturedBlob) {
      URL.revokeObjectURL(capturedBlob.url);
    }
    setInputMode('upload');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-6 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl flex flex-col">
        
        {/* Hidden Canvas for High-Res Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Control Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-white text-xs font-bold shadow-lg">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="font-display tracking-wide">{t.cameraTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedBlob && (
              <>
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    title={t.cameraTorch}
                    className={`size-9 rounded-full flex items-center justify-center border transition cursor-pointer ${
                      torchOn 
                        ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
                        : 'bg-black/60 text-white border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Zap className="size-4" />
                  </button>
                )}

                <button
                  onClick={() => setShowGrid(g => !g)}
                  title={t.cameraGrid}
                  className={`size-9 rounded-full flex items-center justify-center border transition cursor-pointer ${
                    showGrid 
                      ? 'bg-indigo-600 text-white border-indigo-400' 
                      : 'bg-black/60 text-white/70 border-slate-700 hover:text-white'
                  }`}
                >
                  <Grid className="size-4" />
                </button>

                <button
                  onClick={() => setFitMode(m => m === 'contain' ? 'cover' : 'contain')}
                  title={t.cameraFit}
                  className="size-9 rounded-full bg-black/60 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
                >
                  <Maximize2 className="size-4" />
                </button>

                <button
                  onClick={() => setCamFront(f => !f)}
                  title={t.cameraSwitch}
                  className="size-9 rounded-full bg-black/60 hover:bg-slate-800 text-cyan-300 border border-slate-700 flex items-center justify-center transition cursor-pointer"
                >
                  <FlipHorizontal className="size-4" />
                </button>
              </>
            )}

            <button
              onClick={handleClose}
              className="size-9 rounded-full bg-black/70 hover:bg-rose-900/80 text-white border border-slate-700 flex items-center justify-center transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Video or Snapshot Review Area */}
        <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {capturedBlob ? (
            /* Freeze Frame Review */
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img 
                src={capturedBlob.url} 
                alt="Capture preview" 
                className="max-w-full max-h-full object-contain rounded-xl border border-indigo-500/50 shadow-2xl"
              />
              <div className="absolute top-18 px-4 py-1.5 rounded-full bg-black/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold">
                ✓ Photo capturée en haute définition
              </div>
            </div>
          ) : (
            /* Live High-Definition Video Preview (NO BLUR OVERLAY) */
            <div className="relative w-full h-full flex items-center justify-center">
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                autoPlay
                className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
              />

              {/* Composition Grid Overlay (Optional) */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              )}

              {/* Sharp Viewfinder Reticle Corners */}
              <div className="absolute inset-8 sm:inset-16 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg shadow-[0_0_12px_rgba(34,212,253,0.7)]" />
                  <div className="w-8 h-8 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg shadow-[0_0_12px_rgba(34,212,253,0.7)]" />
                </div>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-black/75 border border-white/20 text-slate-200 text-xs font-medium">
                    {t.cameraGuide}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg shadow-[0_0_12px_rgba(34,212,253,0.7)]" />
                  <div className="w-8 h-8 border-b-3 border-r-3 border-cyan-400 rounded-br-lg shadow-[0_0_12px_rgba(34,212,253,0.7)]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="relative z-30 p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center">
          {capturedBlob ? (
            /* Choose AI or Manual Transcription */
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
              <button
                onClick={handleRetake}
                className="btn-ghost flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-800/80 border-slate-600 hover:bg-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="size-4" />
                <span>{t.cameraRetake}</span>
              </button>

              <button
                onClick={() => handleConfirm('manual')}
                className="btn-ghost flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 border-indigo-400/50 bg-indigo-950/60 hover:bg-indigo-900 transition cursor-pointer"
              >
                <Edit3 className="size-4 text-cyan-400" />
                <span>{t.cameraConfirmManual}</span>
              </button>

              <button
                onClick={() => handleConfirm('ai')}
                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-xl cursor-pointer"
              >
                <Sparkles className="size-4 text-cyan-300" />
                <span>{t.cameraConfirmAI}</span>
              </button>
            </div>
          ) : (
            /* Trigger Capture Button */
            <div className="flex items-center gap-6">
              <button
                onClick={handleClose}
                className="btn-ghost px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-black/60 border-slate-700 hover:bg-slate-800"
              >
                {t.btnBack}
              </button>

              <button
                onClick={handleSnap}
                aria-label={t.btnCapture}
                className="group relative flex size-18 sm:size-20 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95 transition cursor-pointer hover:shadow-[0_0_40px_rgba(34,212,253,0.7)]"
              >
                <div className="size-full rounded-full border-3 border-black bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center group-hover:scale-98 transition">
                  <Camera className="size-7 text-white" />
                </div>
              </button>

              <div className="w-16" /> {/* Spacer */}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
