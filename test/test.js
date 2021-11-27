/* eslint func-names: ["error", "never"] */
// var path = require('path');
// var generate = require('markdown-it-testgen');
var assert = require('assert');

function getMfrId(html) {
  return html.split('"')[1];
}

// describe('markdown-it-video', function () {
//   var md = require('markdown-it')({
//     html: true,
//     linkify: true,
//     typography: true,
//   }).use(require('../'));
//   generate(path.join(__dirname, 'fixtures/video.txt'), md);
// });

// describe('markdown-it-video: options', function () {
//   var md = require('markdown-it')({
//     html: true,
//     linkify: true,
//     typography: true,
//   }).use(require('../'), {
//     youtube: {
//       width: 640,
//       height: 390,
//       nocookie: true,
//       parameters: {
//         rel: 0,
//         fs: 0,
//         autoplay: 0,
//       },
//     },
//   });
//   var renderedHtml;

//   it('normal to nocookie', function () {
//     renderedHtml = md.render('@[youtube](youtube.com/v/0zM3nApSvMg)');
//     assert.equal(renderedHtml, '<p><div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item youtube-player" type="text/html" width="640" height="390" src="https://www.youtube-nocookie.com/embed/0zM3nApSvMg?rel=0&fs=0&autoplay=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div></p>\n');
//   });

//   it('overwrite parameter', function () {
//     renderedHtml = md.render('@[youtube](youtube.com/embed/0zM3nApSvMg?autoplay=1&rel=0)');
//     assert.equal(renderedHtml, '<p><div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item youtube-player" type="text/html" width="640" height="390" src="https://www.youtube-nocookie.com/embed/0zM3nApSvMg?autoplay=0&rel=0&fs=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div></p>\n');
//   });
// });

// Because the mfr iframe requires a random id these tests cannont be part of
// the markdown-it-testgen fixture
describe('markdown-it-mfr', function () {
  var md = require('markdown-it')({
    html: true,
    linkify: true,
    typography: true,
  }).use(require('../'));
  var renderedHtml;
  var id;
  it('tcplay success', function () {
    renderedHtml = md.render('@[tcplay](fileID=3701925919142100553&appID=1254222330)');
    id = getMfrId(renderedHtml);
    const str = '<p><video id="' + id + '" preload="auto" playsinline webkit-playsinline x5-playsinline class="tcplay-file"></video><script>var ' + id + 'player;if(' + id + 'player) ' + id + 'player.dispose();function initTCPlayer(){' + id + 'player = new TCPlayer("' + id + '", { fileID: "3701925919142100553", appID: "1254222330", width: "640", height: "390", autoplay: false})};initTCPlayer(); </script></p>\n';
    console.log('str', str);
    assert.equal(renderedHtml, str);
  });

  it('videojs', function () {
    renderedHtml = md.render('{% videojs source=https://d2zihajmogu5jn.cloudfront.net/advanced-fmp4/master.m3u8 %}');
    id = getMfrId(renderedHtml);

    console.log('str', renderedHtml);
    assert.equal(1, 1);
  });
});
