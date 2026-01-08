// frontend/src/components/ProductSearchModal.tsx

import { useState } from 'react';
import { api } from '../services/api';
import type { Product } from '../types';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product & { source: 'local' | 'openfoodfacts' }) => void;
  mode: 'exclude' | 'replace' | 'add';
  title?: string;
}

const ProductSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  mode,
  title = 'Поиск продуктов'
}: ProductSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Product & { source: 'local' | 'openfoodfacts' }>>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'all' | 'local' | 'openfoodfacts'>('all');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.length < 2) {
      setError('Введите минимум 2 символа');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.searchProducts(query, source, 20);
      setResults(data.products || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Ошибка поиска');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (product: Product & { source: 'local' | 'openfoodfacts' }) => {
    onSelect(product);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="brutal-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-void-400">
          <h2 className="font-display font-bold text-steel-100 text-xl uppercase">
            {title}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-void-400">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите название продукта..."
              className="flex-1 bg-void-300 border-2 border-steel-600 text-steel-100
                         px-4 py-2 font-mono text-sm focus:border-neon-lime outline-none"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="brutal-button px-6"
            >
              {loading ? 'ПОИСК...' : 'ПОИСК'}
            </button>
          </div>

          {/* Source Filter */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSource('all')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'all'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              ВСЕ
            </button>
            <button
              onClick={() => setSource('local')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'local'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              ЛОКАЛЬНАЯ_БД
            </button>
            <button
              onClick={() => setSource('openfoodfacts')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'openfoodfacts'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              OPENFOODFACTS
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-500 text-red-400 font-mono text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {results.length === 0 && !loading && !error && (
            <p className="font-mono text-sm text-steel-500 text-center py-8">
              Введите запрос для поиска продуктов
            </p>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-neon-lime font-mono text-sm animate-pulse">
                Поиск продуктов...
              </div>
            </div>
          )}

          {results.map((product, index) => (
            <div
              key={product.id || product.openfoodfacts_code || index}
              className="bg-void-300 border border-void-400 p-3 hover:border-neon-lime transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-bold text-steel-100">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <span className="font-mono text-xs text-steel-500">
                        ({product.brand})
                      </span>
                    )}
                    <span className={`font-mono text-xs px-2 py-0.5 ${
                      product.source === 'local'
                        ? 'bg-neon-lime/20 text-neon-lime'
                        : 'bg-neon-cyan/20 text-neon-cyan'
                    }`}>
                      {product.source === 'local' ? 'БД' : 'OFF'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-steel-400 mt-1">
                    {Math.round(Number(product.calories))} ккал |
                    Б: {Math.round(Number(product.protein))}г |
                    Ж: {Math.round(Number(product.fat))}г |
                    У: {Math.round(Number(product.carbs))}г
                  </p>
                </div>
                <button
                  onClick={() => handleSelect(product)}
                  className="brutal-button-sm ml-4"
                >
                  {mode === 'exclude' ? '+ ИСКЛЮЧИТЬ' : mode === 'replace' ? 'ЗАМЕНИТЬ' : '+ ДОБАВИТЬ'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-void-400">
          <button onClick={onClose} className="brutal-button w-full">
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
