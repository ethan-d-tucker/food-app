export interface ExerciseItem {
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'walking';
  caloriesPerMinute: number;
  defaultIntensity: 'light' | 'moderate' | 'intense';
}

export const commonExercises: ExerciseItem[] = [
  // Cardio
  { name: "Running", type: "cardio", caloriesPerMinute: 11, defaultIntensity: "intense" },
  { name: "Jogging", type: "cardio", caloriesPerMinute: 8, defaultIntensity: "moderate" },
  { name: "Cycling", type: "cardio", caloriesPerMinute: 8, defaultIntensity: "moderate" },
  { name: "Swimming", type: "cardio", caloriesPerMinute: 10, defaultIntensity: "intense" },
  { name: "Jump Rope", type: "cardio", caloriesPerMinute: 12, defaultIntensity: "intense" },
  { name: "Elliptical", type: "cardio", caloriesPerMinute: 7, defaultIntensity: "moderate" },
  { name: "Rowing", type: "cardio", caloriesPerMinute: 9, defaultIntensity: "moderate" },
  { name: "Stair Climbing", type: "cardio", caloriesPerMinute: 9, defaultIntensity: "moderate" },
  { name: "Dancing", type: "cardio", caloriesPerMinute: 6, defaultIntensity: "moderate" },
  { name: "HIIT Workout", type: "cardio", caloriesPerMinute: 13, defaultIntensity: "intense" },

  // Strength
  { name: "Weight Lifting", type: "strength", caloriesPerMinute: 6, defaultIntensity: "moderate" },
  { name: "Push-ups", type: "strength", caloriesPerMinute: 7, defaultIntensity: "moderate" },
  { name: "Pull-ups", type: "strength", caloriesPerMinute: 8, defaultIntensity: "intense" },
  { name: "Squats", type: "strength", caloriesPerMinute: 6, defaultIntensity: "moderate" },
  { name: "Deadlifts", type: "strength", caloriesPerMinute: 7, defaultIntensity: "intense" },
  { name: "Bench Press", type: "strength", caloriesPerMinute: 5, defaultIntensity: "moderate" },
  { name: "Resistance Bands", type: "strength", caloriesPerMinute: 4, defaultIntensity: "light" },
  { name: "Kettlebell Workout", type: "strength", caloriesPerMinute: 9, defaultIntensity: "intense" },

  // Flexibility
  { name: "Yoga", type: "flexibility", caloriesPerMinute: 4, defaultIntensity: "light" },
  { name: "Stretching", type: "flexibility", caloriesPerMinute: 3, defaultIntensity: "light" },
  { name: "Pilates", type: "flexibility", caloriesPerMinute: 5, defaultIntensity: "moderate" },
  { name: "Tai Chi", type: "flexibility", caloriesPerMinute: 3, defaultIntensity: "light" },

  // Sports
  { name: "Basketball", type: "sports", caloriesPerMinute: 8, defaultIntensity: "intense" },
  { name: "Tennis", type: "sports", caloriesPerMinute: 7, defaultIntensity: "moderate" },
  { name: "Soccer", type: "sports", caloriesPerMinute: 9, defaultIntensity: "intense" },
  { name: "Volleyball", type: "sports", caloriesPerMinute: 5, defaultIntensity: "moderate" },
  { name: "Golf", type: "sports", caloriesPerMinute: 4, defaultIntensity: "light" },
  { name: "Rock Climbing", type: "sports", caloriesPerMinute: 10, defaultIntensity: "intense" },

  // Walking
  { name: "Walking", type: "walking", caloriesPerMinute: 4, defaultIntensity: "light" },
  { name: "Brisk Walking", type: "walking", caloriesPerMinute: 5, defaultIntensity: "moderate" },
  { name: "Hiking", type: "walking", caloriesPerMinute: 7, defaultIntensity: "moderate" },
  { name: "Dog Walking", type: "walking", caloriesPerMinute: 4, defaultIntensity: "light" },
];
