const OS = require('opensubtitles-api');

const pad = require('pad');
const async = require('async');
const imdb = require('imdb-api');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip');
const logger = require('./Logger');

let folderName, seriesName, patternName;
let OpenSubtitles;

function beginSearch(sName, fName, pName, userAgent) {
    OpenSubtitles = new OS(userAgent);
    seriesName = sName;
    folderName = fName;
    patternName = pName;
    searchSeries(seriesName, userAgent, function(){
        if ( patternName !== "" ){
            checkOccurrences(patternName, folderName);
        }
    });
}

function checkOccurrences(patternName, folderName, cmdType) {
    let grepCmd;
    switch(cmdType){
        case 'Count':
            grepCmd = "grep -i '" + patternName + "' " + folderName + "/* | wc -l ";
            break;
        case 'Time':
            grepCmd = "grep -i -B 3 '" + patternName + "' " + folderName + "/* | grep '\\-\\->' ";
            break;
        default:
            grepCmd = "grep -i '" + patternName + "' " + folderName + "/* ";
            break;
    }
    const exec = require('child_process').exec;
    logger.info("[checkOccurances] => Running grepCmd", grepCmd);
    exec(grepCmd, function(error, stdout, stderr) {
        if ( stderr ){
            logger.error("Error during grep ", stderr);
            return;
        }
        logger.info("Occurrences \n",stdout);
    });
}

function searchSeries(seriesName, userAgent, cb) {
    imdb.get(seriesName, (err, results) => {
        if (err) {
            logger.error(err);
        }
        
        results.episodes().then((episodes) => {
            async.eachSeries(episodes, function(episode, callback) {
                let query = seriesName + " S" + pad(2, episode.season, "0") + "E" + pad(2, episode.episode, "0");
                searchSubs(query, function(){
                    callback();    
                });
            }, function(err) {
                if (err) {
                    throw err;
                }
                logger.info('Completed Parsing episodes');
                cb();
            });
        });
    });
}


function searchSubs(query, onComplete) {
    logger.info("Checking query" + query);
    OpenSubtitles.search({
        sublanguageid: "eng",
        gzip: true,
        limit: 1,
        query: query
    }).then(subtitles => {
        if (subtitles && typeof subtitles !== 'undefined') {
            if ( !subtitles.en ){
                logger.error("No english subtitles found for", query);
                onComplete();
                return;
            }
            request({
                url: subtitles.en[0].url,
                encoding: null
            }, (error, response, data) => {
                if (error) {
                    logger.error("Error during parsing subs for", query);
                    logger.error(error);
                    throw error;
                }
                
                try {
                    require('zlib').unzip(data, (error, buffer) => {
                        if (error) {
                            logger.error("Error during unzipping subs for", query);
                            logger.error(error);
                            alternateZip(data, subtitles.en[0].filename);
                            throw error;
                        }
                        let zipFile = folderName + "/" + subtitles.en[0].filename;
                        fs.writeFileSync(zipFile, buffer.toString('utf-8'));
                        onComplete();
                    });
                }
                catch (e) {
                    logger.error("Exception while writing subs for", query);
                    logger.error(e);
                    throw e;
                }
                
            });
        }
        else {
            logger.error("No subtitles found for", query);
            onComplete();
        }
    });

}

function alternateZip(data, filename){
    let zipFile = folderName + "/" + filename;
    fs.writeFileSync(zipFile, data);
    fs.createReadStream(zipFile).pipe(unzip.Extract({
        path: folderName
    })).on('close', function(){
        fs.unlinkSync(zipFile);
    });
}

module.exports = beginSearch;