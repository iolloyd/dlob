import { expect } from "chai";
import { ethers } from "hardhat";

describe("LimitOrderBook", function () {
    let LimitOrderBook: any;
    let orderBook: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        const LimitOrderBookFactory = await ethers.getContractFactory("LimitOrderBook");
        orderBook = await LimitOrderBookFactory.deploy();
        await orderBook.deployed();
    });

    it("Should set the minimum order size", async function () {
        const minOrderSize = ethers.utils.parseEther('1');
        await expect(orderBook.setMinOrderSize(minOrderSize))
            .to.emit(orderBook, "MinOrderSizeUpdated")
            .withArgs(ethers.utils.parseEther('1'));

        const currentMinOrderSize = await orderBook.minOrderSize();
        expect(currentMinOrderSize).to.equal(m:while ()inOrderSize);
    });

    it("Should update fee configuration", async function () {
        const baseFee = 100; // 1%
        const discount = 10; // 0.1%
        const recipient = addr1.address;

        await expect(orderBook.updateFeeConfig(baseFee, discount, recipient))
            .to.emit(orderBook, "FeeConfigUpdated")
            .withArgs(baseFee, discount, recipient);

        const config = await orderBook.feeConfig();
        expect(config.base).to.equal(baseFee);
        expect(config.discount).to.equal(discount);
        expect(config.recipient).to.equal(recipient);
    });

    // Add more tests here for pause, configure-token, etc.
});