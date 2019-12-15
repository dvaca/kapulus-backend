var fs = require('fs');
var constant = require('./dataLoaderProperties');
var csvFile = './test-data.csv';
var separator = constant.PROPERTIES.characterSeparator;
var fileResume = {};
var applicationData = require('../../database/applicationDataFacade');


console.log('loadData');
//processFile(csvFile,separator);

/**
 * Read and process the csvFile
 * @param {*} csvFile
 * @param {*} separator
 */
function processFile(eventId, storageId, extension, separator, callback) {
    var settings = {};
    try {
        var csvFile = constant.PROPERTIES.fileSystemPath + '/' + storageId +
            '.' + extension;
        var csv = fs.readFile(csvFile, { encoding: 'utf-8' }, function (err, data) {
            if (err) {
                callback.err = err;
            }
            //Remove byte order mark" o BOM
            data = data.replace(/^\uFEFF/, "");
            var dataArray = data.toString().split("\n");
            //extract the data in columns
            if (dataArray.length > 0) {
                var columnsNameArray = dataArray[0].split(separator);
                fileResume['validColumns'] = extractColumns(columnsNameArray, camelize).validColumns;
                fileResume['invalidColumns'] = extractColumns(columnsNameArray, camelize).invalidColumns;
            }
            //remove the first columns name row
            dataArray.shift();
            var cleanArray = removeInvalidRows(dataArray);

            extractData(fileResume.validColumns, cleanArray, (result, error) => {
                data = result;
                fileResume.totalRows = dataArray.length;
                fileResume.validRows = Object.keys(data).length;

                saveSettings(eventId, fileResume, storageId);
                console.log('Total Rows:' + fileResume.totalRows);
                callback({ "resume": fileResume, "data": data }, null);
            });


        });
    } catch (err) {
        callback(null, err);
    }
}

/** Save the file settings info */
function saveSettings(eventId, settings, storageId) {

    applicationData.getEvent([eventId], (event, err) => {
        var oldSettings = {};
        var oldMergeColumn = [];
        var mergeColumns = [];
        if (event.settings == null || event.settings == "") {
            oldSettings = {}
        }
        else {
            oldSettings = JSON.parse(event.settings);
            oldMergeColumn = oldSettings.mergeColumns;
        }
        //add de current configuration file
        oldSettings[storageId] = settings;
        // merge the columns and load the current configuration 
        Object.keys(oldSettings).map(file => {
            if (file != 'mergeColumns') {
                var order = 0;
                oldSettings[file].validColumns.map(validColumn => {
                    currentColumn = oldMergeColumn.filter(filterColumn => filterColumn.name == validColumn.name);
                    var mergeColumn = {};
                    if (currentColumn.length > 0) {
                        mergeColumn = currentColumn[0];
                    }
                    else {
                        mergeColumn.id = false;
                        mergeColumn.filter = false;
                        mergeColumn.statistics = false;
                        mergeColumn.required = false;
                        mergeColumn.name = validColumn.name;
                        mergeColumn.description = validColumn.description;
                        mergeColumn.allowedValues = [];
                    }
                    //Duplicate control
                    existColumn = mergeColumns.filter(existColumn => existColumn.name == mergeColumn.name);
                    if (existColumn.length == 0) {
                        mergeColumn.index = order++;
                        mergeColumn.order = order;
                        mergeColumns.push(mergeColumn);
                    }
                });
            }
        });
        oldSettings.mergeColumns = mergeColumns;
        oldSettings[storageId].status = 'Procesado';
        event.settings = oldSettings;
        applicationData.updateEvent(event, (result, err) => {
            console.log('Save Settings' + result);
        });
    });
}

function getEventsAvailable(status) {
    var eventsAvailable = [];
    //if(status==procesado)
}



function removeInvalidRows(dataArray) {
    const regex = new RegExp('(^;+\\r)|(/^\s*$/)');
    return dataArray.filter(data => !data.match(regex));
}


/**
 * Valid the columns name in case to find invalid names.
 * @author Ricardo Carvajal
 * @param  {String} columnsNameArray Array with name columns from file
 *
 */
function extractColumns(columnsNameArray, columnNameConversor) {
    var columnsNameResult = {};
    var columnIndex = 0;

    var columnArray = columnsNameArray.map(x => {
        var column = {};
        column.index = columnIndex++;
        column.description = columnNameConversor(x);
        column.name = column.description.replace(/\s|\./g, '');
        return column;
    });

    var validColumns = columnArray.filter(x => !x.name.startsWith('\r') && x.name.length > 0)
    var invalidColumns = columnArray.filter(x => x.name.startsWith('\r') || x.name.length == 0)

    columnsNameResult.validColumns = validColumns;
    columnsNameResult.invalidColumns = invalidColumns;
    return columnsNameResult;
}

