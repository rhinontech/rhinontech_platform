import React, { useEffect, useRef, useState } from 'react';
import CloudWave from './CloudWave';
import './Voice.scss';

// New imports from restructured modules
import type { VoiceScreenProps } from '@/types';
import { getVoiceSessionToken } from '@/services/voice';
import {
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeOff,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

const Voice: React.FC<VoiceScreenProps> = ({ appId, onButtonClick, isAdmin }) => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [loading, setLoading] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // 🔥 Added
  const initializedRef = useRef(false);

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0',
  };

  const badgeBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: 500,
    fontSize: '14px',
  };

  const statusConfig: Record<
    string,
    { icon: JSX.Element; text: string; style: React.CSSProperties }
  > = {
    Connected: {
      icon: <Wifi size={16} color='#4CAF50' />,
      text: 'Connected',
      style: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
    },
    'Connection failed': {
      icon: <WifiOff size={16} color='#F44336' />,
      text: 'Connection Failed',
      style: { backgroundColor: '#FFEBEE', color: '#C62828' },
    },
    Connecting: {
      icon: <Loader2 size={16} color='#FFC107' className='spin' />,
      text: 'Connecting...',
      style: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
    },
    default: {
      icon: <Loader2 size={16} color='#FFC107' className='spin' />,
      text: 'Connecting...',
      style: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
    },
  };

  //Cleanup function (safe to call multiple times)
  const cleanup = () => {
    try {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        }
        remoteAudioRef.current = null;
      }
      setConnectionStatus('Disconnected');
      setLoading(false);
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  //Initialize once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initRealTimeSession();
    }

    return () => cleanup();
  }, []);

  //Stop mic if user switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) cleanup();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  //Stop mic if page is closed or refreshed
  useEffect(() => {
    const handleUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Stop mic on navigation (SPA route changes)

  useEffect(() => {
    const handlePopState = () => {
      cleanup();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Initialize WebRTC real-time session
  const initRealTimeSession = async () => {
    if (isAdmin) return;
    try {
      cleanup(); // close any old connection

      const { client_secret } = await getVoiceSessionToken(appId);
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Local mic stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = localStream;
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      // Remote audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      document.body.appendChild(audioEl); // 🔥 Attach to maximize compatibility
      remoteAudioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch((e) => console.error('Autoplay failed:', e));
        setLoading(false);
      };

      // Data channel
      const dataChannel = pc.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => setConnectionStatus('Connected');
      dataChannel.onclose = () => setConnectionStatus('Disconnected');
      dataChannel.onerror = (err) => console.error('DataChannel Error:', err);

      dataChannel.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type.includes('input_audio_buffer') ||
            payload.type.includes('output_audio_buffer.stopped')
          ) {
            setLoading(true);
          } else if (payload.type.includes('output_audio_buffer.started')) {
            setLoading(false);
          }
        } catch (err) {
          console.error('Message parsing error:', err);
        }
      };

      // Offer/Answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
        },
      );

      const answerSDP = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

      setConnectionStatus('Connected');
    } catch (err) {
      console.error('Voice session failed:', err);
      cleanup();
      setConnectionStatus('Connection failed');
    }
  };
  const handleClose = () => {
    cleanup();
    onButtonClick();
  };
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      setIsMuted((prevMuted) => {
        const newMuted = !prevMuted;
        localStreamRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted; // disable mic if muted
        });
        return newMuted;
      });
    }
  };
  const { icon, text, style } =
    statusConfig[connectionStatus] || statusConfig.default;

  return (
    <div className='voice-container'>
      {/* <h3
        className='voice-status'
        style={{
          width: '100%',
          fontSize: 14,
          fontWeight: 500,
          color: connectionStatus === 'Connected' ? '#4CAF50' : '#FF5722',
          background: '#f1f1f1',
          padding: '10px 20px',
          margin: 0,
        }}
      >
        Status: {connectionStatus}
      </h3> */}
      {/* <h3
        style={{
          textAlign: 'center',
          fontSize: 42,
          margin: '40px 0 20px 0',
          display:'flex',
          gap:"10px"
        }}
      >
        Talk to 
        <img
          src='https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/rhinonbot2.png'
          alt='artical-img'
          width={50}
          style={{ borderRadius: '8px', marginTop:'-10px'  }}
        />
      </h3> */}
      <div style={baseStyle}>
        <div style={{ ...badgeBase, ...style }}>
          {icon}
          <span>{text}</span>
        </div>
      </div>
      <CloudWave isListening={loading} />
      <div
        style={{
          display: 'flex',
          marginTop: '70px',
          justifyContent: 'center',
          gap: '100px',
        }}
      >
        <button className='voice-btn' onClick={handleToggleMute}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isMuted ? '#e02f2f' : '#f1f1f1',
              color: isMuted ? 'white' : 'black',
              border: 'none',
              padding: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </div>
          <p style={{ padding: '4px 0 0 0', margin: 0 }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </p>
        </button>
        <button
          onClick={handleClose}
          className='voice-btn'
          disabled={
            connectionStatus !== 'Connected' &&
            connectionStatus !== 'Connection failed'
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                connectionStatus !== 'Connected' &&
                connectionStatus !== 'Connection failed'
                  ? '#ae2525'
                  : '#e02f2f',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
          </div>
          <p style={{ padding: '4px 0 0 0', margin: 0 }}>Leave</p>
        </button>
      </div>
    </div>
  );
};

export default Voice;
