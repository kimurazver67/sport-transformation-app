// frontend/src/pages/MealPlanPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { api } from '../services/api';
import ProductSearchModal from '../components/ProductSearchModal';
import type { Product, Tag, UserGoal, MealPlan, MealDay, Meal } from '../types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI, DAY_NAMES_SHORT } from '../types';

// KBJU calculation (same as backend)
function calculateKBJU(weight: number, goal: UserGoal) {
  if (!weight || weight <= 0) return null;

  let calories: number;
  let protein: number;
  let fat: number;
  let carbs: number;

  if (goal === 'weight_loss') {
    calories = Math.round(weight * 29);
    protein = Math.round(weight * 2);
    fat = 50;
    carbs = Math.round((calories - protein * 4 - 450) / 4);
  } else {
    const baseCalories = Math.round(weight * 36);
    calories = baseCalories + 500;
    protein = Math.round(weight * 2);
    fat = Math.round(weight * 1);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }

  carbs = Math.max(0, carbs);
  return { calories, protein, fat, carbs };
}

type TabType = 'menu' | 'inventory' | 'settings';

// Inventory Item type
interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity_grams: number | null;
  quantity_units: number | null;
  location: 'fridge' | 'freezer' | 'pantry' | 'other';
  expiry_date: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  category: string;
}

interface InventoryData {
  fridge: InventoryItem[];
  freezer: InventoryItem[];
  pantry: InventoryItem[];
  other: InventoryItem[];
}

const LOCATION_LABELS: Record<string, { label: string; emoji: string }> = {
  fridge: { label: 'Холодильник', emoji: '🧊' },
  freezer: { label: 'Морозилка', emoji: '❄️' },
  pantry: { label: 'Полка', emoji: '🗄️' },
  other: { label: 'Другое', emoji: '📦' },
};

// Tag Selection Modal
interface TagSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  tags: Tag[];
  excludedTags: Tag[];
  onToggle: (tagId: string) => void;
  accentColor: string;
}

