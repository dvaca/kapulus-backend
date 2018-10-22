var pg = require("pg");

const { Pool } = require('pg')

var config = {
	
  //CONFIGURACION BD GRATUITA
  //host: 'ec2-50-16-196-57.compute-1.amazonaws.com',
  //user: 'klpsdnbujsrqfh',
  //database: 'd7tjn0c1k927pq', 
  //password: '32069e24b8717feceb9544868a8615ce18bb93cafab653fd910da71e034236fc', 
  //CONFIGURACION BD PRODUCCION
  host: 'ec2-54-204-14-96.compute-1.amazonaws.com',
  user: 'isigayeqvnpwfd',
  database: 'd90eq9qau9cdl', 
  password: '2887e0f789c87a657ceeecf26adf1876b0111ab706e6ed9842a8dd53d2244c00', 
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