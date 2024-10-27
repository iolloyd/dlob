// contracts/core/utils/PriceOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PriceOracle is Ownable, Pausable {
    using SafeMath for uint256;

    // Structs
    struct Price {
        uint256 price;
        uint256 timestamp;
        uint256 confidence;
    }

    struct PriceSource {
        address source;
        uint256 weight;
        bool isActive;
    }

    // State variables
    mapping(address => mapping(address => Price)) public prices; // baseToken => quoteToken => Price
    mapping(address => mapping(address => PriceSource[])) public priceSources;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public maxPriceAge = 1 hours;
    uint256 public minConfidence = 80; // 80%
    
    // Events
    event PriceUpdated(
        address indexed baseToken,
        address indexed quoteToken,
        uint256 price,
        uint256 confidence
    );

    event PriceSourceAdded(
        address indexed baseToken,
        address indexed quoteToken,
        address source,
        uint256 weight
    );

    event PriceSourceRemoved(
        address indexed baseToken,
        address indexed quoteToken,
        address source
    );

    event MaxPriceAgeUpdated(uint256 newMaxAge);
    event MinConfidenceUpdated(uint256 newMinConfidence);

    constructor(uint256 _maxPriceAge, uint256 _minConfidence) {
        maxPriceAge = _maxPriceAge;
        minConfidence = _minConfidence;
    }

    // Main functions
    function getPrice(address baseToken, address quoteToken) external view returns (uint256) {
        Price memory price = prices[baseToken][quoteToken];
        require(_isPriceValid(price), "Invalid price");
        return price.price;
    }

    function getPriceWithConfidence(
        address baseToken,
        address quoteToken
    ) external view returns (uint256 price, uint256 confidence) {
        Price memory priceData = prices[baseToken][quoteToken];
        require(_isPriceValid(priceData), "Invalid price");
        return (priceData.price, priceData.confidence);
    }

    function updatePrice(
        address baseToken,
        address quoteToken,
        uint256 newPrice,
        uint256 confidence
    ) external whenNotPaused {
        require(_isPriceSource(baseToken, quoteToken, msg.sender), "Unauthorized source");
        require(confidence >= minConfidence, "Confidence too low");
        require(newPrice > 0, "Invalid price");

        prices[baseToken][quoteToken] = Price({
            price: newPrice,
            timestamp: block.timestamp,
            confidence: confidence
        });

        emit PriceUpdated(baseToken, quoteToken, newPrice, confidence);
    }

    function updatePriceFromMultipleSources(
        address baseToken,
        address quoteToken,
        uint256[] calldata newPrices,
        uint256[] calldata confidences
    ) external whenNotPaused {
        require(newPrices.length > 0, "No prices provided");
        require(newPrices.length == confidences.length, "Array length mismatch");

        uint256 weightedPrice;
        uint256 totalWeight;
        uint256 weightedConfidence;

        PriceSource[] memory sources = priceSources[baseToken][quoteToken];
        require(sources.length == newPrices.length, "Source count mismatch");

        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].isActive) {
                weightedPrice = weightedPrice.add(
                    newPrices[i].mul(sources[i].weight)
                );
                weightedConfidence = weightedConfidence.add(
                    confidences[i].mul(sources[i].weight)
                );
                totalWeight = totalWeight.add(sources[i].weight);
            }
        }

        require(totalWeight > 0, "No active sources");

        uint256 finalPrice = weightedPrice.div(totalWeight);
        uint256 finalConfidence = weightedConfidence.div(totalWeight);

        require(finalConfidence >= minConfidence, "Aggregate confidence too low");

        prices[baseToken][quoteToken] = Price({
            price: finalPrice,
            timestamp: block.timestamp,
            confidence: finalConfidence
        });

        emit PriceUpdated(baseToken, quoteToken, finalPrice, finalConfidence);
    }

    // Admin functions
    function addPriceSource(
        address baseToken,
        address quoteToken,
        address source,
        uint256 weight
    ) external onlyOwner {
        require(source != address(0), "Invalid source");
        require(weight > 0, "Invalid weight");

        PriceSource[] storage sources = priceSources[baseToken][quoteToken];
        for (uint256 i = 0; i < sources.length; i++) {
            require(sources[i].source != source, "Source already exists");
        }

        sources.push(PriceSource({
            source: source,
            weight: weight,
            isActive: true
        }));

        emit PriceSourceAdded(baseToken, quoteToken, source, weight);
    }

    function removePriceSource(
        address baseToken,
        address quoteToken,
        address source
    ) external onlyOwner {
        PriceSource[] storage sources = priceSources[baseToken][quoteToken];
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].source == source) {
                sources[i].isActive = false;
                emit PriceSourceRemoved(baseToken, quoteToken, source);
                return;
            }
        }
        revert("Source not found");
    }

    function setMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0, "Invalid max age");
        maxPriceAge = newMaxAge;
        emit MaxPriceAgeUpdated(newMaxAge);
    }

    function setMinConfidence(uint256 newMinConfidence) external on
