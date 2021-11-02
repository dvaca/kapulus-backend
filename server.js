var db = require('database/database');
//var fs = require('fs')
//var nodemailer = require('nodemailer');

//const cors = require('cors');
//const bodyParser = require('body-parser');

//var index = require('../src/index');
//var app = index.app;
//var dbb = index.db;

    console.log('Start PING abc Hello world!');
 
    console.log('Start PING def Hello world!');
    db.query('SELECT $1::text as message', ['Hello world 1!'], (err, result) => {
      if (err) {
        return next(err);
      }
      var fecha = new Date().toLocaleString();
      console.log('End', 'PING def', 'Hello world!');
      console.log(result.rows[0]);
    });
//var registro = require('./modulos/registro');
// var dataLoader = require('./modulos/dataLoader/dataLoaderService');
// var eventManager = require('./modulos/eventManager/eventManagerService');
