import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  X,
  Minimize2,
  Maximize2,
  MessageCircle,
  Send,
  Radio,
  Sliders,
  MessageSquare,
} from 'lucide-react';
import { User } from '../types';

export type RobotMood = 'happy' | 'talking' | 'listening' | 'thinking' | 'wink' | 'idle';

interface FloatingRobotProps {
  user: User;
  onOpenAiTab: (prompt?: string) => void;
}

const QUICK_LIFE_AND_CURRICULUM_QUESTIONS = [
  'عامل إيه يا صاحبي؟ الدنيا ماشية معاك إزاي؟ 👋',
  'إزاي أنظم وقتي وأذاكر بتركيز من غير وجع دماغ؟ ⏳',
  'إيه الفرق بين المسامية والنفاذية على بلاطة؟ 🛢️',
  'اشرحلي قانون آرتشي في كلمتين بلدي ⚡',
  'إزاي أعمل قهوة مظبوطة تعدل الدماغ؟ ☕',
  'كلمني عن سر النجاح في الحياة يا زميلي 🌟',
];

export const FloatingRobot: React.FC<FloatingRobotProps> = ({ user, onOpenAiTab }) => {
  const [mood, setMood] = useState<RobotMood>('idle');

  // NO AUTO RANDOM SPEECH BUBBLES OUTSIDE (Zero unprompted popups per user request!)
  
  // Call states
  const [isVoiceCallActive, setIsVoiceCallActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [lastAiReply, setLastAiReply] = useState<string>('');
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);
  const [typedInput, setTypedInput] = useState<string>('');
  const [micStatusMsg, setMicStatusMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 3D Interactive Tilting State
  const [tilt3D, setTilt3D] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Operational refs
  const isCallActiveRef = useRef<boolean>(false);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isQueryInProgressRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speechSilenceTimeoutRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    isCallActiveRef.current = isVoiceCallActive;
  }, [isVoiceCallActive]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    currentTranscriptRef.current = transcript;
  }, [transcript]);

  // Load available speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        availableVoicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Subtle 3D floating & natural eye blinks (NO pop-up messages outside!)
  useEffect(() => {
    const expressions: RobotMood[] = ['idle', 'happy', 'wink', 'idle'];
    const interval = setInterval(() => {
      if (!isCallActiveRef.current) {
        const nextMood = expressions[Math.floor(Math.random() * expressions.length)];
        setMood(nextMood);
        setTimeout(() => setMood('idle'), 2500);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 3D Cursor Tracking for realistic interactive 3D mascot depth
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Calculate tilt angles
    const rotateY = (x / (rect.width / 2)) * 18;
    const rotateX = -(y / (rect.height / 2)) * 18;
    setTilt3D({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt3D({ x: 0, y: 0 });
  };

  // Call timer
  useEffect(() => {
    if (isVoiceCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isVoiceCallActive]);

  // Listen to custom start voice call event (e.g. from AiAssistantView)
  useEffect(() => {
    const handleTrigger = () => {
      if (!isCallActiveRef.current) {
        startVoiceCall();
      }
    };
    window.addEventListener('petrogeo-start-voice-call', handleTrigger);
    return () => window.removeEventListener('petrogeo-start-voice-call', handleTrigger);
  }, []);

  // ------------------- BULLETPROOF AUDIO & SPEECH TERMINATION -------------------
  const stopAllAudio = () => {
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.src = '';
      } catch (e) {}
      audioElementRef.current = null;
    }

    if (activeUtteranceRef.current) {
      try {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current.onstart = null;
      } catch (e) {}
      activeUtteranceRef.current = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    }

    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
  };

  const stopRecognitionOnly = () => {
    if (speechSilenceTimeoutRef.current) {
      clearTimeout(speechSilenceTimeoutRef.current);
      speechSilenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // ------------------- SPEECH RECOGNITION (CONTINUOUS & AUTO-HEARING) -------------------
  const startListening = () => {
    if (isAiSpeakingRef.current) {
      stopAllAudio();
    }

    stopRecognitionOnly();
    setTranscript('');
    currentTranscriptRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatusMsg('المتصفح لا يدعم المايك، تقدر تكتب في الشات تحت وسأرد عليك فوراً.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isCallActiveRef.current) {
          recognition.abort();
          return;
        }
        setIsListening(true);
        setMood('listening');
        setMicStatusMsg('المايك شغال وسامعك.. اتفضل اتكلم يا صاحبي 🎙️');
      };

      recognition.onresult = (event: any) => {
        if (!isCallActiveRef.current || isAiSpeakingRef.current) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const heard = (finalText || interimText).trim();
        if (heard) {
          setTranscript(heard);
          currentTranscriptRef.current = heard;

          if (speechSilenceTimeoutRef.current) {
            clearTimeout(speechSilenceTimeoutRef.current);
          }

          // Auto-send 1.2s after user pauses speaking
          speechSilenceTimeoutRef.current = setTimeout(() => {
            const queryToProcess = currentTranscriptRef.current.trim();
            if (
              queryToProcess &&
              isCallActiveRef.current &&
              !isAiSpeakingRef.current &&
              !isQueryInProgressRef.current
            ) {
              stopRecognitionOnly();
              setMicStatusMsg(`سمعتك يا صاحبي: "${queryToProcess}".. بجهزلك الرد`);
              handleVoiceQuery(queryToProcess);
            }
          }, 1200);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('SpeechRecognition notice:', err?.error);
        if (err?.error === 'not-allowed') {
          setIsListening(false);
          setMicStatusMsg('يرجى السماح بالمايكروفون من إعدادات المتصفح.');
        } else if (err?.error === 'no-speech') {
          setMicStatusMsg('سامعك.. اتكلم في أي وقت يا زميلي');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const q = currentTranscriptRef.current.trim();

        if (q && isCallActiveRef.current && !isAiSpeakingRef.current && !isQueryInProgressRef.current) {
          handleVoiceQuery(q);
        } else if (isCallActiveRef.current && !isAiSpeakingRef.current && !isQueryInProgressRef.current) {
          setTimeout(() => {
            if (isCallActiveRef.current && !isAiSpeakingRef.current && !isQueryInProgressRef.current) {
              startListening();
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  // ------------------- SHAABI CONVERSATIONAL AUDIO PLAYBACK -------------------
  const speakSingleVoice = (textToSpeak: string) => {
    stopAllAudio();
    stopRecognitionOnly();

    if (!isCallActiveRef.current) return;
    if (isMuted) {
      setMood('idle');
      setTimeout(() => {
        if (isCallActiveRef.current && !isAiSpeakingRef.current) {
          startListening();
        }
      }, 1500);
      return;
    }

    setIsAiSpeaking(true);
    isAiSpeakingRef.current = true;
    setMood('talking');
    setMicStatusMsg('الروبوت بيتكلم معاك شعبي وبياخد ويدي في الكلام 🗣️');

    const cleanText = textToSpeak
      .replace(/[*#$_\-\\`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 260);

    // Primary: Play with natural Egyptian speech adjustments
    if ('speechSynthesis' in window) {
      const voices = availableVoicesRef.current.length > 0
        ? availableVoicesRef.current
        : window.speechSynthesis.getVoices();

      const arabicVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('ar') ||
          v.name.toLowerCase().includes('arabic') ||
          v.name.includes('عربي') ||
          v.lang.toLowerCase().includes('eg') ||
          v.lang.toLowerCase().includes('sa')
      );

      if (arabicVoice) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = arabicVoice;
        utterance.lang = arabicVoice.lang || 'ar-EG';
        utterance.rate = 1.05; // Slightly faster, lively Egyptian pace
        utterance.pitch = 1.03; // Warm, friendly intonation

        utterance.onend = () => {
          finishSpeakingCycle();
        };

        utterance.onerror = () => {
          playServerAudioStream(cleanText);
        };

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // Fallback: Native server audio stream
    playServerAudioStream(cleanText);
  };

  const playServerAudioStream = (cleanText: string) => {
    try {
      const audioUrl = `/api/ai/arabic-tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        finishSpeakingCycle();
      };

      audio.onerror = () => {
        finishSpeakingCycle();
      };

      audio.play().catch(() => {
        finishSpeakingCycle();
      });
    } catch (e) {
      finishSpeakingCycle();
    }
  };

  const finishSpeakingCycle = () => {
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
    audioElementRef.current = null;
    activeUtteranceRef.current = null;
    if (isCallActiveRef.current) {
      setMood('idle');
      setTranscript('');
      setMicStatusMsg('خلصت كلامي.. سامعك يا زميلي اتفضل اتكلم! 🎙️');
      setTimeout(() => {
        if (isCallActiveRef.current && !isAiSpeakingRef.current) {
          startListening();
        }
      }, 300);
    }
  };

  // ------------------- HANDLE VOICE QUERY -------------------
  const handleVoiceQuery = async (queryText: string) => {
    if (!isCallActiveRef.current || isQueryInProgressRef.current) return;

    isQueryInProgressRef.current = true;
    setIsThinking(true);
    setMood('thinking');
    stopRecognitionOnly();
    stopAllAudio();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText, isVoiceCall: true }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      isQueryInProgressRef.current = false;
      setIsThinking(false);

      if (!isCallActiveRef.current) return;

      const reply = data?.reply || 'يا عمنا سؤالك في الجون.. قولي لو عايزنا نفكك أي حتة تانية سوا!';
      setLastAiReply(reply);
      speakSingleVoice(reply);
    } catch (err: any) {
      isQueryInProgressRef.current = false;
      setIsThinking(false);
      if (err?.name === 'AbortError') return;

      console.warn('Voice query error:', err);
      if (isCallActiveRef.current) {
        const errorFallback = 'أنا معاك يا زميلي وفي ضهرك.. اسألني في أي حاجة وهرد عليك شعبي وفي الصميم!';
        setLastAiReply(errorFallback);
        speakSingleVoice(errorFallback);
      }
    }
  };

  // ------------------- CALL LIFECYCLE -------------------
  const startVoiceCall = () => {
    stopAllAudio();
    stopRecognitionOnly();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isCallActiveRef.current = true;
    setIsVoiceCallActive(true);
    setIsCallMinimized(false);
    setMood('happy');
    setMicStatusMsg('المكالمة متصلة 🟢.. ارمي سؤالك وأنا معاك في الصميم!');

    const welcomeMsg = `يا صباح الفل يا عمنا! أنا معاك ومصحصحلك، اسألني في أي حاجة وهاخد وادي معاك في الكلام!`;
    setLastAiReply(welcomeMsg);
    speakSingleVoice(welcomeMsg);
  };

  const endVoiceCall = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    isCallActiveRef.current = false;
    isAiSpeakingRef.current = false;
    isQueryInProgressRef.current = false;
    setIsVoiceCallActive(false);
    setIsListening(false);
    setIsAiSpeaking(false);
    setIsThinking(false);
    setIsCallMinimized(false);

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {}
      abortControllerRef.current = null;
    }

    stopRecognitionOnly();
    stopAllAudio();

    setMood('idle');
    setTranscript('');
    setMicStatusMsg('');
    // Notice: NO random popups outside! Simply ends quietly.
  };

  const toggleMic = () => {
    if (isListening) {
      stopRecognitionOnly();
      setMood('idle');
      setMicStatusMsg('تم إيقاف المايك. اضغط لتشغيله مجدداً.');
    } else {
      stopAllAudio();
      startListening();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* 1. INTERACTIVE 3D ANIMATED ROBOT MASCOT (Floating in Bottom Left, NO random popups!) */}
      <div
        className="fixed bottom-20 md:bottom-6 left-3 sm:left-6 z-40 flex flex-col items-start select-none pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3D PERSPECTIVE WRAPPER */}
          <div
            onClick={() => {
              if (!isVoiceCallActive) {
                startVoiceCall();
              } else {
                setIsCallMinimized(!isCallMinimized);
              }
            }}
            className="relative cursor-pointer group"
            style={{ perspective: '1000px' }}
            title="معيد PETROGEO الذكي - اضغط لبدء مكالمة صوتية أو فتح الشات"
          >
            {/* 3D Orbital Outer Rings */}
            <div
              className={`absolute -inset-2 sm:-inset-3 rounded-full border border-cyan-400/40 opacity-70 pointer-events-none transition-all duration-700 ${
                isVoiceCallActive
                  ? 'animate-spin border-amber-400 ring-2 ring-emerald-500/40'
                  : 'animate-[spin_10s_linear_infinite]'
              }`}
              style={{
                transform: `rotateX(${tilt3D.x * 1.5}deg) rotateY(${tilt3D.y * 1.5}deg)`,
              }}
            />

            {/* Glowing 3D Particle Halo */}
            <div
              className={`absolute -inset-1.5 sm:-inset-2 rounded-2xl blur-lg transition duration-500 ${
                isVoiceCallActive
                  ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 opacity-90 animate-pulse'
                  : mood === 'talking'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 opacity-80 animate-pulse'
                  : isHovered
                  ? 'bg-gradient-to-r from-cyan-500 to-amber-500 opacity-90'
                  : 'bg-gradient-to-r from-amber-500/40 to-cyan-500/40 opacity-60'
              }`}
            />

            {/* 3D FLOATING ROBOT CONTAINER */}
            <div
              className="relative w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/90 shadow-2xl transition-transform duration-200 ease-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: isHovered
                  ? `rotateX(${tilt3D.x}deg) rotateY(${tilt3D.y}deg) scale3d(1.08, 1.08, 1.08)`
                  : 'translateY(-3px) scale(1.0)',
                boxShadow: isHovered
                  ? '0 20px 35px -8px rgba(245, 158, 11, 0.4), 0 0 20px rgba(6, 182, 212, 0.3)'
                  : '0 12px 20px -5px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* High-Resolution 3D Rendered Pixar Character Image */}
              <img
                src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
                alt="PETROGEO 3D Robot"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  mood === 'talking'
                    ? 'scale-110 brightness-115'
                    : isVoiceCallActive
                    ? 'scale-105'
                    : 'scale-100'
                }`}
              />

              {/* 3D Visor Holographic Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-cyan-500/10 pointer-events-none" />

              {/* Animated 3D Visor Reactions */}
              {mood === 'wink' && (
                <div className="absolute top-2 left-2 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                  😉
                </div>
              )}

              {isVoiceCallActive && (
                <div className="absolute inset-x-0 bottom-0 bg-emerald-600/95 text-[8px] sm:text-[9px] font-extrabold text-white text-center py-0.5 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>مكالمة نشطة</span>
                </div>
              )}
              {mood === 'listening' && (
                <div className="absolute inset-x-0 bottom-0 bg-cyan-600/95 text-[8px] sm:text-[9px] font-extrabold text-white text-center py-0.5 animate-pulse">
                  سامعك...
                </div>
              )}
              {mood === 'talking' && (
                <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-[8px] sm:text-[9px] font-extrabold text-slate-950 text-center py-0.5 flex items-center justify-center gap-1">
                  <span className="w-1 h-2 bg-slate-950 animate-bounce" />
                  <span className="w-1 h-3 bg-slate-950 animate-bounce delay-75" />
                  <span className="w-1 h-2 bg-slate-950 animate-bounce delay-150" />
                  <span>بيتكلم...</span>
                </div>
              )}

              {/* Glowing 3D Status Sphere */}
              <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>

            {/* 3D Dynamic Ground Shadow */}
            <div
              className={`w-12 sm:w-16 h-2 sm:h-3 mx-auto mt-1 bg-black/60 rounded-full blur-sm transition-all duration-300 ${
                isHovered ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
              }`}
            />

            {/* Title Tag */}
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span className="bg-slate-900 border border-amber-500/60 text-amber-400 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                {isVoiceCallActive ? '📞 مكالمة' : 'المساعد 3D'}
              </span>
            </div>
          </div>

          {/* Side Action Buttons when idle */}
          {!isVoiceCallActive && (
            <div className="flex flex-col gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-left duration-200">
              <button
                type="button"
                onClick={startVoiceCall}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 cursor-pointer"
                title="بدء مكالمة صوتية مباشرة"
              >
                <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAiTab()}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
                title="فتح الشات والمحادثة النصية"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. INTERACTIVE VOICE CALL WINDOW */}
      {isVoiceCallActive && (
        <div
          className={`fixed z-50 transition-all duration-300 pointer-events-auto ${
            isCallMinimized
              ? 'bottom-20 left-3 sm:bottom-24 sm:left-6 w-72 sm:w-80'
              : 'inset-2 sm:inset-4 md:inset-auto md:bottom-24 md:left-6 md:w-[450px] max-h-[92vh] flex flex-col justify-end'
          }`}
        >
          <div className="w-full bg-[#0a101b] border-2 border-amber-500/70 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 text-right relative overflow-hidden backdrop-blur-2xl">
            {/* Glow effects */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Controls & Status */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCallMinimized(!isCallMinimized)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title={isCallMinimized ? 'تكبير' : 'تصغير'}
                >
                  {isCallMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isMuted) stopAllAudio();
                    setIsMuted(!isMuted);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isMuted ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Top X end button */}
                <button
                  type="button"
                  onClick={endVoiceCall}
                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
                  title="إنهاء المكالمة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 justify-end">
                    <span>صاحبك معيد PETROGEO (مكالمة شعبية)</span>
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>مدة المكالمة: {formatSeconds(callDuration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Call Content */}
            {!isCallMinimized && (
              <>
                {/* 3D Animated Robot in Call */}
                <div className="py-2 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="relative group">
                    <div
                      className={`w-28 h-28 rounded-3xl border-4 border-amber-400 overflow-hidden shadow-2xl relative transition-all duration-300 ${
                        isAiSpeaking
                          ? 'scale-105 ring-4 ring-amber-400/50 shadow-[0_0_25px_#f59e0b]'
                          : isListening
                          ? 'scale-105 ring-4 ring-emerald-400/50 shadow-[0_0_25px_#10b981]'
                          : 'scale-100'
                      }`}
                      style={{
                        transform: isAiSpeaking ? 'translateY(-4px)' : 'translateY(0)',
                      }}
                    >
                      <img
                        src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
                        alt="PETROGEO 3D Robot in call"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Animated soundwave ring when speaking */}
                    {isAiSpeaking && (
                      <div className="absolute -inset-3 border-2 border-amber-400/60 rounded-3xl animate-ping pointer-events-none" />
                    )}
                    {isListening && (
                      <div className="absolute -inset-3 border-2 border-emerald-400/60 rounded-3xl animate-pulse pointer-events-none" />
                    )}
                  </div>

                  {/* Status Banner */}
                  <div className="w-full px-2">
                    <div
                      className={`text-xs font-extrabold ${
                        isListening
                          ? 'text-emerald-400 animate-pulse'
                          : isAiSpeaking
                          ? 'text-amber-400'
                          : isThinking
                          ? 'text-cyan-400 animate-pulse'
                          : 'text-slate-300'
                      }`}
                    >
                      {isListening
                        ? '🎙️ المايك شغال وسامعك.. اتكلم براحتك وأنا في ضهرك!'
                        : isAiSpeaking
                        ? '🗣️ بياخد ويدي معاك في الكلام شعبي...'
                        : isThinking
                        ? '⚡ بيجهزلك الرد في الصميم والزتونة...'
                        : 'جاهز لسؤالك.. اتكلم في المايك علطول'}
                    </div>

                    {/* Animated Soundwave Equalizer when Listening */}
                    {isListening && (
                      <div className="flex items-center justify-center gap-1.5 my-2">
                        <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce delay-200" />
                        <span className="w-1.5 h-7 bg-emerald-400 rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce delay-150" />
                      </div>
                    )}

                    {micStatusMsg && (
                      <div className="text-[11px] text-amber-200/90 font-medium mt-1 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl">
                        {micStatusMsg}
                      </div>
                    )}

                    {/* Live Transcript */}
                    {transcript && (
                      <p className="text-xs text-emerald-300 font-bold mt-2 bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl">
                        "{transcript}"
                      </p>
                    )}

                    {/* Last AI Reply Text preview */}
                    {lastAiReply && !transcript && (
                      <div className="mt-2 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-right max-h-24 overflow-y-auto leading-relaxed shadow-inner">
                        <span className="font-bold text-amber-400 block mb-0.5">معيد PETROGEO (شعبي وجدع):</span>
                        {lastAiReply}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Shaabi Prompts */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>أسئلة سريعة (اضغط ليسأله مباشرة):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {QUICK_LIFE_AND_CURRICULUM_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTranscript(q);
                          handleVoiceQuery(q);
                        }}
                        className="text-[11px] bg-slate-900/90 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-800 rounded-xl p-2 transition-all text-right leading-tight cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Typing Input for voice call */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typedInput.trim()) {
                      const text = typedInput.trim();
                      setTranscript(text);
                      handleVoiceQuery(text);
                      setTypedInput('');
                    }
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <button
                    type="submit"
                    className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors font-bold text-xs shrink-0 cursor-pointer"
                    title="إرسال"
                  >
                    <Send className="w-4 h-4 -scale-x-100" />
                  </button>
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="اكتب أي سؤال في المنهج أو في الحياة وهيرد في الصميم بالمصري..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 text-right focus:outline-none focus:border-amber-500"
                  />
                </form>
              </>
            )}

            {/* CALL CONTROLS BAR: SPEAK + GUARANTEED RED END CALL BUTTON */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/90">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-xl cursor-pointer ${
                    isListening
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 scale-102'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                  }`}
                  title={isListening ? 'اضغط لإيقاف المايك' : 'اضغط للتحدث بصوتك'}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-5 h-5 text-slate-950 animate-bounce" />
                      <span>المايك شغال.. اتكلم الآن 🎙️</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-emerald-400" />
                      <span>اضغط وتحدث بصوتك 🎙️</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={endVoiceCall}
                  className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white flex items-center justify-center gap-2 font-extrabold text-xs shadow-xl shadow-rose-600/30 transition-all hover:scale-102 cursor-pointer"
                  title="إنهاء المكالمة فوراً وإيقاف كافة الأصوات"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>إنهاء المكالمة 🔴</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400">
                روبوت 3D تفاعلي • كلام شعبي مصري أصيل ياخد ويدي معاك • لا رسايل عشوائية بره الشات
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
