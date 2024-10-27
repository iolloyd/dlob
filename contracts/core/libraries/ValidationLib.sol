// contracts/libraries/ValidationLib.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library ValidationLib {
    uint256 private constant PRECISION = 1e18;

    function isNonZeroAddress(address addr) internal pure returns (bool) {
        return addr != address(0);
    }

    function calculateOrderValue(uint256 amount, uint256 price) internal pure returns (uint256) {
        return (amount * price) / PRECISION;
    }

    function validateOrderSize(
        uint256 amount,
        uint256 price,
        uint256 minSize,
        uint256 maxSize
    ) internal pure returns (bool isValid, string memory reason) {
        uint256 orderSize = (amount * price) / PRECISION;

        if (orderSize < minSize) {
            return (false, "Order too small");
        }

        if (orderSize > maxSize) {
            return (false, "Order too large");
        }

        return (true, "Valid size");
    }

    function validatePriceDeviation(
        uint256 price,
        uint256 oraclePrice,
        uint256 maxDeviation
    ) internal pure returns (bool isValid, string memory reason) {
        uint256 deviation;
        if (price > oraclePrice) {
            deviation = ((price - oraclePrice) * PRECISION) / oraclePrice;
        } else {
            deviation = ((oraclePrice - price) * PRECISION) / oraclePrice;
        }

        if (deviation > maxDeviation) {
            return (false, "Price deviation too high");
        }

        return (true, "Valid price");
    }
}