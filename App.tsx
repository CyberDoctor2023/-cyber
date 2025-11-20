
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { analyzeImageForStyle } from './services/geminiService';

// Utility: RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

// Utility: HSL to Hex
function hslToHex(h: number, s: number, l: number) {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  const toHex = (x: number) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert to "Elegant Morandi" (High Value, Extremely Low Saturation)
const toMorandi = (r: number, g: number, b: number): string => {
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // STRICT Morandi Logic:
  // Saturation: CRUSHED. Keep it between 0.05 and 0.15 (5-15%).
  // This eliminates the "cheap" neon look.
  const newS = 0.05 + (Math.min(s, 0.5) * 0.20); // Result max ~0.15
  
  // Lightness: "Middle-High". 
  // Avoid pure white (too bright) and darks (poor readability).
  // Target range: 0.75 to 0.85.
  // This gives the color "body" without being blinding.
  const newL = 0.75 + (Math.min(l, 1) * 0.10); 
  
  return hslToHex(h, newS, newL);
};

// Helper to extract dominant colors for palette
const getImageColors = (imageSrc: string): Promise<{ dominant: string, palette: string[] }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve({ dominant: '#e5e5e5', palette: [] }); return; } 

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      const colorCounts: Record<string, number> = {};
      
      // 1. Quantize and Count
      for (let i = 0; i < imageData.length; i += 4) { 
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue;
        
        const brightness = (r + g + b) / 3;
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const saturation = maxVal - minVal;

        // STRICT FILTERING for "Middle Extraction"
        // Ignore Blacks/Dark Greys
        if (brightness < 60) continue;
        // Ignore Near Whites
        if (brightness > 230) continue;
        // Ignore super vivid neon spikes (though Morandi conversion handles this later, filtering source helps)
        // if (saturation > 200) continue;

        // Binning
        const bin = 32;
        const rB = Math.floor(r / bin) * bin;
        const gB = Math.floor(g / bin) * bin;
        const bB = Math.floor(b / bin) * bin;
        
        const key = `${rB},${gB},${bB}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // 2. Sort by frequency
      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return toMorandi(r, g, b);
        });
        
      // 3. Pick distinct colors
      const palette: string[] = [];
      const isDistinct = (c1: string, c2: string) => c1 !== c2;

      if (sortedColors.length > 0) palette.push(sortedColors[0]); 

      for (let i = 1; i < sortedColors.length; i++) {
         if (palette.length >= 5) break;
         const c = sortedColors[i];
         if (palette.every(p => isDistinct(p, c))) {
            palette.push(c);
         }
      }
      
      // Fallbacks - Elegant Greys
      const defaultMorandi = ['#e2e4e9', '#dbeafe', '#f3e8ff', '#fae8ff', '#e0f2fe'];
      let fillIdx = 0;
      while(palette.length < 5) {
         palette.push(defaultMorandi[fillIdx++ % defaultMorandi.length]);
      }

      resolve({ dominant: palette[0], palette });
    };
    img.onerror = () => resolve({ dominant: '#e5e5e5', palette: [] });
  });
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [exportFn, setExportFn] = useState<(() => void) | null>(null);
  const [palette, setPalette] = useState<string[]>([]);

  // Handle Accent Color Updates
  useEffect(() => {
    const root = document.documentElement;
    if (!image) {
      root.style.setProperty('--mac-accent', 'rgba(0, 0, 0, 0.5)');
      setPalette([]);
    } else {
      getImageColors(image).then(({ dominant, palette }) => {
        // Set accent to the dominant Morandi color
        root.style.setProperty('--mac-accent', dominant);
        setPalette(palette);
      });
    }
  }, [image]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) {
      setImage(null);
      return;
    }

    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        setIsProcessingAI(true);
        
        const heicModule = await import('heic2any');
        const heic2any = (heicModule.default || heicModule) as any;

        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });
        
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        
        const reader = new FileReader();
        reader.onload = (e) => {
           if (e.target?.result) {
             setImage(e.target.result as string);
             handleUpdateSettings({ panX: 0, panY: 0, scale: 100 });
             setIsProcessingAI(false);
           }
        };
        reader.readAsDataURL(blob);
        return;
      } catch (err: any) {
        console.error("HEIC conversion failed", err);
        setIsProcessingAI(false);
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
        handleUpdateSettings({ panX: 0, panY: 0, scale: 100 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMagicClick = async () => {
    if (!image) return;
    setIsProcessingAI(true);
    
    try {
      const result = await analyzeImageForStyle(image);
      if (result) {
        handleUpdateSettings({
          background: result.background,
          backgroundType: 'ai',
          shadow: result.shadow
        });
      }
    } catch (error) {
      console.error("Failed to get AI suggestion");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDownload = () => {
    if (exportFn) exportFn();
  };

  const handleReset = () => {
    setSettings({
        ...DEFAULT_SETTINGS,
    });
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-mac-text animate-fade-in">
      <main className="flex-1 h-full relative overflow-hidden flex flex-col min-w-0 transition-all duration-500 ease-in-out">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-mac-border flex items-center px-6 justify-between shrink-0 z-10 shadow-sm/50 transition-all">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">图片包装</span>
          </div>
          <div className="text-xs text-mac-subtext font-medium transition-opacity duration-300">
             {image ? 'Edit Mode' : 'No image selected'}
          </div>
        </header>
        
        <Canvas 
          settings={settings} 
          image={image} 
          onUpload={handleImageUpload}
          setExportFn={(fn) => setExportFn(() => fn)}
          updateSettings={handleUpdateSettings}
          isProcessing={isProcessingAI}
          palette={palette}
        />
      </main>

      <Sidebar 
        settings={settings} 
        updateSettings={handleUpdateSettings}
        onMagicClick={handleMagicClick}
        isProcessing={isProcessingAI}
        hasImage={!!image}
        onDownload={handleDownload}
        onReset={handleReset}
        palette={palette}
      />
    </div>
  );
};

export default App;
