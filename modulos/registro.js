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
    log('Start', 'PING', 'Hello world!');
    db.query('SELECT $1::text as message', ['Hello world!'], (err, result) => {
      if (err) {
        return next(err);
      }
      fecha = new Date().toLocaleString();
      log('End', 'PING', 'Hello world!');
      res.send(result.rows[0]);
    })
  });

   //TODO Meter mas bien esta tavuel con querystring
  //https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
  //UN SOLO ASISTENTE PARA IMPRESION, TODOS LOS ATRIBUTOS DE IMPRESION
  app.get('/asistente/:idevento/impresion/:identificacion', (req, res, next) => {
    var listaAsistentes, listaAtributos;
    log('Start', 'ASISTENTES IMPRESION', req.params.identificacion);
    db.query('SELECT * FROM asistente WHERE idevento = $1 and identificacion = $2', 
    [req.params.idevento, req.params.identificacion], (err, result) => {
      if (err) {
        return next(err);
      }
      listaAsistentes = result.rows;
      db.query(`select aa.*, c.nombre 
              from asistente a 
              inner join atributosasistente aa
              on a.id = aa.idasistente
              inner join camposevento c
              on aa.idcampo = c.id
              where a.idevento = $1
              and a.identificacion = $2
              and c.ordenimpresion is not null
              order by c.ordenimpresion`, 
              [req.params.idevento, req.params.identificacion], (err, result) => {
        if (err) {
          return next(err);
        }
        listaAtributos = result.rows;
        log('End', 'ASISTENTES IMPRESION', req.params.identificacion);
        if(listaAsistentes.length == 0){
          res.send("{}");
        }else{
          res.send(arbolAsistentes(listaAsistentes, listaAtributos)[0]);
        }        
      });
    });
  });

  //TODO Meter mas bien esta tavuel con querystring
  //https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
  //UN SOLO ASISTENTE PARA CONTROL DE ACCESO, TODOS LOS ATRIBUTOS
  app.get('/asistente/:idevento/controlacceso/:identificacion', (req, res, next) => {
    var listaAsistentes, listaAtributos;
    log('Start', 'ASISTENTES CONTROL ACCESO', req.params.identificacion);
    db.query('SELECT * FROM asistente WHERE idevento = $1 and identificacion = $2', 
    [req.params.idevento, req.params.identificacion], (err, result) => {
      if (err) {
        return next(err);
      }
      listaAsistentes = result.rows;
      db.query(`select aa.*, c.nombre 
              from asistente a 
              inner join atributosasistente aa
              on a.id = aa.idasistente
              inner join camposevento c
              on aa.idcampo = c.id
              where a.idevento = $1
              and a.identificacion = $2`, 
              [req.params.idevento, req.params.identificacion], (err, result) => {
        if (err) {
          return next(err);
        }
        listaAtributos = result.rows;
        log('End', 'ASISTENTES CONTROL ACCESO', req.params.identificacion);
        if(listaAsistentes.length == 0){
          res.send("{}");
        }else{
          res.send(arbolAsistentes(listaAsistentes, listaAtributos)[0]);
        }
      });
    });
  });
  
  //UN SOLO ASISTENTE PARA REGISTRO ONLINE, TODOS LOS ATRIBUTOS DE REGISTROWEB
  app.get('/asistente/:idevento/online/:identificacion', (req, res, next) => {
    var listaAsistentes, listaAtributos;
    log('Start', 'ASISTENTE ONLINE', req.params.identificacion);
    db.query('SELECT * FROM asistente WHERE idevento = $1 and identificacion = $2', 
    [req.params.idevento, req.params.identificacion], (err, result) => {
      if (err) {
        return next(err);
      }
      listaAsistentes = result.rows;
      db.query(`select a.id as idasistente, 
                c.id as idcampo,
                aa.idvalorseleccionado,
                aa.valor,
                c.nombre  
              from asistente a 
              inner join camposevento c
			          on a.idevento = c.idevento
              left join atributosasistente aa
                on a.id = aa.idasistente
                and aa.idcampo = c.id
              where a.idevento = $1
                and a.identificacion = $2
                and c.ordenregistroweb is not null
              order by c.ordenregistroweb`, 
              [req.params.idevento, req.params.identificacion], (err, result) => {
        if (err) {
          return next(err);
        }
        listaAtributos = result.rows;
        log('End', 'ASISTENTE ONLINE', req.params.identificacion);
        if(listaAsistentes.length == 0){
          res.send("{}");
        }else{
          res.send(arbolAsistentes(listaAsistentes, listaAtributos)[0]);
        }        
      });
    });
  });

  //RETORNA UN ATRIBUTO DE UN ASISTENTE
  app.get('/asistente/:idevento/:identificacion/atributo/:atributo', (req, res, next) => {
    var listaAsistentes;
    log('Start', 'ASISTENTES ATRIBUTO', req.params.identificacion);
    db.query(`select aa.*
            from asistente a 
            inner join atributosasistente aa
            on a.id = aa.idasistente
            inner join camposevento c
            on aa.idcampo = c.id
            where a.idevento = $1
            and a.identificacion = $2
            and UPPER(c.nombre) = $3`, 
            [req.params.idevento, req.params.identificacion, req.params.atributo], (err, result) => {
      if (err) {
        return next(err);
      }
      listaAsistentes = result.rows;
      log('End', 'ASISTENTES ATRIBUTO', req.params.identificacion);
      if(listaAsistentes.length == 0){
        res.send("{}");
      }else{
        res.send(listaAsistentes[0]);
      }
    });
  });

  //TODOS LOS ASISTENTES FILTRADOS, CON TODOS LOS ATRIBUTOS
  app.get('/asistente/:idevento/:criterio', (req, res, next) => {
    var listaAsistentes, listaAtributos;
    var listaCriterios, i;
    var sqlQuery, sqlEncabezado, sqlId;

    log('Start', 'ASISTENTES FILTRADO', req.params.criterio);
    listaCriterios = req.params.criterio.split(" ");
    for(i =0; i<listaCriterios.length; i++){
      listaCriterios[i] = '%' + listaCriterios[i] + '%';
    }
    listaCriterios.unshift(req.params.idevento);
    
    sqlEncabezado = `select DISTINCT a.* `;
    sqlId = 'select DISTINCT a.id ';
    sqlQuery = `from asistente a 
    inner join (
      select id
      from (`;
    for(i=1;i<listaCriterios.length;i++){
      sqlQuery += ` select idasistente as id, 
          aa.valor, 
          ` + i + ` llave
        from atributosasistente aa
        inner join camposevento c
          on aa.idcampo = c.id
        where c.idevento = $1
          and c.filtrar is not null
          and formatear(aa.valor, false) LIKE formatear($`+(i+1)+`, false) `;
      if(!isNaN(listaCriterios[i].substring(1,listaCriterios[i].length-1))){
        sqlQuery += ` UNION select id, 
            identificacion as valor, 
            ` + i + ` llave 
          from asistente 
          where idevento = $1
            and identificacion like $`+(i+1)+` `;
      }
      if(i<listaCriterios.length-1){
        sqlQuery += ` UNION `;
      }
    }
    sqlQuery +=` )res
      group by id
      having count(distinct(llave))>=` + (listaCriterios.length - 1) + `) res
    on a.id = res.id
    where a.idevento = $1`;
    db.query(sqlEncabezado + sqlQuery, 
              listaCriterios, (err, result) => {
      if (err) {
        return next(err);
      }
      listaAsistentes = result.rows;
      db.query(`select aa.*, c.nombre 
          from asistente a 
          inner join atributosasistente aa
          on a.id = aa.idasistente
          inner join camposevento c
          on aa.idcampo = c.id
          inner join (
          `+ sqlId + sqlQuery + 
          `) res 
          on a.id = res.id
          where a.idevento = $1
          and c.ordenregistro is not null
          order by c.ordenregistro`, listaCriterios, (err, result) => {
        if (err) {
          return next(err);
        }
        listaAtributos = result.rows;
        log('End', 'ASISTENTES FILTRADO', req.params.criterio);
        res.send(arbolAsistentes(listaAsistentes, listaAtributos));
      });
    });
  });

