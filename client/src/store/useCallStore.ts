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
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
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

  const servers: RTCIceServer[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.services.mozilla.com',
        'stun:stun.xten.com',
        'stun:stun.l.google.com:19305'
      ]
    }
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnPass = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl) {
    // Extract domain host cleanly (e.g. turn:openrelay.metered.ca:443 -> openrelay.metered.ca)
    const parts = turnUrl.split(':');
    let host = parts[1] || '';
    host = host.replace(/^\/\//, '');
    const cleanHost = host.split('?')[0];

    const protocol = turnUrl.startsWith('turns:') ? 'turns' : 'turn';

    servers.push({
      urls: [
        turnUrl,
        `${protocol}:${cleanHost}:80`,
        `${protocol}:${cleanHost}:443`,
        `${protocol}:${cleanHost}:443?transport=tcp`
      ],
      username: turnUser || undefined,
      credential: turnPass || undefined,
    });
  } else {
    // Provide a default public TURN server from Metered OpenRelay to ensure traversal on cellular networks/NATs
    servers.push({
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    });
  }

  return servers;
};

const fetchMeteredIceServers = async (): Promise<RTCIceServer[] | null> => {
  const domain = import.meta.env.VITE_METERED_DOMAIN;
  const apiKey = import.meta.env.VITE_METERED_API_KEY;
  if (!domain || !apiKey) return null;
  
  try {
    const response = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log("Successfully fetched dynamic Metered ICE servers:", data.length);
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch Metered TURN servers, using default config:", e);
  }
  return null;
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
let screenMediaStream: MediaStream | null = null;
let callTimeoutId: any = null;
let iceTimeoutId: any = null;
let candidateQueue: RTCIceCandidateInit[] = [];

interface PeerInfo {
  id: string;
  name: string;
  photoUrl: string | null;
}

const setupPeerConnectionListeners = (
  pc: RTCPeerConnection,
  callId: string,
  peerId: string,
  set: any,
  get: any
) => {
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendWSMessage('webrtc:signal', {
        callId,
        targetUserId: peerId,
        signal: { candidate: event.candidate },
      });
    }
  };

  pc.ontrack = (event) => {
    let stream = get().remoteStream;
    if (!stream) {
      stream = new MediaStream();
    }
    
    const exists = stream.getTracks().some((t: MediaStreamTrack) => t.id === event.track.id);
    if (!exists) {
      stream.addTrack(event.track);
      const updatedStream = new MediaStream(stream.getTracks());
      set({ remoteStream: updatedStream });
    }

    if (event.track.kind === 'video' && get().callType === 'audio') {
      set({ callType: 'video' });
    }
  };

  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    console.log("ICE Connection State changed:", state);
    
    let quality: 'connecting' | 'excellent' | 'poor' | 'disconnected' = 'connecting';
    if (state === 'connected' || state === 'completed') {
      quality = 'excellent';
      if (iceTimeoutId) {
        clearTimeout(iceTimeoutId);
        iceTimeoutId = null;
      }
    } else if (state === 'disconnected') {
      quality = 'poor';
    } else if (state === 'failed') {
      quality = 'disconnected';
    } else if (state === 'checking') {
      quality = 'connecting';
    }
    
    set({ connectionQuality: quality });

    // Auto ICE Restart if peer connection detects disconnection
    if (state === 'disconnected') {
      console.log("Attempting ICE Restart...");
      pc.createOffer({ iceRestart: true })
        .then(async (offer) => {
          await pc.setLocalDescription(offer);
          sendWSMessage('webrtc:signal', {
            callId,
            targetUserId: peerId,
            signal: { offer },
          });
        })
        .catch((e) => console.warn("Failed to create ICE restart offer:", e));
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("Connection State changed:", pc.connectionState);
  };
};

interface CallState {
  callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callType: 'audio' | 'video';
  callId: string | null;
  peerInfo: PeerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaker: boolean;
  isScreenSharing: boolean;
  errorMessage: string | null;
  direction: 'incoming' | 'outgoing' | null;
  connectionQuality: 'connecting' | 'excellent' | 'poor' | 'disconnected' | null;
  callLogs: any[];
  iceServers: RTCIceServer[] | null;
  fetchCallLogs: () => Promise<void>;
  loadIceServers: () => Promise<void>;

