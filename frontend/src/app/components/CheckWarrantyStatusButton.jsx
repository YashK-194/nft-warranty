'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WarrantyABI from '../constants/WarrantyABI.json';

export default function CheckWarrantyStatusButton({ account, contractAddress }) {
  const [isOpen, setIsOpen] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [warrantyValid, setWarrantyValid] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkWarrantyStatus = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, WarrantyABI, provider);
      
      const isValid = await contract.isWarrantyValid(certificateId);
      setWarrantyValid(isValid);

      if (isValid) {
        const cert = await contract.getCertificateInfo(certificateId);
        const warrantyEndTime = Number(cert.creationTime) + Number(cert.warrantyPeriod) * 30 * 24 * 60 * 60;
        const timeLeft = warrantyEndTime - Math.floor(Date.now() / 1000);
        setRemainingTime(timeLeft > 0 ? timeLeft : 0);
      } else {
        setRemainingTime(null);
      }
    } catch (error) {
      console.error('Error checking warranty status:', error);
      alert('Failed to check warranty status. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        className="w-64 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        Check Warranty Status
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-[420px] text-white">
            <h2 className="text-2xl font-bold text-center mb-4">Warranty Status</h2>
            <input
              type="text"
              className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter Certificate ID"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
            />
            <button
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition disabled:bg-green-400"
              onClick={checkWarrantyStatus}
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
            <button
              className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>

            {warrantyValid !== null && (
              <div className="mt-6 p-4 bg-white/20 border border-white/30 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-center">Warranty Information</h3>
                {warrantyValid ? (
                  <p className="text-green-500 text-center font-semibold text-lg">✅ Warranty is Valid!</p>
                ) : (
                  <p className="text-red-500 text-center font-semibold text-lg">❌ Warranty Expired</p>
                )}
                {warrantyValid && remainingTime !== null && (
                  <p className="text-center text-white mt-2">
                    ⏳ <strong>Remaining Time:</strong> {Math.floor(remainingTime / (60 * 60 * 24))} days
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
