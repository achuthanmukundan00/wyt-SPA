// Runs before the page is drawn. An address that names a band (#playback:dnj)
// must open on that band, not on the entry and then move there: until main.js
// has set the band, styles.css keeps the page hidden and still.
(function () {
  var hash = location.hash;
  if (hash && hash !== '#' && hash !== '#home') document.documentElement.setAttribute('data-boot', '');
})();
