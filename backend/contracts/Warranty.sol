// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Contract For minting warranties as NFTs
/// @author Yash Kumar
/// @custom:experimental This is an experimental contract.
contract Warranty is ERC721 {
    uint256 public tokenCounter;

    constructor() ERC721("Warranty", "WAR") {
        tokenCounter = 0;
    }

    struct Certificate {
        string brandName;
        string product;
        string category;
        uint256 price; // in dollars
        uint256 warrantyPeriod; // in months
        uint256 certificateId;
        uint256 creationTime;
        address sellerAddress;
        address buyerAddress;
        string description;
    }

    mapping(uint256 => Certificate) public idToCertificateMapping;

    /// @notice Emitted when a new warranty certificate is created
    event WarrantyCreated(
        uint256 certificateId,
        string productName,
        address seller,
        address buyer,
        string brandName,
        uint256 price,
        uint256 warrantyPeriod,
        uint256 creationTime
    );

    /// @notice Creates a new warranty certificate
    /// @param _brandName Brand of the product
    /// @param _productName Name of the product
    /// @param _category Category of the product
    /// @param _price Price of the product in dollars
    /// @param _warrantyPeriod Warranty duration in months
    /// @param _buyerAddress Address of the buyer
    /// @param _description Description of the product
    /// @return certificateId Unique ID of the created certificate
    function createWarrantyCertificate(
        string memory _brandName,
        string memory _productName,
        string memory _category,
        uint256 _price,
        uint256 _warrantyPeriod,
        address _buyerAddress,
        string memory _description
    ) public returns (uint256) {
        require(bytes(_brandName).length > 0, "Brand name cannot be empty");
        require(_warrantyPeriod > 0, "Warranty period must be positive");
        require(_price > 0, "Price must be positive");
        require(bytes(_productName).length > 0, "Product name cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_buyerAddress != address(0), "Buyer address cannot be zero");

        uint256 newCertificateId = tokenCounter;

        Certificate memory newCertificate = Certificate(
            _brandName,
            _productName,
            _category,
            _price,
            _warrantyPeriod,
            newCertificateId,
            block.timestamp,
            msg.sender,
            _buyerAddress,
            _description
        );

        _safeMint(msg.sender, newCertificateId);
        idToCertificateMapping[newCertificateId] = newCertificate;

        emit WarrantyCreated(
            newCertificateId,
            _productName,
            msg.sender,
            _buyerAddress,
            _brandName,
            _price,
            _warrantyPeriod,
            block.timestamp
        );

        tokenCounter++;
        return newCertificateId;
    }

    /// @notice Retrieves information about a specific warranty certificate
    /// @return Certificate struct containing certificate details
    function getCertificateInfo(
        uint256 _certificateId
    ) public view returns (Certificate memory) {
        return idToCertificateMapping[_certificateId];
    }

    /// @notice Checks if a warranty is still valid
    /// @return True if the warranty is valid, otherwise false
    function isWarrantyValid(
        uint256 _certificateId
    ) public view returns (bool) {
        require(_certificateId < tokenCounter, "Certificate does not exist.");
        Certificate memory cert = idToCertificateMapping[_certificateId];
        uint256 warrantyInSeconds = cert.warrantyPeriod * 30 * 24 * 60 * 60; // converting months into seconds, assuming one month is 30 days
        return (block.timestamp <= cert.creationTime + warrantyInSeconds);
    }
}
