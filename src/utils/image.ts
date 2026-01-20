/**
 * Сжимает изображение до указанных размеров и качества
 */
export async function compressImage(
  file: File | string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Создаём canvas и рисуем изображение
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в JPEG с указанным качеством
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Если передан File, конвертируем в base64
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    } else {
      // Если уже base64 или URL
      img.src = file;
    }
  });
}

/**
 * Получает размер base64 строки в байтах
 */
export function getBase64Size(base64: string): number {
  // Убираем data:image/...;base64, префикс
  const base64Data = base64.split(',')[1] || base64;
  // Каждый символ base64 = 6 бит, поэтому 4 символа = 3 байта
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Форматирует размер в человекочитаемый формат
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