/**
 * Transform text in upper or lowercase in Camel
 * @param {} text
 */
var camelize = function toCamelCase(text) {
    var camel;
    camel = text.replace(/[^\w\s]/gi, 'X');
    //camel = text.replace(/[^a-zA-Z0-9]/g, '');
    camel.trim();
    camel = camel.substr(0, 1).toUpperCase() + camel.substr(1).toLowerCase();
    return camel;
}

/**
 * Extract the data and transform to JSON Object.
 * @author Ricardo Carvajal
 * @param  {String} columnsNameArray Array with name columns from file
 *
 */
function extractData(columns, dataArray, callback) {
    var result = [];
    dataArray.filter(x => !x.startsWith('\r') && x.length > 0);
    for (i in dataArray) {
        var obj = {};
        var currentline = dataArray[i].split(separator);
        for (var j = 0; j < columns.length; j++) {
            var index = columns[j].index;
            dataValue = currentline[index];
            if (dataValue != undefined) {
                //Limit value to upload
                if (dataValue.length > constant.PROPERTIES.maxValueSize) {
                    davaValue = dataValue.substring(0, constant.PROPERTIES.maxValueSize);
                }
            }
            obj[columns[index].name] = currentline[index];
        }
        result.push(obj);
    }
    callback(result, null);
}

/**
 * Load the configuration an data for process
 * @param {*} storageId
 * @param {*} callback
 */
async function toDatabase(storageId, callback) {
    applicationData.getStorageByID([storageId], (storage, err) => {
        if (err) {
            return (null, err)
        }
        else {
            applicationData.getEvent([storage.event_id], async (event, err) => {
                if (err) {
                    return (null, err)
                }
                else {
                    await getData(storage, async (data, err) => {
                        try {
                            var response = await load(data, storage, event);
                            // if(response!=undefined){
                            callback(response, null);
                            // }
                            var settings = JSON.parse(event.settings);
                            settings[storageId].status = 'Datos Cargados';
                            event.settings = settings;
                            applicationData.updateEvent(event, async (result, err) => {
                            });

                        }
                        catch (e) {
                            callback(null, { Error: e });
                        }
                    });
                }
            });
        }
    });
}

async function load(data, storage, event) {
    var result = {};
    try {
        var settings = JSON.parse(event.settings);
        await loadFieldsEvent(storage, settings);
        await loadAttendant(data, storage, event);
        result = await loadAttributeAttendant(data, storage, event);
        return result;
    }
    catch (e) {
        throw e;
    }

}

/**
 * Return the storage fileSystem data
 * @param {} storage
 * @param {*} event
 * @param {*} callback
 */
async function getData(storage, callback) {
    if (storage) {
        processFile(storage.event_id, storage.storage_id, storage.extension,
            constant.PROPERTIES.characterSeparator, async (result, err) => {
                if (err) {
                    return result.send(err);
                }
                else {
                    callback(result.data);
                }
            });
    } else {
        throw 'Invalid ID!';
    }
}

/**
 * Call to insert attendand data
 * id, tipoid, identificacion, idevento, registrado, preinscrito, actualizado, id_ticket,
 * autorizacion_pago, codigocontrolacceso, storage_id
 * @param {} dataCSV 
 * @param {*} storage 
 * @param {*} event 
 */
async function loadAttendant(dataCSV, storage, event) {
    settings = JSON.parse(event.settings);
    primaryColumn = settings.mergeColumns.filter(validColumn => validColumn.id == true);
    var primaryColumnName;
    try {
        primaryColumnName = primaryColumn[0].name;
        console.log("Primary Column" + JSON.stringify(primaryColumnName));
    }
    catch (e) {
        const error = new Error('No esta definida la columna ID');
        throw error;
    }
    dataCSV.map(data => {
        applicationData.insertAttendant([1, data[primaryColumnName], storage.event_id,
            false, false, false, 0, '', '', storage.storage_id], (res, err) => {
            });
    });
    return "sucess";

}

/**
 * Call to insert attendant attributes
 * @param {} dataCSV 
 * @param {*} storage 
 * @param {*} event 
 * INSERT INTO atributosasistente (idasistente, idcampo, idvalorseleccionado, valor)
    VALUE((SELECT id FROM asistente WHERE idevento = $1 AND identificacion = $2), 
      (SELECT id FROM camposevento WHERE idevento = $3 and nombre = $4),NULL,
      $5);`
 */
