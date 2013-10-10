var express = require('express');
var app = express();
var config = require('./config.json');
var fb = require('./fogbugz')(config.fogbugz);
var getCard = require('./punch');
var junit = require('./junit');
var fs = require('fs');
var rest = require('restler');
var Q = require('Q');

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static('static'));
app.use(express.bodyParser());

//fogbugz
app.get('/fogbugz/history', function(req, res) {
    fb.listRecentIntervals().then(function(intervals) {
        res.send(intervals);
        getCases(intervals);
    }).done();
});

function extend(dst,src) {
    Object.keys(src).forEach(function(key) {
        dst[key] = src[key];
    });

    return dst;
}

function getCases(intervals) {
    fb.getCase(intervals.map(function(interval) {
        return interval.ixBug;
    }).join(','),['sProject']).then(function(res) {
        intervals.forEach(function(interval,i) {
            extend(interval,res[i]);
        });

        io.sockets.emit('fogbugz',intervals);
    });
}


app.post('/fogbugz/stop', function(req, res) {
    fb.stopWork().then(function() {
        io.sockets.emit('fogbugz', null);
        res.status(202).end();
    }).done();
});

app.post('/fogbugz/start/:nr', function(req, res) {
    fb.startWork(req.params.nr).then(function() {
        io.sockets.emit('fogbugz', null);
        res.status(202).end();
    }).done();
});

//git
app.get('/card/:date', function(req, res) {
    var date = new Date(req.params.date)||new Date();
    getCard(config.repos,config.git.user,date,function(err,data) {
        console.log(data);
        res.send(data);
    });
});

//tests
app.get('/tests', function(req, res) {
    junit.read(config.tests).then(function(tests) {
        res.send(tests);
    }).done();
});

Object.keys(config.tests).forEach(function(key) {
    fs.watchFile(config.tests[key], function (curr, prev) {
        io.sockets.emit('tests', 'reload');
    });
});

//todos
app.get('/todos', function(req, res) {
    res.send(Object.keys(config.todos).map(function(key) {
        return {
            name: key,
            url: '/todos/'+key
        };
    }));
});

app.get('/todos/:project', function(req, res) {
    fs.readFile(config.todos[req.params.project],'utf8',function(err,json) {
        res.send(JSON.parse(json));
    });
});

app.post('/todos/:project', function(req, res) {
    fs.writeFile(config.todos[req.params.project],JSON.stringify(req.body),'utf8',function(err,json) {
        io.sockets.emit('todo', req.body);
        res.send(req.body);
    });
});

//broadcast todo project change
io.sockets.on('connection', function (socket) {
    socket.on('todoproject', function (data) {
        socket.broadcast.emit('todoproject',data);
    });
});

server.listen(config.port);
console.log('server started on port',config.port);