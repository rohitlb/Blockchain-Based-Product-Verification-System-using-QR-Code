// Updated server.js with QR Code handling
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import Web3 from 'web3';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

const { Pool } = pg;

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3001; // Default to 3001 if PORT is not set

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

app.use(bodyParser.json());

const web3 = new Web3('https://rpc-amoy.polygon.technology/');
const mfg_abi = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "productId", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "manufactureDate", "type": "string" },
            { "internalType": "string", "name": "batch", "type": "string" },
            { "internalType": "bytes32", "name": "hash", "type": "bytes32" }
        ],
        "name": "addProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "productId", "type": "uint256" }
        ],
        "name": "getProduct",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "bytes32", "name": "", "type": "bytes32" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const mfg_contract_address = process.env.CONTRACT_ADDRESS;
const mfg_contract = new web3.eth.Contract(mfg_abi, mfg_contract_address);
const private_key = process.env.PRIVATE_KEY;
const wallet_address = process.env.WALLET_ADDRESS;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'manufacturer.html'));
});

// Listen to blockchain events
// This code listens for the `ProductAdded` event emitted by the smart contract.
// It logs the event data for traceability and debugging purposes.
mfg_contract.events.ProductAdded({
    fromBlock: 'latest'
}).on('data', (event) => {
    logger.info('ProductAdded event:', event.returnValues);
}).on('error', (error) => {
    logger.error('Error listening to ProductAdded events:', error);
});

// Endpoint to add product and generate QR code
app.post('/api/addProduct', [
    body('productId').isInt().withMessage('Product ID must be an integer'),
    body('name').isString().notEmpty().withMessage('Product name is required'),
    body('manufactureDate').isString().notEmpty().withMessage('Manufacture date is required'),
    body('batch').isString().notEmpty().withMessage('Batch is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { productId, name, manufactureDate, batch } = req.body;
    logger.info(`Received Data: ${productId}, ${name}, ${manufactureDate}, ${batch}`);

    const hashInput = productId + name + manufactureDate + batch;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    try {
        // Construct the transaction data for adding a product
        const transactionData = mfg_contract.methods.addProduct(productId, name, manufactureDate, batch, web3.utils.keccak256(hash)).encodeABI();
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(wallet_address);

        const txObject = {
            to: mfg_contract_address,
            gas: 2000000,
            gasPrice: gasPrice,
            nonce: nonce,
            data: transactionData
        };

        const signedTransaction = await web3.eth.accounts.signTransaction(txObject, private_key);
        const sentTransaction = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        logger.info('Transaction successful:', sentTransaction);

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(hash);

        // Insert the product data into the PostgreSQL database
        const insertQuery = `INSERT INTO product_data (product_id, product_name, product_m_date, product_batch, product_hash, qr_code) VALUES ($1, $2, $3, $4, $5, $6)`;
        const insertValues = [productId, name, manufactureDate, batch, hash, qrCodeDataUrl];

        await pool.query(insertQuery, insertValues);
        logger.info('Data inserted into PostgreSQL successfully');

        res.json({ message: 'Data processed successfully', qrCode: qrCodeDataUrl });
    } catch (error) {
        logger.error('Error processing data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to scan and validate QR code
app.post('/api/verifyQR', async (req, res) => {
    const { productId, qrCode } = req.body;

    if (!productId || !qrCode) {
        return res.status(400).json({ message: 'Product ID and QR Code are required.' });
    }

    try {
        const query = 'SELECT product_hash FROM product_data WHERE product_id = $1';
        const result = await pool.query(query, [productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const dbHash = result.rows[0].product_hash;
        const decodedQR = qrCode.split(',')[1]; // Extract Base64 content
        const decodedHash = Buffer.from(decodedQR, 'base64').toString('utf-8');

        if (decodedHash === dbHash) {
            res.json({ message: 'QR Code is valid and matches the product.' });
        } else {
            res.status(400).json({ message: 'QR Code does not match the product.' });
        }
    } catch (error) {
        logger.error('Error verifying QR Code:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});
