/*
    This node is based on 36-rpi-gpio
    https://github.com/node-red/node-red-nodes/tree/master/hardware/PiGpio
    License: Apache License

    Adaptations to node-red-mcu by @ralphwetzel
    https://github.com/ralphwetzel/node-red-mcu-gpio
    License: MIT
*/

const clone = require("clone");

let device_config = {
    "rpi": {
        label: "Raspberry Pi",
        pins: [
            { label: "3.3", type: "power" },
            { label: "5", type: "power" },
            { label: "SDA1", type: "dual", value: 2 },
            { label: "5", type: "power" },
            { label: "SCL1", type: "dual", value: 3 },
            { type: "ground" },
            { type: "gpio", value: 4 },
            { label: "TxD", type: "dual", value: 14 },
            { type: "ground" },
            { label: "RxD", type: "dual", value: 15 },
            { type: "gpio", value: 17 },
            { type: "gpio", value: 18 },
            { type: "gpio", value: 27 },
            { type: "ground" },
            { type: "gpio", value: 22 },
            { type: "gpio", value: 23 },
            { label: "3.3", type: "power" },
            { type: "gpio", value: 24 },
            { label: "MOSI", type: "dual", value: 10 },
            { type: "ground" },
            { label: "MISO", type: "dual", value: 9 },
            { type: "gpio", value: 25 },
            { label: "SCLK", type: "dual", value: 11 },
            { label: "CE0", type: "dual", value: 8 },
            { type: "ground" },
            { label: "CE1", type: "dual", value: 7 },
            { label: "SD", type: "sd" },
            { label: "SC", type: "sd" },
            { type: "gpio", value: 5 },
            { type: "ground" },
            { type: "gpio", value: 6 },
            { type: "gpio", value: 12 },
            { type: "gpio", value: 13 },
            { type: "ground" },
            { type: "gpio", value: 19 },
            { type: "gpio", value: 16 },
            { type: "gpio", value: 26 },
            { type: "gpio", value: 20 },
            { type: "ground" },
            { type: "gpio", value: 21 },
        ]
    },
    "m5lite": {
        label: "M5Atom Lite",
        // hide_resistor: true,
        baseline: "esp_pico_d4",
        bold: true,
        mods: [
            { label: "LED", value: 27},
            { label: "BTN", value: 39},
            { label: "IR", value: 12},
            { value: 22 },
            { value: 19 },
            { value: 23 },
            { value: 33 },
            { value: 21 },
            { value: 25 },
            { value: 26 },
            { value: 32 },
            { pin: 44, type: "nc", bold: false },
            { pin: 45, type: "nc", bold: false },
            { pin: 47, type: "nc", bold: false },
            { pin: 48, type: "nc", bold: false },
        ]
    },
    "esp_pico_d4": {
        label: "Generic ESP-PICO-D4",
        // hide_resistor: true,
        pins: [
            { label: "3", type: "power" },
            { label: "LAN", type: "sd" },
            { label: "3", type: "power" },
            { label: "3", type: "power" },
            { label: "VP", type: "dual", value: 36},
            { label: "CAPP", type: "dual", value: 37},
            { label: "CAPN", type: "dual", value: 38},
            { label: "VN", type: "gpio", value: 39},
            { label: "EN", type: "sd" },
            { label: "IO34", type: "adc" },
            { label: "IO35", type: "adc" },
            { label: "IO32", type: "adc" },
            { label: "IO33", type: "adc" },
            { type: "gpio", value: 25 },
            { type: "gpio", value: 26 },
            { type: "gpio", value: 27 },
            { label: "IO14", type: "adc", value: 14},
            { label: "IO12", type: "adc", value: 12},
            { label: "3", type: "power" },
            { label: "IO13", type: "adc" },
            { label: "IO15", type: "adc" },
            { label: "IO2", type: "adc" },
            { label: "IO0", type: "adc" },
            { label: "IO4", type: "adc" },
            { type: "gpio", value: 16 },
            { label: "3", type: "power" },
            { type: "gpio", value: 17 },
            { label: "SD2", type: "dual", value: 9 },
            { label: "SD3", type: "dual", value: 10 },
            { label: "CMD", type: "dual", value: 11 },
            { label: "CLK", type: "dual", value: 6 },
            { label: "SD0", type: "dual", value: 7 },
            { label: "SD1", type: "dual", value: 8 },
            { type: "gpio", value: 5 },
            { type: "gpio", value: 18 },
            { type: "gpio", value: 23 },
            { label: "3", type: "power" },
            { type: "gpio", value: 19 },
            { type: "gpio", value: 22 },
            { label: "U0RXD", type: "dual", value: 3 },
            { label: "U0TXD", type: "dual", value: 1 },
            { type: "gpio", value: 21 },
            { label: "3", type: "power" },
            { label: "XTAL_N", type: "sd" },
            { label: "XTAL_P", type: "sd" },
            { label: "3", type: "power" },
            { label: "CAP1", type: "sd" },
            { label: "CAP2", type: "sd" },
            { type: "ground" },

        ]
    }
}

