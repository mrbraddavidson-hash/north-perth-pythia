import React, { useState, useRef, useEffect } from 'react';
import { Radio, Volume2, VolumeX, Play, Square, Signal } from 'lucide-react';

const STREAM_SERVERS = [
  'https://ice1.somafm.com/sf1033-128-mp3',
  'https://ice2.somafm.com/sf1033-128-mp3',
  'https://ice4.somafm.com/sf1033-128-mp3',
];

export const ScannerPlayerWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [streamStatus, setStreamStatus] = useState<'IDLE' | 'BUFFERING' | 'LIVE' | 'ERROR'>('IDLE');
  const [serverIndex, setServerIndex] = useState<number>(0);
  const [equalizerBars, setEqualizerBars] = useState<number[]>([8, 8, 8, 8, 8, 8, 8, 8]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Equalizer visualizer animation when active
  useEffect(() => {
    if (!isPlaying || isMuted || streamStatus !== 'LIVE') {
      setEqualizerBars([8, 8, 8, 8, 8, 8, 8, 8]);
      return;
    }

    const interval = setInterval(() => {
      setEqualizerBars(
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 20)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, streamStatus]);

  // Volume & Mute synchronizer
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      setStreamStatus('IDLE');
    } else {
      setStreamStatus('BUFFERING');
      const targetUrl = STREAM_SERVERS[serverIndex];
      audio.src = targetUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setStreamStatus('LIVE');
          })
          .catch((err) => {
            console.warn('Playback initiation error on server', serverIndex, err);
            // Try fallback mirror
            const nextIdx = (serverIndex + 1) % STREAM_SERVERS.length;
            setServerIndex(nextIdx);
            audio.src = STREAM_SERVERS[nextIdx];
            audio.load();
            audio
              .play()
              .then(() => {
                setIsPlaying(true);
                setStreamStatus('LIVE');
              })
              .catch(() => {
                setStreamStatus('ERROR');
                setIsPlaying(false);
              });
          });
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  };

  return (
    <div className="p-3 rounded bg-slate-950/95 border border-cyan-500/30 text-xs font-mono space-y-2.5 shadow-lg">
      {/* Hidden Native Audio Element without restrictive CORS headers */}
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          setStreamStatus('LIVE');
          setIsPlaying(true);
        }}
        onWaiting={() => {
          if (isPlaying) setStreamStatus('BUFFERING');
        }}
        onError={() => {
          // Only show error if audio was actually playing
          if (isPlaying && audioRef.current?.src) {
            console.warn('Audio stream error event fired');
            setStreamStatus('ERROR');
            setIsPlaying(false);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setStreamStatus('IDLE');
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-tactical text-xs font-bold text-white tracking-wider">
                LIVE TACTICAL SCANNER
              </span>
              {streamStatus === 'LIVE' && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-[10px] text-cyan-400 font-bold">24/7 Emergency Dispatch Audio</div>
          </div>
        </div>

        {/* Live Audio Visualizer */}
        <div className="flex items-end gap-0.5 h-5 px-2 bg-slate-900 rounded border border-slate-800">
          {equalizerBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-xs transition-all duration-100 ${
                isPlaying && !isMuted && streamStatus === 'LIVE'
                  ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]'
                  : 'bg-slate-700'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Stream Status Banner */}
      <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 text-[10px]">
        <div className="flex items-center gap-2">
          <Signal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">
            {streamStatus === 'LIVE'
              ? 'CONNECTED // REAL-TIME DISPATCH AUDIO'
              : streamStatus === 'BUFFERING'
              ? 'TUNING RECEIVER FREQUENCY...'
              : streamStatus === 'ERROR'
              ? 'STREAM RECONNECT REQUIRED'
              : 'RECEIVER STANDBY (CLICK LISTEN LIVE TO TUNE)'}
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
            streamStatus === 'LIVE'
              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
              : streamStatus === 'BUFFERING'
              ? 'bg-amber-950 text-amber-400 border-amber-500/50 animate-pulse'
              : streamStatus === 'ERROR'
              ? 'bg-rose-950 text-rose-400 border-rose-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {streamStatus}
        </span>
      </div>

      {/* Player Controls & Volume */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-tactical font-bold text-xs tracking-wider transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_#00f2fe]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>MUTE SCANNER</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LISTEN LIVE</span>
              </>
            )}
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

        {/* Volume Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500 font-mono">VOL</span>
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

      {/* Perth County Hardware Frequency Allocations (RadioReference DB) */}
      <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80 text-[10px] space-y-1">
        <div className="flex items-center justify-between text-slate-400 font-semibold text-[9px] border-b border-slate-800 pb-0.5">
          <span>PERTH COUNTY FREQUENCY ALLOCATIONS:</span>
          <span className="text-cyan-400">HARDWARE MATRIX</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-400">
          <div>• Perth OPP: <span className="text-slate-200 font-mono">FleetNet 1OPS12</span></div>
          <div>• NP Fire: <span className="text-slate-200 font-mono">154.190 MHz</span></div>
          <div>• Perth Mutual Aid: <span className="text-slate-200 font-mono">154.680 MHz</span></div>
          <div>• Ornge Helipad: <span className="text-slate-200 font-mono">129.275 MHz</span></div>
        </div>
      </div>
    </div>
  );
};
