// contracts/core/interfaces/ILimitOrderBook.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILimitOrderBook {
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed trader,
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    );

    event OrderCancelled(bytes32 indexed orderId);

    event OrderFilled(
        bytes32 indexed orderId,
        address indexed filler,
        uint256 fillAmount,
        uint256 quoteAmount
    );

    event MinOrderSizeUpdated(uint256 newSize);

    function createOrder(
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) external returns (bytes32);

    function cancelOrder(bytes32 orderId) external;

    function fillOrder(bytes32 orderId, uint256 fillAmount) external;

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
    );

    function getBestPrice(address baseToken, address quoteToken, bool isBuy) external view returns (uint256);
}
