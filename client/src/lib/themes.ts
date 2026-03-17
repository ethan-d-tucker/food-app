export interface TimeTheme {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  gradient: string;
  particleColor: string;
}

export interface SeasonTheme {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  particles: string[];
}

export function getTimeTheme(): TimeTheme {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { period: 'morning', gradient: 'from-amber-50/40 to-cream', particleColor: '#F2CC8F' };
  } else if (hour >= 12 && hour < 17) {
    return { period: 'afternoon', gradient: 'from-cream to-cream', particleColor: '#E07A5F' };
  } else if (hour >= 17 && hour < 21) {
    return { period: 'evening', gradient: 'from-orange-50/30 to-cream', particleColor: '#E07A5F' };
  } else {
    return { period: 'night', gradient: 'from-indigo-50/30 to-cream', particleColor: '#A8B5C8' };
  }
}

export function getSeasonTheme(): SeasonTheme {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) {
    return { season: 'spring', particles: ['🌸', '🌷', '🌿'] };
  } else if (month >= 5 && month <= 7) {
    return { season: 'summer', particles: ['☀️', '🌻', '✨'] };
  } else if (month >= 8 && month <= 10) {
    return { season: 'fall', particles: ['🍂', '🍁', '🍃'] };
  } else {
    return { season: 'winter', particles: ['❄️', '🌨️', '✨'] };
  }
}
