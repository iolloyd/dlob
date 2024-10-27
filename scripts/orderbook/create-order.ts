// scripts/orderbook/create-order.ts
import { ethers } from "hardhat";
import chalk from "chalk";
import { getCurrentGasPrice, waitForConfirmations, getExplorerUrl } from "../utils/network";
import { BigNumber } from "ethers";

interface CreateOrderParams {
    baseToken: string;
    quoteToken: string;
    amount: string;
    price: string;
    isBuy: boolean;
    minFillAmount?: string;
}

export async function createOrder({
                                      baseToken,
                                      quoteToken,
                                      amount,
                                      price,
                                      isBuy,
                                      minFillAmount = "0"
                                  }: CreateOrderParams): Promise<string> {
    try {
        console.log(chalk.blue("\nCreating new order..."));
        console.log(chalk.gray("Parameters:"));
        console.log({
            baseToken,
            quoteToken,
            amount,
            price,
            isBuy,
            minFillAmount
        });

        // Get contract and signer
        const [signer] = await ethers.getSigners();
        const orderBook = await ethers.getContract("LimitOrderBook");

        // Convert amounts to Wei
        const amountWei = ethers.utils.parseEther(amount);
        const priceWei = ethers.utils.parseEther(price);
        const minFillWei = ethers.utils.parseEther(minFillAmount);

        // Check and approve tokens
        await approveTokensIfNeeded(
            baseToken,
            quoteToken,
            amountWei,
            priceWei,
            isBuy,
            signer.address,
            orderBook.address
        );

        // Get current gas price
        const gasPrice = await getCurrentGasPrice();
        console.log(chalk.gray(`Current gas price: ${gasPrice} gwei`));

        // Create order
        const tx = await orderBook.connect(signer).createOrder(
            baseToken,
            quoteToken,
            amountWei,
            priceWei,
            isBuy,
            minFillWei,
            {
                gasPrice: ethers.utils.parseUnits(gasPrice, "gwei"),
            }
        );

        console.log(chalk.yellow("Transaction submitted:", tx.hash));

        // Wait for confirmation
        await waitForConfirmations(tx.hash, 1);
        const receipt = await tx.wait();

        // Find OrderCreated event
        const event = receipt.events?.find(e => e.event === "OrderCreated");
        if (!event) {
            throw new Error("Order creation event not found");
        }

        const orderId = event.args?.orderId;
        console.log(chalk.green("\nOrder created successfully!"));
        console.log(chalk.white("Order ID:", orderId));
        console.log(chalk.gray("Explorer URL:", getExplorerUrl(network.name, tx.hash)));

        return orderId;

    } catch (error: any) {
        console.error(chalk.red("\nFailed to create order:"));
        console.error(error.message);
        throw error;
    }
}

async function approveTokensIfNeeded(
    baseToken: string,
    quoteToken: string,
    amount: BigNumber,
    price: BigNumber,
    isBuy: boolean,
    owner: string,
    spender: string
): Promise<void> {
    const quoteAmount = amount.mul(price).div(ethers.constants.WeiPerEther);

    if (isBuy) {
        await checkAndApproveToken(quoteToken, quoteAmount, owner, spender);
    } else {
        await checkAndApproveToken(baseToken, amount, owner, spender);
    }
}

async function checkAndApproveToken(
    tokenAddress: string,
    amount: BigNumber,
    owner: string,
    spender: string
): Promise<void> {
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    const allowance = await token.allowance(owner, spender);

    if (allowance.lt(amount)) {
        console.log(chalk.yellow(`\nApproving tokens for trading...`));
        const tx = await token.approve(spender, ethers.constants.MaxUint256);
        await tx.wait();
        console.log(chalk.green("Token approval successful!"));
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    createOrder({
        baseToken: args[0],
        quoteToken: args[1],
        amount: args[2],
        price: args[3],
        isBuy: args[4].toLowerCase() === "true",
        minFillAmount: args[5],
    })
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}