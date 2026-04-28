import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { SuiFrenPet } from '../types';
import { MOCK_PETS, DEFAULT_SUI_ADDRESS, DEFAULT_CAPY_IMAGE } from '../constants';
import { PetDisplay } from './PetDisplay';
import { Chat } from './Chat';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Heart, Loader2, Wallet, Activity, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { fetchWalletInfo, WalletInfo } from '../services/suiService';
import { cn } from '../lib/utils';

export function Game() {
  const [inputAddress, setInputAddress] = useState(DEFAULT_SUI_ADDRESS);
  const [activeAddress, setActiveAddress] = useState(DEFAULT_SUI_ADDRESS);

  const [selectedPet, setSelectedPet] = useState<SuiFrenPet | null>(MOCK_PETS[0]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshWallet = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchWalletInfo(activeAddress);
    setWallet(data);
    
    // Update AI Image based on NFTs found
    if (data.nfts.length > 0) {
      const randomNFT = data.nfts[Math.floor(Math.random() * data.nfts.length)];
      setSelectedPet({
        id: randomNFT.id,
        name: randomNFT.name,
        species: randomNFT.species,
        personality: "Hỗ trợ nhiệt tình",
        imageUrl: randomNFT.imageUrl,
        stats: { hunger: 100, happiness: 100, energy: 100, level: 1, exp: 0 }
      });
    } else {
      setSelectedPet({
        ...MOCK_PETS[0],
        imageUrl: DEFAULT_CAPY_IMAGE
      });
    }
    setIsRefreshing(false);
  }, [activeAddress]);

  useEffect(() => {
    refreshWallet();
  }, [activeAddress, refreshWallet]);

  const handleAction = async (type: 'analyze' | 'report' | 'security') => {
    if (!wallet) return;
    window.dispatchEvent(new CustomEvent('pet-action', { detail: { type, wallet } }));
  };

  const handleAddressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress.startsWith('0x')) {
      setActiveAddress(inputAddress);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-white p-6 rounded-[32px] shadow-2xl border border-black/5">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-black">SUI AI ASSISTANT</h1>
            <div className="flex items-center gap-2 opacity-40">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest">On-Chain Safe Checker</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleAddressUpdate} className="flex-1 max-w-xl w-full flex gap-2">
          <div className="relative flex-1">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
            <input 
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              className="w-full bg-black/5 rounded-2xl px-12 py-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500/20"
              placeholder="Nhập địa chỉ ví Sui..."
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            {isRefreshing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            <span>KẾT NỐI</span>
          </button>
        </form>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden pb-4">
        {/* Left Side: Pet & Info */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 relative bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-inner flex items-center justify-center">
             <PetDisplay pet={selectedPet} />
             
             {/* Wallet Hud Overlay */}
             <div className="absolute top-8 left-8 right-8 flex flex-wrap gap-3 pointer-events-none">
                {wallet && Object.entries(wallet).filter(([k]) => !['dailyVolume', 'nfts'].includes(k)).map(([token, val]) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={token} 
                    className="bg-white/95 backdrop-blur px-4 py-2 rounded-2xl border border-black/5 shadow-xl flex items-center gap-3"
                  >
                    <div className="w-6 h-6 flex items-center justify-center bg-blue-50 rounded-lg">
                      <span className="text-[10px] font-black text-blue-600">{token[0]}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black opacity-30 leading-none">{token}</span>
                      <span className="text-xs font-mono font-black text-black">{val}</span>
                    </div>
                  </motion.div>
                ))}
             </div>

             <div className="absolute bottom-10 left-10 right-10 flex flex-col items-center gap-4 pointer-events-none">
                <div className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                   Volume 24h: {wallet?.dailyVolume || 0} SUI
                </div>
                {wallet?.nfts.length ? (
                  <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase border border-emerald-200">
                    SuiFrens detected in wallet
                  </div>
                ) : null}
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
