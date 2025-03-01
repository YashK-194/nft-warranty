'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WarrantyABI from '../constants/WarrantyABI.json';

export default function CreateWarrantyButton({ account, contractAddress }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    brandName: '',
    productName: '',
    category: '',
    price: '',
    warrantyPeriod: '',
    buyerAddress: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createWarrantyCertificate = async () => {
    if (!account) return;
    setIsSubmitting(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, WarrantyABI, signer);

      // Convert price from dollars to wei
      const priceInWei = ethers.utils.parseUnits(formData.price, "ether");

      const tx = await contract.createWarrantyCertificate(
        formData.brandName,
        formData.productName,
        formData.category,
        priceInWei,
        parseInt(formData.warrantyPeriod),
        formData.buyerAddress,
        formData.description
      );
      await tx.wait();
      alert("Warranty certificate created successfully!");
      setIsOpen(false);
      setFormData({
        brandName: '',
        productName: '',
        category: '',
        price: '',
        warrantyPeriod: '',
        buyerAddress: '',
        description: ''
      });
    } catch (error) {
      console.error("Error creating warranty certificate:", error);
      alert("Transaction failed.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        Create Warranty Certificate
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-[400px] text-white">
            <h2 className="text-2xl font-bold text-center mb-6">Create Warranty Certificate</h2>

            {!account ? (
              // If wallet is not connected, show this message
              <div className="text-center p-6">
                <p className="text-lg text-red-400">Please connect your wallet to create a warranty certificate.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              // If wallet is connected, show the form
              <>
                <div className="space-y-4">
                  {Object.keys(formData).map((key) => (
                    <input
                      key={key}
                      type="text"
                      name={key}
                      placeholder={
                        key === "warrantyPeriod"
                          ? "Warranty Period (in months)"
                          : key === "price"
                          ? "Price (In USD)"
                          : key.charAt(0).toUpperCase() + key.slice(1)
                      }
                      value={formData[key]}
                      onChange={handleChange}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <button 
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:bg-blue-400"
                    onClick={createWarrantyCertificate} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
