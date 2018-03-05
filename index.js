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

WebpackFingerprint.prototype.apply = function (compiler) {
  var self = this;

  compiler.plugin('done', function (data) {
    const stats = Object.assign({}, {
      date: new Date(),
      hash: data.hash,
      version: '',
    }, self.opts.additional, { packages: {} });

    if(!self.opts.additional.version){
      const projectPackageJson = path.resolve(path.join('./', 'package.json'));
      if (fs.existsSync(projectPackageJson)) {
        const package = require(projectPackageJson);
        stats.version = package.version
      }
    }

    Object.values(data.compilation._modules).forEach(module => {
      const modulePath = module.portableId;
      
      // Initial support for webpack 1.x syntax
      if (!modulePath && Array.isArray(module.dependencies)) {
        module.dependencies.forEach(dependency => {
          if (!dependency.module) return;
          if (dependency.module.context && dependency.module.context.indexOf('node_modules') !== -1) {
            const modulePath = path.parse(dependency.module.context.split('node_modules' + path.sep)[1]);
            
            const [moduleName, ...rest] = (modulePath.dir !== '' ? modulePath.dir : modulePath.base).split(path.sep);
            if (typeof stats.packages[moduleName] !== 'undefined') return;
            const packageJson = path.join(moduleName, 'package.json');
            if (fs.existsSync(path.join('node_modules', moduleName)) && fs.existsSync(path.join('node_modules', packageJson))) {
              const package = require(packageJson);
              const result = self.opts.transformer(package);
              if (result) stats.packages[moduleName] = result;
            }
            else {
              stats.packages[moduleName] = {
                version: 'unknown',
                license: 'unknown'
              }
            }
          }
        })
      }

      if (modulePath && modulePath.indexOf('node_modules') === 0) {
        const [_, moduleName, ...rest] = path.parse(modulePath).dir.split('/');
        if (typeof stats.packages[moduleName] !== 'undefined') return;
        const packageJson = path.join(moduleName, 'package.json');
        if (fs.existsSync(path.join('node_modules', packageJson))) {
          const package = require(packageJson);
          const result = self.opts.transformer(package);
          if (result) stats.packages[moduleName] = result;
        }
        else {
          stats.packages[moduleName] = {
            version: 'unknown',
            license: 'unknown'
          }
        }
      }
    })
    if (Object.values(stats.packages).length === 0) {
      delete stats.packages;
    }
    fs.writeFileSync(self.opts.filename, JSON.stringify(stats, null, 2), function (err) {
      if (err) console.warn("Unable to write fingerprint file", err);
    })
  });
};

module.exports = WebpackFingerprint;