// app.js
const pool = require("./config/db.js");
const payments = require("./src/payments.js");
const settlements = require("./src/settlements.js");
const { outputReport, createIndexes } = require("./src/outputReport.js");

console.log("running....");

async function reporting() {
    // for creating records and reconciled_records table
    // first time only

    // await pool.query(`create table records(
    //     id SERIAL PRIMARY KEY,
    //     source TEXT NOT NULL,
    //     order_id TEXT NOT NULL,
    //     date TIMESTAMP DEFAULT NOW(),
    //     total_amount NUMERIC NOT NULL,
    //     raw_data JSONB)`);
    // await pool.query(`create table reconciled_records (
    //     id SERIAL PRIMARY KEY,
    //     payments_record_id INTEGER REFERENCES records(id),
    //     settlements_record_id INTEGER REFERENCES records(id),
    //     amount_difference NUMERIC)`);
    try {
        
        console.log("Proccess start");
        await payments('./data/payment_data.csv');
        await settlements('./data/settlement_data.txt');
        await createIndexes();
        await outputReport('./output/report.csv')
        console.log("Proccess end");
    } catch (error) {
        console.error("Error occurred: ",error)
    }
}
reporting();