var tvsubs = require('tv-subs');
var request = require('request');
var fs = require('fs');
var unzip = require('unzip');

var logger = require('./Logger');
logger.transports.console.level = 'warn';

let folderName, seriesName, patternName;

function beginSearch(sName, fName, pName) {
    seriesName = sName;
    folderName = fName;
    patternName = pName;
    searchSeries(seriesName, function(){
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

function downloadSubtitles(downloadUrl) {
    logger.warn("[downloadSubtitles] URL:", downloadUrl);
    request({
        url: downloadUrl,
        encoding: null
    }, (error, response, data) => {
        if (error) throw error;
        let fileName = downloadUrl.substring(downloadUrl.lastIndexOf("/") + 1);
        logger.info("[downloadSubtitles] Saving to file", fileName);
        let zipFile = folderName + "/" + fileName;
        fs.writeFileSync(zipFile, data);
        fs.createReadStream(zipFile).pipe(unzip.Extract({
            path: folderName
        })).on('close', function(){
            fs.unlinkSync(zipFile);
        });
    });
}


function getEpisodeData(episodes) {
    for ( let i = 0; i < episodes.length; i++ ){
        let episode = episodes[i];
        logger.info("[getEpisodeData] Downloading", episode.path);
        tvsubs.episode(episode.path).then(function(subtitles) {
            //logger.info(subtitles);
            for (let i = 0; i < subtitles.length; i++) {
                let subtitle = subtitles[i];
                if (subtitle.lang === 'English') {
                    logger.info("[getEpisodeData] Downloading", subtitle);
                    downloadSubtitles(subtitle.download);
                    break;
                }
            }
        }).catch(function(err) {
            logger.error(err);
        });
    }
}

function getSeasonList(seasons) {
    for ( let i = 0; i < seasons.length; i++ ){
        let season = seasons[i];
        logger.info("[getSeasonList] Season", season.path);
        tvsubs.season(season.path).then(function(data) {
            logger.info("[getSeasonList] Season Details", data);
            getEpisodeData(data);
        }).catch(function(err) {
            logger.error(err);
        });
    }
}

function getShowDetail(value) {
    logger.info("[getShowDetail] Getting Details for", value);
    tvsubs.detail(value).then(function(data) {
        logger.info("[getShowDetail] Show Details", data);
        getSeasonList(data.season);
    }).catch(function(err) {
        logger.error(err);
    });
}

function searchSeries(queryInput) {
    tvsubs.search(queryInput).then(function(seriesList) {
        logger.info(seriesList);
        seriesList.map((series) => {
            getShowDetail(series.value);
        });
    }).catch(function(err) {
        logger.error(err);
    });
}

module.exports = beginSearch;