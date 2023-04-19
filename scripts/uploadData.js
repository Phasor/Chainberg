const TreasuryData = require('../models/TreasuryData.js');
const csv = require('fast-csv'); // parses CSV files
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const main = async () => {
    // connect to db
    const mongoose = require('mongoose');
    const mongoDB = process.env.MONGO_URI;
    mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));

    // read csv file
    const rows = [];
    fs.createReadStream(path.join(__dirname, '../treasury_data.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', function (data) {
        // Convert date string (dd/mm/yyyy) to a Date object
        const [day, month, year] = data['DATE'].split('/');
        const dateObj = new Date(year, month - 1, day);
      
        // Rename columns to match the TreasuryData schema and set the date object
        const rowData = {
          _id: new mongoose.Types.ObjectId(),
          date: dateObj,
          two_year_yield: parseFloat(data['two_year_yield']),
          ten_year_yield: parseFloat(data['ten_year_yield']),
        };
      
        rows.push(rowData);
      })      
    .on('end', function(){
        // insert posts into db
        TreasuryData.insertMany(rows).then(() => {
            console.log(`${rows.length} + rows have been successfully uploaded.`);
            return;
        }).catch((error) => {
            console.error(error);
        });
    });
};

main().catch((error) => {
    console.error(error);
    process.exit();
  });