// frontend/src/pages/MealPlanPage.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { api } from '../services/api';
import ProductSearchModal from '../components/ProductSearchModal';
import type { Product, Tag, UserGoal } from '../types';

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
    // muscle_gain
    const baseCalories = Math.round(weight * 36);
    calories = baseCalories + 500;
    protein = Math.round(weight * 2);
    fat = Math.round(weight * 1);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }

  carbs = Math.max(0, carbs);

  return { calories, protein, fat, carbs };
}

// Tag Selection Modal Component
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
          {/* Header */}
          <div className="p-4 border-b border-void-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <h2 className="font-display font-bold text-xl text-steel-100 uppercase">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-steel-400 hover:text-steel-100 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tag List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tags.map((tag) => {
              const isExcluded = excludedTags.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggle(tag.id)}
                  className={`w-full p-4 border-2 flex items-center justify-between transition-all ${
                    isExcluded
                      ? `border-${accentColor} bg-${accentColor}/10`
                      : 'border-void-400 bg-void-300 hover:border-steel-500'
                  }`}
                  style={isExcluded ? {
                    borderColor: accentColor === 'neon-red' ? '#FF4444' :
                                 accentColor === 'neon-lime' ? '#BFFF00' :
                                 accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                    backgroundColor: accentColor === 'neon-red' ? 'rgba(255,68,68,0.1)' :
                                     accentColor === 'neon-lime' ? 'rgba(191,255,0,0.1)' :
                                     accentColor === 'neon-cyan' ? 'rgba(0,255,255,0.1)' : 'transparent',
                  } : {}}
                >
                  <div className="text-left">
                    <div className="font-mono text-base text-steel-100">
                      {tag.name_ru}
                    </div>
                    {tag.description && (
                      <div className="font-mono text-xs text-steel-500 mt-1">
                        {tag.description}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center ${
                      isExcluded ? 'border-current' : 'border-steel-600'
                    }`}
                    style={isExcluded ? {
                      borderColor: accentColor === 'neon-red' ? '#FF4444' :
                                   accentColor === 'neon-lime' ? '#BFFF00' :
                                   accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                      color: accentColor === 'neon-red' ? '#FF4444' :
                             accentColor === 'neon-lime' ? '#BFFF00' :
                             accentColor === 'neon-cyan' ? '#00FFFF' : '#666',
                    } : {}}
                  >
                    {isExcluded && <span className="text-sm">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-void-400">
            <button
              onClick={onClose}
              className="brutal-button w-full"
            >
              ГОТОВО
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MealPlanPage = () => {
  const { user } = useStore();
  const [excludedProducts, setExcludedProducts] = useState<Product[]>([]);
  const [excludedTags, setExcludedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [allergensModalOpen, setAllergensModalOpen] = useState(false);
  const [dietsModalOpen, setDietsModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState({
    weeks: 4,
    allowRepeatDays: 3,
    preferSimple: true,
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      // Загружаем теги и исключения
      const [tags, exclusions] = await Promise.all([
        api.getTags(),
        api.getUserExclusions(user.id)
      ]);

      setAllTags(tags || []);
      setExcludedProducts(exclusions.products || []);
      setExcludedTags(exclusions.tags || []);
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
    }
  };

  const handleAddProductExclusion = async (product: Product & { source: 'local' | 'fatsecret' }) => {
    if (!user?.id) return;

    try {
      // Если продукт из FatSecret, сначала импортируем
      let productId = product.id;

      if (product.source === 'fatsecret' && product.fatsecret_id) {
        const imported = await api.importProduct(product.fatsecret_id, user.id);
        productId = imported.product_id;
      }

      // Добавляем в исключения
      await api.addProductExclusion(user.id, productId);

      // Обновляем список
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

      const result = await api.generateMealPlan(
        user.id,
        generationParams.weeks,
        generationParams.allowRepeatDays,
        generationParams.preferSimple
      );

      console.log('Generated meal plan:', result.meal_plan_id);

      // TODO: Navigate to meal plan view page
      alert(`План питания сгенерирован! ID: ${result.meal_plan_id}`);
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      alert('Ошибка при генерации плана питания');
    } finally {
      setGenerating(false);
    }
  };

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

  // Count selected items
  const selectedAllergens = excludedTags.filter(t => t.type === 'allergen');
  const selectedDiets = excludedTags.filter(t => t.type === 'diet');
  const selectedPreferences = excludedTags.filter(t => t.type === 'preference');

  // Calculate KBJU from user's weight and goal
  const kbju = user.start_weight && user.goal
    ? calculateKBJU(user.start_weight, user.goal)
    : null;

  return (
    <div className="min-h-screen bg-void p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="brutal-card p-4">
          <h1 className="font-display font-bold text-2xl text-steel-100 uppercase mb-1">
            План питания
          </h1>
          <p className="font-mono text-xs text-steel-500">
            Настройте предпочтения и исключения
          </p>
        </div>

        {/* КБЖУ Info */}
        {kbju && (
          <div className="brutal-card p-4">
            <h2 className="font-mono font-bold text-xs text-steel-500 mb-3 uppercase">
              Ваши целевые КБЖУ
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-lime">
                  {kbju.calories}
                </div>
                <div className="font-mono text-[10px] text-steel-500">ккал</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-cyan">
                  {kbju.protein}
                </div>
                <div className="font-mono text-[10px] text-steel-500">белки</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-orange">
                  {kbju.fat}
                </div>
                <div className="font-mono text-[10px] text-steel-500">жиры</div>
              </div>
              <div className="bg-void-300 p-2 border border-void-400 text-center">
                <div className="font-display text-lg text-neon-purple">
                  {kbju.carbs}
                </div>
                <div className="font-mono text-[10px] text-steel-500">углев.</div>
              </div>
            </div>
          </div>
        )}

        {/* Selection Cards */}
        <div className="space-y-3">
          {/* Allergens Card */}
          <button
            onClick={() => setAllergensModalOpen(true)}
            className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚫</span>
              <div className="text-left">
                <div className="font-mono font-bold text-sm text-steel-100 uppercase">
                  Аллергены
                </div>
                <div className="font-mono text-xs text-steel-500">
                  {selectedAllergens.length > 0
                    ? selectedAllergens.map(t => t.name_ru).join(', ')
                    : 'Не выбрано'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedAllergens.length > 0 && (
                <span className="px-2 py-1 bg-neon-red/20 text-neon-red font-mono text-xs">
                  {selectedAllergens.length}
                </span>
              )}
              <span className="text-steel-500">→</span>
            </div>
          </button>

          {/* Diets Card */}
          <button
            onClick={() => setDietsModalOpen(true)}
            className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div className="text-left">
                <div className="font-mono font-bold text-sm text-steel-100 uppercase">
                  Тип питания
                </div>
                <div className="font-mono text-xs text-steel-500">
                  {selectedDiets.length > 0
                    ? selectedDiets.map(t => t.name_ru).join(', ')
                    : 'Не выбрано'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedDiets.length > 0 && (
                <span className="px-2 py-1 bg-neon-lime/20 text-neon-lime font-mono text-xs">
                  {selectedDiets.length}
                </span>
              )}
              <span className="text-steel-500">→</span>
            </div>
          </button>

          {/* Preferences Card */}
          <button
            onClick={() => setPreferencesModalOpen(true)}
            className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div className="text-left">
                <div className="font-mono font-bold text-sm text-steel-100 uppercase">
                  Предпочтения
                </div>
                <div className="font-mono text-xs text-steel-500">
                  {selectedPreferences.length > 0
                    ? selectedPreferences.map(t => t.name_ru).join(', ')
                    : 'Не выбрано'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedPreferences.length > 0 && (
                <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan font-mono text-xs">
                  {selectedPreferences.length}
                </span>
              )}
              <span className="text-steel-500">→</span>
            </div>
          </button>

          {/* Excluded Products Card */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full brutal-card p-4 flex items-center justify-between hover:border-steel-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍎</span>
              <div className="text-left">
                <div className="font-mono font-bold text-sm text-steel-100 uppercase">
                  Исключённые продукты
                </div>
                <div className="font-mono text-xs text-steel-500">
                  {excludedProducts.length > 0
                    ? `${excludedProducts.length} продуктов`
                    : 'Не выбрано'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {excludedProducts.length > 0 && (
                <span className="px-2 py-1 bg-neon-magenta/20 text-neon-magenta font-mono text-xs">
                  {excludedProducts.length}
                </span>
              )}
              <span className="text-steel-500">→</span>
            </div>
          </button>
        </div>

        {/* Excluded Products List (if any) */}
        {excludedProducts.length > 0 && (
          <div className="brutal-card p-4">
            <h3 className="font-mono font-bold text-xs text-steel-500 mb-3 uppercase">
              Исключённые продукты
            </h3>
            <div className="space-y-2">
              {excludedProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-void-300 border border-void-400 p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-sm text-steel-100">
                      {product.name}
                    </div>
                    <div className="font-mono text-xs text-steel-500">
                      {Math.round(product.calories)} ккал | Б: {Math.round(product.protein)}г
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveProductExclusion(product.id)}
                    className="text-neon-red hover:text-neon-red/70 font-mono text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation Settings */}
        <div className="brutal-card p-4">
          <h2 className="font-mono font-bold text-xs text-steel-500 mb-4 uppercase">
            Параметры генерации
          </h2>

          <div className="space-y-4">
            {/* Weeks */}
            <div>
              <label className="font-mono text-xs text-steel-400 mb-2 block">
                Количество недель: <span className="text-steel-100">{generationParams.weeks}</span>
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={generationParams.weeks}
                onChange={(e) => setGenerationParams({ ...generationParams, weeks: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Prefer Simple */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-5 h-5 border-2 flex items-center justify-center ${
                  generationParams.preferSimple
                    ? 'border-neon-lime text-neon-lime'
                    : 'border-steel-600'
                }`}
              >
                {generationParams.preferSimple && <span className="text-xs">✓</span>}
              </div>
              <span className="font-mono text-sm text-steel-100">
                Простые рецепты
              </span>
            </label>
          </div>
        </div>

        {/* Generate Plan Button */}
        <button
          className="brutal-button w-full text-lg py-4"
          onClick={handleGeneratePlan}
          disabled={generating}
        >
          {generating ? '⏳ ГЕНЕРАЦИЯ...' : '🔥 СГЕНЕРИРОВАТЬ ПЛАН'}
        </button>
      </div>

      {/* Modals */}
      <TagSelectionModal
        isOpen={allergensModalOpen}
        onClose={() => setAllergensModalOpen(false)}
        title="Аллергены"
        icon="🚫"
        tags={allergenTags}
        excludedTags={excludedTags}
        onToggle={handleToggleTagExclusion}
        accentColor="neon-red"
      />

      <TagSelectionModal
        isOpen={dietsModalOpen}
        onClose={() => setDietsModalOpen(false)}
        title="Тип питания"
        icon="🌱"
        tags={dietTags}
        excludedTags={excludedTags}
        onToggle={handleToggleTagExclusion}
        accentColor="neon-lime"
      />

      <TagSelectionModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        title="Предпочтения"
        icon="⚙️"
        tags={preferenceTags}
        excludedTags={excludedTags}
        onToggle={handleToggleTagExclusion}
        accentColor="neon-cyan"
      />

      {/* Product Search Modal */}
      <ProductSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleAddProductExclusion}
        mode="exclude"
        title="Добавить продукт в исключения"
      />
    </div>
  );
};

export default MealPlanPage;
