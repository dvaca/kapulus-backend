/**
 * Factory to abstract the database source
 */
var db = require('./applicationDataPostgresql');


function getEvents(params, callback){
    db.getEvents(params, callback);
}

function getEvent(params, callback){
    db.getEvent(params, callback);
}

function insertEvent(params, callback){
    db.insertEvent(params, callback);
}

function insertStorage(params, callback){
    db.insertStorage(params, callback);
}

function getFilesByEvent(params, callback){
    db.getFilesByEvent(params, callback);
}

async function updateEvent(params,callback){
    db.updateEvent(params,callback);
}

function insertAttendant(params, callback){
    db.insertAttendant(params,callback);
}

function getStorageByID(params, callback){
    db.getStorageByID(params, callback);
}

function insertZone(params, callback){
    db.insertZone(params, callback);
}

function getZoneByEvent(params, callback){
    db.getZoneByEvent(params, callback);
}

function deleteZone(params, callback){
    db.deleteZone(params, callback);
}

async function deleteAttendantByStorage(params, callback){
    db.deleteAttendantByStorage(params,callback);
}

async function insertEventFields(params, callback){
    db.insertEventFields(params, callback);
}

async function deleteEventFieldsByStorage(params, callback){
    db.deleteEventFieldsByStorage(params, callback);
}

async function insertAttributeAttendant(params,callback){
    db.insertAttributeAttendant(params, callback);
}

async function deleteAttributeAttendantByStorage(params,callback){
    db.deleteAttributeAttendantByStorage(params,callback);
}

function deleteStorage(params, callback){
    db.deleteStorage(params, callback);
}

function deleteEvent(params, callback){
    db.deleteEvent(params, callback);
}

async function getValueSequence(params, callback){
    db.getValueSequence(params, callback);
}

async function insertAllowedValues(params,callback){
    db.insertAllowedValues(params,callback);
}

async function deleteAllowedValuesByStorage(params,callback){
    db.deleteAllowedValuesByStorage(params,callback);
}

function deleteZoneByEvent(params,callback){
    db.deleteZoneByEvent(params,callback);
}

exports.getEvents = getEvents;
exports.getEvent = getEvent;
exports.insertEvent = insertEvent;
exports.insertZone = insertZone;
exports.insertStorage = insertStorage;
exports.deleteZone = deleteZone;
exports.getFilesByEvent = getFilesByEvent;
exports.updateEvent = updateEvent;
exports.insertAttendant = insertAttendant;
exports.getStorageByID = getStorageByID;
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
exports.getZoneByEvent = getZoneByEvent;
exports.deleteZoneByEvent = deleteZoneByEvent;

