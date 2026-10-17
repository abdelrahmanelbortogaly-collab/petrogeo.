import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Lock,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';
import { User, PlatformSettings, PaymentRequest } from '../types';

interface InstaPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPaymentSuccess?: () => void;
}

export const InstaPayModal: React.FC<InstaPayModalProps> = ({
  isOpen,
  onClose,
  user,
  onPaymentSuccess,
}) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [senderPhone, setSenderPhone] = useState(user.phone || '');
  const [refNumber, setRefNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [latestPayment, setLatestPayment] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings & existing payment status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/payment-status', {
        headers: {
          'x-user-id': user.id,
          'x-user-email': user.email,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setLatestPayment(data.latestPayment);
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, user.id]);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      setError('يرجى إرفاق صورة إشعار أو لقطة شاشة للتحويل من تطبيق InstaPay');
      return;
    }
    if (!senderPhone.trim()) {
      setError('يرجى إدخال رقم الهاتف المحول منه');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload receipt image
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: receiptFileName || `receipt_${Date.now()}.jpg`,
          data: receiptImage,
          type: 'image/jpeg',
        }),
      });

      if (!uploadRes.ok) throw new Error('فشل رفع صورة الإيصال إلى الخادم');
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2. Submit payment request
      const payRes = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          studentPhone: user.phone,
          studentYear: user.year,
          studentDepartment: user.department,
          amount: settings?.subscriptionPrice || 150,
          senderPhone: senderPhone.trim(),
          referenceNumber: refNumber.trim(),
          receiptImageUrl: imageUrl,
        }),
      });

      if (!payRes.ok) {
        const errorData = await payRes.json();
        throw new Error(errorData.error || 'تعذر إرسال طلب الاشتراك');
      }

      const result = await payRes.json();
      setLatestPayment(result.payment);
      setSuccessMessage('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعته وتفعيل حسابك خلال دقائق.');
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const targetNumber = settings?.instapayNumber || '01007821389';
  const targetAccount = settings?.instapayAccountName || 'م. عبدالرحمن محمد';
  const targetPrice = settings?.subscriptionPrice || 150;
  const isPaid = user.subscriptionStatus === 'active';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-right"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/30 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                <span>الاشتراك عبر InstaPay 🇪🇬</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  انستا باي
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تفعيل الوصول الكامل للمحاضرات، السكاشين، ومذكرات الـ PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active Subscription Banner */}
          {isPaid && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-black">اشتراكك مفعل بنجاح! 👑</h4>
              <p className="text-xs text-slate-300">
                لديك صلاحية الوصول لكافة الكورسات والمحاضرات والسكاشين المعملية بدون أي قيود.
              </p>
            </div>
          )}

          {/* Pending Request Status */}
          {!isPaid && latestPayment?.status === 'pending' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2 text-center animate-pulse">
              <Clock className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-black">طلب اشتراكك قيد المراجعة لدى الإدارة ⏳</h4>
              <p className="text-xs text-slate-300">
                تم استلام إيصال التحويل بمبلغ ({latestPayment.amount} ج.م) وجاري تأكيده وتفعيل حسابك تلقائياً.
              </p>
            </div>
          )}

          {/* InstaPay Transfer Info Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">سعر الاشتراك الحالي:</span>
              <span className="text-lg font-black text-amber-400">
                {targetPrice} <span className="text-xs font-bold text-slate-400">جنيه مصري</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-purple-300 block">
                رقم موبايل التحويل عبر InstaPay:
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-purple-500/40">
                <span className="font-mono text-base sm:text-lg font-black text-amber-400 flex-1 tracking-wider text-center" dir="ltr">
                  {targetNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyNumber(targetNumber)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">اسم صاحب الحساب:</span>
                <span className="font-bold text-slate-200 mt-0.5 block">{targetAccount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">صلاحية الاشتراك:</span>
                <span className="font-bold text-slate-200 mt-0.5 block">
                  {settings?.subscriptionDuration || 'فصل دراسي كامل'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
              💡 {settings?.paymentInstructions || 'قم بفتح تطبيق InstaPay على هاتفك، اختر تحويل إلى رقم هاتف، أدخل الرقم أعلاه والمبلغ، ثم التقط صورة للإيصال وارفعها بالأسفل.'}
            </div>
          </div>

          {/* Payment Submission Form */}
          {!isPaid && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  رقم الهاتف الذي قمت بالتحويل منه (رقمك على انستا باي): *
                </label>
                <input
                  type="text"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-right"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  رقم العملية المرجعي من انستا باي (اختياري):
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Reference Number (مثال: 98432174)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-right"
                  dir="ltr"
                />
              </div>

              {/* Upload Receipt Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  صورة إشعار التحويل / الإيصال: *
                </label>
                <div className="border-2 border-dashed border-purple-500/40 hover:border-purple-500 rounded-2xl p-4 text-center bg-slate-950/60 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {receiptImage ? (
                    <div className="space-y-2">
                      <img
                        src={receiptImage}
                        alt="Receipt preview"
                        className="w-32 h-32 object-cover rounded-xl mx-auto border border-purple-500/50 shadow-md"
                      />
                      <p className="text-xs font-bold text-emerald-400">
                        تم اختيار الإيصال: {receiptFileName} (اضغط للتغيير)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        اضغط هنا لرفع صورة الإيصال أو سكرين شوت InstaPay
                      </p>
                      <p className="text-[10px] text-slate-400">
                        يدعم صيغ JPG, PNG, WEBP (حتى 10 ميجابايت)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد التحويل وإرسال الطلب للإدارة 🚀</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
