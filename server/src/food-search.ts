export interface NormalizedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  barcode: string;
  image_url: string;
  serving_size: string;
  serving_grams: number | null;
}

// USDA nutrient IDs
const NUTRIENT_ENERGY = 1008;
const NUTRIENT_PROTEIN = 1003;
const NUTRIENT_CARBS = 1005;
const NUTRIENT_FAT = 1004;
const NUTRIENT_FIBER = 1079;

// --- In-memory cache ---

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX = 200;
const cache = new Map<string, { data: any; ts: number }>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache(key: string, data: any) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value!;
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

// --- USDA FoodData Central helpers ---

function getNutrient(food: any, nutrientId: number): number {
  const n = food.foodNutrients?.find((n: any) => n.nutrientId === nutrientId);
  return n?.value || 0;
}

function titleCase(str: string): string {
  // Only convert if mostly uppercase (USDA style), leave mixed-case alone
  if (str !== str.toUpperCase()) return str;
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeUSDA(food: any): NormalizedFood | null {
  const calories = Math.round(getNutrient(food, NUTRIENT_ENERGY));
  if (calories <= 0) return null;

  const isBranded = food.dataType === 'Branded';
  let name = food.description || '';
  // USDA names are ALL CAPS — convert to title case
  if (name === name.toUpperCase()) {
    name = titleCase(name);
  }
  if (isBranded && food.brandOwner) {
    name = `${name} (${titleCase(food.brandOwner)})`;
  }

  // Serving size: branded foods have servingSize in grams, generic foods are per 100g
  const servingGrams = food.servingSize ? Math.round(parseFloat(food.servingSize)) : 100;
  let servingDesc = 'per 100g';
  if (food.householdServingFullText) {
    servingDesc = titleCase(food.householdServingFullText);
  } else if (food.servingSize) {
    servingDesc = `${servingGrams}g`;
  }

  // USDA branded nutrients are per serving; generic (Foundation/SR Legacy) are per 100g
  const scale = isBranded ? 1 : 1; // both already in their stated units

  return {
    name,
    calories,
    protein: Math.round(getNutrient(food, NUTRIENT_PROTEIN) * scale * 10) / 10,
    carbs: Math.round(getNutrient(food, NUTRIENT_CARBS) * scale * 10) / 10,
    fat: Math.round(getNutrient(food, NUTRIENT_FAT) * scale * 10) / 10,
    fiber: Math.round(getNutrient(food, NUTRIENT_FIBER) * scale * 10) / 10,
    barcode: food.gtinUpc || '',
    image_url: '',
    serving_size: servingDesc,
    serving_grams: servingGrams,
  };
}

// --- Public API: Search via USDA FoodData Central ---

const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';

export async function searchFoods(query: string): Promise<NormalizedFood[]> {
  const cacheKey = `usda:search:${query.toLowerCase().trim()}`;
  const cached = getCached<NormalizedFood[]>(cacheKey);
  if (cached) return cached;

  const baseParams = `api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&` +
    `nutrients=${NUTRIENT_ENERGY}&nutrients=${NUTRIENT_PROTEIN}&nutrients=${NUTRIENT_CARBS}&nutrients=${NUTRIENT_FAT}&nutrients=${NUTRIENT_FIBER}`;

  // Search generic foods (Foundation + SR Legacy) and branded in parallel
  const [genericRes, brandedRes] = await Promise.all([
    fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${baseParams}&pageSize=10&dataType=Foundation,SR%20Legacy`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null),
    fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${baseParams}&pageSize=15&dataType=Branded`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null),
  ]);

  const genericFoods = genericRes?.ok ? (await genericRes.json()).foods || [] : [];
  const brandedFoods = brandedRes?.ok ? (await brandedRes.json()).foods || [] : [];

  // Prioritize generic foods first, then branded
  const allFoods = [...genericFoods, ...brandedFoods];

  const results = allFoods
    .map(normalizeUSDA)
    .filter((f: NormalizedFood | null): f is NormalizedFood => f !== null)
    // Deduplicate by name (USDA often has many similar entries)
    .filter((f: NormalizedFood, i: number, arr: NormalizedFood[]) =>
      arr.findIndex(x => x.name.toLowerCase() === f.name.toLowerCase()) === i
    )
    .slice(0, 20);

  setCache(cacheKey, results);
  return results;
}

// --- Public API: Barcode lookup via Open Food Facts ---

export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const cacheKey = `off:barcode:${barcode}`;
  const cached = getCached<NormalizedFood | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Critter-FoodTracker/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product?.product_name) return null;

    const p = data.product;
    const n = p.nutriments || {};
    const hasServing = n['energy-kcal_serving'] !== undefined;
    const suffix = hasServing ? '_serving' : '_100g';

    let calories = Math.round(n[`energy-kcal${suffix}`] || n['energy-kcal_100g'] || 0);
    // kJ to kcal sanity check
    if ((n['energy-kcal_100g'] || 0) > 900) {
      calories = Math.round((n[`energy-kcal${suffix}`] || n['energy-kcal_100g'] || 0) / 4.184);
    }

    const servingSizeStr = p.serving_size || (hasServing ? 'per serving' : 'per 100g');
    const gramsMatch = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*g(?:\b|$)/i);
    const servingGrams = gramsMatch ? parseFloat(gramsMatch[1]) : (hasServing ? null : 100);

    const result: NormalizedFood = {
      name: p.product_name,
      calories,
      protein: Math.round((n[`proteins${suffix}`] || n['proteins_100g'] || 0) * 10) / 10,
      carbs: Math.round((n[`carbohydrates${suffix}`] || n['carbohydrates_100g'] || 0) * 10) / 10,
      fat: Math.round((n[`fat${suffix}`] || n['fat_100g'] || 0) * 10) / 10,
      fiber: Math.round((n[`fiber${suffix}`] || n['fiber_100g'] || 0) * 10) / 10,
      barcode,
      image_url: p.image_small_url || p.image_url || '',
      serving_size: servingSizeStr,
      serving_grams: servingGrams,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
