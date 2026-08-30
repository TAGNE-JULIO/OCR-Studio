'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Camera, FileText, Table2, Download, FileSpreadsheet,
  ZoomIn, ZoomOut, RotateCcw, PanelRightClose, PanelRightOpen,
  CheckCircle2, Loader2, AlertCircle, ChevronRight, ScanText,
  FileDown, X, FlipHorizontal, Maximize2, Minimize2, Info,
  PanelLeftClose, PanelLeftOpen, Images, Sparkles, FolderOpen, Menu,
  Copy, Check, BookOpen, Type, AlignLeft
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
type MobileView = 'sidebar' | 'doc' | 'data';
type InputMode = 'upload' | 'camera';

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function confColor(p: number) {
  if (p >= 85) return { fg: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' };
  if (p >= 60) return { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
  return { fg: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' };
}

function ConfBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const c = confColor(pct);
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
      {pct}%
    </span>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function OCRStudio() {
  // Multi‑image state
  const [images, setImages] = useState<ImageDocument[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const currentImage = images.find(i => i.id === selectedImageId) ?? null;
  const imageUrl = currentImage?.url ?? null;
  const fileName = currentImage?.name ?? '';
  const step = currentImage?.step ?? 'empty';
  const errMsg = currentImage?.errMsg ?? '';
  const resultat = currentImage?.resultat ?? null;

  // Navigation
  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [panelTab, setPanelTab]   = useState<PanelTab>('word');
  const [panelOpen, setPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>('doc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('upload');

  // Word Document View State
  const [wordFont, setWordFont] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [wordFontSize, setWordFontSize] = useState<number>(14);
  const [copiedToast, setCopiedToast] = useState(false);

  // Auto-close panels on smaller screens to prevent image squishing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1150) {
        setPanelOpen(false);
      } else {
        setPanelOpen(true);
      }
      if (window.innerWidth < 850) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom / Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // Caméra
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [camActive, setCamActive]   = useState(false);
  const [camStream, setCamStream]   = useState<MediaStream | null>(null);
  const [camFront, setCamFront]     = useState(false);
  const [camFullscreen, setCamFullscreen] = useState(false);

  // ── Gestion fichier ───────────────────────────────────────────────────────
  const nextId = useRef(1);
  const processFile = useCallback(async (file: File, url?: string) => {
    const id = nextId.current++;
    const objectUrl = url ?? URL.createObjectURL(file);
    const name = file.name || 'capture.jpg';
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
    setMobileView('doc');
    setZoom(1); setPan({ x: 0, y: 0 });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('pretraitement', 'true');
      const res  = await fetch('http://localhost:8000/api/analyze', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      const data: ResultatOCR = await res.json();
      if (!data.success) throw new Error('L\'IA n\'a pas pu analyser ce document.');
      
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, step: 'done', resultat: data } : img
      ));
      setTimeout(recalc, 200);
    } catch (e: any) {
      const msg = e.message ?? 'Erreur inconnue';
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(f => processFile(f));
    }
  };

  // Helper to select an image from the sidebar
  const selectImage = (id: number) => {
    if (id === selectedImageId) return;
    setSelectedImageId(id);
    setMobileView('doc');
    setZoom(1); setPan({ x: 0, y: 0 });
    setTimeout(recalc, 200);
  };

  // Helper to remove an image from the sidebar
  const removeImage = (id: number) => {
    setImages(prev => prev.filter(i => i.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  };

  // Helper to handle gallery import from camera screen
  const onGalleryInputFromCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopCamera();
    setInputMode('upload');
    onFileInput(e);
  };

  // Helper to load sample image from gallery demo
  const loadSampleImage = async () => {
    try {
      const res = await fetch('/test_manuscrit.png');
      if (!res.ok) throw new Error('Impossible de charger l\'exemple');
      const blob = await res.blob();
      const file = new File([blob], 'exemple_manuscrit.png', { type: 'image/png' });
      processFile(file);
    } catch (e) {
      console.error('Erreur chargement exemple:', e);
    }
  };

  // ── Caméra ───────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: camFront ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCamStream(stream);
      setCamActive(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions de votre navigateur.');
    }
  };

  const stopCamera = useCallback(() => {
    camStream?.getTracks().forEach(t => t.stop());
    setCamStream(null);
    setCamActive(false);
    setCamFullscreen(false);
  }, [camStream]);

  const flipCamera = async () => {
    stopCamera();
    setCamFront(f => !f);
  };

  useEffect(() => {
    if (inputMode === 'camera' && !camActive) startCamera();
    if (inputMode === 'upload' && camActive) stopCamera();
  }, [inputMode]);

  useEffect(() => {
    if (camActive && videoRef.current && camStream) {
      videoRef.current.srcObject = camStream;
      videoRef.current.play();
    }
  }, [camActive, camStream]);

  useEffect(() => () => { camStream?.getTracks().forEach(t => t.stop()); }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    canvasRef.current.width  = v.videoWidth;
    canvasRef.current.height = v.videoHeight;
    canvasRef.current.getContext('2d')?.drawImage(v, 0, 0);
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `capture_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`, { type: 'image/jpeg' });
      const url  = URL.createObjectURL(blob);
      stopCamera();
      setInputMode('upload');
      processFile(file, url);
    }, 'image/jpeg', 0.95);
  };

  // ── Scale ────────────────────────────────────────────────────────────────
  const recalc = () => {
    if (!imgRef.current || !resultat) return;
    const img = imgRef.current;
    const w = img.offsetWidth || img.clientWidth || img.naturalWidth || resultat.image_width;
    const h = img.offsetHeight || img.clientHeight || img.naturalHeight || resultat.image_height;
    setScale({ x: w / resultat.image_width, y: h / resultat.image_height });
  };
  useEffect(() => { window.addEventListener('resize', recalc); return () => window.removeEventListener('resize', recalc); });

  // ── Zoom / Pan ───────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(8, Math.max(0.15, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  };
  const onMD = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMM = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({ x: dragOrigin.current.px + e.clientX - dragOrigin.current.mx, y: dragOrigin.current.py + e.clientY - dragOrigin.current.my });
  };
  const onMU = () => { dragging.current = false; };

  const onTS = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      dragOrigin.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, px: pan.x, py: pan.y };
    }
  };
  const onTM = (e: React.TouchEvent) => {
    if (!dragging.current || e.touches.length !== 1) return;
    setPan({
      x: dragOrigin.current.px + e.touches[0].clientX - dragOrigin.current.mx,
      y: dragOrigin.current.py + e.touches[0].clientY - dragOrigin.current.my
    });
  };
  const onTE = () => { dragging.current = false; };

  // ── Boîtes OCR ───────────────────────────────────────────────────────────
  // Use a constant 2px padding in layout space to ensure boxes surround the text snugly
  const boxStyle = (boite: number[][] | null): React.CSSProperties => {
    if (!boite || boite.length !== 4) return { display: 'none' };
    const xs = boite.map(p => p[0]);
    const ys = boite.map(p => p[1]);
    const padding = 2;
    const left   = Math.round(Math.min(...xs) * scale.x - padding);
    const top    = Math.round(Math.min(...ys) * scale.y - padding);
    const width  = Math.round((Math.max(...xs) - Math.min(...xs)) * scale.x + 2 * padding);
    const height = Math.round((Math.max(...ys) - Math.min(...ys)) * scale.y + 2 * padding);
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      boxSizing: 'border-box',
    };
  };

  // ── Édition ──────────────────────────────────────────────────────────────
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

  // ── Export & Traitement de Texte Word ──────────────────────────────────
  const dl = (blob: Blob, name: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  };
  const exportTXT   = () => resultat && dl(new Blob([resultat.lignes.map(l => l.texte).join('\n')], { type: 'text/plain;charset=utf-8' }), `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'ocr'}.txt`);
  const exportCSV   = () => resultat?.matrice?.length && dl(new Blob([resultat.matrice.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'ocr'}.csv`);
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
      .map(l => `<p style="margin-bottom: 8pt; line-height: 1.6; font-size: 11pt; text-align: justify;">${l.texte.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('\n');
    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName || 'Document_OCR'}</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; }
          h1 { color: #1e40af; font-size: 18pt; margin-bottom: 8pt; border-bottom: 2px solid #3b82f6; padding-bottom: 4pt; }
          .meta { color: #64748b; font-size: 9.5pt; margin-bottom: 20pt; font-style: italic; }
          p { margin-bottom: 8pt; font-size: 11pt; }
        </style>
      </head>
      <body>
        <h1>Transcription du Document</h1>
        <div class="meta">Fichier source : ${fileName || 'Sans titre'} · Extrait par OCR Studio IA · Confiance globale : ${confGlobal}%</div>
        ${textHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword' });
    dl(blob, `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'document'}_transcription.doc`);
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
  };

  const confGlobal = resultat ? Math.round(resultat.confiance_moyenne * 100) : 0;
  const cc = confColor(confGlobal);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden"
         style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-geist-sans)' }}>

      {/* ══ TOPBAR ══════════════════════════════════════════════════════════ */}
      <header className="shrink-0 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14"
              style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 12px rgba(0,0,0,0.4)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', boxShadow: '0 2px 8px rgba(79,142,247,0.4)' }}>
            <ScanText className="w-4 h-4 text-white" strokeWidth={2.5}/>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-white text-base tracking-tight">OCR</span>
            <span className="font-light text-gray-400 text-base">Studio</span>
          </div>
        </div>

        {/* Toggle sidebar (desktop) */}
        {images.length > 0 && (
          <button onClick={() => setSidebarOpen(o => !o)}
                  title={sidebarOpen ? 'Masquer la liste des documents' : 'Afficher la liste des documents'}
                  className="hidden md:flex p-2 rounded-lg transition-all hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
          </button>
        )}

        {/* Workflow steps (desktop) */}
        <div className="hidden lg:flex items-center gap-0.5 ml-2">
          {[
            { label: 'Importer', icon: Upload, active: step === 'empty' },
            { label: 'Analyser',  icon: ScanText, active: step === 'loading' },
            { label: 'Corriger', icon: FileText, active: step === 'done' },
            { label: 'Exporter', icon: FileDown, active: false },
          ].map(({ label, icon: Icon, active }, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 mx-0.5" style={{ color: 'var(--border-light)' }}/>}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                   style={active
                     ? { background: 'rgba(79,142,247,0.15)', color: 'var(--accent)', border: '1px solid rgba(79,142,247,0.3)' }
                     : step === 'done' && i < 3
                       ? { color: '#34d399' }
                       : { color: 'var(--text-muted)' }}>
                {step === 'done' && i < 3 && !active
                  ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34d399' }}/>
                  : <Icon className="w-3.5 h-3.5"/>}
                {label}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Confiance */}
          {step === 'done' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                 style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.fg }}>
              <CheckCircle2 className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">{confGlobal}% confiance</span>
              <span className="sm:hidden">{confGlobal}%</span>
            </div>
          )}

          {/* Exports (Desktop) */}
          {step === 'done' && (
            <div className="hidden md:flex items-center gap-1.5">
              <button onClick={exportWord} title="Exporter au format Word (.DOC)"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)' }}>
                <BookOpen className="w-3.5 h-3.5"/> Word
              </button>
              <button onClick={exportExcel} title="Exporter Excel"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}>
                <FileSpreadsheet className="w-3.5 h-3.5"/>
                <span>Excel</span>
              </button>
              <button onClick={exportTXT} title="Exporter texte brut"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <FileText className="w-3.5 h-3.5"/> TXT
              </button>
              <button onClick={exportCSV} title="Exporter CSV"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <Table2 className="w-3.5 h-3.5"/> CSV
              </button>
            </div>
          )}

          {/* Bouton Galerie (Desktop) */}
          <label className="hidden md:flex relative cursor-pointer items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 shrink-0"
                 style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 10px rgba(79,142,247,0.35)' }}>
            <Images className="w-4 h-4"/>
            <span>Galerie</span>
            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*"/>
          </label>

          {/* Bouton Caméra (Desktop) */}
          <button onClick={() => setInputMode(m => m === 'camera' ? 'upload' : 'camera')}
                  title="Prendre une photo"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 shrink-0"
                  style={inputMode === 'camera'
                    ? { background: '#f87171', color: '#fff' }
                    : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <Camera className="w-4 h-4"/>
            <span>{inputMode === 'camera' ? 'Fermer' : 'Caméra'}</span>
          </button>

          {/* Toggle panneau (Desktop) */}
          {step === 'done' && (
            <button onClick={() => setPanelOpen(o => !o)}
                    title={panelOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
                    className="hidden md:flex p-2 rounded-lg transition-all"
                    style={{ background: panelOpen ? 'rgba(79,142,247,0.15)' : 'var(--bg-tertiary)', border: `1px solid ${panelOpen ? 'rgba(79,142,247,0.35)' : 'var(--border)'}`, color: panelOpen ? 'var(--accent)' : 'var(--text-muted)' }}>
              {panelOpen ? <PanelRightClose className="w-4 h-4"/> : <PanelRightOpen className="w-4 h-4"/>}
            </button>
          )}

          {/* Quick Mobile Galerie Icon */}
          <label className="md:hidden relative cursor-pointer flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95 shrink-0"
                 style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(79,142,247,0.3)' }}
                 title="Importer depuis la galerie">
            <Images className="w-4 h-4"/>
            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*"/>
          </label>

          {/* Quick Mobile Caméra Icon */}
          <button onClick={() => setInputMode(m => m === 'camera' ? 'upload' : 'camera')}
                  title="Prendre une photo"
                  className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95 shrink-0"
                  style={inputMode === 'camera'
                    ? { background: '#f87171', color: '#fff' }
                    : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <Camera className="w-4 h-4"/>
          </button>

          {/* Bouton Hamburger (Mobile) — Premium */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="md:hidden relative flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95 shrink-0"
            style={{
              background: mobileMenuOpen
                ? 'linear-gradient(135deg,#4f8ef7,#a78bfa)'
                : 'var(--bg-tertiary)',
              border: mobileMenuOpen
                ? '1px solid rgba(167,139,250,0.4)'
                : '1px solid var(--border)',
              boxShadow: mobileMenuOpen
                ? '0 0 18px rgba(79,142,247,0.4)'
                : 'none',
            }}
            aria-label="Menu principal"
          >
            {mobileMenuOpen
              ? <X className="w-4.5 h-4.5 text-white" />
              : <Menu className="w-4.5 h-4.5 text-gray-300" />}
          </button>
        </div>
      </header>

      {/* ══ MOBILE MENU DRAWER ═════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="relative ml-auto flex flex-col h-full overflow-hidden z-10"
            style={{
              width: '85vw',
              maxWidth: '360px',
              background: 'linear-gradient(180deg, rgba(18,22,34,0.98) 0%, rgba(13,17,28,0.99) 100%)',
              borderLeft: '1px solid rgba(79,142,247,0.18)',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Top accent gradient line */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg,#4f8ef7,#a78bfa,#34d399)', flexShrink: 0 }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', boxShadow: '0 4px 14px rgba(79,142,247,0.45)' }}>
                  <ScanText className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-tight leading-none">OCR Studio</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Intelligence Artificielle &amp; Vision
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 active:scale-95"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

              {/* ── Navigation / Vues ───────────────────── */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>Vues &amp; Outils</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => { setMobileView('doc'); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all"
                      style={{
                        background: mobileView === 'doc' ? 'rgba(79,142,247,0.18)' : 'rgba(255,255,255,0.03)',
                        borderColor: mobileView === 'doc' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                        color: mobileView === 'doc' ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Image</span>
                    </button>

                    <button
                      onClick={() => { setMobileView('data'); setPanelTab('word'); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all"
                      style={{
                        background: mobileView === 'data' && panelTab === 'word' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                        borderColor: mobileView === 'data' && panelTab === 'word' ? '#60a5fa' : 'rgba(255,255,255,0.08)',
                        color: mobileView === 'data' && panelTab === 'word' ? '#60a5fa' : 'var(--text-secondary)',
                      }}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Word</span>
                    </button>

                    <button
                      onClick={() => { setMobileView('data'); setPanelTab('editor'); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all"
                      style={{
                        background: mobileView === 'data' && panelTab === 'editor' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.03)',
                        borderColor: mobileView === 'data' && panelTab === 'editor' ? '#34d399' : 'rgba(255,255,255,0.08)',
                        color: mobileView === 'data' && panelTab === 'editor' ? '#34d399' : 'var(--text-secondary)',
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Lignes</span>
                    </button>

                    <button
                      onClick={() => { setMobileView('data'); setPanelTab('table'); setMobileMenuOpen(false); }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all"
                      style={{
                        background: mobileView === 'data' && panelTab === 'table' ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                        borderColor: mobileView === 'data' && panelTab === 'table' ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                        color: mobileView === 'data' && panelTab === 'table' ? '#a78bfa' : 'var(--text-secondary)',
                      }}
                    >
                      <Table2 className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Tableau</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Acquisition ─────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>Acquisition</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <div className="space-y-2.5">
                  {/* Galerie */}
                  <label className="relative cursor-pointer group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] overflow-hidden"
                         style={{
                           background: 'linear-gradient(135deg,rgba(79,142,247,0.22),rgba(167,139,250,0.15))',
                           border: '1px solid rgba(79,142,247,0.3)',
                           boxShadow: '0 2px 16px rgba(79,142,247,0.15)',
                         }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(79,142,247,0.25)', border: '1px solid rgba(79,142,247,0.4)' }}>
                      <Images className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-none">Galerie Photos</p>
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Importer depuis la photothèque</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                           onChange={(e) => { setMobileMenuOpen(false); onFileInput(e); }}
                           accept="image/png,image/jpeg,image/webp,image/jpg,image/*" />
                  </label>
                  {/* Camera */}
                  <button type="button"
                    onClick={() => { setMobileMenuOpen(false); setInputMode('camera'); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.3)' }}>
                      <Camera className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold text-sm leading-none">Appareil Photo</p>
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Prise de vue en direct</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </button>
                  {/* Demo */}
                  <button type="button"
                    onClick={() => { setMobileMenuOpen(false); loadSampleImage(); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold text-sm leading-none">Exemple Demo</p>
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Tester avec un manuscrit</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </button>
                </div>
              </div>

              {/* ── Documents List (Mobile) ─────────────── */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>Documents ({images.length})</span>
                    <button
                      onClick={() => { setImages([]); setSelectedImageId(null); setMobileMenuOpen(false); }}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Tout effacer
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {images.map(img => (
                      <div
                        key={img.id}
                        onClick={() => { selectImage(img.id); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer"
                        style={{
                          background: img.id === selectedImageId ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.03)',
                          borderColor: img.id === selectedImageId ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs truncate flex-1 text-gray-200">{img.name}</span>
                        {img.resultat && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-emerald-400">
                            {Math.round(img.resultat.confiance_moyenne * 100)}%
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="p-1 text-gray-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Workflow ─────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>Workflow IA</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Importer', Icon: Upload,   step_match: 'empty',   color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)',  num: '01' },
                    { label: 'Analyser', Icon: ScanText, step_match: 'loading', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', num: '02' },
                    { label: 'Corriger', Icon: FileText, step_match: 'done',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  num: '03' },
                    { label: 'Exporter', Icon: FileDown, step_match: null,      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  num: '04' },
                  ] as Array<{ label: string; Icon: React.ElementType; step_match: string | null; color: string; bg: string; num: string }>
                  ).map(({ label, Icon, step_match, color, bg, num }) => {
                    const isActive = step_match !== null && step === step_match;
                    const isDone = step === 'done' && (step_match === 'empty' || step_match === 'loading');
                    return (
                      <div key={num} className="relative flex flex-col gap-2 p-3.5 rounded-2xl overflow-hidden"
                           style={{
                             background: isActive ? bg : 'rgba(255,255,255,0.03)',
                             border: `1px solid ${isActive ? color + '55' : 'rgba(255,255,255,0.07)'}`,
                           }}>
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                               style={{ background: bg, border: `1px solid ${color}30` }}>
                            {isDone
                              ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                              : <Icon className="w-3.5 h-3.5" style={{ color }} />}
                          </div>
                          <span className="text-[9px] font-black opacity-20 tracking-widest" style={{ color }}>{num}</span>
                        </div>
                        <p className="text-xs font-semibold leading-none"
                           style={{ color: isActive ? color : 'rgba(255,255,255,0.55)' }}>{label}</p>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5"
                               style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Exports ──────────────────────────────── */}
              {step === 'done' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>Exporter</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                  {/* Confidence bar */}
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-3"
                       style={{ background: cc.bg, border: `1px solid ${cc.border}` }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: cc.fg }} />
                    <span className="text-xs font-semibold" style={{ color: cc.fg }}>Confiance : {confGlobal}%</span>
                    <div className="ml-auto w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${confGlobal}%`, background: cc.fg }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* Word .DOC */}
                    <button onClick={() => { setMobileMenuOpen(false); exportWord(); }}
                      className="w-full group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg,rgba(37,99,235,0.22),rgba(59,130,246,0.1))',
                        border: '1px solid rgba(59,130,246,0.35)',
                        boxShadow: '0 2px 14px rgba(59,130,246,0.12)'
                      }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.4)' }}>
                        <BookOpen className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-blue-400 text-xs font-bold leading-none">Document Word (.DOC)</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(147,197,253,0.7)' }}>Mise en page propre Word</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    {/* Excel .XLSX */}
                    <button onClick={() => { setMobileMenuOpen(false); exportExcel(); }}
                      className="w-full group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg,rgba(52,211,153,0.18),rgba(16,185,129,0.08))',
                        border: '1px solid rgba(52,211,153,0.35)',
                      }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.4)' }}>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-emerald-400 text-xs font-bold leading-none">Tableur Excel (.XLSX)</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(52,211,153,0.55)' }}>Tableau complet structuré</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </button>

                    {/* TXT */}
                    <button onClick={() => { setMobileMenuOpen(false); exportTXT(); }}
                      className="w-full group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)' }}>
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-xs font-semibold leading-none">Texte Brut</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>.TXT · Universel</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </button>

                    {/* CSV */}
                    <button onClick={() => { setMobileMenuOpen(false); exportCSV(); }}
                      className="w-full group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <Table2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-xs font-semibold leading-none">Tableau CSV</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>.CSV · Structuré</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>OCR Studio v1.0</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">Serveur actif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE TABS ════════════════════════════════════════════════════ */}
      {images.length > 0 && (
        <div className="md:hidden shrink-0 flex" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          {(['sidebar', 'doc', 'data'] as MobileView[]).map(v => (
            <button key={v} onClick={() => setMobileView(v)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all"
                    style={mobileView === v
                      ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                      : { color: 'var(--text-muted)' }}>
              {v === 'sidebar' ? (
                <><FileText className="w-3.5 h-3.5"/> Docs ({images.length})</>
              ) : v === 'doc' ? (
                <><Maximize2 className="w-3.5 h-3.5"/> Document</>
              ) : (
                <><Table2 className="w-3.5 h-3.5"/> Données</>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══ CORPS ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={`flex-col w-full md:w-72 shrink-0 border-r ${images.length === 0 ? 'hidden' : `${mobileView === 'sidebar' ? 'flex' : 'hidden'} ${sidebarOpen ? 'md:flex' : 'md:hidden'}`}`}
               style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          {/* Header de la sidebar */}
          <div className="p-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Documents ({images.length})
            </h2>
            <label className="cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition text-xs font-semibold text-blue-400 flex items-center gap-1.5"
                   style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)' }}>
              <Images className="w-3.5 h-3.5" />
              + Galerie
              <input type="file" multiple className="hidden" onChange={onFileInput} accept="image/*" />
            </label>
          </div>

          {/* Liste des images */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {images.map(img => {
              const isSelected = img.id === selectedImageId;
              const isProcessing = img.step === 'loading';
              const isError = img.step === 'error';
              const pct = img.resultat ? Math.round(img.resultat.confiance_moyenne * 100) : null;
              const badgeColor = pct !== null ? confColor(pct).fg : 'gray';

              return (
                <div
                  key={img.id}
                  onClick={() => selectImage(img.id)}
                  className="group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150 border"
                  style={{
                    background: isSelected ? 'rgba(79,142,247,0.08)' : 'var(--bg-tertiary)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {/* Miniature */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40 flex items-center justify-center relative">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Titre & Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-medium truncate text-gray-200" style={isSelected ? { color: 'var(--accent)' } : {}}>
                      {img.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-500">
                        {img.file.size ? `${(img.file.size / 1024).toFixed(0)} KB` : 'Photo'}
                      </span>
                      {pct !== null && (
                        <span className="text-[9px] font-mono px-1 rounded bg-black/30" style={{ color: badgeColor }}>
                          ● {pct}%
                        </span>
                      )}
                      {isError && (
                        <span className="text-[9px] font-semibold text-red-400 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> Erreur
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bouton de suppression */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition text-gray-400 hover:text-red-400"
                    title="Supprimer le document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── WORKSPACE IMAGE ────────────────────────────────────────────── */}
        <main
          className={`relative flex-1 overflow-hidden transition-all
            ${images.length === 0 || mobileView === 'doc' ? 'flex' : 'hidden md:flex'}`}
          style={{
            background: '#080a0d',
            cursor: step === 'done' ? 'grab' : 'default',
          }}
          onWheel={step === 'done' ? onWheel : undefined}
          onMouseDown={step === 'done' ? onMD : undefined}
          onMouseMove={step === 'done' ? onMM : undefined}
          onMouseUp={onMU}
          onMouseLeave={onMU}
          onTouchStart={step === 'done' ? onTS : undefined}
          onTouchMove={step === 'done' ? onTM : undefined}
          onTouchEnd={onTE}
        >

          {/* ── ÉTAT VIDE ─────────────────────────────────────────────── */}
          {step === 'empty' && inputMode === 'upload' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 sm:gap-8 p-4 sm:p-8 overflow-auto">
              {/* Zone principale de dépôt */}
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                className="w-full max-w-md flex flex-col items-center gap-5 p-6 sm:p-10 rounded-2xl transition-all shadow-2xl"
                style={{ border: '2px dashed var(--border-light)', background: 'var(--bg-secondary)' }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                     style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(79,142,247,0.3)' }}>
                  <Upload className="w-8 h-8 sm:w-9 sm:h-9" style={{ color: 'var(--accent)' }}/>
                </div>
                <div className="text-center">
                  <p className="font-bold text-base sm:text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    Déposez votre document ici
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                    ou choisissez parmi les options ci-dessous · JPG, PNG, WEBP
                  </p>
                </div>
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  {/* Bouton Galerie / Photos */}
                  <label className="cursor-pointer flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                         style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 14px rgba(79,142,247,0.35)' }}>
                    <Images className="w-4 h-4"/>
                    <span>Galerie / Photos</span>
                    <input type="file" multiple className="hidden" onChange={onFileInput} accept="image/png,image/jpeg,image/webp,image/jpg,image/*"/>
                  </label>

                  {/* Bouton Caméra */}
                  <button type="button" onClick={() => setInputMode('camera')}
                          className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 active:scale-95 border"
                          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                    <Camera className="w-4 h-4 text-blue-400"/>
                    <span>Caméra</span>
                  </button>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={loadSampleImage}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-400 hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tester avec un exemple de la galerie</span>
                  </button>
                </div>
              </div>
              {/* Étapes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-2xl">
                {[
                  { icon: Upload, label: 'Importer', desc: 'JPG, PNG depuis votre appareil ou caméra', color: '#4f8ef7' },
                  { icon: ScanText, label: 'Analyser', desc: 'L\'IA lit et nettoie automatiquement', color: '#a78bfa' },
                  { icon: FileText, label: 'Corriger', desc: 'Vérifiez et éditez le texte extrait', color: '#34d399' },
                  { icon: Download, label: 'Exporter', desc: 'TXT, CSV ou Excel en un clic', color: '#fbbf24' },
                ].map(({ icon: Icon, label, desc, color }, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl text-center"
                       style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <Icon className="w-5 h-5" style={{ color }}/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {i + 1}. {label}
                      </p>
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CAMÉRA ────────────────────────────────────────────────── */}
          {inputMode === 'camera' && (step === 'empty' || camActive) && (
            <div className={`absolute inset-0 flex flex-col z-20 ${camFullscreen ? 'bg-black' : ''}`}
                 style={{ background: camActive ? '#000' : 'var(--bg-primary)' }}>
              {camActive ? (
                <>
                  {/* Vidéo */}
                  <div className="flex-1 relative overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: camFront ? 'scaleX(-1)' : 'none' }}
                    />
                    {/* Grille de cadrage */}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '33.333% 33.333%' }}/>
                    {/* Coin de cadrage */}
                    <div className="absolute inset-8 pointer-events-none">
                      {['tl','tr','bl','br'].map(pos => (
                        <div key={pos} className={`absolute w-8 h-8 border-white ${pos === 'tl' ? 'top-0 left-0 border-t-2 border-l-2' : pos === 'tr' ? 'top-0 right-0 border-t-2 border-r-2' : pos === 'bl' ? 'bottom-0 left-0 border-b-2 border-l-2' : 'bottom-0 right-0 border-b-2 border-r-2'}`}/>
                      ))}
                    </div>
                    {/* Label guide */}
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
                      <div className="px-4 py-2 rounded-full text-sm text-white font-medium"
                           style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        Cadrez votre document et appuyez sur le bouton
                      </div>
                    </div>
                  </div>

                  {/* Barre de contrôles caméra */}
                  <div className="shrink-0 flex items-center justify-center gap-6 p-5"
                       style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
                    {/* Fermer */}
                    <button onClick={() => { stopCamera(); setInputMode('upload'); }}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-red-500/30"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                            title="Fermer la caméra">
                      <X className="w-5 h-5 text-white"/>
                    </button>

                    {/* Galerie */}
                    <label className="relative cursor-pointer w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                           style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                           title="Importer depuis la galerie">
                      <Images className="w-5 h-5 text-white"/>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={onGalleryInputFromCamera}/>
                    </label>

                    {/* Capture */}
                    <button onClick={capturePhoto}
                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'white', boxShadow: '0 0 0 4px rgba(255,255,255,0.25), 0 4px 20px rgba(0,0,0,0.5)' }}
                            title="Prendre la photo">
                      <div className="w-14 h-14 rounded-full"
                           style={{ background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)' }}/>
                    </button>

                    {/* Retourner la caméra */}
                    <button onClick={flipCamera}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                            title="Retourner la caméra">
                      <FlipHorizontal className="w-5 h-5 text-white"/>
                    </button>
                  </div>
                  <canvas ref={canvasRef} className="hidden"/>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center p-8">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }}/>
                    <p style={{ color: 'var(--text-muted)' }}>Initialisation de la caméra…</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CHARGEMENT ────────────────────────────────────────────── */}
          {step === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-4">
              {imageUrl && (
                <div className="relative max-w-xs max-h-48 overflow-hidden rounded-xl shadow-2xl opacity-40">
                  <img src={imageUrl} alt="" className="w-full object-contain"/>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, #080a0d)' }}/>
                </div>
              )}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 animate-spin"
                       style={{ borderColor: 'rgba(79,142,247,0.2)', borderTopColor: 'var(--accent)' }}/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanText className="w-6 h-6" style={{ color: 'var(--accent)' }}/>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base" style={{ color: 'var(--accent)' }}>Analyse IA en cours…</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Nettoyage · Reconnaissance · Structuration spatiale
                  </p>
                </div>
                <div className="w-64 space-y-2">
                  {[90, 70, 80].map((w, i) => (
                    <div key={i} className="skeleton h-2.5 rounded-full" style={{ width: `${w}%` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ERREUR ────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)' }}>
                <AlertCircle className="w-8 h-8" style={{ color: '#f87171' }}/>
              </div>
              <div className="text-center">
                <p className="font-semibold text-base mb-1" style={{ color: '#f87171' }}>Erreur d'analyse</p>
                <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>{errMsg}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Vérifiez que le serveur IA est lancé sur le port 8000.
                </p>
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                     style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <Upload className="w-4 h-4"/> Réessayer avec une autre image
                <input type="file" className="hidden" onChange={onFileInput} accept="image/*"/>
              </label>
            </div>
          )}

          {/* ── VISIONNEUSE INTERACTIVE ───────────────────────────────── */}
          {step === 'done' && imageUrl && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', position: 'relative', display: 'inline-block' }}>
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt={fileName}
                    onLoad={recalc}
                    draggable={false}
                    className="block shadow-2xl rounded-lg"
                    style={{ maxHeight: 'calc(100vh - 128px)', maxWidth: '100%', userSelect: 'none' }}
                  />
                  {resultat?.lignes.map(ligne => {
                    const isActive = activeLineId === ligne.id;
                    return (
                      <div
                        key={ligne.id}
                        className="ocr-detection-box"
                        style={{
                          ...boxStyle(ligne.boite),
                          ...(isActive ? { borderColor: '#f87171', background: 'rgba(248,113,113,0.18)', boxShadow: '0 0 0 2px rgba(248,113,113,0.2)' } : {}),
                        }}
                        onClick={() => setActiveLineId(isActive ? null : ligne.id)}
                        title={ligne.texte}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Info fichier (coin haut gauche) */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                   style={{ background: 'rgba(8,10,13,0.8)', border: '1px solid var(--border)', backdropFilter: 'blur(6px)', color: 'var(--text-muted)' }}>
                <FileText className="w-3.5 h-3.5 shrink-0"/>
                <span className="max-w-[140px] truncate">{fileName}</span>
                {resultat && <span>· {resultat.image_width}×{resultat.image_height}px</span>}
              </div>

              {/* Toolbar zoom (bas centre) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-2xl"
                   style={{ background: 'rgba(26,29,36,0.92)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
                <button onClick={() => setZoom(z => Math.max(0.15, z * 0.8))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                        title="Dézoomer (molette vers le bas)">
                  <ZoomOut className="w-4 h-4" style={{ color: 'var(--text-secondary)' }}/>
                </button>
                <span className="text-xs font-mono w-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(z => Math.min(8, z * 1.2))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                        title="Zoomer (molette vers le haut)">
                  <ZoomIn className="w-4 h-4" style={{ color: 'var(--text-secondary)' }}/>
                </button>
                <div className="w-px h-4" style={{ background: 'var(--border)' }}/>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition text-xs"
                        style={{ color: 'var(--text-muted)' }}
                        title="Réinitialiser la vue">
                  <RotateCcw className="w-3.5 h-3.5"/> Reset
                </button>
                <div className="w-px h-4" style={{ background: 'var(--border)' }}/>
                <span className="text-xs font-mono px-1" style={{ color: cc.fg }}>
                  ● {confGlobal}%
                </span>
              </div>
            </>
          )}
        </main>

        {/* ── PANNEAU DONNÉES ─────────────────────────────────────────────── */}
        {step === 'done' && resultat && panelOpen && (
          <aside
            className={`flex flex-col shrink-0 overflow-hidden animate-fadeIn
              w-full md:w-[420px] lg:w-[460px]
              ${mobileView === 'data' ? 'flex' : 'hidden md:flex'}`}
            style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Tabs panneau */}
            <div className="shrink-0 flex items-center gap-0 px-2 sm:px-3 pt-2 overflow-x-auto"
                 style={{ borderBottom: '1px solid var(--border)' }}>
              {([
                { id: 'word'   as PanelTab, label: 'Document Word', icon: BookOpen, color: '#60a5fa' },
                { id: 'editor' as PanelTab, label: 'Lignes OCR',    icon: FileText, color: '#34d399' },
                { id: 'table'  as PanelTab, label: 'Tableau',       icon: Table2,   color: '#a78bfa' },
              ]).map(({ id, label, icon: Icon, color }) => (
                <button key={id} onClick={() => setPanelTab(id)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all rounded-t-lg mr-1 shrink-0"
                        style={panelTab === id
                          ? { color: color, borderBottom: `2px solid ${color}`, background: 'var(--bg-tertiary)' }
                          : { color: 'var(--text-muted)' }}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: panelTab === id ? color : 'var(--text-muted)' }}/>
                  <span>{label}</span>
                </button>
              ))}
              <div className="ml-auto mb-1 hidden sm:flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-lg shrink-0"
                   style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {resultat.lignes.length} éléments
              </div>
            </div>

            {/* Corps panneau */}
            <div className="flex-1 overflow-y-auto">

              {/* ─ DOCUMENT WORD / TRAITEMENT DE TEXTE PROPRE ─ */}
              {panelTab === 'word' && (
                <div className="p-3 sm:p-4 space-y-3.5 animate-fadeIn">
                  {/* Barre d'outils Word */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border"
                       style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
                    {/* Actions de texte */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border"
                        style={{
                          background: copiedToast ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.05)',
                          borderColor: copiedToast ? '#34d399' : 'rgba(255,255,255,0.1)',
                          color: copiedToast ? '#34d399' : '#fff'
                        }}
                        title="Copier le texte propre complet"
                      >
                        {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToast ? 'Copié !' : 'Copier'}</span>
                      </button>

                      <button
                        onClick={formatTextClean}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 border hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fbbf24' }}
                        title="Nettoyer la ponctuation et capitaliser les phrases"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Formater</span>
                      </button>

                      {/* Export Word Direct */}
                      <button
                        onClick={exportWord}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(59,130,246,0.15))', borderColor: 'rgba(59,130,246,0.4)', color: '#60a5fa' }}
                        title="Télécharger en document Word (.DOC)"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Export Word</span>
                      </button>
                    </div>

                    {/* Sélecteur de Police & Taille */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <button
                          onClick={() => setWordFont('sans')}
                          className="px-2 py-1 text-[11px] font-sans transition"
                          style={{ background: wordFont === 'sans' ? 'rgba(79,142,247,0.3)' : 'transparent', color: wordFont === 'sans' ? '#fff' : 'var(--text-muted)' }}
                          title="Police Moderne Sans-Serif"
                        >
                          Sans
                        </button>
                        <button
                          onClick={() => setWordFont('serif')}
                          className="px-2 py-1 text-[11px] font-serif transition"
                          style={{ background: wordFont === 'serif' ? 'rgba(79,142,247,0.3)' : 'transparent', color: wordFont === 'serif' ? '#fff' : 'var(--text-muted)' }}
                          title="Police Word Classique Serif"
                        >
                          Serif
                        </button>
                        <button
                          onClick={() => setWordFont('mono')}
                          className="px-2 py-1 text-[11px] font-mono transition"
                          style={{ background: wordFont === 'mono' ? 'rgba(79,142,247,0.3)' : 'transparent', color: wordFont === 'mono' ? '#fff' : 'var(--text-muted)' }}
                          title="Police Monospace"
                        >
                          Mono
                        </button>
                      </div>

                      {/* Zoom de police */}
                      <div className="flex items-center gap-0.5 border rounded-lg p-0.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <button
                          onClick={() => setWordFontSize(s => Math.max(11, s - 1))}
                          className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-white rounded"
                          title="Diminuer la police"
                        >
                          A-
                        </button>
                        <span className="text-[10px] font-mono px-1 text-gray-400">{wordFontSize}</span>
                        <button
                          onClick={() => setWordFontSize(s => Math.min(22, s + 1))}
                          className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-white rounded"
                          title="Agrandir la police"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feuille de document Word A4 Propre */}
                  <div
                    className="relative rounded-2xl p-5 sm:p-7 transition-all shadow-2xl border"
                    style={{
                      background: 'linear-gradient(180deg, rgba(22,29,44,0.92) 0%, rgba(16,22,34,0.96) 100%)',
                      borderColor: 'rgba(79,142,247,0.22)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      minHeight: '380px',
                    }}
                  >
                    {/* Header de la page Word */}
                    <div className="border-b pb-3 mb-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-xs font-bold text-gray-200 tracking-tight">
                          {fileName || 'Transcription Document'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: cc.bg, color: cc.fg, border: `1px solid ${cc.border}` }}>
                        ● {confGlobal}% certitude
                      </span>
                    </div>

                    {/* Zone de saisie / Document Word éditable */}
                    <textarea
                      value={resultat.lignes.map(l => l.texte).join('\n')}
                      onChange={(e) => updateFullText(e.target.value)}
                      rows={Math.max(12, resultat.lignes.length + 2)}
                      className={`w-full bg-transparent outline-none resize-y leading-relaxed text-gray-100 placeholder-gray-500
                        ${wordFont === 'serif' ? 'font-serif' : wordFont === 'mono' ? 'font-mono' : 'font-sans'}`}
                      style={{
                        fontSize: `${wordFontSize}px`,
                        lineHeight: '1.8',
                        minHeight: '260px',
                      }}
                      placeholder="Votre texte retranscrit apparaîtra ici..."
                    />

                    {/* Pied de page Word / Statistiques */}
                    <div className="mt-6 pt-3 border-t flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2"
                         style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-3">
                        <span>
                          <strong className="text-gray-200">{resultat.lignes.map(l => l.texte).join(' ').trim().split(/\s+/).filter(Boolean).length}</strong> mots
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="text-gray-200">{resultat.lignes.map(l => l.texte).join('').length}</strong> caractères
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="text-gray-200">{resultat.lignes.length}</strong> lignes
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-400/80 font-medium">
                        Édition Word en direct
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ ÉDITEUR DE LIGNES ─ */}
              {panelTab === 'editor' && (
                <div className="p-4 space-y-3">
                  {/* Stats 3 colonnes */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Confiance', val: `${confGlobal}%`,  color: cc.fg,    icon: CheckCircle2 },
                      { label: 'Lignes',    val: `${resultat.lignes.length}`, color: 'var(--accent)',  icon: FileText },
                      { label: 'Colonnes',  val: `${resultat.matrice?.[0]?.length ?? 1}`, color: '#a78bfa', icon: Table2 },
                    ].map(({ label, val, color, icon: Icon }) => (
                      <div key={label} className="rounded-xl p-3 text-center"
                           style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                        <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }}/>
                        <p className="text-base font-bold" style={{ color }}>{val}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tip */}
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                       style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)' }}>
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }}/>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Survolez une ligne pour la localiser sur le document. Cliquez pour sélectionner. Le texte est éditable directement.
                    </p>
                  </div>

                  {/* Lignes éditables */}
                  {resultat.lignes.map(ligne => {
                    const isActive = activeLineId === ligne.id;
                    const pct = Math.round(ligne.confiance * 100);
                    const lc = confColor(pct);
                    return (
                      <div
                        key={ligne.id}
                        onMouseEnter={() => setActiveLineId(ligne.id)}
                        onMouseLeave={() => setActiveLineId(null)}
                        className="rounded-xl transition-all duration-150"
                        style={{
                          padding: '10px 12px',
                          background: isActive ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                          border: `1px solid ${isActive ? 'rgba(248,113,113,0.45)' : 'var(--border)'}`,
                          boxShadow: isActive ? '0 0 0 3px rgba(248,113,113,0.1)' : 'none',
                        }}
                      >
                        {/* Header ligne */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                            L{ligne.id + 1}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: lc.fg, transition: 'width 0.5s ease' }}/>
                          </div>
                          <ConfBadge value={ligne.confiance}/>
                        </div>
                        {/* Zone de texte éditable */}
                        <textarea
                          value={ligne.texte}
                          onChange={e => updateLine(ligne.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          rows={Math.max(1, Math.ceil(ligne.texte.length / 45))}
                          className="w-full resize-none bg-transparent text-sm outline-none leading-relaxed"
                          style={{ color: 'var(--text-primary)', cursor: 'text', userSelect: 'text' }}
                        />
                      </div>
                    );
                  })}

                  {/* Exports */}
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Exporter le texte corrigé :</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={exportTXT}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        <FileText className="w-3.5 h-3.5"/> Texte brut
                      </button>
                      <button onClick={exportExcel}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                        <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
                      </button>
                      <button onClick={exportCSV}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        <Table2 className="w-3.5 h-3.5"/> CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ VUE TABLEAU ─ */}
              {panelTab === 'table' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                       style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#a78bfa' }}/>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      L'IA analyse les coordonnées X/Y de chaque mot pour reconstituer la structure originale du document en lignes et colonnes.
                    </p>
                  </div>

                  {resultat.matrice?.length > 0 ? (
                    <>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                              <tr>
                                {resultat.matrice[0]?.map((_, i) => (
                                  <th key={i} className="px-3 py-2.5 text-left text-xs font-semibold"
                                      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                    Col {i + 1}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {resultat.matrice.map((row, i) => (
                                <tr key={i} className="transition-colors hover:bg-white/5"
                                    style={{ borderBottom: '1px solid var(--border)' }}>
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-3 py-2.5"
                                        style={{ color: cell ? 'var(--text-primary)' : 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {cell || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={exportExcel}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <FileSpreadsheet className="w-4 h-4"/> Exporter Excel
                        </button>
                        <button onClick={exportCSV}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          <Table2 className="w-4 h-4"/> Exporter CSV
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--text-muted)' }}>
                      <Table2 className="w-10 h-10 opacity-30"/>
                      <p className="text-sm text-center max-w-xs">
                        Aucune structure tabulaire détectée. Essayez avec un formulaire ou un tableau manuscrit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
