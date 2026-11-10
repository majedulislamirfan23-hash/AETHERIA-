/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats, PlayerAttributes } from '../types/game';
import { 
  X, 
  User, 
  Shield, 
  Sword, 
  Sparkles, 
  Flame, 
  Heart, 
  Plus, 
  Award, 
  Zap, 
  Apple, 
  Droplet 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface CharacterModalProps {
  playerStats: PlayerStats;
  onAllocateStat: (attribute: keyof PlayerAttributes) => void;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  playerStats,
  onAllocateStat,
  onClose,
}) => {
  const { attributes, statPoints } = playerStats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl h-[85vh] max-h-[750px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">CHARACTER ATTRIBUTES & PROGRESSION</h2>
              <div className="text-xs text-slate-400 font-mono">
                Level {playerStats.level} Champion of the Citadel
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-y-auto">
          {/* ================= LEFT: ATTRIBUTE ALLOCATION ================= */}
          <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Core Attributes
              </div>
              <div className="text-xs font-mono font-bold text-amber-300">
                Available Points: {statPoints}
              </div>
            </div>

            {/* Strength */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-amber-400">STRENGTH (STR)</div>
                <div className="text-[11px] text-slate-400 font-mono">+Physical Weapon Attack & Carry Weight</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white w-6 text-center">{attributes.strength}</span>
                {statPoints > 0 && (
                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onAllocateStat('strength');
                    }}
                    className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Agility */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-emerald-400">AGILITY (AGI)</div>
                <div className="text-[11px] text-slate-400 font-mono">+Attack Speed, Movement & Critical Chance</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white w-6 text-center">{attributes.agility}</span>
                {statPoints > 0 && (
                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onAllocateStat('agility');
                    }}
                    className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Intelligence */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-purple-400">INTELLIGENCE (INT)</div>
                <div className="text-[11px] text-slate-400 font-mono">+Max Mana & Magitech/Spell Damage</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white w-6 text-center">{attributes.intelligence}</span>
                {statPoints > 0 && (
                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onAllocateStat('intelligence');
                    }}
                    className="w-7 h-7 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Vitality */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-rose-400">VITALITY (VIT)</div>
                <div className="text-[11px] text-slate-400 font-mono">+Max Health & Defense Resistance</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white w-6 text-center">{attributes.vitality}</span>
                {statPoints > 0 && (
                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onAllocateStat('vitality');
                    }}
                    className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT: COMBAT & SURVIVAL RATINGS ================= */}
          <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-2">
              Combat & Survival Metrics
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Max Health:
                </span>
                <span className="text-white font-bold">{playerStats.maxHealth}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Max Mana:
                </span>
                <span className="text-white font-bold">{playerStats.maxMana}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> Max Stamina:
                </span>
                <span className="text-white font-bold">{playerStats.maxStamina}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-amber-400" /> Base Attack:
                </span>
                <span className="text-white font-bold">
                  {playerStats.baseAttack + attributes.strength * 3}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> Base Defense:
                </span>
                <span className="text-white font-bold">
                  {playerStats.baseDefense + attributes.vitality * 2}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Critical Chance:
                </span>
                <span className="text-white font-bold">
                  {(5 + attributes.agility * 0.8).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Set Bonus Note */}
            <div className="mt-auto p-3 rounded-lg bg-sky-950/40 border border-sky-500/30 text-xs font-mono">
              <div className="text-sky-300 font-bold flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>CITADEL GUARDIAN SET (ACTIVE)</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Equip 3 or more Citadel Vanguard pieces to receive +15% damage deflection and 20% reduced sprint stamina drain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
