/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Game } from './components/Game';
import { FirebaseProvider } from './context/FirebaseContext';
import '@mysten/dapp-kit/dist/index.css';

const networks = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
};

// Using any as a temporary fix for SDK version differences
const { networkConfig } = createNetworkConfig({
	mainnet: { url: networks.mainnet } as any,
  testnet: { url: networks.testnet } as any,
});

const queryClient = new QueryClient();

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
				<WalletProvider autoConnect>
          <FirebaseProvider>
            <div className="min-h-screen bg-[#F0F2F5] text-[#1A1A1A] font-sans">
              <Game />
            </div>
          </FirebaseProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
