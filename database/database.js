var pg = require("pg");

const { Pool } = require('pg')

var config = {

  //CONFIGURACION BD GRATUITA
  //host: 'ec2-50-16-196-57.compute-1.amazonaws.com',
  //user: 'klpsdnbujsrqfh',
  //database: 'd7tjn0c1k927pq', 
  //password: '32069e24b8717feceb9544868a8615ce18bb93cafab653fd910da71e034236fc', 
  //BASE DE DATOS DE DESARROLLO
  //host: 'kapulus_db',
  //user: 'kapulus',
  //database: 'kapulus',
  //password: 'MrPotato*',
  //CONFIGURACION BD PRODUCCION
  //host: 'ec2-107-20-183-142.compute-1.amazonaws.com',
  //user: 'wzthfhkxjnbqxv',
  //database: 'dfu1a982rcvbsi',
  //password: '1dae3a7664678a13a1ccda3a93191cfd1ead93d2cbc99034efd65433e8962c8c',
  //port: 5432,
  //ssl: true
  //host: 'ec2-34-201-95-87.compute-1.amazonaws.com',
  //user: 'uxaxoydghtkvsb',
  //database: 'dcha1uab74h2j',
  //password: '46db7112b54aa894b7bedbf68dfd505b079efa3e6f9b74690a34766dc2c23488',
  //port: 5432,
  //ssl: true
  host: 'ce5cavigtak40n.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com',
  user: 'u1rbfu02v2habs',
  database: 'dcakljc4eg219n',
  password: 'p5d606d38fa3c9e668cf60feb95e33c803d6a8ef13f954aaa59976a6aac299d12',
  port: 5432,
  ssl: true
  //max: 10, // max number of connection can be open to database
  //idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};

const pool = new Pool(config);

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}
