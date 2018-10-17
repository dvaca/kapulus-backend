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
        res.send(arbolAsistentes(listaAsistentes, listaAtributos)[0]);
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
    AND a.registrado = true
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
  app.post('/correoold/:idevento', (req, res, next) => {
    try{
    log('Start', 'CORREO ELECTRONICO', req.params.idevento);
    console.log(req.body);
    console.log(req.body.html);
    var send = require('gmail-send')({
        user: 'david1986@gmail.com',
        pass: 'loveSong28',
        //to:   'contacto@kapulusinternational.com',
        to:   'david1986@gmail.com',
        subject: 'Una buena noticia',
        //text:    'Si estas recibiendo este correo es porque ya funciono el envío de correos'         // Plain text
        html:    req.body.html,// HTML
        files:[
          {
            path:"./LogoKapulus.png",  
            filename:"LogoKapulus.png",  
            cid: "logokapulus"
          },
          {
            path:"./LogoKapulus.png",  
            filename: ".LogoKapulus.png",
            //content: req.body.qr,  
            content: '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',
            cid: "pruebaqr",
            encoding: 'base64'
          }
        ]
      });
      send( {}, 
        function (err, res) 
        {
          if(err)
          {
            console.log('Error occured');
            console.log(err.message);
            return;
          }
          else
          {
            console.log(res);
            console.log('Message sent successfully!');
          }
        });
      
      log('End', 'CORREO ELECTRONICO', req.params.idevento);
      res.send({});
    }catch(error){
      console.log(error);
    }
  });

  //ENVIO CORREO ELECTRONICO MEDIANTE GMAIL
  app.post('/correo/:idevento', (req, res, next) => {
    try{
    log('Start', 'CORREO ELECTRONICO', req.params.idevento);
    
    var TRANSPORT = {
      service: 'Gmail', auth: { 
        //user: 'eventos@cclgbt.co',
	  user: 'contacto@kapulusinternational.com',
        //pass: 'CAMARA1234' }
	pass: 'kamiad2018' }
    };

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
    var imagenQR = req.body.html.substring(inicio, fin - 2);
    var html = req.body.html.replace(req.body.html.substring(inicio, fin + 10), "");
    //var imagenQR = borrar.substring(inicio, fin -2);
    //console.log(imagenQR);
    inicio = imagenQR.indexOf("base64,");
    //console.log(inicio);
    imagenQR = imagenQR.substring(inicio + 7, imagenQR.length);
    //console.log(imagenQR);
    

    let mailOptions = {
      //from: 'eventos@cclgbt.co',
      from: 'contacto@kapulusinternational.com',
      to:   req.body.email,
      //to:   'contacto@kapulusinternational.com',
      subject: 'Correo de confirmación WeTrade',
      //text: 'Hello world?', // plain text body
      //html:    req.body.html,// HTML
      html:    html,// HTML
      attachments:[
        {
          path:"./resources/Cover-page-FB-WETRADE.png",  
          filename:"Cover-page-FB-WETRADE.png",  
          cid: "logokapulus"
        },
        {
          filename: ".LogoKapulus.png",
          //content: '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',
          content: imagenQR,
          cid: "pruebaqr",
          encoding: 'base64'
        }
      ]
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
