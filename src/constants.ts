import { SuiFrenPet } from "./types";

export const DEFAULT_SUI_ADDRESS = "0x0b134a287ec28c1032da9a9ee011ed248402f9abb3cc43ca4a0cd85b2c5bf423";

export const MOCK_PETS: SuiFrenPet[] = [
  {
    id: "mock-1",
    name: "Cappy the Calm",
    species: "Capy",
    birthDate: Date.now() - 86400000 * 5,
    stats: {
      hunger: 80,
      happiness: 90,
      energy: 70,
      level: 1,
      exp: 20
    },
    personality: "Very zen, loves water, and enjoys long naps. Speaks calmly and politely.",
    imageUrl: "https://images.unsplash.com/photo-1715014352132-7fd77382457c?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "mock-2",
    name: "Sharky the Swift",
    species: "Bullshark",
    birthDate: Date.now() - 86400000 * 2,
    stats: {
      hunger: 40,
      happiness: 60,
      energy: 95,
      level: 1,
      exp: 10
    },
    personality: "Hyperactive, competitive, and always hungry for a challenge. Speaks loudly and uses lots of action words.",
    imageUrl: "https://images.unsplash.com/photo-1560273074-c930c7071680?auto=format&fit=crop&q=80&w=400"
  }
];
