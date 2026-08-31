'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Camera, FileText, Table2, Download, FileSpreadsheet,
  ZoomIn, ZoomOut, RotateCcw, PanelRightClose, PanelRightOpen,
  CheckCircle2, Loader2, AlertCircle, ChevronRight, ScanText,
  FileDown, X, FlipHorizontal, Maximize2, Minimize2, Info,
  PanelLeftClose, PanelLeftOpen, Images, Sparkles, FolderOpen, Menu,
  Copy, Check, BookOpen, Type, AlignLeft, Layers, Sliders, Sun, Moon,
  FileCheck2, Compass, ArrowRight, MousePointerClick, RefreshCw, Eye,
  Share2, MoreVertical, Plus
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LigneOCR {
  id: number;
  texte: string;
  confiance: number;
  boite: number[][] | null;
}

interface ResultatOCR {
  success: boolean;
  image_width: number;
  image_height: number;
  texte_complet: string;
  confiance_moyenne: number;
  lignes: LigneOCR[];
  matrice: string[][];
}

interface ImageDocument {
  id: number;
  file: File;
  url: string;
  name: string;
  resultat: ResultatOCR | null;
  step: AppStep;
  errMsg?: string;
}

type AppStep = 'empty' | 'loading' | 'done' | 'error';
type PanelTab = 'word' | 'editor' | 'table';
type MobileTab = 'docs' | 'scan' | 'word' | 'editor' | 'table';
type InputMode = 'upload' | 'camera';

