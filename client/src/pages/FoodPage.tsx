import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { commonFoods } from '../data/foods';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import BarcodeScanner from '../components/food/BarcodeScanner';
import { Plus, Search, X, Trash2, ScanBarcode, Loader2 } from 'lucide-react';

type FoodTab = 'quick' | 'search' | 'scan';

interface SearchFood {
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

function FoodCard({ food, selected, onClick }: { food: { name: string; calories: number; protein: number; carbs: number; fat: number }; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-colors btn-press ${
        selected ? 'bg-terracotta/10 border-2 border-terracotta' : 'bg-white border-2 border-transparent'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-brown text-sm">{food.name}</span>
        <span className="text-terracotta font-bold text-sm">{food.calories} cal</span>
      </div>
      <div className="flex gap-3 mt-1 text-xs text-brown-light">
        <span>P: {food.protein}g</span>
        <span>C: {food.carbs}g</span>
        <span>F: {food.fat}g</span>
      </div>
    </button>
  );
}

function AddFoodModal({ onClose }: { onClose: () => void }) {
  const { addFood } = useAppStore();
  const [tab, setTab] = useState<FoodTab>('quick');
  const [quickSearch, setQuickSearch] = useState('');
  const [apiSearch, setApiSearch] = useState('');
  const [apiResults, setApiResults] = useState<SearchFood[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number } | null>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  const [scanResult, setScanResult] = useState<SearchFood | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const debouncedApiSearch = useDebounce(apiSearch, 300);

  // API search effect
  useEffect(() => {
    if (!debouncedApiSearch.trim() || tab !== 'search') {
      setApiResults([]);
      return;
    }
    setApiLoading(true);
    api.searchFood(debouncedApiSearch).then((results) => {
      setApiResults(results);
      setApiLoading(false);
    }).catch(() => {
      setApiResults([]);
      setApiLoading(false);
    });
  }, [debouncedApiSearch, tab]);

  const filtered = quickSearch.trim()
    ? commonFoods.filter((f) => f.name.toLowerCase().includes(quickSearch.toLowerCase())).slice(0, 12)
    : commonFoods.slice(0, 12);

  const handleBarcodeScan = async (barcode: string) => {
    setScanLoading(true);
    setScanError('');
    try {
      const result = await api.lookupBarcode(barcode);
      setScanResult(result);
      setSelectedFood(result);
    } catch {
      setScanError('Product not found. Try searching by name instead.');
    }
    setScanLoading(false);
  };

  const handleAdd = async () => {
    if (customMode) {
      if (!custom.name || !custom.calories) return;
      await addFood({
        name: custom.name,
        calories: Number(custom.calories),
        protein: Number(custom.protein) || 0,
        carbs: Number(custom.carbs) || 0,
        fat: Number(custom.fat) || 0,
        fiber: Number(custom.fiber) || 0,
        meal_type: mealType,
      });
    } else if (selectedFood) {
      await addFood({
        name: selectedFood.name,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        fiber: selectedFood.fiber,
        meal_type: mealType,
      });
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-cream w-full max-w-[430px] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-brown">Add Food</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-dark btn-press">
            <X size={20} className="text-brown-light" />
          </button>
        </div>

        {/* Meal Type */}
        <div className="flex gap-2 mb-4">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMealType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium btn-press transition-colors ${
                mealType === t ? 'bg-terracotta text-white' : 'bg-white text-brown-light'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 bg-cream-dark rounded-xl p-1">
          {([
            { id: 'quick' as FoodTab, label: 'Quick Add' },
            { id: 'search' as FoodTab, label: 'Search' },
            { id: 'scan' as FoodTab, label: 'Scan', icon: <ScanBarcode size={14} /> },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedFood(null); setCustomMode(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                tab === t.id ? 'bg-white shadow-sm text-brown' : 'text-brown-light'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'quick' && !customMode && (
          <>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
              <input
                type="text" value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search common foods..." autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown"
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filtered.map((food) => (
                <FoodCard
                  key={food.name}
                  food={food}
                  selected={selectedFood?.name === food.name}
                  onClick={() => setSelectedFood(selectedFood?.name === food.name ? null : food)}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'search' && !customMode && (
          <>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
              <input
                type="text" value={apiSearch} onChange={(e) => setApiSearch(e.target.value)}
                placeholder="Search any food..." autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown"
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {apiLoading && (
                <div className="text-center py-6">
                  <Loader2 size={24} className="mx-auto text-terracotta animate-spin" />
                  <p className="text-xs text-brown-light mt-2">Searching...</p>
                </div>
              )}
              {!apiLoading && apiResults.length === 0 && debouncedApiSearch.trim() && (
                <div className="text-center py-6">
                  <p className="text-sm text-brown-light">No results found</p>
                  <button onClick={() => setCustomMode(true)} className="text-xs text-terracotta mt-1 btn-press">
                    Enter custom food instead
                  </button>
                </div>
              )}
              {!apiLoading && apiResults.map((food, i) => (
                <FoodCard
                  key={`${food.barcode || food.name}-${i}`}
                  food={food}
                  selected={selectedFood?.name === food.name}
                  onClick={() => setSelectedFood(selectedFood?.name === food.name ? null : food)}
                />
              ))}
              {!apiLoading && !debouncedApiSearch.trim() && (
                <div className="text-center py-6">
                  <Search size={28} className="mx-auto text-brown-light/30 mb-2" />
                  <p className="text-sm text-brown-light">Search for any food</p>
                  <p className="text-xs text-brown-light mt-1">Powered by Open Food Facts</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'scan' && !customMode && (
          <>
            {scanResult ? (
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4">
                  <p className="font-medium text-brown">{scanResult.name}</p>
                  <p className="text-xs text-brown-light mt-1">{scanResult.serving_size}</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="text-terracotta font-bold">{scanResult.calories} cal</span>
                    <span className="text-brown-light">P: {scanResult.protein}g</span>
                    <span className="text-brown-light">C: {scanResult.carbs}g</span>
                    <span className="text-brown-light">F: {scanResult.fat}g</span>
                  </div>
                </div>
                <button
                  onClick={() => { setScanResult(null); setSelectedFood(null); }}
                  className="text-xs text-terracotta btn-press"
                >
                  Scan another
                </button>
              </div>
            ) : scanLoading ? (
              <div className="text-center py-8">
                <Loader2 size={28} className="mx-auto text-terracotta animate-spin" />
                <p className="text-sm text-brown-light mt-2">Looking up product...</p>
              </div>
            ) : (
              <>
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  onError={() => {}}
                />
                {scanError && (
                  <div className="text-center mt-3">
                    <p className="text-sm text-terracotta">{scanError}</p>
                    <button onClick={() => { setTab('search'); setScanError(''); }} className="text-xs text-brown-light mt-1 btn-press underline">
                      Try searching instead
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {customMode && (
          <div className="space-y-3">
            <input
              type="text" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })}
              placeholder="Food name" className="w-full px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown"
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={custom.calories} onChange={(e) => setCustom({ ...custom, calories: e.target.value })}
                placeholder="Calories*" className="px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown" />
              <input type="number" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: e.target.value })}
                placeholder="Protein (g)" className="px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown" />
              <input type="number" value={custom.carbs} onChange={(e) => setCustom({ ...custom, carbs: e.target.value })}
                placeholder="Carbs (g)" className="px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown" />
              <input type="number" value={custom.fat} onChange={(e) => setCustom({ ...custom, fat: e.target.value })}
                placeholder="Fat (g)" className="px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown" />
            </div>
            <button onClick={() => setCustomMode(false)} className="text-xs text-terracotta btn-press">
              Back to {tab === 'quick' ? 'Quick Add' : tab === 'search' ? 'Search' : 'Scan'}
            </button>
          </div>
        )}

        {/* Custom entry link (when not in custom mode) */}
        {!customMode && tab !== 'scan' && (
          <button onClick={() => setCustomMode(true)} className="block mx-auto mt-3 text-xs text-brown-light btn-press">
            or enter custom food
          </button>
        )}

        <button
          onClick={handleAdd}
          disabled={customMode ? (!custom.name || !custom.calories) : !selectedFood}
          className="w-full mt-4 py-3 rounded-2xl bg-terracotta text-white font-heading font-bold text-lg btn-press disabled:opacity-40 transition-opacity"
        >
          Add to Log
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function FoodPage() {
  const { foodEntries, loadFood, deleteFood, loadSummary, summary } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadFood();
    loadSummary();
  }, [loadFood, loadSummary]);

  const handleClose = () => {
    setShowAdd(false);
    loadFood();
    loadSummary();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">Food Log</h1>

      {/* Daily Summary */}
      {summary && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          {summary.goals.tracking_mode === 'casual' ? (
            <>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-brown-light">Meals Logged Today</span>
              </div>
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-terracotta">{summary.food.meal_count}</p>
                <p className="text-xs text-brown-light mt-1">
                  {summary.food.total_calories > 0 && `${summary.food.total_calories} calories total`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-brown-light">Today's Calories</span>
                <span className="text-xs text-brown-light">{summary.goals.calorie_goal} goal</span>
              </div>
              <div className="h-4 bg-cream-dark rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: summary.food.total_calories > summary.goals.calorie_goal ? '#E07A5F' : '#81B29A',
                  }}
                  animate={{ width: `${Math.min((summary.food.total_calories / summary.goals.calorie_goal) * 100, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-terracotta">{summary.food.total_calories}</p>
                  <p className="text-[10px] text-brown-light">Calories</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-sage">{Math.round(summary.food.total_protein)}g</p>
                  <p className="text-[10px] text-brown-light">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-mustard">{Math.round(summary.food.total_carbs)}g</p>
                  <p className="text-[10px] text-brown-light">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brown-light">{Math.round(summary.food.total_fat)}g</p>
                  <p className="text-[10px] text-brown-light">Fat</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 space-y-2">
        {foodEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-brown-light font-medium">No food logged today</p>
            <p className="text-brown-light text-sm">Tap + to add your first meal</p>
          </div>
        ) : (
          foodEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-brown text-sm">{entry.name}</p>
                <div className="flex gap-2 mt-0.5 text-xs text-brown-light">
                  <span className="capitalize px-1.5 py-0.5 bg-cream-dark rounded-md">{entry.meal_type}</span>
                  <span>P: {entry.protein}g</span>
                  <span>C: {entry.carbs}g</span>
                  <span>F: {entry.fat}g</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-terracotta text-sm">{entry.calories}</span>
                <button onClick={() => { deleteFood(entry.id); loadFood(); loadSummary(); }}
                  className="p-1.5 rounded-full hover:bg-cream-dark btn-press">
                  <Trash2 size={14} className="text-brown-light" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAdd(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-4 max-w-[430px] w-14 h-14 rounded-full bg-terracotta text-white shadow-lg flex items-center justify-center z-40"
        style={{ right: 'max(16px, calc(50% - 195px))' }}
      >
        <Plus size={28} />
      </motion.button>

      <AnimatePresence>
        {showAdd && <AddFoodModal onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
}
