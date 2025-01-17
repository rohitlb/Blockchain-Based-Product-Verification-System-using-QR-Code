// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProductManagement
 * @dev Manages product details with blockchain traceability.
 * @notice Expects data validation and checks to be handled in the backend to minimize on-chain costs.
 */
contract ProductManagement {
    // Struct for storing product details
    struct Product {
        uint256 id;
        string name;
        string manufactureDate;
        string batch;
        bytes32 hash;
    }

    // Mapping from product ID to Product details
    mapping(uint256 => Product) private products;

    // Event emitted when a product is added
    event ProductAdded(
        uint256 indexed productId,
        string name,
        string manufactureDate,
        string batch,
        bytes32 hash
    );

    /**
     * @dev Adds a new product to the blockchain.
     * @param productId Unique ID for the product.
     * @param name Name of the product.
     * @param manufactureDate Manufacture date of the product.
     * @param batch Batch identifier for the product.
     * @param hash Unique hash of the product data.
     * @notice Assumes all data validation is done off-chain to save gas.
     */
    function addProduct(
        uint256 productId,
        string memory name,
        string memory manufactureDate,
        string memory batch,
        bytes32 hash
    ) public {
        require(products[productId].id == 0, "Product ID already exists");

        products[productId] = Product(productId, name, manufactureDate, batch, hash);
        emit ProductAdded(productId, name, manufactureDate, batch, hash);
    }

    /**
     * @dev Retrieves product details by ID.
     * @param productId Unique ID of the product.
     * @return Product details (id, name, manufactureDate, batch, hash).
     */
    function getProduct(uint256 productId)
        public
        view
        returns (
            uint256 id,
            string memory name,
            string memory manufactureDate,
            string memory batch,
            bytes32 hash
        )
    {
        Product memory product = products[productId];
        require(product.id != 0, "Product does not exist");
        return (product.id, product.name, product.manufactureDate, product.batch, product.hash);
    }
}
