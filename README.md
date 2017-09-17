Webpack Fingerprint Plugin
====================

This plugin will generate list of node modules (along with their version and licence)
which were imported into the bundle and place it in an JSON file

The most common usage will be for tracking what versions are deployed with current version
of your application and tracking their licenses for legal requirements.

## Installation

The plugin is available via [npm](https://www.npmjs.com/package/webpack-fingerprint):

```
$ npm install --save webpack-fingerprint
```

## Examples

### Basic

```js
var WebpackFingerprint = require("webpack-fingerprint");

module.exports = {
  plugins: [    
    new WebpackFingerprint({
      filename: "fingerprint.json" // Default
    })
  ]
}
```

Will produce a file called `fingerprint.json` with following info:

```js
{
  "date": "2017-09-17T15:56:50.468Z",
  "version": "1.0.0",
  "buildId": "123",
  "packages": {
    "babel-loader": {
      "version": "7.1.2",
      "license": "MIT"
    }
    "react": {
      "version": "15.6.1",
      "license": "BSD-3-Clause"
    }
    "react-dom": {
      "version": "15.6.1",
      "license": "BSD-3-Clause"
    }
  }
}
```

### Custom information

You can provide additional information to also be stored in the resulting file. To do so, pass a `additional` field on the configuration object.

```js
var WebpackFingerprint = require("webpack-fingerprint");

module.exports = {
  plugins: [    
    new WebpackFingerprint({
      additional: {
        build_number: process.env.CI_BUILD_NUMBER
      }
    })
  ]
}
```