//TODOS LOS ASISTENTES PARA EXPORTAR, CON TODOS LOS ATRIBUTOS
app.get('/asistente/:idevento', (req, res, next) => {
  var listaAsistentes, listaAtributos;
  var sqlQuery;

  log('Start', 'ASISTENTES EXPORTAR', req.params.idevento);
    
  sqlQuery = `select a.*, 
  b.fechaCreacion,
  c.fechaInvitacion,
  e.fechaIngresoOnline
    from asistente a
    left join (
      select min(az.fecha) as fechacreacion, az.idasistente 
      from asistenciazona az
      inner join zona z
      on z.id = az.idzona
      where az.idoperacion = 1
      and z.idevento = $1
      group by az.idasistente
    )b
    on a.id = b.idasistente
    left join (
      select min(az.fecha) as fechainvitacion, az.idasistente 
      from asistenciazona az
      inner join zona z
      on z.id = az.idzona
      where az.idoperacion = 11
      and z.idevento = $1
      group by az.idasistente
    )c
    on a.id = c.idasistente
	left join (
      select min(az.fecha) as fechaingresoonline, az.idasistente 
      from asistenciazona az
      inner join zona z
      on z.id = az.idzona
      where az.idoperacion = 13
      and z.idevento = $1
      group by az.idasistente
    )e
    on a.id = e.idasistente
    where a.idevento = $1
    ORDER BY a.identificacion`;        
  
  db.query(sqlQuery, 
            [req.params.idevento], (err, result) => {
    if (err) {
      return next(err);
    }
    listaAsistentes = result.rows;
    db.query(`select a.id as idasistente, aa.idcampo, aa.idvalorseleccionado, aa.valor, c.nombre 
        from asistente a 
		inner join camposevento c
		on a.idevento = c.idevento
        left join atributosasistente aa
        on a.id = aa.idasistente
        and aa.idcampo = c.id
        where a.idevento = $1
        order by c.ordenregistro, c.id`, [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      listaAtributos = result.rows;
      log('End', 'ASISTENTES EXPORTAR', req.params.idevento);
      res.send(arbolAsistentes(listaAsistentes, listaAtributos));
    });
  });
});

  //INSERTA UN ASISTENTE CON SUS RESPECTIVOS ATRIBUTOS
  app.post('/asistente/:idevento', (req, res, next) => {
    var atributo, asistente;    
    log('Start', 'CREA ASISTENTE', req.body.identificacion);
    db.query(`INSERT INTO asistente(
                tipoid, identificacion, idevento, registrado, preinscrito, codigocontrolacceso, online)
              VALUES (1, $1, $2, $3, $4, $5, $6);`, 
              [req.body.identificacion, 
                req.params.idevento,
                req.body.registrado,
                req.body.preinscrito,
				req.body.codigocontrolacceso,
				req.body.online
              ], (err, result) => {
      if (err) {
        return next(err);
      }
      //res.status(201).send(req.body);    
      db.query('SELECT * FROM asistente WHERE idevento = $1 and identificacion = $2', 
        [req.params.idevento, req.body.identificacion], (err, result) => {
          if (err) {
            return next(err);
          }
          asistente = result.rows[0];
          for (i = 0; i < req.body.atributos.length; i += 1) {
            atributo = req.body.atributos[i];
            db.query(`INSERT INTO atributosasistente(
                  idasistente, idcampo, idvalorseleccionado, valor)
                  VALUES ($1, $2, $3, $4);`, 
                  [asistente.id, 
                    atributo.idcampo,
                    atributo.idvalorseleccionado,
                    atributo.valor
                  ], (err, result) => {
            if (err) {
            return next(err);
            }
            //res.status(201).send(req.body);    
            });
          }
          req.body.id = asistente.id;
          log('End', 'CREA ASISTENTE', req.body.identificacion);
          res.status(201).send(req.body);    //TODO Validar si es correcto el valor devuelto
        });
    });
  });

  //ACTUALIZA UN ASISTENTE CON SUS RESPECTIVOS ATRIBUTOS
  app.put('/asistente/:idevento', (req, res, next) => {
    log('Start', 'ACTUALIZA ASISTENTE', req.body.identificacion);
    db.query(`UPDATE asistente
              SET registrado = $3,
              actualizado = $4,
              codigocontrolacceso = $5,
              online = $6
              WHERE identificacion = $1
                AND idevento = $2;`, 
              [req.body.identificacion, 
                req.params.idevento,
                req.body.registrado,
                req.body.actualizado,
                req.body.codigocontrolacceso,
                req.body.online
              ], (err, result) => {
      if (err) {
        return next(err);
      }
      for (i = 0; i < req.body.atributos.length; i += 1) {
        atributo = req.body.atributos[i];
        db.query(`UPDATE atributosasistente
              SET idvalorseleccionado = $3,
                valor = $4
              WHERE idasistente = $1
                AND idcampo = $2;`, 
              [req.body.id, 
                atributo.idcampo,
                atributo.idvalorseleccionado,
                atributo.valor
              ], (err, result) => {
        if (err) {
        return next(err);
        }
        //res.status(201).send(req.body);    
        });
      }  
      log('End', 'ACTUALIZA ASISTENTE', req.body.identificacion);
      res.status(200).send(req.body);  //TODO Validar si es correcto el valor devuelto  
    });
  });

  //TODOS LOS CAMPOS PARA REGISTRO EN SITIO DE UN EVENTO, CON POSIBLES VALORES
  app.get('/camposevento/:idevento/', (req, res, next) => {
    var listaCampos, listaPosiblesValores;
    log('Start', 'CAMPOS EVENTO', req.params.idevento);
    db.query(`select *
              from camposevento 
              where idevento = $1 
              and ordenregistro is not null
              order by ordenregistro`, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
      listaCampos = result.rows;
      db.query(`select pv.*
              from camposevento c
              inner join posiblesvalores pv
              on c.id = pv.idcampo
              where c.idevento = $1 
              and c.ordenregistro is not null
              order by c.ordenregistro`, 
              [req.params.idevento], (err, result) => {
        if (err) {
          return next(err);
        }
        listaPosiblesValores = result.rows;
        log('End', 'CAMPOS EVENTO', req.params.idevento);
        res.send(arbolCampos(listaCampos,listaPosiblesValores));
      });
    });
  });

  //TODOS LOS CAMPOS PARA REGISTRO WEB DE UN EVENTO, CON POSIBLES VALORES
  app.get('/camposeventoweb/:idevento/', (req, res, next) => {
    var listaCampos, listaPosiblesValores;
    log('Start', 'CAMPOS EVENTO WEB', req.params.idevento);
    db.query(`select *
              from camposevento 
              where idevento = $1 
              and ordenregistroweb is not null
              order by ordenregistroweb`, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
      listaCampos = result.rows;
      db.query(`select pv.*
              from camposevento c
              inner join posiblesvalores pv
              on c.id = pv.idcampo
              where c.idevento = $1 
              and c.ordenregistroweb is not null
              order by c.ordenregistroweb`, 
              [req.params.idevento], (err, result) => {
        if (err) {
          return next(err);
        }
        listaPosiblesValores = result.rows;
        log('End', 'CAMPOS EVENTO WEB', req.params.idevento);
        res.send(arbolCampos(listaCampos,listaPosiblesValores));
      });
    });
  });

  //TODAS LAS ZONAS DE UN EVENTO, CON SUS RESPECTIVAS RESTRICCIONES
  app.get('/zonas/:idevento/', (req, res, next) => {
    var listaZonas, listaRestriccionesZonas;
    log('Start', 'ZONAS', req.params.idevento);
    db.query(`select *
              from zona
              where idevento = $1
              `, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
      listaZonas = result.rows;
      db.query(`select rz.*
              from zona z
              inner join restriccioneszona rz
              on z.id = rz.idzona
              where z.idevento = $1 
              `, 
              [req.params.idevento], (err, result) => {
        if (err) {
          return next(err);
        }
        listaRestriccionesZonas = result.rows;
        log('End', 'ZONAS', req.params.idevento);
        res.send(arbolZonas(listaZonas, listaRestriccionesZonas));
      });
    });
  });

  //INSERTA UN MOVIMIENTO DE ASISTENCIA A ZONA
  app.post('/asistenciazona/:idevento', (req, res, next) => {
    var atributo, asistente;    
    log('Start', 'CREA ASISTENCIA ZONA', req.body.idasistente);
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
      log('End', 'CREA ASISTENCIA ZONA', req.body.idasistente);
      res.status(201).send(req.body);    //TODO Validar si es correcto el valor devuelto
    });
  });

  //CONSULTA LA ULTIMA ASISTENCIA A UNA ZONA
  app.get('/asistenciazona/:idevento/:idasistente/:idzona/:idoperacion', (req, res, next) => {
    var asistenciaszona;
    var sqlQuery;

    log('Start', 'CONSULTA ULTIMA ASISTENCIA', req.params.idasistente);
      
    sqlQuery = `
    select az.* 
    from asistenciazona az
    inner join zona z
    on az.idzona = z.id
    where z.idevento = $1
    and az.idasistente = $2
    and az.idzona = $3
    and (
      ($4 in (8, 9) and az.idoperacion in (8, 9))
      or ($4 = 10 and az.idoperacion = 10)
    )
    order by az.fecha desc`;    
    
    db.query(sqlQuery, 
              [req.params.idevento,
                req.params.idasistente,
                req.params.idzona,
                req.params.idoperacion], (err, result) => {
      if (err) {
        return next(err);
      }
      asistenciaszona = result.rows;
      log('End', 'CONSULTA ULTIMA ASISTENCIA', req.params.idasistente);
      if(asistenciaszona.length == 0){
        res.send("{}");
      }else{
        res.send(asistenciaszona[0]);
      }
    });
  });

  //#region Estadisticas
  //ESTADISTICA DE REGISTRADOS
  app.get('/estadisticas/registrados/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA REGISTRADOS', req.params.idevento);
      
    sqlQuery = `SELECT registrado, 
    count(1) cuenta
    FROM asistente
    WHERE idevento = $1
    GROUP BY registrado
    ORDER BY registrado`;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA REGISTRADOS', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //ESTADISTICA DE ASISTENTES
  app.get('/estadisticas/asistentes/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA ASISTENTES', req.params.idevento);
      
    sqlQuery = `SELECT preinscrito, 
    count(1) cuenta
    FROM asistente
    WHERE idevento = $1
    GROUP BY preinscrito
    ORDER BY preinscrito`;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA ASISTENTES', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //ESTADISTICA DE ACTUALIZADOS
  app.get('/estadisticas/actualizados/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA ACTUALIZADOS', req.params.idevento);
      
    sqlQuery = `SELECT actualizado, 
    count(1) cuenta
    FROM asistente
    WHERE idevento = $1
    GROUP BY actualizado
    ORDER BY actualizado`;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA ACTUALIZADOS', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //ESTADISTICA DE CERTIFICADOS
  app.get('/estadisticas/certificados/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA CERTIFICADOS', req.params.idevento);
      
    sqlQuery = `SELECT COUNT(DISTINCT a.idasistente) cuenta
    FROM asistenciazona a
    INNER JOIN zona z
    ON a.idzona = z.id
    WHERE z.idevento = $1
    AND a.idoperacion = 6
    `;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA CERTIFICADOS', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //ESTADISTICA POR OPERACION
  app.get('/estadisticas/operacion/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA OPERACION', req.params.idevento);
      
    sqlQuery = `SELECT a.idzona, a.idoperacion, COUNT(a.idasistente) cuenta, COUNT(DISTINCT(a.idasistente)) cuentaDistintos
    FROM asistenciazona a
    INNER JOIN zona z
      ON a.idzona = z.id
    WHERE z.idevento = $1
      AND a.idoperacion IN (8, 9, 10)
    GROUP BY a.idzona, a.idoperacion
    `;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA OPERACION', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //LINEA DE TIEMPO REGISTRADOS
  app.get('/estadisticas/registradostimeline/:idevento', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'TIMELINE REGISTRADOS', req.params.idevento);
      
    sqlQuery = `SELECT to_char(a.fecha, 'YYYY/MM/DD') dia, 
          to_char(a.fecha, 'HH12 AM') hora,
          to_char(a.fecha, 'HH24') horaNumerico,
          COUNT(DISTINCT a.registrados) registrados,
          COUNT(DISTINCT a.escarapelas) escarapelas,
          COUNT(DISTINCT a.certificados) certificados
      FROM 
      (SELECT a.fecha, 
      CASE idoperacion WHEN 3 THEN a.idasistente ELSE null END AS registrados, 
      CASE WHEN idoperacion = 4 OR idoperacion = 5 THEN a.idasistente ELSE null END AS escarapelas,
      CASE idoperacion WHEN 6 THEN a.idasistente ELSE null END AS certificados
      FROM
      asistenciazona a
      INNER JOIN zona z
      ON a.idzona = z.id
      WHERE z.idevento = $1
          AND a.idoperacion between 3 and 6) a
      GROUP BY 
      to_char(a.fecha, 'YYYY/MM/DD'), 
          to_char(a.fecha, 'HH12 AM'),
          to_char(a.fecha, 'HH24')
      ORDER BY 1, 3
    `;    
    
    db.query(sqlQuery, 
              [req.params.idevento], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'TIMELINE REGISTRADOS', req.params.idevento);
      res.send(estadisticas);
    });
  });

  //LINEA DE TIEMPO ZONAS
  app.get('/estadisticas/zonastimeline/:idevento/:idzona', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'TIMELINE ZONAS', req.params.idzona);
      
    sqlQuery = `WITH a AS (SELECT a.fecha, 
        z.nombre,
        CASE idoperacion WHEN 8 THEN a.idasistente ELSE null END AS asistentes_entradas, 
        CASE idoperacion WHEN 9 THEN a.idasistente ELSE null END AS asistentes_salidas,
        CASE idoperacion WHEN 10 THEN a.idasistente ELSE null END AS asistentes_entregas
      FROM
        asistenciazona a
      INNER JOIN zona z
        ON a.idzona = z.id
      WHERE z.idevento = $1
   	    AND z.id = $2
        AND a.idoperacion between 8 and 10
          )     
      SELECT to_char(a.fecha, 'YYYY/MM/DD') dia, 
          to_char(a.fecha, 'HH12 AM') hora,
          to_char(a.fecha, 'HH24') horaNumerico,
          MAX(a.entradas) entradas,
          MAX(a.salidas) salidas,
          MAX(a.entregas) entregas,
          MAX(a.entradasdistintos) entradasdistintos,
          MAX(a.salidasdistintos) salidasdistintos,
          MAX(a.entregasdistintos) entregasdistintos
      FROM(
        SELECT a.fecha, 
          (SELECT COUNT(b.asistentes_entradas) FROM a b WHERE b.fecha <= a.fecha) as entradas,
          (SELECT COUNT(b.asistentes_salidas) FROM a b WHERE b.fecha <= a.fecha) as salidas,
          (SELECT COUNT(b.asistentes_entregas) FROM a b WHERE b.fecha <= a.fecha) as entregas,
          (SELECT COUNT(DISTINCT b.asistentes_entradas) FROM a b WHERE b.fecha <= a.fecha) as entradasdistintos,
          (SELECT COUNT(DISTINCT b.asistentes_salidas) FROM a b WHERE b.fecha <= a.fecha) as salidasdistintos,
          (SELECT COUNT(DISTINCT b.asistentes_entregas) FROM a b WHERE b.fecha <= a.fecha) as entregasdistintos
        FROM a
      ) a
      GROUP BY 
        to_char(a.fecha, 'YYYY/MM/DD'), 
        to_char(a.fecha, 'HH12 AM'),
        to_char(a.fecha, 'HH24')
      ORDER BY 1, 3
    `;    
    
    db.query(sqlQuery, 
              [req.params.idevento,
                req.params.idzona], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'TIMELINE ZONAS', req.params.idzona);
      res.send(estadisticas);
    });
  });

  //ESTADISTICA DE CAMPOS
  app.get('/estadisticas/:idevento/campos/:idcampo', (req, res, next) => {
    var estadisticas;
    var sqlQuery;

    log('Start', 'ESTADISTICA CAMPOS', req.params.idcampo);
      
    sqlQuery = `SELECT valor, 
    count(1) cuenta
    FROM atributosasistente aa
    INNER JOIN asistente a
    ON aa.idasistente = a.id
    WHERE idcampo = $2
    AND a.idevento = $1
    /*AND a.registrado = true      Comentado para evento wetrade */
    GROUP BY valor
    ORDER BY count(1) DESC`;    
    
    db.query(sqlQuery, 
              [req.params.idevento, req.params.idcampo], (err, result) => {
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICA CAMPOS', req.params.idcampo);
      res.send(estadisticas);
    });
  });
  //#endregion

  //#region Impresion
  
  //TODAS LAS IMPRESORAS CON SU IP
  app.get('/impresoras/:idevento/', (req, res, next) => {
    var listaImpresoras;
    log('Start', 'IMPRESORAS', req.params.idevento);
    db.query(`select DISTINCT ip
              from impresoras
              where idevento = $1
              `, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
      listaImpresoras = result.rows;
      log('End', 'IMPRESORAS', req.params.idevento);
      res.send(listaImpresoras);
    });
  });
  //#endregion

  //ENVIO CORREO ELECTRONICO MEDIANTE GMAIL
  app.post('/correo/:idevento', (req, res, next) => {
    try{
    log('Start', 'CORREO ELECTRONICO', req.params.idevento);
    
	//let usuario = 'foros@semana.com';
    //let clave = 'foros';
    //let usuario = 'eventossemana@semana.com';
    //let clave = 'foros';
	let usuario = 'eventoscoosalud@kapulusinternational.com';
    let clave = 'KapuEventos';
	if(req.params.idevento == 15){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 16){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 18){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 20){
		usuario = 'eventoscoosalud@kapulusinternational.com';
		clave = 'KapuEventos';
	}
	if(req.params.idevento == 21){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 22){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 23){
		usuario = 'eventoscoosalud@kapulusinternational.com';
		clave = 'KapuEventos';
	}
	if(req.params.idevento == 24){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 25){
		usuario = 'fiestafeoracle@feoracle.com.co';
		clave = ' oracle2019';
	}
	if(req.params.idevento == 28){
		usuario = 'ied2019@experienciasintel.com';
		clave = 'Latone2019!';
	}
	if(req.params.idevento == 29){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 30){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 33){
		//usuario = 'contacto@kapulusinternational.com';
		//usuario = 'comunicaciones@congresodeetica.com.co';
		usuario = 'congresoetica@kapulusinternational.com';
		//clave = '1*Kapu*2';
		//clave = 'Congreso2019*';
		clave = 'congreso123';
	}
	if(req.params.idevento == 34){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 35){
		usuario = 'foros@semana.com';
		clave = 'foros';
	}
	if(req.params.idevento == 36){
		usuario = 'fiestafeoracle@feoracle.com.co';
		clave = ' oracle2019';
	}
	if(req.params.idevento == 39){
		usuario = 'invitacioneventos@feoracle.com.co';
		clave = 'Eventos2019';
	}
	if(req.params.idevento == 40){
		usuario = 'contacto@kapulusinternational.com';
		clave = '1*Kapu*2';
		//usuario = 'foros@semana.com';
		//clave = 'foros';
	}
	if(req.params.idevento == 41){
		//usuario = 'contacto@kapulusinternational.com';
		//clave = '1*Kapu*2';
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	if(req.params.idevento == 42){
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	if(req.params.idevento == 43){
		usuario = 'qlik.analyticsday@gmail.com';
		clave = 'qlik2019';
	}
	if(req.params.idevento == 44){
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	if(req.params.idevento == 45){
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	if(req.params.idevento == 46){
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	if(req.params.idevento == 47){
		usuario = 'foros@semana.com';
		clave = 'convocatoriapacaweci';
	}
	
	TRANSPORT = {};
	if(req.params.idevento == 33){
		TRANSPORT = {
		  service: 'Gmail', 
		  //host: 'mail.congresodeetica.com.co',
		  //port: 26,
		  //secure: false,
		  auth: { 
		  //user: 'contacto@kapulusinternational.com',
		  user: usuario,
			//pass: 'kamiad2018' }
			pass: clave }/*,
		tls: {
			rejectUnauthorized: false
		    }*/
		};
	}else{
		TRANSPORT = {
		  service: 'Gmail', 
		  auth: { 
		  user: usuario,
			pass: clave }
		};
	}

    var smtpTransport = nodemailer.createTransport( TRANSPORT );

    var inicio = 0;
    var fin = 0;
    //var borrar = 'asdfasdf<qr-code _ngcontent-c6="" ng-reflect-size="300" ng-reflect-value="12345"><img width="300" height="300" src="data:image/png;base64,123456789"></qr-code>asdfasdf';
    //console.log(borrar.length);
    inicio = req.body.html.indexOf("<qr-code");
    fin = req.body.html.indexOf("</qr-code>");
    //inicio = borrar.indexOf("<qr-code");
    //fin = borrar.indexOf("</qr-code>");
    //console.log(inicio);
    //console.log(fin);
    var imagenQR = "";
    var html = req.body.html;
    if(inicio >= 0 && fin >= 0){
      imagenQR = req.body.html.substring(inicio, fin - 2);
      html = req.body.html.replace(req.body.html.substring(inicio, fin + 10), "");
      //var imagenQR = borrar.substring(inicio, fin -2);
      //console.log(imagenQR);
      inicio = imagenQR.indexOf("base64,");
      //console.log(inicio);
      imagenQR = imagenQR.substring(inicio + 7, imagenQR.length);
      //console.log(imagenQR);
    }
    
	let adjuntos;
	//CONFIRMACION
	if(req.body.tipo == 0){
	  if(req.params.idevento == 10){
      adjuntos = [
        {
          path:"./resources/QRPremioPeriodismo1.jpg",  
          filename:"QRPremioPeriodismo1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRPremioPeriodismo2.jpg",  
          filename:"QRPremioPeriodismo2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 11){
      adjuntos = [
        {
          path:"./resources/QRBolivar1.jpg",  
          filename:"QRBolivar1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRBolivar2.jpg",  
          filename:"QRBolivar2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 12){
      adjuntos = [
        {
          path:"./resources/QRCartagena1.jpg",  
          filename:"QRCartagena1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRCartagena2.jpg",  
          filename:"QRCartagena2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 13){
      adjuntos = [
        {
          path:"./resources/CoosaludHeader.jpg",  
          filename:"CoosaludHeader.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/CoosaludFooter.jpg",  
          filename:"CoosaludFooter.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 14){
      adjuntos = [
        {
          path:"./resources/QRBucaramanga1.jpg",  
          filename:"QRBucaramanga1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRBucaramanga2.jpg",  
          filename:"QRBucaramanga2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 15){
      adjuntos = [
        {
          path:"./resources/QRAbbvie1.jpg",  
          filename:"QRAbbvie1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRAbbvie2.jpg",  
          filename:"QRAbbvie1.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 16){
      adjuntos = [
        {
          path:"./resources/QRConversatorio1.jpg",  
          filename:"QRConversatorio1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRConversatorio2.jpg",  
          filename:"QRConversatorio2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 17){
      adjuntos = [
        {
          path:"./resources/QRCoosaludMedellin1.jpg",  
          filename:"QRCoosaludMedellin1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRCoosaludMedellin2.jpg",  
          filename:"QRCoosaludMedellin2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 18){
      adjuntos = [
        {
          path:"./resources/QRMujeres1.jpg",  
          filename:"QRMujeres1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRMujeres2.jpg",  
          filename:"QRMujeres2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 20){
      adjuntos = [
        {
          path:"./resources/CoosaludCali1.jpg",  
          filename:"CoosaludCali1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/CoosaludCali2.jpg",  
          filename:"CoosaludCali2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }	  
	  if(req.params.idevento == 21){
      adjuntos = [
        {
          path:"./resources/QRProBogota1.jpg",  
          filename:"QRProBogota1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRProBogota2.jpg",  
          filename:"QRProBogota2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }	  
	  if(req.params.idevento == 22){
      adjuntos = [
        {
          path:"./resources/QRContraloria1.jpg",  
          filename:"QRContraloria1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRContraloria2.jpg",  
          filename:"QRContraloria2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 23){
      adjuntos = [
        {
          path:"./resources/CoosaludBogota1.jpg",  
          filename:"CoosaludBogota1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/CoosaludBogota2.jpg",  
          filename:"CoosaludBogota2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 24){
      adjuntos = [
        {
          path:"./resources/QRCAR1.jpg",  
          filename:"QRCAR1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRCAR2.jpg",  
          filename:"QRCAR2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 25){
      adjuntos = [
        {
          path:"./resources/LogoOracle.png",  
          filename:"LogoOracle.png",  
          cid: "confirmacionheader"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 28){
      adjuntos = [
        {
          path:"./resources/QRIED1.jpg",  
          filename:"QRIED1.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QRIED2.jpg",  
          filename:"QRIED2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 29){
      adjuntos = [
        {
          path:"./resources/headerQRProsegur.jpg",  
          filename:"headerQRProsegur.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/footerQRProsegur.png",  
          filename:"footerQRProsegur.png",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 30){
      adjuntos = [
        {
          path:"./resources/QueEsLoQueComoHeader.jpg",  
          filename:"QueEsLoQueComoHeader.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/QueEsLoQueComoFooter.jpg",  
          filename:"QueEsLoQueComoFooter.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 33){
      adjuntos = [
        {
          path:"./resources/BannerConfirmacionCorreo.png",  
          filename:"BannerConfirmacionCorreo.png",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/PieConfirmacionCorreo.png",  
          filename:"PieConfirmacionCorreo.png",  
          cid: "confirmacionfooter"
        },
		{
          path:"./resources/programacionCopnia.PNG",  
          filename:"programacionCopnia.PNG"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }	  
	  if(req.params.idevento == 34){
      adjuntos = [
        {
          path:"./resources/JuegosHeader.jpg",  
          filename:"JuegosHeader.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/JuegosFooter.jpg",  
          filename:"JuegosFooter.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 35){
      adjuntos = [
        {
          path:"./resources/SostenibilidadHeader.jpg",  
          filename:"SostenibilidadHeader.jpg",  
          cid: "confirmacionheader"
        },
        {
          path:"./resources/SostenibilidadFooter.jpg",  
          filename:"SostenibilidadFooter.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 36){
      adjuntos = [
        {
          path:"./resources/LogoOracle.png",  
          filename:"LogoOracle.png",  
          cid: "confirmacionheader"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 39){
      adjuntos = [
        {
          path:"./resources/LogoOracle.png",  
          filename:"LogoOracle.png",  
          cid: "confirmacionheader"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 40){
      adjuntos = [
        {
          path:"./resources/QRPlaneacionPolicia1.jpg",  
          filename:"QRPlaneacionPolicia1.jpg",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/QRPlaneacionPolicia2.jpg",  
          filename:"QRPlaneacionPolicia2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 41){
      adjuntos = [
        {
          path:"./resources/QR_Cannabis1.png",  
          filename:"QR_Cannabis1.png",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/QR_Cannabis2.jpg",  
          filename:"QR_Cannabis2.jpg",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 43){
      adjuntos = [
        {
          path:"./resources/headerQRQlik.png",  
          filename:"headerQRQlik.png",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/footerQRQlik.png",  
          filename:"footerQRQlik.png",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 44){
      adjuntos = [
        {
          path:"./resources/QR_probogota_header.png",  
          filename:"QR_probogota_header.png",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/QR_probogota_footer.png",  
          filename:"QR_probogota_footer.png",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
	  if(req.params.idevento == 46){
      adjuntos = [
        {
          path:"./resources/QR_Demo_1.png",  
          filename:"QR_Demo_1.png",  
          cid: "confirmacionheader"
        },
		{
          path:"./resources/QR_Demo_2.png",  
          filename:"QR_Demo_2.png",  
          cid: "confirmacionfooter"
        },
        {
          filename: "QR.png",
          content: imagenQR,
          cid: "qr",
          encoding: 'base64'
        }
      ]
	  }
    }else{ //INVITACION
	  if(req.params.idevento == 14){
      adjuntos = [
        {
          path:"./resources/invitacionCSBmanga.jpg",  
          filename:"invitacionCSBmanga.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 15){
      adjuntos = [
        {
          path:"./resources/invitacionAbbvie.jpg",  
          filename:"invitacionAbbvie.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 16){
      adjuntos = [
        {
          path:"./resources/MailingConversatorio_VF.jpg",  
          filename:"MailingConversatorio_VF.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 18){
      adjuntos = [
        {
          path:"./resources/invitacionMujeres.jpg",  
          filename:"invitacionMujeres.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 20){
      adjuntos = [
        {
          path:"./resources/invitacionCali.jpg",  
          filename:"invitacionCali.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 23){
      adjuntos = [
        {
          path:"./resources/invitacionBogota.jpg",  
          filename:"invitacionBogota.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 24){
      adjuntos = [
        {
          path:"./resources/invitacionRioBogota.jpg",  
          filename:"invitacionRioBogota.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 29){
      adjuntos = [
        {
          path:"./resources/invitacionProsegur.jpg",  
          filename:"invitacionProsegur.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 33){
      adjuntos = [
        {
          path:"./resources/BannerConfirmacionCorreo.png",  
          filename:"BannerConfirmacionCorreo.png",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 42){
      adjuntos = [
        {
          path:"./resources/InvitacionAntinarcoticos.jpg",  
          filename:"InvitacionAntinarcoticos.jpg",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 44){
      adjuntos = [
        {
          path:"./resources/invitacionSeguridadInteligente.png",  
          filename:"invitacionSeguridadInteligente.png",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 45){
      adjuntos = [
        {
          path:"./resources/invitacionNoRepeticion.png",  
          filename:"invitacionNoRepeticion.png",  
          cid: "invitacion"
        }
      ]
	  }
	  if(req.params.idevento == 47){
      adjuntos = [
        {
          path:"./resources/invitacionEduAmbiental.jpg",  
          filename:"invitacionEduAmbiental.jpg",  
          cid: "invitacion"
        }
      ]
	  }
    }
	
	let correoEnvia;
	if(req.params.idevento == 10){
		correoEnvia = 'eventos@semana.com';
	}
	if(req.params.idevento == 11){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 12){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 13){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 14){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 15){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 16){
		correoEnvia = 'eventos@semana.com';
	}
	if(req.params.idevento == 17){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 18){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 20){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 21){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 22){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 23){
		correoEnvia = 'eventoscoosalud@kapulusinternational.com';
	}
	if(req.params.idevento == 24){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 25){
		correoEnvia = 'fiestafeoracle@feoracle.com.co';		
	}
	if(req.params.idevento == 28){
		correoEnvia = 'ied2019@experienciasintel.com';		
	}
	if(req.params.idevento == 29){
		//correoEnvia = 'Encuentro Prosegur Soluciones Integrales <eventossemana@semana.com>';
		correoEnvia = 'Encuentro Prosegur Soluciones Integrales <eventos@semana.com>';
	}
    if(req.params.idevento == 30){
		correoEnvia = 'Eventos Semana <eventos@semana.com>';
	}
	if(req.params.idevento == 33){
		//correoEnvia = 'Congreso de Ética profesional <contacto@kapulusinternational.com>';
		//correoEnvia = 'Congreso de Ética profesional <comunicaciones@congresodeetica.com.co>';
		correoEnvia = 'Congreso de Ética profesional <congresoetica@kapulusinternational.com>';
	}
	if(req.params.idevento == 34){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 35){
		correoEnvia = 'Semana Sostenible <eventos@semana.com>';
		//correoEnvia = 'Semana Sostenible <foros@semana.com>';
	}
	if(req.params.idevento == 36){
		correoEnvia = 'fiestafeoracle@feoracle.com.co';		
	}
	if(req.params.idevento == 39){
		correoEnvia = 'invitacioneventos@feoracle.com.co';		
	}
	if(req.params.idevento == 40){
		correoEnvia = 'XVII Encuentro de Planeación | Policía Nacional <contacto@kapulusinternational.com>';
	}
	if(req.params.idevento == 41){
		correoEnvia = 'foros@semana.com';
		//correoEnvia = 'Foros Semana <contacto@kapulusinternational.com>';
	}
	if(req.params.idevento == 42){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 43){
		correoEnvia = 'Qlik Analytics Day <qlik.analyticsday@gmail.com>';
	}
	if(req.params.idevento == 44){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 45){
		correoEnvia = 'foros@semana.com';
	}
	if(req.params.idevento == 46){
		correoEnvia = 'Foros Semana <foros@semana.com>';
	}
	if(req.params.idevento == 47){
		correoEnvia = 'Foros Semana <foros@semana.com>';
	}
	
    let mailOptions = {
      //from: 'contacto@kapulusinternational.com',
	  //from: usuario,
	  from: correoEnvia,
      to:   req.body.email,
	  subject: req.body.subject,
      html:    html,// HTML
      attachments: adjuntos
    };

    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });

      log('End', 'CORREO ELECTRONICO', req.params.idevento);
      res.send({});
    }catch(error){
      console.log(error);
    }
  });
  
  //#region login
 app.post('/login/:idevento', (req, res, next) => {
  var listaUsuarios;
  log('Start', 'LOGIN', req.params.idevento);
  db.query(`SELECT * FROM usuario u 
            WHERE u.nombre = $1
              AND u.contrasena = $2`, 
    [req.body.nombre, req.body.contrasena], (err, result) => {
      if (err) {
        return next(err);
      }
      listaUsuarios = result.rows;
      log('End', 'LOGIN', req.params.idevento);
      if(listaUsuarios.length == 0){
        res.send({acceso: "denegado"});
      }else{
        res.send({acceso: "aprobado"});
      }
    });
 });
 //#endregion
 
 //#region Sincronizacion
   //RETORNA TODOS LOS REGISTROS DE ESTADISTICAS LOCALES
  app.get('/sincronizar/estadisticas/:idevento/', (req, res, next) => {
    var estadisticas;
    log('Start', 'ESTADISTICAS LOCALES', req.params.idevento);
    db.query(`SELECT *
              FROM estadisticas
              WHERE idevento = $1
              `, 
              [req.params.idevento], (err, result) => { 
      if (err) {
        return next(err);
      }
      estadisticas = result.rows;
      log('End', 'ESTADISTICAS LOCALES', req.params.idevento);
      res.send(estadisticas);
    });
  });
 //#endregion
  
function arbolAsistentes(listaPadre, listaHijos) {
  try{
    var nodoPadre, nodoHijo, roots = [], i, j;
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      nodoPadre.atributos = [];
    }
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      for (j = 0; j < listaHijos.length; j += 1) {
        nodoHijo = listaHijos[j];
        if (nodoHijo.idasistente == nodoPadre.id) {
            nodoPadre.atributos.push(nodoHijo);
        } 
      }
      roots.push(nodoPadre);
    }
    return roots;
  }
  catch(error){
    console.log(error);
  }
  return null;
}

function arbolCampos(listaPadre, listaHijos) {
  try{
    var nodoPadre, nodoHijo, roots = [], i, j;
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      nodoPadre.posiblesvalores = [];
    }
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      for (j = 0; j < listaHijos.length; j += 1) {
        nodoHijo = listaHijos[j];
        if (nodoHijo.idcampo == nodoPadre.id) {
            nodoPadre.posiblesvalores.push(nodoHijo);
        } 
      }
      roots.push(nodoPadre);
    }
    return roots;
  }
  catch(error){
    console.log(error);
  }
  return null;
}

function arbolZonas(listaPadre, listaHijos) {
  try{
    var nodoPadre, nodoHijo, roots = [], i, j;
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      nodoPadre.restriccioneszona = [];
    }
    for (i = 0; i < listaPadre.length; i += 1) {
      nodoPadre = listaPadre[i];
      for (j = 0; j < listaHijos.length; j += 1) {
        nodoHijo = listaHijos[j];
        if (nodoHijo.idzona == nodoPadre.id) {
            nodoPadre.restriccioneszona.push(nodoHijo);
        } 
      }
      roots.push(nodoPadre);
    }
    return roots;
  }
  catch(error){
    console.log(error);
  }
  return null;
}

function log(tipo, metodo, parametro){
  var fecha = new Date().toLocaleString();
  var milisegundos = new Date().getMilliseconds();
  console.log(tipo + ':' + metodo + ':' + parametro + ':' + fecha + '.' + milisegundos);
}

function leerLabel(){
  try{
  if(labelXml != null){
    return labelXml;
  }else{
    fs.readFile('./labels/escarapela.label', 'utf8', function (err,data) {
      if (err) {
        console.log(err);
      }
      console.log(data);
      labelXml = data;
    });
    return labelXml;
  }
  }catch(error){
    console.log(error);
  }
}

// Convierte el response XML de DYMO en JSON
function xmlToJson(xml) {
  var lista = [];
  var indice = 0;
  while(xml.indexOf("<LabelWriterPrinter>", indice) >= 0){
    var impresora = {};
    impresora.nombre = xml.substring(xml.indexOf("<Name", indice) + 6 , xml.indexOf("/Name>", indice) - 2);
    impresora.activa = xml.substring(xml.indexOf("<IsConnected", indice) + 13 , xml.indexOf("/IsConnected>", indice) - 2);
    if(impresora.activa == "True"){
      lista.push(impresora);
    }
    indice = xml.indexOf("/IsConnected>", indice) + 3;
  }
	return lista;
};
