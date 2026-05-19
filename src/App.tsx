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
  Camera,
  Circle,
  Video,
  Download,
  Shield,
  Activity,
  Search,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Tab {
  id: string;
  url: string;
  title: string;
  icon: string;
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
  // Face Overlay
  isCamVisible: boolean;
  camScale: number;
  camX: number;
  camY: number;
}

const DEFAULT_TABS: Tab[] = [
  { id: '1', url: 'https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_LjQHig', title: 'Live Stream 1', icon: 'YT' },
  { id: '2', url: 'https://www.google.com/search?q=live+streaming&tbm=vid', title: 'Browser', icon: 'G' },
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
    isCamVisible: false,
    camScale: 1,
    camX: 20,
    camY: 20
  });

  const [speed, setSpeed] = useState<string>('1.8');
  const [showControls, setShowControls] = useState(true);
  const [showUrlBar, setShowUrlBar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Effects ---
  
  // Camera Stream
  useEffect(() => {
    if (state.isCamVisible) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera error:", err));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [state.isCamVisible]);
  
  // Professional Splash Screen Exit
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(p => ({ ...p, isSplashed: false }));
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Net speed & Connection status
  useEffect(() => {
    const updateStats = () => {
      setIsOnline(navigator.onLine);
      const connection = (navigator as any).connection;
      if (connection) {
        setSpeed(connection.downlink.toFixed(1));
      }
    };
    
    window.addEventListener('online', updateStats);
    window.addEventListener('offline', updateStats);
    const interval = setInterval(updateStats, 3000);
    return () => {
      window.removeEventListener('online', updateStats);
      window.removeEventListener('offline', updateStats);
      clearInterval(interval);
    };
  }, []);

  // Native Picture-in-Picture Logic (Emulated / Hinted)
  const togglePiP = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      // In a real environment with direct video, we'd target the video element
      // Since it's an iframe, we provide a toast/UI hint
      console.log("PiP requested for stream container");
    }
  }, []);

  // Recording Logic
  const startRecording = async () => {
    try {
      // @ts-ignore - Check for multiple potential locations of getDisplayMedia
      const mediaDevices = navigator.mediaDevices as any;
      const getDisplayMedia = mediaDevices?.getDisplayMedia?.bind(mediaDevices) || (navigator as any)?.getDisplayMedia?.bind(navigator);

      if (!getDisplayMedia) {
        alert("Screen recording is not supported in this browser or environment. Please use a desktop browser like Chrome or Edge.");
        return;
      }

      const stream = await getDisplayMedia({ video: true, audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stream-record-${Date.now()}.webm`;
        a.click();
        stream.getTracks().forEach(t => t.stop());
        setState(p => ({ ...p, isRecording: false }));
      };

      mediaRecorderRef.current.start();
      setState(p => ({ ...p, isRecording: true }));
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.log("Recording cancelled by user");
      } else {
        console.error("Recording error:", err);
      }
      setState(p => ({ ...p, isRecording: false }));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
  };

  // --- Handlers ---
  const handleNav = (e?: React.FormEvent) => {
    e?.preventDefault();
    let targetUrl = urlInput;
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    
    // Auto-embed YouTube if possible
    if (targetUrl.includes('youtube.com/watch?v=')) {
      const vidId = targetUrl.split('v=')[1]?.split('&')[0];
      targetUrl = `https://www.youtube.com/embed/${vidId}`;
    }
    
    setState(prev => ({ 
      ...prev, 
      tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, url: targetUrl, title: 'New Stream' } : t)
    }));
    setShowUrlBar(false);
  };

  const addTab = () => {
    const newId = Date.now().toString();
    setState(p => ({
      ...p,
      tabs: [...p.tabs, { id: newId, url: 'https://www.google.com', title: 'New Tab', icon: '+' }],
      activeTabId: newId
    }));
    setShowUrlBar(true);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.tabs.length <= 1) return;
    const newTabs = state.tabs.filter(t => t.id !== id);
    setState(p => ({
      ...p,
      tabs: newTabs,
      activeTabId: p.activeTabId === id ? (newTabs[0]?.id || '') : p.activeTabId
    }));
  };

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingCam, setIsDraggingCam] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!state.isCropping || state.isLocked) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - state.cropOffsetX, y: clientY - state.cropOffsetY };
  };

  const onMouseDownCam = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingCam(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - state.camX, y: clientY - state.camY };
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

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

  // Toggle for Clean View (Capture Mode)
  const toggleFullscreen = () => {
    setState(p => ({ ...p, isFullscreen: !p.isFullscreen }));
  };

  return (
    <div 
      className={`fixed inset-0 bg-[#0A0B0D] text-slate-200 font-sans select-none overflow-hidden flex flex-col ${state.isLocked ? 'cursor-default' : ''}`}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
      {/* --- Header: Hidden in Fullscreen --- */}
      {!state.isFullscreen && (
        <header className="h-14 border-b border-white/5 bg-brand-surface/40 backdrop-blur-md flex items-center px-4 justify-between z-[100] safe-top">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">StreamFlow</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Layout Fixer Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Live Support</span>
            </div>
          </div>
        </header>
      )}

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* URL Bar Overlay (Modal) */}
        <AnimatePresence>
          {showUrlBar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#1A1B1E] border border-white/10 rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Stream Configuration</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Enter target website link</p>
                    </div>
                  </div>
                  <button onClick={() => setShowUrlBar(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleNav} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
                      placeholder="https://runbuzzcricket.com/..."
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 font-bold">HTTPS</div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={addTab}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      + New Tab
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-xl shadow-blue-900/40"
                    >
                      Open Stream
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Left Sidebar: Hidden in Fullscreen --- */}
        {!state.isFullscreen && (
          <motion.aside 
            initial={false}
            animate={{ width: isSidebarOpen ? 240 : 0, opacity: isSidebarOpen ? 1 : 0 }}
            className="bg-brand-surface/20 border-r border-white/5 overflow-hidden flex flex-col z-[90]"
          >
            <div className="p-4 space-y-6 min-w-[240px]">
              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Active Streams</h3>
                <div className="space-y-1">
                  {state.tabs.map(tab => (
                    <button
                      key={tab.id}
                      disabled={state.isLocked}
                      onClick={() => !state.isLocked && setState(p => ({ ...p, activeTabId: tab.id }))}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                        state.activeTabId === tab.id 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'hover:bg-white/5 text-slate-400'
                      } ${state.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs font-medium truncate max-w-[120px]">{tab.title}</span>
                      </div>
                      {state.activeTabId === tab.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-auto">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 text-center">
                   <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">Setup Status</p>
                   <div className="flex justify-center gap-1 mb-2">
                     <div className={`w-2 h-2 rounded-full ${state.isCropping ? 'bg-blue-500' : 'bg-slate-700'}`} />
                     <div className={`w-2 h-2 rounded-full ${state.isCamVisible ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                     <div className={`w-2 h-2 rounded-full ${state.isLocked ? 'bg-amber-500' : 'bg-slate-700'}`} />
                   </div>
                   <p className="text-[9px] text-slate-500 leading-tight">Your layout is ready for external capture software.</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}

        {/* --- Browser Viewport --- */}
        <main className="flex-1 relative bg-black overflow-hidden group">
          {/* Action Overlay for Draggable Content */}
          <div 
            className={`absolute inset-0 z-50 ${state.isCropping && !state.isLocked ? 'cursor-move' : 'pointer-events-none'}`}
            onMouseDown={state.isCropping && !state.isLocked ? onMouseDown : undefined}
            onTouchStart={state.isCropping && !state.isLocked ? onMouseDown : undefined}
          />
          
          <div 
            className="absolute inset-0 transition-transform duration-300"
            style={{
              transform: `scale(${state.cropScale}) translate(${state.cropOffsetX}px, ${state.cropOffsetY}px)`,
              transformOrigin: 'center center'
            }}
          >
            <iframe 
              ref={iframeRef}
              src={activeTab.url}
              className="w-full h-full border-none"
              title="Stream View"
            />
          </div>

          {/* Interactive Blockers when Locked */}
          {state.isLocked && (
            <div className="absolute inset-0 z-[70] cursor-not-allowed bg-transparent" />
          )}

          {/* Fullscreen Exit Trigger */}
          {state.isFullscreen && (
            <button 
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-[200] bg-black/60 hover:bg-black p-2 rounded-full border border-white/20 text-white/40 hover:text-white transition-all backdrop-blur-md"
            >
              <Minimize className="w-5 h-5" />
            </button>
          )}

          {/* Camera Overlay */}
          <AnimatePresence>
            {state.isCamVisible && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute z-[100] bg-black rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl ${!state.isLocked ? 'cursor-move' : 'cursor-default'}`}
                onMouseDown={!state.isLocked ? onMouseDownCam : undefined}
                onTouchStart={!state.isLocked ? onMouseDownCam : undefined}
                style={{
                  width: `${150 * state.camScale}px`,
                  height: `${150 * state.camScale}px`,
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
                {!state.isLocked && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Indicator Overlays (Visible if not locked) */}
          {!state.isLocked && !state.isFullscreen && (
            <div className="absolute top-4 left-4 z-[90] flex flex-col gap-2 pointer-events-none transition-all duration-500">
               <div className="flex items-center gap-3 bg-brand-surface/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-xs shadow-xl self-start pointer-events-auto">
                 <div className="flex items-center gap-1.5 text-emerald-400">
                   <Wifi className="w-3.5 h-3.5" />
                   <span className="font-mono text-[10px]">{speed} Mbps</span>
                 </div>
                 <div className="h-3 w-px bg-white/10" />
                 <div className="flex items-center gap-1.5 text-blue-400">
                   <Cpu className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">Optimized</span>
                 </div>
               </div>
            </div>
          )}
        </main>

        {/* --- Footer Controls: Hidden in Fullscreen --- */}
        {!state.isFullscreen && (
          <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-brand-surface/80 backdrop-blur-2xl px-2 py-2 rounded-2xl border border-white/5 shadow-2xl z-[150] max-w-[95vw] overflow-x-auto no-scrollbar">
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
            <div className="w-px h-8 bg-white/5 mx-2" />
            <FooterButton 
              icon={<Settings className="w-5 h-5" />} 
              label="Config" 
              onClick={() => !state.isLocked && setShowUrlBar(!showUrlBar)}
              disabled={state.isLocked}
            />
          </footer>
        )}

      </div>

      {/* --- Overlay Sub-menus: Control Panel --- */}
      <AnimatePresence>
        {state.isCropping && !state.isFullscreen && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-brand-surface/90 backdrop-blur-3xl border border-white/5 p-4 rounded-3xl shadow-2xl w-[320px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Active Crop Area</span>
              </div>
              <button onClick={() => setState(p => ({ ...p, isCropping: false }))} className="p-1 hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center bg-black/40 p-3 rounded-2xl border border-white/5">
              <CropGridButton id="crop-up" onClick={() => !state.isLocked && adjustCrop('y', 50)} icon={<ArrowRight className="-rotate-90 w-4 h-4" />} disabled={state.isLocked} />
              <div className="w-full h-0" />
              <CropGridButton id="crop-left" onClick={() => !state.isLocked && adjustCrop('x', 50)} icon={<ArrowLeft className="w-4 h-4 text-slate-400" />} disabled={state.isLocked} />
              <CropGridButton id="crop-right" onClick={() => !state.isLocked && adjustCrop('x', -50)} icon={<ArrowRight className="w-4 h-4 text-slate-400" />} disabled={state.isLocked} />
              <div className="w-full h-0" />
              <CropGridButton id="crop-down" onClick={() => !state.isLocked && adjustCrop('y', -50)} icon={<ArrowRight className="rotate-90 w-4 h-4" />} disabled={state.isLocked} />
              <div className="w-px h-10 bg-white/5 mx-2" />
              <CropGridButton id="crop-in" onClick={() => !state.isLocked && adjustCrop('scale', 0.1)} icon={<Plus className="w-4 h-4 text-blue-400" />} disabled={state.isLocked} />
              <CropGridButton id="crop-out" onClick={() => !state.isLocked && adjustCrop('scale', -0.1)} icon={<Minus className="w-4 h-4 text-blue-400" />} disabled={state.isLocked} />
              <CropGridButton id="crop-reset" onClick={() => !state.isLocked && setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, camScale: 1, camX: 20, camY: 20 }))} icon={<RotateCw className="w-4 h-4 text-slate-400" />} disabled={state.isLocked} />
            </div>
            {state.isCamVisible && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Face Overlay Size</p>
                  <span className="text-[10px] font-mono text-blue-400 font-bold">{state.camScale.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    disabled={state.isLocked}
                    onClick={() => setState(p => ({ ...p, camScale: Math.max(0.5, parseFloat((p.camScale - 0.1).toFixed(1))) }))} 
                    className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all ${state.isLocked ? 'opacity-20 cursor-not-allowed' : 'active:scale-90'}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <input 
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={state.camScale}
                    disabled={state.isLocked}
                    onChange={(e) => setState(p => ({ ...p, camScale: parseFloat(e.target.value) }))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  <button 
                    disabled={state.isLocked}
                    onClick={() => setState(p => ({ ...p, camScale: Math.min(3, parseFloat((p.camScale + 0.1).toFixed(1))) }))} 
                    className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all ${state.isLocked ? 'opacity-20 cursor-not-allowed' : 'active:scale-90'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <p className="text-[9px] text-slate-500 text-center mt-3 font-medium">TIP: DRAG BROWSER TO POSITION</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function adjustCrop(axis: 'scale' | 'x' | 'y', val: number) {
    setState(prev => ({
      ...prev,
      cropScale: axis === 'scale' ? Math.max(1, prev.cropScale + val) : prev.cropScale,
      cropOffsetX: axis === 'x' ? prev.cropOffsetX + val : prev.cropOffsetX,
      cropOffsetY: axis === 'y' ? prev.cropOffsetY + val : prev.cropOffsetY,
    }));
  }
}

// --- Internal UI Components ---

function NavBtn({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-white/5'
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ChatMessage({ user, text, color = "text-blue-400" }: { user: string, text: string, color?: string }) {
  return (
    <div className="text-[10px] leading-relaxed">
      <span className={`font-bold ${color} mr-2`}>{user}:</span>
      <span className="text-slate-300">{text}</span>
    </div>
  );
}

function FooterButton({ icon, label, onClick, active, variant = 'default' }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean, variant?: 'default' | 'blue' | 'red' }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 w-20 py-1.5 rounded-xl transition-all duration-300 active:scale-90 ${
        active 
          ? variant === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : variant === 'red' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'
          : variant === 'blue' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20' : 'hover:bg-white/5 text-slate-500 hover:text-slate-100'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="text-[9px] uppercase font-extrabold tracking-tighter">{label}</span>
    </button>
  );
}

function ToggleItem({ label, active, onClick, accent = 'blue' }: { label: string, active: boolean, onClick: () => void, accent?: 'blue' | 'slate' }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onClick}>
      <span className={`text-sm font-medium transition-colors ${active ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{label}</span>
      <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${active ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <motion.div 
          animate={{ x: active ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" 
        />
      </div>
    </div>
  );
}

function CropGridButton({ id, onClick, icon }: { id: string, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className="p-2.5 bg-white/5 hover:bg-white/10 active:scale-90 rounded-xl transition-all border border-white/5"
    >
      {icon}
    </button>
  );
}
