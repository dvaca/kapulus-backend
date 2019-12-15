/**
* Service to event management.
*
*
* Usage: Rest Service
*
* @author Ricardo Carvajal <rikardocarvajal@gmail.com>
* @license kapulus
*/
var index = require('../../src/index');
var applicationData = require('../../database/applicationDataFacade');
var app = index.app;

/**
 * Return allEvents event information
 */
app.get('/v2/events/', (req, res, next) => {
    var response = {};
    applicationData.getEvents(req.params, (events, error) => {
        if (error) {
            return next(error);
        }
        response = events;
        return res.send(response);
    });
});

/**
 * Return the event information
 */
app.get('/v2/events/:idevento', (req, res, next) => {
    var response = {};
    applicationData.getEvent(req.params, (events, error) => {
        if (error) {
            return next(error);
        }
        response = events;
        return res.send(response);
    });
});

/**
 * Create events
 */
app.post('/v2/events', (req, res, next) => {
    var response = {};
    applicationData.insertEvent(req.body, (events, error) => {
        console.log(req.params);
        if (error) {
            return next(error);
        }
        response = events;
        if (response != undefined) {
            createDefaultZone(response);
        }
        return res.send(response);
    });
});

/**
 * update events
 */
app.put('/v2/events', (req, res, next) => {
    var response = {};
    applicationData.updateEvent(req.body, (events, error) => {
        console.log(req.params);
        if (error) {
            return next(error);
        }
        response = events;
        
        return res.send(response);
    });
});


function createDefaultZone(idEvent) {
    var params = [];
    params.push(idEvent);
    params.push('PRINCIPAL');
    params.push(0);
    params.push(0);
    params.push(0);
    params.push(null);

    applicationData.insertZone(req.body, (events, error) => {
        if (error) {
            return next(error);
        }
    });
}

async function deleteDefaultZone(params){

    applicationData.deleteZoneByEvent(params, (res,err) =>{
        if (err) {
            return err;
        }
        else{
            return res;
        }
    });
}


/**
 * Delete the event 
 */
app.delete('/v2/events/:idevento', async(req, res, next) => {
    var response = {};
    await deleteDefaultZone(req.params);
    applicationData.deleteEvent(req.params, (events, error) => {
        console.log(events);
        if (error) {
            return next(error);
        }
        response = events;
        return res.send(response);
    });
});

/**
 * Return the event information
 */
app.get('/v2/files/:idevento', (req, res, next) => {
    var response = {};
    applicationData.getFilesByEvent(req.params, (events, error) => {
        console.log(events);
        if (error) {
            return next(error);
        }
        response = events;
        return res.send(response);
    });
});

/**
 * Return the event information
 */
app.get('/v2/zones/:idevento', (req, res, next) => {
    var response = {};
    applicationData.getZoneByEvent(req.params, (zone, error) => {
        console.log(zone);
        if (error) {
            return next(error);
        }
        response = zone;
        return res.send(response);
    });
});


