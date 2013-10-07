function TestCtrl($scope,$http,$timeout) {
    socket.on('tests',function(data) {
        $scope.load();
    });

    $scope.load = function() {
        $http.get('tests').success(function(tests) {
            $scope.summary = tests.testsuites.testsuite[0].$;
            $scope.details = tests.testsuites.testsuite[0].testcase;
        });
    };

    $scope.load();

    $scope.passClass = function(summary) {
        if (!summary) {
            return '';
        }
        return summary.failures==='0'?'pass':'error';
    };

    //reload every 10 minutes
    function reload() {
        $scope.load();
        $timeout(reload,10*60*1000);
    }
    $timeout(reload,10*60*1000);
}