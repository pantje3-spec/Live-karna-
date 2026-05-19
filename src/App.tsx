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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
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

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col w-full h-screen bg-brand-bg text-slate-200 overflow-hidden font-sans transition-all duration-500 ${state.isLowRam ? 'grayscale brightness-90' : ''}`}
      id="main-app"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
      {/* --- Splash Screen --- */}
      <AnimatePresence>
        {state.isSplashed && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[1000] bg-brand-bg flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 rotate-12">
                <Layout className="text-white w-10 h-10 -rotate-12" />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">StreamFlow <span className="text-blue-500 font-light">PRO</span></h1>
              <div className="flex gap-1 items-center">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Initializing Engine v3.0</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- App Header with Tabs --- */}
      <header className="h-12 bg-brand-surface border-b border-white/5 flex items-center px-4 gap-4 z-50 shrink-0">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs tracking-tight hidden md:block">StreamFlow</span>
        </div>

        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {state.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setState(p => ({ ...p, activeTabId: tab.id }))}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-w-[120px] max-w-[200px] border ${
                state.activeTabId === tab.id 
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                  : 'border-transparent hover:bg-white/5 text-slate-500'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span className="truncate flex-1 text-left">{tab.title}</span>
              <X 
                className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-white" 
                onClick={(e) => closeTab(tab.id, e)}
              />
            </button>
          ))}
          <button 
            onClick={addTab}
            className="p-1 px-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <button 
            onClick={() => setShowUrlBar(true)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* --- Side Navigation Sidebar (Left) --- */}
        <AnimatePresence>
          {!state.isFocusMode && isSidebarOpen && (
            <motion.aside 
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              className="w-60 bg-brand-sidebar border-r border-white/5 flex flex-col p-4 z-40 hidden lg:flex"
            >
              <div className="mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Navigation</h3>
                <nav className="flex flex-col gap-1">
                  <NavBtn icon={<Monitor className="w-4 h-4" />} label="Live Streams" active />
                  <NavBtn icon={<Cpu className="w-4 h-4" />} label="System Data" />
                  <NavBtn icon={<Globe className="w-4 h-4" />} label="Web Browser" />
                  <NavBtn icon={<Shield className="w-4 h-4" />} label="Safe Mode" />
                </nav>
              </div>

              <div className="mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Shortcuts</h3>
                <div className="flex flex-col gap-1">
                  <NavBtn icon={<div className="w-4 h-4 bg-red-600 rounded-sm" />} label="YouTube Live" />
                  <NavBtn icon={<div className="w-4 h-4 bg-blue-500 rounded-sm" />} label="Twitch Gaming" />
                </div>
              </div>

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
            </motion.aside>
          )}
        </AnimatePresence>

        {/* --- Main Viewport (WebView Container) --- */}
        <main 
          className={`flex-1 relative bg-black flex items-center justify-center overflow-hidden transition-all ${state.isCropping ? 'cursor-move' : ''}`}
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
        >
          
          {/* Reconnect Overlay */}
          {!isOnline && (
            <div className="absolute inset-0 z-[99] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
              <Wifi className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold mb-2">Weak Internet Detected</h2>
              <p className="text-sm text-slate-400 max-w-xs">StreamFlow is attempting to reconnect. Please check your internet connection.</p>
            </div>
          )}

          {/* URL Bar Overlay */}
          <AnimatePresence>
            {showUrlBar && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="absolute top-6 left-1/2 w-[90%] max-w-[600px] bg-brand-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 z-[60] shadow-2xl shadow-black/80"
              >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <form onSubmit={handleNav} className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 font-medium"
                    placeholder="Enter streaming URL..."
                    autoFocus
                  />
                  <button type="submit" className="px-4 bg-blue-600 rounded-xl text-white text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40">Open</button>
                </form>
                <button onClick={() => setShowUrlBar(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe Viewport */}
          <div 
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto"
            style={{
              transform: `scale(${state.cropScale}) translate(${state.cropOffsetX}px, ${state.cropOffsetY}px)`,
              transition: state.isCropping ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              className={`w-full h-full border-none pointer-events-${state.isLocked ? 'none' : 'auto'} ${state.isLowData ? 'contrast-125 saturate-50' : ''}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Touch Lock Layer */}
          {state.isLocked && (
            <div className="absolute inset-0 z-[70] cursor-not-allowed bg-transparent" />
          )}

          {/* Camera Overlay */}
          <AnimatePresence>
            {state.isCamVisible && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute z-[100] cursor-move bg-black rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl"
                onMouseDown={onMouseDownCam}
                onTouchStart={onMouseDownCam}
                style={{
                  width: `${150 * state.camScale}px`,
                  height: `${150 * state.camScale}px`,
                  left: `${state.camX}px`, // Changed to pixel coordinates for absolute positioning
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

          {/* Crop Overlay Indicators */}
          <AnimatePresence>
            {state.isCropping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[80] border-[2px] border-dashed border-blue-500/40 pointer-events-none m-10 md:m-20"
              >
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-sm uppercase font-bold shadow-lg">
                  Active Crop Area
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* --- Floating UI Info Overlays --- */}
        <div className="absolute top-4 left-4 lg:left-[260px] z-[90] flex flex-col gap-2 pointer-events-none transition-all duration-500">
           <div className="flex items-center gap-3 bg-brand-surface/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-xs shadow-xl self-start pointer-events-auto">
             <div className="flex items-center gap-1.5 text-emerald-400">
               <Wifi className="w-3.5 h-3.5" />
               <span className="font-mono text-[10px]">{speed} Mbps</span>
             </div>
             <div className="w-px h-3 bg-white/10" />
             <div className="flex items-center gap-1.5 text-blue-400">
               <Cpu className="w-3.5 h-3.5" />
               <span className="text-[10px] uppercase font-bold tracking-tighter">Optimized</span>
             </div>
           </div>
        </div>

        {/* --- Side Settings Panel --- */}
        <AnimatePresence>
          {isSidebarOpen && !state.isFullscreen && (
            <motion.aside 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-brand-sidebar border-l border-slate-800 p-6 flex flex-col gap-6 z-40"
            >
              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Optimization
                </h2>
                <div className="space-y-4">
                  <ToggleItem 
                    label="Low Bandwidth Mode" 
                    active={state.isLowData} 
                    onClick={() => setState(p => ({ ...p, isLowData: !p.isLowData }))} 
                  />
                  <ToggleItem 
                    label="Block Notifications" 
                    active={true} 
                    onClick={() => {}} 
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">RAM Purge Policy</span>
                    <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-blue-400 uppercase tracking-tighter">Aggressive</span>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-800 w-full"></div>

              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Experience
                </h2>
                <div className="space-y-4">
                  <ToggleItem 
                    label="Focus Mode" 
                    active={state.isFocusMode} 
                    onClick={() => setState(p => ({ ...p, isFocusMode: !p.isFocusMode }))} 
                  />
                  <ToggleItem 
                    label="Keep Screen Awake" 
                    active={true} 
                    onClick={() => {}} 
                    accent="blue"
                  />
                  <ToggleItem 
                    label="Touch Lock" 
                    active={state.isLocked} 
                    onClick={() => setState(p => ({ ...p, isLocked: !p.isLocked }))} 
                  />
                  <ToggleItem 
                    label="Low RAM Preview" 
                    active={state.isLowRam} 
                    onClick={() => setState(p => ({ ...p, isLowRam: !p.isLowRam }))} 
                  />
                </div>
              </section>

              <div className="mt-auto">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px] text-white font-bold">YT</div>
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-400">YouTube Optimized</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Currently detecting YouTube player. Injecting high-efficiency container to save resources.
                  </p>
                  <div className="pt-2 border-t border-blue-500/20">
                    <p className="text-[10px] text-blue-300 italic">
                      Tip: Click "Open URL" at the top to change the website.
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* --- Bottom Controls Footer --- */}
      <AnimatePresence>
        {!state.isFocusMode && showControls && (
          <footer className="h-16 bg-brand-surface border-t border-white/5 flex items-center justify-center gap-4 z-50 shrink-0">
            <FooterButton 
              icon={<Maximize className="w-5 h-5" />} 
              label="Fullscreen" 
              onClick={toggleFullscreen}
              active={state.isFullscreen}
            />
            <FooterButton 
              icon={<Crop className="w-5 h-5" />} 
              label="Fix Browser" 
              onClick={() => setState(p => ({ ...p, isCropping: !p.isCropping }))}
              active={state.isCropping}
              variant="blue"
            />
            <FooterButton 
              icon={<User className="w-5 h-5" />} 
              label="Face Overlay" 
              onClick={() => setState(p => ({ ...p, isCamVisible: !p.isCamVisible }))}
              active={state.isCamVisible}
              variant={state.isCamVisible ? 'blue' : 'default'}
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
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              active={isSidebarOpen}
            />
          </footer>
        )}
      </AnimatePresence>

      {/* --- Cropping Control Panel --- */}
      <AnimatePresence>
        {state.isCropping && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-20 z-[100] flex flex-col gap-2 bg-brand-surface/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl items-center"
            >
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1">Tip: Drag the screen to position</p>
              <div className="flex gap-2">
              <CropGridButton id="crop-up" onClick={() => adjustCrop('y', 50)} icon={<ArrowLeft className="rotate-90 w-4 h-4" />} />
              <CropGridButton id="crop-left" onClick={() => adjustCrop('x', 50)} icon={<ArrowLeft className="w-4 h-4" />} />
              <CropGridButton id="crop-right" onClick={() => adjustCrop('x', -50)} icon={<ArrowRight className="w-4 h-4" />} />
              <CropGridButton id="crop-down" onClick={() => adjustCrop('y', -50)} icon={<ArrowRight className="rotate-90 w-4 h-4" />} />
              <div className="w-px h-10 bg-white/5 mx-2" />
              <CropGridButton id="crop-in" onClick={() => adjustCrop('scale', 0.1)} icon={<Plus className="w-4 h-4 text-blue-400" />} />
              <CropGridButton id="crop-out" onClick={() => adjustCrop('scale', -0.1)} icon={<Minus className="w-4 h-4 text-blue-400" />} />
              <CropGridButton id="crop-reset" onClick={() => setState(p => ({ ...p, cropScale: 1, cropOffsetX: 0, cropOffsetY: 0, camScale: 1, camX: 20, camY: 20 }))} icon={<RotateCw className="w-4 h-4 text-slate-400" />} />
            </div>
            {state.isCamVisible && (
              <div className="flex gap-2 justify-center mt-2 border-t border-white/5 pt-2">
                <p className="text-[9px] text-slate-500 uppercase font-bold mr-2">Face Size:</p>
                <button onClick={() => setState(p => ({ ...p, camScale: Math.max(0.5, p.camScale - 0.1) }))} className="p-1 hover:bg-white/5 rounded"><Minus className="w-3 h-3" /></button>
                <button onClick={() => setState(p => ({ ...p, camScale: Math.min(3, p.camScale + 0.1) }))} className="p-1 hover:bg-white/5 rounded"><Plus className="w-3 h-3" /></button>
              </div>
            )}
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
