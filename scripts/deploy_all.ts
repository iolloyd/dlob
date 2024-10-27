// scripts/deploy-all.ts
import { ethers, network } from "hardhat";
import chalk from "chalk";
import configs from "../deploy/config";
import { verify } from "../deploy/utils/verify";

async function main() {
  const config = configs[network.name];
  if (!config) {
    throw new Error(`No configuration found for network: ${network.name}`);
  }

  console.log(chalk.blue("\nStarting deployment on", network.name.toUpperCase()));
  console.log(chalk.gray("Using configuration:"));
  console.log(config);

  const [deployer] = await ethers.getSigners();
  console.log(chalk.gray(`Deployer: ${deployer.address}`));
  
  // Deploy all contracts in sequence
  try {
    // Deploy and verify libraries
    console.log(chalk.yellow("\nDeploying libraries..."));
    await hre.run("deploy", { tags: "Libraries" });

    // Deploy and verify price oracle
    console.log(chalk.yellow("\nDeploying price oracle..."));
    await hre.run("deploy", { tags: "PriceOracle" });

    // Deploy and verify order validator
    console.log(chalk.yellow("\nDeploying order validator..."));
    await hre.run("deploy", { tags: "OrderValidator" });

    // Deploy and verify order book
    console.log(chalk.yellow("\nDeploying limit order book..."));
    await hre.run("deploy", { tags: "LimitOrderBook" });

    console.log(chalk.green("\nDeployment completed successfully!"));

    // Print deployed addresses
    const deployments = await hre.deployments.all();
    console.log(chalk.blue("\nDeployed Contracts:"));
    Object.entries(deployments).forEach(([name, deployment]) => {
      console.log(chalk.white(`${name}: ${deployment.address}`));
    });

  } catch (error) {
    console.error(chalk.red("\nDeployment failed:"));
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
