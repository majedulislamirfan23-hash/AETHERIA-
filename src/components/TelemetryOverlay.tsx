/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryData } from '../types/game';
import { Activity, Cpu, Layers, Eye, HardDrive, MapPin } from 'lucide-react';

interface TelemetryOverlayProps {
  telemetry: TelemetryData;
}

export const TelemetryOverlay: React.FC<TelemetryOverlayProps> = ({ telemetry }) => {
  const fpsColor =
    telemetry.fps >= 55
      ? 'text-emerald-400'
      : telemetry.fps >= 35
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="absolute top-20 left-3 sm:left-5 z-30 pointer-events-none select-none bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 shadow-xl space-y-1">
      <div className="flex items-center gap-1.5 font-bold text-sky-400 pb-1 border-b border-slate-800">
        <Activity className="w-3 h-3 text-sky-400" />
        <span>PERFORMANCE TELEMETRY // AETHERIA</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-400 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-slate-500" /> Frame Rate:
        </span>
        <span className={`font-bold tabular-nums ${fpsColor}`}>
          {telemetry.fps} FPS ({telemetry.frameTimeMs} ms)
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" /> GPU Draw Calls:
        </span>
        <span className="text-emerald-400 font-bold tabular-nums">
          {telemetry.drawCalls} calls
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3 text-slate-500" /> NPC Simulation:
        </span>
        <span className="text-sky-300 font-bold tabular-nums">
          {telemetry.activeNpcs} Active / {telemetry.culledNpcs} Culled
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-400 flex items-center gap-1">
          <HardDrive className="w-3 h-3 text-slate-500" /> Memory Heap:
        </span>
        <span className="text-slate-300 font-bold tabular-nums">
          ~{telemetry.memoryMb} MB
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-slate-800/80 text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-500" /> Position:
        </span>
        <span className="text-slate-300 font-bold tabular-nums">
          [{telemetry.playerPos.x}, {telemetry.playerPos.y}, {telemetry.playerPos.z}]
        </span>
      </div>
    </div>
  );
};
