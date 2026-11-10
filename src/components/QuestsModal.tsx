/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quest } from '../types/game';
import { 
  X, 
  Compass, 
  Award, 
  Coins, 
  Gem, 
  Crown, 
  CheckCircle, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface QuestsModalProps {
  quests: Quest[];
  onClaimReward: (questId: string) => void;
  onClose: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  quests,
  onClaimReward,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = quests.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">EXPEDITIONS & QUEST LOG</h2>
              <div className="text-xs text-slate-400 font-mono">
                Bounties, storyline missions & realm achievements
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950 font-mono text-xs">
          {[
            { id: 'all', label: `All Missions (${quests.length})` },
            { id: 'active', label: `Active (${quests.filter((q) => q.status === 'active' || q.status === 'available').length})` },
            { id: 'completed', label: `Completed (${quests.filter((q) => q.status === 'completed').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playUiClick();
                setFilter(tab.id as unknown as typeof filter);
              }}
              className={`pb-3 px-3 uppercase font-bold tracking-wider border-b-2 transition-all cursor-pointer ${
                filter === tab.id
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quests List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
              No quests found under this category.
            </div>
          ) : (
            filtered.map((quest) => {
              const isCompleted = quest.status === 'completed';
              const isReadyToClaim = !isCompleted && quest.currentCount >= quest.targetCount;
              const progressPct = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-75'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{quest.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-amber-300 uppercase">
                          {quest.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Patron: {quest.giverNpcName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic mb-2">
                      "{quest.description}"
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">{quest.objectiveText}</span>
                        <span className="text-amber-300 font-bold tabular-nums">
                          {quest.currentCount} / {quest.targetCount} ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            progressPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rewards Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400 font-bold">Rewards:</span>
                      <span className="text-sky-300 font-bold">+{quest.rewards.xp} XP</span>
                      <div className="flex items-center gap-1 text-amber-300 font-bold">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>+{quest.rewards.gold}</span>
                      </div>
                      {quest.rewards.rareTokens && (
                        <div className="flex items-center gap-1 text-rose-300 font-bold">
                          <Crown className="w-3.5 h-3.5 text-rose-400" />
                          <span>+{quest.rewards.rareTokens}</span>
                        </div>
                      )}
                      {quest.rewards.diamonds && (
                        <div className="flex items-center gap-1 text-sky-300 font-bold">
                          <Gem className="w-3.5 h-3.5 text-sky-400" />
                          <span>+{quest.rewards.diamonds}</span>
                        </div>
                      )}
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    ) : isReadyToClaim ? (
                      <button
                        onClick={() => {
                          soundEngine.playLevelUp();
                          onClaimReward(quest.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md animate-pulse cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Claim Reward</span>
                      </button>
                    ) : (
                      <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
