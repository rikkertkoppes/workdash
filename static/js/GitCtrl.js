function GitCtrl($scope,$http,$filter,$timeout,color) {
    var startTime = 8*60*60; //8 AM
    var endTime = 17*60*60; //5 PM

    $scope.date = $filter('date')(new Date(),'yyyy-MM-dd');
    var d = new Date();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    $scope.today = +d;

    $scope.load = function(date) {
        $http.get('/card/'+ date.valueOf()).success(function(data) {
            $scope.card = data.card;
            $scope.dist = processDist(data.distribution);
        });
    };

    $scope.punchStyle = function(size) {
        return {
            width: 8*size,
            height: 8*size,
            marginLeft: 19-(4*size),
            marginRight: 19-(4*size)
        };
    };

    $scope.spanStyle = function(work) {
        function calc(x,offset) {
            var day = endTime-startTime;
            return 100*(x-(offset||0))/day;
        }
        return {
            left: calc(work.start,startTime)+'%',
            width: calc(work.span)+'%',
            background: $scope.getColor(work.repo)
        };
    };

    $scope.getColor = color.getColor;

    $scope.$watch('date',function() {
        $scope.load($scope.date);
    });

    //reload every 10 minutes
    function reload() {
        $scope.load($scope.date);
        $timeout(reload,10*60*1000);
    }
    $timeout(reload,10*60*1000);

    //util
    function processDist(dist) {
        var now = (new Date() - $scope.today)/1000;
        var lastEnd = startTime;
        //close the gaps
        dist.forEach(function(work) {
            if (work.start > lastEnd) {
                work.start = lastEnd;
                work.span = work.end - work.start;
            }
            lastEnd = work.end;
        });
        //stretch to end of day
        var last = dist[dist.length-1];
        if (last && (last.end < now)) {
            last.end = now;
            last.span = last.end - last.start;
        }
        //combine adjecent work
        var res = [];
        last = res[0];
        dist.forEach(function(work) {
            if (last && last.end == work.start && last.repo === work.repo) {
                last.end = work.end;
                last.span += work.span;
            } else {
                last = work;
                res.push(last);
            }
        });
        return res;
    }
}