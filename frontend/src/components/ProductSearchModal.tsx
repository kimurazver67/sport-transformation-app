// frontend/src/components/ProductSearchModal.tsx

import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { Product } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product & { source: 'local' | 'openfoodfacts' }) => void;
  mode: 'exclude' | 'replace' | 'add';
  title?: string;
}

// Декодирование HTML entities
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState<'all' | 'local' | 'openfoodfacts'>('all');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const listRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (reset = true) => {
    if (query.length < 2) {
      setError('Введите минимум 2 символа');
      return;
    }

    if (reset) {
      setLoading(true);
      setResults([]);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const newOffset = reset ? 0 : offset;
      const data = await api.searchProducts(query, source, ITEMS_PER_PAGE + newOffset);

      // Получаем только новые результаты
      const newProducts = reset ? (data.products || []) : (data.products || []).slice(newOffset);

      if (reset) {
        setResults(newProducts);
      } else {
        setResults(prev => [...prev, ...newProducts.slice(prev.length - newOffset)]);
      }

      // Если вернулось меньше чем запросили - значит больше нет
      setHasMore((data.products || []).length >= ITEMS_PER_PAGE + newOffset);
      setOffset(newOffset + ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Ошибка поиска');
      if (reset) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!listRef.current || loadingMore || !hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    // Загружаем больше когда до конца осталось 100px
    if (scrollHeight - scrollTop - clientHeight < 100) {
      handleSearch(false);
    }
  }, [loadingMore, hasMore, loading, offset, query, source]);

  const handleSelect = async (product: Product & { source: 'local' | 'openfoodfacts' }) => {
    onSelect(product);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch(true);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    setScannerLoading(true);
    setError(null);

    try {
      const data = await api.getProductByBarcode(barcode);

      if (data.product) {
        // Продукт найден - сразу показываем в результатах
        setResults([data.product]);
        setHasMore(false);
        setQuery(`Штрихкод: ${barcode}`);
      } else {
        setError(`Продукт со штрихкодом ${barcode} не найден`);
        setResults([]);
      }
    } catch (err) {
      console.error('Barcode search failed:', err);
      setError(err instanceof Error ? err.message : 'Ошибка поиска по штрихкоду');
    } finally {
      setScannerLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="brutal-card max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-void-400 flex-shrink-0">
          <h2 className="font-display font-bold text-steel-100 text-xl uppercase">
            {title}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-void-400 flex-shrink-0">
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
              onClick={() => handleSearch(true)}
              disabled={loading || scannerLoading}
              className="brutal-button px-6 flex-shrink-0"
            >
              {loading ? '...' : 'ПОИСК'}
            </button>
            <button
              onClick={() => setShowScanner(true)}
              disabled={scannerLoading}
              className="brutal-button px-3 flex-shrink-0"
              title="Сканировать штрихкод"
            >
              {scannerLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Source Filter */}
          <div className="flex gap-2 mt-3 flex-wrap">
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

        {/* Results - scrollable area */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
        >
          {results.length === 0 && !loading && !error && (
            <p className="font-mono text-sm text-steel-500 text-center py-8">
              Введите запрос для поиска продуктов
            </p>
          )}

          {loading && results.length === 0 && (
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
              <div className="flex items-start gap-2">
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-mono text-sm font-bold text-steel-100 break-words line-clamp-2">
                      {decodeHtmlEntities(product.name)}
                    </h3>
                    <span className={`font-mono text-xs px-1.5 py-0.5 flex-shrink-0 ${
                      product.source === 'local'
                        ? 'bg-neon-lime/20 text-neon-lime'
                        : 'bg-neon-cyan/20 text-neon-cyan'
                    }`}>
                      {product.source === 'local' ? 'БД' : 'OFF'}
                    </span>
                  </div>
                  {product.brand && (
                    <p className="font-mono text-xs text-steel-500 mt-0.5 truncate">
                      {decodeHtmlEntities(product.brand)}
                    </p>
                  )}
                  <p className="font-mono text-xs text-steel-400 mt-1">
                    {Math.round(Number(product.calories))} ккал | Б: {Math.round(Number(product.protein))}г | Ж: {Math.round(Number(product.fat))}г | У: {Math.round(Number(product.carbs))}г
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleSelect(product)}
                  className="brutal-button-sm flex-shrink-0 text-xs whitespace-nowrap"
                >
                  {mode === 'exclude' ? '+ ИСКЛ' : mode === 'replace' ? 'ЗАМЕН' : '+ ДОБ'}
                </button>
              </div>
            </div>
          ))}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="text-neon-lime font-mono text-xs animate-pulse">
                Загрузка...
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && results.length > 0 && (
            <p className="font-mono text-xs text-steel-500 text-center py-4">
              Показано {results.length} продуктов
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-void-400 flex-shrink-0">
          <button onClick={onClose} className="brutal-button w-full">
            ЗАКРЫТЬ
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default ProductSearchModal;
