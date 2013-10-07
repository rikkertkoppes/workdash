var Q = require('Q');
var fs = require('fs');
var xml2js = require('xml2js');

function readFile(file) {
    var def = Q.defer();
    fs.readFile(file,'utf8',function(err,xml) {
        if (err) {
            def.reject(err);
        } else {
            xml2js.parseString(xml,function(err,res) {
                if (err) {
                    def.reject(err);
                } else {
                    def.resolve(res);
                }
            });
        }
    });
    return def.promise;
}

module.exports = {
    read: function(files) {
        return readFile(files.PCC);
    }
};