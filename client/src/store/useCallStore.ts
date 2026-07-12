import { create } from 'zustand';
import { sendWSMessage } from '../hooks/useWebSocket';
import { toast } from 'sonner';
import { apiClient } from '../lib/api';

// Programmatic Audio Synthesizer for Call Tones
class CallSoundManager {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private activeOscillators: OscillatorNode[] = [];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playDialTone() {
    this.stop();
    this.init();
    if (!this.ctx) return;

    const playPulse = () => {
      if (!this.ctx) return;
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        osc1.type = 'sine';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();

        this.activeOscillators.push(osc1, osc2);

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
          this.activeOscillators = this.activeOscillators.filter(o => o !== osc1 && o !== osc2);
        }, 2100);
      } catch (e) {
        console.error('Error playing dial tone', e);
      }
    };

    playPulse();
    this.intervalId = setInterval(playPulse, 4000);
  }

  playRingTone() {
    this.stop();
    this.init();
    if (!this.ctx) return;

    const playRing = () => {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.value = 453;
        osc2.frequency.value = 680;
        osc1.type = 'sine';
        osc2.type = 'sine';

        // Pulse the ring tone: on for 0.8s, off for 0.4s, on for 0.8s, off for 1.5s
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.8);
        gain.gain.linearRampToValueAtTime(0, now + 0.9);

        gain.gain.setValueAtTime(0, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.25);
        gain.gain.setValueAtTime(0.12, now + 2.05);
        gain.gain.linearRampToValueAtTime(0, now + 2.15);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();

        this.activeOscillators.push(osc1, osc2);

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
          this.activeOscillators = this.activeOscillators.filter(o => o !== osc1 && o !== osc2);
        }, 2300);
      } catch (e) {
        console.error('Error playing ring tone', e);
      }
    };

    playRing();
    this.intervalId = setInterval(playRing, 3500);
  }

  playEndTone() {
    this.stop();
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.activeOscillators.push(osc);

      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
      }, 500);
    } catch (e) {
      console.error('Error playing end tone', e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    this.activeOscillators = [];
  }
}

const getIceServers = (): RTCIceServer[] => {
  const envIce = import.meta.env.VITE_ICE_SERVERS;
  if (envIce) {
    try {
      return JSON.parse(envIce);
    } catch (e) {
      console.warn('Failed to parse VITE_ICE_SERVERS environment variable, using default STUN:', e);
    }
  }
  return [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
};

const getUserMediaWithFallback = async (constraints: { audio: boolean; video: boolean }) => {
  // Check if we're in a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    throw new Error('SECURE_CONTEXT_REQUIRED');
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('SECURE_CONTEXT_REQUIRED');
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err: any) {
    // If video + audio was requested, fall back to audio-only if webcam fails (NotFoundError/NotReadableError)
    if (constraints.video && constraints.audio) {
      console.warn('Video device acquisition failed, attempting audio-only fallback:', err);
      toast.info('No camera detected, falling back to audio call');
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (audioErr) {
        throw audioErr;
      }
    }
    throw err;
  }
};

const soundManager = new CallSoundManager();

// Module-level WebRTC objects (avoids Zustand React proxy re-render bottlenecks)
let peerConnection: RTCPeerConnection | null = null;
let localMediaStream: MediaStream | null = null;
let callTimeoutId: any = null;
let candidateQueue: RTCIceCandidateInit[] = [];

interface PeerInfo {
  id: string;
  name: string;
  photoUrl: string | null;
}

interface CallState {
  callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callType: 'audio' | 'video';
  callId: string | null;
  peerInfo: PeerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  errorMessage: string | null;
  direction: 'incoming' | 'outgoing' | null;
  callLogs: any[];
  fetchCallLogs: () => Promise<void>;

  initiateCall: (roomId: string, recipient: PeerInfo, type: 'audio' | 'video') => Promise<void>;
  handleCallInitiated: (data: { callId: string }) => void;
  handleCallRinging: (data: { callId: string }) => void;
  handleIncomingCall: (data: { callId: string; callerId: string; callerName: string; callerPhotoUrl: string | null; type: 'audio' | 'video'; roomId: string }) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  cancelCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  handleCallAccepted: (data: { callId: string; calleeId: string }) => Promise<void>;
  handleCallRejected: (data: { callId: string; reason?: string }) => void;
  handleCallCancelled: (data: { callId: string }) => void;
  handleCallHungup: (data: { callId: string }) => void;
  handleWebRTCSignal: (data: { callId: string; senderId: string; signal: any }) => Promise<void>;
  cleanupCallState: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  callState: 'idle',
  callType: 'audio',
  callId: null,
  peerInfo: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  errorMessage: null,
  direction: null,
  callLogs: [],

