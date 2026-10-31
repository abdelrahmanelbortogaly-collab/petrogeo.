import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite client-exposed env vars or localStorage cache
const getCachedUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('petrogeo_supabase_url');
    if (stored) return stored;
  }
  const env = import.meta.env as any;
  return env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getCachedAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('petrogeo_supabase_anon_key');
    if (stored) return stored;
  }
  const env = import.meta.env as any;
  return env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_KEY || '';
};

let currentUrl = getCachedUrl();
let currentAnonKey = getCachedAnonKey();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    currentUrl &&
    currentUrl.startsWith('http') &&
    !currentUrl.includes('your-project') &&
    !currentUrl.includes('placeholder') &&
    currentAnonKey &&
    !currentAnonKey.includes('your-anon-key') &&
    !currentAnonKey.includes('placeholder')
  );
};

export const getSupabaseUrl = () => currentUrl;
export const getSupabaseAnonKey = () => currentAnonKey;

// Active Supabase instance
let activeClient: SupabaseClient = createClient(
  currentUrl || 'https://placeholder.supabase.co',
  currentAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Proxy object so calls like supabase.auth or supabase.from() always target activeClient dynamically
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (activeClient as any)[prop];
  },
});

// Update the active Supabase client at runtime
export function updateSupabaseClient(url: string, anonKey: string) {
  if (!url || !anonKey) return;
  currentUrl = url.trim();
  currentAnonKey = anonKey.trim();
  try {
    localStorage.setItem('petrogeo_supabase_url', currentUrl);
    localStorage.setItem('petrogeo_supabase_anon_key', currentAnonKey);
  } catch (_) {}

  activeClient = createClient(currentUrl, currentAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Disconnect/clear Supabase client
export function clearSupabaseClient() {
  currentUrl = '';
  currentAnonKey = '';
  try {
    localStorage.removeItem('petrogeo_supabase_url');
    localStorage.removeItem('petrogeo_supabase_anon_key');
  } catch (_) {}
  activeClient = createClient(
    'https://placeholder.supabase.co',
    'placeholder-anon-key',
    {
      auth: { persistSession: false },
    }
  );
}

// Auto-sync public config from backend on startup
export async function syncSupabaseConfigFromBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/public-config');
    if (res.ok) {
      const data = await res.json();
      if (data.configured && data.url && data.anonKey) {
        if (data.url !== currentUrl || data.anonKey !== currentAnonKey) {
          updateSupabaseClient(data.url, data.anonKey);
          return true;
        }
      }
    }
  } catch (_) {}
  return false;
}

// Automatically sync when module loads in browser
if (typeof window !== 'undefined') {
  syncSupabaseConfigFromBackend().catch(() => {});
}

/**
 * Upload a file directly to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  bucketName: 'course-materials' | 'receipts' | 'avatars',
  filePath: string,
  file: File | Blob
): Promise<{ url: string | null; error: Error | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { url: null, error: new Error('Supabase is not configured') };
    }

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error(`[Supabase Storage] Error uploading to ${bucketName}:`, err);
    return { url: null, error: err };
  }
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  url: string;
}> {
  const targetUrl = (customUrl || currentUrl || '').trim();
  const targetKey = (customKey || currentAnonKey || '').trim();

  if (!targetUrl || !targetKey || !targetUrl.startsWith('http') || targetUrl.includes('placeholder')) {
    return {
      success: false,
      message: 'بيانات Supabase غير مكتملة (يرجى إدخال عنوان المشروع ومفتاح الـ API العام)',
      url: targetUrl || 'غير محدد',
    };
  }

  try {
    // Quick REST ping
    const pingRes = await fetch(`${targetUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: targetKey,
        Authorization: `Bearer ${targetKey}`,
      },
    });

    if (pingRes.status === 401 || pingRes.status === 403) {
      return {
        success: false,
        message: 'مفتاح الـ API غير صالح! تأكد من نسخ مفتاح anon public الصحيح من إعدادات Supabase.',
        url: targetUrl,
      };
    }

    return {
      success: true,
      message: 'تم الاتصال بمشروع Supabase بنجاح واستجابة الخادم سليمة 🟢',
      url: targetUrl,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `تعذر الاتصال بمشروع Supabase: ${e.message}`,
      url: targetUrl,
    };
  }
}
