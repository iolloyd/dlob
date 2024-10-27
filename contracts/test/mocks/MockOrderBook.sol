// contracts/test/mocks/MockOrderBook.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../core/interfaces/ILimitOrderBook.sol";
import "../../core/libraries/OrderLib.sol";
import "../../core/libraries/PriceLib.sol";

contract MockOrderBook is ILimitOrderBook, ReentrancyGuard {
    using OrderLib for OrderLib.Order;
    using PriceLib for uint256;

    // State variables
    mapping(bytes32 => OrderLib.Order) public orders;
    mapping(address => mapping(address => mapping(uint256 => bytes32[]))) private pricePoints;
    uint256 public minOrderSize;
    uint256 public mockTimestamp;
    bool public shouldRevert;
    mapping(bytes32 => bool) public orderExecuted;

    // Testing specific variables
    uint256 public createOrderCallCount;
    uint256 public cancelOrderCallCount;
    uint256 public fillOrderCallCount;
    bytes32 public lastOrderId;

    constructor(uint256 _minOrderSize) {
        minOrderSize = _minOrderSize;
        mockTimestamp = block.timestamp;
    }

    // Testing helper functions
    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function setMockTimestamp(uint256 _timestamp) external {
        mockTimestamp = _timestamp;
    }

    function setOrderExecuted(bytes32 orderId, bool executed) external {
        orderExecuted[orderId] = executed;
    }

    function resetCounters() external {
        createOrderCallCount = 0;
        cancelOrderCallCount = 0;
        fillOrderCallCount = 0;
    }

    // Mock implementations of main contract functions
    function createOrder(
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) external override nonReentrant returns (bytes32) {
        require(!shouldRevert, "Mock: createOrder reverted");
        createOrderCallCount++;

        require(amount >= minOrderSize, "Order too small");
        require(baseToken != address(0) && quoteToken != address(0), "Invalid tokens");
        require(price > 0, "Invalid price");

        uint256 quoteAmount = amount.mulPrice(price);

        // In mock, we don't actually transfer tokens
        bytes32 orderId = OrderLib.generateOrderId(
            msg.sender,
            baseToken,
            quoteToken,
            amount,
            price,
            isBuy
        );

        orders[orderId] = OrderLib.Order({
            trader: msg.sender,
            baseToken: baseToken,
            quoteToken: quoteToken,
            amount: amount,
            price: price,
            isBuy: isBuy,
            timestamp: mockTimestamp,
            filled: 0,
            active: true
        });

        pricePoints[baseToken][quoteToken][price].push(orderId);
        lastOrderId = orderId;

        emit OrderCreated(
            orderId,
            msg.sender,
            baseToken,
            quoteToken,
            amount,
            price,
            isBuy
        );

        return orderId;
    }

    function cancelOrder(bytes32 orderId) external override nonReentrant {
        require(!shouldRevert, "Mock: cancelOrder reverted");
        cancelOrderCallCount++;

        OrderLib.Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.active, "Order not active");

        order.active = false;
        
        // In mock, we don't actually transfer tokens back
        emit OrderCancelled(orderId);
    }

    function fillOrder(bytes32 orderId, uint256 fillAmount) external override nonReentrant {
        require(!shouldRevert, "Mock: fillOrder reverted");
        fillOrderCallCount++;

        OrderLib.Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(fillAmount > 0, "Invalid fill amount");
        require(fillAmount <= order.amount - order.filled, "Exceeds available");

        uint256 quoteAmount = fillAmount.mulPrice(order.price);

        // In mock, we don't actually transfer tokens
        order.filled += fillAmount;
        if (order.filled == order.amount) {
            order.active = false;
        }

        orderExecuted[orderId] = true;

        emit OrderFilled(
            orderId,
            msg.sender,
            fillAmount,
            quoteAmount
        );
    }

    function getOrder(bytes32 orderId) external view override returns (
        address trader,
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy,
        uint256 timestamp,
        uint256 filled,
        bool active
    ) {
        OrderLib.Order memory order = orders[orderId];
        return (
            order.trader,
            order.baseToken,
            order.quoteToken,
            order.amount,
            order.price,
            order.isBuy,
            order.timestamp,
            order.filled,
            order.active
        );
    }

    function getBestPrice(address baseToken, address quoteToken, bool isBuy) external view override returns (uint256) {
        // Mock implementation always returns a fixed price for testing
        return 1000 * 10**18;
    }

    // Additional testing helpers
    function getOrderCount(address baseToken, address quoteToken, uint256 price) external view returns (uint256) {
        return pricePoints[baseToken][quoteToken][price].length;
    }

    function simulateOrderExecution(bytes32 orderId) external {
        OrderLib.Order storage order = orders[orderId];
        require(order.active, "Order not active");
        
        order.filled = order.amount;
        order.active = false;
        orderExecuted[orderId] = true;
        
        emit OrderFilled(
            orderId,
            msg.sender,
            order.amount,
            order.amount.mulPrice(order.price)
        );
    }

    function getLastOrderId() external view returns (bytes32) {
        return lastOrderId;
    }
}
