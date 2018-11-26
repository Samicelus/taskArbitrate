const fs = require('fs');
const path = require('path');

class loader{
    constructor(import_path){
        this._relative_path = import_path;
        this._path = path.relative(process.cwd(), import_path);
        this.handlers = {};
        function joinPath() {
            return process.cwd()+path.sep+path.join.apply(path, arguments);
        };
        let fsPath = joinPath(this._path);
        function load_require(temp_path, cl){
            fs.readdirSync(temp_path).forEach(function(name){
                let info = fs.statSync(path.join(temp_path, name));
                if(info.isDirectory()){
                    cl.handlers[name] = load_require(joinPath(temp_path, name), cl)
                }else{
                    let ext = path.extname(name);
                    let base = path.basename(name, ext);
                    if (require.extensions[ext]) {
                        cl.handlers[base] = require(path.join(temp_path, name));
                    } else {
                        console.log('cannot require '+name);
                    }
                }
            })
        }
        load_require(fsPath, this);
    }
}

module.exports = loader;