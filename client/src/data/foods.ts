export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string;
}

export const commonFoods: FoodItem[] = [
  // Breakfast
  { name: "Oatmeal (1 cup)", calories: 154, protein: 5, carbs: 27, fat: 3, fiber: 4, category: "breakfast" },
  { name: "Scrambled Eggs (2)", calories: 182, protein: 12, carbs: 2, fat: 14, fiber: 0, category: "breakfast" },
  { name: "Greek Yogurt", calories: 130, protein: 17, carbs: 6, fat: 4, fiber: 0, category: "breakfast" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, category: "breakfast" },
  { name: "Toast with Butter", calories: 167, protein: 4, carbs: 20, fat: 8, fiber: 1, category: "breakfast" },
  { name: "Avocado Toast", calories: 280, protein: 7, carbs: 28, fat: 16, fiber: 7, category: "breakfast" },
  { name: "Smoothie Bowl", calories: 340, protein: 10, carbs: 58, fat: 8, fiber: 6, category: "breakfast" },
  { name: "Pancakes (3)", calories: 350, protein: 8, carbs: 50, fat: 12, fiber: 1, category: "breakfast" },
  { name: "Cereal with Milk", calories: 220, protein: 7, carbs: 38, fat: 4, fiber: 3, category: "breakfast" },
  { name: "Breakfast Burrito", calories: 450, protein: 20, carbs: 40, fat: 22, fiber: 3, category: "breakfast" },

  // Lunch
  { name: "Chicken Salad", calories: 350, protein: 30, carbs: 12, fat: 20, fiber: 4, category: "lunch" },
  { name: "Turkey Sandwich", calories: 380, protein: 25, carbs: 40, fat: 12, fiber: 3, category: "lunch" },
  { name: "Caesar Salad", calories: 300, protein: 15, carbs: 18, fat: 18, fiber: 3, category: "lunch" },
  { name: "Soup & Bread", calories: 320, protein: 12, carbs: 45, fat: 10, fiber: 5, category: "lunch" },
  { name: "Grilled Chicken Wrap", calories: 420, protein: 32, carbs: 38, fat: 14, fiber: 3, category: "lunch" },
  { name: "Tuna Sandwich", calories: 390, protein: 28, carbs: 36, fat: 14, fiber: 2, category: "lunch" },
  { name: "Veggie Bowl", calories: 380, protein: 14, carbs: 52, fat: 12, fiber: 9, category: "lunch" },
  { name: "BLT Sandwich", calories: 340, protein: 15, carbs: 30, fat: 18, fiber: 2, category: "lunch" },
  { name: "Burrito Bowl", calories: 520, protein: 28, carbs: 55, fat: 18, fiber: 8, category: "lunch" },
  { name: "Poke Bowl", calories: 460, protein: 30, carbs: 50, fat: 14, fiber: 4, category: "lunch" },

  // Dinner
  { name: "Grilled Salmon", calories: 420, protein: 40, carbs: 0, fat: 28, fiber: 0, category: "dinner" },
  { name: "Chicken Breast & Rice", calories: 450, protein: 38, carbs: 45, fat: 8, fiber: 1, category: "dinner" },
  { name: "Pasta with Sauce", calories: 480, protein: 16, carbs: 68, fat: 14, fiber: 4, category: "dinner" },
  { name: "Steak & Vegetables", calories: 520, protein: 42, carbs: 15, fat: 30, fiber: 5, category: "dinner" },
  { name: "Stir Fry with Rice", calories: 440, protein: 25, carbs: 52, fat: 14, fiber: 4, category: "dinner" },
  { name: "Tacos (3)", calories: 480, protein: 24, carbs: 42, fat: 22, fiber: 4, category: "dinner" },
  { name: "Pizza (2 slices)", calories: 550, protein: 20, carbs: 60, fat: 24, fiber: 3, category: "dinner" },
  { name: "Burger & Fries", calories: 750, protein: 30, carbs: 65, fat: 40, fiber: 4, category: "dinner" },
  { name: "Sushi Roll (8 pcs)", calories: 350, protein: 18, carbs: 48, fat: 8, fiber: 2, category: "dinner" },
  { name: "Grilled Chicken Salad", calories: 380, protein: 35, carbs: 15, fat: 20, fiber: 5, category: "dinner" },
  { name: "Fish & Chips", calories: 600, protein: 25, carbs: 55, fat: 30, fiber: 3, category: "dinner" },
  { name: "Lasagna", calories: 520, protein: 24, carbs: 42, fat: 26, fiber: 3, category: "dinner" },

  // Snacks
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, category: "snack" },
  { name: "Almonds (1 oz)", calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3, category: "snack" },
  { name: "Protein Bar", calories: 210, protein: 20, carbs: 22, fat: 8, fiber: 3, category: "snack" },
  { name: "String Cheese", calories: 80, protein: 7, carbs: 1, fat: 5, fiber: 0, category: "snack" },
  { name: "Trail Mix (1/4 cup)", calories: 175, protein: 5, carbs: 16, fat: 11, fiber: 2, category: "snack" },
  { name: "Hummus & Veggies", calories: 150, protein: 5, carbs: 14, fat: 8, fiber: 4, category: "snack" },
  { name: "Chips", calories: 230, protein: 3, carbs: 24, fat: 14, fiber: 1, category: "snack" },
  { name: "Cookie", calories: 180, protein: 2, carbs: 25, fat: 8, fiber: 0, category: "snack" },
  { name: "Candy Bar", calories: 250, protein: 3, carbs: 35, fat: 12, fiber: 1, category: "snack" },
  { name: "Ice Cream (1 scoop)", calories: 200, protein: 3, carbs: 24, fat: 10, fiber: 0, category: "snack" },
  { name: "Popcorn (3 cups)", calories: 110, protein: 3, carbs: 20, fat: 2, fiber: 3, category: "snack" },
  { name: "Orange", calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3, category: "snack" },
  { name: "Peanut Butter (2 tbsp)", calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, category: "snack" },
  { name: "Granola Bar", calories: 150, protein: 3, carbs: 25, fat: 5, fiber: 2, category: "snack" },

  // Drinks
  { name: "Coffee with Cream", calories: 60, protein: 1, carbs: 2, fat: 5, fiber: 0, category: "snack" },
  { name: "Latte", calories: 150, protein: 8, carbs: 15, fat: 6, fiber: 0, category: "snack" },
  { name: "Orange Juice", calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0, category: "snack" },
  { name: "Smoothie", calories: 250, protein: 8, carbs: 42, fat: 4, fiber: 3, category: "snack" },
  { name: "Soda", calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, category: "snack" },
  { name: "Protein Shake", calories: 180, protein: 25, carbs: 8, fat: 4, fiber: 1, category: "snack" },
];