  fetchCallLogs: async () => {
    try {
      const logs = await apiClient.get<any[]>('chat/call-logs');
      set({ callLogs: logs });
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
    }
  },

  initiateCall: async (roomId, recipient, type) => {
    if (get().callState !== 'idle') return;

    set({
      callState: 'calling',
      callType: type,
      peerInfo: recipient,
      direction: 'outgoing',
      errorMessage: null,
      isMuted: false,
      isCameraOff: false,
    });

    soundManager.playDialTone();

    try {
      // 1. Get local stream with device fallback support
      const constraints = {
        audio: true,
        video: type === 'video',
      };
      const stream = await getUserMediaWithFallback(constraints);
      localMediaStream = stream;

      // Determine final type (if camera fallback occurred, update to audio)
      const actualType = stream.getVideoTracks().length > 0 ? type : 'audio';
      set({ localStream: stream, callType: actualType });

      // 2. Send WebSocket message
      const success = sendWSMessage('call:initiate', { roomId, type: actualType });
      if (!success) {
        throw new Error('WebSocket connection unavailable');
      }

      // 3. Set ring timeout (30 seconds)
      callTimeoutId = setTimeout(() => {
        toast.warning('No response from user');
        get().cancelCall();
      }, 30000);

    } catch (err: any) {
      console.error('Failed to get media access or initiate call:', err);
      let errMsg = 'Failed to access microphone or camera';
      
      if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        errMsg = 'Camera/Microphone features are only available via HTTPS or localhost. Please access the app from localhost or use HTTPS.';
      } else if (err.name === 'NotAllowedError') {
        errMsg = 'Microphone/Camera permission denied. Please enable permission in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No audio input device (microphone) found.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Microphone or camera is already in use by another application.';
      }
      
      toast.error(errMsg);
      get().cleanupCallState();
    }
  },

  handleCallInitiated: (data) => {
    set({ callId: data.callId });
  },

  handleCallRinging: (data) => {
    const { callId, callState } = get();
    if (callId === data.callId && callState === 'calling') {
      set({ callState: 'ringing' });
    }
  },

  handleIncomingCall: (data) => {
    // If already in a call, automatically decline incoming call (send busy signal)
    if (get().callState !== 'idle') {
      sendWSMessage('call:reject', { callId: data.callId, targetUserId: data.callerId, reason: 'busy' });
      return;
    }

    set({
      callState: 'ringing',
      callId: data.callId,
      callType: data.type,
      peerInfo: {
        id: data.callerId,
        name: data.callerName,
        photoUrl: data.callerPhotoUrl,
      },
      direction: 'incoming',
      errorMessage: null,
      isMuted: false,
      isCameraOff: false,
    });

    sendWSMessage('call:ringing', { callId: data.callId, targetUserId: data.callerId });
    soundManager.playRingTone();
  },

  acceptCall: async () => {
    const { callId, peerInfo, callType } = get();
    if (!callId || !peerInfo) return;

    soundManager.stop();

    try {
      const constraints = {
        audio: true,
        video: callType === 'video',
      };
      const stream = await getUserMediaWithFallback(constraints);
      localMediaStream = stream;

      const actualType = stream.getVideoTracks().length > 0 ? callType : 'audio';
      set({ localStream: stream, callType: actualType, callState: 'connected' });

      sendWSMessage('call:accept', { callId, targetUserId: peerInfo.id });

    } catch (err: any) {
      console.error('Failed to get media stream for accepting call:', err);
      let errMsg = 'Permission denied to access media devices.';
      
      if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        errMsg = 'Camera/Microphone features are only available via HTTPS or localhost. Please access the app from localhost or use HTTPS.';
      } else if (err.name === 'NotAllowedError') {
        errMsg = 'Microphone/Camera permission denied. Please enable permission in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No audio input device (microphone) found.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Microphone or camera is already in use by another application.';
      }

      toast.error(errMsg);
      sendWSMessage('call:reject', { callId, targetUserId: peerInfo.id });
      get().cleanupCallState();
    }
  },

  rejectCall: () => {
    const { callId, peerInfo } = get();
    if (callId && peerInfo) {
      sendWSMessage('call:reject', { callId, targetUserId: peerInfo.id, reason: 'declined' });
    }
    soundManager.stop();
    get().cleanupCallState();
  },

  cancelCall: () => {
    const { callId, peerInfo } = get();
    if (callId && peerInfo) {
      sendWSMessage('call:cancel', { callId, targetUserId: peerInfo.id });
    }
    soundManager.stop();
    get().cleanupCallState();
  },

  hangUp: () => {
    const { callId, peerInfo } = get();
    if (callId && peerInfo) {
      sendWSMessage('call:hangup', { callId, targetUserId: peerInfo.id });
    }
    soundManager.stop();
    soundManager.playEndTone();
    get().cleanupCallState();
  },

  toggleMute: () => {
    if (localMediaStream) {
      const audioTrack = localMediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({ isMuted: !audioTrack.enabled });
      }
    }
  },

  toggleCamera: () => {
    if (localMediaStream && get().callType === 'video') {
      const videoTrack = localMediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({ isCameraOff: !videoTrack.enabled });
      }
    }
  },

  handleCallAccepted: async (data) => {
    const { peerInfo, localStream, callState } = get();
    
    if (callState === 'ringing') {
      soundManager.stop();
      get().cleanupCallState();
      return;
    }

    if (!peerInfo || !localStream) return;

    if (callTimeoutId) {
      clearTimeout(callTimeoutId);
      callTimeoutId = null;
    }

    soundManager.stop();
    set({ callState: 'connected', callId: data.callId });

    // Initiate WebRTC Connection
    try {
      peerConnection = new RTCPeerConnection({
        iceServers: getIceServers(),
      });

      localStream.getTracks().forEach((track) => {
        if (peerConnection && localStream) {
          peerConnection.addTrack(track, localStream);
        }
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && peerConnection) {
          sendWSMessage('webrtc:signal', {
            callId: data.callId,
            targetUserId: peerInfo.id,
            signal: { candidate: event.candidate },
          });
        }
      };

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendWSMessage('webrtc:signal', {
        callId: data.callId,
        targetUserId: peerInfo.id,
        signal: { offer },
      });

    } catch (err) {
      console.error('Failed to set up caller RTCPeerConnection:', err);
      toast.error('Failed to establish media connection.');
      get().hangUp();
    }
  },

  handleCallRejected: (data) => {
    soundManager.stop();
    soundManager.playEndTone();
    
    const state = get().callState;
    if (state === 'calling' || state === 'connected') {
      if (data && data.reason === 'offline') {
        toast.error('User is offline');
      } else if (data && data.reason === 'busy') {
        toast.error('User is busy');
      } else {
        toast.error('Call declined');
      }
    }
    
    get().cleanupCallState();
  },

  handleCallCancelled: (_data) => {
    soundManager.stop();
    soundManager.playEndTone();
    toast.info('Call cancelled');
    get().cleanupCallState();
  },

  handleCallHungup: (_data) => {
    soundManager.stop();
    soundManager.playEndTone();
    toast.info('Call ended');
    get().cleanupCallState();
  },

  handleWebRTCSignal: async (data) => {
    const { peerInfo, localStream } = get();
    if (!peerInfo) return;

    try {
      const { offer, answer, candidate } = data.signal;

      if (offer) {
        // Callee initializes RTCPeerConnection upon receiving the offer from caller
        peerConnection = new RTCPeerConnection({
          iceServers: getIceServers(),
        });

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            if (peerConnection && localStream) {
              peerConnection.addTrack(track, localStream);
            }
          });
        }

        peerConnection.onicecandidate = (event) => {
          if (event.candidate && peerConnection) {
            sendWSMessage('webrtc:signal', {
              callId: data.callId,
              targetUserId: peerInfo.id,
              signal: { candidate: event.candidate },
            });
          }
        };

        peerConnection.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            set({ remoteStream: event.streams[0] });
          }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any buffered candidates received before remote description was set
        for (const cand of candidateQueue) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        }
        candidateQueue = [];

        const ans = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(ans);

        sendWSMessage('webrtc:signal', {
          callId: data.callId,
          targetUserId: peerInfo.id,
          signal: { answer: ans },
        });
      } 
      
      else if (answer) {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

          // Flush any buffered candidates
          for (const cand of candidateQueue) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
          }
          candidateQueue = [];
        }
      } 
      
      else if (candidate) {
        if (peerConnection && peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          candidateQueue.push(candidate);
        }
      }

    } catch (err) {
      console.error('Error handling WebRTC signaling:', err);
    }
  },

  cleanupCallState: () => {
    if (callTimeoutId) {
      clearTimeout(callTimeoutId);
      callTimeoutId = null;
    }

    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => track.stop());
      localMediaStream = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    candidateQueue = [];

    set({
      callState: 'idle',
      callId: null,
      peerInfo: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      errorMessage: null,
      direction: null,
    });

    get().fetchCallLogs();
  },
}));
