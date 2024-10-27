// scripts/orderbook/cancel-order.ts
import { ethers } from "hardhat";
import chalk from "chalk";
import { getCurrentGasPrice, waitForConfirmations, getExplorerUrl } from "../utils/network";

export async function cancelOrder(orderId: string): Promise<boolean> {
    try {
        console.log(chalk.blue("\nCancelling order..."));
        console.log(chalk.gray("Order ID:", orderId));

        // Get contract and signer
        const [signer] = await ethers.getSigners();
        const orderBook = await ethers.getContract("LimitOrderBook");

        // Verify order exists and belongs to signer
        const order = await orderBook.getOrder(orderId);
        if (!order.trader) {
            throw new Error("Order not found");
        }
        if (order.trader.toLowerCase() !== signer.address.toLowerCase()) {
            throw new Error("Not order owner");
        }
        if (!order.active) {
            throw new Error("Order already inactive");
        }

        // Get current gas price
        const gasPrice = await getCurrentGasPrice();
        console.log(chalk.gray(`Current gas price: ${gasPrice} gwei`));

        // Cancel order
        const tx = await orderBook.connect(signer).cancelOrder(
            orderId,
            {
                gasPrice: ethers.utils.parseUnits(gasPrice, "gwei"),
            }
        );

        console.log(chalk.yellow("Transaction submitted:", tx.hash));

        // Wait for confirmation
        await waitForConfirmations(tx.hash, 1);
        const receipt = await tx.wait();

        // Verify OrderCancelled event
        const event = receipt.events?.find(e => e.event === "OrderCancelled");
        if (!event) {
            throw new Error("Order cancellation event not found");
        }

        console.log(chalk.green("\nOrder cancelled successfully!"));
        console.log(chalk.gray("Explorer URL:", getExplorerUrl(network.name, tx.hash)));

        // Return tokens to trader
        if (order.isBuy) {
            const quoteToken = await ethers.getContractAt("IERC20", order.quoteToken);
            const balance = await quoteToken.balanceOf(orderBook.address);
            if (balance.gt(0)) {
                console.log(chalk.yellow("\nRefunding quote tokens..."));
                await orderBook.connect(signer).refundTokens(order.quoteToken);
            }
        } else {
            const baseToken = await ethers.getContractAt("IERC20", order.baseToken);
            const balance = await baseToken.balanceOf(orderBook.address);
            if (balance.gt(0)) {
                console.log(chalk.yellow("\nRefunding base tokens..."));
                await orderBook.connect(signer).refundTokens(order.baseToken);
            }
        }

        return true;

    } catch (error: any) {
        console.error(chalk.red("\nFailed to cancel order:"));
        console.error(error.message);
        throw error;
    }
}

// Helper function to format order details
function formatOrderDetails(order: any): string {
    return `
  Trader: ${order.trader}
  Base Token: ${order.baseToken}
  Quote Token: ${order.quoteToken}
  Amount: ${ethers.utils.formatEther(order.amount)} 
  Price: ${ethers.utils.formatEther(order.price)}
  Side: ${order.isBuy ? 'BUY' : 'SELL'}
  Filled: ${ethers.utils.formatEther(order.filled)}
  Active: ${order.active}
  `;
}

// CLI execution
if (require.main === module) {
    const orderId = process.argv[2];
    if (!orderId) {
        console.error(chalk.red("Please provide an order ID"));
        process.exit(1);
    }

    cancelOrder(orderId)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}