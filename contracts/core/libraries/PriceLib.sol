// contracts/core/libraries/PriceLib.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library PriceLib {
    uint256 constant PRECISION = 1e18;

    function mulPrice(uint256 amount, uint256 price) internal pure returns (uint256) {
        return (amount * price) / PRECISION;
    }

    function divPrice(uint256 amount, uint256 price) internal pure returns (uint256) {
        require(price > 0, "Division by zero");
        return (amount * PRECISION) / price;
    }
}
