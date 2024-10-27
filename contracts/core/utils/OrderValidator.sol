// contracts/core/utils/OrderValidator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IOrderValidator.sol";
import "../libraries/ValidationLib.sol";
import "./PriceOracle.sol";

contract OrderValidator is IOrderValidator, Ownable, Pausable {
    using ValidationLib for uint256;
    using ValidationLib for address;

    // State variables
    uint256 public minOrderSize;
    uint256 public maxOrderSize;
    uint256 public maxPriceDeviation;
    PriceOracle public priceOracle;

    // Mappings for validation
    mapping(address => bool) public validTokens;
    mapping(address => bool) public validTraders;
    mapping(address => mapping(address => bool)) public validPairs;

    // Constants
    uint256 private constant PRECISION = 1e18;
    uint256 private constant MAX_DEVIATION_BASIS_POINTS = 1000; // 10%

    constructor(
        address _priceOracle,
        uint256 _minOrderSize,
        uint256 _maxOrderSize,
        uint256 _maxPriceDeviation
    ) {
        require(_priceOracle.isNonZeroAddress(), "Invalid oracle address");
        priceOracle = PriceOracle(_priceOracle);
        minOrderSize = _minOrderSize;
        maxOrderSize = _maxOrderSize;
        maxPriceDeviation = _maxPriceDeviation;
    }

    // Main validation functions
    function validateOrder(
        ValidationParams calldata params
    ) external view override returns (ValidationCode code, string memory reason) {
        // Basic parameter validation
        if (!params.trader.isNonZeroAddress()) {
            return (ValidationCode.InvalidTrader, "Invalid trader address");
        }

        // Token validation
        (bool tokensValid, string memory tokenReason) = validateTokenPair(
            params.baseToken,
            params.quoteToken
        );
        if (!tokensValid) {
            return (ValidationCode.InvalidToken, tokenReason);
        }

        // Order size validation
        (bool sizeValid, string memory sizeReason) = validateOrderSize(
            params.amount,
            params.price
        );
        if (!sizeValid) {
            return (ValidationCode.InvalidAmount, sizeReason);
        }

        // Price validation
        (bool priceValid, string memory priceReason) = validatePrice(
            params.baseToken,
            params.quoteToken,
            params.price,
            params.isBuy
        );
        if (!priceValid) {
            return (ValidationCode.InvalidPrice, priceReason);
        }

        // Trader funds validation
        (bool fundsValid, string memory fundsReason) = validateTraderFunds(
            params.trader,
            params.isBuy ? params.quoteToken : params.baseToken,
            params.isBuy ? params.amount.calculateOrderValue(params.price) : params.amount
        );
        if (!fundsValid) {
            return (ValidationCode.InsufficientBalance, fundsReason);
        }

        // Deadline validation
        if (params.deadline > 0 && block.timestamp > params.deadline) {
            return (ValidationCode.ExpiredOrder, "Order expired");
        }

        // Signature validation if provided
        if (params.signature.length > 0) {
            (bool sigValid, string memory sigReason) = validateSignature(params);
            if (!sigValid) {
                return (ValidationCode.InvalidSignature, sigReason);
            }
        }

        return (ValidationCode.Valid, "Order is valid");
    }

    function validateOrderBatch(
        ValidationParams[] calldata paramsArray
    ) external view override returns (ValidationCode[] memory codes, string[] memory reasons) {
        codes = new ValidationCode[](paramsArray.length);
        reasons = new string[](paramsArray.length);

        for (uint256 i = 0; i < paramsArray.length; i++) {
            (codes[i], reasons[i]) = validateOrder(paramsArray[i]);
        }

        return (codes, reasons);
    }

    function validateTokenPair(
        address baseToken,
        address quoteToken
    ) public view override returns (bool isValid, string memory reason) {
        if (!validTokens[baseToken] || !validTokens[quoteToken]) {
            return (false, "Invalid token");
        }

        if (!validPairs[baseToken][quoteToken]) {
            return (false, "Invalid trading pair");
        }

        return (true, "Valid pair");
    }

    function validateOrderSize(
        uint256 amount,
        uint256 price
    ) public view override returns (bool isValid, string memory reason) {
        return amount.validateOrderSize(price, minOrderSize, maxOrderSize);
    }

    function validatePrice(
        address baseToken,
        address quoteToken,
        uint256 price,
        bool isBuy
    ) public view override returns (bool isValid, string memory reason) {
        uint256 oraclePrice = priceOracle.getPrice(baseToken, quoteToken);
        if (oraclePrice == 0) {
            return (false, "No oracle price");
        }

        return price.validatePriceDeviation(oraclePrice, maxPriceDeviation);
    }

    function validateTraderFunds(
        address trader,
        address token,
        uint256 amount
    ) public view override returns (bool isValid, string memory reason) {
        IERC20 tokenContract = IERC20(token);

        if (tokenContract.balanceOf(trader) < amount) {
            return (false, "Insufficient balance");
        }

        if (tokenContract.allowance(trader, address(this)) < amount) {
            return (false, "Insufficient allowance");
        }

        return (true, "Sufficient funds");
    }

    function validateSignature(
        ValidationParams calldata params
    ) public pure override returns (bool isValid, string memory reason) {
        // Implement signature validation logic
        return (true, "Valid signature");
    }

    function validateTrader(
        address trader
    ) public view override returns (bool isValid, string memory reason) {
        if (!validTraders[trader]) {
            return (false, "Trader not whitelisted");
        }
        return (true, "Valid trader");
    }

    function validateCustomParameters(
        ValidationParams calldata params
    ) public pure override returns (bool isValid, string memory reason) {
        // Implement custom validation logic
        if (params.extraData.length > 0) {
            // Custom validation logic here
        }
        return (true, "Valid parameters");
    }

    // Admin functions
    function setValidationParameters(
        uint256 _minSize,
        uint256 _maxSize,
        uint256 _maxDeviation
    ) external override onlyOwner {
        require(_minSize > 0 && _maxSize > _minSize, "Invalid sizes");
        require(_maxDeviation <= MAX_DEVIATION_BASIS_POINTS, "Deviation too high");

        minOrderSize = _minSize;
        maxOrderSize = _maxSize;
        maxPriceDeviation = _maxDeviation;

        emit ValidationParamsUpdated(_minSize, _maxSize, _maxDeviation);
    }

    function setTokenValidation(
        address token,
        bool isValid
    ) external override onlyOwner {
        require(token.isNonZeroAddress(), "Invalid token address");
        validTokens[token] = isValid;
        emit TokenValidationUpdated(token, isValid);
    }

    function setTraderValidation(
        address trader,
        bool isValid
    ) external override onlyOwner {
        require(trader.isNonZeroAddress(), "Invalid trader address");
        validTraders[trader] = isValid;
        emit TraderValidationUpdated(trader, isValid);
    }

    // View functions
    function getValidationParameters() external view override returns (
        uint256,
        uint256,
        uint256
    ) {
        return (minOrderSize, maxOrderSize, maxPriceDeviation);
    }

    function isTokenValid(address token) external view override returns (bool) {
        return validTokens[token];
    }

    function isTraderValid(address trader) external view override returns (bool) {
        return validTraders[trader];
    }
}