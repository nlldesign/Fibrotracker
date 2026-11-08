import {
  BodyZoneId,
  BodyZoneMeta,
  PainQualityKey,
  ReliefActionKey,
  TriggerKey,
} from '../types/record';

export const TRIGGER_METADATA: Record<
  TriggerKey,
  { key: TriggerKey; pillLabel: string; radarLabel: string; emoji: string }
> = {
  rigidez: {
    key: 'rigidez',
    pillLabel: '🦴 Rigidez matinal',
    radarLabel: '🦴 Rigidez matinal prolongada',
    emoji: '🦴',
  },
  alodinia: {
    key: 'alodinia',
    pillLabel: '🪶 Dor ao toque / roupa',
    radarLabel: '🪶 Alodinia (dor ao toque leve)',
    emoji: '🪶',
  },
  estresse: {
    key: 'estresse',
    pillLabel: '🧠 Pico de estresse',
    radarLabel: '🧠 Sobrecarga emocional / Estresse',
    emoji: '🧠',
  },
  clima: {
    key: 'clima',
    pillLabel: '🌧️ Mudança de clima / Frio',
    radarLabel: '🌧️ Oscilação de clima / Pressão atmosférica',
    emoji: '🌧️',
  },
  esforco: {
    key: 'esforco',
    pillLabel: '🏃‍♀️ Esforço além do limite (PEM)',
    radarLabel: '🏃‍♀️ Excesso de esforço prévio (Efeito Rebote)',
    emoji: '🏃‍♀️',
  },
  hormonal: {
    key: 'hormonal',
    pillLabel: '🩸 TPM / Ciclo menstrual',
    radarLabel: '🩸 Oscilação hormonal (Fase Lútea / Menstruação)',
    emoji: '🩸',
  },
  sensorial: {
    key: 'sensorial',
    pillLabel: '🔊 Luz forte / Barulho / Cheiros',
    radarLabel: '🔊 Hipersensibilidade sensorial (Luz/Som/Odor)',
    emoji: '🔊',
  },
  intestino: {
    key: 'intestino',
    pillLabel: '🤢 Intestino irritável / Estufamento',
    radarLabel: '🤢 Desconforto gastrointestinal (SII)',
    emoji: '🤢',
  },
};

export const PAIN_QUALITY_METADATA: Record<
  PainQualityKey,
  { key: PainQualityKey; label: string; emoji: string; desc: string }
> = {
  peso: {
    key: 'peso',
    label: 'Peso / Corpo moído',
    emoji: '🪨',
    desc: 'Dor muscular difusa, sensação de gripe forte ou corpo pesado',
  },
  queimacao: {
    key: 'queimacao',
    label: 'Queimação / Ardência',
    emoji: '🔥',
    desc: 'Sensibilização central e hiperexcitabilidade nervosa na pele/músculos',
  },
  formigamento: {
    key: 'formigamento',
    label: 'Choque / Formigamento',
    emoji: '⚡',
    desc: 'Parestesia, dormência ou pequenos choques nas extremidades',
  },
  pontadas: {
    key: 'pontadas',
    label: 'Pontadas / Fisgadas',
    emoji: '🗡️',
    desc: 'Dor aguda localizada em pontos de tensão miofascial',
  },
};

export const RELIEF_ACTION_METADATA: Record<
  ReliefActionKey,
  { key: ReliefActionKey; label: string; emoji: string; isRescue?: boolean }
> = {
  med_continua: {
    key: 'med_continua',
    label: 'Medicação contínua em dia',
    emoji: '💊',
  },
  med_sos: {
    key: 'med_sos',
    label: 'Remédio de Resgate (SOS)',
    emoji: '🆘',
    isRescue: true,
  },
  calor_local: {
    key: 'calor_local',
    label: 'Bolsa morna / Banho quente',
    emoji: '🛁',
  },
  repouso: {
    key: 'repouso',
    label: 'Pacing / Pausa sensorial',
    emoji: '🛌',
  },
  movimento_leve: {
    key: 'movimento_leve',
    label: 'Alongamento / Movimento leve',
    emoji: '🧘‍♀️',
  },
};