// resolve .baseline w/ .mods to .pins
for (let d in device_config) {
    let dev = device_config[d];
    dev.pins = dev.pins ?? clone(device_config[dev.baseline]?.pins ?? []);
    dev.mods?.forEach(function(mod) {
        let v = mod.value ?? -1;
        if (v>=0) {
            dev.pins?.some(function(pin) {
                if (pin.value === v) {
                    if (mod.label) { pin.label = mod.label; }
                    if (mod.type) { pin.type = mod.type; }
                    pin.bold = mod.bold ?? true;
                    return true;
                }
            })
        }
        let p = mod.pin ?? -1;
        if (p>=0) {
            let pin = dev.pins[p-1];
            if (mod.label) { pin.label = mod.label; }
            if (mod.type) { pin.type = mod.type; }
            if (mod.bold) { pin.bold = mod.bold; }
            pin.bold = mod.bold ?? true;
        }
    })
}



module.exports = function(RED) {
    "use strict";
    var execSync = require('child_process').execSync;
    var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;

    var testCommand = __dirname+'/rpi/testgpio'
    var gpioCommand = __dirname+'/rpi/nrgpio';
    var allOK = true;

    try {
        execSync(testCommand);
    } catch(err) {
        allOK = false;
        RED.log.warn("mcu-gpio : "+RED._("mcu-gpio.errors.ignorenode"));
    }

    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;

    var pinsInUse = {};
    var pinTypes = {"out":RED._("mcu-gpio.types.digout"), "tri":RED._("mcu-gpio.types.input"), "up":RED._("mcu-gpio.types.pullup"), "down":RED._("mcu-gpio.types.pulldown"), "pwm":RED._("mcu-gpio.types.pwmout")};
    
    function GPIOInNode(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.intype = n.intype;
        this.read = n.read || false;
        this.debounce = Number(n.debounce || 25);
        if (this.read) { this.buttonState = -2; }
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.intype;
        }
        else {
            if ((pinsInUse[this.pin] !== this.intype)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("mcu-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        var startPin = function() {
            node.child = spawn(gpioCommand, ["in",node.pin,node.intype,node.debounce]);
            node.running = true;
            node.status({fill:"yellow",shape:"dot",text:"mcu-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                var d = data.toString().trim().split("\n");
                for (var i = 0; i < d.length; i++) {
                    if (d[i] === '') { return; }
                    if (node.running && node.buttonState !== -1 && !isNaN(Number(d[i])) && node.buttonState !== d[i]) {
                        node.send({ topic:"gpio/"+node.pin, payload:Number(d[i]) });
                    }
                    node.buttonState = d[i];
                    node.status({fill:"green",shape:"dot",text:d[i]});
                    if (RED.settings.verbose) { node.log("out: "+d[i]+" :"); }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.running = false;
                node.child.removeAllListeners();
                delete node.child;
                if (RED.settings.verbose) { node.log(RED._("mcu-gpio.status.closed")); }
                if (!node.finished && code === 1) {
                    setTimeout(function() {startPin()}, 250);
                }
                else if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"mcu-gpio.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"mcu-gpio.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("mcu-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("mcu-gpio.errors.commandnotexecutable")); }
                else { node.error(RED._("mcu-gpio.errors.error",{error:err.errno})) }
            });
        }

        if (allOK === true) {
            if (node.pin !== undefined) {
                startPin();
            }
            else {
                node.warn(RED._("mcu-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"mcu-gpio.status.not-available"});
            if (node.read === true) {
                var val;
                if (node.intype == "up") { val = 1; }
                if (node.intype == "down") { val = 0; }
                setTimeout(function() {
                    node.send({ topic:"gpio/"+node.pin, payload:val });
                    node.status({fill:"grey",shape:"dot",text:RED._("mcu-gpio.status.na",{value:val})});
                },250);
            }
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"mcu-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin, () => {
                    if (node.child) {
                        node.child.kill('SIGKILL');
                    }
                });
            }
            else { if (done) { done(); } }
        });
    }
    RED.nodes.registerType("mcu-gpio in",GPIOInNode);

    function GPIOOutNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.set = n.set || false;
        this.level = n.level || 0;
        this.freq = n.freq || 100;
        this.out = n.out || "out";
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.out;
        }
        else {
            if ((pinsInUse[this.pin] !== this.out)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("mcu-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        function inputlistener(msg, send, done) {
            if (msg.payload === "true") { msg.payload = true; }
            if (msg.payload === "false") { msg.payload = false; }
            var out = Number(msg.payload);
            var limit = 1;
            if (node.out === "pwm") { limit = 100; }
            if ((out >= 0) && (out <= limit)) {
                if (RED.settings.verbose) { node.log("out: "+out); }
                if (node.child !== null) {
                    node.child.stdin.write(out+"\n", () => {
                        if (done) { done(); }
                    });
                    node.status({fill:"green",shape:"dot",text:msg.payload.toString()});
                }
                else {
                    node.error(RED._("mcu-gpio.errors.pythoncommandnotfound"),msg);
                    node.status({fill:"red",shape:"ring",text:"mcu-gpio.status.not-running"});
                }
            }
            else { node.warn(RED._("mcu-gpio.errors.invalidinput")+": "+out); }
        }

        if (allOK === true) {
            if (node.pin !== undefined) {
                if (node.set && (node.out === "out")) {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.level]);
                    node.status({fill:"green",shape:"dot",text:node.level});
                } else {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.freq]);
                    node.status({fill:"yellow",shape:"dot",text:"mcu-gpio.status.ok"});
                }
                node.running = true;

                node.on("input", inputlistener);

                node.child.stdout.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("out: "+data+" :"); }
                });

                node.child.stderr.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("err: "+data+" :"); }
                });

                node.child.on('close', function (code) {
                    node.child = null;
                    node.running = false;
                    if (RED.settings.verbose) { node.log(RED._("mcu-gpio.status.closed")); }
                    if (node.finished) {
                        node.status({fill:"grey",shape:"ring",text:"mcu-gpio.status.closed"});
                        node.finished();
                    }
                    else { node.status({fill:"red",shape:"ring",text:"mcu-gpio.status.stopped"}); }
                });

                node.child.on('error', function (err) {
                    if (err.errno === "ENOENT") { node.error(RED._("mcu-gpio.errors.commandnotfound")); }
                    else if (err.errno === "EACCES") { node.error(RED._("mcu-gpio.errors.commandnotexecutable")); }
                    else { node.error(RED._("mcu-gpio.errors.error")+': ' + err.errno); }
                });

            }
            else {
                node.warn(RED._("mcu-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"mcu-gpio.status.not-available"});
            node.on("input", function(msg) {
                node.status({fill:"grey",shape:"dot",text:RED._("mcu-gpio.status.na",{value:msg.payload.toString()})});
            });
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"mcu-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin, () => {
                    node.child.kill('SIGKILL');
                    setTimeout(function() { if (done) { done(); } }, 50);
                });
            }
            else { if (done) { done(); } }
        });

    }
    RED.nodes.registerType("mcu-gpio out", GPIOOutNode);

    var pitype = { type:"" };
    if (allOK === true) {
        exec(gpioCommand+" info", function(err,stdout,stderr) {
            if (err) {
                RED.log.info(RED._("mcu-gpio.errors.version"));
            }
            else {
                try {
                    var info = JSON.parse( stdout.trim().replace(/\'/g,"\"") );
                    pitype.type = info["TYPE"];
                }
                catch(e) {
                    RED.log.info(RED._("mcu-gpio.errors.sawpitype"),stdout.trim());
                }
            }
        });
    }

    RED.httpAdmin.get('/mcu-gpio/type/:id', RED.auth.needsPermission('mcu-gpio.read'), function(req,res) {
        res.json(pitype);
    });

    RED.httpAdmin.get('/mcu-gpio/pins/:id', RED.auth.needsPermission('mcu-gpio.read'), function(req,res) {
        res.json(pinsInUse);
    });

    RED.httpAdmin.get('/mcu-gpio/tester', RED.auth.needsPermission('mcu-gpio.read'), function(req,res) {
        console.log("DC:", device_config);
        res.json(device_config);
    });



    // This is the replacement node that will be invoked in MCU mode.
    // This node will receive - as standard functionality - status updates from the MCU.
    function mcuGPIOInNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        let node = this;

        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.intype;
        }
        else {
            if ((pinsInUse[this.pin] !== this.intype)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("mcu-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        // Mimic the standard status message on startup.
        node.status({ fill: "grey", shape: "dot", text: "mcu-gpio.status.not-available" });

        // if (node.read === true) {
        //     var val;
        //     if (node.intype == "up") { val = 1; }
        //     if (node.intype == "down") { val = 0; }
        //     setTimeout(function () {
        //         node.send({ topic: "gpio/" + node.pin, payload: val });
        //         node.status({ fill: "grey", shape: "dot", text: RED._("mcu-gpio.status.na", { value: val }) });
        //     }, 250);
        // }
    }
    
    // Register this type @ NR like any other node type.
    RED.nodes.registerType("mcu*mcu-gpio in",mcuGPIOInNode);

    // Connect the NR mode type (mcu-gpio in) to the replacement node type (mcu*mcu-gpio in) for MCU mode.
    registerMCUModeType("mcu-gpio in", "mcu*mcu-gpio in");


    function mcuGPIOOutNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        let node = this;

        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.intype;
        }
        else {
            if ((pinsInUse[this.pin] !== this.intype)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("mcu-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        // Mimic the standard status message on startup.
        node.status({ fill: "grey", shape: "dot", text: "mcu-gpio.status.not-available" });
    }
    
    // Register this type @ NR like any other node type.
    RED.nodes.registerType("mcu*mcu-gpio out",mcuGPIOOutNode);

    // Connect the NR mode type (mcu-gpio in) to the replacement node type (mcu*mcu-gpio in) for MCU mode.
    registerMCUModeType("mcu-gpio out", "mcu*mcu-gpio out");
}
