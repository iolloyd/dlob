// tasks/orders.ts
import { task, types } from "hardhat/config";
import { Contract } from "ethers";
import chalk from "chalk";

task("create-order", "Creates a new limit order")
    .addParam("base", "Base token address")
    .addParam("quote", "Quote token address")
    .addParam("amount", "Order amount", undefined, types.string)
    .addParam("price", "Order price", undefined, types.string)
    .addParam("side", "Order side (buy/sell)", "buy", types.string)
    .addOptionalParam("min", "Minimum fill amount", "0", types.string)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        console.log(chalk.blue("\nCreating order..."));
        console.log(chalk.gray("Signer:", signer.address));

        // Load contract
        const OrderBook = await ethers.getContract("LimitOrderBook");
        const orderBook = OrderBook.connect(signer);

        // Approve tokens if needed
        await approveTokensIfNeeded(
            taskArgs.base,
            taskArgs.quote,
            taskArgs.amount,
            taskArgs.price,
            taskArgs.side === "buy",
            signer,
            orderBook,
            hre
        );

        // Create order
        try {
            const tx = await orderBook.createOrder(
                taskArgs.base,
                taskArgs.quote,
                ethers.utils.parseEther(taskArgs.amount),
                ethers.utils.parseEther(taskArgs.price),
                taskArgs.side === "buy",
                ethers.utils.parseEther(taskArgs.min)
            );

            console.log(chalk.yellow("Transaction sent:", tx.hash));
            const receipt = await tx.wait();

            // Find OrderCreated event
            const event = receipt.events?.find(e => e.event === "OrderCreated");
            if (event) {
                console.log(chalk.green("\nOrder created successfully!"));
                console.log(chalk.white("Order ID:", event.args.orderId));
            }
        } catch (error: any) {
            console.error(chalk.red("Failed to create order:"));
            console.error(error.message);
        }
    });

task("cancel-order", "Cancels an existing order")
    .addParam("id", "Order ID to cancel")
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        console.log(chalk.blue("\nCancelling order..."));
        console.log(chalk.gray("Order ID:", taskArgs.id));

        const OrderBook = await ethers.getContract("LimitOrderBook");
        const orderBook = OrderBook.connect(signer);

        try {
            const tx = await orderBook.cancelOrder(taskArgs.id);
            console.log(chalk.yellow("Transaction sent:", tx.hash));
            await tx.wait();
            console.log(chalk.green("Order cancelled successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Failed to cancel order:"));
            console.error(error.message);
        }
    });

task("fill-order", "Fills an existing order")
    .addParam("id", "Order ID to fill")
    .addParam("amount", "Amount to fill", undefined, types.string)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        console.log(chalk.blue("\nFilling order..."));
        console.log(chalk.gray("Order ID:", taskArgs.id));

        const OrderBook = await ethers.getContract("LimitOrderBook");
        const orderBook = OrderBook.connect(signer);

        // Get order details
        const order = await orderBook.getOrder(taskArgs.id);

        // Approve tokens if needed
        if (order.isBuy) {
            await approveToken(order.baseToken, taskArgs.amount, signer, orderBook.address, hre);
        } else {
            const quoteAmount = ethers.utils.parseEther(taskArgs.amount)
                .mul(order.price)
                .div(ethers.utils.parseEther("1"));
            await approveToken(order.quoteToken, quoteAmount.toString(), signer, orderBook.address, hre);
        }

        try {
            const tx = await orderBook.fillOrder(
                taskArgs.id,
                ethers.utils.parseEther(taskArgs.amount)
            );
            console.log(chalk.yellow("Transaction sent:", tx.hash));
            await tx.wait();
            console.log(chalk.green("Order filled successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Failed to fill order:"));
            console.error(error.message);
        }
    });

task("get-order", "Gets details of an order")
    .addParam("id", "Order ID to query")
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const OrderBook = await ethers.getContract("LimitOrderBook");

        try {
            const order = await OrderBook.getOrder(taskArgs.id);
            console.log(chalk.blue("\nOrder Details:"));
            console.log(chalk.white({
                trader: order.trader,
                baseToken: order.baseToken,
                quoteToken: order.quoteToken,
                amount: ethers.utils.formatEther(order.amount),
                price: ethers.utils.formatEther(order.price),
                isBuy: order.isBuy,
                filled: ethers.utils.formatEther(order.filled),
                active: order.active
            }));
        } catch (error: any) {
            console.error(chalk.red("Failed to get order:"));
            console.error(error.message);
        }
    });

// Helper functions
async function approveToken(
    token: string,
    amount: string,
    signer: any,
    spender: string,
    hre: any
): Promise<void> {
    const { ethers } = hre;
    const Token = await ethers.getContractAt("IERC20", token);
    const tokenContract = Token.connect(signer);

    const allowance = await tokenContract.allowance(signer.address, spender);
    if (allowance.lt(ethers.utils.parseEther(amount))) {
        console.log(chalk.yellow(`Approving ${amount} tokens...`));
        const tx = await tokenContract.approve(
            spender,
            ethers.constants.MaxUint256
        );
        await tx.wait();
        console.log(chalk.green("Token approved!"));
    }
}

async function approveTokensIfNeeded(
    baseToken: string,
    quoteToken: string,
    amount: string,
    price: string,
    isBuy: boolean,
    signer: any,
    orderBook: Contract,
    hre: any
): Promise<void> {
    if (isBuy) {
        const quoteAmount = ethers.utils.parseEther(amount)
            .mul(ethers.utils.parseEther(price))
            .div(ethers.utils.parseEther("1"));
        await approveToken(quoteToken, quoteAmount.toString(), signer, orderBook.address, hre);
    } else {
        await approveToken(baseToken, amount, signer, orderBook.address, hre);
    }
}