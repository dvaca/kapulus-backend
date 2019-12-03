/**
 * Scrit to call postgresql database
 */

var db = require('./database');

/** Return the events*/
const GET_EVENTS_QUERY = 'SELECT * FROM evento ORDER BY id DESC';
function getEvents(params, callback) {
    callDatabase(GET_EVENTS_QUERY, params, callback, processMultipleResult);
};

/** Return one event*/
const GET_EVENT_QUERY = 'SELECT * FROM evento WHERE id=$1';
function getEvent(params, callback) {
    callDatabase(GET_EVENT_QUERY, params, callback, processSingleResult);
};
/**
 * Insert one event
 */
const INSERT_EVENT_QUERY = `INSERT INTO evento(id, idcliente, nombre, fecha, logo, descripcion, status)
    VALUES (nextval('evento_id_seq'), 1, $1, $3, '', $2, $4) RETURNING id;`;
function insertEvent(params, callback) {
    callDatabase(INSERT_EVENT_QUERY, params, callback, processSingleResult);
};

/**
 * Insert one event
 */
const INSERT_ZONE = `INSERT INTO zona(
	id, idevento, nombre, entregaregalo, validaentrada, validasalida, cantidadmaxima)
	VALUES (nextval('zona_id_seq'), $1, $2, $3, $4, $5, $6);`;
function insertZone(params, callback) {
    callDatabase(INSERT_ZONE, params, callback, processSingleResult);
};

/** Return one event*/
const GET_ZONE_BY_EVENT = 'SELECT * FROM zona WHERE idevento=$1';
function getZoneByEvent(params, callback) {
    callDatabase(GET_ZONE_BY_EVENT, params, callback, processSingleResult);
};

/** Delete the event*/
const DELETE_ZONE_QUERY = 'DELETE FROM zona WHERE id=$1';
function deleteZone(params, callback) {
    callDatabase(DELETE_ZONE_QUERY, params, callback, processSingleResult);
};

/** Delete the event*/
const DELETE_ZONE_BY_EVENT = 'DELETE FROM zona WHERE idevento=$1';
function deleteZoneByEvent(params, callback) {
    callDatabase(DELETE_ZONE_BY_EVENT, params, callback, processSingleResult);
};
/**
 * Save Configuration
 */

const UPDATE_EVENT = `UPDATE evento SET idcliente=$2, nombre=$3, fecha=$4, logo=$5, descripcion=$6, 
settings=$7, status=$8 WHERE id=$1`;
function updateEvent(params, callback) {
    var parameters = [params.id, parseInt(params.idcliente), params.nombre, params.fecha,
    params.logo, params.descripcion, params.settings, params.status];
    callDatabase(UPDATE_EVENT, parameters, callback, processSingleResult);
};

/** Delete the event*/
const DELETE_EVENT_QUERY = 'DELETE FROM evento WHERE id=$1';
function deleteEvent(params, callback) {
    callDatabase(DELETE_EVENT_QUERY, params, callback, processSingleResult);
};


/**
 * Insert storage
 */
const INSERT_STORAGE = `INSERT INTO storage(storage_id, original_name, event_id, create_date, extension) 
                        VALUES ($1, $2, $3, $4, $5);`
function insertStorage(params, callback) {
    callDatabase(INSERT_STORAGE, params, callback, processSingleResult);
}

/**
 * Update storage
 */
const UPDATE_STORAGE = `UPDATE storage
SET  original_name=$2, event_id=$3, create_date=$4, extension=$5
WHERE storage_id=$1;`;
function updateStorage(params, callback) {
    var parameters = [params.id, params.original_name, params.event_id, params.create_date,
    params.extension, params.settings];
    callDatabase(UPDATE_STORAGE, parameters, callback, processSingleResult);
};
/**
 * Get Storage by event
 */
const SELECT_STORAGE_BY_ID_EVENT = `SELECT * FROM storage WHERE event_id=$1`;
function getFilesByEvent(params, callback) {
    callDatabase(SELECT_STORAGE_BY_ID_EVENT, params, callback, processMultipleResult);
};

/**
 * Get Storage by id
 */
const SELECT_STORAGE_BY_ID = `SELECT * FROM storage WHERE storage_id=$1`;
function getStorageByID(params, callback) {
    callDatabase(SELECT_STORAGE_BY_ID, params, callback, processSingleResult);
};

/** Delete storage */
const DELETE_STORAGE = `DELETE FROM storage WHERE storage_id=$1`
function deleteStorage(params, callback) {
    callDatabase(DELETE_STORAGE, params, callback, processSingleResult);
}

/**
 * Insert event attendand
 */
