/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameWorld, WorldSettings, WorldDifficulty, UserAccount } from '../types/game';
import { createDefaultWorld } from '../systems/account';
import { 
  Globe2, 
  Plus, 
  Play, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Cloud, 
  Clock, 
  ChevronRight, 
  Sliders, 
  Lock 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface WorldSelectModalProps {
  worlds: GameWorld[];
  activeUser: UserAccount | null;
  onEnterWorld: (world: GameWorld) => void;
  onCreateWorld: (name: string, settings: WorldSettings) => void;
  onDeleteWorld: (worldId: string) => void;
  onOpenAuth: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  worlds,
  activeUser,
  onEnterWorld,
  onCreateWorld,
  onDeleteWorld,
  onOpenAuth,
}) => {
  const [view, setView] = useState<'list' | 'create'>('list');

  // Create World Form States
  const [worldName, setWorldName] = useState('New Realm of Sol');
  const [difficulty, setDifficulty] = useState<WorldDifficulty>('standard');
  const [biomeSeed, setBiomeSeed] = useState('aetheria-seed-77');
  const [dayNightSpeed, setDayNightSpeed] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [economyScale, setEconomyScale] = useState<'abundant' | 'balanced' | 'scarce'>('balanced');
  const [hostileSpawns, setHostileSpawns] = useState(true);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldName.trim()) return;

    soundEngine.playLevelUp();
    onCreateWorld(worldName.trim(), {
      difficulty,
      biomeSeed,
      dayNightSpeed,
      economyScale,
      hostileSpawns,
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-10 select-none overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      {/* Top Header with User Profile and Cloud Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
              AETHERIA // REALM SELECTOR
            </h1>
            <div className="text-xs text-slate-400 font-mono">
              PROJECT OMEGA V2 • SELECT WORLD TO ENTER
            </div>
          </div>
        </div>

        {/* User Account Pill */}
        <button
          onClick={() => {
            soundEngine.playUiClick();
            onOpenAuth();
          }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all cursor-pointer shadow-lg"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
            style={{ backgroundColor: activeUser?.avatarColor || '#38bdf8' }}
          >
            {activeUser ? activeUser.username[0].toUpperCase() : <User className="w-3.5 h-3.5 text-slate-950" />}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-none">
              {activeUser ? activeUser.username : 'Guest Mode (Local)'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <Cloud className="w-3 h-3 text-sky-400" />
              <span>{activeUser ? 'Cloud Sync Active' : 'Sign In to Backup'}</span>
            </div>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-6 max-w-4xl w-full mx-auto">
        {view === 'list' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">SAVED REALMS & WORLDS</h2>
                <div className="text-xs text-slate-400">
                  Select an active expedition or build a custom procedural world
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setView('create');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New World</span>
              </button>
            </div>

            {/* Worlds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {worlds.map((world) => {
                const isHardcore = world.settings.difficulty === 'hardcore';
                return (
                  <div
                    key={world.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-xl group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                          {world.name}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                            isHardcore
                              ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                              : 'bg-sky-950/80 border-sky-500 text-sky-300'
                          }`}
                        >
                          {world.settings.difficulty}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-mono space-y-1">
                        <div>Level {world.playerStats?.level || 1} Champion • {world.wallet?.gold || 0} Gold</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last Played: {new Date(world.lastPlayed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      {worlds.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete world "${world.name}"? This cannot be undone.`)) {
                              soundEngine.playUiClick();
                              onDeleteWorld(world.id);
                            }
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete World"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          soundEngine.playLevelUp();
                          onEnterWorld(world);
                        }}
                        className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Enter World</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Create New World Form */
          <form
            onSubmit={handleCreateSubmit}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-2xl max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Sliders className="w-5 h-5 text-sky-400" />
                <span>CUSTOMIZE NEW REALM</span>
              </div>
              <button
                type="button"
                onClick={() => setView('list')}
                className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Back to Saved Realms
              </button>
            </div>

            {/* World Name */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                World Name
              </label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-sky-400"
                placeholder="e.g. Kingdom of Sol"
              />
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Game Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'peaceful', label: 'Peaceful', desc: 'No hunger drain, low combat threat' },
                  { id: 'standard', label: 'Standard RPG', desc: 'Balanced survival & enemies' },
                  { id: 'hardcore', label: 'Hardcore', desc: 'Higher damage & fast survival drain' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as WorldDifficulty)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Biome Seed & Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Procedural Terrain Seed
                </label>
                <input
                  type="text"
                  value={biomeSeed}
                  onChange={(e) => setBiomeSeed(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Day / Night Speed
                </label>
                <select
                  value={dayNightSpeed}
                  onChange={(e) => setDayNightSpeed(e.target.value as unknown as typeof dayNightSpeed)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="slow">Slow (12 Real Minutes)</option>
                  <option value="standard">Standard (6 Real Minutes)</option>
                  <option value="fast">Fast (3 Real Minutes)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                Generate & Enter Open World
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Control Hint Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500">
        <div>Aetheria Engine 2.4 • Dynamic World Generation • 60 FPS Engine</div>
        <div className="text-sky-400">Minecraft-Style Mobile Joystick Controls Supported</div>
      </div>
    </div>
  );
};
