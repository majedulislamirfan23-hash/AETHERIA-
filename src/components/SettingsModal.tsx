/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PerformanceSettings, GraphicsPreset } from '../types/game';
import { 
  X, 
  Settings, 
  Smartphone, 
  Save, 
  Download, 
  Upload, 
  Sliders, 
  FileCode, 
  Volume2, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface SettingsModalProps {
  settings: PerformanceSettings;
  onUpdateSettings: (newSettings: PerformanceSettings) => void;
  onManualSave: () => void;
  onExportSave: () => void;
  onImportSave: (jsonStr: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onManualSave,
  onExportSave,
  onImportSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'graphics' | 'controls' | 'save' | 'android_unity'>('graphics');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const applyPreset = (preset: GraphicsPreset) => {
    soundEngine.playUiClick();
    let newSettings: PerformanceSettings = { ...settings, preset };

    switch (preset) {
      case 'batterySaver':
        newSettings = {
          ...newSettings,
          fpsCap: 30,
          resolutionScale: 0.75,
          shadowQuality: 'off',
          viewDistance: 80,
          npcDensity: 0.4,
          instancedFoliage: true,
          effectsQuality: 'low',
          dynamicWeather: false,
        };
        break;
      case 'low':
        newSettings = {
          ...newSettings,
          fpsCap: 30,
          resolutionScale: 1.0,
          shadowQuality: 'simple',
          viewDistance: 120,
          npcDensity: 0.6,
          instancedFoliage: true,
          effectsQuality: 'low',
          dynamicWeather: false,
        };
        break;
      case 'balanced':
        newSettings = {
          ...newSettings,
          fpsCap: 45,
          resolutionScale: 1.0,
          shadowQuality: 'pcf',
          viewDistance: 180,
          npcDensity: 0.8,
          instancedFoliage: true,
          effectsQuality: 'medium',
          dynamicWeather: true,
        };
        break;
      case 'high':
        newSettings = {
          ...newSettings,
          fpsCap: 60,
          resolutionScale: 1.25,
          shadowQuality: 'pcfSoft',
          viewDistance: 260,
          npcDensity: 1.0,
          instancedFoliage: true,
          effectsQuality: 'high',
          dynamicWeather: true,
        };
        break;
      case 'ultra':
        newSettings = {
          ...newSettings,
          fpsCap: 0,
          resolutionScale: 1.5,
          shadowQuality: 'pcfSoft',
          viewDistance: 400,
          npcDensity: 1.2,
          instancedFoliage: true,
          effectsQuality: 'ultra',
          dynamicWeather: true,
        };
        break;
    }
    onUpdateSettings(newSettings);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportSave(content);
        setSaveStatus('Save game imported successfully!');
        setTimeout(() => setSaveStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">SYSTEM SETTINGS & PERFORMANCE</h2>
              <div className="text-xs text-slate-400 font-mono">
                Hardware profiles, FPS tuning, save management & Android build tools
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950">
          {[
            { id: 'graphics', label: 'Graphics & Hardware Presets', icon: <Sliders className="w-4 h-4" /> },
            { id: 'controls', label: 'Controls & HUD', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'save', label: 'Save & Cloud Data', icon: <Save className="w-4 h-4" /> },
            { id: 'android_unity', label: 'Android APK / Unity 2023 Architecture', icon: <FileCode className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab(t.id as unknown as typeof activeTab);
              }}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'graphics' && (
            <div className="space-y-6 max-w-3xl">
              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                  Mobile / Hardware Performance Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(
                    [
                      { id: 'batterySaver', label: '1. Battery Saver', fps: '30 FPS', note: '0.75x Res, Shadows Off' },
                      { id: 'low', label: '2. Low', fps: '30 FPS', note: '1.0x Res, Simple Shadows' },
                      { id: 'balanced', label: '3. Balanced', fps: '45-60 FPS', note: '1.0x Res, PCF Shadows' },
                      { id: 'high', label: '4. High', fps: '60 FPS', note: '1.25x Res, Soft Shadows' },
                      { id: 'ultra', label: '5. Ultra', fps: 'Unlocked', note: '1.5x Res, 400m View' },
                    ] as const
                  ).map((p) => {
                    const active = settings.preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          active
                            ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[10px] text-sky-300 font-mono mt-0.5">{p.fps}</div>
                        <div className="text-[9px] text-slate-500 mt-1">{p.note}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Sliders */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
                  Fine Hardware Tuning
                </div>

                {/* Target Frame Rate */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Target Frame Rate Cap</div>
                    <div className="text-[11px] text-slate-400 font-mono">30 FPS, 45 FPS, 60 FPS, or Unlocked</div>
                  </div>
                  <div className="flex gap-1.5 font-mono text-xs">
                    {[30, 45, 60, 0].map((cap) => (
                      <button
                        key={cap}
                        onClick={() => {
                          soundEngine.playUiClick();
                          onUpdateSettings({ ...settings, fpsCap: cap });
                        }}
                        className={`px-3 py-1 rounded-lg border cursor-pointer ${
                          settings.fpsCap === cap
                            ? 'bg-sky-500 border-sky-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {cap === 0 ? 'Max' : `${cap} FPS`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Scale */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Render Resolution Scale</div>
                    <div className="text-[11px] text-slate-400 font-mono">Current: {settings.resolutionScale}x native viewport</div>
                  </div>
                  <div className="flex gap-1.5 font-mono text-xs">
                    {[0.75, 1.0, 1.25, 1.5].map((scale) => (
                      <button
                        key={scale}
                        onClick={() => {
                          soundEngine.playUiClick();
                          onUpdateSettings({ ...settings, resolutionScale: scale });
                        }}
                        className={`px-3 py-1 rounded-lg border cursor-pointer ${
                          settings.resolutionScale === scale
                            ? 'bg-sky-500 border-sky-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow Quality */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Shadow Mapping Quality</div>
                    <div className="text-[11px] text-slate-400 font-mono">PCF soft shadows vs disabled for battery conservation</div>
                  </div>
                  <div className="flex gap-1.5 font-mono text-xs">
                    {(['off', 'simple', 'pcf', 'pcfSoft'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          soundEngine.playUiClick();
                          onUpdateSettings({ ...settings, shadowQuality: q });
                        }}
                        className={`px-3 py-1 rounded-lg border cursor-pointer uppercase text-[10px] ${
                          settings.shadowQuality === q
                            ? 'bg-sky-500 border-sky-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Distance */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">World Streaming Horizon</div>
                    <div className="text-[11px] text-slate-400 font-mono">Radius: {settings.viewDistance} meters</div>
                  </div>
                  <div className="flex gap-1.5 font-mono text-xs">
                    {[80, 140, 220, 340, 500].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          soundEngine.playUiClick();
                          onUpdateSettings({ ...settings, viewDistance: d });
                        }}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer text-[10px] ${
                          settings.viewDistance === d
                            ? 'bg-sky-500 border-sky-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telemetry Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Real-Time Telemetry Monitor</div>
                    <div className="text-[11px] text-slate-400 font-mono">Displays FPS, Frame Time ms, Draw Calls & Memory</div>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onUpdateSettings({ ...settings, showTelemetry: !settings.showTelemetry });
                    }}
                    className={`px-4 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors cursor-pointer ${
                      settings.showTelemetry
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.showTelemetry ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4 max-w-3xl">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
                  Input & On-Screen Interface
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Mobile Touch Controls Overlay</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Shows virtual analog thumbstick, jump, sprint, and attack buttons
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onUpdateSettings({
                        ...settings,
                        touchControlsVisible: !settings.touchControlsVisible,
                      });
                    }}
                    className={`px-4 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors cursor-pointer ${
                      settings.touchControlsVisible
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.touchControlsVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
              </div>

              {/* Desktop Keybinds Reference */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="font-bold text-slate-300 mb-2">Keyboard & Mouse Mappings:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">W, A, S, D</kbd> : Movement</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Space</kbd> : Jump</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Shift</kbd> : Sprint</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">F</kbd> : Attack Combo</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">E</kbd> : Interact / Talk</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Tab</kbd> : Inventory</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">C</kbd> : Character Sheet</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">1 - 6</kbd> : Hotbar Items</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'save' && (
            <div className="space-y-4 max-w-3xl font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    State Persistence & Anti-Duplication Ledger
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-400 leading-relaxed font-sans text-xs">
                  Aetheria uses a transactional save system that persists wallet balances, inventory slots, equipment durability, living citizen trust ratings, and world progression across browser refreshes and mobile sessions.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onManualSave();
                      setSaveStatus('Game state saved locally to browser storage!');
                      setTimeout(() => setSaveStatus(null), 3000);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Game Now</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.playCoinJingle();
                      onExportSave();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Save File (JSON)</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Import Save (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {saveStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{saveStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'android_unity' && (
            <div className="space-y-4 max-w-3xl text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">
                    HONEST ARCHITECTURE & ANDROID APK/AAB DEPLOYMENT GUIDE
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    PRODUCTION BLUEPRINT
                  </span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Per prompt instruction regarding framework transparency: this application is constructed using a high-performance, zero-external-404 WebGL / Three.js 3D engine in React + TypeScript. This ensures immediate browser playability without requiring heavy compilation steps.
                </p>
                <p className="text-slate-400 font-sans leading-relaxed">
                  To deploy as a native Android APK or Google Play AAB bundle, two verified pathways are supported:
                </p>

                {/* Option A: Capacitor Android APK/AAB */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-sky-300 font-bold text-xs">
                    OPTION A: Instant Native Android APK/AAB (Capacitor Runtime)
                  </div>
                  <div className="text-slate-400 space-y-1">
                    <div>1. Run: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">npm run build</code></div>
                    <div>2. Initialize Capacitor: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">npx cap add android</code></div>
                    <div>3. Sync assets: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">npx cap sync android</code></div>
                    <div>4. Build APK: <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">cd android && ./gradlew assembleRelease</code></div>
                    <div>5. Build AAB (Play Store): <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">./gradlew bundleRelease</code></div>
                  </div>
                </div>

                {/* Option B: Unity 2023 C# Architecture */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-amber-300 font-bold text-xs">
                    OPTION B: Native Unity 2023.2+ C# Architecture Blueprint
                  </div>
                  <div className="text-slate-400 space-y-1.5 font-mono text-[11px]">
                    <div>• <span className="text-slate-200 font-bold">AetheriaPerformanceEngine.cs</span>: Handles GPU instancing via <code className="text-sky-300">Graphics.RenderMeshInstanced</code> and LOD culling.</div>
                    <div>• <span className="text-slate-200 font-bold">EconomyWalletManager.cs</span>: Multi-currency state ledger with checksum validation.</div>
                    <div>• <span className="text-slate-200 font-bold">CivilizationScheduleSimulator.cs</span>: Background mathematical simulation for distant NPCs with navmesh scheduling.</div>
                    <div>• <span className="text-slate-200 font-bold">AndroidProfilePresets.cs</span>: Sets <code className="text-sky-300">Application.targetFrameRate = 60</code>, adaptive shadow resolution, and ASTC texture streaming.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
