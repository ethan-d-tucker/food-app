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

export async function searchFoods(query: string): Promise<NormalizedFood[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&fields=product_name,nutriments,code,image_small_url,image_url,serving_size`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Critter-FoodTracker/1.0' },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const products = data.products || [];

  return products
    .map(normalizeProduct)
    .filter((p: NormalizedFood | null): p is NormalizedFood => p !== null && p.calories > 0);
}

export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Critter-FoodTracker/1.0' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1) return null;

  return normalizeProduct(data.product);
}
