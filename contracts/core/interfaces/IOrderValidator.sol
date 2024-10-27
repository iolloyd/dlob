// contracts/core/interfaces/IOrderValidator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IOrderValidator {
    /// @dev Struct to hold validation parameters
    struct ValidationParams {
        address trader;
        address baseToken;
        address quoteToken;
        uint256 amount;
        uint256 price;
        bool isBuy;
        uint256 deadline;        // Optional deadline for order validity
        bytes signature;         // Optional signature for signed orders
        bytes extraData;         // Optional data for custom validation logic
    }

    /// @dev Validation error codes
    enum ValidationCode {
        Valid,                  // Order is valid
        InvalidToken,           // Invalid token address
        InsufficientBalance,    // Insufficient token balance
        InsufficientAllowance,  // Insufficient token allowance
        InvalidAmount,          // Invalid order amount
        InvalidPrice,           // Invalid order price
        ExpiredOrder,           // Order has expired
        InvalidSignature,       // Invalid signature
        InvalidTrader,          // Invalid trader address
        CustomError            // Custom validation error
    }

    /// @dev Event emitted when validation parameters are updated
    event ValidationParamsUpdated(
        uint256 minOrderSize,
        uint256 maxOrderSize,
        uint256 maxPriceDeviation
    );

    /// @dev Event emitted when a token is blacklisted/whitelisted
    event TokenValidationUpdated(
        address indexed token,
        bool isValid
    );

    /// @dev Event emitted when a trader is blacklisted/whitelisted
    event TraderValidationUpdated(
        address indexed trader,
        bool isValid
    );

    /// @dev Main validation function for orders
    /// @param params The order validation parameters
    /// @return code The validation result code
    /// @return reason A string explaining the validation result
    function validateOrder(
        ValidationParams calldata params
    ) external view returns (ValidationCode code, string memory reason);

    /// @dev Validates multiple orders in a batch
    /// @param paramsArray Array of validation parameters
    /// @return codes Array of validation result codes
    /// @return reasons Array of validation result reasons
    function validateOrderBatch(
        ValidationParams[] calldata paramsArray
    ) external view returns (ValidationCode[] memory codes, string[] memory reasons);

    /// @dev Validates token pairs for trading
    /// @param baseToken The base token address
    /// @param quoteToken The quote token address
    /// @return isValid Whether the token pair is valid
    /// @return reason Reason if invalid
    function validateTokenPair(
        address baseToken,
        address quoteToken
    ) external view returns (bool isValid, string memory reason);

    /// @dev Validates order size against minimum and maximum limits
    /// @param amount The order amount
    /// @param price The order price
    /// @return isValid Whether the order size is valid
    /// @return reason Reason if invalid
    function validateOrderSize(
        uint256 amount,
        uint256 price
    ) external view returns (bool isValid, string memory reason);

    /// @dev Validates order price against market price and allowed deviation
    /// @param baseToken The base token address
    /// @param quoteToken The quote token address
    /// @param price The order price
    /// @param isBuy Whether it's a buy order
    /// @return isValid Whether the price is valid
    /// @return reason Reason if invalid
    function validatePrice(
        address baseToken,
        address quoteToken,
        uint256 price,
        bool isBuy
    ) external view returns (bool isValid, string memory reason);

    /// @dev Validates trader's balance and allowance
    /// @param trader The trader's address
    /// @param token The token address
    /// @param amount The amount to validate
    /// @return isValid Whether the trader has sufficient balance and allowance
    /// @return reason Reason if invalid
    function validateTraderFunds(
        address trader,
        address token,
        uint256 amount
    ) external view returns (bool isValid, string memory reason);

    /// @dev Validates order signature if required
    /// @param params The validation parameters containing the signature
    /// @return isValid Whether the signature is valid
    /// @return reason Reason if invalid
    function validateSignature(
        ValidationParams calldata params
    ) external view returns (bool isValid, string memory reason);

    /// @dev Checks if a trader is allowed to trade
    /// @param trader The trader's address
    /// @return isValid Whether the trader is allowed to trade
    /// @return reason Reason if invalid
    function validateTrader(
        address trader
    ) external view returns (bool isValid, string memory reason);

    /// @dev Validates custom order parameters
    /// @param params The validation parameters
    /// @return isValid Whether the custom parameters are valid
    /// @return reason Reason if invalid
    function validateCustomParameters(
        ValidationParams calldata params
    ) external view returns (bool isValid, string memory reason);

    // Admin functions

    /// @dev Sets minimum and maximum order sizes and price deviation limits
    /// @param minSize Minimum order size
    /// @param maxSize Maximum order size
    /// @param maxDeviation Maximum allowed price deviation
    function setValidationParameters(
        uint256 minSize,
        uint256 maxSize,
        uint256 maxDeviation
    ) external;

    /// @dev Updates token validation status
    /// @param token Token address
    /// @param isValid Whether the token is valid
    function setTokenValidation(
        address token,
        bool isValid
    ) external;

    /// @dev Updates trader validation status
    /// @param trader Trader address
    /// @param isValid Whether the trader is valid
    function setTraderValidation(
        address trader,
        bool isValid
    ) external;

    /// @dev Gets the current validation parameters
    /// @return minSize Minimum order size
    /// @return maxSize Maximum order size
    /// @return maxDeviation Maximum price deviation
    function getValidationParameters() external view returns (
        uint256 minSize,
        uint256 maxSize,
        uint256 maxDeviation
    );

    /// @dev Checks if a token is valid for trading
    /// @param token Token address
    /// @return isValid Whether the token is valid
    function isTokenValid(address token) external view returns (bool isValid);

    /// @dev Checks if a trader is valid
    /// @param trader Trader address
    /// @return isValid Whether the trader is valid
    function isTraderValid(address trader) external view returns (bool isValid);
}
