// frontend/src/pages/MealPlanPage.tsx

import { useState, useEffect } from 'react';
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

const MealPlanPage = () => {
  const { user } = useStore();
  const [excludedProducts, setExcludedProducts] = useState<Product[]>([]);
  const [excludedTags, setExcludedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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

  // Calculate KBJU from user's weight and goal
  const kbju = user.start_weight && user.goal
    ? calculateKBJU(user.start_weight, user.goal)
    : null;

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="brutal-card p-6">
          <h1 className="font-display font-bold text-3xl text-steel-100 uppercase mb-2">
            🍽️ План питания
          </h1>
          <p className="font-mono text-sm text-steel-400">
            Настройте ваши предпочтения и исключения
          </p>
        </div>

        {/* КБЖУ Info */}
        {kbju && (
          <div className="brutal-card p-6">
            <h2 className="font-mono font-bold text-sm text-steel-100 mb-4 uppercase">
              📊 Ваши целевые КБЖУ
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-void-300 p-3 border border-void-400">
                <div className="font-mono text-xs text-steel-500 mb-1">Калории</div>
                <div className="font-display text-2xl text-neon-lime">
                  {kbju.calories}
                </div>
                <div className="font-mono text-xs text-steel-500">ккал/день</div>
              </div>
              <div className="bg-void-300 p-3 border border-void-400">
                <div className="font-mono text-xs text-steel-500 mb-1">Белки</div>
                <div className="font-display text-2xl text-neon-cyan">
                  {kbju.protein}
                </div>
                <div className="font-mono text-xs text-steel-500">г</div>
              </div>
              <div className="bg-void-300 p-3 border border-void-400">
                <div className="font-mono text-xs text-steel-500 mb-1">Жиры</div>
                <div className="font-display text-2xl text-neon-orange">
                  {kbju.fat}
                </div>
                <div className="font-mono text-xs text-steel-500">г</div>
              </div>
              <div className="bg-void-300 p-3 border border-void-400">
                <div className="font-mono text-xs text-steel-500 mb-1">Углеводы</div>
                <div className="font-display text-2xl text-neon-purple">
                  {kbju.carbs}
                </div>
                <div className="font-mono text-xs text-steel-500">г</div>
              </div>
            </div>
          </div>
        )}

        {/* Allergens */}
        <div className="brutal-card p-6">
          <h2 className="font-mono font-bold text-sm text-steel-100 mb-4 uppercase">
            🚫 Аллергены и непереносимости
          </h2>
          <div className="flex flex-wrap gap-2">
            {allergenTags.map(tag => {
              const isExcluded = excludedTags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTagExclusion(tag.id)}
                  className={`px-4 py-2 border font-mono text-sm ${
                    isExcluded
                      ? 'border-neon-red text-neon-red bg-neon-red/10'
                      : 'border-steel-600 text-steel-400'
                  }`}
                >
                  {isExcluded && '✓ '}
                  {tag.name_ru}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diets */}
        <div className="brutal-card p-6">
          <h2 className="font-mono font-bold text-sm text-steel-100 mb-4 uppercase">
            🌱 Типы питания
          </h2>
          <div className="flex flex-wrap gap-2">
            {dietTags.map(tag => {
              const isExcluded = excludedTags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTagExclusion(tag.id)}
                  className={`px-4 py-2 border font-mono text-sm ${
                    isExcluded
                      ? 'border-neon-lime text-neon-lime bg-neon-lime/10'
                      : 'border-steel-600 text-steel-400'
                  }`}
                >
                  {isExcluded && '✓ '}
                  {tag.name_ru}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferences */}
        <div className="brutal-card p-6">
          <h2 className="font-mono font-bold text-sm text-steel-100 mb-4 uppercase">
            ⚙️ Предпочтения
          </h2>
          <div className="flex flex-wrap gap-2">
            {preferenceTags.map(tag => {
              const isExcluded = excludedTags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTagExclusion(tag.id)}
                  className={`px-4 py-2 border font-mono text-sm ${
                    isExcluded
                      ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                      : 'border-steel-600 text-steel-400'
                  }`}
                >
                  {isExcluded && '✓ '}
                  {tag.name_ru}
                </button>
              );
            })}
          </div>
        </div>

        {/* Excluded Products */}
        <div className="brutal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold text-sm text-steel-100 uppercase">
              🍎 Исключённые продукты
            </h2>
            <button
              onClick={() => setSearchModalOpen(true)}
              className="brutal-button-sm"
            >
              + ДОБАВИТЬ
            </button>
          </div>

          {excludedProducts.length === 0 ? (
            <p className="font-mono text-sm text-steel-500 text-center py-4">
              Нет исключённых продуктов
            </p>
          ) : (
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
                    className="text-neon-red hover:text-neon-red/70 font-mono text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Plan Button */}
        <div className="brutal-card p-6">
          <button
            className="brutal-button w-full text-lg py-4"
            disabled
          >
            🚧 СГЕНЕРИРОВАТЬ ПЛАН (Coming Soon)
          </button>
          <p className="font-mono text-xs text-steel-500 text-center mt-2">
            Генерация планов питания будет доступна в следующей версии
          </p>
        </div>
      </div>

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
