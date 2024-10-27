// scripts/utils/network.ts
import { ethers } from "hardhat";
import chalk from "chalk";

export interface NetworkConfig {
    name: string;
    chainId: number;
    blockConfirmations: number;
    verifyContracts: boolean;
}

export const NETWORK_CONFIGS: { [key: string]: NetworkConfig } = {
    base: {
        name: "base",
        chainId: 8453,
        blockConfirmations: 5,
        verifyContracts: true,
    },
    baseGoerli: {
        name: "baseGoerli",
        chainId: 84531,
        blockConfirmations: 3,
        verifyContracts: true,
    },
    localhost: {
        name: "localhost",
        chainId: 31337,
        blockConfirmations: 1,
        verifyContracts: false,
    },
};

export async function waitForConfirmations(
    txHash: string,
    confirmations: number
): Promise<void> {
    console.log(chalk.yellow(`Waiting for ${confirmations} confirmations...`));
    await ethers.provider.waitForTransaction(txHash, confirmations);
}

export async function getCurrentGasPrice(): Promise<string> {
    const gasPrice = await ethers.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, "gwei");
}

export async function estimateGasWithBuffer(
    contract: any,
    method: string,
    args: any[],
    buffer: number = 1.2
): Promise<string> {
    const estimatedGas = await contract.estimateGas[method](...args);
    return Math.ceil(estimatedGas.toNumber() * buffer).toString();
}

export function getExplorerUrl(network: string, txHash: string): string {
    const baseUrl = network === "base"
        ? "https://basescan.org"
        : "https://goerli.basescan.org";
    return `${baseUrl}/tx/${txHash}`;
}

export async function verifyNetworkConfig(): Promise<void> {
    const network = await ethers.provider.getNetwork();
    const config = NETWORK_CONFIGS[network.name];

    if (!config) {
        throw new Error(`Unsupported network: ${network.name}`);
    }

    if (network.chainId !== config.chainId) {
        throw new Error(
            `Chain ID mismatch. Expected ${config.chainId}, got ${network.chainId}`
        );
    }
}

export async function checkBalance(address: string): Promise<void> {
    const balance = await ethers.provider.getBalance(address);
    console.log(
        chalk.gray(`Balance: ${ethers.utils.formatEther(balance)} ETH`)
    );

    if (balance.isZero()) {
        throw new Error("Insufficient balance for deployment");
    }
}