const logger = require('./Logger');
const mkdirp = require('mkdirp');
const fs = require('fs');
const OpenSubtitleParser = require('./OpenSubtitleParser');
const TVSubsParser = require('./TVSubsParser');
const SpringfieldParser = require('./SpringfieldParser');

let seriesName, folderName, patternName;
function init() {
    var argv = require('minimist')(process.argv.slice(2));
    logger.debug('Arguments', argv);
    if (!argv.name) {
        logger.warn("Name is required");
        return;
    }
    seriesName = argv.name;
    if (!argv.path) {
        folderName = seriesName.replace(/ /g, '_');
    }
    else {
        folderName = argv.path;
    }
    if (!fs.existsSync(folderName)) {
        mkdirp(folderName);
    }
    if (!argv.parseMethod) {
        logger.warn("Parse Method is required");
        return;
    }
    
    if (!argv.pattern) {
        patternName = "";
    }
    
    if ( argv.parseMethod === 'OST' ){
        if (!argv.UA) {
            logger.warn("User Agent is required for OST Parsing");
            return;
        }
    }

    switch(argv.parseMethod){
        case 'OST':
            OpenSubtitleParser(seriesName, folderName, patternName, argv.UA);
            break;
        case 'TVS':
            TVSubsParser(seriesName, folderName, patternName);
            break;
        case 'SP':
            SpringfieldParser(seriesName, folderName, patternName);
            break;
    }
}

init();