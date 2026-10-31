import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface UseAntiScreenshotOptions {
  enabled?: boolean;
  user?: User;
  onViolation?: (type: 'screenshot' | 'blur' | 'print' | 'devtools') => void;
}

export const useAntiScreenshot = ({
  enabled = true,
  user,
  onViolation,
}: UseAntiScreenshotOptions = {}) => {
  const [isBlackedOut, setIsBlackedOut] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Trigger temporary blackout and warning
  const triggerProtection = useCallback(
    (reason: string) => {
      setIsBlackedOut(true);
      setWarningMessage(reason);

      // Overwrite clipboard to clear any taken screenshot or copied text
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(
            '⚠️ المحتوى الأكاديمي لمنصة PETROGEO محمي قانونياً بحقوق الملكية الفكرية. يُحظر تصوير الشاشة أو التسريب.'
          ).catch(() => {});
        }
      } catch (_) {}

      setTimeout(() => {
        setIsBlackedOut(false);
        setWarningMessage(null);
      }, 2800);
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;

    // 1. Detect PrintScreen and screenshot shortcut keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('⚠️ تم حجب المحتوى: محاولة أخذ لقطة شاشة (PrintScreen) محظورة لحماية المحتوى.');
        onViolation?.('screenshot');
        return;
      }

      // Windows + Shift + S or Shift + Cmd + 3 / 4 / 5 (Mac screenshots)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5')
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('⚠️ محاولة تصوير الشاشة محظورة ومسجلة أمنياً.');
        onViolation?.('screenshot');
        return;
      }

      // Print shortcut (Ctrl + P / Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('⚠️ طباعة أو تصدير المستند غير متاح للطلاب لحماية حقوق الملكية.');
        onViolation?.('print');
        return;
      }

      // Save page shortcut (Ctrl + S / Cmd + S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('⚠️ حفظ المستند غير مصرح به.');
        return;
      }

      // DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) &&
          (e.key === 'u' || e.key === 'U' || (e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key))))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerProtection('⚠️ أدوات فحص الصفحة معطلة لحماية المحتوى.');
        onViolation?.('devtools');
        return;
      }
    };

    // 2. Blur detection: when Snipping Tool or external screenshot tool captures focus
    const handleWindowBlur = () => {
      setIsBlurred(true);
      onViolation?.('blur');
    };

    const handleWindowFocus = () => {
      // Small debounce to allow smooth return
      setTimeout(() => {
        setIsBlurred(false);
      }, 150);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setTimeout(() => {
          setIsBlurred(false);
        }, 150);
      }
    };

    // 3. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, triggerProtection, onViolation]);

  return {
    isBlackedOut,
    isBlurred,
    warningMessage,
    triggerProtection,
  };
};
