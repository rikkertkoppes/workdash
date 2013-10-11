function FogBugzCtrl($scope,$http,$filter,$timeout,$socket,color) {

    $socket.on('fogbugz',function(data) {
        if (data) {
            $scope.history = undouble(data);
            $scope.week = breakdown(data);
        } else {
            $scope.load();
        }
    });

    $scope.load = function() {
        $http.get('/fogbugz/history').success(function(data) {
            $scope.history = undouble(data);
            if (data[0] && !data[0].dtEnd) {
                $scope.current = data[0];
            } else {
                $scope.current = null;
            }
        });
    };

    function undouble(data) {
        var map = {};
        var list = [];
        data.forEach(function(item) {
            if (!map[item.ixBug]) {
                map[item.ixBug] = true;
                list.push(item);
            }
        });
        return list;
    }

    function breakdown(data) {
        //filter everything before monday
        var today = new Date();
        var offset = ((today.getDay()-1)+7)%7;
        var monday = new Date();
        monday.setDate(today.getDate() - offset);
        data = data.filter(function(datum) {
            var dtEnd = new Date(datum.dtEnd);
            return dtEnd > monday;
        });

        //sum by project
        projects = {};
        data.forEach(function(datum) {
            if (!projects[datum.sProject]) {
                projects[datum.sProject] = 0;
            }
            var start = new Date(datum.dtStart);
            var end = new Date(datum.dtEnd);
            projects[datum.sProject] += (end-start)/1000;
        });
        return projects;
    }

    $scope.spanStyle = function(name,seconds) {
        //5 workdays of 8 hours
        var secondsInWeek = 5*8*60*60;
        return {
            width: (100*seconds/secondsInWeek)+'%',
            background: $scope.getColor(name)
        };
    };

    $scope.stop = function() {
        $http.post('/fogbugz/stop').success(function() {
            return $scope.load();
        });
    };

    $scope.start = function(caseNr) {
        $http.post('/fogbugz/start/'+caseNr).success(function() {
            return $scope.load();
        });
    };

    $scope.load();

    $scope.getColor = color.getColor;

    //reload every 10 minutes
    function reload() {
        $scope.load($scope.date);
        $timeout(reload,10*60*1000);
    }
    $timeout(reload,10*60*1000);
}