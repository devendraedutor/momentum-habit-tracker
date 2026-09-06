export interface LevelMeta {
  level: number;
  title: string;
  mindsetTag: string;
  celebrationMessage?: string;
  punchline?: string;
  badgeIcon: string;
  gradient: string;
  buttonGradient: string;
  buttonShadow: string;
  pillStyle: string;
  levelBadgeStyle: string;
  haloColor: string;
  cardMaterial: string;
  buttonText: string;
  audioFrequency: number;
}

export const ASCENSION_META: Record<number, LevelMeta> = {
  1: {
    level: 1,
    title: "Spark",
    mindsetTag: "Spark",
    badgeIcon: "🌱",
    gradient: "from-emerald-400 to-teal-500",
    buttonGradient: "from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white",
    buttonShadow: "shadow-emerald-500/30",
    pillStyle: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
    levelBadgeStyle: "from-emerald-400 to-teal-500 text-slate-950 font-black",
    haloColor: "bg-emerald-500",
    cardMaterial: "bg-gradient-to-b from-emerald-950/70 via-slate-950/95 to-teal-950/80 border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.35)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 523.25 // C5
  },
  2: {
    level: 2,
    title: "Momentum",
    mindsetTag: "Momentum",
    badgeIcon: "⚡",
    gradient: "from-cyan-400 to-blue-500",
    buttonGradient: "from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white",
    buttonShadow: "shadow-cyan-500/35",
    pillStyle: "bg-cyan-500/15 border-cyan-400/30 text-cyan-300",
    levelBadgeStyle: "from-cyan-400 to-blue-500 text-slate-950 font-black",
    haloColor: "bg-cyan-500",
    cardMaterial: "bg-gradient-to-b from-blue-950/70 via-slate-950/95 to-cyan-950/80 border-2 border-cyan-400/90 shadow-[0_0_60px_rgba(6,182,212,0.45)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 587.33 // D5
  },
  3: {
    level: 3,
    title: "Consistency",
    mindsetTag: "Consistency",
    badgeIcon: "🛡️",
    gradient: "from-indigo-400 to-violet-500",
    buttonGradient: "from-indigo-500 via-violet-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white",
    buttonShadow: "shadow-indigo-500/35",
    pillStyle: "bg-indigo-500/15 border-indigo-400/30 text-indigo-300",
    levelBadgeStyle: "from-indigo-400 to-violet-600 text-white font-black",
    haloColor: "bg-indigo-500",
    cardMaterial: "bg-gradient-to-b from-indigo-950/80 via-slate-950/95 to-violet-950/80 border-2 border-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.45)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 659.25 // E5
  },
  4: {
    level: 4,
    title: "Discipline",
    mindsetTag: "Discipline",
    badgeIcon: "🔥",
    gradient: "from-amber-400 to-orange-500",
    buttonGradient: "from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white",
    buttonShadow: "shadow-amber-500/35",
    pillStyle: "bg-amber-500/15 border-amber-400/30 text-amber-300",
    levelBadgeStyle: "from-amber-400 to-orange-500 text-slate-950 font-black",
    haloColor: "bg-amber-500",
    cardMaterial: "bg-gradient-to-b from-amber-950/80 via-slate-950/95 to-orange-950/80 border-2 border-amber-400 shadow-[0_0_70px_rgba(245,158,11,0.55)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 783.99 // G5
  },
  5: {
    level: 5,
    title: "Master",
    mindsetTag: "Master",
    badgeIcon: "💎",
    gradient: "from-fuchsia-400 to-pink-500",
    buttonGradient: "from-fuchsia-500 via-pink-500 to-rose-600 hover:from-fuchsia-400 hover:to-pink-500 text-white",
    buttonShadow: "shadow-fuchsia-500/35",
    pillStyle: "bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300",
    levelBadgeStyle: "from-fuchsia-400 to-pink-500 text-white font-black",
    haloColor: "bg-fuchsia-500",
    cardMaterial: "bg-gradient-to-b from-fuchsia-950/80 via-slate-950/95 to-pink-950/80 border-2 border-fuchsia-400 shadow-[0_0_70px_rgba(217,70,239,0.55)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 880.00 // A5
  },
  6: {
    level: 6,
    title: "Iron Will",
    mindsetTag: "Iron Will",
    badgeIcon: "👑",
    gradient: "from-rose-500 to-red-600",
    buttonGradient: "from-rose-500 via-red-500 to-rose-600 hover:from-rose-400 hover:to-red-500 text-white",
    buttonShadow: "shadow-rose-500/35",
    pillStyle: "bg-rose-500/15 border-rose-400/30 text-rose-300",
    levelBadgeStyle: "from-rose-500 to-red-600 text-white font-black",
    haloColor: "bg-rose-500",
    cardMaterial: "bg-gradient-to-b from-rose-950/80 via-slate-950/95 to-red-950/80 border-2 border-rose-500 shadow-[0_0_70px_rgba(244,63,94,0.55)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 987.77 // B5
  },
  7: {
    level: 7,
    title: "Unbreakable",
    mindsetTag: "Unbreakable",
    badgeIcon: "⚡",
    gradient: "from-yellow-300 via-amber-400 to-yellow-500",
    buttonGradient: "from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black",
    buttonShadow: "shadow-amber-500/45",
    pillStyle: "bg-amber-500/20 border-amber-400/40 text-amber-300",
    levelBadgeStyle: "from-yellow-300 to-amber-500 text-slate-950 font-black",
    haloColor: "bg-amber-400",
    cardMaterial: "bg-gradient-to-b from-yellow-950/90 via-slate-950/95 to-amber-950/90 border-2 border-yellow-300 shadow-[0_0_80px_rgba(234,179,8,0.65)]",
    buttonText: "CLAIM ASCENSION",
    audioFrequency: 1046.50 // C6
  }
};

export function getLevelMeta(level: number): LevelMeta {
  const safeLevel = Math.max(1, Math.min(7, level));
  return ASCENSION_META[safeLevel] || ASCENSION_META[1];
}
