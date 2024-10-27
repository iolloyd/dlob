import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "./utils/verify";
import chalk from "chalk";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(chalk.blue("\nDeploying Price Oracle..."));

  // Configuration for oracle
  const MAX_PRICE_AGE = 3600; // 1 hour
  const MIN_CONFIDENCE = 80; // 80%

  // Deploy PriceOracle
  const oracle = await deploy("PriceOracle", {
    from: deployer,
    args: [MAX_PRICE_AGE, MIN_CONFIDENCE],
    log: true,
  });

  if (network.name === "base" || network.name === "baseGoerli") {
    await verify(oracle.address, {
      contract: "contracts/core/utils/PriceOracle.sol:PriceOracle",
      constructorArguments: [MAX_PRICE_AGE, MIN_CONFIDENCE],
    });
  }

  return oracle.address;
};

export default func;
func.tags = ["PriceOracle"];
func.dependencies = ["Libraries"];
