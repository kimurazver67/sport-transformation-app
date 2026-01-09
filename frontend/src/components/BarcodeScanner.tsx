// frontend/src/components/BarcodeScanner.tsx

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner = ({ isOpen, onClose, onScan }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        const scanner = new Html5Qrcode('barcode-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            // Успешное сканирование
            console.log('[BarcodeScanner] Отсканирован код:', decodedText);
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Ошибка сканирования (игнорируем - это нормально пока не найден код)
          }
        );
      } catch (err) {
        console.error('[BarcodeScanner] Ошибка запуска:', err);
        if (err instanceof Error) {
          if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
            setError('Доступ к камере запрещён. Разрешите доступ в настройках браузера.');
          } else if (err.message.includes('NotFoundError')) {
            setError('Камера не найдена на устройстве.');
          } else {
            setError(`Ошибка камеры: ${err.message}`);
          }
        } else {
          setError('Не удалось запустить сканер');
        }
      } finally {
        setIsStarting(false);
      }
    };

    // Небольшая задержка для монтирования DOM
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('[BarcodeScanner] Ошибка остановки:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-void/95 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="brutal-card max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b-2 border-void-400 flex items-center justify-between">
          <h2 className="font-display font-bold text-steel-100 text-lg uppercase">
            Сканер штрихкода
          </h2>
          <button
            onClick={handleClose}
            className="text-steel-500 hover:text-steel-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4" ref={containerRef}>
          {isStarting && (
            <div className="flex items-center justify-center py-16">
              <div className="text-neon-lime font-mono text-sm animate-pulse">
                Запуск камеры...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 text-red-400 font-mono text-sm mb-4">
              {error}
            </div>
          )}

          <div
            id="barcode-reader"
            className="w-full overflow-hidden rounded"
            style={{ minHeight: isStarting || error ? 0 : 300 }}
          />

          <p className="font-mono text-xs text-steel-500 text-center mt-4">
            Наведите камеру на штрихкод продукта
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-void-400">
          <button onClick={handleClose} className="brutal-button w-full">
            ОТМЕНА
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
