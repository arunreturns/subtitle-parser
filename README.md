# Subtitle Parser
This parses Subtitles/Scripts from three different sources

1. [OpenSubtitles](http://www.opensubtitles.org)
2. [TVSubs](http://www.tv-subs.com)
3. [Springfield! Springfield!](http://www.springfieldspringfield.co.uk/)

## Opensubtitles
  
  This requires a valid user agent. See [here](http://trac.opensubtitles.org/projects/opensubtitles/wiki/DevReadFirst)<br>
  Uses [opensubtitles-api](https://www.npmjs.com/package/opensubtitles-api)

## TVSubs
  
  No special requirement<br>
  Uses [tvsubs](https://www.npmjs.com/package/tv-subs)
  
## Springfield

  Text based page. The parser basically scrapes the page for the required content.
  
# How To Run
  node --harmony Parser.js --name "<Series Name>" --parseMethod [OST|TVS|SP] --pattern "<Text to Find>"
