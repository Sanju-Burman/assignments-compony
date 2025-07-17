const fs = require('fs');
const readline = require('readline');
const { PassThrough } = require('stream');
const csv = require('csv-parser');
const pool = require('../config/db');

module.exports = function payments(filePath) {
    return new Promise((resolve, reject) => {
        const batchSize = 1000;
        let batch = [];
        let linesToSkip = 7;
        let actualCsvStream = new PassThrough();

        const insertBatch = async () => {
            if (batch.length === 0) return;
            const query = `
                INSERT INTO records (source, order_id, total_amount, raw_data)
                VALUES ${batch.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(',')}
            `;
            const values = batch.flatMap(r => [r.source, r.order_id, r.total_amount, r.raw_data]);
            await pool.query(query, values);
            batch = [];
        };

        // Skip first 6 lines, stream rest to csv-parser
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity,
        });

        let currentLine = 0;
        rl.on('line', (line) => {
            currentLine++;
            if (currentLine <= linesToSkip) return;
            actualCsvStream.write(line + '\n');
        });

        rl.on('close', () => {
            actualCsvStream.end();
        });

        (async () => {
            await pool.query(`DELETE FROM records`);
            // console.log('Old records deleted.');
        })();

        // console.log('Starting payments import...');

        // Parse the clean CSV stream
        let csvLine = 0;

        actualCsvStream
            .pipe(csv())
            // .on('headers', (headers) => {
            //     console.log('Headers:', headers);
            // })
            .on('data', (row) => {
                csvLine++;

                const orderIdRaw = row['order id'];
                const totalRaw = row['total'];

                if (!orderIdRaw || !totalRaw) return;

                const orderId = orderIdRaw.trim().toLowerCase();
                const total = parseFloat(totalRaw);

                if (!orderId || isNaN(total)) return;

                batch.push({
                    source: 'payments',
                    order_id: orderId,
                    total_amount: total,
                    raw_data: row,
                });

                if (batch.length >= batchSize) {
                    actualCsvStream.pause();
                    insertBatch().then(() => actualCsvStream.resume());
                }
            })
            .on('end', async () => {
                await insertBatch();
                // console.log('Payments data ingested done.');
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};
