// Process @[youtube](youtubeVideoID)
// Process @[vimeo](vimeoVideoID)
// Process @[vine](vineVideoID)
// Process @[prezi](preziID)
// Process @[osf](guid)
// Process @[tcplay](fileID、appID)
// Process @[commonlink](url)
// Process {% videojs "source=url" %}

const ytRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
function youtubeParser(url) {
  const match = url.match(ytRegex);
  return match && match[7].length === 11 ? match[7] : url;
}

/* eslint-disable max-len */
const vimeoRegex = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
/* eslint-enable max-len */
function vimeoParser(url) {
  const match = url.match(vimeoRegex);
  return match && typeof match[3] === 'string' ? match[3] : url;
}

const vineRegex = /^http(?:s?):\/\/(?:www\.)?vine\.co\/v\/([a-zA-Z0-9]{1,13}).*/;
function vineParser(url) {
  const match = url.match(vineRegex);
  return match && match[1].length === 11 ? match[1] : url;
}

const preziRegex = /^https:\/\/prezi.com\/(.[^/]+)/;
function preziParser(url) {
  const match = url.match(preziRegex);
  return match ? match[1] : url;
}

// TODO: Write regex for staging and local servers.
const mfrRegex = /^http(?:s?):\/\/(?:www\.)?mfr\.osf\.io\/render\?url=http(?:s?):\/\/osf\.io\/([a-zA-Z0-9]{1,5})\/\?action=download/;
function mfrParser(url) {
  const match = url.match(mfrRegex);
  return match ? match[1] : url;
}

const EMBED_REGEX = new RegExp(/@\[([a-zA-Z].+)]\([\s]*(.*?)[\s]*[)]/im);
const VIDEOJS_REGEX = new RegExp(/{% (videojs) (.+?) %}/im);

function videoEmbed(md, options) {
  function videoReturn(state, silent) {
    var serviceEnd;
    var serviceStart;
    var token;
    var videoID;
    var theState = state;
    const oldPos = state.pos;
    let isVideojs = false;

    function regExClosureFn(regex) {
      // For the short-circuit operation predecessor logic.
      // eslint-disable-next-line no-unused-expressions
      regex.toString() === VIDEOJS_REGEX.toString() ? isVideojs = true : isVideojs = false;
      return regex;
    }

    if (
      (state.src.charCodeAt(oldPos) !== 0x40/* @ */ ||
        state.src.charCodeAt(oldPos + 1) !== 0x5B/* [ */) &&
      (state.src.charCodeAt(oldPos) !== 0x7B/*  { */ ||
        state.src.charCodeAt(oldPos + 1) !== 0x25/* % */)
    ) {
      return false;
    }

    const matchThing = state.src.slice(state.pos, state.src.length);

    // const match = EMBED_REGEX.exec(matchThing) || VIDEOJS_REGEX.exec(matchThing);
    const match = (regExClosureFn(EMBED_REGEX)).exec(matchThing) ||
      (regExClosureFn(VIDEOJS_REGEX)).exec(matchThing);

    if (!match || match.length < 3) {
      return false;
    }

    const service = match[1];
    videoID = match[2];
    const serviceLower = service.toLowerCase();

    if (serviceLower === 'youtube') {
      videoID = youtubeParser(videoID);
    } else if (serviceLower === 'vimeo') {
      videoID = vimeoParser(videoID);
    } else if (serviceLower === 'vine') {
      videoID = vineParser(videoID);
    } else if (serviceLower === 'prezi') {
      videoID = preziParser(videoID);
    } else if (serviceLower === 'osf') {
      videoID = mfrParser(videoID);
    } else if (serviceLower === 'videojs') {
      // videoID = videoID;
    } else if (serviceLower === 'tcplay' || serviceLower === 'commonlink') {
      // videoID = videoID;
    } else if (!options[serviceLower]) {
      return false;
    }

    // If the videoID field is empty, regex currently make it the close parenthesis.
    if (videoID === ')') {
      videoID = '';
    }

    serviceStart = oldPos + 2;
    serviceEnd = md.helpers.parseLinkLabel(state, oldPos + 1, false);

    //
    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //
    if (!silent) {
      theState.pos = serviceStart;
      theState.service = isVideojs ? 'videojs' : theState.src.slice(serviceStart, serviceEnd);
      const newState = new theState.md.inline.State(service, theState.md, theState.env, []);
      newState.md.inline.tokenize(newState);

      token = theState.push('video', '');
      token.videoID = videoID;
      token.service = service;
      token.url = match[2];
      token.level = theState.level;
    }
    // idont know what this is for
    // but it works...
    // TODO: research this.
    theState.pos += isVideojs ? 100 : theState.src.indexOf(')', theState.pos);
    return true;
  }

  return videoReturn;
}

