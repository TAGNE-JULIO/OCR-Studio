'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { DashboardScreen } from '../components/screens/DashboardScreen';
import { ReviewScreen } from '../components/screens/ReviewScreen';
import { CameraModal } from '../components/screens/CameraModal';
import { PreferencesScreen } from '../components/screens/PreferencesScreen';
import { ImageDocument, ScreenView, InputMode, ResultatOCR } from '../types';

const RECENT_DOCUMENTS_LIST = [
  { id: 1, title: "Notes — réunion produit", date: "Aujourd’hui, 10:42", pages: "2 pages", score: "98,4 %" },
  { id: 2, title: "Carnet de recherche", date: "Hier, 16:20", pages: "8 pages", score: "96,8 %" },
  { id: 3, title: "Liste de courses & Notes", date: "12 juin, 09:14", pages: "1 page", score: "99,1 %" },
];

export default function App() {
  // Navigation & Écrans
  const [screen, setScreen] = useState<ScreenView>("home");
  const [images, setImages] = useState<ImageDocument[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [compare, setCompare] = useState(true);
  const [saved, setSaved] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [showBoxes, setShowBoxes] = useState(true);
  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [richView, setRichView] = useState(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caméra WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camFront, setCamFront] = useState(false);

  // Document courant
  const currentDoc = images[activeDocIndex] ?? null;
  const resultat = currentDoc?.resultat ?? null;
  const fileName = currentDoc?.name ?? "Notes — réunion produit";

  // Recalcul échelle
  const recalc = useCallback(() => {
    if (!imgRef.current || !resultat) return;
    const img = imgRef.current;
    const nw = img.naturalWidth  || resultat.image_width  || 1;
    const nh = img.naturalHeight || resultat.image_height || 1;
    setScale({ x: img.clientWidth / nw, y: img.clientHeight / nh });
  }, [resultat]);

  useEffect(() => {
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  // Upload & Process
  const nextId = useRef(1);
  const processFile = useCallback(async (file: File, customUrl?: string) => {
    const id = nextId.current++;
    const objectUrl = customUrl ?? URL.createObjectURL(file);
    const newDoc: ImageDocument = {
      id,
      file,
      url: objectUrl,
      name: file.name || "document_manuscrit.jpg",
      step: 'loading',
      resultat: null,
    };
    setImages(prev => [newDoc, ...prev]);
    setActiveDocIndex(0);
    setScreen("review");
    setSaved(false);
    setZoom(1); setPan({ x: 0, y: 0 });

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('pretraitement', 'true');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/analyze`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      const data: ResultatOCR = await res.json();
      if (!data.success) throw new Error('Échec de la reconnaissance IA.');

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, step: 'done', resultat: data } : img
      ));
      setTimeout(recalc, 250);
    } catch (e: any) {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, step: 'error', errMsg: e.message } : img
      ));
    }
  }, [recalc]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(f => processFile(f));
    e.target.value = '';
  };

  const loadSampleImage = async () => {
    try {
      const res = await fetch('/test_manuscrit.png');
      const blob = await res.blob();
      const file = new File([blob], 'reunion_produit_manuscrit.png', { type: 'image/png' });
      processFile(file, '/test_manuscrit.png');
    } catch {
      alert("Impossible de charger la démo.");
    }
  };

  const openDocument = (index = 0) => {
    if (images.length > index) {
      setActiveDocIndex(index);
      setScreen("review");
    } else {
      loadSampleImage();
    }
  };

  // Caméra WebRTC
  const startCamera = async (front = false) => {
    try {
      if (camStream) camStream.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e: any) {
      alert("Erreur accès caméra : " + e.message);
      setInputMode('upload');
    }
  };

  const stopCamera = () => {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      setCamStream(null);
    }
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
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      setInputMode('upload');
      processFile(file);
    }, 'image/jpeg', 0.95);
  };

  useEffect(() => {
    if (inputMode === 'camera') startCamera(camFront);
    else stopCamera();
    return () => stopCamera();
  }, [inputMode, camFront]);

  // Zoom / Pan
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

  // Édition du texte
  const updateFullText = (val: string) => {
    const rawLines = val.split('\n');
    setImages(prev => prev.map((img, idx) => {
      if (idx !== activeDocIndex || !img.resultat) return img;
      return {
        ...img,
        resultat: {
          ...img.resultat,
          texte_complet: val,
          lignes: rawLines.map((lineText, lIdx) => {
            const existing = img.resultat!.lignes[lIdx];
            return {
              id: lIdx,
              texte: lineText,
              confiance: existing ? existing.confiance : 1.0,
              boite: existing ? existing.boite : null,
            };
          })
        }
      };
    }));
  };

  // Exports
  const dl = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const exportWord = () => {
    const DEFAULT_MANUSCRIPT_TEXT = `Réunion produit — 6 septembre\n\nÀ retenir pour la prochaine version :\n• simplifier l’import de documents\n• afficher les mots à vérifier dès la lecture\n• permettre l’export vers Notion et Google Docs\n\nDécision : tester le nouveau parcours avec 8 personnes lundi.`;
    const textToExport = resultat ? resultat.texte_complet : DEFAULT_MANUSCRIPT_TEXT;
    const textHtml = textToExport
      .split('\n')
      .map(l => `<p style="margin-bottom: 10pt; line-height: 1.7; font-size: 11.5pt; text-align: justify; color: #10284b;">${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('\n');
    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName}</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          body { font-family: 'Segoe UI', 'Calibri', sans-serif; color: #10284b; background: #ffffff; padding: 20px; }
          h1 { color: #083e8c; font-size: 20pt; margin-bottom: 6pt; border-bottom: 2px solid #0b55af; padding-bottom: 4pt; }
          .meta { color: #476789; font-size: 10pt; margin-bottom: 24pt; font-style: italic; border-bottom: 1px solid #d6e2f1; padding-bottom: 6pt; }
          p { margin-bottom: 10pt; font-size: 11.5pt; line-height: 1.7; }
        </style>
      </head>
      <body>
        <h1>${fileName}</h1>
        <div class="meta">Document numérisé par OCR Studio Pro · Précision : 98,4%</div>
        <div style="margin-top: 16pt;">${textHtml}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\uFEFF', wordDoc], { type: 'application/msword' });
    dl(blob, `${fileName.replace(/\.[^/.]+$/, '')}_transcription.doc`);
  };

  const exportExcel = () => {
    if (!resultat?.matrice?.length) return;
    const ws = XLSX.utils.aoa_to_sheet(resultat.matrice);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OCR Studio');
    XLSX.writeFile(wb, `${fileName.replace(/\.[^/.]+$/, '')}.xlsx`);
  };

  const exportPdf = () => {
    const DEFAULT_MANUSCRIPT_TEXT = `Réunion produit — 6 septembre\n\nÀ retenir pour la prochaine version :\n• simplifier l’import de documents\n• afficher les mots à vérifier dès la lecture\n• permettre l’export vers Notion et Google Docs\n\nDécision : tester le nouveau parcours avec 8 personnes lundi.`;
    const textToExport = resultat ? resultat.texte_complet : DEFAULT_MANUSCRIPT_TEXT;
    const htmlLines = textToExport.split('\n').map(l => `<p>${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; color: #10284b; margin: 40px; }
              h1 { color: #083e8c; font-size: 24px; border-bottom: 2px solid #0b55af; padding-bottom: 8px; margin-bottom: 10px; }
              .meta { color: #627d9e; font-size: 12px; margin-bottom: 30px; font-style: italic; }
              p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
              @media print {
                @page { margin: 20mm; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <h1>${fileName}</h1>
            <div class="meta">Document numérisé par OCR Studio Pro · Précision : 98,4%</div>
            ${htmlLines}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <main className="min-h-screen bg-[#080b14] text-[#e8eaf2] mesh-bg font-sans selection:bg-[#7c5cfc]/30 selection:text-[#22d4fd]">
      
      <Header
        screen={screen}
        setScreen={setScreen}
        setInputMode={setInputMode}
        onImportClick={() => fileInputRef.current?.click()}
        onExportWord={exportWord}
      />

      <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[260px_minmax(0,1fr)]">
        
        <Sidebar
          screen={screen}
          setScreen={setScreen}
          setInputMode={setInputMode}
          onOpenDocument={openDocument}
          documentsCount={images.length}
        />

        {screen === "home" ? (
          <DashboardScreen
            onNewDocument={() => fileInputRef.current?.click()}
            onOpenDocument={openDocument}
            recentDocuments={RECENT_DOCUMENTS_LIST}
          />
        ) : screen === "preferences" ? (
          <PreferencesScreen 
            onBack={() => setScreen("home")}
          />
        ) : (
          <ReviewScreen
            currentDoc={currentDoc}
            fileName={fileName}
            compare={compare}
            setCompare={setCompare}
            onBack={() => setScreen("home")}
            onScanAgain={() => setInputMode('camera')}
            onExportWord={exportWord}
            onExportExcel={exportExcel}
            onExportPdf={exportPdf}
            zoom={zoom}
            pan={pan}
            scale={scale}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            imgRef={imgRef}
            recalc={recalc}
            showBoxes={showBoxes}
            activeLineId={activeLineId}
            setActiveLineId={setActiveLineId}
            saved={saved}
            setSaved={setSaved}
            richView={richView}
            setRichView={setRichView}
            updateFullText={updateFullText}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation for Small Screens */}
      <MobileBottomNav
        screen={screen}
        setScreen={setScreen}
        setInputMode={setInputMode}
        onImportClick={() => fileInputRef.current?.click()}
        onOpenDocument={openDocument}
      />

      {inputMode === 'camera' && (
        <CameraModal
          videoRef={videoRef}
          canvasRef={canvasRef}
          setInputMode={setInputMode}
          setCamFront={setCamFront}
          capturePhoto={capturePhoto}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/jpg,image/*"
        onChange={onFileInput}
      />
    </main>
  );
}
