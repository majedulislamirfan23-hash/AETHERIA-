/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LivingNpc, FactionId } from '../types/game';
import { FACTIONS, INITIAL_CITIZENS } from '../data/civilization';
import { 
  X, 
  Users, 
  Building2, 
  Briefcase, 
  Heart, 
  ShieldAlert, 
  Clock, 
  Home, 
  Compass, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface CivilizationModalProps {
  citizens: LivingNpc[];
  reputation: Record<string, number>;
  onClose: () => void;
}

export const CivilizationModal: React.FC<CivilizationModalProps> = ({
  citizens,
  reputation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'citizens' | 'factions' | 'economy' | 'districts'>('citizens');
  const [selectedCitizen, setSelectedCitizen] = useState<LivingNpc | null>(citizens[0] || null);
  const [filterProfession, setFilterProfession] = useState<string>('all');

  const filteredCitizens = citizens.filter((c) => {
    if (filterProfession === 'all') return true;
    return c.profession === filterProfession;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  LIVING HUMAN CIVILIZATION SIMULATION
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300">
                  AETHERIA CITIZEN MATRIX
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Persistent families, workforce rosters, automated schedules & district trade flows
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-slate-800 bg-slate-950">
          {[
            { id: 'citizens', label: `Citizen Roster (${citizens.length})`, icon: <Users className="w-4 h-4" /> },
            { id: 'factions', label: 'Faction Alliances', icon: <Building2 className="w-4 h-4" /> },
            { id: 'economy', label: 'Civic Production & Economy', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'districts', label: 'Settlement Atlas', icon: <Compass className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab(t.id as unknown as typeof activeTab);
              }}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-hidden">
          {activeTab === 'citizens' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
              {/* Left Column: Citizen List & Filters (6 cols) */}
              <div className="md:col-span-6 flex flex-col gap-3 h-full">
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1 pb-1">
                  {['all', 'Guard', 'Blacksmith', 'Doctor', 'Merchant', 'Scholar', 'Farmer', 'Child', 'Leader', 'Explorer'].map(
                    (prof) => (
                      <button
                        key={prof}
                        onClick={() => {
                          soundEngine.playUiClick();
                          setFilterProfession(prof);
                        }}
                        className={`px-2.5 py-0.8 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          filterProfession === prof
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {prof === 'all' ? 'All Citizens' : prof}
                      </button>
                    )
                  )}
                </div>

                {/* Scrollable Citizen Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredCitizens.map((citizen) => {
                    const isSelected = selectedCitizen?.id === citizen.id;
                    return (
                      <button
                        key={citizen.id}
                        onClick={() => {
                          soundEngine.playUiClick();
                          setSelectedCitizen(citizen);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{citizen.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-purple-300">
                              {citizen.profession}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Trust: +{citizen.trustWithPlayer}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="line-clamp-1">{citizen.currentTask}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Deep Biography, Family & Schedule (6 cols) */}
              <div className="md:col-span-6 flex flex-col justify-between bg-slate-900/40 border border-slate-800 rounded-xl p-5 overflow-y-auto">
                {selectedCitizen ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-mono font-bold tracking-wider text-purple-400">
                          Citizen Profile // ID: {selectedCitizen.id}
                        </span>
                        <span className="text-xs font-mono text-amber-300">
                          Savings: {selectedCitizen.walletGold} Gold
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1">{selectedCitizen.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {selectedCitizen.profession} • {selectedCitizen.district} • {FACTIONS[selectedCitizen.faction]?.name}
                      </div>
                    </div>

                    {/* Personality & Greeting */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="text-xs text-slate-300 italic">
                        "{selectedCitizen.dialogueGreeting}"
                      </div>
                      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span className="font-bold text-slate-300">Personality Trait: </span>
                        {selectedCitizen.personality}
                      </div>
                    </div>

                    {/* Family Simulation Node */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-300 font-mono">
                        <Home className="w-3.5 h-3.5" />
                        <span>FAMILY & RESIDENCE</span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                        <div>Home Address: <span className="text-slate-400">{selectedCitizen.family.homeDistrict}</span></div>
                        {selectedCitizen.family.spouseName && (
                          <div>Spouse: <span className="text-slate-400">{selectedCitizen.family.spouseName}</span></div>
                        )}
                        {selectedCitizen.family.childrenNames && (
                          <div>Children: <span className="text-slate-400">{selectedCitizen.family.childrenNames.join(', ')}</span></div>
                        )}
                        {selectedCitizen.family.parentsNames && (
                          <div>Parents: <span className="text-slate-400">{selectedCitizen.family.parentsNames.join(', ')}</span></div>
                        )}
                      </div>
                    </div>

                    {/* 24-Hour Automated Schedule */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>DAILY ROUTINE & WORKFORCE SCHEDULE</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                        <div><span className="text-slate-200">Morning:</span> {selectedCitizen.schedule.morning}</div>
                        <div><span className="text-slate-200">Midday:</span> {selectedCitizen.schedule.afternoon}</div>
                        <div><span className="text-slate-200">Evening:</span> {selectedCitizen.schedule.evening}</div>
                        <div><span className="text-slate-200">Night:</span> {selectedCitizen.schedule.night}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                    Select a citizen to view their detailed simulated life.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'factions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
              {Object.values(FACTIONS).map((f) => {
                const repScore = reputation[f.id] || 0;
                return (
                  <div
                    key={f.id}
                    className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white text-base">{f.name}</h3>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                          style={{ backgroundColor: `${f.color}20`, color: f.color }}
                        >
                          {f.headquarters}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">Leader: {f.leader}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Your Standing:</span>
                      <span
                        className={`font-bold ${
                          repScore > 20
                            ? 'text-emerald-400'
                            : repScore < -20
                            ? 'text-rose-400'
                            : 'text-sky-300'
                        }`}
                      >
                        {repScore > 0 ? `+${repScore}` : repScore} (Honored Ally)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'economy' && (
            <div className="space-y-4 h-full overflow-y-auto pr-1 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>REGIONAL PRODUCTION & COMMODITY CYCLES</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Aetheria’s economy is interconnected and driven by simulated citizen professions. Every morning at 06:00, farmers harvest wheat in Silverpine; miners deliver titanium and obsidian to Citadel blacksmiths; doctors distill herbs into remedies; and merchants transport cargo to the Central Bazaar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Agriculture (Silverpine)</div>
                    <div className="text-lg font-bold text-emerald-400">+1,450 kg/day</div>
                    <div className="text-[10px] text-slate-500">Wheat, livestock, fresh fruits</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Mining & Smelting</div>
                    <div className="text-lg font-bold text-amber-400">+820 ingots/day</div>
                    <div className="text-[10px] text-slate-500">Aetherian iron, obsidian, titanium</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Bazaar Trade Volume</div>
                    <div className="text-lg font-bold text-sky-400">14,200 Gold/day</div>
                    <div className="text-[10px] text-slate-500">Supplies, weapons, potions, mounts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'districts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
              {[
                { name: 'Citadel Plaza & Spire', pop: '1,240 citizens', desc: 'Seat of government, Vanguard Armory, Royal Barracks, and High Observatory.' },
                { name: 'Lower Quarter & Grand Bazaar', pop: '2,890 citizens', desc: 'Bustling taverns, street food vendors, outfitter stores, and merchant houses.' },
                { name: 'Silverpine Farmsteads', pop: '850 citizens', desc: 'Lush golden wheat fields, windmills, orchards, and timber harvest outposts.' },
                { name: 'Industrial Dock & Mechanist Hangars', pop: '670 citizens', desc: 'Vehicle repair bays, forge foundries, repulsor testing tracks, and cargo silos.' },
              ].map((d, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white text-sm">{d.name}</h4>
                      <span className="text-[10px] font-mono text-purple-300">{d.pop}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{d.desc}</p>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2">Active Patrols: High (Guards on Duty)</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
