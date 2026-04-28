export type SuiFrenSpecies = 'Capy' | 'Bullshark';

export interface PetStats {
  hunger: number;     // 0-100
  happiness: number;  // 0-100
  energy: number;     // 0-100
  level: number;
  exp: number;
}

export interface SuiFrenPet {
  id: string; // Sui Object ID
  name: string;
  species: SuiFrenSpecies;
  birthDate: number;
  stats: PetStats;
  personality: string;
  imageUrl: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
