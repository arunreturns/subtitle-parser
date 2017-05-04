const pad = require('pad');
const async = require('async');
const imdb = require('imdb-api');
const request = require('request');
const fs = require('fs');
const logger = require('./Logger');
const cheerio = require('cheerio')

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

function searchSeries(seriesName, cb) {
    imdb.get(seriesName, (err, results) => {
        if (err) {
            logger.error(err);
        }
        
        results.episodes().then((episodes) => {
            async.eachSeries(episodes, function(episode, callback) {
                let episodeName = "S" + pad(2, episode.season, "0") + "E" + pad(2, episode.episode, "0");
                searchSubs(seriesName.toLowerCase(), episodeName.toLowerCase(), function(){
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

const Entities = require('html-entities').XmlEntities;
 
const entities = new Entities();

function searchSubs(seriesName, episodeName, onComplete) {
    seriesName = formatName(seriesName);
    episodeName = formatName(episodeName);
    logger.debug("Checking seriesName " + seriesName);
    logger.debug("Checking episodeName " + episodeName);
    let requestUrl = "http://www.springfieldspringfield.co.uk/view_episode_scripts.php?tv-show=" + seriesName + "&episode=" + episodeName;
    logger.info("Checking requestUrl " + requestUrl);
    request(requestUrl, (error, response, data) => {
        const $ = cheerio.load(data);
        let content = $('.scrolling-script-container').html();
        if ( content === null || typeof content === 'undefined' ){
            logger.error("No data found for " + seriesName + "-" + episodeName);
        } else {
            var regex = /<br\s*[\/]?>/gi;
            let fileToWrite = folderName + "/" + seriesName + "-" + episodeName + ".txt";
            fs.writeFileSync(fileToWrite, entities.decode(content.replace(regex, "\n")));
        }
        onComplete();
    });
    
}

function formatName(name){
    name = name.replace(/ /g, '-');
    name = name.toLowerCase();
    return name;
}

module.exports = beginSearch;