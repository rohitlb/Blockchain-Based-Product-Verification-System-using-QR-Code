# Product Management Backend

This project is a product management backend service that includes blockchain integration and a PostgreSQL database. The backend is built with Node.js and Express, and it provides REST API endpoints for managing product data, including the generation and verification of QR codes.

## Features
- Add product information to a blockchain-based system.
- Generate QR codes for each product.
- Verify QR codes against stored data.
- Store and retrieve product details from a PostgreSQL database.

## Prerequisites
- **Node.js**: Version 16 or higher.
- **PostgreSQL**: Version 12 or higher.
- **Environment Variables**: Set up a `.env` file with the following values:
  ```
  PORT=3001
  DB_USER=your_database_user
  DB_HOST=your_database_host
  DB_NAME=your_database_name
  DB_PASSWORD=your_database_password
  DB_PORT=5432
  CONTRACT_ADDRESS=your_contract_address
  PRIVATE_KEY=your_private_key
  WALLET_ADDRESS=your_wallet_address
  ```

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sanket-phadtare/Blockchain-Based-Product-Verification-System-using-QR-Code.git
cd Blockchain-Based-Product-Verification-System-using-QR-Code
```

### 2. Install Dependencies
```bash
npm install

or

yarn
```

### 3. Set Up the Database
- Ensure PostgreSQL is running.
- Run the following SQL file to set up the database schema:
  ```sql
  -- product_data.sql
  CREATE TABLE product_data (
      product_id SERIAL PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      product_m_date VARCHAR(50),
      product_batch VARCHAR(50),
      product_hash TEXT,
      qr_code TEXT
  );
  ```

### 4. Add Your Environment Variables
- Create a `.env` file in the project root and populate it with the necessary credentials and blockchain details.

### 5. Start the Project
- **Development Mode**: Uses `nodemon` for automatic restarts:
  ```bash
  npm run dev
  ```

- **Production Mode**: Runs the server without automatic restarts:
  ```bash
  npm start
  ```

## API Endpoints

### POST `/api/addProduct`
**Description:** Add a new product and generate a QR code.  
**Request Body:**
```json
{
  "productId": 123,
  "name": "Sample Product",
  "manufactureDate": "2025-01-01",
  "batch": "Batch001"
}
```
**Response:**
```json
{
  "message": "Data processed successfully",
  "qrCode": "data:image/png;base64,iVBOR..."
}
```

### POST `/api/verifyQR`
**Description:** Verify a QR code against stored data.  
**Request Body:**
```json
{
  "productId": 123,
  "qrCode": "data:image/png;base64,iVBOR..."
}
```
**Response (Valid QR Code):**
```json
{
  "message": "QR Code is valid and matches the product."
}
```
**Response (Invalid QR Code):**
```json
{
  "message": "QR Code does not match the product."
}
```

## Folder Structure
- **server.js**: Entry point of the application.
- **.env**: Environment variables.
- **package.json**: Project metadata and scripts.
- **product_data.sql**: Database schema.

## Troubleshooting
- **Database Connection Errors:** Ensure PostgreSQL is running and the `.env` file has the correct credentials.
- **Blockchain Event Listener Issues:** Verify that the contract address and private key in `.env` are correct.

---
Standard structure for a task could be like

project-root/
  |-- .env
  |-- .gitignore
  |-- package.json
  |-- yarn.lock
  |-- README.md
  |-- src/
      |-- server.js
      |-- manufacturer.html
      |-- Thunder_Client_Usage_Guide.txt - Or any other documentation/reference. Note: It's temporary.
  |-- contracts/
      |-- PD.sol
  |-- db/
      |-- product_data.sql
  |-- docs/
      |-- Document.pdf
