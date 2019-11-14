var pg = require("pg");

const { Pool } = require('pg')

var config = {

  //CONFIGURACION BD GRATUITA
  //host: 'ec2-50-16-196-57.compute-1.amazonaws.com',
  //user: 'klpsdnbujsrqfh',
  //database: 'd7tjn0c1k927pq', 
  //password: '32069e24b8717feceb9544868a8615ce18bb93cafab653fd910da71e034236fc', 
  //CONFIGURACION BD PRODUCCION
   host: 'ec2-107-20-183-142.compute-1.amazonaws.com',
   user: 'wzthfhkxjnbqxv',
   database: 'dfu1a982rcvbsi',
   password: '1dae3a7664678a13a1ccda3a93191cfd1ead93d2cbc99034efd65433e8962c8c',

  //BASE DE DATOS DE DESARROLLO
  //host: '127.0.0.1',
  //user: 'kapulus',
  //database: 'kapulus',
  //password: 'kapulus',
  //port: 5432,
  //max: 10, // max number of connection can be open to database
  //idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed


};

const pool = new Pool(config);

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}