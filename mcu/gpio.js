/*
    This node is based on DigitalInNode & DigitalOutNode of nodered.js
    Copyright (c) 2022  Moddable Tech, Inc.
    https://github.com/phoddie/node-red-mcu/blob/main/nodered.js
    License: GNU Lesser General Public License

    Adaptations to node-red-mcu by @ralphwetzel
    https://github.com/ralphwetzel/node-red-mcu-gpio
    License: MIT
*/

import {Node} from "nodered";

module.exports = function(RED) {

    class mcuDigitalInNode extends Node {
        #pin;
        #io;
    
        onStart(config) {

            super.onStart(config);
            const self = this;
    
            // from nodered2mcu
            config.pin = parseInt(config.pin);
            // ...

            self.#pin = config.pin;
            const Digital = globalThis.device?.io?.Digital;
            if (!Digital)
                return;
    
            self.status({fill:"yellow",shape:"dot",text:"mcu-gpio.status.ok"});
            
            let mode = Digital.Input;
            if ("up" === config.intype)
                mode = Digital.InputPullUp;
            else if ("down" === config.intype)
                mode = Digital.InputPullDown;

            self.#io = new Digital({
                target: self,
                pin: self.#pin,
                mode,
                edge: Digital.Rising + Digital.Falling,
                onReadable() {
                    let r = this.read();
                    self.status({fill:"green",shape:"dot",text: r.toString()});
                    this.target.send({ topic:"gpio/"+self.#pin, payload:Number(r) });
                }
            });
        }
    
        static type = "mcu-gpio in";
        static {
            RED.nodes.registerType(this.type, this);
        }
    }

    class DigitalOutNode extends Node {
        #pin;
        #io;
        #hz;
    
        onStart(config) {
            super.onStart(config);
    
            // from nodered2mcu
            config.pin = parseInt(config.pin);

            if ("pwm" === config.out) 
                config.freq = ("" === config.freq) ? 0 : parseFloat(config.freq);
            else
                delete config.freq;
            if (config.level)
                config.level = parseInt(config.level);
            else
                delete config.level;

            // ...

            this.#pin = config.pin;
            this.#hz = config.freq; 
    
            const options = {pin: this.#pin};
    
            if (undefined === this.#hz) {
                if (!globalThis.device?.io?.Digital)
                    return;
    
                options.mode = device.io.Digital.Output;
                trace(JSON.stringify(options), '\n');

                this.#io = new device.io.Digital(options);
                if (undefined !== config.level)
                    this.#io.write(config.level);
            }
            else {
                if (!globalThis.device?.io?.PWM)
                    return;
    
                if (this.#hz)
                    options.hz = this.#hz; 
                this.#io = new device.io.PWM(options);
            }
            
            this.status({fill:"yellow",shape:"dot",text:"mcu-gpio.status.ok"});
        }

        onMessage(msg) {
            if (undefined === this.#hz) {
                this.#io?.write(msg.payload);
                trace(`digital out ${this.#pin}: ${msg.payload}\n`);
            }
            else {
                const value = (parseFloat(msg.payload) / 100) * ((1 << (this.#io?.resolution ?? 8)) - 1);
                this.#io?.write(value);
                trace(`PWM ${this.#pin}: ${value}\n`);
            }
            this.status({fill:"green",shape:"dot",text:msg.payload.toString()});

        }
    
        static type = "mcu-gpio out";
        static {
            RED.nodes.registerType(this.type, this);
        }
    }
    
}

