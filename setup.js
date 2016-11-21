#!/usr/bin/env node
var sshpk = require('sshpk');
var fs = require('fs');
try {
	fs.statSync("/root/.ssh/id_rsa.pub")
	process.exit(0);
}catch(err) {
	console.log("Performing Setup");
}
var childProcess = require('child_process');
if (process.env["T_KEY"] === undefined) {
	console.log("Skipping Setup - No Key");
	process.exit();
}
var privateKeyString = new Buffer(process.env["T_KEY"], 'base64').toString();
var privateKey = sshpk.parsePrivateKey(privateKeyString.toString(), 'ssh');
var publicKey = privateKey.toPublic();
fs.writeFileSync("/root/.ssh/id_rsa.pub", publicKey.toString());
fs.writeFileSync("/root/.ssh/id_rsa", privateKey.toString());
var exportLines = [];
if ((process.env["T_URL"] !== undefined) 
	&& (process.env["T_USER"] !== undefined)) {
	var tritonProfile = {
		"name":"triton",
		"url": process.env["T_URL"],
		"account": process.env["T_USER"],
		"keyId": publicKey.fingerprint().toString(),
		"curr":true
	}
	fs.writeFileSync("/tmp/tritonProfile.json", JSON.stringify(tritonProfile));
	childProcess.execSync("triton profile create -f /tmp/tritonProfile.json");
	var output = childProcess.execSync("triton env --docker triton");
	var dockerLines = output.toString().split('\n').filter((line) => {
		return line.indexOf('export') !== -1;
	})
	exportLines = exportLines.concat(dockerLines);
}
if ((process.env["T_URL"] !== undefined) 
	&& ((process.env["T_USER"] !== undefined)
	|| (process.env["M_USER"] !== undefined))) {
	var username = process.env["M_USER"];
	if (username === undefined) {
		username = process.env["T_USER"];
	}
	var mantaLines = [
		`export MANTA_KEY_ID=${publicKey.fingerprint().toString()}`,
		`export MANTA_URL=${process.env["M_URL"]}`,
		`export MANTA_USER=${username}`,
	]
	exportLines = exportLines.concat(mantaLines);
}
fs.writeFileSync("/root/env_source", exportLines.join('\n'));
console.log("Setup complete");
process.on('SIGINT', function() {
  process.exit();
});
process.on('SIGTERM', function() {
  process.exit();
});