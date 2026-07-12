import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react';
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
    acceptCall,
    rejectCall,
    cancelCall,
    hangUp,
    toggleMute,
    toggleCamera,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const [duration, setDuration] = useState(0);

  // Call duration counter
  useEffect(() => {
    if (callState !== 'connected') {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType, callState]);

  // Bind remote stream
  useEffect(() => {
    if (callState === 'connected' && remoteStream) {
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (callType === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType, callState]);

  if (callState === 'idle') return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
                {peerInfo?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-1">{peerInfo?.name}</h3>
          <p className="text-xs text-muted-foreground mb-8 capitalize">
            {callState === 'calling' ? `Calling (${callType} call)...` : `Incoming ${callType} call...`}
          </p>

          <div className="flex items-center justify-center gap-6">
            {callState === 'ringing' ? (
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
          {callType === 'audio' && (
            <audio ref={remoteAudioRef} autoPlay />
          )}

          {/* Video Feeds */}
          {callType === 'video' ? (
            <div className="absolute inset-0 w-full h-full bg-zinc-950">
              {/* Remote Stream (Full Size) */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Avatar className="h-20 w-20 mb-3 border border-zinc-800">
                    <AvatarImage src={peerInfo?.photoUrl || undefined} />
                    <AvatarFallback className="text-xl font-semibold bg-zinc-900 text-zinc-400">
                      {peerInfo?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">Connecting camera feed...</span>
                </div>
              )}

              {/* Local Stream (PIP) */}
              <div className="absolute top-4 right-4 z-10 w-28 h-36 md:w-36 md:h-48 rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-md">
                {localStream && !isCameraOff ? (
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
                    {peerInfo?.name.charAt(0).toUpperCase()}
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

            {/* Toggle Video (only in Video call) */}
            {callType === 'video' && (
              <Button
                onClick={toggleCamera}
                variant="ghost"
                size="icon"
                className={`h-11 w-11 rounded-full text-white ${
                  isCameraOff ? 'bg-amber-500/80 hover:bg-amber-500' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            )}

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
