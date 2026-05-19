/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Globe, 
  Maximize, 
  Minimize, 
  Zap, 
  Cpu, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Settings, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Crop,
  Wifi,
  Sun,
  Layout,
  Plus,
  Minus,
  X,
  User,
  Save,
  Trash2,
  Camera,
  Circle,
  Video,
  Download,
  Shield,
  Activity,
  Search,
  Monitor,
  Volume2,
  Play,
  Pause,
  Users,
  Radio,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Tab {
  id: string;
  url: string;
  title: string;
  icon: string;
}

interface StreamPreset {
  id: string;
  name: string;
  url: string;
  cropScale: number;
  cropOffsetX: number;
  cropOffsetY: number;
  webZoom: number;
  rotation: number;
  isAspectLocked: boolean;
  camScale: number;
  camX: number;
  camY: number;
  isCamVisible: boolean;
  customPhoto: string | null;
  isPhotoVisible: boolean;
  photoScale: number;
  photoX: number;
  photoY: number;
  photoCropX: number;
  photoCropY: number;
  photoCropScale: number;
}

interface StreamState {
  activeTabId: string;
  tabs: Tab[];
  isLocked: boolean;
  isFocusMode: boolean;
  isFullscreen: boolean;
  isLowData: boolean;
  isLowRam: boolean;
  cropScale: number;
  cropOffsetX: number;
  cropOffsetY: number;
  isCropping: boolean;
  isSplashed: boolean;
  webZoom: number;
  isAspectLocked: boolean;
  rotation: number;
  camError: string | null;
  // Face Overlay
  isCamVisible: boolean;
  camScale: number;
  camX: number;
  camY: number;
  // Visuals
  canvasBg: string;
  bgImage: string;
  isMusicPlaying: boolean;
  musicVolume: number;
  isStadiumSoundPlaying: boolean;
  stadiumVolume: number;
  customPhoto: string | null;
  isPhotoVisible: boolean;
  photoScale: number;
  photoX: number;
  photoY: number;
  photoCropX: number;
  photoCropY: number;
  photoCropScale: number;
}

const DEFAULT_TABS: Tab[] = [
  { id: '1', url: 'https://runbuzzcricket.com/match-score?match=U2FsdGVkX18KBj+l7vPlpDChF+R17SR4bWsBs/3fCxMPqa2t0kOOEeMmSJ5DUd4zVC12tNqySZPkJG2WhBed+cqGlPjmjHZfXC4o1oxd16EabZ2WnzW1XQtkansrLTEJuHj0RYF2052QA/zdq/qc3Muwo9sNxR8Wf7O7yw+ef/Y+vn/bHCLfSYPL7+D83DvnTr25gfpPbOr+edqYqiH6tUhvuR34N/0PF+0DDe1g9NH+8L20UZ6BasS6ILy05IydtwLFSULNifgj5T2tFTY5H1C9662FG5qpF5DbxKPzwkfbnoaF+7OX/+T/M+t9vCQYUbWcqw6KzXUoj904eevdGw==', title: 'Cricket Score', icon: '🏏' },
];

