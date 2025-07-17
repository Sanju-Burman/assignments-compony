// outputeReport.js
const fs = require('fs');
const pool = require('../config/db');

// creating indexing
async function createIndexes() {
  await pool.query(`create index if not exists idx_order_id_source ON records(order_id, source)`);
  console.log('Index created on (order_id, source) done.');
}
const outputReport = async (filePath) => {
  // await createIndexes();
  return new Promise(async (resolve, reject) => {
    try {
      // Clean up old data
      await pool.query(`DELETE FROM reconciled_records`);

      const fetchQuery = `
    SELECT
      p.id AS payments_id,
      s.id AS settlements_id,
      p.order_id,
      p.total_amount AS payments_total,
      s.total_amount AS settlements_total,
      ABS(p.total_amount - s.total_amount) AS difference
    FROM
      records p
    JOIN
      records s ON p.order_id = s.order_id
    WHERE
      p.source = 'payments' AND s.source = 'settlements';
  `;

      const { rows } = await pool.query(fetchQuery);

      // Insert into reconciled_records
      for (const row of rows) {
        await pool.query(
          `INSERT INTO reconciled_records (payments_record_id, settlements_record_id, amount_difference)
       VALUES ($1, $2, $3)`,
          [row.payments_id, row.settlements_id, row.difference]
        );
      }

      // Export report from reconciled_records
      const reportQuery = `
    SELECT
      p.order_id,
      CASE WHEN ABS(p.total_amount - s.total_amount) < 0.01 THEN 'reconciled' ELSE 'unreconciled' END AS status,
      p.total_amount AS payments_total,
      s.total_amount AS settlements_total,
      r.amount_difference AS difference
    FROM
      reconciled_records r
    JOIN records p ON p.id = r.payments_record_id
    JOIN records s ON s.id = r.settlements_record_id;
  `;

      const reportRows = await pool.query(reportQuery);

      const header = 'order_id,status,payments_total,settlements_total,difference\n';
      const csv = reportRows.rows.map(row => (
        `${row.order_id},${row.status},${row.payments_total},${row.settlements_total},${row.difference}`
      )).join('\n');

      fs.writeFileSync(filePath, header + csv);
      console.log(`Report exported to ${filePath}`);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { outputReport, createIndexes };
