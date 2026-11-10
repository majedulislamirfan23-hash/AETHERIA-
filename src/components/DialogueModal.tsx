/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LivingNpc } from '../types/game';
import { FACTIONS } from '../data/civilization';
import { 
  X, 
  MessageSquare, 
  Store, 
  Heart, 
  Clock, 
  Compass, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface DialogueModalProps {
  npc: LivingNpc;
  onOpenShop?: (shopId: string) => void;
  onIncreaseTrust: (npcId: string, delta: number) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  onOpenShop,
  onIncreaseTrust,
  onClose,
}) => {
  const [currentSpeech, setCurrentSpeech] = useState<string>(npc.dialogueGreeting);
  const [hasInquiredSchedule, setHasInquiredSchedule] = useState(false);
  const [hasInquiredFaction, setHasInquiredFaction] = useState(false);

  const faction = FACTIONS[npc.faction];

  const handleAskSchedule = () => {
    soundEngine.playUiClick();
    setCurrentSpeech(
      `"My days are strictly kept. In the morning: ${npc.schedule.morning}. By midday: ${npc.schedule.afternoon}. In the evening: ${npc.schedule.evening}. And at night: ${npc.schedule.night}."`
    );
    if (!hasInquiredSchedule) {
      setHasInquiredSchedule(true);
      onIncreaseTrust(npc.id, 5);
      soundEngine.playLevelUp();
    }
  };

  const handleAskFaction = () => {
    soundEngine.playUiClick();
    setCurrentSpeech(
      `"I stand with the ${faction?.name || 'people of Aetheria'}. ${faction?.description || ''} We believe order, honest trade, and hard work are what keep our civilization thriving."`
    );
    if (!hasInquiredFaction) {
      setHasInquiredFaction(true);
      onIncreaseTrust(npc.id, 5);
      soundEngine.playLevelUp();
    }
  };

  const handleAskFamily = () => {
    soundEngine.playUiClick();
    const fam = npc.family;
    let text = `"We make our home in ${fam.homeDistrict}. `;
    if (fam.spouseName) text += `My dear spouse is ${fam.spouseName}. `;
    if (fam.childrenNames) text += `Our children are ${fam.childrenNames.join(', ')}. `;
    if (fam.parentsNames) text += `My lineage traces back to ${fam.parentsNames.join(', ')}. `;
    text += `Everything I build is for them."`;
    setCurrentSpeech(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-400 flex items-center justify-center font-bold text-base">
              {npc.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">{npc.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                  {npc.profession}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {npc.district} • {faction?.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Trust: +{npc.trustWithPlayer}</span>
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
        </div>

        {/* Speech Bubble */}
        <div className="p-6 bg-slate-900/30 border-b border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans italic min-h-[90px]">
            {currentSpeech}
          </div>
        </div>

        {/* Dialogue Options */}
        <div className="p-4 sm:p-6 space-y-2 bg-slate-950 font-sans">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Dialogue Responses:
          </div>

          {npc.shopId && (
            <button
              onClick={() => {
                soundEngine.playCoinJingle();
                if (onOpenShop && npc.shopId) {
                  onOpenShop(npc.shopId);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 hover:from-amber-500/30 hover:to-orange-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>"Let me browse your store merchandise."</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleAskSchedule}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>"What is your daily routine and work schedule?"</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={handleAskFaction}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>"What are your thoughts on your faction and leaders?"</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={handleAskFamily}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>"Tell me about your family and home."</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="w-full text-center py-2.5 text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer"
          >
            "Farewell for now."
          </button>
        </div>
      </div>
    </div>
  );
};
