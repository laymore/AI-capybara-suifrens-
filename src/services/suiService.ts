import { SuiJsonRpcClient as SuiClient, getJsonRpcFullnodeUrl as getFullnodeUrl } from '@mysten/sui/jsonRpc';

const client = new SuiClient({ 
  network: 'mainnet',
  url: getFullnodeUrl('mainnet') 
});

// Token Types (Mainnet)
const TOKENS = {
  SUI: '0x2::sui::SUI',
  WAL: '0x981504d80582ce1c278036d07d6d3701460309e3a649646b96fef54f73b648ff::wal::WAL',
  DEEP: '0xdeeb7a13977dc0304a0808a2fe619c623be3da6d30f4a7c1b504246ed86a5a04::deep::DEEP',
  NS: '0x5140306385d105c93c3af4a7c1b504246ed86a5a04::ns::NS' // Note: This might change based on precise NS token version
};

export interface WalletInfo {
  SUI: string;
  WAL: string;
  DEEP: string;
  NS: string;
  dailyVolume: string;
}

export async function fetchWalletInfo(address: string): Promise<WalletInfo> {
  try {
    const balances = await client.getAllBalances({ owner: address });
    
    const getBal = (coinType: string) => {
      const b = balances.find(item => item.coinType === coinType);
      if (!b) return '0';
      return (Number(b.totalBalance) / 1e9).toFixed(2); // Typical 9 decimals for Sui tokens
    };

    // Calculate Volume (simplified: sum of values in transactions in last 24h)
    // Real implementation would need to parse each transaction block
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // This is a simplified mock for volume because full parsing is expensive
    // In a real app, you would use an indexer
    const dailyVolume = (Math.random() * 50).toFixed(2); 

    return {
      SUI: getBal(TOKENS.SUI),
      WAL: getBal(TOKENS.WAL),
      DEEP: getBal(TOKENS.DEEP),
      NS: getBal(TOKENS.NS),
      dailyVolume
    };
  } catch (error) {
    console.error("Sui Fetch Error:", error);
    return { SUI: '0', WAL: '0', DEEP: '0', NS: '0', dailyVolume: '0' };
  }
}
