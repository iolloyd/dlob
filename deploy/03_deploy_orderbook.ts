// deploy/03_deploy_orderbook.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "./utils/verify";
import chalk from "chalk";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(chalk.blue("\nDeploying Limit Order Book..."));

  // Get deployed contract addresses
  const orderLib = await get("OrderLib");
  const priceLib = await get("PriceLib");
  const validator = await get("OrderValidator");

  // Configuration
  const MIN_ORDER_SIZE = hre.ethers.utils.parseEther("0.1");

  // Deploy LimitOrderBook with libraries
  const orderBook = await deploy("LimitOrderBook", {
    from: deployer,
    args: [MIN_ORDER_SIZE],
    libraries: {
      OrderLib: orderLib.address,
      PriceLib: priceLib.address,
    },
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [validator.address],
        },
      },
    },
    log: true,
  });

  if (network.name === "base" || network.name === "baseGoerli") {
    await verify(orderBook.address, {
      contract: "contracts/core/LimitOrderBook.sol:LimitOrderBook",
      constructorArguments: [MIN_ORDER_SIZE],
      libraries: {
        OrderLib: orderLib.address,
        PriceLib: priceLib.address,
      },
    });
  }

  return orderBook.address;
};

export default func;
func.tags = ["LimitOrderBook"];
func.dependencies = ["Libraries", "OrderValidator"];