const TagSelectionModal = ({
  isOpen,
  onClose,
  title,
  icon,
  tags,
  excludedTags,
  onToggle,
  accentColor,
}: TagSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-void-200 border-t-2 border-void-400 max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-void-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <h2 className="font-display font-bold text-xl text-steel-100 uppercase">{title}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-steel-400 hover:text-steel-100 text-2xl">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tags.map((tag) => {
              const isExcluded = excludedTags.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggle(tag.id)}
                  className="w-full p-4 border-2 flex items-center justify-between transition-all border-void-400 bg-void-300 hover:border-steel-500"
                  style={isExcluded ? {
                    borderColor: accentColor === 'neon-red' ? '#FF4444' : accentColor === 'neon-lime' ? '#BFFF00' : accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                    backgroundColor: accentColor === 'neon-red' ? 'rgba(255,68,68,0.1)' : accentColor === 'neon-lime' ? 'rgba(191,255,0,0.1)' : accentColor === 'neon-cyan' ? 'rgba(0,255,255,0.1)' : 'transparent',
                  } : {}}
                >
                  <div className="text-left">
                    <div className="font-mono text-base text-steel-100">{tag.name_ru}</div>
                    {tag.description && <div className="font-mono text-xs text-steel-500 mt-1">{tag.description}</div>}
                  </div>
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center ${isExcluded ? 'border-current' : 'border-steel-600'}`}
                    style={isExcluded ? {
                      borderColor: accentColor === 'neon-red' ? '#FF4444' : accentColor === 'neon-lime' ? '#BFFF00' : accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                      color: accentColor === 'neon-red' ? '#FF4444' : accentColor === 'neon-lime' ? '#BFFF00' : accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                    } : {}}
                  >
                    {isExcluded && <span className="text-sm">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-void-400">
            <button onClick={onClose} className="brutal-button w-full">ГОТОВО</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Recipe Modal
interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: Meal | null;
}

const RecipeModal = ({ isOpen, onClose, meal }: RecipeModalProps) => {
  if (!isOpen || !meal?.recipe) return null;

  const recipe = meal.recipe;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-void-200 border-t-2 border-neon-lime max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-void-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEAL_TYPE_EMOJI[meal.meal_type]}</span>
                <span className="font-mono text-xs text-steel-500 uppercase">{MEAL_TYPE_LABELS[meal.meal_type]}</span>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-steel-400 hover:text-steel-100 text-2xl">×</button>
            </div>
            <h2 className="font-display font-bold text-xl text-steel-100 mt-2">{recipe.name}</h2>
            {recipe.cooking_time && <div className="font-mono text-xs text-steel-500 mt-1">~ {recipe.cooking_time} мин</div>}
          </div>

          <div className="p-4 border-b border-void-400">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-lime">{Math.round(meal.calories || 0)}</div>
                <div className="font-mono text-[10px] text-steel-500">ккал</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-cyan">{Math.round(meal.protein || 0)}</div>
                <div className="font-mono text-[10px] text-steel-500">Б</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-orange">{Math.round(meal.fat || 0)}</div>
                <div className="font-mono text-[10px] text-steel-500">Ж</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-purple">{Math.round(meal.carbs || 0)}</div>
                <div className="font-mono text-[10px] text-steel-500">У</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="font-mono text-xs text-steel-500 uppercase mb-2">Состав</h3>
                <div className="space-y-1">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="flex justify-between items-baseline font-mono text-sm">
                      <span className={ingredient.is_optional ? 'text-steel-500 italic' : 'text-steel-300'}>
                        {ingredient.product_name}
                        {ingredient.is_optional && ' (опционально)'}
                      </span>
                      <span className="text-neon-lime ml-2">{ingredient.amount_grams}г</span>
                    </div>
                  ))}
                </div>
                {meal.portion_grams && (
                  <div className="mt-2 pt-2 border-t border-void-400 flex justify-between items-baseline font-mono text-sm">
                    <span className="text-steel-400 font-bold">Общий вес порции:</span>
                    <span className="text-neon-lime font-bold">{meal.portion_grams}г</span>
                  </div>
                )}
              </div>
            )}

            {recipe.instructions ? (
              <div>
                <h3 className="font-mono text-xs text-steel-500 uppercase mb-2">Приготовление</h3>
                <div className="font-mono text-sm text-steel-300 whitespace-pre-wrap">{recipe.instructions}</div>
              </div>
            ) : (
              <div className="font-mono text-sm text-steel-500 text-center py-4">Инструкции не указаны</div>
            )}
          </div>

          <div className="p-4 border-t border-void-400">
            <button onClick={onClose} className="brutal-button w-full">ЗАКРЫТЬ</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MealPlanPage = () => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [excludedProducts, setExcludedProducts] = useState<Product[]>([]);
  const [excludedTags, setExcludedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [allergensModalOpen, setAllergensModalOpen] = useState(false);
  const [dietsModalOpen, setDietsModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState({ weeks: 4, allowRepeatDays: 3, preferSimple: true, useInventory: false });

  // Meal plan state
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [mealDays, setMealDays] = useState<MealDay[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Inventory state
  const [inventory, setInventory] = useState<InventoryData>({ fridge: [], freezer: [], pantry: [], other: [] });
  const [inventorySearchOpen, setInventorySearchOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<'fridge' | 'freezer' | 'pantry' | 'other'>('fridge');
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Local editing state for inventory quantities (to allow typing without instant API calls)
  const [editingQuantities, setEditingQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoadingPlan(true);
      const [tags, exclusions, planData, inventoryData] = await Promise.all([
        api.getTags(),
        api.getUserExclusions(user.id),
        api.getUserMealPlan(user.id),
        api.getInventory(user.id)
      ]);

      setAllTags(tags || []);
      setExcludedProducts(exclusions.products || []);
      setExcludedTags(exclusions.tags || []);
      setInventory(inventoryData.inventory || { fridge: [], freezer: [], pantry: [], other: [] });

      if (planData.plan) {
        setMealPlan(planData.plan);
        setMealDays(planData.days || []);
        setActiveTab('menu');
      } else {
        setActiveTab('settings');
      }
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const loadInventory = async () => {
    if (!user?.id) return;
    try {
      setLoadingInventory(true);
      const data = await api.getInventory(user.id);
      setInventory(data.inventory || { fridge: [], freezer: [], pantry: [], other: [] });
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleAddInventoryItem = async (product: Product & { source: 'local' | 'fatsecret' }) => {
    if (!user?.id) return;
    try {
      let productId = product.id;
      if (product.source === 'fatsecret' && product.fatsecret_id) {
        const imported = await api.importProduct(product.fatsecret_id, user.id);
        productId = imported.product_id;
      }
      // По умолчанию добавляем 500г
      await api.addInventoryItem(user.id, {
        productId,
        quantityGrams: 500,
        location: selectedLocation,
      });
      await loadInventory();
      setInventorySearchOpen(false);
    } catch (error) {
      console.error('Failed to add inventory item:', error);
    }
  };

  // Handle quantity input change - just update local state, no debounce
  const handleQuantityInputChange = useCallback((itemId: string, value: string) => {
    // Allow only digits (and empty string)
    const cleanValue = value.replace(/[^0-9]/g, '');
    setEditingQuantities(prev => ({ ...prev, [itemId]: cleanValue }));
  }, []);

  // Save quantity on blur only
  const handleQuantityBlur = useCallback((itemId: string) => {
    const value = editingQuantities[itemId];
    // Only save if we have an editing value
    if (value === undefined) return;

    const numValue = value === '' ? 0 : parseInt(value);
    handleUpdateInventoryQuantity(itemId, Math.max(0, numValue));
    // Clear editing state
    setEditingQuantities(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  }, [editingQuantities, user?.id]);

  const handleUpdateInventoryQuantity = async (itemId: string, newGrams: number) => {
    if (!user?.id) return;
    try {
      await api.updateInventoryItem(user.id, itemId, { quantityGrams: newGrams });
      // Update local inventory state without full reload
      setInventory(prev => {
        const newInventory = { ...prev };
        for (const location of ['fridge', 'freezer', 'pantry', 'other'] as const) {
          newInventory[location] = newInventory[location].map(item =>
            item.id === itemId ? { ...item, quantity_grams: newGrams } : item
          );
        }
        return newInventory;
      });
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!user?.id) return;
    try {
      await api.deleteInventoryItem(user.id, itemId);
      await loadInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
    }
  };

  const handleAddProductExclusion = async (product: Product & { source: 'local' | 'fatsecret' }) => {
    if (!user?.id) return;
    try {
      let productId = product.id;
      if (product.source === 'fatsecret' && product.fatsecret_id) {
        const imported = await api.importProduct(product.fatsecret_id, user.id);
        productId = imported.product_id;
      }
      await api.addProductExclusion(user.id, productId);
      await loadData();
    } catch (error) {
      console.error('Failed to add product exclusion:', error);
    }
  };

  const handleRemoveProductExclusion = async (productId: string) => {
    if (!user?.id) return;
    try {
      await api.removeProductExclusion(user.id, productId);
      await loadData();
    } catch (error) {
      console.error('Failed to remove product exclusion:', error);
    }
  };

  const handleToggleTagExclusion = async (tagId: string) => {
    if (!user?.id) return;
    try {
      const isExcluded = excludedTags.some(t => t.id === tagId);
      if (isExcluded) {
        await api.removeTagExclusion(user.id, tagId);
      } else {
        await api.addTagExclusion(user.id, tagId);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to toggle tag exclusion:', error);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user?.id) return;
    try {
      setGenerating(true);
      await api.generateMealPlan(user.id, generationParams.weeks, generationParams.allowRepeatDays, generationParams.preferSimple, generationParams.useInventory);
      await loadData();
      setSelectedWeek(1);
      setActiveTab('menu');
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      alert('Ошибка при генерации плана питания');
    } finally {
      setGenerating(false);
    }
  };

  // Подсчёт количества продуктов в инвентаре
  const totalInventoryItems = inventory.fridge.length + inventory.freezer.length + inventory.pantry.length + inventory.other.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <p className="font-mono text-steel-400">Загрузка...</p>
      </div>
    );
  }

  const allergenTags = allTags.filter(t => t.type === 'allergen');
  const dietTags = allTags.filter(t => t.type === 'diet');
  const preferenceTags = allTags.filter(t => t.type === 'preference');
  const selectedAllergens = excludedTags.filter(t => t.type === 'allergen');
  const selectedDiets = excludedTags.filter(t => t.type === 'diet');
  const selectedPreferences = excludedTags.filter(t => t.type === 'preference');
  const kbju = user.start_weight && user.goal ? calculateKBJU(user.start_weight, user.goal) : null;
  const weekDays = mealDays.filter(d => d.week_number === selectedWeek);
  const totalWeeks = mealPlan?.weeks || 1;

  return (
    <div className="min-h-screen bg-void p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header with Tabs */}
        <div className="brutal-card p-4">
          <h1 className="font-display font-bold text-2xl text-steel-100 uppercase mb-3">План питания</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-2 px-2 font-mono text-xs uppercase border-2 transition-all ${
                activeTab === 'menu' ? 'border-neon-lime bg-neon-lime/10 text-neon-lime' : 'border-void-400 text-steel-500 hover:border-steel-500'
              }`}
            >
              🍽️ Меню
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-2 px-2 font-mono text-xs uppercase border-2 transition-all relative ${
                activeTab === 'inventory' ? 'border-neon-orange bg-neon-orange/10 text-neon-orange' : 'border-void-400 text-steel-500 hover:border-steel-500'
              }`}
            >
              🧊 Продукты
              {totalInventoryItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-neon-orange text-void-100 text-[10px] w-4 h-4 flex items-center justify-center font-bold">{totalInventoryItems}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 px-2 font-mono text-xs uppercase border-2 transition-all ${
                activeTab === 'settings' ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-void-400 text-steel-500 hover:border-steel-500'
              }`}
            >
              ⚙️ Настройки
            </button>
          </div>
        </div>

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <>
            {loadingPlan ? (
              <div className="brutal-card p-8 text-center">
                <div className="font-mono text-steel-400">Загрузка плана...</div>
              </div>
            ) : !mealPlan ? (
              <div className="brutal-card p-8 text-center">
                <div className="text-4xl mb-4">🍽️</div>
                <div className="font-mono text-steel-300 mb-2">План питания не создан</div>
                <div className="font-mono text-xs text-steel-500 mb-4">Перейдите в настройки и сгенерируйте план</div>
                <button onClick={() => setActiveTab('settings')} className="brutal-button">СОЗДАТЬ ПЛАН</button>
              </div>
            ) : (
              <>
                {/* Plan КБЖУ */}
                <div className="brutal-card p-4">
                  <h2 className="font-mono font-bold text-xs text-steel-500 mb-3 uppercase">Целевые КБЖУ плана</h2>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-void-300 p-2 border border-void-400 text-center">
                      <div className="font-display text-lg text-neon-lime">{mealPlan.target_calories}</div>
                      <div className="font-mono text-[10px] text-steel-500">ккал</div>
                    </div>
                    <div className="bg-void-300 p-2 border border-void-400 text-center">
                      <div className="font-display text-lg text-neon-cyan">{mealPlan.target_protein}</div>
                      <div className="font-mono text-[10px] text-steel-500">белки</div>
                    </div>
                    <div className="bg-void-300 p-2 border border-void-400 text-center">
                      <div className="font-display text-lg text-neon-orange">{mealPlan.target_fat}</div>
                      <div className="font-mono text-[10px] text-steel-500">жиры</div>
                    </div>
                    <div className="bg-void-300 p-2 border border-void-400 text-center">
                      <div className="font-display text-lg text-neon-purple">{mealPlan.target_carbs}</div>
                      <div className="font-mono text-[10px] text-steel-500">углев.</div>
                    </div>
                  </div>
                </div>

                {/* Week Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                    <button
                      key={week}
                      onClick={() => setSelectedWeek(week)}
                      className={`px-4 py-2 font-mono text-sm border-2 whitespace-nowrap transition-all ${
                        selectedWeek === week ? 'border-neon-lime bg-neon-lime/10 text-neon-lime' : 'border-void-400 text-steel-500 hover:border-steel-500'
                      }`}
                    >
                      Неделя {week}
                    </button>
                  ))}
                </div>

                {/* Days */}
                <div className="space-y-3">
                  {weekDays.map((day) => (
                    <div key={day.id} className="brutal-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-display font-bold text-lg text-steel-100">{DAY_NAMES_SHORT[day.day_number - 1]}</div>
                        <div className="font-mono text-xs text-steel-500">{Math.round(day.total_calories || 0)} ккал</div>
                      </div>

                      <div className="space-y-2">
                        {day.meals?.map((meal: Meal) => (
                          <button
                            key={meal.id}
                            onClick={() => setSelectedRecipe(meal)}
                            className="w-full bg-void-300 border border-void-400 p-3 flex items-center gap-3 hover:border-steel-500 transition-all text-left"
                          >
                            <span className="text-lg">{MEAL_TYPE_EMOJI[meal.meal_type]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm text-steel-100 truncate">{meal.recipe?.name || 'Блюдо'}</div>
                              <div className="font-mono text-xs text-steel-500">{MEAL_TYPE_LABELS[meal.meal_type]} - {Math.round(meal.calories || 0)} ккал</div>
                            </div>
                            <span className="text-steel-500">→</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-void-400 grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="font-mono text-xs text-neon-lime">{Math.round(day.total_calories || 0)}</div>
                          <div className="font-mono text-[10px] text-steel-600">ккал</div>
                        </div>
                        <div>
                          <div className="font-mono text-xs text-neon-cyan">{Math.round(day.total_protein || 0)}г</div>
                          <div className="font-mono text-[10px] text-steel-600">Б</div>
                        </div>
                        <div>
                          <div className="font-mono text-xs text-neon-orange">{Math.round(day.total_fat || 0)}г</div>
                          <div className="font-mono text-[10px] text-steel-600">Ж</div>
                        </div>
                        <div>
                          <div className="font-mono text-xs text-neon-purple">{Math.round(day.total_carbs || 0)}г</div>
                          <div className="font-mono text-[10px] text-steel-600">У</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {weekDays.length === 0 && (
                    <div className="brutal-card p-8 text-center">
                      <div className="font-mono text-steel-500">Нет данных для этой недели</div>
                    </div>
                  )}
                </div>

                <button className="brutal-button w-full text-sm py-3 border-steel-600 text-steel-400" onClick={() => setActiveTab('settings')}>
                  🔄 ПЕРЕСОЗДАТЬ ПЛАН
                </button>
              </>
            )}
          </>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <>
            {/* Добавить продукт */}
            <div className="brutal-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono font-bold text-sm text-steel-100 uppercase">Мои продукты</h2>
                <button
                  onClick={() => setInventorySearchOpen(true)}
                  className="px-3 py-1 border-2 border-neon-orange text-neon-orange font-mono text-xs uppercase hover:bg-neon-orange/10"
                >
                  + Добавить
                </button>
              </div>
              <p className="font-mono text-xs text-steel-500">
                Добавьте продукты, которые у вас уже есть. Они будут учтены при генерации плана.
              </p>
            </div>

            {/* Location Tabs */}
            <div className="flex gap-1 px-1">
              {(['fridge', 'freezer', 'pantry', 'other'] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`flex-1 py-2 px-1 font-mono text-[10px] uppercase border-2 transition-all ${
                    selectedLocation === loc
                      ? 'border-neon-orange bg-neon-orange/10 text-neon-orange'
                      : 'border-void-400 text-steel-500 hover:border-steel-500'
                  }`}
                >
                  {LOCATION_LABELS[loc].emoji} {LOCATION_LABELS[loc].label}
                  {inventory[loc].length > 0 && <span className="ml-1 text-steel-400">({inventory[loc].length})</span>}
                </button>
              ))}
            </div>

            {/* Product List */}
            <div className="brutal-card p-4">
              {loadingInventory ? (
                <div className="text-center py-8 font-mono text-steel-500">Загрузка...</div>
              ) : inventory[selectedLocation].length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">{LOCATION_LABELS[selectedLocation].emoji}</div>
                  <div className="font-mono text-sm text-steel-500">
                    {LOCATION_LABELS[selectedLocation].label} пуст
                  </div>
                  <button
                    onClick={() => setInventorySearchOpen(true)}
                    className="mt-4 px-4 py-2 border-2 border-neon-orange text-neon-orange font-mono text-xs uppercase hover:bg-neon-orange/10"
                  >
                    + Добавить продукт
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {inventory[selectedLocation].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-void-300 border border-void-400"
                    >
                      <div className="flex-1">
                        <div className="font-mono text-sm text-steel-100">{item.product_name}</div>
                        <div className="font-mono text-[10px] text-steel-500 mt-1">
                          {item.calories} ккал · {item.protein}Б · {item.fat}Ж · {item.carbs}У / 100г
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingQuantities[item.id] ?? String(item.quantity_grams || 0)}
                            onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                            onBlur={() => handleQuantityBlur(item.id)}
                            className="w-20 h-8 bg-void-200 border border-void-400 text-center font-mono text-sm text-neon-orange focus:border-neon-orange outline-none"
                          />
                          <span className="ml-1 font-mono text-xs text-steel-500">г</span>
                        </div>
                        <button
                          onClick={() => handleDeleteInventoryItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-steel-500 hover:text-neon-red hover:bg-void-300 border border-void-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add more button */}
                  <button
                    onClick={() => setInventorySearchOpen(true)}
                    className="w-full mt-2 px-4 py-3 border-2 border-dashed border-void-400 text-steel-500 font-mono text-xs uppercase hover:border-neon-orange hover:text-neon-orange transition-colors"
                  >
                    + Добавить ещё
                  </button>
                </div>
              )}
            </div>

            {/* Info about inventory usage */}
            {totalInventoryItems > 0 && (
              <div className="brutal-card p-4 border-neon-orange/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="font-mono text-sm text-steel-100 mb-1">Использование при генерации</div>
                    <div className="font-mono text-xs text-steel-500">
                      Включите опцию "Использовать мои продукты" в настройках генерации, чтобы план питания учитывал ваши продукты.
                    </div>
                    <button
                      onClick={() => {
                        setGenerationParams(p => ({ ...p, useInventory: true }));
                        setActiveTab('settings');
                      }}
                      className="mt-2 px-3 py-1 border border-neon-orange/50 text-neon-orange font-mono text-xs hover:bg-neon-orange/10"
                    >
                      Перейти в настройки →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <>
            {kbju && (
              <div className="brutal-card p-4">
                <h2 className="font-mono font-bold text-xs text-steel-500 mb-3 uppercase">Ваши целевые КБЖУ</h2>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-void-300 p-2 border border-void-400 text-center">
                    <div className="font-display text-lg text-neon-lime">{kbju.calories}</div>
                    <div className="font-mono text-[10px] text-steel-500">ккал</div>
                  </div>
                  <div className="bg-void-300 p-2 border border-void-400 text-center">
                    <div className="font-display text-lg text-neon-cyan">{kbju.protein}</div>
                    <div className="font-mono text-[10px] text-steel-500">белки</div>
                  </div>
                  <div className="bg-void-300 p-2 border border-void-400 text-center">
                    <div className="font-display text-lg text-neon-orange">{kbju.fat}</div>
                    <div className="font-mono text-[10px] text-steel-500">жиры</div>
                  </div>
                  <div className="bg-void-300 p-2 border border-void-400 text-center">
                    <div className="font-display text-lg text-neon-purple">{kbju.carbs}</div>
                    <div className="font-mono text-[10px] text-steel-500">углев.</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button onClick={() => setAllergensModalOpen(true)} className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div className="text-left">
                    <div className="font-mono font-bold text-sm text-steel-100 uppercase">Аллергены</div>
                    <div className="font-mono text-xs text-steel-500">{selectedAllergens.length > 0 ? selectedAllergens.map(t => t.name_ru).join(', ') : 'Не выбрано'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedAllergens.length > 0 && <span className="px-2 py-1 bg-neon-red/20 text-neon-red font-mono text-xs">{selectedAllergens.length}</span>}
                  <span className="text-steel-500">→</span>
                </div>
              </button>

              <button onClick={() => setDietsModalOpen(true)} className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌱</span>
                  <div className="text-left">
                    <div className="font-mono font-bold text-sm text-steel-100 uppercase">Тип питания</div>
                    <div className="font-mono text-xs text-steel-500">{selectedDiets.length > 0 ? selectedDiets.map(t => t.name_ru).join(', ') : 'Не выбрано'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDiets.length > 0 && <span className="px-2 py-1 bg-neon-lime/20 text-neon-lime font-mono text-xs">{selectedDiets.length}</span>}
                  <span className="text-steel-500">→</span>
                </div>
              </button>

              <button onClick={() => setPreferencesModalOpen(true)} className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div className="text-left">
                    <div className="font-mono font-bold text-sm text-steel-100 uppercase">Предпочтения</div>
                    <div className="font-mono text-xs text-steel-500">{selectedPreferences.length > 0 ? selectedPreferences.map(t => t.name_ru).join(', ') : 'Не выбрано'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPreferences.length > 0 && <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan font-mono text-xs">{selectedPreferences.length}</span>}
                  <span className="text-steel-500">→</span>
                </div>
              </button>

              <button onClick={() => setSearchModalOpen(true)} className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="font-mono font-bold text-sm text-steel-100 uppercase">Исключённые продукты</div>
                    <div className="font-mono text-xs text-steel-500">{excludedProducts.length > 0 ? `${excludedProducts.length} продуктов` : 'Не выбрано'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {excludedProducts.length > 0 && <span className="px-2 py-1 bg-neon-magenta/20 text-neon-magenta font-mono text-xs">{excludedProducts.length}</span>}
                  <span className="text-steel-500">→</span>
                </div>
              </button>
            </div>

            {excludedProducts.length > 0 && (
              <div className="brutal-card p-4">
                <h3 className="font-mono font-bold text-xs text-steel-500 mb-3 uppercase">Исключённые продукты</h3>
                <div className="space-y-2">
                  {excludedProducts.map(product => (
                    <div key={product.id} className="bg-void-300 border border-void-400 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm text-steel-100">{product.name}</div>
                        <div className="font-mono text-xs text-steel-500">{Math.round(product.calories)} ккал | Б: {Math.round(product.protein)}г</div>
                      </div>
                      <button onClick={() => handleRemoveProductExclusion(product.id)} className="text-neon-red hover:text-neon-red/70 font-mono text-sm px-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="brutal-card p-4">
              <h2 className="font-mono font-bold text-xs text-steel-500 mb-4 uppercase">Параметры генерации</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-steel-400 mb-2 block">Количество недель: <span className="text-steel-100">{generationParams.weeks}</span></label>
                  <input type="range" min="1" max="4" value={generationParams.weeks} onChange={(e) => setGenerationParams({ ...generationParams, weeks: parseInt(e.target.value) })} className="w-full" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center ${generationParams.preferSimple ? 'border-neon-lime text-neon-lime' : 'border-steel-600'}`}
                    onClick={() => setGenerationParams({ ...generationParams, preferSimple: !generationParams.preferSimple })}
                  >
                    {generationParams.preferSimple && <span className="text-xs">✓</span>}
                  </div>
                  <span className="font-mono text-sm text-steel-100">Простые рецепты</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center ${generationParams.useInventory ? 'border-neon-orange text-neon-orange' : 'border-steel-600'}`}
                    onClick={() => setGenerationParams({ ...generationParams, useInventory: !generationParams.useInventory })}
                  >
                    {generationParams.useInventory && <span className="text-xs">✓</span>}
                  </div>
                  <div>
                    <span className="font-mono text-sm text-steel-100">Использовать мои продукты</span>
                    {totalInventoryItems > 0 && (
                      <span className="ml-2 text-neon-orange text-xs">({totalInventoryItems} шт.)</span>
                    )}
                    {totalInventoryItems === 0 && (
                      <span className="ml-2 text-steel-500 text-xs">(нет продуктов)</span>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button className="brutal-button w-full text-lg py-4" onClick={handleGeneratePlan} disabled={generating}>
              {generating ? '⏳ ГЕНЕРАЦИЯ...' : '🔥 СГЕНЕРИРОВАТЬ ПЛАН'}
            </button>
          </>
        )}
      </div>

      {/* Modals */}
      <TagSelectionModal isOpen={allergensModalOpen} onClose={() => setAllergensModalOpen(false)} title="Аллергены" icon="🚫" tags={allergenTags} excludedTags={excludedTags} onToggle={handleToggleTagExclusion} accentColor="neon-red" />
      <TagSelectionModal isOpen={dietsModalOpen} onClose={() => setDietsModalOpen(false)} title="Тип питания" icon="🌱" tags={dietTags} excludedTags={excludedTags} onToggle={handleToggleTagExclusion} accentColor="neon-lime" />
      <TagSelectionModal isOpen={preferencesModalOpen} onClose={() => setPreferencesModalOpen(false)} title="Предпочтения" icon="⚙️" tags={preferenceTags} excludedTags={excludedTags} onToggle={handleToggleTagExclusion} accentColor="neon-cyan" />
      <ProductSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} onSelect={handleAddProductExclusion} mode="exclude" title="Добавить продукт в исключения" />
      <ProductSearchModal isOpen={inventorySearchOpen} onClose={() => setInventorySearchOpen(false)} onSelect={handleAddInventoryItem} mode="add" title={`Добавить в ${LOCATION_LABELS[selectedLocation].label.toLowerCase()}`} />
      <RecipeModal isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} meal={selectedRecipe} />
    </div>
  );
};

export default MealPlanPage;
