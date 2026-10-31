// Device Fingerprinting & Single Device Session Management for PetroGeo

const DEVICE_ID_KEY = 'petrogeo_device_id';
const SESSION_TOKEN_KEY = 'petrogeo_session_token';

let inMemoryDeviceId: string | null = null;

/**
 * Returns a persistent unique device identifier for this browser/device.
 * Retains stability even if localStorage is temporarily blocked or restricted.
 */
export function getOrCreateDeviceId(): string {
  if (inMemoryDeviceId) {
    return inMemoryDeviceId;
  }

  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      // Try sessionStorage fallback
      try {
        devId = sessionStorage.getItem(DEVICE_ID_KEY);
      } catch {}
    }

    if (!devId) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timePart = Date.now().toString(36);
      devId = `dev_${timePart}_${randomPart}`;
      try {
        localStorage.setItem(DEVICE_ID_KEY, devId);
      } catch {}
      try {
        sessionStorage.setItem(DEVICE_ID_KEY, devId);
      } catch {}
    }

    inMemoryDeviceId = devId;
    return devId;
  } catch {
    if (!inMemoryDeviceId) {
      inMemoryDeviceId = `dev_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return inMemoryDeviceId;
  }
}

/**
 * Parses user agent to produce a friendly human-readable device name.
 * e.g. "iPhone 14 / Safari", "Samsung / Chrome", "Windows 11 / Chrome"
 */
export function getDeviceFriendlyName(): string {
  if (typeof navigator === 'undefined') return 'جهاز غير معروف';
  const ua = navigator.userAgent;

  let os = 'جهاز كمبيوتر';
  if (/android/i.test(ua)) {
    os = 'هاتف أندرويد (Android)';
  } else if (/iphone/i.test(ua)) {
    os = 'هاتف آيفون (iPhone)';
  } else if (/ipad/i.test(ua)) {
    os = 'جهاز آيباد (iPad)';
  } else if (/windows/i.test(ua)) {
    os = 'كمبيوتر ويندوز (Windows)';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'كمبيوتر ماك (Mac)';
  } else if (/linux/i.test(ua)) {
    os = 'جهاز لينكس (Linux)';
  }

  let browser = '';
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edg/i.test(ua)) {
    browser = 'Edge';
  }

  return browser ? `${os} · متصفح ${browser}` : os;
}

export function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string): void {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // Local storage disabled or error
  }
}

export function removeStoredSessionToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore
  }
}
