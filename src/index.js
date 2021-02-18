var express = require('express');
var app = express();
var db = require('../database/database');
var fs = require('fs')
var nodemailer = require('nodemailer');

const cors = require('cors');
const bodyParser = require('body-parser');

const Dymo = require('dymojs');//,
const PORT = process.env.PORT || 4000;
       //dymo = new Dymo();

var corsOptions = {
  //origin: 'http://localhost:4200',
  //origin: 'http://kapulus.dynu.net:4200',
  //origin: 'http://169.254.168.35:4200', //PEER TO PEER
  //origin: 'http://192.168.0.100:4200', // CAPULUS
  //origin: 'http://192.168.0.6:4200', // LOCAL
  //origin: 'http://192.168.0.102:4200', // ADRIAN
  //origin: 'https://192.168.0.4:4200', // LOCAL SSL
  origin: 'https://kapulus.herokuapp.com', // INTERNET
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
};

var labelXml;

  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

  app.use(cors(corsOptions));

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
 
app.listen(PORT, function () {
    console.log('Server is running.. on Port ' + PORT);
});

  //PING
  app.get('/', (req, res, next) => {
    //log('Start', 'PING', 'Hello world!');
    db.query('SELECT $1::text as message', ['Hello world 1!'], (err, result) => {
      if (err) {
        return next(err);
      }
      var fecha = new Date().toLocaleString();
      //log('End', 'PING', 'Hello world!');
      res.send(result.rows[0]);
    })
  });
  
  exports.app = app;
  exports.db = db;