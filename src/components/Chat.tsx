import { useState, useRef, useEffect, useCallback } from 'react';
import { SuiFrenPet, ChatMessage } from '../types';
import { getPetResponse } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { WalletInfo } from '../services/suiService';
import { useFirebase } from '../context/FirebaseContext';

interface ChatProps {
  pet: SuiFrenPet | null;
  wallet: WalletInfo | null;
}

export function Chat({ pet, wallet }: ChatProps) {
  const { isAuthEnabled, user } = useFirebase();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync messages from Firestore if auth is enabled
  useEffect(() => {
    if (!pet?.id || !isAuthEnabled) return;
    
    const messagesPath = `pets/${pet.id}/messages`;
    const q = query(collection(db, messagesPath), orderBy('timestamp', 'asc'), limit(50));
    
    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            role: data.role,
            text: data.text,
            timestamp: data.timestamp?.toMillis() || Date.now()
          } as ChatMessage;
        });
        setHistory(messages);
      }, (error) => {
        // Fallback for permission errors
        if (error.code === 'permission-denied') {
          console.warn("Firestore access denied. Using local state.");
        } else {
          handleFirestoreError(error, OperationType.LIST, messagesPath);
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Firestore restricted. Local mode active.");
    }
  }, [pet?.id, isAuthEnabled]);

  const speak = useCallback((text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    
    // Clean text for clearer speech: remove asterisks, simplify addresses
    const cleanText = text
      .replace(/\*/g, '') // Remove all asterisks
      .replace(/0x[a-fA-F0-9]{4,}/g, (match) => `địa chỉ ví ${match.slice(0, 4)}`) // Simplify hex addresses
      .replace(/SUI/g, 'Sui')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const saveMessage = async (msg: Omit<ChatMessage, 'timestamp'>) => {
    const fullMsg: ChatMessage = { ...msg, timestamp: Date.now() };
    
    // Always update local state immediately for responsiveness
    setHistory(prev => [...prev, fullMsg]);

    if (!pet?.id || !isAuthEnabled || !user) return;
    
    const messagesPath = `pets/${pet.id}/messages`;
    try {
      await addDoc(collection(db, messagesPath), {
        ...msg,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.warn("Failed to sync message to cloud:", error);
    }
  };

  const handleSend = useCallback(async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !pet || isLoading) return;

    await saveMessage({ role: 'user', text: textToSend });
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      const responseText = await getPetResponse(pet, history, textToSend, wallet);
      await saveMessage({ role: 'model', text: responseText });
      speak(responseText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, pet, isLoading, history, wallet, speak]);

  // Listen for actions from Parent
  useEffect(() => {
    const handler = (e: any) => {
      const { type } = e.detail;
      let prompt = "";
      if (type === 'analyze') prompt = "Hãy phân tích tình hình các token trong ví của tôi hiện tại.";
      else if (type === 'report') prompt = "Báo cáo tổng kết volume giao dịch và tài sản của tôi trong 24h qua.";
      else if (type === 'security') prompt = "Kiểm tra độ bảo mật của ví và đề xuất biện pháp bảo vệ.";
      handleSend(prompt);
    };
    window.addEventListener('pet-action', handler);
    return () => window.removeEventListener('pet-action', handler);
  }, [handleSend]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isLoading]);

  return (
    <div className="flex-1 min-h-0 bg-white rounded-[32px] border border-black/5 shadow-xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-black/5 flex justify-between items-center bg-blue-50/30">
        <div className="flex items-center gap-2">
           <Bot className="w-4 h-4 text-blue-600" />
           <span className="text-xs font-bold uppercase tracking-widest">{pet?.name} AI ACTIVE</span>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-500" />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-gradient-to-b from-white to-blue-50/20">
        {history.map((msg, i) => (
          <motion.div
            key={msg.timestamp + i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex flex-col max-w-[90%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
          >
            <div className={cn(
              "p-4 rounded-[20px] text-sm leading-relaxed shadow-sm",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-black rounded-tl-none border border-black/5"
            )}>
              {msg.text}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-1 px-1">
              {msg.role === 'user' ? 'TRAINER' : pet?.name}
            </span>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-center text-blue-600/60 italic text-[10px] ml-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-bold tracking-widest uppercase">Phân tích on-chain...</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-black/5">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-3">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Hỏi ${pet?.name} về ví Sui của bạn...`}
            className="w-full bg-black/5 rounded-2xl px-5 py-4 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={!pet}
          />
          <button type="submit" disabled={!input.trim() || !pet || isLoading} className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl active:scale-90 transition-all">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
