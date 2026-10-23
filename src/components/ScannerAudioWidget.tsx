import React, { useState, useEffect } from 'react';
import { Radio, Volume2, VolumeX, Play, Square, ExternalLink, Zap } from 'lucide-react';
import { scannerEngine } from '../services/scannerAudio';

interface ScannerChannel {
  id: string;
  name: string;
  freq: string;
  agency: string;
  status: 'ACTIVE' | 'STANDBY';
}

const CHANNELS: ScannerChannel[] = [
  {
    id: 'opp-perth',
    name: 'Perth County OPP Dispatch',
    freq: '142.770 MHz',
    agency: 'Ontario Provincial Police',
    status: 'ACTIVE',
  },
  {
    id: 'np-fire',
    name: 'North Perth Fire (Listowel / Atwood)',
    freq: '154.190 MHz',
    agency: 'Fire Services',
    status: 'STANDBY',
  },
  {
    id: 'perth-ems',
    name: 'Perth County Paramedic Services',
    freq: '150.100 MHz',
    agency: 'EMS Dispatch',
    status: 'ACTIVE',
  },
  {
    id: 'ornge-air',
    name: 'Ornge Air Ambulance (Helipad Ops)',
    freq: '129.275 MHz',
    agency: 'Air Medevac',
    status: 'ACTIVE',
  },
];

export const ScannerAudioWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [currentChannel, setCurrentChannel] = useState<ScannerChannel>(CHANNELS[0]);
  const [equalizerBars, setEqualizerBars] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10]);
  const [activeTransmission, setActiveTransmission] = useState<string | null>(null);

  // Bind scanner audio transmission events
  useEffect(() => {
    scannerEngine.setTransmissionCallback((transmitting, text) => {
      if (transmitting) {
        setActiveTransmission(text);
      } else {
        setActiveTransmission(null);
      }
    });

    return () => {
      scannerEngine.stop();
    };
  }, []);

  // Equalizer visualizer animation synced with active transmission or carrier
  useEffect(() => {
    if (!isPlaying || isMuted) {
      setEqualizerBars([8, 8, 8, 8, 8, 8, 8, 8]);
      return;
    }

    const interval = setInterval(() => {
      if (activeTransmission) {
        // High amplitude during active voice transmission
        setEqualizerBars(
          Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 20)
        );
      } else {
        // Subtle carrier hum
        setEqualizerBars(
          Array.from({ length: 8 }, () => Math.floor(Math.random() * 15) + 10)
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, activeTransmission]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      scannerEngine.stop();
      setIsPlaying(false);
      setActiveTransmission(null);
    } else {
      scannerEngine.setChannel(currentChannel.id);
      scannerEngine.setVolume(volume);
      scannerEngine.setMuted(isMuted);
      scannerEngine.start();
      setIsPlaying(true);
    }
  };

  const handleSelectChannel = (ch: ScannerChannel) => {
    setCurrentChannel(ch);
    scannerEngine.setChannel(ch.id);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    scannerEngine.setMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    scannerEngine.setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
      scannerEngine.setMuted(false);
    }
  };

  const handleManualTransmit = () => {
    if (!isPlaying) {
      scannerEngine.setChannel(currentChannel.id);
      scannerEngine.setVolume(volume);
      scannerEngine.setMuted(false);
      setIsMuted(false);
      scannerEngine.start();
      setIsPlaying(true);
    }
    scannerEngine.triggerRandomTransmission();
  };

  return (
    <div className="p-3 rounded bg-slate-950/90 border border-cyan-500/30 text-xs font-mono space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-tactical text-xs font-bold text-white tracking-wider">
                PERTH RADIO SCANNER
              </span>
              {isPlaying && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-cyan-400 font-bold">{currentChannel.freq}</div>
          </div>
        </div>

        {/* Live Audio Visualizer */}
        <div className="flex items-end gap-0.5 h-5 px-2 bg-slate-900 rounded border border-slate-800">
          {equalizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-xs transition-all duration-100 ${
                isPlaying && !isMuted
                  ? activeTransmission
                    ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]'
                    : 'bg-cyan-600/60'
                  : 'bg-slate-700'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Active Transmission Ticker */}
      {isPlaying && (
        <div
          className={`p-2 rounded text-[10px] transition-all border ${
            activeTransmission
              ? 'bg-cyan-950/70 border-cyan-400/80 text-cyan-200 animate-pulse'
              : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-[9px] uppercase tracking-wider mb-0.5">
            <span className={activeTransmission ? 'text-cyan-400' : 'text-slate-500'}>
              {activeTransmission ? '● TRANSMITTING RX' : '○ CARRIER STANDBY'}
            </span>
            <span className="text-[9px] text-slate-500">{currentChannel.agency}</span>
          </div>
          <div className="truncate font-mono">
            {activeTransmission || 'Monitoring frequency floor for dispatch traffic...'}
          </div>
        </div>
      )}

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 gap-1.5">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleSelectChannel(ch)}
            className={`px-2 py-1.5 rounded text-left border text-[10px] transition-all cursor-pointer ${
              currentChannel.id === ch.id
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="truncate font-semibold">{ch.name.split('(')[0]}</div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
              <span>{ch.freq}</span>
              <span className={ch.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-600'}>
                {ch.status}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Play Controls & Volume */}
      <div className="space-y-2 pt-1 border-t border-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_10px_#00f2fe]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>LISTEN LIVE</span>
                </>
              )}
            </button>

            <button
              onClick={handleManualTransmit}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold cursor-pointer"
              title="Test audio key-up immediately"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>TEST CALL</span>
            </button>

            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded border cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] pt-1">
          <span className="text-[9px] text-slate-500 font-mono">
            VHF Squelch: Auto-Gated
          </span>
          <a
            href="https://www.broadcastify.com/listen/ctid/4311"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
          >
            <span>Perth Broadcastify Feed</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
