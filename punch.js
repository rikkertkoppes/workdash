var exec = require('child_process').exec;
var util = require('util');
var async = require('async');

module.exports = getCard;

function getCard(repos,user,date,cb) {
    var keys = Object.keys(repos);
    var paths = keys.map(function(key) {
        return repos[key];
    });
    async.map(paths,function(path,cb) {
        return getPunches(path,user,date,cb);
    },function(err,res) {
        var data = {};
        res.forEach(function(freq,i) {
            data[keys[i]] = freq;
        });
        cb(err,{
            card: data,
            distribution: getDistribution(data)
        });
    });
}

//provide a distribution based on commit data
//when nothing is committed in an hour, the next hour is checked
function getDistribution(data) {
    //get work load per hour
    var t = transpose(data);
    var intervals = [];
    t.forEach(function(hourData,hour) {
        //get total number of commits for the hour
        var total = hourData.reduce(function(prev,curr) {
            return prev+curr.commits;
        },0);
        var start = hour*3600;
        hourData.forEach(function(repo) {
            //number of seconds worked
            if (repo.commits !== 0) {
                var span = Math.round(60*60*repo.commits/total);
                var end = start + span;
                intervals.push({
                    repo: repo.repo,
                    start: start,
                    end: end,
                    span: span
                });
                start = end;
            }
        });
    });
    return intervals;
}

function transpose(data) {
    var res = [];
    Object.keys(data).forEach(function(key) {
        data[key].forEach(function(commits,hour) {
            if (!res[hour]) {
                res[hour] = [];
            }
            res[hour].push({
                repo: key,
                commits: commits
            });
        });
    });
    return res;
}

//get the punchcard for a particular repo, user and date
function getPunches(path,user,date,cb) {
    getLog(path,user,date,function(err,log) {
        var freq = getFreq(log);
        // console.log(freq);
        cb(err,freq);
    });
}

//creates a frequency distribution of commits, divides in hours
function getFreq(log) {
    var freq = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    log.forEach(function(commit) {
        var bin = commit.date.getHours();
        freq[bin] += 1;
    });
    return freq;
}

//gets the log for a user on a specified date
function getLog(path,user,date,cb) {
    var startdate = date/1000;
    var enddate = startdate+(24*60*60);
    var cmd = [
        'git',
        '--git-dir="'+path+'/.git"',
        'log',
        '--since="'+startdate+'"',
        '--until="'+enddate+'"',
        '--pretty="format:%h|%at|%s"',
        '--author="'+user+'"',
        '--reverse',
        '--all'
    ].join(' ');

    console.log(cmd);

    exec(cmd,function(error,stdout,stderr) {
        if (error) {
            cb(error,[]);
        } else {
            console.log(stdout,stderr);
            var lines = stdout.length?stdout.split('\n'):[];
            cb(null,lines.map(function(line) {
                var parts = line.split('|');
                return {
                    sha:parts[0],
                    date:new Date(parts[1]*1000),
                    msg:parts[2]
                };
            }));
        }
    });
}