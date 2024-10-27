// deploy/02_deploy_validator.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "./utils/verify";
import chalk from "chalk";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(chalk.blue("\nDeploying Order Validator..."));

  // Get oracle address from previous deployment
  const oracleAddress = (await get("PriceOracle")).address;

  // Configuration for validator
  const MIN_ORDER_SIZE = hre.ethers.utils.parseEther("0.1");
  const MAX_ORDER_SIZE = hre.ethers.utils.parseEther("1000");
  const MAX_PRICE_DEVIATION = 1000; // 10%

  // Deploy OrderValidator
  const validator = await deploy("OrderValidator", {
    from: deployer,
    args: [oracleAddress, MIN_ORDER_SIZE, MAX_ORDER_SIZE, MAX_PRICE_DEVIATION],
    log: true,
  });

  if (network.name === "base" || network.name === "baseGoerli") {
    await verify(validator.address, {
      contract: "contracts/core/utils/OrderValidator.sol:OrderValidator",
      constructorArguments: [oracleAddress, MIN_ORDER_SIZE, MAX_ORDER_SIZE, MAX_PRICE_DEVIATION],
    });
  }

  return validator.address;
};

export default func;
func.tags = ["OrderValidator"];
func.dependencies = ["PriceOracle"];
