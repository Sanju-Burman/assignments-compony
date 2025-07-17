// settlements.js
const fs = require('fs');
const readline = require('readline');
const pool = require('../config/db');

const settlements = (filePath) => {
    return new Promise((resolve, reject) => {
        const batchSize = 1000;
        let headers = [];
        let isHeader = true;
        const orderMap = new Map();
        console.log('settlement start.');

        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity,
        });

        rl.on('line', line => {
            const cols = line.split('\t');
            if (cols.length < 2) return;

            if (isHeader) {
                headers = cols.map(h => h.trim());
                isHeader = false;
                return;
            }

            const row = {};
            headers.forEach((h, i) => row[h] = cols[i]);

            const orderId = row['order-id']?.trim().toLowerCase();;
            const amount = parseFloat(row['amount']);
            if (!orderId || isNaN(amount)) return;

            if (!orderMap.has(orderId)) orderMap.set(orderId, { total: 0, rows: [] });
            const order = orderMap.get(orderId);
            order.total += amount;
            order.rows.push(row);
        });

        rl.on('close', async () => {
            const entries = Array.from(orderMap.entries());
            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = entries.slice(i, i + batchSize);
                const query = `
          INSERT INTO records (source, order_id, total_amount, raw_data)
          VALUES ${batch.map((_, j) => `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`).join(',')}
        `;
                const values = batch.flatMap(([orderId, data]) => ['settlements', orderId, data.total, JSON.stringify(data.rows)]);
                await pool.query(query, values);
            }
            console.log('settlements data ingested done.');
            resolve();
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
}
module.exports = settlements;
