module.exports = {
    "extends": 'google',
    "installedESLint": true,
    "rules": {
        'linebreak-style': [0, 'unix'], // don't complain about CRLF; Git handles the conversion.
		'object-curly-spacing': [2, 'always']
    },
    "env": {
        'browser': true,
        'node': true,
        'jquery': true
    },
    "globals": {
        'cytoscape': false,
        'GlyElements': false
    }
};