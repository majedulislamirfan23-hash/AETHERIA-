/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { PlayerStats, Wallet, LivingNpc, InventorySlot } from '../types/game';
import { 
  Heart, 
  Sparkles, 
  Flame, 
  Apple, 
  Droplet, 
  Coins, 
  Gem, 
  Crown, 
  Backpack, 
  User, 
  Hammer, 
  Users, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sword, 
  ArrowUp, 
  Zap, 
  Shield, 
  RotateCw, 
  Compass, 
  Sun, 
  MessageSquare, 
  Globe2 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface GameHudProps {
  playerStats: PlayerStats;
  wallet: Wallet;
  nearestNpc: LivingNpc | null;
  hotbarSlots: (InventorySlot | null)[];
  comboStep: number;
  isBlocking: boolean;
  activeQuestsCount: number;
  onUseHotbarSlot: (index: number) => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenCrafting: () => void;
  onOpenCivilization: () => void;
  onOpenQuests: () => void;
  onOpenSettings: () => void;
  onOpenWorldMenu: () => void;
  onInteract: () => void;
  onAttack: () => void;
  onBlockToggle: (blocking: boolean) => void;
  onDodge: () => void;
  onJump: () => void;
  onSprintToggle: (sprint: boolean) => void;
  onSkillWhirlwind: () => void;
  onSkillNova: () => void;
  onSkillHeal: () => void;
  onJoystickMove: (x: number, y: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showMobileControls: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({
  playerStats,
  wallet,
  nearestNpc,
  hotbarSlots,
  comboStep,
  isBlocking,
  activeQuestsCount,
  onUseHotbarSlot,
  onOpenInventory,
  onOpenCharacter,
  onOpenCrafting,
  onOpenCivilization,
  onOpenQuests,
  onOpenSettings,
  onOpenWorldMenu,
  onInteract,
  onAttack,
  onBlockToggle,
  onDodge,
  onJump,
  onSprintToggle,
  onSkillWhirlwind,
  onSkillNova,
  onSkillHeal,
  onJoystickMove,
  isMuted,
  onToggleMute,
  showMobileControls,
}) => {
  // Mobile virtual joystick logic
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const hpPercent = Math.max(0, Math.min(100, (playerStats.health / playerStats.maxHealth) * 100));
  const mpPercent = Math.max(0, Math.min(100, (playerStats.mana / playerStats.maxMana) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (playerStats.stamina / playerStats.maxStamina) * 100));

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      updateJoystickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setStickPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = 45;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-sans">
      {/* ================= TOP PERIMETER CLUSTER ================= */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player Status Cluster */}
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-slate-950/85 border border-slate-800/90 rounded-2xl p-3 shadow-2xl max-w-[270px] sm:max-w-[320px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center font-mono font-bold text-xs text-sky-300">
                L{playerStats.level}
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wide">AVATAR OF AETHERIA</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  XP: {playerStats.xp} / {playerStats.xpToNext}
                </div>
              </div>
            </div>
            {playerStats.statPoints > 0 && (
              <button
                onClick={onOpenCharacter}
                className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-bold animate-pulse cursor-pointer"
              >
                +{playerStats.statPoints} PTS
              </button>
            )}
          </div>

          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-300 w-12 text-right">
              {Math.round(playerStats.health)}/{playerStats.maxHealth}
            </span>
          </div>

          {/* Mana Bar */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-150"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-300 w-12 text-right">
              {Math.round(playerStats.mana)}/{playerStats.maxMana}
            </span>
          </div>

          {/* Stamina Bar */}
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150"
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-300 w-12 text-right">
              {Math.round(playerStats.stamina)}
            </span>
          </div>

          {/* Hunger & Thirst Indicators */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Apple className="w-3 h-3 text-amber-400" />
              <span>Hunger:</span>
              <span className="tabular-nums font-bold">{Math.round(playerStats.hunger)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Droplet className="w-3 h-3 text-cyan-400" />
              <span>Thirst:</span>
              <span className="tabular-nums font-bold">{Math.round(playerStats.thirst)}%</span>
            </div>
          </div>
        </div>

        {/* Right: Currency Badges & System Navigation Bar */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Multi-Currency Wallet Pills */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 bg-slate-950/85 border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold tabular-nums">{wallet.gold.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
              <Gem className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold tabular-nums">{wallet.diamonds}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-400/10 border border-slate-400/30 text-slate-300">
              <span className="text-[10px] text-slate-400 font-bold">S</span>
              <span className="font-bold tabular-nums">{wallet.silver.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold tabular-nums">{wallet.rareTokens}</span>
            </div>
          </div>

          {/* Quick HUD Navigation Icons */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 border border-slate-800/90 p-1.5 rounded-2xl shadow-xl">
            {/* World Switcher */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenWorldMenu();
              }}
              title="Realms & World Hub"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white transition-colors cursor-pointer"
            >
              <Globe2 className="w-4 h-4" />
            </button>

            {/* Quests Tracker */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenQuests();
              }}
              title="Quests Log (M)"
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              {activeQuestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono text-[9px] font-bold flex items-center justify-center">
                  {activeQuestsCount}
                </span>
              )}
            </button>

            {/* Inventory */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenInventory();
              }}
              title="Inventory (Tab)"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>

            {/* Character */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenCharacter();
              }}
              title="Character Sheet (C)"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Crafting */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenCrafting();
              }}
              title="Citadel Forge"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Hammer className="w-4 h-4" />
            </button>

            {/* Civilization */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenCivilization();
              }}
              title="Civilization Simulation"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Mute */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onToggleMute();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenSettings();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= INTERACTION PROMPT (CENTER) ================= */}
      {nearestNpc && (
        <div className="pointer-events-auto self-center mb-4 flex items-center gap-3 bg-slate-950/90 border border-sky-500/50 px-4 py-2.5 rounded-2xl shadow-2xl animate-bounce">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onInteract();
            }}
            className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md cursor-pointer"
          >
            E
          </button>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{nearestNpc.name}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-sky-300">
                {nearestNpc.profession}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {nearestNpc.shopId ? 'Press E to speak or browse store' : 'Press E to converse with citizen'}
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM BAR: MINECRAFT JOYSTICK & COMBAT CLUSTER ================= */}
      <div className="w-full flex items-end justify-between">
        {/* Mobile Left: Smooth Minecraft-style Virtual Thumbstick */}
        {showMobileControls ? (
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="pointer-events-auto relative w-32 h-32 rounded-full bg-slate-900/60 border-2 border-slate-700/80 flex items-center justify-center touch-none select-none shadow-2xl backdrop-blur-none"
          >
            {/* Cardinal Direction Indicator ticks */}
            <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
            <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
            <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
            <div className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />

            <div
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-500 border-2 border-sky-300 shadow-xl pointer-events-none transition-transform"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            />
          </div>
        ) : (
          <div className="w-20" />
        )}

        {/* Bottom Center: Quick Access Hotbar [1 - 6] */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-950/90 border border-slate-800/90 p-2 rounded-2xl shadow-2xl mb-1">
          {hotbarSlots.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (slot) onUseHotbarSlot(idx);
              }}
              title={slot ? `${slot.item.name} (${slot.quantity})` : `Empty Slot ${idx + 1}`}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all border ${
                slot
                  ? 'bg-slate-900/80 border-slate-700 hover:border-sky-400 cursor-pointer shadow-md'
                  : 'bg-slate-950/50 border-slate-800/60 cursor-default'
              }`}
            >
              <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-400">
                {idx + 1}
              </span>
              {slot && (
                <>
                  <div className="text-xs font-bold text-sky-200 truncate px-1">
                    {slot.item.name.substring(0, 3)}
                  </div>
                  {slot.quantity > 1 && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold text-amber-300">
                      {slot.quantity}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Mobile Right: Full Combat, Skills, Dodge & Block Action Cluster */}
        {showMobileControls ? (
          <div className="pointer-events-auto flex flex-col items-end gap-2.5">
            {/* Top Skill Row */}
            <div className="flex items-center gap-2">
              {/* Skill 1: Whirlwind Cleave */}
              <button
                onClick={onSkillWhirlwind}
                className="w-11 h-11 rounded-full bg-amber-600/90 border border-amber-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                title="Whirlwind Cleave (1)"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Skill 2: Arcane Nova */}
              <button
                onClick={onSkillNova}
                className="w-11 h-11 rounded-full bg-purple-600/90 border border-purple-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                title="Arcane Nova (2)"
              >
                <Zap className="w-5 h-5" />
              </button>

              {/* Skill 3: Solar Heal */}
              <button
                onClick={onSkillHeal}
                className="w-11 h-11 rounded-full bg-emerald-600/90 border border-emerald-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                title="Solar Heal (3)"
              >
                <Sun className="w-5 h-5" />
              </button>

              {/* Sprint Button */}
              <button
                onTouchStart={() => onSprintToggle(true)}
                onTouchEnd={() => onSprintToggle(false)}
                className="w-11 h-11 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-300 shadow-lg active:scale-95"
                title="Sprint"
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>

            {/* Middle Defense & Evasion Row */}
            <div className="flex items-center gap-2">
              {/* Dodge Roll */}
              <button
                onClick={onDodge}
                className="w-12 h-12 rounded-full bg-indigo-600/90 border border-indigo-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                title="Dodge Roll (R)"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Block Stance (Hold) */}
              <button
                onTouchStart={() => onBlockToggle(true)}
                onTouchEnd={() => onBlockToggle(false)}
                className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-colors ${
                  isBlocking
                    ? 'bg-sky-500 border-white text-white ring-2 ring-sky-300'
                    : 'bg-slate-800 border-sky-400 text-sky-300'
                }`}
                title="Block (Q)"
              >
                <Shield className="w-5 h-5" />
              </button>

              {/* Jump Button */}
              <button
                onClick={onJump}
                className="w-12 h-12 rounded-full bg-emerald-600/90 border border-emerald-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                title="Jump (Space)"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Row: Primary Attack Button with Combo Ring */}
            <div className="flex items-center gap-2">
              {nearestNpc && (
                <button
                  onClick={onInteract}
                  className="w-13 h-13 rounded-full bg-sky-600/90 border border-sky-400 flex items-center justify-center text-white shadow-lg active:scale-95"
                  title="Interact (E)"
                >
                  <MessageSquare className="w-6 h-6" />
                </button>
              )}

              {/* Primary Attack with Combo Counter */}
              <button
                onClick={onAttack}
                className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-white shadow-2xl active:scale-95 cursor-pointer"
                title="Attack Combo (F / Tap)"
              >
                <Sword className="w-7 h-7" />
                <span className="absolute bottom-1 right-2 text-[9px] font-mono font-bold text-amber-200">
                  {comboStep + 1}/3
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </div>
  );
};
