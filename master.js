/*
 * test heart beat mechanism to maintian the process
 *
 */
var cluster = require('cluster'),
	fs = require('fs'),
	exec = require('child_process').exec

var TIMEOUT = 3000;

var cpuLength = 2;

var queue = {},
	timeoutQueue = {};


cluster.setupMaster({
	exec: './service.js'
});

cluster.on('fork', function(worker) {
	console.log('[%s] [MASTER] worker %d has been forked...', new Date(), worker.process.pid);
});

cluster.on('exit', function(worker) {
	console.log('[%s] [MASTER] worker %d exited...', new Date(), worker.process.pid);
	clean(worker.process.pid);
	var worker = cluster.fork(),
		pid = worker.process.pid;
	queue[pid] = worker;
	initWorker(pid);
});

function clean(pid) {
	console.log('[%s] [MASTER] clean worker pid:%d', new Date(), pid);
	clearTimeout(timeoutQueue[pid]);
	queue[pid] = timeoutQueue[pid] = null;
}

function initWorker(pid) {
	queue[pid].on('message', function(msg) {
		var	alive = msg.alive;
		console.log('msg:%s from %s', msg, pid);
		clearTimeout(timeoutQueue[pid]);
		timeoutQueue[pid] = setTimeout(function() {
			console.log('[%s] [MASTER] worker pid:%d has no heart beat, will be killed soon', new Date(), pid);
			exec('kill -9 ' + pid);
		}, TIMEOUT);
	});
}

for (var i = 0; i < cpuLength; i++) {
	var worker = cluster.fork(),
		pid = worker.process.pid;
	queue[pid] = worker;
	timeoutQueue[pid] = null;
	initWorker(pid);
}

console.log('[%s] [MASTER] master process %d starts...', new Date(), process.pid);

process.on('exit', function() {
	console.log('[%s] [MASTER] master exited...', new Date());
});

process.on('uncaughtException', function(e) {
	console.log('[%s] [MASTER] uncaughtException occurred...', new Date());
	console.log(e);
	process.exit(1);
});