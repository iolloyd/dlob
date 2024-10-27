import { task, types } from "hardhat/config";
import chalk from "chalk";
import { ethers } from "hardhat";

async function getOrderBook(signer: any) {
    const OrderBook = await ethers.getContract("LimitOrderBook");
    return OrderBook.connect(signer);
}

task("set-min-order", "Sets minimum order size")
    .addParam("size", "Minimum order size in ETH", undefined, types.string)
    .setAction(async (taskArgs, hre) => {
        const [signer] = await ethers.getSigners();
        console.log(chalk.blue("\nSetting minimum order size..."));

        try {
            const orderBook = await getOrderBook(signer);
            const tx = await orderBook.setMinOrderSize(
                ethers.utils.parseEther(taskArgs.size)
            );
            console.log(chalk.yellow("Transaction sent:", tx.hash));
            await tx.wait();
            console.log(chalk.green("Minimum order size updated successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Failed to update minimum order size:"));
            console.error(error.message);
        }
    });

task("set-fee", "Updates fee configuration")
    .addParam("base", "Base fee in basis points")
    .addParam("discount", "Volume discount in basis points")
    .addParam("recipient", "Fee recipient address")
    .setAction(async (taskArgs, hre) => {
        const [signer] = await ethers.getSigners();
        console.log(chalk.blue("\nUpdating fee configuration..."));

        try {
            const orderBook = await getOrderBook(signer);
            const tx = await orderBook.updateFeeConfig(
                taskArgs.base,
                taskArgs.discount,
                taskArgs.recipient
            );
            console.log(chalk.yellow("Transaction sent:", tx.hash));
            await tx.wait();
            console.log(chalk.green("Fee configuration updated successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Failed to update fee configuration:"));
            console.error(error.message);
        }
    });

task("configure-token", "Configures token parameters")
    .addParam("token", "Token address")
    .addParam("enabled", "Whether token is enabled", true, types.boolean)
    .addParam("min", "Minimum trade size", undefined, types.string)
    .addParam("max", "Maximum trade size", undefined, types.string)
    .setAction(async (taskArgs, hre) => {
        const [signer] = await ethers.getSigners();
        console.log(chalk.blue("\nConfiguring token..."));

        try {
            const orderBook = await getOrderBook(signer);
            const tx = await orderBook.updateTokenConfig(
                taskArgs.token,
                taskArgs.enabled,
                ethers.utils.parseEther(taskArgs.min),
                ethers.utils.parseEther(taskArgs.max)
            );
            console.log(chalk.yellow("Transaction sent:", tx.hash));
            await tx.wait();
            console.log(chalk.green("Token configuration updated successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Failed to update token configuration:"));
            console.error(error.message);
        }
    });

task("pause", "Pauses the order book").setAction(async (_, hre) => {
    const [signer] = await ethers.getSigners();
    console.log(chalk.blue("\nPausing the order book..."));

    try {
        const orderBook = await getOrderBook(signer);
        const tx = await orderBook.pause();
        console.log(chalk.yellow("Transaction sent:", tx.hash));
        await tx.wait();
        console.log(chalk.green("Order book paused successfully!"));
    } catch (error: any) {
        console.error(chalk.red("Failed to pause order book:"));
        console.error(error.message);
    }
});