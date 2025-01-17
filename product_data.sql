
CREATE TABLE product_data (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_m_date VARCHAR(50),
    product_batch VARCHAR(50),
    product_hash TEXT,
    qr_code TEXT
);
