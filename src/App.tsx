/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize, 
  Minimize,
  Lock, 
  Unlock, 
  Settings, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Crop,
  Wifi,
  Layout,
  Plus,
  Minus,
  X,
  Monitor,
  Eye,
  EyeOff,
  Youtube,
  Sparkles
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
  webZoom: number;
  isAspectLocked: boolean;
  rotation: number;
  canvasBg: string;
  isStreamVisible: boolean;
}

const DEFAULT_TABS: Tab[] = [
  { id: '1', url: '', title: 'Cricket Score', icon: '🏏' },
];

const LOCAL_STORAGE_KEY = 'layout_studio_state_v3';

/**
 * Converts YouTube urls to their embed equivalents so they format perfectly in the iframe.
 * Support types:
 * - Direct watch links: www.youtube.com/watch?v=VIDEO_ID
 * - Shortened links: youtu.be/VIDEO_ID
 * - YouTube Shorts links: youtube.com/shorts/VIDEO_ID
 * - YouTube Live links: youtube.com/live/VIDEO_ID
 * - Channel live stream links: youtube.com/embed/live_stream?channel=CHANNEL_ID
 */
function getEmbedUrl(url: string): string {
  if (!url) return '';
  let target = url.trim();
  
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  try {
    const urlObj = new URL(target);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId = '';

      if (hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.split('/')[1];
      } else if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1].split('/')[0];
      } else if (urlObj.pathname.includes('/live/')) {
        videoId = urlObj.pathname.split('/live/')[1].split('/')[0];
      } else if (urlObj.pathname.includes('/embed/')) {
        return target;
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1&playsinline=1&controls=1`;
        
        const tVal = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
        if (tVal) {
          const seconds = parseInt(tVal);
          if (!isNaN(seconds)) {
            embedUrl += `&start=${seconds}`;
          }
        }
        return embedUrl;
      }
    }
  } catch (e) {
    console.error('Failed to parse URL for YouTube conversion:', e);
  }

  return target;
}

export default function App() {
  // --- State ---
  const [urlInput, setUrlInput] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const activeTab = parsed.tabs?.find((t: any) => t.id === parsed.activeTabId) || parsed.tabs?.[0];
        if (activeTab?.url) {
          return activeTab.url;
        }
      }
    } catch (e) {
      console.error('Error reading urlInput from localStorage:', e);
    }
    return '';
  });

  const [state, setState] = useState<StreamState>(() => {
    const defaultState: StreamState = {
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
      canvasBg: '#0A0B0D',
      isStreamVisible: true,
    };

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          isSplashed: true, // Always show splash on fresh reload/mount
          isFullscreen: false, // Don't persist fullscreen state for predictable behavior
        };
      }
    } catch (e) {
      console.error('Error parsing StreamState from localStorage:', e);
    }

    return defaultState;
  });

  const [speed, setSpeed] = useState<string>('10.0');
  const [showUrlBar, setShowUrlBar] = useState(false);
  const [modalTab, setModalTab] = useState<'regular' | 'youtube'>('regular');
  const [ytChannelInput, setYtChannelInput] = useState('');

  const toggleFullscreen = () => {
    setState(p => ({ ...p, isFullscreen: !p.isFullscreen }));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          toggleFullscreen();
          break;
        case 'l':
          setState(p => ({ ...p, isLocked: !p.isLocked }));
          break;
        case 'c':
          if (!state.isLocked) {
            setState(p => ({ ...p, isCropping: !p.isCropping }));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isLocked, toggleFullscreen]);

  // Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(p => ({ ...p, isSplashed: false }));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Persist state to localStorage on change
  useEffect(() => {
    try {
      const stateToPersist = {
        activeTabId: state.activeTabId,
        tabs: state.tabs,
        isLocked: state.isLocked,
        isFocusMode: state.isFocusMode,
        isLowData: state.isLowData,
        isLowRam: state.isLowRam,
        cropScale: state.cropScale,
        cropOffsetX: state.cropOffsetX,
        cropOffsetY: state.cropOffsetY,
        isCropping: state.isCropping,
        webZoom: state.webZoom,
        isAspectLocked: state.isAspectLocked,
        rotation: state.rotation,
        canvasBg: state.canvasBg,
        isStreamVisible: state.isStreamVisible,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.error('Error writing StreamState to localStorage:', e);
    }
  }, [state]);

  // Handlers
  const handleNav = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!urlInput) return;
    let targetUrl = urlInput.trim();
    if (!targetUrl.startsWith('http') && !targetUrl.includes('://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    // Convert YouTube URL into embed link
    const finalUrl = getEmbedUrl(targetUrl);
    
    setState(prev => ({ 
      ...prev, 
      tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, url: finalUrl } : t)
    }));
    setUrlInput(finalUrl);
    setShowUrlBar(false);
  };

  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!state.isCropping || state.isLocked) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX - state.cropOffsetX, y: clientY - state.cropOffsetY };
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
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 font-mono">CORE_STABLE_V3</p>
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
                {state.isStreamVisible && activeTab.url ? (
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
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0e12]/80 backdrop-blur-md text-slate-400 p-8 relative overflow-hidden">
                    {/* Elegant Dashboard BG lines */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
                    
                    <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
                        <Monitor className="w-8 h-8 text-emerald-400/80 animate-pulse" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Live Screen Off</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2 max-w-xs leading-relaxed font-sans">
                        Live website stream is turned off or no URL loaded. Click 'Set Live Link' to paste any link or configure overlay.
                      </p>
                      
                      <div className="mt-5 flex flex-wrap gap-2 justify-center">
                        <button 
                          onClick={() => !state.isLocked && setShowUrlBar(true)}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Set Live Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
  


          {/* Custom Photo Overlay (Broadcaster Identity) removed */}
  
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

      {/* --- Controls Footer (The Main Buttons) --- */}
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

              {/* Minimalist Unified Control Actions Grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button 
                  type="button"
                  onClick={reloadIframe}
                  className="py-3 px-1 hover:border-white/10 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95"
                  title="Reload Live stream iframe"
                >
                  <RotateCw className="w-4 h-4 text-blue-400" />
                  Reload
                </button>
                <button 
                  type="button"
                  onClick={() => setState(p => ({ ...p, isStreamVisible: !p.isStreamVisible }))}
                  className={`py-3 px-1 border rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                    state.isStreamVisible 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300' 
                      : 'bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  }`}
                  title="Toggle Stream visibility"
                >
                  {state.isStreamVisible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hidden
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setState(p => ({ 
                    ...p, 
                    cropScale: 1, 
                    cropOffsetX: 0, 
                    cropOffsetY: 0, 
                    webZoom: 1,
                    isAspectLocked: false,
                    rotation: 0
                  }))}
                  className="py-3 px-1 hover:border-white/10 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95"
                  title="Reset Crop, zoom, and orientation transforms"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Reset View
                </button>
              </div>

              {/* Sleek Modal Tab Swapper */}
              <div className="flex bg-black/40 p-1 rounded-xl mb-5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setModalTab('regular')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    modalTab === 'regular' 
                      ? 'bg-white/10 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌐 Regular / Web Link
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('youtube')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    modalTab === 'youtube' 
                      ? 'bg-red-500/15 text-red-400 border border-red-500/10 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 YouTube Live
                </button>
              </div>

              {modalTab === 'regular' ? (
                <form onSubmit={handleNav} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Stream URL</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-blue-500/40"
                        placeholder="Enter website, live score, or YT link..."
                        autoFocus
                      />
                      {(urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/20" title="YouTube stream detected: auto-converting to live embed player!">
                          <Youtube className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1.5 block leading-normal font-mono">
                      💡 YouTube links auto-convert into full live window modes!
                    </span>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    Apply & Load Live Link
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">YouTube Channel ID / URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={ytChannelInput}
                        onChange={(e) => setYtChannelInput(e.target.value)}
                        placeholder="Enter Channel ID (e.g. UC3XTzVzaHQEd30rGs0Lco8g)"
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-red-500/40"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!ytChannelInput.trim()) return;
                          
                          let processedId = ytChannelInput.trim();
                          
                          // Convert channel page URL format to absolute Channel ID if they pasted a link
                          if (processedId.includes('youtube.com/channel/')) {
                            processedId = processedId.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
                          } else if (processedId.startsWith('UC') === false && processedId.includes('/')) {
                            // Try parsing if pasted some other path
                            const parts = processedId.split('/');
                            const lastPart = parts[parts.length - 1];
                            if (lastPart.startsWith('UC')) {
                              processedId = lastPart;
                            }
                          }
                          
                          const liveUrl = `https://www.youtube.com/embed/live_stream?channel=${processedId}&autoplay=1&mute=1`;
                          setUrlInput(liveUrl);
                          setState(prev => ({ 
                            ...prev, 
                            tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, url: liveUrl } : t)
                          }));
                          setShowUrlBar(false);
                        }}
                        className="py-3 px-4 bg-red-650 hover:bg-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 duration-200 whitespace-nowrap"
                      >
                        Connect Stream
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5 space-y-2 text-slate-400 text-[10px] leading-relaxed">
                    <div className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>Requirements / Kya aur chahiye?</span>
                    </div>
                    
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Continuous active stream ke liye aapko channel ki <strong className="text-red-400">Channel ID</strong> deni hogi (starts with <code className="bg-white/5 px-1 py-0.5 rounded text-white font-mono">UC...</code>).
                    </p>

                    <div className="space-y-1 pt-1.5 text-[9px] border-t border-white/5">
                      <span className="font-bold text-slate-300 block">🔍 Channel ID kaise nikalein?</span>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Apne favorite channel ke live video par jaayein.</li>
                        <li>Unke channel link ya handle name par click karke channel profile page kholein.</li>
                        <li>Wahan key <strong className="text-white">"Share" ➔ "Copy channel ID"</strong> par click karein.</li>
                        <li>Ya direct online free platforms (jaise <code className="text-white font-mono">commentpicker.com</code>) par channel name daalkar click karein!</li>
                      </ol>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span>✨ <strong>Wahi kyu?:</strong> Channel-id continuous streams ko stream change hone par link expire hone se bachati hai!</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {/* Canvas Theme */}
                <div className="border-t border-white/5 pt-6 text-center">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Studio Theme</p>
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
                         type="button"
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

              <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
                <button onClick={() => setState(p => ({ ...p, webZoom: Math.min(3, parseFloat((p.webZoom + 0.01).toFixed(2))) }))} className="tool-btn">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </button>

                <div className="hidden sm:flex h-32 items-center justify-center py-2">
                  <input 
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.01"
                    value={state.webZoom}
                    onChange={(e) => setState(p => ({ ...p, webZoom: parseFloat(e.target.value) }))}
                    className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 -rotate-90"
                  />
                </div>

                <div className="flex flex-col items-center py-1 min-w-[44px]">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    max="3"
                    value={parseFloat(state.webZoom.toFixed(2))} 
                    onChange={(e) => setState(p => ({ ...p, webZoom: Math.max(0.1, Math.min(3, parseFloat(e.target.value) || 1)) }))}
                    className="w-10 sm:w-12 bg-white/10 border border-white/20 rounded px-1 py-1 text-[10px] sm:text-[8px] text-emerald-400 font-mono text-center focus:border-emerald-500/50 outline-none"
                  />
                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Mag</span>
                </div>

                <button onClick={() => setState(p => ({ ...p, webZoom: Math.max(0.1, parseFloat((p.webZoom - 0.01).toFixed(2))) }))} className="tool-btn">
                  <Minus className="w-4 h-4 text-emerald-400" />
                </button>
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
