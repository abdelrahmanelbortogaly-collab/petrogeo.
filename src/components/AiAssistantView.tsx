import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  PhoneCall,
  Search,
  MapPin,
  Image as ImageIcon,
  Mic,
  Cpu,
  Layers,
  ExternalLink,
  Upload,
  Palette,
  Volume2,
  Database,
  Compass,
} from 'lucide-react';
import { User, PlatformBrand } from '../types';
import { getBrandConfig } from '../utils/platformBranding';
import {
  saveChatMessage,
  saveGeneratedImageDoc,
  getUserGeneratedImages,
  FirestoreGeneratedImage,
} from '../lib/firebase';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  model?: string;
  searchSources?: Array<{ title: string; uri: string }>;
  mapLocations?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

interface AiAssistantViewProps {
  user: User;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  brand?: PlatformBrand;
}

type AiMode = 'chat' | 'live' | 'image';
type ChatModel = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
type ChatRole = 'mentor' | 'petrophysicist' | 'coach';

const PRESET_PROMPTS = [
  'ايه الفرق بين المسامية والنفاذية؟ 🛢️',
  'ازاي أنظم وقتي وأذاكر بتركيز؟ ⏳',
  'أهم حقول البترول والغاز في خليج السويس والبحر المتوسط 📍',
  'أحدث أسعار خام برنت وتطورات إنتاج البترول اليوم 🔍',
  'اشرحلي قانون آرتشي للبتروفيزياء ⚡',
  'مقياس موهس للصلادة بطريقة سهلة أحفظها 💎',
];

