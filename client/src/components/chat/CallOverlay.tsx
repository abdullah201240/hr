import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Monitor } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function CallOverlay() {
  const {
    callState,
    callType,
    peerInfo,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isSpeaker,
    direction,
    connectionQuality,
    isScreenSharing,
    screenStream,
    acceptCall,
    rejectCall,
    cancelCall,
    hangUp,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    toggleScreenShare,
  } = useCallStore();

  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);

  const localVideoRef = (el: HTMLVideoElement | null) => {
    localVideoElRef.current = el;
    const activeStream = isScreenSharing ? screenStream : localStream;
    if (el && activeStream && callType === 'video') {
      el.srcObject = activeStream;
      el.play().catch(e => console.warn("Local video play failed:", e));
    }
  };

  const remoteVideoRef = (el: HTMLVideoElement | null) => {
    remoteVideoElRef.current = el;
    if (el && remoteStream && callType === 'video') {
      el.srcObject = remoteStream;
      el.play().catch(e => console.warn("Remote video play failed:", e));
    }
  };

  const remoteAudioRef = (el: HTMLAudioElement | null) => {
    remoteAudioElRef.current = el;
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch(e => console.warn("Remote audio play failed:", e));
    }
  };
  
  const [duration, setDuration] = useState(0);

  // Call duration counter (only count when WebRTC connection is active)
  useEffect(() => {
    if (callState !== 'connected' || connectionQuality !== 'excellent') {
      // Pause at 0 until connection is established
      return;
    }

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, connectionQuality]);

  // Re-bind when streams update after initial mount
  useEffect(() => {
    if (localVideoElRef.current && callType === 'video') {
      localVideoElRef.current.srcObject = isScreenSharing ? screenStream : localStream;
    }
  }, [localStream, screenStream, isScreenSharing, callType]);

  useEffect(() => {
    if (callState === 'connected' && remoteStream) {
      if (remoteAudioElRef.current) {
        remoteAudioElRef.current.srcObject = remoteStream;
        remoteAudioElRef.current.play().catch(e => console.warn("Remote audio play failed on stream update:", e));
      }
      if (callType === 'video' && remoteVideoElRef.current) {
        remoteVideoElRef.current.srcObject = remoteStream;
        remoteVideoElRef.current.play().catch(e => console.warn("Remote video play failed on stream update:", e));
      }
    }
  }, [remoteStream, callType, callState]);

  // Apply speaker/volume settings to remote audio/video elements
  useEffect(() => {
    const volume = isSpeaker ? 1.0 : 0.2;
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.volume = volume;
    }
    if (remoteVideoElRef.current) {
      remoteVideoElRef.current.volume = volume;
    }

    // Try setSinkId if supported to switch to speaker/earpiece output
    const applyAudioOutput = async () => {
      const element = remoteAudioElRef.current || remoteVideoElRef.current;
      if (!element || !('setSinkId' in element)) return;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        const targetDevice = audioOutputs.find(device => {
          const label = device.label.toLowerCase();
          return isSpeaker
            ? label.includes('speaker') || label.includes('loud')
            : label.includes('earpiece') || label.includes('receiver') || label.includes('phone');
        });

        if (targetDevice) {
          await (element as any).setSinkId(targetDevice.deviceId);
        }
      } catch (err) {
        console.warn('Failed to switch audio output device:', err);
      }
    };

    applyAudioOutput();
  }, [isSpeaker, remoteStream, callState, callType]);

  // Keyboard Shortcuts (M: mute, V: camera toggle, Escape: hang up)
  useEffect(() => {
    if (callState === 'idle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (key === 'v') {
        e.preventDefault();
        toggleCamera();
      } else if (key === 'escape') {
        e.preventDefault();
        if (callState === 'connected') {
          hangUp();
        } else if (direction === 'incoming') {
          rejectCall();
        } else {
          cancelCall();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState, direction, toggleMute, toggleCamera, hangUp, rejectCall, cancelCall]);

  if (callState === 'idle') return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderQualityIcon = (quality: typeof connectionQuality) => {
    const activeColor = 
      quality === 'excellent' ? 'fill-emerald-500' :
      quality === 'poor' ? 'fill-amber-500' :
      quality === 'disconnected' ? 'fill-rose-500 animate-pulse' :
      'fill-cyan-500 animate-pulse';

    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <rect x="3" y="14" width="3" height="6" rx="0.5" className={quality ? activeColor : 'fill-zinc-600'} />
        <rect x="8" y="10" width="3" height="10" rx="0.5" className={(quality === 'excellent' || quality === 'poor') ? activeColor : 'fill-zinc-600'} />
        <rect x="13" y="6" width="3" height="14" rx="0.5" className={(quality === 'excellent') ? activeColor : 'fill-zinc-600'} />
        <rect x="18" y="2" width="3" height="18" rx="0.5" className={(quality === 'excellent') ? activeColor : 'fill-zinc-600'} />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md transition-all duration-300">
      
      {/* ─── RINGING / CALLING PANEL ─── */}
      {(callState === 'calling' || callState === 'ringing') && (
        <div className="flex flex-col items-center max-w-sm w-full p-8 mx-4 rounded-3xl border border-border/20 bg-card/60 shadow-2xl text-center backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative mb-6">
            {/* Pulsing visual circles */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping scale-150 opacity-40" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-125" />
            <Avatar className="h-24 w-24 border-4 border-background relative z-10 shadow-lg">
              <AvatarImage src={peerInfo?.photoUrl || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {peerInfo?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-1">{peerInfo?.name}</h3>
          <p className="text-xs text-muted-foreground mb-8 capitalize font-medium tracking-wide">
            {direction === 'outgoing'
              ? (callState === 'calling' ? `Calling (${callType} call)...` : `Ringing...`)
              : `Incoming ${callType} call...`}
          </p>

          {/* Controls Toolbar during Calling/Ringing */}
          <div className="flex items-center gap-4 mb-8 justify-center">
            {/* Toggle Mic */}
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-foreground transition-colors ${
                isMuted ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-secondary/65 hover:bg-secondary/80'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Toggle Camera (upgrade/toggle) */}
            <Button
              onClick={toggleCamera}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-foreground transition-colors ${
                (callType === 'audio' || isCameraOff) ? 'bg-secondary/65 hover:bg-secondary/80 text-muted-foreground' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {(callType === 'audio' || isCameraOff) ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            {/* Toggle Speaker */}
            <Button
              onClick={toggleSpeaker}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full transition-colors ${
                !isSpeaker ? 'bg-secondary/40 text-muted-foreground' : 'bg-primary/20 text-primary dark:text-primary-foreground border border-primary/30'
              }`}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6">
            {direction === 'incoming' ? (
              <>
                {/* Accept Call Button */}
                <Button
                  onClick={acceptCall}
                  size="icon"
                  className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
                >
                  {callType === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                </Button>
                {/* Reject Call Button */}
                <Button
                  onClick={rejectCall}
                  variant="destructive"
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            ) : (
              /* Cancel Call Button (Caller) */
              <Button
                onClick={cancelCall}
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── CONNECTED / CALL ACTIVE PANEL ─── */}
      {callState === 'connected' && (
        <div className="relative w-full h-full md:max-w-4xl md:h-[650px] md:rounded-3xl border border-border/20 bg-black overflow-hidden md:shadow-2xl flex flex-col justify-between">
          
          {/* Audio Elements */}
          <audio ref={remoteAudioRef} autoPlay className="hidden" />

          {/* Video Feeds */}
          {callType === 'video' ? (
            <div className="absolute inset-0 w-full h-full bg-zinc-950">
              {/* Remote Stream (Full Size) */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Avatar className="h-20 w-20 mb-3 border border-zinc-800">
                    <AvatarImage src={peerInfo?.photoUrl || undefined} />
                    <AvatarFallback className="text-xl font-semibold bg-zinc-900 text-zinc-400">
                      {peerInfo?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">Connecting camera feed...</span>
                </div>
              )}

              {/* Local Stream (PIP) */}
              <div className="absolute top-4 right-4 z-10 w-28 h-36 md:w-36 md:h-48 rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-md">
                {(isScreenSharing ? screenStream : localStream) && (!isCameraOff || isScreenSharing) ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    <VideoOff className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audio Call Centered Display */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-900/60">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse scale-150 duration-1000" />
                <Avatar className="h-28 w-28 border-4 border-zinc-800/40 relative z-10 shadow-xl">
                  <AvatarImage src={peerInfo?.photoUrl || undefined} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                    {peerInfo?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{peerInfo?.name}</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 justify-center">
                <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Voice Call connected</span>
              </p>
            </div>
          )}

          {/* Header Panel (Controls overlays like Timer & Call Details) */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-black/40 backdrop-blur-md p-3 px-4 rounded-xl border border-white/5 pointer-events-none">
            <span className="text-white text-xs font-medium pointer-events-auto capitalize">{callType} Call</span>

            {/* Connection Quality */}
            <div className="pointer-events-auto flex items-center gap-1.5 bg-black/35 px-2.5 py-1 rounded-full border border-white/5">
              {renderQualityIcon(connectionQuality || 'connecting')}
              <span className={`text-[10px] font-bold ${
                connectionQuality === 'excellent' ? 'text-emerald-400' :
                connectionQuality === 'poor' ? 'text-amber-400' :
                connectionQuality === 'disconnected' ? 'text-rose-400' :
                'text-cyan-400'
              }`}>
                {connectionQuality === 'excellent' && 'Excellent'}
                {connectionQuality === 'poor' && 'Poor'}
                {connectionQuality === 'disconnected' && 'Reconnecting...'}
                {(connectionQuality === 'connecting' || !connectionQuality) && 'Connecting...'}
              </span>
            </div>

            <span className="text-primary text-xs font-bold font-mono tracking-widest pointer-events-auto bg-primary/10 px-2.5 py-0.5 rounded-full">{formatDuration(duration)}</span>
          </div>

          {/* Controls Bar at bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-black/55 backdrop-blur-md border border-white/10 p-3 rounded-full shadow-2xl">
            {/* Toggle Mic */}
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-white ${
                isMuted ? 'bg-amber-500/80 hover:bg-amber-500' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Toggle Video (always available to upgrade to video or toggle) */}
            <Button
              onClick={toggleCamera}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-white ${
                (callType === 'audio' || isCameraOff) ? 'bg-white/10 hover:bg-white/20 text-zinc-400' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {(callType === 'audio' || isCameraOff) ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            {/* Toggle Screen Share */}
            <Button
              onClick={toggleScreenShare}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-white ${
                isScreenSharing ? 'bg-[#00a884] hover:bg-[#008f72]' : 'bg-white/10 hover:bg-white/20 text-zinc-400'
              }`}
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            {/* Toggle Speaker */}
            <Button
              onClick={toggleSpeaker}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full text-white ${
                !isSpeaker ? 'bg-white/10 hover:bg-white/20 text-zinc-400' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <Volume2 className="h-5 w-5" />
            </Button>

            {/* Hangup Button */}
            <Button
              onClick={hangUp}
              variant="destructive"
              size="icon"
              className="h-11 w-11 rounded-full hover:scale-105 active:scale-95 transition-all duration-150"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
