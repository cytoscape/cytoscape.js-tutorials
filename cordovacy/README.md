[API requests to Wikipedia for links](https://www.mediawiki.org/wiki/API:Links)
Ex: `https://en.wikipedia.org/w/api.php?action=query&titles=Albert%20Einstein&prop=links&format=json`

Page titles returned will need to have URL encoded (`https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent`).
Once encoded, they should be available for qTip (mobile web display) and clicking to get their links. 