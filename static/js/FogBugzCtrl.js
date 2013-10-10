function FogBugzCtrl($scope,$http,$filter,$timeout,$socket) {

    $socket.on('fogbugz',function() {
        $scope.load();
    });

    $scope.load = function() {
        $http.get('/fogbugz/history').success(function(data) {
            $scope.history = data;
            if (data[0] && !data[0].dtEnd) {
                $scope.current = data[0];
            } else {
                $scope.current = null;
            }
        });
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

    //reload every 10 minutes
    function reload() {
        $scope.load($scope.date);
        $timeout(reload,10*60*1000);
    }
    $timeout(reload,10*60*1000);
}