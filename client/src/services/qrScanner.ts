import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/browser';

let zxingReader: BrowserQRCodeReader | null = null;
let nativeDetector: any = null;
let nativeDetectorChecked = false;

function getNativeDetector() {
  if (nativeDetectorChecked) return nativeDetector;
  nativeDetectorChecked = true;
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      nativeDetector = null;
    }
  }
  return nativeDetector;
}

/**
 * Scan a single video frame from an HTML5 video stream using hardware BarcodeDetector + jsQR fallback
 */
export async function scanVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<string | null> {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  // Engine 1: Native Hardware BarcodeDetector (Chrome, Edge, Android, iOS Safari 17+)
  const detector = getNativeDetector();
  if (detector) {
    try {
      const barcodes = await detector.detect(video);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch {
      // Fall through to jsQR
    }
  }

  // Engine 2: Full-frame jsQR on canvas
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Sync canvas dimensions with video resolution
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth'
  });

  if (code && code.data) {
    return code.data;
  }

  return null;
}

/**
 * Scan an image file (uploaded photo / screenshot) using multi-engine fallback
 */
export async function scanImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = async () => {
        // Engine 1: BarcodeDetector
        const detector = getNativeDetector();
        if (detector) {
          try {
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              resolve(barcodes[0].rawValue);
              return;
            }
          } catch {}
        }

        // Engine 2: jsQR on canvas
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (code && code.data) {
              resolve(code.data);
              return;
            }
          }
        } catch {}

        // Engine 3: ZXing
        try {
          if (!zxingReader) zxingReader = new BrowserQRCodeReader();
          const result = await zxingReader.decodeFromImageUrl(dataUrl);
          if (result && result.getText()) {
            resolve(result.getText());
            return;
          }
        } catch {}

        resolve(null);
      };

      img.onerror = () => resolve(null);
      img.src = dataUrl;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
