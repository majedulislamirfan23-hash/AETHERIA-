/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameItem, InventorySlot, Wallet } from '../types/game';
import { RARITY_COLORS } from '../data/items';
import { 
  X, 
  Hammer, 
  Sparkles, 
  ArrowUpCircle, 
  Gem, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface CraftingModalProps {
  inventory: InventorySlot[];
  wallet: Wallet;
  onUpgradeItem: (item: GameItem, goldCost: number, gemsCost: number) => boolean;
  onSocketGem: (item: GameItem, gemItem: GameItem) => boolean;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  inventory,
  wallet,
  onUpgradeItem,
  onSocketGem,
  onClose,
}) => {
  const [selectedGear, setSelectedGear] = useState<GameItem | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Filter upgradable equipment and weapons
  const upgradableItems = inventory.filter(
    (slot) => slot.item.category === 'weapon' || slot.item.category === 'armor'
  );

  const currentLevel = selectedGear?.upgradeLevel || 0;
  const nextLevel = currentLevel + 1;
  const upgradeGoldCost = Math.round(150 * Math.pow(1.5, currentLevel));
  const upgradeGemsCost = currentLevel >= 3 ? Math.round(2 + currentLevel * 1.5) : 0;
  const canAfford = wallet.gold >= upgradeGoldCost && wallet.gems >= upgradeGemsCost;

  const handleUpgrade = () => {
    if (!selectedGear) return;
    if (!canAfford) {
      setFeedback({ text: 'Insufficient Gold or Gems for this upgrade!', error: true });
      return;
    }

    const success = onUpgradeItem(selectedGear, upgradeGoldCost, upgradeGemsCost);
    if (success) {
      soundEngine.playLevelUp();
      setFeedback({ text: `Successfully enhanced to +${nextLevel}!` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[760px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">CITADEL FORGE & ENCHANTING</h2>
              <div className="text-xs text-slate-400 font-mono">
                Enhance gear stats (+1 to +10) and bind arcane crystalline sockets
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 overflow-hidden">
          {/* Left Column: Select Gear (6 cols) */}
          <div className="md:col-span-6 flex flex-col gap-2 overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1">
              Select Weapon or Armor to Enhance
            </div>

            {upgradableItems.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                No upgradable weapons or armor found in your backpack.
              </div>
            ) : (
              upgradableItems.map((slot) => {
                const isSelected = selectedGear?.id === slot.item.id;
                const rStyle = RARITY_COLORS[slot.item.rarity] || RARITY_COLORS.common;
                const lvl = slot.item.upgradeLevel || 0;

                return (
                  <button
                    key={slot.item.id}
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedGear(slot.item);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${rStyle.text}`}>{slot.item.name}</span>
                        {lvl > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 font-bold">
                            +{lvl}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Base: {slot.item.category.toUpperCase()} • Durability: {slot.item.durability}/{slot.item.maxDurability}
                      </div>
                    </div>

                    <ArrowUpCircle className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Forge Anvil & Stat Previews (6 cols) */}
          <div className="md:col-span-6 flex flex-col justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            {selectedGear ? (
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                      Enhancement Matrix
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-300">
                      Tier: +{currentLevel} → +{nextLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{selectedGear.name}</h3>

                  {/* Stat Scaling Comparison */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <div className="text-slate-400 font-bold">Projected Stat Enhancements:</div>
                    {selectedGear.stats?.attack && (
                      <div className="flex justify-between items-center text-amber-300">
                        <span>Attack Power:</span>
                        <span>
                          {selectedGear.stats.attack} → <span className="font-bold text-amber-400">+{Math.round(selectedGear.stats.attack * 1.15 + 4)}</span>
                        </span>
                      </div>
                    )}
                    {selectedGear.stats?.defense && (
                      <div className="flex justify-between items-center text-sky-300">
                        <span>Defense Rating:</span>
                        <span>
                          {selectedGear.stats.defense} → <span className="font-bold text-sky-400">+{Math.round(selectedGear.stats.defense * 1.15 + 3)}</span>
                        </span>
                      </div>
                    )}
                    {selectedGear.stats?.magicPower && (
                      <div className="flex justify-between items-center text-purple-300">
                        <span>Arcane Resonance:</span>
                        <span>
                          {selectedGear.stats.magicPower} → <span className="font-bold text-purple-400">+{Math.round(selectedGear.stats.magicPower * 1.15 + 5)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Material & Currency Costs */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <div className="text-slate-400 font-bold">Forge Materials Required:</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Gold:</span>
                      <span className={wallet.gold >= upgradeGoldCost ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeGoldCost.toLocaleString()} / {wallet.gold.toLocaleString()}
                      </span>
                    </div>
                    {upgradeGemsCost > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Crafting Gems:</span>
                        <span className={wallet.gems >= upgradeGemsCost ? 'text-purple-300 font-bold' : 'text-rose-400 font-bold'}>
                          {upgradeGemsCost} / {wallet.gems}
                        </span>
                      </div>
                    )}
                  </div>

                  {feedback && (
                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono ${
                        feedback.error
                          ? 'bg-rose-950/70 border border-rose-500/60 text-rose-300'
                          : 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-300'
                      }`}
                    >
                      {feedback.error ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      <span>{feedback.text}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={!canAfford}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  Temper Weapon / Armor
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center">
                Select an item on the left to temper and enhance in the forge.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
