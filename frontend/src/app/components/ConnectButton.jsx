// app/components/ConnectButton.jsx
'use client';
import { useEffect } from 'react';

export default function ConnectButton({ connect, account, isLoading }) {
  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button 
      onClick={connect}
      disabled={isLoading}
      className="text-white font-bold py-2 px-4 rounded-lg transition"
    >
      {isLoading 
        ? 'Connecting...' 
        : account ? (
        <div className="mt-4 p-4 bg-indigo-900/40 rounded-lg text-sm text-indigo-200 flex items-center">
          <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
          <p className="truncate">Connected: {account}</p>
        </div>
        ) : <><div className="mt-4 p-4 bg-indigo-900/40 rounded-lg text-sm text-indigo-200 flex items-center">
            <p className="">Connect Wallet</p>
          </div><p className="text-indigo-200 mb-2">Connect your wallet to manage NFT warranties</p></>
            }

    </button>
  );
}