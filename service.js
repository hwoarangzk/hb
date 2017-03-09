var cluster = require('cluster');

var HEART_BEAT_GAP = 2000;

if (cluster.isWorker) {
    var interval = setInterval(function() {
        process.send({
            pid: process.pid,
            alive: true
        });
    }, HEART_BEAT_GAP);
    setTimeout(function() {
        console.log('%d clear interval', process.pid);
        clearInterval(interval);
    }, 6000);
}