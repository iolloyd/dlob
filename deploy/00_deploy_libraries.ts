// deploy/00_deploy_libraries.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "./utils/verify";
import chalk from "chalk";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(chalk.blue("\nDeploying Libraries..."));
  console.log(chalk.gray(`Deployer: ${deployer}`));

  // Deploy OrderLib
  const orderLib = await deploy("OrderLib", {
    from: deployer,
    args: [],
    log: true,
  });

  // Deploy PriceLib
  const priceLib = await deploy("PriceLib", {
    from: deployer,
    args: [],
    log: true,
  });

  // Verify contracts if on BASE or BASE Goerli
  if (network.name === "base" || network.name === "baseGoerli") {
    console.log(chalk.yellow("\nVerifying contracts..."));
    
    await verify(orderLib.address, {
      contract: "contracts/core/libraries/OrderLib.sol:OrderLib",
    });

    await verify(priceLib.address, {
      contract: "contracts/core/libraries/PriceLib.sol:PriceLib",
    });
  }

  // Return libraries addresses for subsequent deployments
  return {
    OrderLib: orderLib.address,
    PriceLib: priceLib.address,
  };
};

export default func;
func.tags = ["Libraries"];