export const SPOON_LEVELS: {
  spoons: number;
  label: string;
  desc: string;
  badgeColor: string;
}[] = [
  {
    spoons: 1,
    label: '1 Colher (Exaustão)',
    desc: 'Bateria zerada. Apenas tarefas vitais e repouso.',
    badgeColor: 'bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300',
  },
  {
    spoons: 2,
    label: '2 Colheres (Baixa)',
    desc: 'Fadiga alta. Priorize 1 tarefa leve e faça pausas.',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    spoons: 3,
    label: '3 Colheres (Moderada)',
    desc: 'Energia controlada. Respeite a regra dos 50% para não gerar rebote.',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-zinc-800 dark:text-amber-300',
  },
  {
    spoons: 4,
    label: '4 Colheres (Boa)',
    desc: 'Dia produtivo! Guarde 1 colher de reserva para amanhã.',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    spoons: 5,
    label: '5 Colheres (Bateria Cheia)',
    desc: 'Ótima disposição! Cuidado apenas para não exagerar (evite o Boom & Bust).',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
];

export const BODY_ZONES: BodyZoneMeta[] = [
  {
    id: 'head_jaw',
    label: 'Cabeça & Mandíbula (ATM)',
    shortLabel: 'Cabeça / ATM',
    emoji: '🤕',
    view: 'both',
    clinicalNote: 'Cefaleia tensional e bruxismo/disfunção temporomandibular (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'neck_cervical',
    label: 'Pescoço & Cervical',
    shortLabel: 'Cervical',
    emoji: '🦒',
    view: 'both',
    clinicalNote: 'Pontos sensíveis occipitais e cervicais baixos (1 região axial ACR).',
    acrWeight: 1,
  },
  {
    id: 'shoulders_trapezius',
    label: 'Ombros & Trapézio',
    shortLabel: 'Ombros / Trapézio',
    emoji: '🏋️‍♀️',
    view: 'both',
    clinicalNote: 'Cintura escapular bilateral — região mais clássica da fibromialgia (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'chest_ribs',
    label: 'Peito & Costelas',
    shortLabel: 'Tórax',
    emoji: '🫁',
    view: 'front',
    clinicalNote: 'Sensibilidade na segunda costela / ponto condrocostal (1 região axial ACR).',
    acrWeight: 1,
  },
  {
    id: 'upper_back',
    label: 'Costas Superiores (Escápulas)',
    shortLabel: 'Escápulas',
    emoji: '🪽',
    view: 'back',
    clinicalNote: 'Região dorsal/torácica e borda medial da escápula (1 região axial ACR).',
    acrWeight: 1,
  },
  {
    id: 'lower_back',
    label: 'Lombar',
    shortLabel: 'Lombar',
    emoji: '⚡',
    view: 'back',
    clinicalNote: 'Sobrecarga postural e rigidez ao levantar da cama (1 região axial ACR).',
    acrWeight: 1,
  },
  {
    id: 'abdomen',
    label: 'Abdômen & Pelve',
    shortLabel: 'Abdômen / Pelve',
    emoji: '🌸',
    view: 'front',
    clinicalNote: 'Sensibilidade visceral, intestino irritável ou cólicas associadas (1 região ACR).',
    acrWeight: 1,
  },
  {
    id: 'arms_elbows',
    label: 'Braços & Cotovelos',
    shortLabel: 'Braços / Cotovelos',
    emoji: '💪',
    view: 'both',
    clinicalNote: 'Sensibilidade epicondilar lateral e fadiga nos membros superiores (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'wrists_hands',
    label: 'Antebraços, Punhos & Mãos',
    shortLabel: 'Mãos / Punhos',
    emoji: '🤲',
    view: 'both',
    clinicalNote: 'Rigidez matinal nos dedos, parestesia ou sensação de inchaço (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'hips_glutes',
    label: 'Quadril & Glúteos',
    shortLabel: 'Quadril / Glúteos',
    emoji: '🍑',
    view: 'back',
    clinicalNote: 'Pontos glúteos superiores e grande trocânter — dor ao deitar de lado (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'thighs_knees',
    label: 'Coxas & Joelhos',
    shortLabel: 'Coxas / Joelhos',
    emoji: '🦵',
    view: 'both',
    clinicalNote: 'Sensibilidade no coxim medial do joelho e peso nas coxas (2 regiões ACR).',
    acrWeight: 2,
  },
  {
    id: 'calves_ankles',
    label: 'Panturrilhas & Pés',
    shortLabel: 'Panturrilhas / Pés',
    emoji: '🦶',
    view: 'both',
    clinicalNote: 'Pernas inferiores, cãibras noturnas ou fascite plantar (2 regiões ACR).',
    acrWeight: 2,
  },
];

export const BODY_ZONE_MAP: Record<BodyZoneId, BodyZoneMeta> = BODY_ZONES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<BodyZoneId, BodyZoneMeta>
);

