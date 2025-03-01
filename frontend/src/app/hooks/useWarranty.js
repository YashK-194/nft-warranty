"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  getContractAddresses,
  getWarrantyABI,
  SEPOLIA_CHAIN_ID,
} from "../constants";

export default function useWarranty() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      console.log("Connected to chain:", chainId);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        alert("Please connect to Sepolia Testnet");
        return;
      }

      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const warrantyAddresses = getContractAddresses();
      const warrantyABI = getWarrantyABI();

      const warrantyContract = new ethers.Contract(
        warrantyAddresses[parseInt(chainId).toString()],
        warrantyABI,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setContract(warrantyContract);
      setAccount(address);
      setChainId(chainId);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert(`Wallet connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create warranty certificate with gas estimation
  const createWarrantyCertificate = async (
    brandName,
    productName,
    category,
    price,
    warrantyPeriod,
    buyerAddress,
    description
  ) => {
    if (!contract) return;

    try {
      setIsLoading(true);

      const gasEstimate = await contract.estimateGas.createWarrantyCertificate(
        brandName,
        productName,
        category,
        price,
        warrantyPeriod,
        buyerAddress,
        description
      );

      const tx = await contract.createWarrantyCertificate(
        brandName,
        productName,
        category,
        price,
        warrantyPeriod,
        buyerAddress,
        description,
        { gasLimit: gasEstimate.mul(2) } // Buffer for gas estimation
      );

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error creating warranty:", error);
      alert(`Transaction failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get certificate information
  const getCertificateInfo = async (certificateId) => {
    if (!contract) return null;

    try {
      const certificate = await contract.getCertificateInfo(certificateId);
      return {
        brandName: certificate.brandName,
        product: certificate.product,
        category: certificate.category,
        price: ethers.utils.formatUnits(certificate.price, 0),
        warrantyPeriod: certificate.warrantyPeriod.toNumber(),
        certificateId: certificate.certificateId.toNumber(),
        creationTime: new Date(certificate.creationTime.toNumber() * 1000),
        sellerAddress: certificate.sellerAddress,
        buyerAddress: certificate.buyerAddress,
        description: certificate.description,
        isValid: await contract.isWarrantyValid(certificateId),
      };
    } catch (error) {
      console.error("Error getting certificate:", error);
      return null;
    }
  };

  // Get all certificates for the connected user
  const getUserCertificates = useCallback(async () => {
    if (!contract || !account) return;

    try {
      setIsLoading(true);
      const tokenCount = await contract.tokenCounter();

      const certificatePromises = Array.from(
        { length: tokenCount.toNumber() },
        (_, i) => contract.getCertificateInfo(i)
      );

      const certificatesData = await Promise.all(certificatePromises);
      const userCertificates = await Promise.all(
        certificatesData
          .map((cert, i) => ({
            ...cert,
            id: i,
            price: ethers.utils.formatUnits(cert.price, 0),
            warrantyPeriod: cert.warrantyPeriod.toNumber(),
            certificateId: cert.certificateId.toNumber(),
            creationTime: new Date(cert.creationTime.toNumber() * 1000),
          }))
          .filter(
            (cert) =>
              cert.sellerAddress.toLowerCase() === account.toLowerCase() ||
              cert.buyerAddress.toLowerCase() === account.toLowerCase()
          )
          .map(async (cert) => ({
            ...cert,
            isValid: await contract.isWarrantyValid(cert.id),
          }))
      );

      setCertificates(userCertificates);
      return userCertificates;
    } catch (error) {
      console.error("Error getting user certificates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount("");
        setContract(null);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      setContract(null);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    provider,
    signer,
    contract,
    account,
    chainId,
    isLoading,
    certificates,
    connectWallet,
    createWarrantyCertificate,
    getCertificateInfo,
    getUserCertificates,
  };
}
