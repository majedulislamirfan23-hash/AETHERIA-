/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraphicsPreset } from '../types/game';
import { Play, Sparkles, ShieldCheck, Gauge, Smartphone, RotateCcw } from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface TitleScreenProps {
  onStartGame: (preset: GraphicsPreset) => void;
  selectedPreset: GraphicsPreset;
  onSelectPreset: (preset: GraphicsPreset) => void;
  hasSavedGame: boolean;
  onResetSave: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  selectedPreset,
  onSelectPreset,
  hasSavedGame,
  onResetSave,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden bg-slate-950/75 backdrop-blur-sm">
      {/* Top Bar with Version and Optimization Badge */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
        <div className="flex items-center gap-2 tracking-widest font-mono">
          <span className="inline-block w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
          <span>PROJECT OMEGA V2.4 // PRODUCTION ENGINE</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-full text-sky-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>60 FPS ZERO-LAG OPTIMIZED</span>
        </div>
      </div>

      {/* Center Cinematic Title Lockup */}
      <div className="max-w-3xl my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs tracking-wider uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Living Open-World RPG & Civilization Simulation</span>
        </div>

        {/* Bespoke SVG Title Lockup */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
          <span className="bg-gradient-to-r from-sky-400 via-indigo-200 to-amber-300 bg-clip-text text-transparent">
            AETHERIA
          </span>
        </h1>
        <div className="text-lg sm:text-2xl font-light tracking-[0.3em] text-slate-300 uppercase mt-1 mb-4">
          Project Omega // Living Civilization
        </div>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mb-8">
          Step into a vast, responsive civilization. Trade in living markets, manage a multi-currency wallet, craft divine armaments, and explore an instanced 3D world built for uncompromising mobile and desktop performance.
        </p>

        {/* Preset Selector */}
        <div className="mb-8">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Target Hardware Profile:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-2xl">
            {(
              [
                { id: 'batterySaver', label: 'Battery Saver', sub: '30 FPS / Low Draw' },
                { id: 'low', label: 'Low', sub: '30 FPS / Sharp' },
                { id: 'balanced', label: 'Balanced', sub: '45-60 FPS' },
                { id: 'high', label: 'High', sub: '60 FPS / Soft Shadows' },
                { id: 'ultra', label: 'Ultra', sub: 'Max / Unlocked' },
              ] as const
            ).map((item) => {
              const active = selectedPreset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectPreset(item.id);
                  }}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    active
                      ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => {
              soundEngine.playLevelUp();
              onStartGame(selectedPreset);
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base tracking-wide shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{hasSavedGame ? 'CONTINUE EXPEDITION' : 'ENTER AETHERIA'}</span>
          </button>

          {hasSavedGame && (
            <button
              onClick={() => {
                if (window.confirm('Reset saved game progression and restart fresh?')) {
                  onResetSave();
                }
              }}
              className="flex items-center gap-2 px-4 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors text-xs font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Save</span>
            </button>
          )}

          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <span>Touch controls auto-enable on mobile</span>
          </div>
        </div>
      </div>

      {/* Flat Control Hints Bar */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">WASD</kbd> Move</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Space</kbd> Jump</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Shift</kbd> Sprint</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">F</kbd> Attack</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">E</kbd> Interact / Talk</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Tab</kbd> Inventory</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">C</kbd> Character</span>
        </div>
        <div className="text-slate-500">
          Aetheria Living Engine v2.4 • 60 FPS
        </div>
      </div>
    </div>
  );
};
