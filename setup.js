#!/usr/bin/env node
var sshpk = require('sshpk');
var fs = require('fs');
var childProcess = require('child_process');
var privateKeyString = new Buffer(process.env["T_KEY"], 'base64').toString();
var privateKey = sshpk.parsePrivateKey(privateKeyString.toString(), 'ssh');
var publicKey = privateKey.toPublic();
fs.writeFileSync("/root/.ssh/id_rsa.pub", publicKey.toString());
fs.writeFileSync("/root/.ssh/id_rsa", privateKey.toString());
var tritonProfile = {
	"name":"triton",
    "url": process.env["T_URL"],
    "account": process.env["T_USER"],
    "keyId": publicKey.fingerprint().toString(),
    "curr":true
}
fs.writeFileSync("/tmp/tritonProfile.json", JSON.stringify(tritonProfile));
childProcess.execSync("triton profile create -f /tmp/tritonProfile.json");
//create an env file that can be imported
var output = childProcess.execSync("triton env --docker triton");
var dockerLines = output.toString().split('\n').filter((line) => {
	return line.indexOf('export') !== -1;
})
var username = process.env["M_USER"];
if (username === undefined) {
	username = process.env["T_USER"];
}
var mantaLines = [
	`export MANTA_KEY_ID=${tritonProfile["keyId"]}`,
	`export MANTA_URL=${process.env["M_URL"]}`,
	`export MANTA_USER=${username}`,
]
var exportLines = dockerLines.concat(mantaLines);
fs.writeFileSync("/root/env_source", exportLines.join('\n'));
function stayAlive() {
	setTimeout(function(){
		stayAlive();
	}, 600000);
}
console.log("Setup complete");
process.on('SIGINT', function() {
  process.exit();
});
process.on('SIGTERM', function() {
  process.exit();
});
stayAlive();