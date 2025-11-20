import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AppSettings } from '../types';
import { ImagePlus, Trash2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';

interface CanvasProps {
  settings: AppSettings;
  image: string | null;
  onUpload: (file: File) => void;
  setExportFn: (fn: () => void) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  isProcessing: boolean;
  palette: string[];
}

// Static Mesh Gradient (The "Aurora" style) - NOW COMPLETELY STATIC
const MeshGradient = ({ palette, seed = 1, className = "" }: { palette: string[], seed?: number, className?: string }) => {
  // Safe fallback palette - Extremely soft Morandi pastels
  const p = palette.length >= 3 
    ? palette 
    : ['#eef2ff', '#f0fdf4', '#fff1f2', '#fafaf9', '#f5f3ff']; 

  // Deterministic shuffle based on seed
  const shuffled = useMemo(() => {
     const colors = [...p];
     // Ensure enough colors
     while(colors.length < 5) colors.push(colors[colors.length % colors.length]);
     
     let currentIndex = colors.length, randomIndex;
     let currentSeed = seed;
     const random = () => {
        const x = Math.sin(currentSeed++) * 10000;
        return x - Math.floor(x);
     }

     while (currentIndex !== 0) {
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex--;
        [colors[currentIndex], colors[randomIndex]] = [colors[randomIndex], colors[currentIndex]];
     }
     return colors;
  }, [p, seed]);

  return (
      <div className={`absolute inset-0 w-full h-full overflow-hidden bg-white ${className}`}>
         {/* Base color layer */}
         <div 
            className="absolute inset-0 w-full h-full" 
            style={{ backgroundColor: shuffled[0], opacity: 0.3 }} 
         />
         
         {/* Static Blurs - No Animation, Instant Color */}
         <div className="absolute inset-0 w-full h-full filter blur-[80px] lg:blur-[140px] opacity-70 scale-125">
            {/* Blob 1 */}
            <div 
              className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply" 
              style={{ backgroundColor: shuffled[0], transform: 'translate(0,0)' }}
            />
            
            {/* Blob 2 */}
            <div 
              className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply"
              style={{ backgroundColor: shuffled[1], transform: 'translate(0,0)' }}
            />
            
            {/* Blob 3 */}
            <div 
              className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full mix-blend-multiply"
              style={{ backgroundColor: shuffled[2], transform: 'translate(0,0)' }}
            />

            {/* Blob 4 */}
            <div 
              className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full mix-blend-multiply"
              style={{ backgroundColor: shuffled[3], transform: 'translate(0,0)' }}
            />
            
            {/* Blob 5 */}
            <div 
              className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full mix-blend-multiply"
              style={{ backgroundColor: shuffled[4], transform: 'translate(0,0)' }}
            />
         </div>
         
         {/* Noise Texture Overlay */}
         <div className="absolute inset-0 opacity-[0.04] z-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />
      </div>
  );
};

// Full Screen Apple Intelligence Overlay
// Moved to outer layer, so we use fixed/readable text sizes
const PromptUICard = () => {
  return (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* 1. Massive Moving Gradient Background - Covers whole canvas area */}
      <div className="absolute -inset-[100%] w-[300%] h-[300%] animate-spin-slow opacity-40"
           style={{ 
             background: 'conic-gradient(from 0deg, transparent 0%, #ff9a9e 10%, #fad0c4 25%, #a18cd1 50%, #fbc2eb 75%, transparent 100%)',
             filter: 'blur(80px)'
           }} 
      />
      
      {/* 2. Glowing Edge Effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,255,255,0.9)]" />
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({ settings, image, onUpload, setExportFn, updateSettings, isProcessing, palette }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0, pX: 0, pY: 0 });

  // --- 1. Image Loading ---
  useEffect(() => {
    if (!image) {
      setImgDimensions({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.src = image;
    let isMounted = true;
    img.onload = () => {
      if (isMounted) setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    return () => { isMounted = false; };
  }, [image]);

  // --- 2. Export Logic ---
  useEffect(() => {
    setExportFn(() => {
      if (exportRef.current && image) {
        const node = exportRef.current;
        toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
          width: node.offsetWidth,
          height: node.offsetHeight,
          style: { transform: 'none', margin: '0', boxShadow: 'none' }
        })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `snapwrap-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => console.error('Export failed', err));
      }
    });
  }, [image, setExportFn]);

  // --- 3. Viewport Measurement ---
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // --- 4. Layout Engine ---
  const layout = useMemo(() => {
    if (!image || imgDimensions.width === 0) return { exportW: 0, exportH: 0, cardW: 0, cardH: 0 };

    const { padding, inset, scale, aspectRatio } = settings;
    const natW = imgDimensions.width;
    const natH = imgDimensions.height;

    const displayScale = scale / 100;
    const imageDisplayW = natW * displayScale;
    const imageDisplayH = natH * displayScale;
    
    const cardW = imageDisplayW + (inset * 2);
    const cardH = imageDisplayH + (inset * 2);

    if (aspectRatio === 'auto') {
      const exportW = cardW + (padding * 2);
      const exportH = cardH + (padding * 2);
      return { exportW, exportH, cardW, cardH };
    } else {
      const parts = aspectRatio.split('/');
      const rW = Number(parts[0]);
      const rH = Number(parts[1]);
      const targetRatio = rW / rH;

      const minExportW = cardW + (padding * 2);
      const minExportH = cardH + (padding * 2);

      let exportW = minExportW;
      let exportH = exportW / targetRatio;

      if (exportH < minExportH) {
        exportH = minExportH;
        exportW = exportH * targetRatio;
      }

      return { exportW, exportH, cardW, cardH };
    }
  }, [settings, imgDimensions, image]);

  // --- 5. Viewport Scaling ---
  const viewportScale = useMemo(() => {
    if (containerSize.width === 0 || layout.exportW === 0) return 0.1;
    const FILL = 0.75; 
    const scaleX = (containerSize.width * FILL) / layout.exportW;
    const scaleY = (containerSize.height * FILL) / layout.exportH;
    return Math.min(scaleX, scaleY);
  }, [containerSize, layout]);

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    e.preventDefault();
    setIsPanning(true);
    dragStart.current = { x: e.clientX, y: e.clientY, pX: settings.panX, pY: settings.panY };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    updateSettings({ 
      panX: dragStart.current.pX + (e.clientX - dragStart.current.x), 
      panY: dragStart.current.pY + (e.clientY - dragStart.current.y) 
    });
  };
  
  const handleMouseUp = () => setIsPanning(false);

  const angleRad = (settings.shadowAngle * Math.PI) / 180;
  const dist = settings.shadow * 0.6;
  const shadowStyle = `${Math.round(Math.cos(angleRad) * dist)}px ${Math.round(Math.sin(angleRad) * dist)}px ${settings.shadow * 1.2}px -${settings.shadow * 0.1}px rgba(0,0,0,${0.15 + settings.shadow/250})`;
  const outerR = settings.borderRadius === 0 ? 0 : (settings.borderRadius + settings.inset);

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-gray-100 h-full flex items-center justify-center overflow-hidden relative select-none transition-colors duration-1000 ease-in-out"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      {/* AI Processing Overlay - Fallback for initial upload/no image state */}
      {isProcessing && !image && <PromptUICard />}

      {!image ? (
        <div 
          className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/80 backdrop-blur-sm shadow-sm hover:scale-[1.02] hover:shadow-lg animate-scale-in ${isDragging ? 'border-mac-accent bg-gray-50 scale-105' : 'border-gray-300 hover:border-mac-accent/50'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && onUpload(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400 transition-colors duration-300 group-hover:text-mac-accent group-hover:bg-gray-100"><ImagePlus size={40} strokeWidth={1.5} /></div>
           <h3 className="text-xl font-medium text-gray-700 mb-2">Upload an Image</h3>
           <p className="text-sm text-gray-400">Drag and drop or click to browse</p>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*, .heic" onChange={handleFileSelect} />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center relative animate-fade-in">
            <button 
              onClick={() => onUpload(null as any)} 
              className="absolute top-6 right-6 z-50 bg-white/80 backdrop-blur text-gray-500 p-3 rounded-full shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:scale-110 hover:shadow-md hover:border-red-200 transition-all duration-300 ease-out"
              title="Remove Image"
            >
              <Trash2 size={20} strokeWidth={1.5} />
            </button>
            
            {/* Viewport Scaler Container */}
            <div 
               className="relative"
               style={{
                  width: layout.exportW * viewportScale,
                  height: layout.exportH * viewportScale,
                  boxShadow: '0 30px 60px -12px rgba(0,0,0,0.2)'
               }}
            >
                {/* AI Overlay scoped to Canvas BOUNDS but UNSCALED (UI stays readable) */}
                {isProcessing && <PromptUICard />}

                {/* The Scaled wrapper */}
                <div style={{ width: layout.exportW, height: layout.exportH, transform: `scale(${viewportScale})`, transformOrigin: 'top left' }}>
                    
                    {/* EXPORT NODE (The "Canvas") */}
                    <div 
                      ref={exportRef}
                      className="relative overflow-hidden"
                      style={{
                        width: '100%', height: '100%',
                        background: settings.backgroundType === 'mesh' ? '#fff' : settings.background,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.3s ease-in-out' 
                      }}
                    >
                        
                        {/* 1. Mesh Background Layer (if active) */}
                        {settings.backgroundType === 'mesh' && (
                          <MeshGradient palette={palette} seed={settings.meshSeed} />
                        )}

                        {/* 3. Card Wrapper */}
                        <div 
                          className="relative z-30"
                          style={{
                            width: layout.cardW,
                            height: layout.cardH,
                            transform: `translate(${settings.panX}px, ${settings.panY}px)`,
                            backgroundColor: 'white',
                            borderRadius: `${outerR}px`,
                            boxShadow: shadowStyle,
                            padding: `${settings.inset}px`,
                            boxSizing: 'border-box',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            cursor: isPanning ? 'grabbing' : 'grab',
                            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                        >
                            {/* Image Container */}
                            <div 
                               style={{
                                  width: '100%', 
                                  height: '100%',
                                  borderRadius: `${settings.borderRadius}px`,
                                  overflow: 'hidden',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  position: 'relative',
                                  zIndex: 10,
                                  userSelect: 'none',
                                  pointerEvents: 'none' 
                               }}
                            >
                                <img 
                                    src={image}
                                    alt="Content"
                                    draggable={false}
                                    style={{
                                      width: '100%', 
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;