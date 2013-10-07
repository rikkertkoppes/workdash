/**
    promise based fogbugs api interface

    the basic thing:
        FB::cmd(cmd,arguments)

    some shortcuts:
        FB::listCases(person,cols,max)
        FB::listPeople(config)
        FB::listWorkingSchedule(person)
        FB::startWork(caseNumber)
        FB::stopWork()
        FB::listIntervals(person,caseNumber,startDate,endDate)
        FB::workingOn(person,caseNumber,startDate,endDate)

    needs a queueing mechanism when not logged on
    all requests need to be deferred until logged on

*/
var Q = require('Q');
var rest = require('restler');
var Args = require('vargs').Constructor;
var xml2js = require('xml2js');
var querystring = require('querystring');

//some sugar
function get(url,options) {
    var def = Q.defer();
    rest.get(url,options).on('complete',function(result,response) {
        if (result instanceof Error) {
            def.reject(result);
        } else {
            def.resolve(result);
        }
    });
    return def.promise;
}

/**
 * see http://www.fogcreek.com/fogbugz/docs/70/topics/advanced/api.html for docs
 */


//fb class
function FB(config) {
    this.config = config||{};
    this.started = this.init();
}

FB.prototype.debug = function() {
    if (this.config.debug) {
        console.log.apply(console.log,arguments);
    }
};

FB.prototype.get = function(url) {
    this.debug('bugz req:',url);
    var options = {
        parser: rest.parsers.xml
    };
    return get(url,options).then(function(res) {
        console.log('response',res);
        return res;
    });
};

FB.prototype.cmd = function(cmd,args) {
    //TODO: check for initialized and logged on, except for logon command
    //IF not logged on, create promises and store in a queue
    //when logged on, then resolve the promises on the queue
    args = args||{};
    args.cmd = cmd;
    if (cmd !== 'logon') {
        args.token = this.token;
    }
    var url = this.endpoint+querystring.stringify(args);
    return this.get(url);
};

FB.prototype.init = function() {
    var url = this.config.url+'api.xml';
    var self = this;
    return this.get(url).then(function(res) {
        self.initialized = true;
        self.endpoint = self.config.url + res.response.url;
        return self.logon();
    });
};

FB.prototype.logon = function(email,password) {
    var self = this;
    return this.cmd('logon',{
        email: email||this.config.email,
        password: password||this.config.password
    }).then(function(res) {
        if (res.response.token) {
            self.token = res.response.token[0];
            console.log(self.token);
        }
    });
};

//turns object members that are arrays with one element to simple members
function simplify(obj) {
    var m,key;
    for (key in obj) {
        m = obj[key];
        if ((m instanceof Array) && (m.length===1)) {
            obj[key] = m[0];
        }
    }
    return obj;
}

//usefull shortcuts
FB.prototype.listCases = function(person,cols,max) {
    return this.search('assignedTo:"'+person+'"',cols,max);
};

FB.prototype.listPeople = function(config) {
    config = config||{};
    return this.cmd('listPeople',config).then(function(res) {
        return res.response.people;
    });
};

FB.prototype.listWorkingSchedule = function(person) {
    return this.cmd('listWorkingSchedule',{
        ixPerson: person
    });
};

FB.prototype.startWork = function(caseNumber) {
    return this.cmd('startWork',{
        ixBug: caseNumber
    });
};

FB.prototype.stopWork = function() {
    return this.cmd('stopWork');
};

FB.prototype.listIntervals = function(person,caseNumber,startDate,endDate) {
    return this.cmd('listIntervals',{
        ixPerson: person,
        ixBug: caseNumber,
        dtStart: startDate,
        dtEnd: endDate
    }).then(function(res) {
        return simplify(res.response).intervals.interval;
    });
};

FB.prototype.listRecentIntervals = function(max) {
    return this.listIntervals().then(function(res) {
        var list = [];
        var last;
        res.map(simplify).reverse().forEach(function(item) {
            if (!(last && (last.ixBug === item.ixBug))) {
                list.push(item);
                last = item;
            }
        });
        return list.slice(0,max||10);
    });
};

FB.prototype.workingOn = function(person,caseNumber,startDate,endDate) {
    return this.listRecentIntervals().then(function(res) {
        return res[0];
    });
};

FB.prototype.search = function(q,cols,max) {
    return this.cmd('search',{
        q: q,
        cols: (cols||[]).join(','),
        max: max
    });
};

function factory(config) {
    return new FB(config);
}

module.exports = factory;