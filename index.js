const path = require('path');
const fs = require('fs');

function WebpackFingerprint(opts) {
  opts = opts || {};
  this.opts = Object.assign({
    filename: "fingerprint.json",
    additional: opts.additional || {},
  }, opts);
  
}

WebpackFingerprint.prototype.apply = function(compiler) {
  var self = this;

  compiler.plugin('done', function(data) {
    const stats = Object.assign({}, {
      date: new Date(),
      version: '',
    }, self.opts.additional, { packages: {} });

    const projectPackageJson = path.resolve(path.join('./', 'package.json'));    
    if(fs.existsSync(projectPackageJson)) {
      const package = require(projectPackageJson);
      stats.version = package.version
    }

    Object.values(data.compilation._modules).forEach(module => {
      const modulePath = module.portableId;
      if(modulePath.indexOf('node_modules') === 0) {      
        const [_, moduleName, ...rest] = path.parse(modulePath).dir.split('/');
        if(typeof stats.packages[moduleName] !== 'undefined') return;
        const packageJson = path.join(moduleName, 'package.json');
        if(fs.existsSync(path.join('node_modules', packageJson))) {
          const package = require(packageJson);
          stats.packages[moduleName] = {
            version: package.version,
            license: package.license
          }            
        }
        else {
          stats.packages[moduleName] = {
            version: 'unknown',
            license: 'unknown'
          }
        }
      }
    })
    fs.writeFile(self.opts.filename, JSON.stringify(stats, null, 2), function(err) {
      if(err) console.warn("Unable to write fingerprint file", err);
    })
  });
};

module.exports = WebpackFingerprint;