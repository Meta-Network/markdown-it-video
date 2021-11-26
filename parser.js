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

module.exports = {
  youtubeParser,
  vimeoParser,
  vineParser,
  preziParser,
  mfrParser
}