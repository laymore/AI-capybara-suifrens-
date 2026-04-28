import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { SuiFrenPet } from '../types';
import { MOCK_PETS, DEFAULT_SUI_ADDRESS } from '../constants';
import { PetDisplay } from './PetDisplay';
import { Chat } from './Chat';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Heart, Loader2, Wallet, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { fetchWalletInfo, WalletInfo } from '../services/suiService';
import { cn } from '../lib/utils';

export function Game() {
  const account = useCurrentAccount();
  const activeAddress = useMemo(() => account?.address || DEFAULT_SUI_ADDRESS, [account]);
  const isDefaultWallet = activeAddress === DEFAULT_SUI_ADDRESS && !account;

  const [selectedPet, setSelectedPet] = useState<SuiFrenPet | null>(MOCK_PETS[0]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshWallet = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchWalletInfo(activeAddress);
    setWallet(data);
    setIsRefreshing(false);
  }, [activeAddress]);

  useEffect(() => {
    refreshWallet();
    const interval = setInterval(refreshWallet, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [refreshWallet]);

  // Sync pet info from Firestore
  useEffect(() => {
    if (!selectedPet?.id) return;
    const statsPath = `pets/${selectedPet.id}/stats/current`;
    const unsubscribe = onSnapshot(doc(db, statsPath), (docSnap) => {
      if (docSnap.exists()) {
        const remoteStats = docSnap.data();
        setSelectedPet(prev => {
          if (!prev || prev.id !== selectedPet.id) return prev;
          return {
            ...prev,
            stats: remoteStats as any
          };
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, statsPath);
    });
    return unsubscribe;
  }, [selectedPet?.id]);

  const handleAction = async (type: 'analyze' | 'report' | 'security') => {
    if (!wallet) return;
    window.dispatchEvent(new CustomEvent('pet-action', { detail: { type, wallet } }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-xl border border-black/5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-black">SUI ASSISTANT</h1>
            <div className="flex items-center gap-1.5 opacity-50">
              <Wallet className="w-3 h-3" />
              <span className="text-[10px] font-mono truncate max-w-[150px] md:max-w-none">
                {activeAddress}
              </span>
              {isDefaultWallet && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded-md uppercase">Default</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={refreshWallet}
            className={`p-2 rounded-xl hover:bg-black/5 transition-all ${isRefreshing ? 'animate-spin opacity-40' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-black/40" />
          </button>
          <ConnectButton />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden pb-4">
        {/* Left Side: Pet & Info */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 relative bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-inner flex items-center justify-center">
             <PetDisplay pet={selectedPet} />
             
             {/* Wallet Hud Overlay */}
             <div className="absolute top-6 left-6 right-6 flex flex-wrap gap-2 pointer-events-none">
                {wallet && Object.entries(wallet).filter(([k]) => k !== 'dailyVolume').map(([token, val]) => (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={token} 
                    className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-black/5 shadow-sm flex items-center gap-2"
                  >
                    <span className="text-[10px] font-black">{token}</span>
                    <span className="text-sm font-mono font-bold text-blue-600">{val}</span>
                  </motion.div>
                ))}
             </div>

             <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center pointer-events-none">
                <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                   Volume 24h: {wallet?.dailyVolume || 0} SUI
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <ActionButton 
              onClick={() => handleAction('analyze')} 
              label="Kiểm tra ví" 
              icon={<Activity className="w-5 h-5" />} 
              color="bg-blue-600" 
            />
            <ActionButton 
              onClick={() => handleAction('report')} 
              label="Báo cáo" 
              icon={<Trophy className="w-5 h-5" />} 
              color="bg-emerald-600" 
            />
            <ActionButton 
              onClick={() => handleAction('security')} 
              label="Bảo mật" 
              icon={<ShieldCheck className="w-5 h-5" />} 
              color="bg-rose-600" 
            />
          </div>
        </div>

        {/* Right Side: Chat */}
        <div className="lg:col-span-5 flex flex-col gap-6 min-h-0">
          <Chat pet={selectedPet} wallet={wallet} />
        </div>
      </main>
    </div>
  );
}

function ActionButton({ onClick, label, icon, color }: { onClick: () => void, label: string, icon: any, color: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-5 rounded-[24px] transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-black/5 border border-white/20",
        color, "text-white"
      )}
    >
      <div className="bg-white/20 p-2 rounded-xl">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
