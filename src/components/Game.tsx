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
      {/* Header - Compact version */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 bg-white p-5 rounded-[32px] shadow-2xl border border-black/5">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-black leading-tight">SUI AI</h1>
            <div className="flex items-center gap-2 opacity-40">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] uppercase font-bold tracking-widest leading-none">Safe Checker</span>
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
              className="w-full bg-black/5 rounded-2xl px-12 py-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500/20"
              placeholder="Nhập địa chỉ ví Sui..."
            />
          </div>
          <button 
            type="submit" 
            className="px-5 py-3 bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            {isRefreshing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            <span>KẾT NỐI</span>
          </button>
        </form>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden pb-4">
        {/* Left Side: Wallet Dashboard (Minimalist) */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 relative bg-white rounded-[40px] border border-black/10 overflow-hidden shadow-sm flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-blue-50/20">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
             
             {/* Main Dashboard Stats */}
             <div className="text-center z-10 space-y-6 w-full">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shadow-sm mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Safe Check Active</span>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-black/30 uppercase tracking-[0.2em]">Active Balance</h2>
                  <div className="text-6xl font-black tracking-tighter text-black flex items-baseline justify-center gap-2">
                    {wallet?.SUI || '0.00'} 
                    <span className="text-2xl opacity-20">SUI</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/5 text-left">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">Volume 24h</span>
                    <span className="text-xl font-mono font-black text-blue-600">{wallet?.dailyVolume || '0.00'}</span>
                    <span className="text-[9px] font-bold ml-1 opacity-40">SUI</span>
                  </div>
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/5 text-left">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">SuiFrens</span>
                    <span className="text-xl font-mono font-black text-black">{wallet?.nfts.length || '0'}</span>
                    <span className="text-[9px] font-bold ml-1 opacity-40">Assets</span>
                  </div>
                </div>
             </div>
             
             {/* Wallet Hud Overlay - Moved to bottom items */}
             <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2 justify-center">
                {wallet && Object.entries(wallet).filter(([k]) => !['SUI', 'dailyVolume', 'nfts'].includes(k)).map(([token, val]) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={token} 
                    className="bg-white px-3 py-2 rounded-xl border border-black/5 shadow-sm flex items-center gap-2"
                  >
                    <span className="text-[9px] font-black text-blue-600">{token}</span>
                    <span className="text-[10px] font-mono font-black text-black">{val}</span>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Side: Chat (Expanded width) */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
          <div className="flex-1 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5">
            <Chat pet={selectedPet} wallet={wallet} />
          </div>
        </div>
      </main>
    </div>
  );
}