function extractVideoParameters(url) {
  const parameterMap = new Map();
  const params = url.replace(/&amp;/gi, '&').split(/[#?&]/);

  if (params.length > 1) {
    for (let i = 1; i < params.length; i += 1) {
      const keyValue = params[i].split('=');
      if (keyValue.length > 1) parameterMap.set(keyValue[0], keyValue[1]);
    }
  }

  return parameterMap;
}

function videoUrl(service, videoID, url, options) {
  switch (service) {
    case 'youtube': {
      const parameters = extractVideoParameters(url);
      if (options.youtube.parameters) {
        Object.keys(options.youtube.parameters).forEach((key) => {
          parameters.set(key, options.youtube.parameters[key]);
        });
      }

      // Start time parameter can have the format t=0m10s or t=<time_in_seconds> in share URLs,
      // but in embed URLs the parameter must be called 'start' and time must be in seconds
      const timeParameter = parameters.get('t');
      if (timeParameter !== undefined) {
        let startTime = 0;
        const timeParts = timeParameter.match(/[0-9]+/g);
        let j = 0;

        while (timeParts.length > 0) {
          /* eslint-disable no-restricted-properties */
          startTime += Number(timeParts.pop()) * Math.pow(60, j);
          /* eslint-enable no-restricted-properties */
          j += 1;
        }
        parameters.set('start', startTime);
        parameters.delete('t');
      }

      parameters.delete('v');
      parameters.delete('feature');
      parameters.delete('origin');

      const parameterArray = Array.from(parameters, p => p.join('='));
      const parameterPos = videoID.indexOf('?');

      let finalUrl = 'https://www.youtube';
      if (options.youtube.nocookie || url.indexOf('youtube-nocookie.com') > -1) finalUrl += '-nocookie';
      finalUrl += '.com/embed/' + (parameterPos > -1 ? videoID.substr(0, parameterPos) : videoID);
      if (parameterArray.length > 0) finalUrl += '?' + parameterArray.join('&');
      return finalUrl;
    }
    case 'vimeo':
      return 'https://player.vimeo.com/video/' + videoID;
    case 'vine':
      return 'https://vine.co/v/' + videoID + '/embed/' + options.vine.embed;
    case 'prezi':
      return 'https://prezi.com/embed/' + videoID +
        '/?bgcolor=ffffff&amp;lock_to_path=0&amp;autoplay=0&amp;autohide_ctrls=0&amp;' +
        'landing_data=bHVZZmNaNDBIWnNjdEVENDRhZDFNZGNIUE43MHdLNWpsdFJLb2ZHanI5N1lQVHkxSHFxazZ0UUNCRHloSXZROHh3PT0&amp;' +
        'landing_sign=1kD6c0N6aYpMUS0wxnQjxzSqZlEB8qNFdxtdjYhwSuI';
    case 'osf':
      return 'https://mfr.osf.io/render?url=https://osf.io/' + videoID + '/?action=download';
    case 'videojs':
      return videoID;
    case 'tcplay':
    case 'commonlink':
      return videoID;
    default:
      return service;
  }
}

// "fileID=1778&appID=bxhs" => { fileID: '1778', appID: 'bxhs' }
function parseParams(search, symbol = '&') {
  const ret = {};
  const seg = search.replace(/^\?/, '').split(symbol);
  const len = seg.length;
  let s;
  for (let i = 0; i < len; i += 1) {
    if (!seg[i]) {
      continue;
    }
    s = seg[i].split('=');
    ret[s[0]] = s[1];
  }
  return ret;
}

// 从chars中随机生成length长度的字符串
function randomString(length, chars) {
  let result = '';
  let i = length;
  for (i; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function tokenizeVideo(md, options) {
  function tokenizeReturn(tokens, idx) {
    const videoID = md.utils.escapeHtml(tokens[idx].videoID);
    const service = md.utils.escapeHtml(tokens[idx].service).toLowerCase();
    var checkUrl = /http(?:s?):\/\/(?:www\.)?[a-zA-Z0-9-:.]{1,}\/render(?:\/)?[a-zA-Z0-9.&;?=:%]{1,}url=http(?:s?):\/\/[a-zA-Z0-9 -:.]{1,}\/[a-zA-Z0-9]{1,5}\/\?[a-zA-Z0-9.=:%]{1,}/;
    var num;

    if (service === 'osf' && videoID) {
      num = Math.random() * 0x10000;

      if (videoID.match(checkUrl)) {
        return '<div id="' + num + '" class="mfr mfr-file"></div><script>' +
          '$(document).ready(function () {new mfr.Render("' + num + '", "' + videoID + '");' +
          '    }); </script>';
      }
      return '<div id="' + num + '" class="mfr mfr-file"></div><script>' +
        '$(document).ready(function () {new mfr.Render("' + num + '", "https://mfr.osf.io/' +
        'render?url=https://osf.io/' + videoID + '/?action=download%26mode=render");' +
        '    }); </script>';
    } else if (service === 'tcplay' && videoID) {
      // 不使用格式化过的videoId
      // tokens[idx].videoID：fileID=xxx&appID=2728
      // videoID：fileID=xxx&amp;appID=2728
      const params = parseParams(tokens[idx].videoID);

      num = randomString(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') + Math.random().toString(36).slice(-10); // 8个英文随机字符 + 10个字母数字随机数字,id不能以数字为前缀
      return '<video id="' + num + '" preload="auto" playsinline webkit-playsinline x5-playsinline class="tcplay-file"></video><script>var ' +
        num + 'player;if(' + num + 'player) ' + num + 'player.dispose();function initTCPlayer(){' + num + 'player = new TCPlayer("' + num +
        '", { fileID: "' + params.fileID +
        '", appID: "' + params.appID +
        '", width: "' + (options[service].width) +
        '", height: "' + (options[service].height) +
        '", autoplay: false})};initTCPlayer(); </script>';
    } else if (service === 'videojs' && videoID) {
      const unsafeParams = parseParams(tokens[idx].videoID, ' ');
      const videoJSId = randomString(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') + Math.random().toString(36).slice(-10);
      const result = `<div>
      <video-js id="${videoJSId}" 
        class="${md.utils.escapeHtml(options.type || 'vjs-default-skin vjs-16-9')}" 
        controls 
        preload="${md.utils.escapeHtml(options.preload || 'auto')}" 
        width="${md.utils.escapeHtml(options.width || '100%')}" 
        height="${md.utils.escapeHtml(options.width || '350px')}">
        <source src="${encodeURI(unsafeParams.source)}" type="${md.utils.escapeHtml(options.type || 'application/x-mpegURL')}" />
      </video-js>
      <script>
        const ${videoJSId} = videojs('${videoJSId}', {
          html5: {
            hls: {
              overrideNative: true
            }
          }
        });
      </script>
      </div> `;
      return result;
    } else if (service === 'commonlink' && videoID) {
      const checkVideo = /^(http(s)?:\/\/).*\.(mp4|flv|ogg|avi|mov|wmv)$/;
      if (videoID.match(checkVideo)) {
        return '<video width="' + (options[service].width) +
          '" height="' + (options[service].height) +
          '" src="' + videoID + '" class="common-link-video" controls>您的浏览器不支持 HTML5 video 标签。</video>';
      }
      return videoID;
    }
    return videoID === '' ? '' :
      '<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item ' +
      service + '-player" type="text/html" width="' + (options[service].width) +
      '" height="' + (options[service].height) +
      '" src="' + options.url(service, videoID, tokens[idx].url, options) +
      '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
  }

  return tokenizeReturn;
}

const defaults = {
  url: videoUrl,
  youtube: { width: 640, height: 390, nocookie: false },
  vimeo: { width: 500, height: 281 },
  vine: { width: 600, height: 600, embed: 'simple' },
  prezi: { width: 550, height: 400 },
  osf: { width: '100%', height: '100%' },
  tcplay: { width: 640, height: 390 },
  videojs: { width: 640, height: 390 },
  commonlink: { width: 640, height: 390 },
};

module.exports = function videoPlugin(md, options) {
  var theOptions = options;
  var theMd = md;
  if (theOptions) {
    Object.keys(defaults).forEach(function checkForKeys(key) {
      if (typeof theOptions[key] === 'undefined') {
        theOptions[key] = defaults[key];
      }
    });
  } else {
    theOptions = defaults;
  }
  theMd.renderer.rules.video = tokenizeVideo(theMd, theOptions);
  theMd.inline.ruler.before('emphasis', 'video', videoEmbed(theMd, theOptions));
};