// ─── Utilitaires & Couleurs ───────────────────────────────────────────────────
function confColor(p: number) {
  if (p >= 85) return { fg: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', text: 'Excellente' };
  if (p >= 60) return { fg: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', text: 'Moyenne' };
  return { fg: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)', text: 'Faible' };
}

export default function OCRStudio() {
  // Documents multi-fichiers
  const [images, setImages] = useState<ImageDocument[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const currentImage = images.find(i => i.id === selectedImageId) ?? null;
  const imageUrl = currentImage?.url ?? null;
  const fileName = currentImage?.name ?? '';
  const step = currentImage?.step ?? 'empty';
  const errMsg = currentImage?.errMsg ?? '';
  const resultat = currentImage?.resultat ?? null;

  // Navigation & Panneaux
  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('word');
  const [mobileTab, setMobileTab] = useState<MobileTab>('word');
  const [panelOpen, setPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [showBoxes, setShowBoxes] = useState(true);

  // Word Document View Options
  const [wordPaperMode, setWordPaperMode] = useState<'white' | 'dark'>('white');
  const [wordFont, setWordFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [wordFontSize, setWordFontSize] = useState<number>(15);
  const [copiedToast, setCopiedToast] = useState(false);
  const [formatToast, setFormatToast] = useState(false);

  // Responsive adaptatif
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1150) setPanelOpen(false);
      else setPanelOpen(true);
      if (window.innerWidth < 900) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom & Pan Canvas
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // Caméra WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camActive, setCamActive] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camFront, setCamFront] = useState(false);

  // Traitement Fichier
  const nextId = useRef(1);
  const processFile = useCallback(async (file: File, url?: string) => {
    const id = nextId.current++;
    const objectUrl = url ?? URL.createObjectURL(file);
    const name = file.name || 'document_scan.jpg';
    const newDoc: ImageDocument = {
      id,
      file,
      url: objectUrl,
      name,
      step: 'loading',
      resultat: null,
    };
    setImages(prev => [...prev, newDoc]);
    setSelectedImageId(id);
    setMobileTab('word');
    setZoom(1); setPan({ x: 0, y: 0 });

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('pretraitement', 'true');
const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}`;
      const res = await fetch(`${apiUrl}/api/analyze`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      const data: ResultatOCR = await res.json();
      if (!data.success) throw new Error('Échec de la reconnaissance IA.');

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, step: 'done', resultat: data } : img
      ));
      setTimeout(recalc, 250);
    } catch (e: any) {
      const msg = e.message ?? 'Erreur lors du traitement';
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, step: 'error', errMsg: msg } : img
      ));
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(f => processFile(f));
    }
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(f => {
        if (f.type.startsWith('image/')) processFile(f);
      });
    }
  };

  // Chargement démo
  const loadSampleImage = async () => {
    try {
      const res = await fetch('/test_manuscrit.png');
      const blob = await res.blob();
      const file = new File([blob], 'demo_manuscrit.png', { type: 'image/png' });
      processFile(file, '/test_manuscrit.png');
    } catch {
      alert("Impossible de charger l'image de démonstration.");
    }
  };

  // Gestion des documents
  const selectImage = (id: number) => {
    setSelectedImageId(id);
    setActiveLineId(null);
    setZoom(1); setPan({ x: 0, y: 0 });
    setTimeout(recalc, 200);
  };

  const removeImage = (id: number) => {
    setImages(prev => {
      const next = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  // Recalcul de l'échelle d'affichage
  const recalc = useCallback(() => {
    if (!imgRef.current || !resultat) return;
    const img = imgRef.current;
    const nw = img.naturalWidth  || resultat.image_width  || 1;
    const nh = img.naturalHeight || resultat.image_height || 1;
    setScale({
      x: img.clientWidth  / nw,
      y: img.clientHeight / nh,
    });
  }, [resultat]);

  useEffect(() => {
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  // Caméra WebRTC
  const startCamera = async (front = false) => {
    try {
      if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCamStream(stream);
      setCamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e: any) {
      alert("Impossible d'accéder à la caméra : " + e.message);
      setCamActive(false);
    }
  };

  const stopCamera = () => {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      setCamStream(null);
    }
    setCamActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      setInputMode('upload');
      processFile(file);
    }, 'image/jpeg', 0.95);
  };

  useEffect(() => {
    if (inputMode === 'camera') {
      startCamera(camFront);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [inputMode, camFront]);

  // Zoom / Pan / Touch
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(z => Math.min(8, Math.max(0.2, z * factor)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
    });
  };

  const onMouseUp = () => { dragging.current = false; };

  const touchOrigin = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchOrigin.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        px: pan.x,
        py: pan.y
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPan({
        x: touchOrigin.current.px + (e.touches[0].clientX - touchOrigin.current.x),
        y: touchOrigin.current.py + (e.touches[0].clientY - touchOrigin.current.y)
      });
    }
  };

  // Calcul boîte détection SVG
  const boxStyle = (boite: number[][] | null) => {
    if (!boite || boite.length < 4) return null;
    const xs = boite.map(p => p[0]);
    const ys = boite.map(p => p[1]);
    const minX = Math.min(...xs) * scale.x;
    const minY = Math.min(...ys) * scale.y;
    const maxX = Math.max(...xs) * scale.x;
    const maxY = Math.max(...ys) * scale.y;
    return {
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${maxX - minX}px`,
      height: `${maxY - minY}px`,
    };
  };

  // Édition & Synchronisation
  const updateLine = (id: number, val: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== selectedImageId || !img.resultat) return img;
      return {
        ...img,
        resultat: {
          ...img.resultat,
          lignes: img.resultat.lignes.map(l => l.id === id ? { ...l, texte: val } : l)
        }
      };
    }));
  };

  const updateFullText = (val: string) => {
    const rawLines = val.split('\n');
    setImages(prev => prev.map(img => {
      if (img.id !== selectedImageId || !img.resultat) return img;
      return {
        ...img,
        resultat: {
          ...img.resultat,
          texte_complet: val,
          lignes: rawLines.map((lineText, idx) => {
            const existing = img.resultat!.lignes[idx];
            return {
              id: idx,
              texte: lineText,
              confiance: existing ? existing.confiance : 1.0,
              boite: existing ? existing.boite : null,
            };
          })
        }
      };
    }));
  };

  // Exports & Helpers
  const dl = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const exportTXT = () => {
    if (!resultat) return;
    const blob = new Blob([resultat.lignes.map(l => l.texte).join('\n')], { type: 'text/plain;charset=utf-8' });
    dl(blob, `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'document'}_ocr.txt`);
  };

  const exportCSV = () => {
    if (!resultat?.matrice?.length) return;
    const blob = new Blob([resultat.matrice.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    dl(blob, `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'document'}_table.csv`);
  };

  const exportExcel = () => {
    if (!resultat?.matrice?.length) return;
    const ws = XLSX.utils.aoa_to_sheet(resultat.matrice);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OCR Studio');
    XLSX.writeFile(wb, `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'OCR_Studio'}.xlsx`);
  };

  const exportWord = () => {
    if (!resultat) return;
    const textHtml = resultat.lignes
      .map(l => `<p style="margin-bottom: 10pt; line-height: 1.7; font-size: 11.5pt; text-align: justify; color: #1e293b;">${l.texte.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('\n');
    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName || 'Transcription_OCR'}</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 20px; }
          h1 { color: #1e40af; font-size: 20pt; margin-bottom: 6pt; border-bottom: 2px solid #3b82f6; padding-bottom: 4pt; }
          .meta { color: #64748b; font-size: 10pt; margin-bottom: 24pt; font-style: italic; border-bottom: 1px solid #e2e8f0; padding-bottom: 6pt; }
          p { margin-bottom: 10pt; font-size: 11.5pt; line-height: 1.7; }
        </style>
      </head>
      <body>
        <h1>Transcription du Document</h1>
        <div class="meta">Document : ${fileName || 'Sans titre'} · Extrait par OCR Studio IA · Indice de confiance : ${confGlobal}%</div>
        <div style="margin-top: 16pt;">
          ${textHtml}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword' });
    dl(blob, `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'document'}_transcription.doc`);
  };

  const copyToClipboard = () => {
    if (!resultat) return;
    const full = resultat.lignes.map(l => l.texte).join('\n');
    navigator.clipboard.writeText(full);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const formatTextClean = () => {
    if (!resultat) return;
    const full = resultat.lignes.map(l => l.texte).join('\n');
    const cleaned = full
      .split('\n')
      .map(line => {
        let l = line.trim();
        if (!l) return '';
        l = l.charAt(0).toUpperCase() + l.slice(1);
        l = l.replace(/\s+([,.:;!?])/g, '$1');
        l = l.replace(/([,.:;!?])([A-Za-zÀ-ÿ])/g, '$1 $2');
        return l;
      })
      .join('\n');
    updateFullText(cleaned);
    setFormatToast(true);
    setTimeout(() => setFormatToast(false), 2000);
  };

  const confGlobal = resultat ? Math.round(resultat.confiance_moyenne * 100) : 0;
  const cc = confColor(confGlobal);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[#07090e] text-slate-100"
         style={{ fontFamily: 'var(--font-geist-sans)' }}>

      {/* ══ TOPBAR UNIFIÉE DESKTOP & MOBILE ════════════════════════════════ */}
      <header className="shrink-0 z-50 flex items-center justify-between px-3.5 sm:px-8 h-15 sm:h-16 border-b border-white/[0.08] backdrop-blur-xl bg-[#090d16]/90 shadow-md">

        {/* Logo & Titre */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-blue-500/25 border border-white/20">
            <ScanText className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" strokeWidth={2.3} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">OCR Studio</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                PRO IA
              </span>
            </div>
          </div>
        </div>

        {/* Workflow central (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full p-1.5 shadow-inner">
          {([
            { num: '01', label: '1. Importer', icon: Upload, state: 'empty' },
            { num: '02', label: '2. Vision IA', icon: ScanText, state: 'loading' },
            { num: '03', label: '3. Document Word', icon: BookOpen, state: 'done' },
            { num: '04', label: '4. Exporter', icon: FileDown, state: null },
          ]).map(({ num, label, icon: Icon, state: st }) => {
            const isActive = st !== null && step === st;
            const isDone = step === 'done' && (st === 'empty' || st === 'loading');
            return (
              <div key={num}
                   className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                     isActive ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30' :
                     isDone ? 'text-emerald-400' : 'text-slate-500'
                   }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Actions & Export Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Confiance badge */}
          {step === 'done' && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border"
                 style={{ background: cc.bg, borderColor: cc.border, color: cc.fg }}>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{confGlobal}%</span>
            </div>
          )}

          {/* Quick Exports (Desktop) */}
          {step === 'done' && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={exportWord}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-blue-300 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 shadow-sm transition active:scale-95"
                title="Télécharger le document formaté Word (.DOC)"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Word</span>
              </button>

              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 shadow-sm transition active:scale-95"
                title="Télécharger le tableur Excel (.XLSX)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel</span>
              </button>
            </div>
          )}

          {/* Galerie trigger */}
          <label className="relative cursor-pointer flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-md shadow-blue-500/25 border border-white/20 transition active:scale-95">
            <Images className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Galerie</span>
            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                   onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*" />
          </label>

          {/* Caméra trigger */}
          <button
            onClick={() => setInputMode('camera')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition active:scale-95"
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Caméra</span>
          </button>

          {/* Hamburger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1] active:scale-95 transition"
            aria-label="Menu"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ══ CORPS PRINCIPAL DE L'APPLICATION ════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">

        {/* ── 1. SIDEBAR DOCUMENTS (Desktop OU Mobile quand mobileTab === 'docs') ── */}
        <aside
          className={`flex flex-col shrink-0 border-r border-white/[0.08] bg-[#090d16]/95 transition-all duration-300 overflow-hidden ${
            // Sur Mobile
            images.length > 0 && mobileTab === 'docs' ? 'flex w-full absolute inset-0 z-30' :
            // Sur Desktop
            sidebarOpen ? 'hidden md:flex w-72' : 'w-0 hidden md:flex'
          }`}
        >
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-bold text-slate-200">
              <Layers className="w-4.5 h-4.5 text-blue-400" />
              <span>Documents ({images.length})</span>
            </div>
            {images.length > 0 && (
              <button
                onClick={() => { setImages([]); setSelectedImageId(null); }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline transition"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {images.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm space-y-2">
                <FolderOpen className="w-10 h-10 mx-auto opacity-40 text-blue-400" />
                <p className="font-medium">Aucun document chargé</p>
                <p className="text-xs text-slate-600">Importez une image pour débuter</p>
              </div>
            ) : (
              images.map(img => {
                const isSel = img.id === selectedImageId;
                const p = img.resultat ? Math.round(img.resultat.confiance_moyenne * 100) : 0;
                return (
                  <div
                    key={img.id}
                    onClick={() => { selectImage(img.id); setMobileTab('word'); }}
                    className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSel ? 'bg-blue-600/15 border-blue-500/50 shadow-md' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate font-semibold ${isSel ? 'text-white' : 'text-slate-300'}`}>
                        {img.name}
                      </p>
                      {img.step === 'loading' && (
                        <span className="flex items-center gap-1 text-xs text-blue-400 font-mono mt-0.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse IA...
                        </span>
                      )}
                      {img.step === 'done' && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-emerald-400 font-bold">{p}% certitude</span>
                          <span className="text-xs text-slate-500">· {img.resultat?.lignes.length} lignes</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-white/[0.06]">
            <label className="relative cursor-pointer flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl border border-dashed border-white/20 text-sm font-semibold text-slate-300 hover:border-blue-400 hover:text-white hover:bg-white/[0.03] transition shadow-sm">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Ajouter un document</span>
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*" />
            </label>
          </div>
        </aside>

        {/* ── 2. CANEVAS IMAGE & SCAN (Desktop OU Mobile quand mobileTab === 'scan') ── */}
        <main
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          className={`flex-1 relative flex items-center justify-center overflow-y-auto overflow-x-hidden blueprint-grid p-4 sm:p-10 ${
            // Sur Mobile
            images.length === 0 || mobileTab === 'scan' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Écran d'accueil quand aucun document n'est chargé */}
          {images.length === 0 && (
            <div className="w-full max-w-3xl mx-auto text-center space-y-5 sm:space-y-8 animate-fadeIn py-4 sm:py-12">
              
              {/* Badge supérieur */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-sm">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Intelligence Artificielle de Vision &amp; Transcription</span>
              </div>

              {/* Titre Principal */}
              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-snug">
                  Transformez vos écrits manuscrits en <br className="hidden sm:inline" />
                  <span className="gradient-text">documents Word éditables</span>
                </h1>
                <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Numérisez une lettre, une fiche ou des notes. L'IA lit l'écriture, reconstruit les paragraphes et prépare un document propre.
                </p>
              </div>

              {/* 3 Cartes d'Acquisition (Grid spacieuse sur Web, Verticale aérée sur Mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 pt-1 w-full max-w-2xl mx-auto">
                
                {/* 1. Galerie / Photothèque */}
                <label className="group relative cursor-pointer flex sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-3.5 sm:gap-4 p-4 sm:p-7 rounded-3xl bg-[#0f1422]/95 border border-white/[0.08] hover:border-blue-500/50 hover:bg-blue-500/[0.06] hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-200 active:scale-[0.98]">
                  <div className="flex sm:flex-col items-center gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition shrink-0">
                      <Images className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-lg text-white">Galerie &amp; Photos</p>
                      <p className="text-[11px] sm:text-xs text-slate-400">Importer JPG, PNG, WEBP</p>
                    </div>
                  </div>
                  <ChevronRight className="sm:hidden w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                         onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*" />
                </label>

                {/* 2. Caméra en Direct */}
                <button
                  type="button"
                  onClick={() => setInputMode('camera')}
                  className="group flex sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-3.5 sm:gap-4 p-4 sm:p-7 rounded-3xl bg-[#0f1422]/95 border border-white/[0.08] hover:border-rose-500/50 hover:bg-rose-500/[0.06] hover:shadow-2xl hover:shadow-rose-500/15 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex sm:flex-col items-center gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-400 group-hover:scale-110 transition shrink-0">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-lg text-white">Appareil Photo</p>
                      <p className="text-[11px] sm:text-xs text-slate-400">Scan avec cadrage assisté</p>
                    </div>
                  </div>
                  <ChevronRight className="sm:hidden w-5 h-5 text-slate-500 group-hover:text-rose-400" />
                </button>

                {/* 3. Démo Manuscrit */}
                <button
                  type="button"
                  onClick={loadSampleImage}
                  className="group flex sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-3.5 sm:gap-4 p-4 sm:p-7 rounded-3xl bg-[#0f1422]/95 border border-white/[0.08] hover:border-amber-500/50 hover:bg-amber-500/[0.06] hover:shadow-2xl hover:shadow-amber-500/15 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex sm:flex-col items-center gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition shrink-0">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-lg text-white">Exemple Démo</p>
                      <p className="text-[11px] sm:text-xs text-slate-400">Tester l'IA en 1 clic</p>
                    </div>
                  </div>
                  <ChevronRight className="sm:hidden w-5 h-5 text-slate-500 group-hover:text-amber-400" />
                </button>
              </div>

              {/* Badges de confiance */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] sm:text-sm text-slate-400">
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">✓ Écriture Cursive &amp; Imprimée</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">✓ Export Microsoft Word (.DOC)</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">✓ Sécurisé &amp; Local</span>
              </div>
            </div>
          )}

          {/* Affichage de l'image & Détections */}
          {imageUrl && (
            <div
              className="relative transition-transform duration-75 cursor-grab active:cursor-grabbing p-4"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Document OCR"
                onLoad={recalc}
                className="max-h-[75vh] max-w-[85vw] md:max-h-[82vh] md:max-w-[70vw] object-contain rounded-2xl shadow-2xl border border-white/10 pointer-events-none"
              />

              {showBoxes && step === 'done' && resultat && (
                <div className="absolute inset-0 pointer-events-none">
                  {resultat.lignes.map(l => {
                    const style = boxStyle(l.boite);
                    if (!style) return null;
                    const isActive = activeLineId === l.id;
                    return (
                      <div
                        key={l.id}
                        style={style}
                        className={`ocr-detection-box pointer-events-auto cursor-pointer ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setActiveLineId(l.id)}
                        onMouseLeave={() => setActiveLineId(null)}
                        onClick={() => { setActiveLineId(l.id); setMobileTab('editor'); }}
                        title={`Ligne ${l.id + 1} (${Math.round(l.confiance * 100)}% certitude)`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dock flottant Zoom bas de page */}
          {imageUrl && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl bg-[#090d16]/95 border border-white/[0.15]">
              <button
                onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-200 w-10 text-center font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(8, z * 1.2))}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-white/15" />

              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Réinitialiser la vue"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <div className="w-px h-4 bg-white/15" />

              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition ${
                  showBoxes ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cadres</span>
              </button>
            </div>
          )}
        </main>

        {/* ── 3. PANNEAU STUDIO WORD / LIGNES / TABLEAU (Desktop OU Mobile) ── */}
        {step === 'done' && resultat && (
          <aside
            className={`flex flex-col shrink-0 overflow-hidden backdrop-blur-xl bg-[#0d111a]/95 border-l border-white/[0.08] transition-all duration-300 ${
              // Sur Mobile : affiché quand l'onglet mobile sélectionné est word, editor ou table
              mobileTab === 'word' || mobileTab === 'editor' || mobileTab === 'table' ? 'flex w-full md:w-[520px] lg:w-[580px] xl:w-[640px]' :
              // Sur Desktop
              panelOpen ? 'hidden md:flex w-[520px] lg:w-[580px] xl:w-[640px]' : 'hidden'
            }`}
          >
            {/* Tabs supérieurs spacieux */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {([
                  { id: 'word' as PanelTab, label: 'Document Word', icon: BookOpen, color: '#60a5fa' },
                  { id: 'editor' as PanelTab, label: 'Lignes OCR', icon: FileText, color: '#34d399' },
                  { id: 'table' as PanelTab, label: 'Tableau', icon: Table2, color: '#a78bfa' },
                ]).map(({ id, label, icon: Icon, color }) => {
                  const isCurrent = (panelTab === id && window.innerWidth >= 768) || mobileTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setPanelTab(id); setMobileTab(id); }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#151c2e] text-white border-t-2 border-blue-500 shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: isCurrent ? color : 'inherit' }} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-slate-300">
                {resultat.lignes.length} lignes
              </div>
            </div>

            {/* Corps du panneau */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5">

              {/* ─ VUE 1 : DOCUMENT WORD PROPRE & LISIBLE ─ */}
              {((window.innerWidth >= 768 && panelTab === 'word') || mobileTab === 'word') && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                  
                  {/* Ruban d'outils Microsoft Word */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3.5 rounded-2xl bg-[#131826] border border-white/[0.08] shadow-md">
                    
                    {/* Actions Copier / Formater / Exporter */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <button
                        onClick={copyToClipboard}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border ${
                          copiedToast ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/[0.05] text-slate-200 border-white/[0.08] hover:bg-white/10'
                        }`}
                      >
                        {copiedToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedToast ? 'Copié !' : 'Copier'}</span>
                      </button>

                      <button
                        onClick={formatTextClean}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 border ${
                          formatToast ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                        }`}
                        title="Corrige la ponctuation, les majuscules et les espaces"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Formater</span>
                      </button>

                      <button
                        onClick={exportWord}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-blue-300 bg-blue-600/25 hover:bg-blue-600/35 border border-blue-500/40 shadow-sm transition active:scale-95"
                        title="Télécharger directement en document Microsoft Word (.DOC)"
                      >
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span>Export Word</span>
                      </button>
                    </div>

                    {/* Paramètres Typographie & Papier */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => setWordPaperMode(m => m === 'white' ? 'dark' : 'white')}
                        className={`p-2 rounded-xl border text-xs sm:text-sm font-semibold transition ${
                          wordPaperMode === 'white' ? 'bg-amber-100 text-slate-900 border-amber-300' : 'bg-white/[0.05] text-slate-300 border-white/[0.08]'
                        }`}
                        title={wordPaperMode === 'white' ? 'Basculer en mode sombre' : 'Basculer en feuille papier blanc'}
                      >
                        {wordPaperMode === 'white' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>

                      <div className="flex items-center rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                        <button
                          onClick={() => setWordFont('serif')}
                          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-serif ${wordFont === 'serif' ? 'bg-blue-600/30 text-white font-bold' : 'text-slate-400'}`}
                        >
                          Serif
                        </button>
                        <button
                          onClick={() => setWordFont('sans')}
                          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-sans ${wordFont === 'sans' ? 'bg-blue-600/30 text-white font-bold' : 'text-slate-400'}`}
                        >
                          Sans
                        </button>
                        <button
                          onClick={() => setWordFont('mono')}
                          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-mono ${wordFont === 'mono' ? 'bg-blue-600/30 text-white font-bold' : 'text-slate-400'}`}
                        >
                          Mono
                        </button>
                      </div>

                      <div className="flex items-center border border-white/10 rounded-xl p-0.5 sm:p-1 bg-white/[0.02]">
                        <button
                          onClick={() => setWordFontSize(s => Math.max(12, s - 1))}
                          className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-bold"
                        >
                          A-
                        </button>
                        <span className="text-xs font-mono px-1 text-slate-200 font-bold">{wordFontSize}</span>
                        <button
                          onClick={() => setWordFontSize(s => Math.min(26, s + 1))}
                          className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-bold"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feuille Virtuelle Word Réaliste */}
                  <div
                    className={`relative rounded-3xl p-5 sm:p-10 transition-all duration-200 shadow-2xl border ${
                      wordPaperMode === 'white'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-xl shadow-slate-950/20'
                        : 'bg-[#121724] text-slate-100 border-white/[0.08] shadow-black/70'
                    }`}
                    style={{ minHeight: '400px' }}
                  >
                    <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${
                      wordPaperMode === 'white' ? 'border-slate-200' : 'border-white/[0.08]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className={`text-xs sm:text-base font-bold tracking-tight ${wordPaperMode === 'white' ? 'text-slate-800' : 'text-slate-200'}`}>
                          {fileName || 'Transcription Document'}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full font-bold"
                            style={{ background: cc.bg, color: cc.fg, border: `1px solid ${cc.border}` }}>
                        ● {confGlobal}% précision
                      </span>
                    </div>

                    <textarea
                      value={resultat.lignes.map(l => l.texte).join('\n')}
                      onChange={(e) => updateFullText(e.target.value)}
                      rows={Math.max(12, resultat.lignes.length + 2)}
                      className={`w-full bg-transparent outline-none resize-y leading-relaxed ${
                        wordPaperMode === 'white' ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
                      } ${wordFont === 'serif' ? 'font-serif' : wordFont === 'mono' ? 'font-mono' : 'font-sans'}`}
                      style={{
                        fontSize: `${wordFontSize}px`,
                        lineHeight: '1.85',
                        minHeight: '260px',
                      }}
                      placeholder="Votre texte s'affichera ici..."
                    />

                    <div className={`mt-5 pt-3.5 border-t flex flex-wrap items-center justify-between text-xs sm:text-sm ${
                      wordPaperMode === 'white' ? 'border-slate-200 text-slate-600' : 'border-white/[0.08] text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5 font-medium">
                        <span><strong>{resultat.lignes.map(l => l.texte).join(' ').trim().split(/\s+/).filter(Boolean).length}</strong> mots</span>
                        <span>·</span>
                        <span><strong>{resultat.lignes.map(l => l.texte).join('').length}</strong> car.</span>
                        <span>·</span>
                        <span><strong>{resultat.lignes.length}</strong> lignes</span>
                      </div>
                      <span className="text-blue-500 font-bold hidden sm:inline">
                        Édition synchronisée Word
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ VUE 2 : LIGNES OCR DÉTAILLÉES ─ */}
              {((window.innerWidth >= 768 && panelTab === 'editor') || mobileTab === 'editor') && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {[
                      { label: 'Confiance', val: `${confGlobal}%`, color: cc.fg, icon: CheckCircle2 },
                      { label: 'Lignes', val: `${resultat.lignes.length}`, color: '#60a5fa', icon: FileText },
                      { label: 'Colonnes', val: `${resultat.matrice?.[0]?.length ?? 1}`, color: '#a78bfa', icon: Table2 },
                    ].map(({ label, val, color, icon: Icon }) => (
                      <div key={label} className="p-3 sm:p-4 rounded-2xl bg-[#131826] border border-white/[0.06] text-center">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color }} />
                        <p className="text-base sm:text-xl font-extrabold" style={{ color }}>{val}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    {resultat.lignes.map(l => {
                      const isActive = activeLineId === l.id;
                      const p = Math.round(l.confiance * 100);
                      const lc = confColor(p);
                      return (
                        <div
                          key={l.id}
                          onMouseEnter={() => setActiveLineId(l.id)}
                          onMouseLeave={() => setActiveLineId(null)}
                          className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                            isActive ? 'bg-blue-600/15 border-blue-500/50 shadow-lg' : 'bg-[#131826] border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300">
                              Ligne {l.id + 1}
                            </span>
                            <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full font-bold"
                                  style={{ background: lc.bg, color: lc.fg, border: `1px solid ${lc.border}` }}>
                              {p}% {lc.text}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={l.texte}
                            onChange={(e) => updateLine(l.id, e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-400 transition font-medium"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─ VUE 3 : TABLEAU SPATIAL ─ */}
              {((window.innerWidth >= 768 && panelTab === 'table') || mobileTab === 'table') && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-slate-400">Reconstruction spatiale en grille</p>
                    <button
                      onClick={exportExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 transition active:scale-95"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Excel</span>
                    </button>
                  </div>

                  <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#131826]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm text-left">
                        <tbody>
                          {resultat.matrice?.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 border-r border-white/[0.04] text-slate-200 whitespace-nowrap">
                                  {cell || <span className="text-slate-600 italic">vide</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ══ BARRE DE NAVIGATION INFÉRIEURE MOBILE (LORSQU'UN DOCUMENT EST CHARGÉ) ══ */}
      {images.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1.5 bg-[#090d16]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          {([
            { id: 'docs' as MobileTab, label: 'Docs', icon: Layers, count: images.length },
            { id: 'scan' as MobileTab, label: 'Image', icon: Maximize2 },
            { id: 'word' as MobileTab, label: 'Word', icon: BookOpen },
            { id: 'editor' as MobileTab, label: 'Lignes', icon: FileText },
            { id: 'table' as MobileTab, label: 'Tableau', icon: Table2 },
          ]).map(({ id, label, icon: Icon, count }) => {
            const isSel = mobileTab === id;
            return (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                  isSel ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4.5 h-4.5" />
                  {count !== undefined && count > 1 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-blue-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ══ MODAL CAMÉRA ASSISTÉE ══════════════════════════════════════════ */}
      {inputMode === 'camera' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6">
          <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-[#0d111a] border border-white/20 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-4.5 h-4.5 text-rose-400" />
                <span className="font-bold text-sm sm:text-base text-white">Prise de vue du document</span>
              </div>
              <button
                onClick={() => setInputMode('upload')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-6 sm:inset-8 border-2 border-dashed border-white/40 rounded-3xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] sm:text-xs bg-black/60 px-3.5 py-1 rounded-full text-white/90 backdrop-blur-sm">
                  Alignez le document dans ce cadre
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setCamFront(f => !f)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-300 hover:bg-white/10 border border-white/10 transition"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>Retourner</span>
              </button>

              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 shadow-lg shadow-rose-500/30 transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capturer le document</span>
              </button>

              <div className="w-12 sm:w-16" />
            </div>
          </div>
        </div>
      )}

      {/* ══ MENU TIROIR MOBILE COMPLET (TOUTES LES OPTIONS WEB) ═════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto flex flex-col h-full w-[85vw] max-w-xs bg-[#0d111a] border-l border-white/10 shadow-2xl z-10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 shrink-0" />

            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-600 text-white">
                  <ScanText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">OCR Studio</p>
                  <p className="text-[10px] text-slate-400">Toutes les fonctionnalités</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* 1. Navigation directe */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Navigation Vues</p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => { setMobileTab('docs'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs font-semibold"
                    >
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Bibliothèque ({images.length} documents)</span>
                    </button>
                    <button
                      onClick={() => { setMobileTab('scan'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs font-semibold"
                    >
                      <Maximize2 className="w-4 h-4 text-blue-400" />
                      <span>Image &amp; Cadres IA</span>
                    </button>
                    <button
                      onClick={() => { setMobileTab('word'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold"
                    >
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>Document Word (.DOC)</span>
                    </button>
                    <button
                      onClick={() => { setMobileTab('editor'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs font-semibold"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Lignes Individuelles OCR</span>
                    </button>
                    <button
                      onClick={() => { setMobileTab('table'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs font-semibold"
                    >
                      <Table2 className="w-4 h-4 text-purple-400" />
                      <span>Tableau Spatial (.XLSX)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Acquisition */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Acquisition &amp; Scan</p>
                <div className="flex flex-col gap-2">
                  <label className="relative cursor-pointer flex items-center justify-between p-3.5 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-white font-semibold text-xs active:scale-95 transition">
                    <span className="flex items-center gap-3">
                      <Images className="w-4 h-4 text-blue-400" />
                      <span>Importer de la Galerie</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                           onChange={(e) => { setMobileMenuOpen(false); onFileInput(e); }} accept="image/*" />
                  </label>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setInputMode('camera'); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-xs active:scale-95 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>Scanner avec l'Appareil</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); loadSampleImage(); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-xs active:scale-95 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Exemple Démo Manuscrit</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* 3. Exports */}
              {step === 'done' && (
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Exportations Complètes</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setMobileMenuOpen(false); exportWord(); }} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold active:scale-95 transition">
                      <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Document Word (.DOC)</span>
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setMobileMenuOpen(false); exportExcel(); }} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold active:scale-95 transition">
                      <span className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Tableur Excel (.XLSX)</span>
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setMobileMenuOpen(false); exportTXT(); }} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] text-slate-200 border border-white/[0.08] text-xs font-semibold active:scale-95 transition">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Fichier Texte (.TXT)</span>
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setMobileMenuOpen(false); exportCSV(); }} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] text-slate-200 border border-white/[0.08] text-xs font-semibold active:scale-95 transition">
                      <span className="flex items-center gap-2"><Table2 className="w-4 h-4" /> Fichier Table (.CSV)</span>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
