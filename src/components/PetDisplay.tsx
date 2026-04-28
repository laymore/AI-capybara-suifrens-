import { SuiFrenPet } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PetDisplayProps {
  pet: SuiFrenPet | null;
}

export function PetDisplay({ pet }: PetDisplayProps) {
  if (!pet) return null;

  return (
    <div className="relative w-full h-full bg-white rounded-[48px] border border-black/5 shadow-xl shadow-black/[0.02] overflow-hidden flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

      {/* Pet Image with floating animation */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10"
      >
        <img 
          src={pet.imageUrl} 
          alt={pet.name} 
          className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-[64px] border-8 border-white shadow-2xl"
        />
        
        {/* Expression overlay based on happiness */}
        {pet.stats.happiness > 80 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-full shadow-lg"
          >
            <span className="text-2xl">✨</span>
          </motion.div>
        )}
      </motion.div>

      {/* Pet Info */}
      <div className="mt-8 text-center z-10 w-full px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">On-Chain Active</span>
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tighter mb-1 text-black">{pet.name}</h2>
        <div className="text-black/40 font-mono text-[10px] uppercase tracking-widest">
           {pet.species} SUI ASSISTANT • ID: #{pet.id.slice(-4)}
        </div>
      </div>

      {/* EXP Bar */}
      <div className="w-full max-w-xs mt-6 bg-black/5 h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pet.stats.exp}%` }}
          className="h-full bg-blue-600"
        />
      </div>
    </div>
  );
}
