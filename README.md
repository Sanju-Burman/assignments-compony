# PortOne Reconciliation Assignment

## 🧪 Stack

- Node.js
- PostgreSQL (I use Docker image)
- .csv / .txt Parsing

## 🛠 Setup Instructions

1. Clone this repo
2. Run Docker PostgreSQL:
   ```bash
   docker compose -f docker-compose.yaml up -d
   ```
3. Create tables:

    ```bash
    docker exec -it postgresDB psql -U admin -d port_one_db postgres
    ```
4. Add .env file:
    ```bash
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=port_one_db
    DB_USER=admin
    DB_PASSWORD=pass
    ```
5. Install Node.js dependencies:

    ```bash
    npm install
    ```
6. Run:

    ```bash
    npm start
    ```
7. Stop docker contanor
    ```bash
    docker stop postgresDB 
    ```
8. Error: "<--- Last few GCs --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----"
    ```bash
    node --max-old-space-size=4096 app.js
    ```
## 📁 File Structure
- /data: Add payment_data.csv and settlement_data.txt here.

- /output: output report appears here.

## 📦 Submission Includes
- Source code
- Output .csv
- SQL schema
- README with assumptions
