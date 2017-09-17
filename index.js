const path = require('path');
const fs = require('fs');

function WebpackFingerprint(opts) {
  opts = opts || {};
  this.opts = Object.assign({
    filename: "fingerprint.json",
    additional: opts.additional || {},
    transformer: (package) => ({
      version: package.version,
      license: package.license
    })
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
          const result = self.opts.transformer(package);
          if(result) stats.packages[moduleName] = result;
        }
        else {
          stats.packages[moduleName] = {
            version: 'unknown',
            license: 'unknown'
          }
        }
      }
    })
    if(Object.values(stats.packages).length === 0) {
      delete stats.packages;
    }
    fs.writeFile(self.opts.filename, JSON.stringify(stats, null, 2), function(err) {
      if(err) console.warn("Unable to write fingerprint file", err);
    })
  });
};

module.exports = WebpackFingerprint;