const PRESET_IMAGE_PROMPTS = [
  'مقطع جيولوجي ثلاثي الأبعاد لمصيدة بترولية محدبة (Anticline) مع طبقات الصخور وخزان الزيت والغاز 🛢️',
  'بريمة حفر نفط بحرية حديثة في مياه خليج السويس مع غروب الشمس وتفاصيل منصة الحفر 🌊',
  'بلورات معدن الكوارتز الشفافة داخل صخرة جيودية بتفاصيل ثلاثية الأبعاد فائقة الدقة 💎',
  'طبقات الخزان الجيولوجي والصخور المسامية والغطاء الصخري الكتيم (Cap Rock) 🌍',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  user,
  initialPrompt,
  onClearInitialPrompt,
  brand = 'petrogeo',
}) => {
  const brandConfig = getBrandConfig(brand);
  const [activeMode, setActiveMode] = useState<AiMode>('chat');

  // Multi-turn Chat states
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('mentor');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `أهلاً وسهلاً بيك يا ${user.name}! 👋 معاك المساعد الذكي لمنصة ${brandConfig.name}.
أنا جاهز لمساعدتك في أي استفسارات أو أسئلة دراسية وقت ما تحب. اكتب سؤالك هنا وسأساعدك فوراً! 🚀`,
      timestamp: 'الآن',
      model: 'gemini-3.5-flash',
    },
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Voice API states (gemini-3.8-live)
  const [liveQuery, setLiveQuery] = useState('');
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [liveResponse, setLiveResponse] = useState<string>('');
  const [liveAudioPlaying, setLiveAudioPlaying] = useState<boolean>(false);
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);

  // Image Studio states (gemini-3.1-flash-image-preview)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<FirestoreGeneratedImage[]>([]);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [currentImageResult, setCurrentImageResult] = useState<string | null>(null);

  // Load user generated images from Firestore on mount
  useEffect(() => {
    if (user?.id) {
      getUserGeneratedImages(user.id).then((imgs) => {
        if (imgs.length > 0) setGeneratedImages(imgs);
      });
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When initialPrompt is passed (e.g. from Lecture shortcut), place it into input field ONLY.
  // NEVER auto-send unrequested messages or explanations without the user clicking send!
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInput(initialPrompt.trim());
      // Immediately notify parent to clear initialPrompt state so it doesn't linger
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // ------------------- MULTI-TURN CHAT HANDLER -------------------
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Persist user turn to Firestore
    saveChatMessage({
      uid: user.id,
      role: 'user',
      text: userMsg.text,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    });

    try {
      let endpoint = '/api/ai/multiturn-chat';
      let requestBody: any = {
        message: textToSend.trim(),
        model: selectedModel,
        role: selectedRole,
        history: messages
          .filter((m) => m.id !== 'msg-welcome')
          .slice(-10)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
      };

      // If Search Grounding is activated, route to search grounding endpoint (gemini-3.5-flash with googleSearch)
      if (enableSearchGrounding) {
        endpoint = '/api/ai/search-grounding';
        requestBody = { query: textToSend.trim() };
      } else if (enableMapsGrounding) {
        // If Maps Grounding is activated, route to maps grounding endpoint (gemini-3.5-flash with googleMaps)
        endpoint = '/api/ai/maps-grounding';
        requestBody = { query: textToSend.trim(), lat: 26.8206, lng: 30.8025 };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      const aiReply = data.reply || 'معاك ومصحصح يا صاحبي! اسألني في أي حاجة وهرد في الصميم.';

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        model: data.model || selectedModel,
        searchSources: data.sources || undefined,
        mapLocations: data.locations || undefined,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Persist AI response to Firestore
      saveChatMessage({
        uid: user.id,
        role: 'model',
        text: aiMsg.text,
        model: aiMsg.model || selectedModel,
        searchSources: aiMsg.searchSources,
        mapLocations: aiMsg.mapLocations,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Chat API Error:', err);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: 'أنا معاك يا غالي! اسألني في المنهج أو في الحياة وهجاوبك في الصميم بدون أي مشكلة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GEMINI 3.8 LIVE API HANDLER -------------------
  const handleLiveQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLiveStatus('speaking');
    setLiveResponse('جاري المعالجة الفورية عبر نموذج gemini-3.8-live (Live API)...');

    try {
      const res = await fetch('/api/ai/live-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText.trim() }),
      });

      const data = await res.json();
      setLiveResponse(data.reply);

      // Play audio response
      if (data.streamUrl) {
        if (liveAudioRef.current) {
          liveAudioRef.current.pause();
        }
        const audio = new Audio(data.streamUrl);
        liveAudioRef.current = audio;
        setLiveAudioPlaying(true);
        audio.onended = () => {
          setLiveAudioPlaying(false);
          setLiveStatus('idle');
        };
        audio.play().catch(() => {
          setLiveAudioPlaying(false);
          setLiveStatus('idle');
        });
      }
    } catch (err) {
      console.warn('Live API error:', err);
      setLiveResponse('أنا معاك وسامعك يا صاحبي! اسألني في أي حاجة وسأرد فوراً.');
      setLiveStatus('idle');
    }
  };

  // ------------------- IMAGE STUDIO (gemini-3.1-flash-image-preview) -------------------
  const handleGenerateImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || imagePrompt;
    if (!promptToUse.trim() || imageLoading) return;

    setImageLoading(true);
    try {
      const res = await fetch('/api/ai/image-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse.trim(),
          base64Image: selectedImageForEdit || undefined,
          mode: selectedImageForEdit ? 'edit' : 'create',
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setCurrentImageResult(data.imageUrl);

        const newDoc: FirestoreGeneratedImage = {
          uid: user.id,
          prompt: promptToUse.trim(),
          imageUrl: data.imageUrl,
          createdAt: new Date().toISOString(),
        };

        // Save to Firestore
        await saveGeneratedImageDoc(newDoc);
        setGeneratedImages((prev) => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setImageLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-95px)] bg-[#0a101b] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl text-right">
      {/* 1. TOP CONTROL BAR & CAPABILITY TABS */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeMode === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>الشات الذكي (Gemini)</span>
            </button>

            <button
              onClick={() => setActiveMode('live')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeMode === 'live'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>محادثة حية (gemini-3.8-live)</span>
            </button>

            <button
              onClick={() => setActiveMode('image')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeMode === 'image'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>استوديو الصور (gemini-3.1-flash-image)</span>
            </button>
          </div>

          {/* Quick Voice Call Launcher */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('petrogeo-start-voice-call'))}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="بدء مكالمة صوتية فورية مع الروبوت 3D"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>اتصال صوتي فوري 📞</span>
          </button>
        </div>

        {/* 2. CHAT SETTINGS BAR (Visible only in Chat Mode) */}
        {activeMode === 'chat' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60 text-xs">
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>النموذج:</span>
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ChatModel)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
              >
                <option value="gemini-3.5-flash">⚡ gemini-3.5-flash (مهام عامة وشرح المنهج)</option>
                <option value="gemini-3.1-pro-preview">🧠 gemini-3.1-pro-preview (مهام معقدة وتحليل دقيق)</option>
                <option value="gemini-3.1-flash-lite">🚀 gemini-3.1-flash-lite (استجابة فائقة السرعة)</option>
              </select>
            </div>

            {/* Persona / Role Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>الدور:</span>
              </span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ChatRole)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-bold focus:border-cyan-500 focus:outline-none"
              >
                <option value="mentor">🇪🇬 معيد PETROGEO (شعبي وجدع)</option>
                <option value="petrophysicist">🛢️ خبير بتروفيزياء وتحليل آبار</option>
                <option value="coach">⏳ مستشار تنظيم الوقت والتفوق الأكاديمي</option>
              </select>
            </div>

            {/* Grounding Toggles: Search & Maps */}
            <div className="flex items-center gap-2">
              {/* Google Search Grounding */}
              <button
                type="button"
                onClick={() => {
                  setEnableSearchGrounding(!enableSearchGrounding);
                  if (!enableSearchGrounding) setEnableMapsGrounding(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  enableSearchGrounding
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                title="تفعيل البحث المباشر في Google عبر gemini-3.5-flash"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث حي Google Search</span>
              </button>

              {/* Google Maps Grounding */}
              <button
                type="button"
                onClick={() => {
                  setEnableMapsGrounding(!enableMapsGrounding);
                  if (!enableMapsGrounding) setEnableSearchGrounding(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  enableMapsGrounding
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                title="تفعيل استخراج مواقع الآبار والخرائط الجغرافية عبر gemini-3.5-flash"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>خرائط Google Maps</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN BODY BASED ON ACTIVE TAB */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* ================= MODE 1: MULTI-TURN CHAT ================= */}
        {activeMode === 'chat' && (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-amber-400 border border-slate-700 shadow-md'
                    }`}
                  >
                    {isUser ? (
                      user.avatar && user.avatar.startsWith('http') ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )
                    ) : (
                      <img
                        src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
                        alt="3D Robot"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed space-y-2 relative group ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Google Search Grounding Sources */}
                    {msg.searchSources && msg.searchSources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          <span>المصادر الموثوقة من Google Search:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.searchSources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 hover:text-blue-100 hover:bg-blue-900/60 text-[10px] font-medium transition-colors"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Maps Grounding Locations */}
                    {msg.mapLocations && msg.mapLocations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>المواقع الجغرافية على Google Maps:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {msg.mapLocations.map((loc, idx) => (
                            <a
                              key={idx}
                              href={loc.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-200 hover:bg-rose-900/50 text-[11px] font-medium transition-colors"
                            >
                              <span>{loc.title}</span>
                              <ExternalLink className="w-3 h-3 text-rose-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                        isUser
                          ? 'border-amber-600/30 text-slate-900/80'
                          : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.model && (
                          <span className="font-mono text-[9px] bg-slate-950/60 px-1.5 py-0.5 rounded text-amber-400/80">
                            {msg.model}
                          </span>
                        )}
                      </div>

                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-slate-300"
                          title="نسخ الرد"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3 flex-row">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
                  <img
                    src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
                    alt="3D Robot Thinking"
                    className="w-full h-full object-cover animate-pulse"
                  />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                  <span>
                    جاري التوليد عبر نموذج {selectedModel} والتحقق من البيانات...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ================= MODE 2: LIVE VOICE CONVERSATIONS (gemini-3.8-live) ================= */}
        {activeMode === 'live' && (
          <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Gemini 3.8 Live API Voice Engine</span>
              </span>
              <h2 className="text-xl font-black text-slate-100">
                محادثة صوتية حية فائقة السرعة مع المساعد الذكي
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                استجابة فورية في الوقت الفعلي مدعومة بنموذج gemini-3.8-live ومحرك صوت مصري نقي.
              </p>
            </div>

            {/* 3D Visualizer Orb */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative">
                <div
                  className={`w-36 h-36 rounded-full border-4 border-emerald-400 overflow-hidden shadow-2xl relative transition-transform ${
                    liveAudioPlaying ? 'scale-110 ring-8 ring-emerald-500/30' : 'scale-100'
                  }`}
                >
                  <img
                    src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
                    alt="Live 3D Robot"
                    className="w-full h-full object-cover"
                  />
                </div>

                {liveAudioPlaying && (
                  <div className="absolute -inset-4 border-2 border-emerald-400/60 rounded-full animate-ping pointer-events-none" />
                )}
              </div>

              {/* Dynamic Sound Equalizer */}
              <div className="flex items-center justify-center gap-1.5 mt-6">
                <span className={`w-1.5 bg-emerald-400 rounded-full transition-all ${liveAudioPlaying ? 'h-6 animate-bounce' : 'h-2'}`} />
                <span className={`w-1.5 bg-emerald-400 rounded-full transition-all ${liveAudioPlaying ? 'h-10 animate-bounce delay-100' : 'h-2'}`} />
                <span className={`w-1.5 bg-emerald-400 rounded-full transition-all ${liveAudioPlaying ? 'h-8 animate-bounce delay-200' : 'h-2'}`} />
                <span className={`w-1.5 bg-emerald-400 rounded-full transition-all ${liveAudioPlaying ? 'h-12 animate-bounce delay-75' : 'h-2'}`} />
                <span className={`w-1.5 bg-emerald-400 rounded-full transition-all ${liveAudioPlaying ? 'h-5 animate-bounce delay-150' : 'h-2'}`} />
              </div>
            </div>

            {/* Live Response Box */}
            {liveResponse && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-xs md:text-sm text-right leading-relaxed shadow-lg max-w-xl mx-auto">
                <span className="font-bold text-emerald-400 block mb-1">
                  رد gemini-3.8-live:
                </span>
                {liveResponse}
              </div>
            )}

            {/* Live Input Controls */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLiveQuery(liveQuery);
                setLiveQuery('');
              }}
              className="flex items-center gap-2 max-w-xl mx-auto"
            >
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-lg cursor-pointer"
              >
                تحدث مع Live API 🎙️
              </button>
              <input
                type="text"
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                placeholder="اسأل أي سؤال في هندسة البترول أو المنهج وسيجيبك Live API صوتياً..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 text-right focus:outline-none focus:border-emerald-500"
              />
            </form>
          </div>
        )}

        {/* ================= MODE 3: IMAGE STUDIO (gemini-3.1-flash-image-preview) ================= */}
        {activeMode === 'image' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" />
                  <span>استوديو الصور الجيولوجية (gemini-3.1-flash-image-preview)</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  توليد مقاطع جيولوجية ومخططات آبار ونماذج بلورات وتعديلها بالأوامر النصية.
                </p>
              </div>
              <div className="text-[11px] text-amber-400 font-mono">
                حفظ مستمر في Firestore ☁️
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">أفكار ومقترحات سريعة للتوليد:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PRESET_IMAGE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setImagePrompt(p);
                      handleGenerateImage(p);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-slate-800 text-right text-xs text-slate-300 transition-all cursor-pointer leading-relaxed"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt & Generation Box */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  {selectedImageForEdit ? 'تعديل الصورة المحددة بأمر نصي:' : 'اكتب وصف الصورة الجيولوجية المطلوبة:'}
                </label>
                {selectedImageForEdit && (
                  <button
                    onClick={() => setSelectedImageForEdit(null)}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    إلغاء وضع التعديل وإنشاء صورة جديدة
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateImage()}
                  disabled={imageLoading || !imagePrompt.trim()}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  {imageLoading ? 'جاري التوليد...' : selectedImageForEdit ? 'تعديل الصورة 🎨' : 'توليد الصورة ⚡'}
                </button>
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="مثال: مقطع عرضي لصخور مكمن بترولي يوضح الفراغات والمسامية والنفاذية..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 text-right focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Current Result Showcase */}
            {currentImageResult && (
              <div className="p-4 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>النتيجة الأخيرة:</span>
                  <button
                    onClick={() => {
                      setSelectedImageForEdit(currentImageResult);
                      setImagePrompt('أضف تسميات توضيحية لطبقات الصخر وسهم يشير لمكمن البترول');
                    }}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors cursor-pointer"
                  >
                    تعديل هذه الصورة بأمر جديد ✏️
                  </button>
                </div>
                <div className="max-h-96 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img
                    src={currentImageResult}
                    alt="Generated Geology Result"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Firestore Saved Images Gallery */}
            {generatedImages.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>معرض الصور الجيولوجية المحفوظة في قاعدة بياناتك (Firestore):</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentImageResult(img.imageUrl);
                        setSelectedImageForEdit(img.imageUrl);
                      }}
                      className="group cursor-pointer rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all p-1.5 space-y-1"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-950">
                        <img
                          src={img.imageUrl}
                          alt={img.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate text-right">
                        {img.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CHAT INPUT FOOTER (Active in Chat Mode) */}
      {activeMode === 'chat' && (
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 space-y-2">
          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3" />
              <span>اقتراحات:</span>
            </span>
            {PRESET_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSend(prompt)}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-800 transition-all cursor-pointer whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-2xl transition-colors font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
              title="إرسال"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك في الجيولوجيا، البترول، أو أي موضوع في الحياة..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-200 text-right focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </form>
        </div>
      )}
    </div>
  );
};
