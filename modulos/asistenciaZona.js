var asistenciaZona = require('./registro');
var express = require('express');
var app = express();
var db = require('../database/database');
const cors = require('cors');
const bodyParser = require('body-parser');

var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
};

  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

  app.use(cors(corsOptions));

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
 /*
app.listen(4001, function () {
    console.log('Server is running.. on Port 4001');
});
*/

  //INSERTA UN MOVIMIENTO DE ASISTENCIA A ZONA
  app.post('/asistenciazona/:idevento', (req, res, next) => {
    var atributo, asistente;    
    log('Start', 'CREA ASISTENCIA ZONA');
    db.query(`INSERT INTO asistenciazona(
                idzona, idasistente, idoperacion, fecha)
              VALUES ($1, $2, $3, current_timestamp);`, 
              [req.body.idzona, 
                req.body.idasistente,
                req.body.idoperacion
              ], (err, result) => {
      if (err) {
        return next(err);
      }
      log('End', 'CREA ASISTENCIA ZONA');
      res.status(201).send(req.body);    //TODO Validar si es correcto el valor devuelto
    });
  });

  app.get('/asistencia/:idevento/', (req, res, next) => {
    var listaCampos, listaPosiblesValores;
    log('Start', 'CAMPOS EVENTO');
    db.query(`select *
              from camposevento 
              where idevento = $1 
              and ordenregistro is not null
              order by ordenregistro`, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
        log('End', 'CAMPOS EVENTO');
        res.send(req.body);
    });
  });

function log(tipo, metodo){
  var fecha = new Date().toLocaleString();
  var milisegundos = new Date().getMilliseconds();
    console.log(tipo + ' ' + metodo + ':' + fecha + '.' + milisegundos);
}