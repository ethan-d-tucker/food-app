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
}

function normalizeProduct(product: any): NormalizedFood | null {
  if (!product || !product.product_name) return null;

  const n = product.nutriments || {};
  // Prefer per-serving values, fall back to per-100g
  const hasServing = n['energy-kcal_serving'] !== undefined;
  const suffix = hasServing ? '_serving' : '_100g';

  return {
    name: product.product_name,
    calories: Math.round(n[`energy-kcal${suffix}`] || n['energy-kcal_100g'] || 0),
    protein: Math.round((n[`proteins${suffix}`] || n['proteins_100g'] || 0) * 10) / 10,
    carbs: Math.round((n[`carbohydrates${suffix}`] || n['carbohydrates_100g'] || 0) * 10) / 10,
    fat: Math.round((n[`fat${suffix}`] || n['fat_100g'] || 0) * 10) / 10,
    fiber: Math.round((n[`fiber${suffix}`] || n['fiber_100g'] || 0) * 10) / 10,
    barcode: product.code || '',
    image_url: product.image_small_url || product.image_url || '',
    serving_size: product.serving_size || (hasServing ? 'per serving' : 'per 100g'),
  };
}

// Simple in-memory cache with TTL
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

export async function searchFoods(query: string): Promise<NormalizedFood[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = getCached<NormalizedFood[]>(cacheKey);
  if (cached) return cached;

  const url = `https://us.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=30&lc=en&cc=us&sort_by=unique_scans_n&fields=product_name,nutriments,code,image_small_url,image_url,serving_size,lang,countries_tags`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Critter-FoodTracker/1.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const products = data.products || [];

  // Prefer English products, filter out non-English names
  const isLikelyEnglish = (p: any) => {
    const name = p.product_name || '';
    // Check if product has English language tag or US country tag
    if (p.lang === 'en') return true;
    if (p.countries_tags?.some((c: string) => c.includes('united-states') || c.includes('united-kingdom') || c.includes('canada') || c.includes('australia'))) return true;
    // Heuristic: mostly ASCII chars in name
    const asciiRatio = name.replace(/[^\x20-\x7E]/g, '').length / (name.length || 1);
    return asciiRatio > 0.8;
  };

  const results = products
    .filter(isLikelyEnglish)
    .map(normalizeProduct)
    .filter((p: NormalizedFood | null): p is NormalizedFood => p !== null && p.calories > 0)
    .slice(0, 20);

  setCache(cacheKey, results);
  return results;
}

export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const cacheKey = `barcode:${barcode}`;
  const cached = getCached<NormalizedFood | null>(cacheKey);
  if (cached !== undefined) return cached;

  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Critter-FoodTracker/1.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1) return null;

  const result = normalizeProduct(data.product);
  setCache(cacheKey, result);
  return result;
}
