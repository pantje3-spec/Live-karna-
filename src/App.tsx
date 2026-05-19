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
  ExternalLink,
  Volume2,
  Play,
  Pause
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
    musicVolume: 0.5
  });

  const [speed, setSpeed] = useState<string>('10.0');
  const [showUrlBar, setShowUrlBar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [presets, setPresets] = useState<StreamPreset[]>([]);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const pipWindowRef = useRef<any>(null);

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
    const name = prompt("Enter a name for this preset:", new URL(activeTab.url).hostname) || 'Untitled Preset';
    
    const newPreset: StreamPreset = {
      id: Date.now().toString(),
      name,
      url: activeTab.url,
      cropScale: state.cropScale,
      cropOffsetX: state.cropOffsetX,
      cropOffsetY: state.cropOffsetY,
      webZoom: state.webZoom,
      rotation: state.rotation,
      isAspectLocked: state.isAspectLocked
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('stream_presets', JSON.stringify(updated));
  };

  const togglePiP = async () => {
    if (isPiPActive) {
      pipWindowRef.current?.close();
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      alert("Document Picture-in-Picture is not supported in your browser (Requires Chrome 111+ or Edge 111+).");
      return;
    }

    try {
      const pip = (window as any).documentPictureInPicture;
      const pipWindow = await pip.requestWindow({
        width: 1024,
        height: 576,
      });

      pipWindowRef.current = pipWindow;

      // Copy styles to PiP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          if (styleSheet.href) {
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Move the capture area container to the PiP window
      const container = containerRef.current;
      if (container) {
        pipWindow.document.body.appendChild(container);
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.backgroundColor = state.canvasBg;
        pipWindow.document.body.style.overflow = 'hidden';
        setIsPiPActive(true);
      }

      pipWindow.addEventListener('pagehide', () => {
        setIsPiPActive(false);
        pipWindowRef.current = null;
        
        // Move back to main window
        const placeholder = document.getElementById('pip-placeholder');
        if (placeholder && container) {
          placeholder.replaceWith(container);
        }
      }, { once: true });

    } catch (err) {
      console.error("PiP Error:", err);
    }
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

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Effects ---

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
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!state.isCropping || state.isLocked) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.cropOffsetX, y: clientY - state.cropOffsetY };
  };

  const onMouseDownCam = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.isLocked) return;
    e.stopPropagation();
    setIsDraggingCam(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.camX, y: clientY - state.camY };
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
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setIsDraggingCam(false);
  };

  const toggleFullscreen = () => {
    setState(p => ({ ...p, isFullscreen: !p.isFullscreen }));
  };

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];

  return (
    <div 
      className="fixed inset-0 text-slate-200 font-sans select-none overflow-hidden flex flex-col"
      style={{ backgroundColor: state.canvasBg }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
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
       {isPiPActive ? (
         <div id="pip-placeholder" className="flex-1 flex flex-col items-center justify-center bg-black/20 italic text-slate-500 text-sm gap-4 transition-all animate-pulse">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Studio Mode: Active</p>
              <p className="mt-1">Stream popped out to PiP Window</p>
            </div>
            <button 
              onClick={togglePiP}
              className="mt-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition-all"
            >
              Return to Studio
            </button>
         </div>
       ) : (
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
  
          {/* Edit Mode Helpers */}
          {state.isCropping && !state.isLocked && (
            <div 
              className="absolute inset-0 z-[60] cursor-move bg-blue-500/5 border-2 border-dashed border-blue-500/20 pointer-events-auto"
              onMouseDown={onMouseDown}
              onTouchStart={onMouseDown}
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
      )}

      {/* --- Controls Footer (The 4 Main Buttons) --- */}
      <AnimatePresence>
        {!state.isFullscreen && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#1A1B1E]/90 backdrop-blur-2xl p-2 rounded-2xl border border-white/5 shadow-2xl z-[500] ${state.isLocked ? 'opacity-60' : ''}`}
          >
            <FooterButton 
              icon={<Maximize className="w-5 h-5" />} 
              label="Fullscreen" 
              onClick={toggleFullscreen}
              active={state.isFullscreen}
            />
            <FooterButton 
              icon={<ExternalLink className="w-5 h-5" />} 
              label="PiP Mode" 
              onClick={togglePiP}
              active={isPiPActive}
              variant="blue"
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
              className="w-full max-w-sm bg-[#1A1B1E] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white">Stream Configuration</h3>
                <button onClick={() => setShowUrlBar(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
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
                      camY: 50
                    }))}
                    className="w-full py-4 border border-white/5 hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Reset All Transforms
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

      {/* Browser Tool Panel (Floating) */}
      <AnimatePresence>
        {state.isCropping && !state.isLocked && !state.isFullscreen && (
          <motion.div 
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[500] w-20 bg-[#1A1B1E]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 flex flex-col items-center gap-4 shadow-2xl"
          >
             <button 
               title="Reset Crop Zoom & Position" 
               onClick={() => setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0 }))} 
               className="tool-btn flex flex-col items-center gap-1 py-3 group border-blue-500/30 bg-blue-500/5 w-full"
             >
               <RotateCw className="w-4 h-4 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
               <span className="text-[7px] font-black uppercase tracking-tighter text-blue-400">Reset Crop</span>
             </button>

             <div className="h-px w-8 bg-white/10" />

             <div className="flex flex-col items-center gap-2">
               <button 
                 onClick={() => setState(p => ({ ...p, isAspectLocked: !p.isAspectLocked }))}
                 className={`tool-btn flex flex-col items-center gap-1 py-2 ${state.isAspectLocked ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : ''}`}
                 title="Toggle 16:9 Aspect Lock"
               >
                 <Monitor className={`w-4 h-4 ${state.isAspectLocked ? 'text-blue-400' : 'text-slate-500'}`} />
                 <span className="text-[7px] font-black uppercase tracking-tighter">16:9 Lock</span>
               </button>
             </div>

             <div className="h-px w-8 bg-white/10" />

             <div className="flex flex-col items-center gap-2">
               <button 
                 onClick={() => setState(p => ({ ...p, rotation: (p.rotation + 90) % 360 }))}
                 className="tool-btn flex flex-col items-center gap-1 py-2"
                 title="Rotate 90°"
               >
                 <RotateCw className="w-4 h-4 text-blue-400" />
               </button>
               <div className="flex flex-col items-center">
                 <input 
                   type="number" 
                   value={state.rotation} 
                   onChange={(e) => setState(p => ({ ...p, rotation: parseInt(e.target.value) || 0 }))}
                   className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[8px] text-orange-400 font-mono text-center focus:border-orange-500/50 outline-none"
                 />
                 <span className="text-[7px] font-black uppercase tracking-tighter text-slate-500 mt-1">Deg°</span>
               </div>
             </div>

             <div className="h-px w-8 bg-white/10" />

             <div className="flex flex-col items-center gap-1">
                <button onClick={() => adjustCrop('y', 50)} className="tool-btn"><ArrowLeft className="rotate-90 w-4 h-4" /></button>
                <div className="flex gap-1">
                  <button onClick={() => adjustCrop('x', 50)} className="tool-btn"><ArrowLeft className="w-4 h-4" /></button>
                  <button onClick={() => adjustCrop('x', -50)} className="tool-btn"><ArrowRight className="w-4 h-4" /></button>
                </div>
                <button onClick={() => adjustCrop('y', -50)} className="tool-btn"><ArrowRight className="rotate-90 w-4 h-4" /></button>
             </div>
             
             <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1">
                 <button onClick={() => setState(p => ({ ...p, webZoom: Math.min(3, p.webZoom + 0.01) }))} className="tool-btn p-1.5"><Plus className="w-3.5 h-3.5" /></button>
                 <button onClick={() => setState(p => ({ ...p, webZoom: Math.max(0.1, p.webZoom - 0.01) }))} className="tool-btn p-1.5"><Minus className="w-3.5 h-3.5" /></button>
               </div>
               <div className="flex flex-col items-center">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.1"
                   max="3"
                   value={state.webZoom.toFixed(2)} 
                   onChange={(e) => setState(p => ({ ...p, webZoom: Math.max(0.1, Math.min(3, parseFloat(e.target.value) || 1)) }))}
                   className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[8px] text-emerald-400 font-mono text-center focus:border-emerald-500/50 outline-none"
                 />
                 <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Content Mag</span>
               </div>
             </div>

             <div className="h-px w-8 bg-white/10" />

             <div className="flex flex-col items-center gap-2">
                <button onClick={() => adjustCrop('scale', 0.01)} className="tool-btn"><Plus className="w-4 h-4 text-blue-500" /></button>
                
                <div className="h-32 flex items-center justify-center py-2">
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

                <div className="flex flex-col items-center py-1">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    max="5"
                    value={state.cropScale.toFixed(2)} 
                    onChange={(e) => setState(p => ({ ...p, cropScale: Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 1)) }))}
                    className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[8px] text-blue-400 font-mono text-center focus:border-blue-500/50 outline-none"
                  />
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Zoom</span>
                </div>

                <button onClick={() => adjustCrop('scale', -0.01)} className="tool-btn"><Minus className="w-4 h-4 text-blue-500" /></button>
              </div>

             <div className="h-px w-8 bg-white/10" />
             
             <button 
               title="Reset All Browser Transforms" 
               onClick={() => setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, webZoom: 1, isAspectLocked: false, rotation: 0 }))} 
               className="tool-btn mt-2 opacity-50 hover:opacity-100"
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
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-[500] w-20 bg-[#1A1B1E]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 flex flex-col items-center gap-4 shadow-2xl"
          >
             <div className="flex flex-col items-center gap-3">
               <button 
                 onClick={() => setState(p => ({ ...p, camScale: Math.min(3, parseFloat((p.camScale + 0.01).toFixed(2))) }))} 
                 className="tool-btn"
               >
                 <Plus className="w-4 h-4 text-emerald-500" />
               </button>

               <div className="h-32 flex items-center justify-center py-4">
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

             <div className="flex flex-col items-center gap-1">
               <span className="text-[10px] font-mono font-black text-blue-400">{state.camScale.toFixed(2)}x</span>
               <div className="h-px w-8 bg-white/10" />
               <button 
                 onClick={() => setState(p => ({ ...p, camX: 50, camY: 50, camScale: 1 }))} 
                 className="tool-btn"
               >
                 <RotateCw className="w-4 h-4 text-slate-500" />
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .tool-btn {
          @apply p-2.5 bg-white/5 hover:bg-white/10 active:scale-90 rounded-xl transition-all border border-white/5 text-slate-400 hover:text-white;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .safe-top { padding-top: env(safe-area-inset-top); }
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
      className={`flex flex-col items-center gap-1 w-20 py-1.5 rounded-xl transition-all duration-300 active:scale-90 ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${
        active 
          ? variant === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : variant === 'red' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white shadow-xl'
          : variant === 'blue' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20' : 'hover:bg-white/5 text-slate-400'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[9px] uppercase font-bold tracking-tighter">{label}</span>
    </button>
  );
}
