import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Wind, Bell } from 'lucide-react';

export default function FocusAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundType, setSoundType] = useState('rain'); // 'rain', 'whitenoise'
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  const startAudio = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === 'rain') {
        // Brown noise approximation for gentle rainfall
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      } else {
        // Pink / soft noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          output[i] = (b0 + b1 + b2 + b3 + white * 0.5362) * 0.11;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.15; // Soft background volume

      whiteNoise.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(0);

      noiseNodeRef.current = whiteNoise;
      gainNodeRef.current = gain;
      setIsPlaying(true);
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  };

  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio(soundType);
    }
  };

  const changeType = (newType) => {
    setSoundType(newType);
    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(newType), 50);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={toggleSound}
        className={`btn ${isPlaying ? 'btn-emerald' : 'btn-secondary'}`}
        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
        title={isPlaying ? "Mute Focus Sound" : "Play Ambient Focus Audio"}
      >
        {isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
        <span>{isPlaying ? 'Focus Audio ON' : 'Ambient Audio'}</span>
      </button>

      {isPlaying && (
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '14px', padding: '2px 4px' }}>
          <button
            onClick={() => changeType('rain')}
            style={{
              background: soundType === 'rain' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
              border: 'none',
              color: soundType === 'rain' ? '#A5B4FC' : '#94A3B8',
              padding: '4px 8px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CloudRain size={12} /> Rain
          </button>
          <button
            onClick={() => changeType('whitenoise')}
            style={{
              background: soundType === 'whitenoise' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
              border: 'none',
              color: soundType === 'whitenoise' ? '#A5B4FC' : '#94A3B8',
              padding: '4px 8px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Wind size={12} /> Soft Noise
          </button>
        </div>
      )}
    </div>
  );
}