// const INSERT_ATTENDANT = `INSERT INTO asistente(
//     id, tipoid, identificacion, idevento, registrado, preinscrito, actualizado, id_ticket, 
//     autorizacion_pago, codigocontrolacceso, storage_id)
//     VALUES (nextval('asistente_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`
const INSERT_ATTENDANT= `WITH upsert AS(UPDATE asistente SET registrado=$4, preinscrito=$5, actualizado=$6,
    id_ticket=$7,autorizacion_pago=$8, codigocontrolacceso=$9, storage_id=$10
     WHERE tipoid=$1 AND identificacion=$2 AND idevento=$3 RETURNING *)
INSERT INTO asistente(
id, tipoid, identificacion, idevento, registrado, preinscrito, actualizado, id_ticket, 
autorizacion_pago, codigocontrolacceso, storage_id)
SELECT nextval('asistente_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
WHERE NOT EXISTS (SELECT * FROM upsert) RETURNING id;`    
function insertAttendant(params, callback) {
    callDatabase(INSERT_ATTENDANT, params, callback, processSingleResult);
}

/** Delete Attendant by storage Id  */
const DELETE_ATTENDANT_BY_STORAGE_ID = `DELETE FROM asistente WHERE storage_id = $1;`
function deleteAttendantByStorage(params, callback) {
    callDatabase(DELETE_ATTENDANT_BY_STORAGE_ID, params, callback, processSingleResult);
}

/** Insert dinamic fields */
// const INSERT_EVENT_FIELDS = `INSERT INTO camposevento(
//     id, idevento, nombre, tipodato, tipocampo, obligatorio, longitud, filtrar, estadisticas, 
//     ordenimpresion, ordenregistro, ordenregistroweb, ordencargue, xescarapela, yescarapela, 
//     tamanoescarapela, negritaescarapela, xcertificado, ycertificado, tamanocertificado, negritacertificado,
//     storage_id)
//     VALUES (nextval('camposevento_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
//      $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id;`

const INSERT_EVENT_FIELDS =  `WITH upsert AS (UPDATE camposevento SET tipodato=$3, tipocampo=$4, obligatorio=$5, 
    longitud=$6,filtrar=$7,estadisticas=$8,ordenimpresion=$9,ordenregistro=$10, ordenregistroweb=$11,
    ordencargue=$12,xescarapela=$13, yescarapela=$14,tamanoescarapela=$15, 
    negritaescarapela=$16,xcertificado=$17, ycertificado=$18,tamanocertificado=$19, 
    negritacertificado=$20
     WHERE idevento=$1 AND nombre=$2 RETURNING *)
INSERT INTO camposevento (id, idevento, nombre, tipodato, tipocampo, obligatorio, longitud, filtrar, estadisticas, 
ordenimpresion, ordenregistro, ordenregistroweb, ordencargue, xescarapela, yescarapela, 
tamanoescarapela, negritaescarapela, xcertificado, ycertificado, tamanocertificado, negritacertificado,
storage_id) 
SELECT nextval('camposevento_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
$13, $14, $15, $16, $17, $18, $19, $20, $21 
WHERE NOT EXISTS (SELECT * FROM upsert) RETURNING id;`

function insertEventFields(params, callback) {
    callDatabase(INSERT_EVENT_FIELDS, params, callback, processSingleResult);
}
/**
 * Delete event fields by storageId
 */
const DELETE_EVENT_FIELDS_BY_STORAGE_ID = `DELETE FROM camposevento WHERE storage_id = $1;`
function deleteEventFieldsByStorage(params, callback) {
    callDatabase(DELETE_EVENT_FIELDS_BY_STORAGE_ID, params, callback, processSingleResult);
}


/**
 * Insert data attributes for dinamics fields
 */
const INSERT_ATTRIBUTE_ATTENDANT = `INSERT INTO atributosasistente (idasistente, idcampo, idvalorseleccionado, valor, storage_id)
 VALUES((SELECT id FROM asistente WHERE idevento = $1 AND identificacion = $2), 
 (SELECT id FROM camposevento WHERE idevento = $3 and nombre = $4),NULL,
  $5, $6);`
async function insertAttributeAttendant(params) {
    await callDatabaseAsync(INSERT_ATTRIBUTE_ATTENDANT, params, processSingleResult);
}

/**
 * Insert data attributes for dinamics fields
 */
// const INSERT_ATTRIBUTE_ATTENDANT = `INSERT INTO atributosasistente (idasistente, idcampo, idvalorseleccionado, valor, storage_id)
//  VALUES((SELECT id FROM asistente WHERE idevento = $1 AND identificacion = $2), 
//  (SELECT id FROM camposevento WHERE idevento = $3 and nombre = $4),NULL,
//   $5, $6) RETURNING id;`

var INSERT_ATTRIBUTE_ATTENDANT_MASSIVE = `INSERT INTO atributosasistente (idasistente, idcampo, idvalorseleccionado, valor, storage_id)
 VALUES %query%;`

