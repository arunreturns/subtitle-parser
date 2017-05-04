var winston = require('winston');
var dateFormat = require('dateformat');
var colors = require('colors');
var pad = require('pad');

var levelColors = {
    info: colors.green,
    debug: colors.blue,
    warn: colors.yellow,
    error: colors.red
};

var formatter = function(options) {
    // Return string will be passed to logger.
    var dateString = levelColors[options.level]("<" + options.timestamp() + ">");
    var logLevel = levelColors[options.level]("[" + pad(5, options.level.toUpperCase()) + "]");
    var messageString = levelColors[options.level](options.message ? options.message : '');
    return dateString + ' ' + logLevel + ' ' + messageString + 
        (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
};

var getTime = function(){
    var date = Date.now();
    return dateFormat(date, "dd-mmm-yyyy HH:MM");
};

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            json: false,
            timestamp: getTime,
            formatter: formatter
        })/*,
        new winston.transports.File({
            timestamp: getTime,
            filename: __dirname + '/info.log',
            json: false
        })*/
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            json: false,
            timestamp: getTime,
            formatter: formatter
        })/*,
        new winston.transports.File({
            timestamp: getTime,
            filename: __dirname + '/exception.log',
            json: false
        })*/
    ],
    exitOnError: false
});

module.exports = logger;