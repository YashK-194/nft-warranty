'use client';
import { useState } from 'react';
import ConnectButton from './components/ConnectButton';
import CreateWarrantyButton from './components/CreateWarrantyButton';
import GetWarrantyDetailsButton from './components/GetWarrantyDetailsButton';
import CheckWarrantyStatusButton from './components/CheckWarrantyStatusButton';

const CONTRACT_ADDRESS = "0xDdB2255528C6D3d8418968704C5B26590b75413B";

export default function HomePage() {
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } else {
        alert('MetaMask is required to connect');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
            NFT Warranty System
          </h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            Secure your digital assets with blockchain-powered warranty protection
          </p>
        </div>
  
        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          {/* Connect Wallet Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-12 shadow-xl border border-white/20">
            <div className="flex justify-center">
              <ConnectButton 
                connect={connectWallet} 
                account={account} 
                isLoading={isLoading} 
              />
            </div>
          </div>
  
        

        {/* Actions Section */}
        <p className="text-lg text-indigo-200 max-w-2xl text-center mx-auto">
          Certificate IDs start sequentially from 1, 2, 3 and so on.
        </p>
        <br/>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="w-full flex items-center justify-center">
            <CreateWarrantyButton 
              account={account} 
              contractAddress={CONTRACT_ADDRESS} 
              />
            </div>
  
            <div className="w-full flex items-center justify-center">
              <CheckWarrantyStatusButton 
                account={account} 
                contractAddress={CONTRACT_ADDRESS} 
              />
            </div>
  
              <div className="w-full flex items-center justify-center">
                <GetWarrantyDetailsButton 
                  account={account}
                  contractAddress={CONTRACT_ADDRESS} 
                />
              </div>
            </div>
        </div>
  
        {/* Footer */}
        <div className="mt-16 text-center text-sm text-indigo-300">
          <p className="mt-2">Developed and maintained by Yash Kumar</p>
          <a href="https://www.linkedin.com/in/yashk194" target="_blank">LinkedIn: linkedin.com/in/yashk194</a>
        </div>
      </div>
    </div>
  );
}
