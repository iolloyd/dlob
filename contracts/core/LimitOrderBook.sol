// contracts/core/LimitOrderBook.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ILimitOrderBook.sol";
import "./libraries/OrderLib.sol";
import "./libraries/PriceLib.sol";

contract LimitOrderBook is ILimitOrderBook, ReentrancyGuard, Ownable, Pausable {
    using OrderLib for OrderLib.Order;
    using PriceLib for uint256;

    // State variables
    mapping(bytes32 => OrderLib.Order) public orders;
    mapping(address => mapping(address => mapping(uint256 => bytes32[]))) private pricePoints;
    uint256 public minOrderSize;
    uint256 public constant PRECISION = 1e18;

    constructor(uint256 _minOrderSize) {
        minOrderSize = _minOrderSize;
    }

    function createOrder(
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(amount >= minOrderSize, "Order too small");
        require(baseToken != address(0) && quoteToken != address(0), "Invalid tokens");
        require(price > 0, "Invalid price");

        uint256 quoteAmount = amount.mulPrice(price);
        
        // Transfer tokens
        if (isBuy) {
            require(IERC20(quoteToken).transferFrom(msg.sender, address(this), quoteAmount), "Quote transfer failed");
        } else {
            require(IERC20(baseToken).transferFrom(msg.sender, address(this), amount), "Base transfer failed");
        }

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
            timestamp: block.timestamp,
            filled: 0,
            active: true
        });

        pricePoints[baseToken][quoteToken][price].push(orderId);

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

    function cancelOrder(bytes32 orderId) external nonReentrant {
        OrderLib.Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.active, "Order not active");

        order.active = false;
        uint256 remainingAmount = order.amount - order.filled;

        if (remainingAmount > 0) {
            if (order.isBuy) {
                uint256 quoteAmount = remainingAmount.mulPrice(order.price);
                require(IERC20(order.quoteToken).transfer(msg.sender, quoteAmount), "Quote refund failed");
            } else {
                require(IERC20(order.baseToken).transfer(msg.sender, remainingAmount), "Base refund failed");
            }
        }

        emit OrderCancelled(orderId);
    }

    function fillOrder(bytes32 orderId, uint256 fillAmount) external nonReentrant whenNotPaused {
        OrderLib.Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(fillAmount > 0, "Invalid fill amount");
        require(fillAmount <= order.amount - order.filled, "Exceeds available");

        uint256 quoteAmount = fillAmount.mulPrice(order.price);

        if (order.isBuy) {
            require(IERC20(order.baseToken).transferFrom(msg.sender, order.trader, fillAmount), "Base transfer failed");
            require(IERC20(order.quoteToken).transfer(msg.sender, quoteAmount), "Quote transfer failed");
        } else {
            require(IERC20(order.quoteToken).transferFrom(msg.sender, order.trader, quoteAmount), "Quote transfer failed");
            require(IERC20(order.baseToken).transfer(msg.sender, fillAmount), "Base transfer failed");
        }

        order.filled += fillAmount;
        if (order.filled == order.amount) {
            order.active = false;
        }

        emit OrderFilled(
            orderId,
            msg.sender,
            fillAmount,
            quoteAmount
        );
    }

    // View functions
    function getOrder(bytes32 orderId) external view returns (
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

    function getBestPrice(address baseToken, address quoteToken, bool isBuy) external view returns (uint256) {
        // Implementation for getting best price based on order book depth
        return 0;
    }

    // Admin functions
    function setMinOrderSize(uint256 _minOrderSize) external onlyOwner {
        minOrderSize = _minOrderSize;
        emit MinOrderSizeUpdated(_minOrderSize);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
