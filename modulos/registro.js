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
    
  sqlQuery = `select * 
  from asistente
  where idevento = $1`;    
  
  db.query(sqlQuery, 
            [req.params.idevento], (err, result) => {
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
        and c.ordenregistro is not null
        order by c.ordenregistro`, [req.params.idevento], (err, result) => {
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
                tipoid, identificacion, idevento, registrado, preinscrito)
              VALUES (1, $1, $2, $3, $4);`, 
              [req.body.identificacion, 
                req.params.idevento,
                req.body.registrado,
                req.body.preinscrito
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
              actualizado = $4
              WHERE identificacion = $1
                AND idevento = $2;`, 
              [req.body.identificacion, 
                req.params.idevento,
                req.body.registrado,
                req.body.actualizado
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
    
	let usuario = 'eventoslegis@kapulusinternational.com';
    let clave = 'KapuLegis18';
	if(req.params.idevento == 5 || req.params.idevento == 6){
      usuario = 'eventoslegis@kapulusinternational.com';
      clave = 'KapuLegis18';
    }
    if(req.params.idevento == 7){
      usuario = 'info@plussuperior.com';
      clave = 'nQz3*m38';
    }
	TRANSPORT = {};
	if(req.params.idevento == 7){
		var TRANSPORT = {
		  host: 'mail.plussuperior.com', 
		  port: 587,
		  secure: false, // true for 465, false for other ports
		  auth: { 
			user: usuario,
			pass: clave }
		};
	}else{
		TRANSPORT = {
		  service: 'Gmail', 
		  //host: 'smtp.office365.com', 
		  //host: 'autodiscover.legis.com.co',
		  //port: 587,
		  //secure: false,
		  //tls: {ciphers: 'SSLv3'},
		  auth: { 
		  //user: 'eventos@cclgbt.co',
		  //user: 'contacto@kapulusinternational.com',
		  //user: 'fiestafeoracle@feoracle.com.co',
		  //user: 'Johana.Pedreros@legis.com.co',
		  user: usuario,
			//  pass: 'CAMARA1234' }
			//pass: 'kamiad2018' }
			//pass: 'Felipe1234' }
			//pass: 'JUAMPIS2007+' }
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
	if(req.params.idevento == 6){
		adjuntos = [
		{
          path:"./resources/LogoLegis.jpg",  
          filename:"LogoLegis.jpg",  
          cid: "logolegis"
        },
        {
          path:"./resources/invitacionCerveza.png",  
          filename:"InvitaciónCerveza.png",  
          cid: "invitacioncerveza"
        },
        {
          path:"./resources/invitacionFlores.png",  
          filename:"InvitaciónFlores.png",  
          cid: "invitacionflores"
        }
		];
	}else{
		if(req.params.idevento == 8){
			adjuntos = [
			{
			  path:"./resources/LogoLegis.jpg",  
			  filename:"LogoLegis.jpg",  
			  cid: "logolegis"
			},
			{
			  path:"./resources/invitacionCerveza.png",  
			  filename:"InvitaciónCerveza.png",  
			  cid: "invitacioncerveza"
			}
			];
		}else{
			if(req.params.idevento == 9){
				adjuntos = [
				{
				  path:"./resources/LogoLegis.jpg",  
				  filename:"LogoLegis.jpg",  
				  cid: "logolegis"
				},
				{
				  path:"./resources/invitacionFlores.png",  
				  filename:"InvitaciónFlores.png",  
				  cid: "invitacionflores"
				}
				];
			}else{
				if(req.params.idevento == 7){
					adjuntos = [
						{
						  filename: "QR.png",
						  content: imagenQR,
						  cid: "pruebaqr",
						  encoding: 'base64'
						}
					];
				}else{
					adjuntos = [
					{
					  path:"./resources/LogoLegis.jpg",  
					  filename:"LogoLegis.jpg",  
					  cid: "logolegis"
					},
					{
					  path:"./resources/Congreso Propiedad Horizontal-01.jpg",  
					  filename:"Congreso Propiedad Horizontal-01.jpg",  
					  cid: "congreso1"
					},
					{
					  path:"./resources/Congreso Propiedad Horizontal-02.jpg",  
					  filename:"Congreso Propiedad Horizontal-02.jpg",  
					  cid: "congreso2"
					},
					{
					  filename: "QR.png",
					  content: imagenQR,
					  cid: "pruebaqr",
					  encoding: 'base64'
					}
					];
				}
			}
		}
	}
	
	if(req.params.idevento == 7){
		usuario = "plussuperior@gmail.com";
	}
	
    let mailOptions = {
      //from: 'eventos@cclgbt.co',
      //from: 'contacto@kapulusinternational.com',
	    //from: 'mercadeoempresarial2@ecci.edu.co',
      //from: 'fiestafeoracle@feoracle.com.co',
      //from: 'Johana.Pedreros@legis.com.co',
	  from: usuario,
      to:   req.body.email,
      //to:   'contacto@kapulusinternational.com',
      //subject: 'Correo de confirmación WeTrade',
	  //subject: 'Invitación Congreso de Actualización en Propiedad Horizontal',
	  subject: req.body.subject,
      //text: 'Hello world?', // plain text body
      //html:    req.body.html,// HTML
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