  initiateCall: (roomId: string, recipient: PeerInfo, type: 'audio' | 'video') => Promise<void>;
  handleCallInitiated: (data: { callId: string }) => void;
  handleCallRinging: (data: { callId: string }) => void;
  handleIncomingCall: (data: { callId: string; callerId: string; callerName: string; callerPhotoUrl: string | null; type: 'audio' | 'video'; roomId: string }) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  cancelCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void | Promise<void>;
  toggleScreenShare: () => Promise<void>;
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
  screenStream: null,
  isMuted: false,
  isCameraOff: false,
  isSpeaker: true,
  isScreenSharing: false,
  errorMessage: null,
  direction: null,
  connectionQuality: null,
  callLogs: [],
  iceServers: null,

  loadIceServers: async () => {
    if (get().iceServers) return;
    const servers = await fetchMeteredIceServers();
    if (servers) {
      set({ iceServers: servers });
    }
  },

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

    get().loadIceServers();

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

      // Apply initial mute/camera states
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !get().isMuted;
      }
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !get().isCameraOff;
      }

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
      soundManager.playRingTone();
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

    get().loadIceServers();
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

      // Apply user pre-selected mute/camera choices
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !get().isMuted;
      }
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !get().isCameraOff;
      }

      const actualType = stream.getVideoTracks().length > 0 ? callType : 'audio';
      set({ localStream: stream, callType: actualType, callState: 'connected' });

      // Start ICE Connection watchdog timeout (callee)
      if (iceTimeoutId) clearTimeout(iceTimeoutId);
      iceTimeoutId = setTimeout(() => {
        const currentStore = get();
        if (currentStore.callState === 'connected' && currentStore.connectionQuality !== 'excellent') {
          console.warn("ICE connection timed out on callee side.");
          toast.error("Failed to connect media channel. Please check your firewall or configure a TURN server.");
          currentStore.hangUp();
        }
      }, 25000);

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
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    if (localMediaStream) {
      const audioTrack = localMediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMuted;
      }
    }
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeaker: !state.isSpeaker }));
  },

  toggleCamera: async () => {
    const { callType, callId, peerInfo, isCameraOff } = get();
    const nextCameraOff = !isCameraOff;
    
    if (callType === 'audio') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && localMediaStream) {
          localMediaStream.addTrack(videoTrack);
          set({ localStream: localMediaStream, callType: 'video', isCameraOff: false });
          
          if (peerConnection) {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            } else {
              peerConnection.addTrack(videoTrack, localMediaStream);
            }
            
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            if (callId && peerInfo) {
              sendWSMessage('webrtc:signal', {
                callId,
                targetUserId: peerInfo.id,
                signal: { offer },
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to open camera:', err);
        toast.error('Failed to open camera. Make sure camera is not in use.');
      }
    } else {
      set({ isCameraOff: nextCameraOff });
      if (localMediaStream) {
        const videoTrack = localMediaStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !nextCameraOff;
        }
      }
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, callState, callType } = get();
    if (callState !== 'connected') return;

    if (isScreenSharing) {
      // Stop screen sharing and revert to camera
      try {
        if (screenMediaStream) {
          screenMediaStream.getTracks().forEach(t => t.stop());
          screenMediaStream = null;
        }

        if (peerConnection && localMediaStream) {
          const cameraTrack = localMediaStream.getVideoTracks()[0];
          if (cameraTrack) {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(cameraTrack);
            }
            cameraTrack.enabled = !get().isCameraOff;
          }
        }
        
        set({ isScreenSharing: false, screenStream: null });
      } catch (err) {
        console.error("Failed to stop screen share:", err);
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenMediaStream = stream;
        const screenTrack = stream.getVideoTracks()[0];

        if (screenTrack) {
          screenTrack.onended = () => {
            get().toggleScreenShare();
          };

          if (peerConnection) {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(screenTrack);
            } else {
              peerConnection.addTrack(screenTrack, localMediaStream || new MediaStream([screenTrack]));
            }
          }

          if (localMediaStream) {
            const cameraTrack = localMediaStream.getVideoTracks()[0];
            if (cameraTrack) {
              cameraTrack.enabled = false;
            }
          }

          set({ isScreenSharing: true, screenStream: stream });

          if (callType === 'audio') {
            set({ callType: 'video' });
          }
        }
      } catch (err) {
        console.error("Failed to start screen share:", err);
        toast.error("Failed to start screen share.");
      }
    }
  },

  handleCallAccepted: async (data) => {
    const { peerInfo, localStream, callState, direction } = get();
    
    if (direction === 'incoming' && callState === 'ringing') {
      soundManager.stop();
      get().cleanupCallState();
      return;
    }

    if (direction === 'incoming') {
      // Callee does not initiate WebRTC connection, caller does.
      return;
    }

    if (!peerInfo || !localStream) return;

    if (callTimeoutId) {
      clearTimeout(callTimeoutId);
      callTimeoutId = null;
    }

    soundManager.stop();
    set({ callState: 'connected', callId: data.callId });

    // Start ICE Connection watchdog timeout (caller)
    if (iceTimeoutId) clearTimeout(iceTimeoutId);
    iceTimeoutId = setTimeout(() => {
      const currentStore = get();
      if (currentStore.callState === 'connected' && currentStore.connectionQuality !== 'excellent') {
        console.warn("ICE connection timed out on caller side.");
        toast.error("Failed to connect media channel. Please check your firewall or configure a TURN server.");
        currentStore.hangUp();
      }
    }, 25000);

    // Initiate WebRTC Connection
    try {
      peerConnection = new RTCPeerConnection({
        iceServers: get().iceServers || getIceServers(),
      });

      setupPeerConnectionListeners(peerConnection, data.callId, peerInfo.id, set, get);

      localStream.getTracks().forEach((track) => {
        if (peerConnection && localStream) {
          peerConnection.addTrack(track, localStream);
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendWSMessage('webrtc:signal', {
        callId: data.callId,
        targetUserId: peerInfo.id,
        signal: { offer },
      });

    } catch (err: any) {
      console.error('Failed to set up caller RTCPeerConnection:', err);
      toast.error(`Failed to establish media connection: ${err?.message || err}`);
      get().hangUp();
    }
  },

  handleCallRejected: (data) => {
    soundManager.stop();
    soundManager.playEndTone();
    
    const state = get().callState;
    if (state === 'calling' || state === 'ringing' || state === 'connected') {
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
        if (!peerConnection) {
          peerConnection = new RTCPeerConnection({
            iceServers: get().iceServers || getIceServers(),
          });

          setupPeerConnectionListeners(peerConnection, data.callId, peerInfo.id, set, get);
        }

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            if (peerConnection && localStream) {
              const senders = peerConnection.getSenders();
              const exists = senders.some(s => s.track && s.track.id === track.id);
              if (!exists) {
                peerConnection.addTrack(track, localStream);
              }
            }
          });
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any buffered candidates received before remote description was set
        for (const cand of candidateQueue) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Failed to add buffered ICE candidate:', e);
          }
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
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Failed to add buffered ICE candidate:', e);
            }
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

    } catch (err: any) {
      console.error('Error handling WebRTC signaling:', err);
      toast.error(`Signaling error: ${err?.message || err}`);
    }
  },

  cleanupCallState: () => {
    if (callTimeoutId) {
      clearTimeout(callTimeoutId);
      callTimeoutId = null;
    }

    if (iceTimeoutId) {
      clearTimeout(iceTimeoutId);
      iceTimeoutId = null;
    }

    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => track.stop());
      localMediaStream = null;
    }

    if (screenMediaStream) {
      screenMediaStream.getTracks().forEach((track) => track.stop());
      screenMediaStream = null;
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
      screenStream: null,
      isMuted: false,
      isCameraOff: false,
      isSpeaker: true,
      isScreenSharing: false,
      errorMessage: null,
      direction: null,
      connectionQuality: null,
      iceServers: null,
    });

    get().fetchCallLogs();
  },
}));
