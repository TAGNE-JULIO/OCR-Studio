import React from 'react';
import { Camera, X, RotateCcw, FlipHorizontal } from 'lucide-react';
import { InputMode } from '../../types';

interface CameraModalProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setInputMode: (m: InputMode) => void;
  setCamFront: React.Dispatch<React.SetStateAction<boolean>>;
  capturePhoto: () => void;
}

export function CameraModal({ videoRef, canvasRef, setInputMode, setCamFront, capturePhoto }: CameraModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6">
      <div className="relative w-full max-w-xl h-[88vh] max-h-[700px] rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col">
        
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="relative z-20 m-3 sm:m-5 flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-3xl border-2 border-[#7c5cfc]/80 bg-black/40 backdrop-blur-[2px] shadow-[0_0_60px_rgba(124,92,252,0.4)]">
          
          <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-3 border-l-3 border-[#22d4fd] rounded-tl-xl shadow-[0_0_14px_#22d4fd]" />
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-3 border-r-3 border-[#22d4fd] rounded-tr-xl shadow-[0_0_14px_#22d4fd]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-3 border-l-3 border-[#22d4fd] rounded-bl-xl shadow-[0_0_14px_#22d4fd]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-3 border-r-3 border-[#22d4fd] rounded-br-xl shadow-[0_0_14px_#22d4fd]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080b14]/80 border border-[#7c5cfc]/30 backdrop-blur-md text-white text-xs font-bold shadow-lg">
              <Camera className="w-3.5 h-3.5 text-[#22d4fd]" />
              <span className="font-display">Scanner Pro · OCR Studio</span>
            </div>

            <button
              onClick={() => setInputMode('upload')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#080b14]/80 hover:bg-[#131928] text-white/80 hover:text-white border border-[#1e2640] backdrop-blur-md transition active:scale-95 shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pointer-events-none py-4">
            <span className="inline-block font-mono text-[11px] sm:text-xs bg-[#080b14]/90 px-4 py-1.5 rounded-full text-[#a98bff] font-semibold border border-[#7c5cfc]/40 backdrop-blur-md shadow-xl">
              Alignez le document manuscrit dans ce cadre
            </span>
          </div>

          <div className="flex items-center justify-between max-w-sm sm:max-w-md mx-auto w-full px-2 sm:px-6 pt-3 pb-2">
            <button
              onClick={() => setInputMode('upload')}
              className="btn-ghost flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-xl active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#8892b0]" />
              <span>Retour</span>
            </button>

            <button
              onClick={() => setCamFront(f => !f)}
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#131928] hover:bg-[#1e2640] text-white border border-[#1e2640] backdrop-blur-xl transition active:scale-95 shadow-xl cursor-pointer"
              title="Changer de caméra"
            >
              <FlipHorizontal className="w-4.5 h-4.5 text-[#22d4fd]" />
            </button>

            <button
              onClick={capturePhoto}
              className="btn-primary flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition cursor-pointer"
            >
              <Camera className="w-4.5 h-4.5" />
              <span>Capturer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
