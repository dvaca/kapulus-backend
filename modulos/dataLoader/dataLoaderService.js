/**
 * File to expose service to dataUpload
 *
 * Usage: Rest Service
 *
 * @author Ricardo Carvajal <rikardocarvajal@gmail.com>
 * @license kapulus
 */
var index = require('../../src/index');
var app = index.app;
var router = index.router;
var constant = require('./dataLoaderProperties');
var dataLoader = require('./dataLoader');
const path = require("path");
var fs = require('fs')
var express = require('express');
const multer = require("multer");
var applicationData = require('../../database/applicationDataFacade');
var constant = require('./dataLoaderProperties');
const storagePath = constant.PROPERTIES.fileSystemPath;

/**
 * Multer Storage configuration
 */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storagePath);
    },
    filename: function (req, file, cb) {
        var originalname = file.originalname;
        var extension = originalname.split(".");
        filename = originalname + Date.now() + '.' + extension[extension.length - 1];
        filename = uuidv4() + '.' + extension[extension.length - 1];
        cb(null, filename);
    }
});

/**
 * Multer configuratiòn for images
 */
const uploadImage = multer({
    storage: storage,
    dest: storagePath,
    limits: {
        files: 5, // allow up to 5 files per request,
        fieldSize: 2 * 1024 * 1024 // 2 MB (max file size)
    },
    fileFilter: (req, file, cb) => {
        // allow images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|jfif)$/)) {
            return cb(new Error('Only image are allowed.'), false);
        }
        cb(null, true);
    }
});

/**
 * Multer configuratiòn for csv
 */
const uploadCSV = multer({
    storage: storage,
    dest: storagePath,
    limits: {
        files: 5, // allow up to 5 files per request,
        fieldSize: 5 * 1024 * 1024 // 2 MB (max file size)
    },
    fileFilter: (req, file, cb) => {
        // allow images only
        if (!file.originalname.match(/\.(csv)$/)) {
            return cb(new Error('Only CSV files are allowed.'), false);
        }
        cb(null, true);
    }

});


app.post('/uploadCSV', uploadCSV.single('file'), async (req, res) => {
    try {
        const avatar = req.file;
        var eventId = req.body.event;
        // make sure file is available
        if (!avatar) {
            res.status(400).send({
                status: false,
                data: 'No file is selected.'
            });
        } else {
            //send response
            //update storage database
            //storage_id, original_name, event_id, create_date
            var params = [filename.split('.')[0], req.file.originalname, eventId, new Date(), filename.split('.')[1]];

            dataLoader.insertStorage(params, (result, err) => {
                if (err) {
                    throw err;
                }
                res.send({
                    status: true,
                    message: 'File is uploaded.',
                    data: {
                        name: avatar.originalname,
                        mimetype: avatar.mimetype,
                        size: avatar.size
                    }
                });
            });

        }

    } catch (err) {
        res.status(500).send(err);
    }
});




app.post('/v2/processFile', (req, res) => {
    var extension = req.body.extension;
    var eventId = req.body.eventId;
    var storageId = req.body.storageId;
    dataLoader.processFile(eventId, storageId, extension, ';', (result, err) => {
        if (err) {
            return res.send(err);
        }
        else {
            return res.send(result);
        }
    });
});

// app.post('/v2/events', (req, res, next) => {
//     var response = {};
//     applicationData.insertEvent(req.body, (events, error) => {
//         console.log(req.params);
//         if (error) {
//             return next(error);
//         }
//         response = events;
//         if (response != undefined) {
//             createDefaultZone(response.id);
//         }
//         return res.send(response);
//     });
// });

app.put('/v2/eventFields/:event', (req, res, next) => {
    var response = {};
    dataLoader.loadFieldsEvent({"event_id":req.params.event}, req.body.settings);
    return res.send(response);
});


function createDefaultZone(idEvent) {
    var params = [];
    params.push(idEvent);
    params.push('PRINCIPAL');
    params.push(0);
    params.push(0);
    params.push(0);
    params.push(null);

    applicationData.insertZone(params, (events, error) => {
        if (error) console.log(error);
    });
}

app.put('/v2/events/:event', (req, res, next) => {
    applicationData.updateEvent(req.body, (result, error) => {
        console.log(req.params);
        if (error) {
            return res.send(error);
        }
        else {
            return res.send(result);
        }
    });
});

/**
 * Save the .CVS data to database
 */
router.post('/v2/toDatabase', async (req, res, next) => {
    var response = {};
    var storage_id = req.body.storageId;
    await dataLoader.toDatabase(storage_id, async (result, error) => {
        if (error) {
            res.status(500).send({status:500, message: error.Error.message, type:'internal'});
        } else if (!result) {
            return res.status(404).json();
        }
        else {
            console.log(result);
            return res.status(200).json(result);
        }
    });
});

/**
 * Revert the file upload
 */
app.post('/v2/deleteDataLoaded', (req, res, next) => {
    var response = {};
    var storage = req.body;
    dataLoader.deleteDataLoaded(storage, (result, error) => {
        if (error) {
            res.status(500).json(error);
        } else if (!result) {
            res.status(404).json();
        }
        else {
            console.log(result);
            return res.status(200).json(result);
        }
    });
});

/**
 * Revert the file upload
 */
app.delete('/v2/storages/:storage', (req, res, next) => {
    var response = {};
    applicationData.deleteStorage(req.params, (result, error) => {
        if (error) {
            return next(error);
        }
        response = result;
        console.log(response);
        return res.send(response);
    });
});


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

app.use('/static', express.static(storagePath));
