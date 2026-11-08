import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Anchor,
  Bed,
  BedDouble,
  Bone,
  BookOpen,
  Brain,
  Cloud,
  CloudMoon,
  CloudRain,
  Compass,
  Crosshair,
  Droplets,
  Dumbbell,
  EyeOff,
  Feather,
  FileSpreadsheet,
  FileText,
  Flame,
  Flower2,
  Footprints,
  Hand,
  Heart,
  HeartHandshake,
  Info,
  Layers,
  Moon,
  PauseCircle,
  PenLine,
  PersonStanding,
  Pill,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  ThermometerSun,
  Trash2,
  Volume2,
  Weight,
  Wind,
  Zap,
  ZapOff,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

export const SpoonIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15.5 4.5a4.5 4.5 0 0 1 3.18 7.68c-1.56 1.56-3.9 1.82-5.68.82L5.4 20.6a1.41 1.41 0 0 1-2-2l7.6-7.6c-1-1.78-.74-4.12.82-5.68A4.48 4.48 0 0 1 15.5 4.5Z" />
  </svg>
);

export const FlowerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Flower2 className={className} />
);

export type ClinicalIconName =
  // Triggers
  | 'rigidez'
  | 'alodinia'
  | 'estresse'
  | 'clima'
  | 'esforco'
  | 'hormonal'
  | 'sensorial'
  | 'intestino'
  // Pain Qualities
  | 'peso'
  | 'queimacao'
  | 'formigamento'
  | 'pontadas'
  // Relief Actions
  | 'med_continua'
  | 'med_sos'
  | 'calor_local'
  | 'repouso'
  | 'movimento_leve'
  // Sleep
  | 'sleep_bom'
  | 'sleep_leve'
  | 'sleep_insonia'
  // Fog
  | 'fog_claro'
  | 'fog_leve'
  | 'fog_intenso'
  // Cycle & Alerts
  | 'phase_green'
  | 'phase_yellow'
  | 'phase_red'
  | 'spoon'
  | 'body_zone'
  // Recommendations
  | 'rec_calor'
  | 'rec_sensorial'
  | 'rec_respiracao'
  | 'rec_colheres'
  | 'rec_pausa'
  | 'rec_sono'
  | 'rec_alongamento'
  | 'rec_agua'
  | 'rec_caminhada'
  | 'rec_rotina'
  | 'rec_diario';

export const ClinicalIcon: React.FC<{
  name: ClinicalIconName | string;
  className?: string;
}> = ({ name, className = 'w-4 h-4 shrink-0' }) => {
  switch (name) {
    // Triggers
    case 'rigidez':
      return <Bone className={className} />;
    case 'alodinia':
      return <Feather className={className} />;
    case 'estresse':
      return <Brain className={className} />;
    case 'clima':
      return <CloudRain className={className} />;
    case 'esforco':
      return <Dumbbell className={className} />;
    case 'hormonal':
      return <Moon className={className} />;
    case 'sensorial':
      return <Volume2 className={className} />;
    case 'intestino':
      return <Activity className={className} />;

    // Pain qualities
    case 'peso':
      return <Weight className={className} />;
    case 'queimacao':
      return <Flame className={className} />;
    case 'formigamento':
      return <Zap className={className} />;
    case 'pontadas':
      return <Crosshair className={className} />;

    // Relief Actions
    case 'med_continua':
      return <Pill className={className} />;
    case 'med_sos':
      return <ShieldAlert className={className} />;
    case 'calor_local':
      return <ThermometerSun className={className} />;
    case 'repouso':
      return <Bed className={className} />;
    case 'movimento_leve':
      return <PersonStanding className={className} />;

    // Sleep
    case 'sleep_bom':
      return <BedDouble className={className} />;
    case 'sleep_leve':
      return <CloudMoon className={className} />;
    case 'sleep_insonia':
      return <ZapOff className={className} />;

    // Fog
    case 'fog_claro':
      return <Sparkles className={className} />;
    case 'fog_leve':
      return <Cloud className={className} />;
    case 'fog_intenso':
      return <Wind className={className} />;

    // Phases
    case 'phase_green':
      return <Flower2 className={className} />;
    case 'phase_yellow':
      return <AlertTriangle className={className} />;
    case 'phase_red':
      return <HeartHandshake className={className} />;

    case 'spoon':
      return <SpoonIcon className={className} />;
    case 'body_zone':
      return <Compass className={className} />;

    // Protocol recommendations
    case 'rec_calor':
      return <ThermometerSun className={className} />;
    case 'rec_sensorial':
      return <EyeOff className={className} />;
    case 'rec_respiracao':
      return <Wind className={className} />;
    case 'rec_colheres':
      return <SpoonIcon className={className} />;
    case 'rec_pausa':
      return <PauseCircle className={className} />;
    case 'rec_sono':
      return <Moon className={className} />;
    case 'rec_alongamento':
      return <PersonStanding className={className} />;
    case 'rec_agua':
      return <Droplets className={className} />;
    case 'rec_caminhada':
      return <Footprints className={className} />;
    case 'rec_rotina':
      return <Sun className={className} />;
    case 'rec_diario':
      return <BookOpen className={className} />;

    default:
      return <Sparkles className={className} />;
  }
};

export {
  Activity,
  AlertCircle,
  AlertTriangle,
  Anchor,
  BarChart3,
  Bed,
  BedDouble,
  Bone,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudMoon,
  CloudRain,
  Compass,
  Crosshair,
  Download,
  Droplets,
  Dumbbell,
  EyeOff,
  Feather,
  FileSpreadsheet,
  FileText,
  Flame,
  Flower2,
  Footprints,
  Hand,
  Heart,
  HeartHandshake,
  Info,
  Layers,
  Moon,
  PauseCircle,
  PenLine,
  PersonStanding,
  Pill,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Sun,
  ThermometerSun,
  Trash2,
  Volume2,
  Weight,
  Wind,
  Zap,
  ZapOff,
};
