import React, { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, VolumeX, Play, Square, Signal, ExternalLink } from 'lucide-react';

interface ScannerChannel {
  id: string;
  name: string;
  freq: string;
  agency: string;
  streamUrl?: string;
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
  const [currentChannel, setCurrentChannel] = useState<ScannerChannel>(CHANNELS[0]);
  const [equalizerBars, setEqualizerBars] = useState<number[]>([40, 65, 80, 50, 90, 70, 30, 85]);

  // Audio equalizer animation when active
  useEffect(() => {
    if (!isPlaying || isMuted) {
      setEqualizerBars([10, 10, 10, 10, 10, 10, 10, 10]);
      return;
    }
    const interval = setInterval(() => {
      setEqualizerBars(
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 85) + 15)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying, isMuted]);

  return (
    <div className="p-3 rounded bg-slate-950/90 border border-cyan-500/30 text-xs font-mono space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-tactical text-xs font-bold text-white tracking-wider">
              PERTH RADIO SCANNER
            </span>
            <div className="text-[10px] text-cyan-400 font-bold">{currentChannel.freq}</div>
          </div>
        </div>

        {/* Live Audio Visualizer */}
        <div className="flex items-end gap-0.5 h-5 px-2 bg-slate-900 rounded border border-slate-800">
          {equalizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-xs transition-all duration-100 ${
                isPlaying && !isMuted ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 gap-1.5">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setCurrentChannel(ch)}
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

      {/* Play Controls & External Link */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs transition-colors cursor-pointer ${
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
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <a
          href="https://www.broadcastify.com/listen/ctid/4311"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
        >
          <span>Broadcastify Feed</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
