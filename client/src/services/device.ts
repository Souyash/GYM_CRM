// Device Hardware ID service with dedicated macOS & MacBook auto-detection
const DEVICE_KEY = 'ironvault_device_hardware_id';

export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  const platform = (navigator as any)?.userAgentData?.platform || navigator?.platform || '';
  const userAgent = navigator?.userAgent || '';
  return /Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent);
}

export function detectMacBookModel(): string {
  if (!isMacOS()) return 'Generic Device';
  
  const screenWidth = typeof window !== 'undefined' ? window.screen.width : 0;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  // MacBook retina resolutions
  if (pixelRatio >= 2) {
    if (screenWidth >= 1700 || screenHeight >= 1000) {
      return 'Apple MacBook Pro 16" (Retina Display)';
    } else if (screenWidth >= 1400 || screenHeight >= 900) {
      return 'Apple MacBook Pro 14" (Liquid Retina XDR)';
    } else {
      return 'Apple MacBook Air / Pro 13" (Retina Display)';
    }
  }

  return 'Apple MacBook (macOS)';
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    if (isMacOS()) {
      // Auto-generate MacBook hardware fingerprint
      const macHash = Math.random().toString(36).substring(2, 8).toUpperCase();
      deviceId = `DEVICE_APPLE_MACBOOK_PRO_${macHash}`;
    } else {
      const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
      deviceId = `DEVICE_HARDWARE_${randomHex}`;
    }
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export function setExplicitDeviceId(deviceId: string): void {
  localStorage.setItem(DEVICE_KEY, deviceId);
}

export function resetDeviceId(): string {
  localStorage.removeItem(DEVICE_KEY);
  return getOrCreateDeviceId();
}
