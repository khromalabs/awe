/*
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

"use strict";

console.assert(awe instanceof Object);
console.assert(awe.registerExtConstructor instanceof Function);

awe.registerExtConstructor("SignalBus", function () {

    var _signals = {};

    // Registers a new object
    this.listen = function(signal, receiver)
    {
        // Check that receiver is an object and we can call inside
        // the busSignal method
        if(typeof receiver == "object" &&
            typeof receiver.busSignal == "function") {
            if(!_signals[signal]) {
                _signals[signal] = [];
            }
            _signals[signal].push(receiver);

        } else {
            console.error("Invalid parameters");
        }
    };

    // Sends a message to all receivers
    this.dispatch = function(signal, parameters)
    {
        var receivers, receivers_i;

        if(_signals[signal]) {
            receivers = _signals[signal]
            for(receivers_i in receivers) {
                if(receivers.hasOwnProperty(receivers_i)) {
                    receivers[receivers_i].busSignal(signal,
                        parameters);
                }
            }
        }
    };

    // Remove a receiver from
    this.remove = function (signal, receiver) {
        var receivers_new, receivers, receivers_i = 0;

        if(_signals[signal]) {
            receivers_new = [];
            receivers = _signals[signal];
            for(receivers_i in receivers) {
                if(receivers.hasOwnProperty(receivers_i)) {
                    if(receivers[receivers_i] != receiver) {
                        receivers_new.push(_receivers[receivers_i]);
                    }
                }
            }
            _signals[signal] = receivers_new;
        } else {
            console.warning("Signal " + signal + " not registered");
        }
    };
});
