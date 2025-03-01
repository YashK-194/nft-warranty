'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WarrantyABI from '../constants/WarrantyABI.json';

export default function GetWarrantyDetailsButton({ account, contractAddress }) {
  const [isOpen, setIsOpen] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [warrantyDetails, setWarrantyDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWarrantyDetails = async () => {
    if (!certificateId) {
      alert('Please enter a valid certificate ID');
      return;
    }


    setLoading(true);
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, WarrantyABI, provider);

        const details = await contract.getCertificateInfo(certificateId);
        console.log('Warranty details:', details);

        setWarrantyDetails({
          brandName: details.brandName,
          product: details.product,
          category: details.category,
          price: ethers.utils.formatUnits(details.price, 'ether'),
          warrantyPeriod: details.warrantyPeriod.toString(),
          sellerAddress: details.sellerAddress,
          buyerAddress: details.buyerAddress,
          description: details.description,
          creationTime: new Date(details.creationTime * 1000).toLocaleString(),
        });
      } else {
        alert('MetaMask is required to fetch details');
      }
    } catch (error) {
      console.error('Error fetching warranty details:', error);
      alert('Error fetching warranty details');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        className="w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        Get Warranty Details
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-[420px] text-white">
            <h2 className="text-2xl font-bold text-center mb-4">Warranty Details</h2>
            <input
              type="text"
              className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Certificate ID"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
            />
            <button
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition disabled:bg-green-400"
              onClick={fetchWarrantyDetails}
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Get Details'}
            </button>
            <button
              className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>

            {warrantyDetails && (
              <div className="mt-6 p-4 bg-white/20 border border-white/30 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-center">Warranty Information</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Brand:</strong> {warrantyDetails.brandName}</p>
                  <p><strong>Product:</strong> {warrantyDetails.product}</p>
                  <p><strong>Category:</strong> {warrantyDetails.category}</p>
                  <p><strong>Price:</strong> ${warrantyDetails.price}</p>
                  <p><strong>Warranty Period:</strong> {warrantyDetails.warrantyPeriod} months</p>
                  <p><strong>Seller:</strong> {warrantyDetails.sellerAddress}</p>
                  <p><strong>Buyer:</strong> {warrantyDetails.buyerAddress}</p>
                  <p><strong>Description:</strong> {warrantyDetails.description}</p>
                  <p><strong>Created On:</strong> {warrantyDetails.creationTime}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