function insertAttributeAttendantMassive(params, callback) {
    var stringQuery = "";
    var counter = 0;
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        var query = `((SELECT id FROM asistente WHERE idevento =` + param[0] + ` AND identificacion = '` + param[1] + `'), 
 (SELECT id FROM camposevento WHERE idevento =` + param[2] + ` and nombre = '` + param[3] + `'),NULL,
 '`+ param[4] + `','` + param[5] + `')`;
        stringQuery = stringQuery.concat(query);
        stringQuery = stringQuery.concat(',');
        if (counter++ > 50000) break;
    }

    INSERT_ATTRIBUTE_ATTENDANT_MASSIVE = INSERT_ATTRIBUTE_ATTENDANT_MASSIVE.replace('%query%', stringQuery.slice(0, -1));

    callDatabase(INSERT_ATTRIBUTE_ATTENDANT, [], callback, processSingleResult);
}

/**
 * Delete event fields by storageId
 */
const DELETE_ATTRIBUTE_ATTENDANT_BY_STORAGE_ID = `DELETE FROM atributosasistente WHERE storage_id = $1;`
function deleteAttributeAttendantByStorage(params, callback) {
    callDatabase(DELETE_ATTRIBUTE_ATTENDANT_BY_STORAGE_ID, params, callback, processSingleResult);
}
/**
 * Return the next sequence
 */
const GET_VALUE_SEQUENCE = `select nextval('camposevento_id_seq');`
function getValueSequence(params, callback) {
    callDatabase(GET_VALUE_SEQUENCE, params, callback, processSingleResult);
}

/**
 * Insert data attributes for dinamics fields
 */
const INSERT_ALLOWED_VALUES = `INSERT INTO posiblesvalores(
    id, idcampo, valor, cantidadmaxima, storage_id)
    	VALUES (nextval('posiblesvalores_id_seq'), $1, $2, $3, $4) ;`
function insertAllowedValues(params, callback) {
    callDatabase(INSERT_ALLOWED_VALUES, params, callback, processSingleResult);
}

/**
 * Delete allowed values by storageId
 */
const DELETE_ALLOWED_VALUES_BY_STORAGE_ID = `DELETE FROM posiblesvalores WHERE storage_id = $1;`
function deleteAllowedValuesByStorage(params, callback) {
    callDatabase(DELETE_ALLOWED_VALUES_BY_STORAGE_ID, params, callback, processSingleResult);
}

/**
 * Generic Caller to Database
 * @param {*} query 
 * @param {*} params 
 * @param {*} callback 
 * @param {*} processResult 
 */
function callDatabase(query, params, callback, processResult) {
    var parameters = Object.keys(params).map(key => params[key]);
    db.query(query, parameters, (err, result) => {
        if (err) {
            console.log(err.message + 'Query:=> ' + query.substring(0, 200) + 'Params:=> ' + params);
            return callback(null, err.message);
        }
        return callback(processResult(result), err);
    });
}

/**
 * Generic Caller to Database
 * @param {*} query 
 * @param {*} params 
 * @param {*} callback 
 * @param {*} processResult 
 */
async function callDatabaseAsync(query, params, processResult) {
    var parameters = Object.keys(params).map(key => params[key]);
    try {
        var result = await db.queryAsync(query, parameters);
        console.log(result);
        return processResult(result);
    }
    catch (e) {
        return Promise.reject(e);
    }   

}

/**
 * Postprocess for single result
 * @param {*} result 
 */
function processSingleResult(result) {
    if (result.command === "UPDATE" || result.command === "DELETE") {
        return { "response": 200 };
    }
    return result.rows[0];
}
/**
 * Postprocess for multiple result
 * @param {*} result 
 */
function processMultipleResult(result) {
    return result.rows;
}


exports.getEvents = getEvents;
exports.getEvent = getEvent;
exports.insertEvent = insertEvent;
exports.insertZone = insertZone;
exports.getZoneByEvent = getZoneByEvent;
exports.deleteZone = deleteZone;
exports.insertStorage = insertStorage;
exports.getFilesByEvent = getFilesByEvent;
exports.updateEvent = updateEvent;
exports.insertAttendant = insertAttendant;
exports.getStorageByID = getStorageByID;
exports.updateStorage = updateStorage;
exports.deleteAttendantByStorage = deleteAttendantByStorage;
exports.insertEventFields = insertEventFields;
exports.deleteEventFieldsByStorage = deleteEventFieldsByStorage;
exports.insertAttributeAttendant = insertAttributeAttendant;
exports.deleteAttributeAttendantByStorage = deleteAttributeAttendantByStorage;
exports.deleteStorage = deleteStorage;
exports.deleteEvent = deleteEvent;
exports.getValueSequence = getValueSequence;
exports.insertAllowedValues = insertAllowedValues;
exports.deleteAllowedValuesByStorage = deleteAllowedValuesByStorage;
exports.deleteZoneByEvent = deleteZoneByEvent;