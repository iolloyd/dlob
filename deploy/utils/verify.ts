// deploy/utils/verify.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
import chalk from "chalk";

interface VerificationConfig {
  contractPath: string;
  contractName?: string;
  constructorArguments?: any[];
  libraries?: { [key: string]: string };
  proxyAddress?: string;
}

export async function verifyContract(
  contract: Contract,
  config: VerificationConfig,
  hre: HardhatRuntimeEnvironment
): Promise<boolean> {
  const network = hre.network.name;
  console.log(chalk.blue(`\nVerifying contract on ${network.toUpperCase()}...`));
  console.log(chalk.gray(`Contract address: ${contract.address}`));

  // Wait for sufficient block confirmations
  const BLOCK_CONFIRMATIONS = network === 'base' ? 5 : 3;
  console.log(chalk.yellow(`Waiting for ${BLOCK_CONFIRMATIONS} block confirmations...`));
  
  await contract.deployTransaction.wait(BLOCK_CONFIRMATIONS);

  try {
    // Prepare verification arguments
    const verificationArgs: any = {
      address: contract.address,
      constructorArguments: config.constructorArguments || [],
      contract: config.contractPath + (config.contractName ? `:${config.contractName}` : ''),
    };

    // Add libraries if specified
    if (config.libraries) {
      verificationArgs.libraries = config.libraries;
    }

    // Verify implementation if it's a proxy
    if (config.proxyAddress) {
      console.log(chalk.yellow('Verifying proxy implementation...'));
      const implementationAddress = await getImplementationAddress(
        config.proxyAddress,
        hre
      );
      verificationArgs.address = implementationAddress;
    }

    // Attempt verification
    await hre.run("verify:verify", verificationArgs);

    console.log(chalk.green('✓ Contract verified successfully'));
    return true;
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log(chalk.yellow('⚠ Contract was already verified'));
      return true;
    }

    console.error(chalk.red('\n✘ Verification failed:'));
    console.error(chalk.red(error.message));
    return false;
  }
}

export async function verifyAllContracts(
  deployments: { [key: string]: Contract },
  configs: { [key: string]: VerificationConfig },
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  console.log(chalk.blue('\nStarting batch contract verification...'));

  const results: { [key: string]: boolean } = {};
  
  for (const [name, contract] of Object.entries(deployments)) {
    const config = configs[name];
    if (!config) {
      console.log(chalk.yellow(`⚠ No verification config found for ${name}, skipping...`));
      continue;
    }

    console.log(chalk.blue(`\nVerifying ${name}...`));
    results[name] = await verifyContract(contract, config, hre);
  }

  // Print summary
  console.log(chalk.blue('\nVerification Summary:'));
  for (const [name, success] of Object.entries(results)) {
    console.log(
      `${name}: ${success ? chalk.green('✓ Verified') : chalk.red('✘ Failed')}`
    );
  }
}

export async function getImplementationAddress(
  proxyAddress: string,
  hre: HardhatRuntimeEnvironment
): Promise<string> {
  // EIP-1967 storage slot for implementation address
  const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  
  const implementationAddress = await hre.ethers.provider.getStorageAt(
    proxyAddress,
    IMPLEMENTATION_SLOT
  );

  return hre.ethers.utils.getAddress('0x' + implementationAddress.slice(-40));
}

export async function verifyContractWithRetry(
  contract: Contract,
  config: VerificationConfig,
  hre: HardhatRuntimeEnvironment,
  maxRetries: number = 3,
  delaySeconds: number = 10
): Promise<boolean> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const success = await verifyContract(contract, config, hre);
      if (success) return true;
      
      retries++;
      if (retries < maxRetries) {
        console.log(chalk.yellow(`\nRetrying verification (${retries}/${maxRetries})...`));
        await delay(delaySeconds * 1000);
      }
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.log(chalk.yellow(`\nError occurred, retrying (${retries}/${maxRetries})...`));
        await delay(delaySeconds * 1000);
      } else {
        throw error;
      }
    }
  }

  return false;
}

// Helper function to check if a contract is already verified
export async function isContractVerified(
  address: string,
  hre: HardhatRuntimeEnvironment
): Promise<boolean> {
  try {
    const basescanProvider = process.env.BASESCAN_API_KEY;
    if (!basescanProvider) {
      throw new Error('BASESCAN_API_KEY not found in environment variables');
    }

    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${basescanProvider}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.status === '1' && data.message === 'OK';
  } catch (error) {
    console.warn(chalk.yellow('Failed to check contract verification status'));
    return false;
  }
}

// Example usage in deployment script
export const verificationExample = `
import { verifyContract, verifyContractWithRetry } from './utils/verify';

async function deployAndVerify() {
  // Deploy contract
  const Contract = await ethers.getContractFactory("LimitOrderBook");
  const contract = await Contract.deploy(constructorArgs);
  await contract.deployed();

  // Verify contract
  const config = {
    contractPath: "contracts/core/LimitOrderBook.sol",
    constructorArguments: constructorArgs,
  };

  await verifyContractWithRetry(contract, config, hre);
}
`;

// Helper function to format constructor arguments
export function formatConstructorArgs(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string' && arg.startsWith('0x')) {
        return `"${arg}"`;
      }
      if (typeof arg === 'boolean') {
        return arg.toString();
      }
      if (typeof arg === 'number') {
        return arg.toString();
      }
      if (Array.isArray(arg)) {
        return `[${formatConstructorArgs(arg)}]`;
      }
      return `"${arg}"`;
    })
    .join(', ');
}

// Utility function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example verification configs for all contracts
export const verificationConfigs = {
  LimitOrderBook: {
    contractPath: "contracts/core/LimitOrderBook.sol",
    constructorArguments: [],
  },
  OrderValidator: {
    contractPath: "contracts/core/utils/OrderValidator.sol",
    constructorArguments: [],
  },
  PriceOracle: {
    contractPath: "contracts/core/utils/PriceOracle.sol",
    constructorArguments: [],
  },
};

// Helper to generate verification command
export function generateVerificationCommand(
  contractName: string,
  address: string,
  constructorArgs: any[]
): string {
  const formattedArgs = formatConstructorArgs(constructorArgs);
  return `npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${address} ${formattedArgs}`;
}