export const CARE_PROTOCOLS = {
  red: {
    emoji: '🌺',
    riskText: 'Fase de Crise',
    subtext: 'Priorize Acolhimento',
    predIcon: '🫂',
    predTitle: 'Momento de Reduzir Estímulos',
    predDesc:
      'Você está enfrentando um pico de dor ou exaustão. Evite cobranças, reduza luz/ruído e respeite o tempo de recuperação do seu sistema nervoso.',
    miniBadge: 'Fase de Crise',
    miniDesc: 'Priorize repouso, baixa luminosidade e acolhimento hoje.',
    recommendations: [
      {
        icon: '🛁',
        title: 'Calor local:',
        desc: 'Banho morno ou bolsa térmica nos pontos de tensão mapeados.',
      },
      {
        icon: '🕶️',
        title: 'Redução sensorial:',
        desc: 'Diminua luzes brancas e ruídos intensos (modo escuro ativo).',
      },
      {
        icon: '🫁',
        title: 'Respiração lenta:',
        desc: 'Ajuda a reduzir a hiperatividade do sistema nervoso central.',
      },
      {
        icon: '💬',
        title: 'Economia de Colheres:',
        desc: 'Adie tarefas pesadas; seu corpo precisa poupar energia hoje.',
      },
    ],
  },
  yellow: {
    emoji: '🌼',
    riskText: 'Alerta Moderado',
    subtext: 'Sinais Prévios Ativos',
    predIcon: '⚠️',
    predTitle: 'Possível Crise nas Próximas 48h',
    predDesc:
      'Notamos acúmulo de fadiga (poucas colheres), sono não reparador ou rigidez recente. Desacelere hoje para evitar o efeito rebote (PEM).',
    miniBadge: 'Alerta Precoce',
    miniDesc: 'Sinais amarelos recentes detectados. Pegue leve hoje!',
    recommendations: [
      {
        icon: '⏸️',
        title: 'Regra dos 50%:',
        desc: 'Faça apenas metade do esforço físico que planejava hoje.',
      },
      {
        icon: '🌙',
        title: 'Higiene do sono:',
        desc: 'Desconecte-se de telas 1h antes de deitar para tentar sono profundo.',
      },
      {
        icon: '🧘‍♀️',
        title: 'Alongamento suave:',
        desc: 'Movimentos leves sem forçar articulações rígidas.',
      },
      {
        icon: '💧',
        title: 'Pausas cognitivas:',
        desc: 'Se notar fibrofog, anote lembretes e faça pausas de 10 min.',
      },
    ],
  },
  green: {
    emoji: '🌸',
    riskText: 'Baixo Risco',
    subtext: 'Fase Estável',
    predIcon: '✨',
    predTitle: 'Janela de Estabilidade',
    predDesc:
      'Seus indicadores recentes estão equilibrados. Ótimo período para movimento leve de baixo impacto, sempre guardando 1 colher de energia.',
    miniBadge: 'Ciclo Estável',
    miniDesc: 'Seus últimos dias estão equilibrados. Registre como está hoje!',
    recommendations: [
      {
        icon: '🚶‍♀️',
        title: 'Movimento leve:',
        desc: 'Caminhada tranquila, hidroginástica ou pilates adaptado.',
      },
      {
        icon: '🥄',
        title: 'Pacing (Guarde 1 Colher):',
        desc: 'Mesmo sem dor, evite gastar toda a bateria para não gerar rebote amanhã.',
      },
      {
        icon: '☀️',
        title: 'Rotina restauradora:',
        desc: 'Mantenha horários regulares de sono e hidratação.',
      },
      {
        icon: '📓',
        title: 'Constância:',
        desc: 'Continue registrando seus dias verdes para conhecer sua linha de base.',
      },
    ],
  },
};
