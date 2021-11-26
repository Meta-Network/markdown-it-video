// "fileID=1778&appID=bxhs" => { fileID: '1778', appID: 'bxhs' }
// function name parseParams

module.exports = {
  parseParams: (search) => {
    const ret = {};
    const seg = search.replace(/^\?/, '').split('&');
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
  },
  extractVideoParameters: (url) => { 
    const parameterMap = new Map();
    const params = url.replace(/&amp;/gi, '&').split(/[#?&]/);

    if (params.length > 1) {
      for (let i = 1; i < params.length; i += 1) {
        const keyValue = params[i].split('=');
        if (keyValue.length > 1) parameterMap.set(keyValue[0], keyValue[1]);
      }
    }
    return parameterMap;
  },
  randomString: (length, chars) => {
    let result = '';
    let i = length;
    for (i; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}