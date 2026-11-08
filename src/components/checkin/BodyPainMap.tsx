import React, { useState } from 'react';
import { BodyZoneId } from '../../types/record';
import { BODY_ZONES, BODY_ZONE_MAP } from '../../constants/clinicalData';

interface BodyPainMapProps {
  selectedZones: BodyZoneId[];
  onToggleZone: (zoneId: BodyZoneId) => void;
  onClearAll?: () => void;
}

export const BodyPainMap: React.FC<BodyPainMapProps> = ({
  selectedZones,
  onToggleZone,
  onClearAll,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [hoveredZone, setHoveredZone] = useState<BodyZoneId | null>(null);

  const isSelected = (id: BodyZoneId) => selectedZones.includes(id);

  const getRegionStyle = (id: BodyZoneId) => {
    const active = isSelected(id);
    const hovered = hoveredZone === id;

    if (active) {
      return {
        fill: '#f43f71', // rosebrand-500
        fillOpacity: 0.78,
        stroke: '#be1245', // rosebrand-700
        strokeWidth: 2,
      };
    }
    if (hovered) {
      return {
        fill: '#fda4ba', // rosebrand-300
        fillOpacity: 0.55,
        stroke: '#f43f71',
        strokeWidth: 1.5,
      };
    }
    return {
      fill: 'currentColor',
      fillOpacity: 0.28,
      stroke: 'currentColor',
      strokeOpacity: 0.65,
      strokeWidth: 1.4,
    };
  };

  const inspectedZone = hoveredZone
    ? BODY_ZONE_MAP[hoveredZone]
    : selectedZones.length > 0
    ? BODY_ZONE_MAP[selectedZones[selectedZones.length - 1]]
    : null;

  return (
    <div className="bg-rosebrand-50/40 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-rosebrand-100/90 dark:border-zinc-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-bold uppercase text-zinc-800 dark:text-zinc-200">
              Mapa Corporal de Dor
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300">
              {selectedZones.length === 0
                ? 'Nenhuma área marcada'
                : `${selectedZones.length} ${
                    selectedZones.length === 1 ? 'região afetada' : 'regiões afetadas'
                  }`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Toque nas regiões do corpo ou nos botões ao lado para registrar onde dói hoje
          </p>
        </div>

        {/* Toggle Front / Back on mobile or quick clear */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex sm:hidden rounded-xl bg-white dark:bg-zinc-900 p-0.5 border border-rosebrand-100 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                activeSide === 'front'
                  ? 'bg-rosebrand-500 text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Frente
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                activeSide === 'back'
                  ? 'bg-rosebrand-500 text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Costas
            </button>
          </div>

          {selectedZones.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] font-semibold text-zinc-500 hover:text-rosebrand-600 dark:text-zinc-400 dark:hover:text-rosebrand-400 px-2.5 py-1 rounded-lg hover:bg-rosebrand-50 dark:hover:bg-zinc-800 transition"
            >
              Limpar mapa
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Silhouettes + Quick Region Chips */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Dual SVG Body Silhouettes */}
        <div className="md:col-span-7 bg-white dark:bg-zinc-900/90 rounded-2xl p-3 sm:p-4 border border-rosebrand-100 dark:border-zinc-800 flex items-center justify-around gap-2">
          {/* FRONT VIEW */}
          <div
            className={`flex flex-col items-center ${
              activeSide === 'front' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-300 mb-1">
              Vista Frontal
            </span>
            <svg
              viewBox="0 0 160 320"
              className="w-36 sm:w-40 h-64 text-rosebrand-300 dark:text-zinc-400 select-none"
            >
              {/* Base subtle body aura */}
              <g className="cursor-pointer transition-all duration-200">
                {/* 1. Head & Jaw */}
                <g
                  onClick={() => onToggleZone('head_jaw')}
                  onMouseEnter={() => setHoveredZone('head_jaw')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('head_jaw')}
                >
                  <title>Cabeça & Mandíbula (ATM)</title>
                  <ellipse cx="80" cy="30" rx="18" ry="22" />
                </g>

                {/* 2. Neck / Cervical */}
                <g
                  onClick={() => onToggleZone('neck_cervical')}
                  onMouseEnter={() => setHoveredZone('neck_cervical')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('neck_cervical')}
                >
                  <title>Pescoço & Cervical</title>
                  <rect x="71" y="52" width="18" height="14" rx="4" />
                </g>

                {/* 3. Shoulders & Trapezius */}
                <g
                  onClick={() => onToggleZone('shoulders_trapezius')}
                  onMouseEnter={() => setHoveredZone('shoulders_trapezius')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('shoulders_trapezius')}
                >
                  <title>Ombros & Trapézio</title>
                  <path d="M42 68 Q56 60 71 64 L89 64 Q104 60 118 68 L114 82 L46 82 Z" />
                </g>

                {/* 4. Chest / Ribs */}
                <g
                  onClick={() => onToggleZone('chest_ribs')}
                  onMouseEnter={() => setHoveredZone('chest_ribs')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('chest_ribs')}
                >
                  <title>Peito & Costelas</title>
                  <rect x="53" y="83" width="54" height="36" rx="8" />
                  {/* Tender point markers on chest */}
                  <circle cx="67" cy="95" r="3" fill="#e11d56" opacity={isSelected('chest_ribs') ? 1 : 0.35} />
                  <circle cx="93" cy="95" r="3" fill="#e11d56" opacity={isSelected('chest_ribs') ? 1 : 0.35} />
                </g>

                {/* 5. Abdomen & Pelvis */}
                <g
                  onClick={() => onToggleZone('abdomen')}
                  onMouseEnter={() => setHoveredZone('abdomen')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('abdomen')}
                >
                  <title>Abdômen & Pelve</title>
                  <path d="M55 121 L105 121 L102 166 Q80 174 58 166 Z" />
                </g>

                {/* 6. Arms & Elbows (Left + Right) */}
                <g
                  onClick={() => onToggleZone('arms_elbows')}
                  onMouseEnter={() => setHoveredZone('arms_elbows')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('arms_elbows')}
                >
                  <title>Braços & Cotovelos</title>
                  <rect x="33" y="82" width="16" height="68" rx="8" transform="rotate(6 41 116)" />
                  <rect x="111" y="82" width="16" height="68" rx="8" transform="rotate(-6 119 116)" />
                </g>

                {/* 7. Wrists & Hands */}
                <g
                  onClick={() => onToggleZone('wrists_hands')}
                  onMouseEnter={() => setHoveredZone('wrists_hands')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('wrists_hands')}
                >
                  <title>Punhos & Mãos</title>
                  <ellipse cx="34" cy="164" rx="9" ry="13" transform="rotate(8 34 164)" />
                  <ellipse cx="126" cy="164" rx="9" ry="13" transform="rotate(-8 126 164)" />
                </g>

                {/* 8. Thighs & Knees */}
                <g
                  onClick={() => onToggleZone('thighs_knees')}
                  onMouseEnter={() => setHoveredZone('thighs_knees')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('thighs_knees')}
                >
                  <title>Coxas & Joelhos</title>
                  <rect x="56" y="170" width="21" height="68" rx="9" />
                  <rect x="83" y="170" width="21" height="68" rx="9" />
                </g>

                {/* 9. Calves, Ankles & Feet */}
                <g
                  onClick={() => onToggleZone('calves_ankles')}
                  onMouseEnter={() => setHoveredZone('calves_ankles')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('calves_ankles')}
                >
                  <title>Panturrilhas & Pés</title>
                  <path d="M58 241 L75 241 L73 305 L53 305 Z" />
                  <path d="M85 241 L102 241 L107 305 L87 305 Z" />
                </g>
              </g>
            </svg>
          </div>

          {/* BACK VIEW */}
          <div
            className={`flex flex-col items-center ${
              activeSide === 'back' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-300 mb-1">
              Vista Posterior (Costas)
            </span>
            <svg
              viewBox="0 0 160 320"
              className="w-36 sm:w-40 h-64 text-rosebrand-300 dark:text-zinc-400 select-none"
            >
              <g className="cursor-pointer transition-all duration-200">
                {/* 1. Occipital / Head Back */}
                <g
                  onClick={() => onToggleZone('head_jaw')}
                  onMouseEnter={() => setHoveredZone('head_jaw')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('head_jaw')}
                >
                  <title>Cabeça / Base do Crânio</title>
                  <ellipse cx="80" cy="30" rx="18" ry="22" />
                </g>

                {/* 2. Cervical Back */}
                <g
                  onClick={() => onToggleZone('neck_cervical')}
                  onMouseEnter={() => setHoveredZone('neck_cervical')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('neck_cervical')}
                >
                  <title>Pescoço & Cervical</title>
                  <rect x="70" y="51" width="20" height="15" rx="4" />
                  <circle cx="75" cy="58" r="2.5" fill="#e11d56" opacity={isSelected('neck_cervical') ? 1 : 0.4} />
                  <circle cx="85" cy="58" r="2.5" fill="#e11d56" opacity={isSelected('neck_cervical') ? 1 : 0.4} />
                </g>

                {/* 3. Trapezius & Shoulders */}
                <g
                  onClick={() => onToggleZone('shoulders_trapezius')}
                  onMouseEnter={() => setHoveredZone('shoulders_trapezius')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('shoulders_trapezius')}
                >
                  <title>Ombros & Trapézio</title>
                  <path d="M40 68 Q58 58 70 65 L90 65 Q102 58 120 68 L114 84 L46 84 Z" />
                  <circle cx="58" cy="73" r="3" fill="#e11d56" opacity={isSelected('shoulders_trapezius') ? 1 : 0.4} />
                  <circle cx="102" cy="73" r="3" fill="#e11d56" opacity={isSelected('shoulders_trapezius') ? 1 : 0.4} />
                </g>

                {/* 4. Upper Back / Scapula */}
                <g
                  onClick={() => onToggleZone('upper_back')}
                  onMouseEnter={() => setHoveredZone('upper_back')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('upper_back')}
                >
                  <title>Costas Superiores (Escápulas)</title>
                  <rect x="52" y="85" width="56" height="36" rx="6" />
                  <circle cx="66" cy="98" r="3" fill="#e11d56" opacity={isSelected('upper_back') ? 1 : 0.4} />
                  <circle cx="94" cy="98" r="3" fill="#e11d56" opacity={isSelected('upper_back') ? 1 : 0.4} />
                </g>

                {/* 5. Lower Back (Lumbar) */}
                <g
                  onClick={() => onToggleZone('lower_back')}
                  onMouseEnter={() => setHoveredZone('lower_back')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('lower_back')}
                >
                  <title>Lombar</title>
                  <rect x="56" y="123" width="48" height="28" rx="6" />
                </g>

                {/* 6. Hips & Glutes */}
                <g
                  onClick={() => onToggleZone('hips_glutes')}
                  onMouseEnter={() => setHoveredZone('hips_glutes')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('hips_glutes')}
                >
                  <title>Quadril & Glúteos</title>
                  <path d="M53 153 L107 153 L109 180 Q80 188 51 180 Z" />
                  <circle cx="64" cy="166" r="3" fill="#e11d56" opacity={isSelected('hips_glutes') ? 1 : 0.4} />
                  <circle cx="96" cy="166" r="3" fill="#e11d56" opacity={isSelected('hips_glutes') ? 1 : 0.4} />
                </g>

                {/* 7. Arms & Elbows Back */}
                <g
                  onClick={() => onToggleZone('arms_elbows')}
                  onMouseEnter={() => setHoveredZone('arms_elbows')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('arms_elbows')}
                >
                  <title>Braços & Cotovelos</title>
                  <rect x="33" y="82" width="16" height="68" rx="8" transform="rotate(6 41 116)" />
                  <rect x="111" y="82" width="16" height="68" rx="8" transform="rotate(-6 119 116)" />
                </g>

                {/* 8. Wrists & Hands Back */}
                <g
                  onClick={() => onToggleZone('wrists_hands')}
                  onMouseEnter={() => setHoveredZone('wrists_hands')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('wrists_hands')}
                >
                  <title>Punhos & Mãos</title>
                  <ellipse cx="34" cy="164" rx="9" ry="13" transform="rotate(8 34 164)" />
                  <ellipse cx="126" cy="164" rx="9" ry="13" transform="rotate(-8 126 164)" />
                </g>

                {/* 9. Thighs & Knees Back */}
                <g
                  onClick={() => onToggleZone('thighs_knees')}
                  onMouseEnter={() => setHoveredZone('thighs_knees')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('thighs_knees')}
                >
                  <title>Coxas & Joelhos</title>
                  <rect x="56" y="183" width="21" height="56" rx="9" />
                  <rect x="83" y="183" width="21" height="56" rx="9" />
                </g>

                {/* 10. Calves & Heels */}
                <g
                  onClick={() => onToggleZone('calves_ankles')}
                  onMouseEnter={() => setHoveredZone('calves_ankles')}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={getRegionStyle('calves_ankles')}
                >
                  <title>Panturrilhas & Pés</title>
                  <path d="M58 241 L75 241 L73 305 L53 305 Z" />
                  <path d="M85 241 L102 241 L107 305 L87 305 Z" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Column: Quick Toggle Buttons + Clinical Tooltip */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {BODY_ZONES.map((zone) => {
              const active = isSelected(zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onToggleZone(zone.id)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-medium border text-left flex items-center gap-1.5 transition ${
                    active
                      ? 'bg-rosebrand-500 border-rosebrand-500 text-white font-semibold shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rosebrand-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{zone.emoji}</span>
                  <span className="truncate">{zone.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Contextual Clinical Info Box */}
          <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-rosebrand-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 min-h-[60px] flex items-center">
            {inspectedZone ? (
              <div>
                <span className="font-bold text-rosebrand-600 dark:text-rosebrand-400 block">
                  {inspectedZone.emoji} {inspectedZone.label}
                </span>
                <span>{inspectedZone.clinicalNote}</span>
              </div>
            ) : (
              <span>
                💡 <strong>Dica:</strong> Mapear onde a dor se concentra ajuda a diferenciar dores
                miofasciais localizadas de crises generalizadas da fibromialgia.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