export default function App() {
  // --- State ---
  const [urlInput, setUrlInput] = useState('');
  const [state, setState] = useState<StreamState>({
    activeTabId: '1',
    tabs: DEFAULT_TABS,
    isLocked: false,
    isFocusMode: false,
    isFullscreen: false,
    isLowData: false,
    isLowRam: false,
    cropScale: 1,
    cropOffsetX: 0,
    cropOffsetY: 0,
    isCropping: false,
    isSplashed: true,
    webZoom: 1,
    isAspectLocked: false,
    rotation: 0,
    camError: null,
    isCamVisible: false,
    camScale: 1,
    camX: 50,
    camY: 50,
    canvasBg: '#0A0B0D',
    bgImage: 'https://res.cloudinary.com/dm5spjnjk/image/upload/v1779169345/chennai-new-1710336746475-compressed_dlgwid.jpg',
    isMusicPlaying: false,
    musicVolume: 0.5,
    isStadiumSoundPlaying: false,
    stadiumVolume: 0.5,
    customPhoto: null,
    isPhotoVisible: false,
    photoScale: 1,
    photoX: 80,
    photoY: 80,
    photoCropX: 0,
    photoCropY: 0,
    photoCropScale: 1
  });

  const [speed, setSpeed] = useState<string>('10.0');
  const [showUrlBar, setShowUrlBar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [presets, setPresets] = useState<StreamPreset[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('stream_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  const savePreset = () => {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    const name = prompt("Enter a name for this configuration:", new URL(activeTab.url).hostname) || 'Untitled Layout';
    
    const newPreset: StreamPreset = {
      id: Date.now().toString(),
      name,
      url: activeTab.url,
      cropScale: state.cropScale,
      cropOffsetX: state.cropOffsetX,
      cropOffsetY: state.cropOffsetY,
      webZoom: state.webZoom,
      rotation: state.rotation,
      isAspectLocked: state.isAspectLocked,
      camScale: state.camScale,
      camX: state.camX,
      camY: state.camY,
      isCamVisible: state.isCamVisible,
      customPhoto: state.customPhoto,
      isPhotoVisible: state.isPhotoVisible,
      photoScale: state.photoScale,
      photoX: state.photoX,
      photoY: state.photoY,
      photoCropX: state.photoCropX,
      photoCropY: state.photoCropY,
      photoCropScale: state.photoCropScale
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('stream_presets', JSON.stringify(updated));
  };

  const toggleFullscreen = () => {
    setState(p => ({ ...p, isFullscreen: !p.isFullscreen }));
  };

  const loadPreset = (preset: StreamPreset) => {
    setState(p => ({
      ...p,
      cropScale: preset.cropScale,
      cropOffsetX: preset.cropOffsetX,
      cropOffsetY: preset.cropOffsetY,
      webZoom: preset.webZoom,
      rotation: preset.rotation,
      isAspectLocked: preset.isAspectLocked,
      camScale: preset.camScale ?? p.camScale,
      camX: preset.camX ?? p.camX,
      camY: preset.camY ?? p.camY,
      isCamVisible: preset.isCamVisible ?? p.isCamVisible,
      customPhoto: preset.customPhoto ?? p.customPhoto,
      isPhotoVisible: preset.isPhotoVisible ?? p.isPhotoVisible,
      photoScale: preset.photoScale ?? p.photoScale,
      photoX: preset.photoX ?? p.photoX,
      photoY: preset.photoY ?? p.photoY,
      photoCropX: preset.photoCropX ?? p.photoCropX,
      photoCropY: preset.photoCropY ?? p.photoCropY,
      photoCropScale: preset.photoCropScale ?? p.photoCropScale,
      tabs: p.tabs.map(t => t.id === p.activeTabId ? { ...t, url: preset.url } : t)
    }));
    setShowUrlBar(false);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('stream_presets', JSON.stringify(updated));
  };

  const exportPresets = () => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-studio-presets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const updated = [...presets, ...imported.filter(p => !presets.find(existing => existing.id === (p as any).id))];
          setPresets(updated);
          localStorage.setItem('stream_presets', JSON.stringify(updated));
          alert(`Successfully imported layouts!`);
        }
      } catch (err) {
        alert("Failed to import presets. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stadiumRef = useRef<HTMLAudioElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space
          e.preventDefault();
          setState(p => ({ ...p, isMusicPlaying: !p.isMusicPlaying }));
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'v':
          if (!state.isLocked) {
            setState(p => ({ ...p, isCamVisible: !p.isCamVisible }));
          }
          break;
        case 'l':
          setState(p => ({ ...p, isLocked: !p.isLocked }));
          break;
        case 'm':
          setState(p => ({ ...p, isStadiumSoundPlaying: !p.isStadiumSoundPlaying }));
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            savePreset();
          }
          break;
        case 'c':
          if (!state.isLocked) {
            setState(p => ({ ...p, isCropping: !p.isCropping }));
          }
          break;
        case 'arrowup':
          e.preventDefault();
          setState(p => ({ ...p, musicVolume: Math.min(1, p.musicVolume + 0.1) }));
          break;
        case 'arrowdown':
          e.preventDefault();
          setState(p => ({ ...p, musicVolume: Math.max(0, p.musicVolume - 0.1) }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isLocked, toggleFullscreen]);

  // Background Music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.musicVolume;
      if (state.isMusicPlaying) {
        audioRef.current.play().catch(() => {
          console.log("Interaction required for audio");
          setState(p => ({ ...p, isMusicPlaying: false }));
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [state.isMusicPlaying, state.musicVolume]);

  // Stadium Sound
  useEffect(() => {
    if (stadiumRef.current) {
      stadiumRef.current.volume = state.stadiumVolume;
      if (state.isStadiumSoundPlaying) {
        stadiumRef.current.play().catch(() => {
          setState(p => ({ ...p, isStadiumSoundPlaying: false }));
        });
      } else {
        stadiumRef.current.pause();
      }
    }
  }, [state.isStadiumSoundPlaying, state.stadiumVolume]);
  
  // Camera Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (state.isCamVisible) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setState(p => ({ ...p, camError: null }));
        })
        .catch(err => {
          console.error("Camera error:", err);
          setState(p => ({ 
            ...p, 
            camError: err.name === 'NotAllowedError' || err.message?.includes('denied') 
              ? 'CAMERA_DENIED' 
              : err.message || 'Unknown camera error',
            isCamVisible: false 
          }));
        });
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.isCamVisible]);
  
  // Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(p => ({ ...p, isSplashed: false }));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleNav = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!urlInput) return;
    let targetUrl = urlInput;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    
    setState(prev => ({ 
      ...prev, 
      tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, url: targetUrl } : t)
    }));
    setShowUrlBar(false);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingCam, setIsDraggingCam] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!state.isCropping || state.isLocked) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.cropOffsetX, y: clientY - state.cropOffsetY };
  };

  const onMouseDownCam = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.isLocked) return;
    if (e.cancelable) e.preventDefault(); 
    setIsDraggingCam(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.camX, y: clientY - state.camY };
  };

  const onMouseDownPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.isLocked) return;
    if (e.cancelable) e.preventDefault(); 
    setIsDraggingPhoto(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.photoX, y: clientY - state.photoY };
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(p => ({ ...p, customPhoto: reader.result as string, isPhotoVisible: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const reloadIframe = () => {
    if (iframeRef.current) {
      const currentUrl = activeTab.url;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = currentUrl;
      }, 50);
    }
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    if (isDragging) {
      setState(p => ({
        ...p,
        cropOffsetX: clientX - dragStart.current.x,
        cropOffsetY: clientY - dragStart.current.y
      }));
    } else if (isDraggingCam) {
      setState(p => ({
        ...p,
        camX: clientX - dragStart.current.x,
        camY: clientY - dragStart.current.y
      }));
    } else if (isDraggingPhoto) {
      setState(p => ({
        ...p,
        photoX: clientX - dragStart.current.x,
        photoY: clientY - dragStart.current.y
      }));
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setIsDraggingCam(false);
    setIsDraggingPhoto(false);
  };

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];

  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className="fixed inset-0 text-slate-200 font-sans select-none overflow-hidden flex flex-col"
      style={{ backgroundColor: state.canvasBg }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
      {/* Orientation Suggestion */}
      <AnimatePresence>
        {isPortrait && !state.isFullscreen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
          >
            <div className="bg-orange-500/80 backdrop-blur-md px-3 py-1 rounded-full border border-orange-400/50 flex items-center gap-2 shadow-lg">
              <RotateCw className="w-3 h-3 text-white animate-spin-slow" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white leading-none">Landscape Mode Recommended</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Stadium Background Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{ 
          backgroundImage: `url(${state.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.5)'
        }}
      />

      <audio 
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
        loop
      />
      <audio 
        ref={stadiumRef}
        src="https://www.soundjay.com/misc/sounds/stadium-crowd-1.mp3" 
        loop
      />

      {/* Splash Screen */}
      <AnimatePresence>
        {state.isSplashed && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#0A0B0D] flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/20">
              <Layout className="w-8 h-8 text-white" />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tighter text-white">LAYOUT STUDIO</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">v3.0 PRISM Protocol</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Error Modal */}
      <AnimatePresence>
        {state.camError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-xs"
          >
            <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/50 rounded-2xl p-4 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-white/40" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70">Security Alert</h3>
                  <p className="text-xs font-bold text-white mt-1 leading-tight">
                    {state.camError === 'CAMERA_DENIED' 
                      ? "Camera access was denied. Please click the Lock icon in your browser's address bar and 'Allow' camera access." 
                      : `Camera Error: ${state.camError}`}
                  </p>
                  <button 
                    onClick={() => setState(p => ({ ...p, camError: null }))}
                    className="mt-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Area (The Iframe) */}
       <main 
         ref={containerRef}
         className="flex-1 relative overflow-hidden group flex items-center justify-center bg-black/10 h-full w-full"
       >
            <div 
              className={`relative transition-all duration-500 shadow-2xl overflow-hidden ${state.isAspectLocked ? 'aspect-video w-full max-w-7xl' : 'w-full h-full'}`}
              style={{
                backgroundColor: state.canvasBg
              }}
            >
              <div 
                className="absolute inset-0 transition-transform duration-300"
                style={{
                  transform: `scale(${state.cropScale}) translate(${state.cropOffsetX}px, ${state.cropOffsetY}px) rotate(${state.rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <iframe 
                  ref={iframeRef}
                  src={activeTab.url}
                  style={{
                    width: `${100 / state.webZoom}%`,
                    height: `${100 / state.webZoom}%`,
                    transform: `scale(${state.webZoom})`,
                    transformOrigin: '0 0'
                  }}
                  className={`border-none transition-all ${state.isLocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
                  title="Stream View"
                />
              </div>
            </div>
  
          {state.isCropping && !state.isLocked && (
            <div 
              className="absolute inset-0 z-[60] cursor-move bg-blue-500/5 border-2 border-dashed border-blue-500/20 pointer-events-auto"
              onMouseDown={onMouseDown}
              onTouchStart={onMouseDown}
              style={{ touchAction: 'none' }}
            />
          )}
  
          {/* Lock Overlay */}
          {state.isLocked && (
            <div className="absolute inset-0 z-[70] bg-transparent" />
          )}
  
          {/* Face Overlay Layer */}
          <AnimatePresence>
            {state.isCamVisible && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute z-[100] bg-black rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl ${!state.isLocked ? 'cursor-move' : 'cursor-default'}`}
                onMouseDown={onMouseDownCam}
                onTouchStart={onMouseDownCam}
                style={{
                  width: `${140 * state.camScale}px`,
                  height: `${140 * state.camScale}px`,
                  left: `${state.camX}px`, 
                  top: `${state.camY}px`,
                  touchAction: 'none'
                }}
              >
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover -scale-x-100"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Photo Overlay (Broadcaster Identity) */}
          <AnimatePresence>
            {state.isPhotoVisible && state.customPhoto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute z-[110] rounded-2xl overflow-hidden border-2 shadow-2xl transition-colors ${
                  !state.isLocked ? 'border-emerald-500 cursor-move ring-4 ring-emerald-500/10' : 'border-white/10 cursor-default'
                }`}
                onMouseDown={onMouseDownPhoto}
                onTouchStart={onMouseDownPhoto}
                style={{
                  width: `${120 * state.photoScale}px`,
                  height: `${140 * state.photoScale}px`, // Slightly taller for badge feel
                  left: `${state.photoX}px`,
                  top: `${state.photoY}px`,
                  touchAction: 'none',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)'
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
                  <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-black/20 relative">
                    <motion.img 
                      src={state.customPhoto} 
                      alt="Broadcaster" 
                      className="max-w-none"
                      style={{
                        scale: state.photoCropScale,
                        x: state.photoCropX,
                        y: state.photoCropY,
                      }}
                    />
                    
                    {/* Cropping Grid Guide - only visible when configuring (unlocked) */}
                    {!state.isLocked && (
                      <div className="absolute inset-0 pointer-events-none border border-emerald-500/30">
                        <div className="absolute inset-x-0 top-1/3 border-t border-emerald-500/20" />
                        <div className="absolute inset-x-0 top-2/3 border-t border-emerald-500/20" />
                        <div className="absolute inset-y-0 left-1/3 border-l border-emerald-500/20" />
                        <div className="absolute inset-y-0 left-2/3 border-l border-emerald-500/20" />
                      </div>
                    )}
                  </div>
                  {/* Identity Label */}
                  <div className="w-full py-1.5 bg-emerald-600 flex items-center justify-center gap-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">LIVE</span>
                  </div>
                </div>
                {!state.isLocked && (
                  <div className="absolute top-2 right-2 p-1 bg-black/40 rounded-md">
                     <ImageIcon className="w-2.5 h-2.5 text-white/50" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Static Info Layer (Hidden in Fullscreen) */}
          {!state.isFullscreen && !state.isLocked && (
            <div className="absolute top-4 left-4 z-[90] pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-3">
                <div className="flex items-center gap-1 text-emerald-400">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold leading-none">{speed} Mbps</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1 text-blue-400">
                  <Layout className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">Studio</span>
                </div>
              </div>
            </div>
          )}
        </main>

      {/* --- Controls Footer (The 4 Main Buttons) --- */}
      <AnimatePresence>
        {!state.isFullscreen && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#1A1B1E]/90 backdrop-blur-2xl p-2 rounded-2xl border border-white/5 shadow-2xl z-[500] safe-bottom ${state.isLocked ? 'opacity-60' : ''}`}
          >
            <FooterButton 
              icon={<Maximize className="w-5 h-5" />} 
              label="Fullscreen" 
              onClick={toggleFullscreen}
              active={state.isFullscreen}
            />
            <FooterButton 
              icon={<Crop className="w-5 h-5" />} 
              label="Fix Browser" 
              onClick={() => !state.isLocked && setState(p => ({ ...p, isCropping: !p.isCropping }))}
              active={state.isCropping}
              variant="blue"
              disabled={state.isLocked}
            />
            <FooterButton 
              icon={<User className="w-5 h-5" />} 
              label="Face Overlay" 
              onClick={() => !state.isLocked && setState(p => ({ ...p, isCamVisible: !p.isCamVisible }))}
              active={state.isCamVisible}
              variant={state.isCamVisible ? 'blue' : 'default'}
              disabled={state.isLocked}
            />
            <FooterButton 
              icon={state.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />} 
              label={state.isLocked ? "Locked" : "Lock Setup"} 
              onClick={() => setState(p => ({ ...p, isLocked: !p.isLocked }))}
              active={state.isLocked}
              variant={state.isLocked ? 'red' : 'default'}
            />
            <div className="w-px h-8 bg-white/5 mx-1" />
            <FooterButton 
              icon={<Settings className="w-5 h-5" />} 
              label="Config" 
              onClick={() => !state.isLocked && setShowUrlBar(true)}
              disabled={state.isLocked}
            />
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Fullscreen Exit Bubble */}
      {state.isFullscreen && (
        <button 
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-[1000] bg-black/40 hover:bg-black/80 backdrop-blur-md p-3 rounded-full border border-white/10 text-white/50 hover:text-white transition-all active:scale-95"
        >
          <Minimize className="w-5 h-5" />
        </button>
      )}

      {/* --- Interaction Panels --- */}

      {/* URL Config Modal */}
      <AnimatePresence>
        {showUrlBar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#1A1B1E] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#1A1B1E] py-2 z-10 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Stream Studio Config</h3>
                <button onClick={() => setShowUrlBar(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={reloadIframe}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                  Reload Stream
                </button>
              </div>

              <form onSubmit={handleNav} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Stream URL</label>
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40"
                    placeholder="Enter website link..."
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                >
                  Apply & Load
                </button>
              </form>

              <div className="mt-6 space-y-6">
                {/* Background Music */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Background Music</p>
                    </div>
                    <button 
                      onClick={() => setState(p => ({ ...p, isMusicPlaying: !p.isMusicPlaying }))}
                      className={`p-2 rounded-xl transition-all ${
                        state.isMusicPlaying ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {state.isMusicPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.musicVolume}
                      onChange={(e) => setState(p => ({ ...p, musicVolume: parseFloat(e.target.value) }))}
                      className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-500 w-8">{Math.round(state.musicVolume * 100)}%</span>
                  </div>
                </div>

                {/* Stadium & Atmosphere */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Atmosphere</p>
                  </div>

                  <div className="space-y-4">
                    {/* Continuous Ambience */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[9px] font-bold text-slate-300">Continuous Crowd</span>
                        </div>
                        <button 
                          onClick={() => setState(p => ({ ...p, isStadiumSoundPlaying: !p.isStadiumSoundPlaying }))}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                            state.isStadiumSoundPlaying ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {state.isStadiumSoundPlaying ? 'Live Now' : 'Go Live'}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-3 h-3 text-slate-600" />
                        <input 
                          type="range" min="0" max="1" step="0.01" 
                          value={state.stadiumVolume}
                          onChange={(e) => setState(p => ({ ...p, stadiumVolume: parseFloat(e.target.value) }))}
                          className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[9px] font-mono text-slate-500 w-6">{Math.round(state.stadiumVolume * 100)}</span>
                      </div>
                    </div>

                    {/* Sound Library Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          const audio = new Audio('https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-one/sports_stadium_crowd_cheer_applause_whistle.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">🏏</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 z-10">Chakka / 6</span>
                      </button>

                      <button 
                        onClick={() => {
                          const audio = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">👏</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 z-10">Choka / 4</span>
                      </button>

                      <button 
                        onClick={() => {
                          const audio = new Audio('https://www.soundjay.com/human/sounds/ooooh-01.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">☝️</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-400 z-10">Out / Wicket</span>
                      </button>

                      <button 
                        onClick={() => {
                          const audio = new Audio('https://www.soundjay.com/misc/sounds/wood-crack-1.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">💥</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 z-10">Bat Hit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                       <button 
                        onClick={() => {
                          const audio = new Audio('https://www.soundjay.com/misc/sounds/stadium-crowd-1.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">🏟️</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 z-10">Crowd Roar</span>
                      </button>

                      <button 
                        onClick={() => {
                          const audio = new Audio('https://www.soundjay.com/misc/sounds/small-bell-ring-01a.mp3');
                          audio.volume = state.stadiumVolume;
                          audio.play();
                        }}
                        className="bg-slate-600/10 hover:bg-slate-600/20 border border-slate-500/20 p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl group-active:scale-125 transition-transform z-10">🔔</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 z-10">Umpire Bell</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Identity Photo */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Apna Photo (Identity Overlay)</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {state.customPhoto && (
                         <button 
                           onClick={() => setState(p => ({ 
                             ...p, 
                             photoScale: 1, 
                             photoX: 80, 
                             photoY: 80,
                             photoCropScale: 1,
                             photoCropX: 0,
                             photoCropY: 0
                           }))}
                           className="p-2 bg-white/5 text-slate-500 rounded-xl hover:bg-white/10 transition-all"
                           title="Reset Photo Transform"
                         >
                           <RotateCw className="w-4 h-4" />
                         </button>
                       )}
                       {state.customPhoto && (
                         <button 
                           onClick={() => setState(p => ({ ...p, isPhotoVisible: !p.isPhotoVisible }))}
                           className={`p-2 rounded-xl transition-all ${
                             state.isPhotoVisible ? 'bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/50' : 'bg-white/5 text-slate-400'
                           }`}
                         >
                           {state.isPhotoVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                         </button>
                       )}
                       <label className="p-2 bg-purple-600/20 text-purple-400 rounded-xl cursor-pointer hover:bg-purple-600/30 transition-all" title="Upload Photo">
                         <Upload className="w-4 h-4" />
                         <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                       </label>
                    </div>
                  </div>
                  {state.customPhoto && (
                    <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Overlay Size</label>
                          <div className="flex items-center gap-2">
                             <input 
                              type="number" 
                              value={Math.round(state.photoScale * 100)}
                              onChange={(e) => setState(p => ({ ...p, photoScale: Math.max(0.1, parseInt(e.target.value) / 100) }))}
                              className="w-12 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-center p-1 text-slate-300 outline-none focus:border-purple-500/50"
                            />
                            <span className="text-[9px] font-mono font-bold text-slate-500">%</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="0.1" max="4" step="0.01" 
                          value={state.photoScale}
                          onChange={(e) => setState(p => ({ ...p, photoScale: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cropping Zoom</label>
                          <div className="flex items-center gap-2">
                             <input 
                              type="number" 
                              value={Math.round(state.photoCropScale * 100)}
                              onChange={(e) => setState(p => ({ ...p, photoCropScale: Math.max(1, parseInt(e.target.value) / 100) }))}
                              className="w-12 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-center p-1 text-slate-300 outline-none focus:border-emerald-500/50"
                            />
                            <span className="text-[9px] font-mono font-bold text-slate-500">%</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="1" max="5" step="0.1" 
                          value={state.photoCropScale}
                          onChange={(e) => setState(p => ({ ...p, photoCropScale: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">X Offset</label>
                            <input 
                              type="number" 
                              value={state.photoCropX}
                              onChange={(e) => setState(p => ({ ...p, photoCropX: parseInt(e.target.value) || 0 }))}
                              className="w-10 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-center p-0.5 text-slate-300 outline-none"
                            />
                          </div>
                          <input 
                            type="range" min="-200" max="200" step="1" 
                            value={state.photoCropX}
                            onChange={(e) => setState(p => ({ ...p, photoCropX: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Y Offset</label>
                            <input 
                              type="number" 
                              value={state.photoCropY}
                              onChange={(e) => setState(p => ({ ...p, photoCropY: parseInt(e.target.value) || 0 }))}
                              className="w-10 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-center p-0.5 text-slate-300 outline-none"
                            />
                          </div>
                          <input 
                            type="range" min="-200" max="200" step="1" 
                            value={state.photoCropY}
                            onChange={(e) => setState(p => ({ ...p, photoCropY: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => setState(p => ({ ...p, customPhoto: null, isPhotoVisible: false }))}
                        className="w-full py-2 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors border-t border-white/5"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Face Overlay Configuration */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Face Overlay (Camera)</p>
                    </div>
                    {state.isCamVisible && (
                      <button 
                        onClick={() => setState(p => ({ ...p, camScale: 1, camX: 50, camY: 50 }))}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors flex items-center gap-1.5"
                        title="Reset Camera"
                      >
                         <span className="text-[8px] font-bold uppercase">Reset</span>
                         <RotateCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Camera Size (Scale)</label>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{Math.round(state.camScale * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="4" step="0.01" 
                        value={state.camScale}
                        onChange={(e) => setState(p => ({ ...p, camScale: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                    <p className="text-[8px] text-slate-600 font-medium">Tip: Drag the camera bubble on the main screen to move it.</p>
                  </div>
                </div>

                {/* Reset Section */}
                <div className="border-t border-white/5 pt-6">
                  <button 
                    onClick={() => setState(p => ({ 
                      ...p, 
                      cropScale: 1, 
                      cropOffsetX: 0, 
                      cropOffsetY: 0, 
                      webZoom: 1,
                      isAspectLocked: false,
                      rotation: 0,
                      camScale: 1,
                      camX: 50,
                      camY: 50,
                      photoScale: 0.8,
                      photoX: 40,
                      photoY: 400,
                      photoCropScale: 1.2,
                      photoCropX: 0,
                      photoCropY: 0
                    }))}
                    className="w-full py-4 border border-white/5 hover:bg-emerald-600/10 hover:text-emerald-400 hover:border-emerald-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Reset All View Transforms
                  </button>
                </div>

                {/* Presets Manager */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4 text-emerald-400" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saved Presets</p>
                    </div>
                    <button 
                      onClick={savePreset}
                      className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600/30 transition-colors"
                    >
                      Save Current
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {presets.length === 0 && (
                      <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 text-center">
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">No presets saved yet</p>
                      </div>
                    )}
                    {presets.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => loadPreset(p)}
                        className="group relative bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 rounded-2xl p-3 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[11px] font-bold text-white truncate w-32">{p.name}</h4>
                            <p className="text-[8px] text-slate-500 truncate w-32">{p.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="flex flex-col items-end">
                                <span className="text-[7px] font-mono text-blue-400">Scale: {p.cropScale.toFixed(2)}x</span>
                                <span className="text-[7px] font-mono text-emerald-400">Zoom: {p.webZoom.toFixed(2)}x</span>
                             </div>
                             <button 
                               onClick={(e) => deletePreset(p.id, e)}
                               className="p-1.5 bg-red-500/10 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                             >
                               <X className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={exportPresets}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <label className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <Save className="w-3.5 h-3.5" />
                      Import
                      <input type="file" accept=".json" onChange={importPresets} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Canvas Theme */}
                <div className="border-t border-white/5 pt-6 text-center">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Studio Theme</p>
                   <div className="flex justify-center gap-3">
                     {[
                       { color: '#0A0B0D', name: 'Dark' },
                       { color: '#1a1a2e', name: 'Deep' },
                       { color: '#002244', name: 'Ocean' },
                       { color: '#000000', name: 'Pure' }
                     ].map(theme => (
                       <button 
                         key={theme.color} 
                         onClick={() => setState(p => ({ ...p, canvasBg: theme.color }))}
                         className={`w-10 h-10 rounded-2xl border-2 transition-all ${state.canvasBg === theme.color ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-white/5'}`}
                         style={{ backgroundColor: theme.color }}
                         title={theme.name}
                       />
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isCropping && !state.isLocked && !state.isFullscreen && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 z-[500] w-[90vw] sm:w-20 bg-[#1A1B1E]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-3 flex flex-row sm:flex-col items-center gap-2 sm:gap-4 shadow-2xl overflow-x-auto no-scrollbar"
          >
             <button 
               title="Save Current Layout" 
               onClick={savePreset} 
               className="tool-btn flex flex-col items-center gap-1 py-1 sm:py-3 group border-emerald-500/30 bg-emerald-500/5 shrink-0"
             >
               <Save className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
               <span className="text-[7px] font-black uppercase tracking-tighter text-emerald-400 hidden sm:block">Save Layout</span>
             </button>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <button 
               title="Reset Crop Zoom & Position" 
               onClick={() => setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0 }))} 
               className="tool-btn flex flex-col items-center gap-1 py-1 sm:py-3 group border-blue-500/30 bg-blue-500/5 shrink-0"
             >
               <RotateCw className="w-4 h-4 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
               <span className="text-[7px] font-black uppercase tracking-tighter text-blue-400 hidden sm:block">Reset Crop</span>
             </button>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
               <button 
                 onClick={() => setState(p => ({ ...p, isAspectLocked: !p.isAspectLocked }))}
                 className={`tool-btn flex flex-col items-center gap-1 py-1 sm:py-2 ${state.isAspectLocked ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : ''}`}
                 title="Toggle 16:9 Aspect Lock"
               >
                 <Monitor className={`w-4 h-4 ${state.isAspectLocked ? 'text-blue-400' : 'text-slate-500'}`} />
                 <span className="text-[7px] font-black uppercase tracking-tighter hidden sm:block">16:9 Lock</span>
               </button>
             </div>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
               <button 
                 onClick={() => setState(p => ({ ...p, rotation: (p.rotation + 90) % 360 }))}
                 className="tool-btn flex flex-col items-center gap-1 py-1 sm:py-2"
                 title="Rotate 90°"
               >
                 <RotateCw className="w-4 h-4 text-blue-400" />
               </button>
               <div className="flex flex-col items-center min-w-[40px]">
                 <input 
                   type="number" 
                   value={state.rotation} 
                   onChange={(e) => setState(p => ({ ...p, rotation: parseInt(e.target.value) || 0 }))}
                   className="w-10 sm:w-12 bg-white/10 border border-white/20 rounded px-1 py-1 text-[10px] sm:text-[8px] text-orange-400 font-mono text-center focus:border-orange-500/50 outline-none"
                 />
                 <span className="text-[7px] font-black uppercase tracking-tighter text-slate-500 mt-1">Deg</span>
               </div>
             </div>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-1 shrink-0">
                <button onClick={() => adjustCrop('y', 50)} className="tool-btn"><ArrowLeft className="rotate-90 w-4 h-4" /></button>
                <div className="flex flex-col sm:flex-row gap-1">
                  <button onClick={() => adjustCrop('x', 50)} className="tool-btn"><ArrowLeft className="w-4 h-4" /></button>
                  <button onClick={() => adjustCrop('x', -50)} className="tool-btn"><ArrowRight className="w-4 h-4" /></button>
                </div>
                <button onClick={() => adjustCrop('y', -50)} className="tool-btn"><ArrowRight className="rotate-90 w-4 h-4" /></button>
             </div>
             
             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
               <div className="flex flex-col sm:flex-row gap-1">
                 <button onClick={() => setState(p => ({ ...p, webZoom: Math.min(3, p.webZoom + 0.01) }))} className="tool-btn p-1.5"><Plus className="w-3.5 h-3.5 text-emerald-400" /></button>
                 <button onClick={() => setState(p => ({ ...p, webZoom: Math.max(0.1, p.webZoom - 0.01) }))} className="tool-btn p-1.5"><Minus className="w-3.5 h-3.5 text-red-400" /></button>
               </div>
               <div className="flex flex-col items-center min-w-[40px]">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.1"
                   max="3"
                   value={state.webZoom.toFixed(2)} 
                   onChange={(e) => setState(p => ({ ...p, webZoom: Math.max(0.1, Math.min(3, parseFloat(e.target.value) || 1)) }))}
                   className="w-10 sm:w-12 bg-white/10 border border-white/20 rounded px-1 py-1 text-[10px] sm:text-[8px] text-emerald-400 font-mono text-center focus:border-emerald-500/50 outline-none"
                 />
                 <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Mag</span>
               </div>
             </div>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
                <button onClick={() => adjustCrop('scale', 0.01)} className="tool-btn"><Plus className="w-4 h-4 text-blue-500" /></button>
                
                <div className="hidden sm:flex h-32 items-center justify-center py-2">
                  <input 
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.01"
                    value={state.cropScale}
                    onChange={(e) => setState(p => ({ ...p, cropScale: parseFloat(e.target.value) }))}
                    className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 -rotate-90"
                  />
                </div>

                <div className="flex flex-col items-center py-1 min-w-[44px]">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    max="5"
                    value={state.cropScale.toFixed(2)} 
                    onChange={(e) => setState(p => ({ ...p, cropScale: Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 1)) }))}
                    className="w-10 sm:w-12 bg-white/10 border border-white/20 rounded px-1 py-1 text-[10px] sm:text-[8px] text-blue-400 font-mono text-center focus:border-blue-500/50 outline-none"
                  />
                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Zoom</span>
                </div>

                <button onClick={() => adjustCrop('scale', -0.01)} className="tool-btn"><Minus className="w-4 h-4 text-blue-500" /></button>
              </div>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />
             
             <button 
               title="Full Reset" 
               onClick={() => setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, webZoom: 1, isAspectLocked: false, rotation: 0 }))} 
               className="tool-btn opacity-50 hover:opacity-100 shrink-0"
             >
               <Maximize className="w-4 h-4 text-slate-500" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Face Overlay Tool Panel (Floating) */}
      <AnimatePresence>
        {state.isCamVisible && !state.isLocked && !state.isFullscreen && !state.isCropping && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:right-auto sm:left-6 sm:top-1/2 sm:-translate-y-1/2 z-[500] w-[90vw] sm:w-20 bg-[#1A1B1E]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-3 flex flex-row sm:flex-col items-center gap-2 sm:gap-4 shadow-2xl overflow-x-auto no-scrollbar"
          >
             <button 
               title="Save Layout" 
               onClick={savePreset} 
               className="tool-btn flex flex-col items-center gap-1 py-1 sm:py-3 border-emerald-500/30 bg-emerald-500/5 shrink-0"
             >
               <Save className="w-4 h-4 text-emerald-500" />
               <span className="text-[7px] font-black uppercase tracking-tighter text-emerald-400 hidden sm:block">Save</span>
             </button>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-3 shrink-0">
               <button 
                 onClick={() => setState(p => ({ ...p, camScale: Math.min(3, parseFloat((p.camScale + 0.01).toFixed(2))) }))} 
                 className="tool-btn"
               >
                 <Plus className="w-4 h-4 text-emerald-500" />
               </button>

               <div className="hidden sm:flex h-32 items-center justify-center py-4">
                 <input 
                   type="range"
                   min="0.1"
                   max="3"
                   step="0.01"
                   value={state.camScale}
                   onChange={(e) => setState(p => ({ ...p, camScale: parseFloat(e.target.value) }))}
                   className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 -rotate-90"
                 />
               </div>

               <button 
                 onClick={() => setState(p => ({ ...p, camScale: Math.max(0.1, parseFloat((p.camScale - 0.01).toFixed(2))) }))} 
                 className="tool-btn"
               >
                 <Minus className="w-4 h-4 text-red-500" />
               </button>
             </div>

             <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0" />
             <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0" />

             <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 shrink-0">
               <div className="flex flex-col items-center min-w-[44px]">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.1"
                   max="3"
                   value={state.camScale.toFixed(2)} 
                   onChange={(e) => setState(p => ({ ...p, camScale: Math.max(0.1, Math.min(3, parseFloat(e.target.value) || 1)) }))}
                   className="w-10 sm:w-12 bg-white/10 border border-white/20 rounded px-1 py-1 text-[10px] sm:text-[8px] text-blue-400 font-mono text-center focus:border-blue-500/50 outline-none"
                 />
                 <span className="text-[7px] font-black uppercase tracking-tighter text-slate-500 mt-1">Size</span>
               </div>
               
               <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0 mx-1" />

               <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                 <input 
                   type="number"
                   value={state.camX.toFixed(0)}
                   onChange={(e) => setState(p => ({ ...p, camX: parseInt(e.target.value) || 0 }))}
                   className="w-10 sm:w-8 bg-white/10 border border-white/20 rounded px-1 py-1 text-[9px] sm:text-[7px] text-slate-400 font-mono text-center outline-none"
                   title="Cam X"
                 />
                 <input 
                   type="number"
                   value={state.camY.toFixed(0)}
                   onChange={(e) => setState(p => ({ ...p, camY: parseInt(e.target.value) || 0 }))}
                   className="w-10 sm:w-8 bg-white/10 border border-white/20 rounded px-1 py-1 text-[9px] sm:text-[7px] text-slate-400 font-mono text-center outline-none"
                   title="Cam Y"
                 />
               </div>

               <div className="hidden sm:block h-px w-8 bg-white/10 shrink-0 my-2" />
               <div className="block sm:hidden w-px h-8 bg-white/10 shrink-0 mx-1" />

               <button 
                 onClick={() => setState(p => ({ ...p, camX: 50, camY: 50, camScale: 1 }))} 
                 className="tool-btn shrink-0"
               >
                 <RotateCw className="w-4 h-4 text-slate-500" />
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .tool-btn {
          @apply p-2.5 sm:p-2 bg-white/5 hover:bg-white/10 active:scale-90 rounded-xl transition-all border border-white/5 text-slate-400 hover:text-white flex items-center justify-center;
          min-width: 44px;
          min-height: 44px;
        }
        @media (max-width: 640px) {
          .tool-btn {
             min-width: 40px;
             min-height: 40px;
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}} />

    </div>
  );

  function adjustCrop(axis: 'scale' | 'x' | 'y', val: number) {
    setState(prev => ({
      ...prev,
      cropScale: axis === 'scale' ? Math.max(0.1, prev.cropScale + val) : prev.cropScale,
      cropOffsetX: axis === 'x' ? prev.cropOffsetX + val : prev.cropOffsetX,
      cropOffsetY: axis === 'y' ? prev.cropOffsetY + val : prev.cropOffsetY,
    }));
  }
}

function FooterButton({ icon, label, onClick, active, variant = 'default', disabled }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean, variant?: 'default' | 'blue' | 'red', disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 w-16 sm:w-20 py-1.5 sm:py-2 rounded-xl transition-all duration-300 active:scale-95 touch-manipulation ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${
        active 
          ? variant === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : variant === 'red' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white shadow-xl'
          : variant === 'blue' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20' : 'hover:bg-white/5 text-slate-400'
      }`}
    >
      <span className="text-lg sm:text-xl">{icon}</span>
      <span className="text-[7px] sm:text-[9px] uppercase font-black tracking-tighter sm:tracking-tight">{label}</span>
    </button>
  );
}
