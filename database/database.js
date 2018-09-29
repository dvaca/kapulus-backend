var pg = require("pg");

const { Pool } = require('pg')

var config = {
  user: 'postgres',
  database: 'ManageEvents', 
  password: 'postgres123', 
  port: 5432, 
  max: 10, // max number of connection can be open to database
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

const pool = new Pool(config);

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}