async function loadAttributeAttendant(dataCSV, storage, event) {

    var settings = JSON.parse(event.settings);
    primaryColumn = settings.mergeColumns.filter(validColumn => validColumn.id == true);
    var loadResult = { message: '', errors: 0, success: 0 };
    for (i = 0; i < dataCSV.length; i++) {
        var data = dataCSV[i];
        for (j = 0; j < settings.mergeColumns.length; j++) {
            column = settings.mergeColumns[j];
            var params = [];
            params.push(storage.event_id);
            params.push(data[primaryColumn[0].name]);
            params.push(storage.event_id);
            params.push(column.name);
            params.push(data[column.name]);
            params.push(storage.storage_id)
            try {
                var result = await applicationData.insertAttributeAttendant(params);
                if (loadResult.errors == 0) {
                    loadResult.message = "Datos Subidos Correctamente.";
                }
                loadResult.success++;
            }
            catch (e) {
                loadResult.message = "Los datos subieron con errores." + e;
                loadResult.errors++
                break;

            }
        };
    };
    return loadResult;

}




/**
 * Call to insert fields for Event
 *  idevento, nombre, tipodato, tipocampo, obligatorio, longitud, filtrar, estadisticas, 
    ordenimpresion, ordenregistro, ordenregistroweb, ordencargue, xescarapela, yescarapela, 
    tamanoescarapela, negritaescarapela, xcertificado, ycertificado, tamanocertificado, negritacertificado
 * @param {*} event 
 */
async function loadFieldsEvent(storage, settings) {
    

    await settings.mergeColumns.map(async (column, index) => {
        var params = [];

        params.push(parseInt(storage.event_id)); //idevento
        params.push(column.name); //nombre
        params.push(1); //tipodato
        if (column.allowedValues.length == 0) {
            params.push(1); //tipocampo
        }
        else {
            params.push(2); //tipocampo con valores opcionales
        }
        params.push(column.required); //obligatorio
        params.push(100); //longitud
        params.push(column.filter); //filtrar
        params.push(column.statistics); //estadisticas
        params.push(index); //ordenimpresion
        params.push(index); //ordenregistro
        params.push(index); //ordenregistroweb
        params.push(null); //ordencargue
        params.push(null); //xescarapela
        params.push(null); //yescarapela
        params.push(null); //tamanioescarapela
        params.push(null); //negritaescarapela
        params.push(null); //xcertificado
        params.push(null); //ycertificado
        params.push(null); //tamanocertificado
        params.push(null); //negritacertificado
        params.push(storage.storage_id);//storageId
        await insertAllowedValues(params, column, storage);

    });
    return { result: "fieldsEventSucess" };
}


insertAllowedValues = async function insertAllowedVales(paramsEventFields, column, storage) {
    var eventFieldId = await insertEventFields(paramsEventFields);

    var allowedValues = await column.allowedValues.map(allowedValue => {
        var params = [];
        if (allowedValue.name != "") {
            params.push(eventFieldId.id);//idcampo
            params.push(allowedValue.name)//valor
            params.push(0);//cantidadmaxima
            params.push(storage.storage_id);
            applicationData.insertAllowedValues(params, async (res, err) => {
                console.log(res);
            });
        }
    });
}

function insertEventFields(params) {
    return new Promise(resolve => {
        applicationData.insertEventFields(params, (res, err) => {
            resolve(res);
        });
    });
}


/**Delete Data Loaded */
async function deleteDataLoaded(storage, callback) {
    var status = { result: [] };
    var callbackResume = function callback(res, err) { };
    var storageId = storage.storageId.storage_id;
    var event = storage.storageId.event_id;
    await applicationData.deleteAttributeAttendantByStorage([storageId], callbackResume);
    await applicationData.deleteAttendantByStorage([storageId], callbackResume);
    await applicationData.deleteAllowedValuesByStorage([storageId], callbackResume);
    await applicationData.deleteEventFieldsByStorage([storageId], callbackResume);

    status.result.push("EventFields Table Deleted");
    var event;
    applicationData.getEvent([event], (res, err) => {

        var settings = JSON.parse(res.settings);
        settings[storageId].status = 'Procesado';
        res.settings = settings;
        applicationData.updateEvent(res, async (result, err) => {
            callback(status, null);
        });
    });
};


function insertStorage(params, callback) {

    applicationData.insertStorage(params, (res, err) => {
        if (err) {
            callback(null, err);
        }
        //processFile(params[2],params[0],params[4],constant.PROPERTIES.characterSeparator, callback);
        callback(res, null);
    });
}



exports.processFile = processFile;
exports.toDatabase = toDatabase;
exports.deleteDataLoaded = deleteDataLoaded;
exports.insertStorage = insertStorage;
exports.loadFieldsEvent = loadFieldsEvent;
