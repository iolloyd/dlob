// deploy/config.ts
import { ethers } from "ethers";

export interface NetworkConfig {
  name: string;
  verifyContracts: boolean;
  blockConfirmations: number;
  oracle: {
    maxPriceAge: number;
    minConfidence: number;
  };
  orderBook: {
    minOrderSize: string;
    maxOrderSize: string;
    maxPriceDeviation: number;
  };
}

const configs: { [key: string]: NetworkConfig } = {
  base: {
    name: "base",
    verifyContracts: true,
    blockConfirmations: 5,
    oracle: {
      maxPriceAge: 3600,
      minConfidence: 80,
    },
    orderBook: {
      minOrderSize: ethers.utils.parseEther("0.1").toString(),
      maxOrderSize: ethers.utils.parseEther("1000").toString(),
      maxPriceDeviation: 1000, // 10%
    },
  },
  baseGoerli: {
    name: "baseGoerli",
    verifyContracts: true,
    blockConfirmations: 3,
    oracle: {
      maxPriceAge: 3600,
      minConfidence: 80,
    },
    orderBook: {
      minOrderSize: ethers.utils.parseEther("0.01").toString(),
      maxOrderSize: ethers.utils.parseEther("100").toString(),
      maxPriceDeviation: 2000, // 20%
    },
  },
  localhost: {
    name: "localhost",
    verifyContracts: false,
    blockConfirmations: 1,
    oracle: {
      maxPriceAge: 3600,
      minConfidence: 80,
    },
    orderBook: {
      minOrderSize: ethers.utils.parseEther("0.001").toString(),
      maxOrderSize: ethers.utils.parseEther("1000").toString(),
      maxPriceDeviation: 5000, // 50%
    },
  },
};

export default configs;
