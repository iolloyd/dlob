// contracts/core/libraries/OrderLib.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library OrderLib {
    struct Order {
        address trader;
        address baseToken;
        address quoteToken;
        uint256 amount;
        uint256 price;
        bool isBuy;
        uint256 timestamp;
        uint256 filled;
        bool active;
    }

    function generateOrderId(
        address trader,
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                trader,
                baseToken,
                quoteToken,
                amount,
                price,
                isBuy,
                block.timestamp
            )
        );
    }

    function isValidOrder(Order memory order) internal pure returns (bool) {
        return order.trader != address(0) &&
               order.baseToken != address(0) &&
               order.quoteToken != address(0) &&
               order.amount > 0 &&
               order.price > 0;
    }
}
