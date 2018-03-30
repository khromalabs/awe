/*
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

"use strict";

// Firebug compatibility
if (!window.console && !console.firebug) {
    (function () {
        var names = [ "log", "debug", "info", "warn", "error", "assert",
            "dir", "dirxml", "group", "groupEnd", "time", "timeEnd",
            "count", "trace", "profile", "profileEnd", "dummy_firebug" ];

        window.console = {};
        for (var i = 0; i < names.length; ++i)
            window.console[names[i]] = function() {}
    })();
}


/**
 * Core framework object
 *
 * @var {object} awe
 * @global
 */
var awe = awe || new function()
{
    // @todo Config debería ser una función que encapsulara unos datos
    this.config = { };
    this.ext = [];
    this.flags = { modified:{}, ignore_closer: false };
    this.app = null;
    this.modules = {};

    var _ajax_request = null,
        _ajax_receiver = null,
        _ajax_hold = null,
        _ajax_extra_receivers = null,
        _updating_state = -1,
        _cast_receptors = {},
        _instances = [],
        _signal_receptors = {};


    /**
     * Send code and parameters to registed objects
     * @param {Number|String} code
     * @param {Object} parameters
     */
    this.castCode = function(code, parameters) {
        console.assert(code.constructor === Number || code.constructor === String);
        console.assert(_cast_receptors[code] instanceof Array);

        var receptors = _cast_receptors[code];
        var answers = [];
        for (var receptors_index in receptors) {
            var answer =
                receptors[receptors_index].receiveCode(code, parameters);
            if (answer) {
                answers.push(answer);
            }
        }

        if (answers.length) {
            return answers;
        }
    };

    /**
     * Sends code to a registered id
     * @param {Number|String} receptor_id
     * @param {Number|String} code
     * @param {Object} parameters
     */
    this.signalCode = function(receptor_id, code, parameters) {
        console.assert(code.constructor === Number || code.constructor === String);
        console.assert(_signal_receptors[receptor_id] instanceof Object);

        _signal_receptors[receptor_id].receiveCode(code, parameters);
    }

    /**
     * Registers an object for direct single-receptor messages
     * @param {Object} receptor
     */
    this.registerSignalCodeReceptor = function(receptor) {
        console.assert(receptor.__id && receptor.__id.constructor === Number);

        _signal_receptors[receptor.__id] = receptor;
    }

    /**
     * Register a receptor for a single code for multicast messages
     * @param {Object} receptor
     * @param {Number|String|Array} code
     */
    this.registerCastCodeReceptor = function(receptor, code) {
        console.assert(receptor instanceof Object);
        console.assert(receptor.receiveCode instanceof Function);

        if (code instanceof Object) {
            for (var code_index in code) {
                var code_item = code[code_index];
                this.registerCastCodeReceptor(receptor, code_item);
            }
        } else {
            console.assert(code.constructor === String || code.constructor === Number);

            if (!(_cast_receptors[code] instanceof Array)) {
                _cast_receptors[code] = [];
            }

            _cast_receptors[code].push(receptor);
        }
    };

    /**
     Adds one sequence to a stack of one o more ones
     @memberOf awe
     @param sequence
     */
    this.instanceSequentialLoad = function(sequence)
    {
        _showUpdating(true);

        var id = _instances.push({ i:null,
            time:null,
            sequence:sequence });
        this.sequentialLoad(id-1);
    };

    /**
     Loads several files sequentially, refers to member _instances, each
     _instances element should have this structure:
     <ul>
     <li><b>file:</b> Full file's path
     <li><b>loaded:</b> Test function that will check if object is properly
     loaded
     <li><b>finish:</b> Function to call when file is loaded (optional)
     </ul>
     @memberOf awe
     @param id Instance id for this sequence
     @param recursive Recursive autocall flag
     */
    this.sequentialLoad = function(id, recursive)
    {
        console.assert(typeof id == "number");

        var ACTION_LOAD_NEXT = 0, ACTION_WAIT_FILE = 1, INDEX_DONE = -1;

        var ins = _instances[id];
        var wait_slope = 50;
        var next_action = "";
        var max_wait = 10000;
        var file;

        for(var instance_id in _instances) {
            if(instance_id > id && _instances[instance_id].i != -1) {
                // Wait for dependencies to finish
                if(ins.time < max_wait) {
                    ins.time += wait_slope;
                    setTimeout("awe.sequentialLoad("+id+", true)",
                        wait_slope);
                    return;
                } else {
                    ins.i = null;
                    var msg = "Error: Can't load sequence, " +
                        "please try again in a few moments";
                    if(typeof(console.dummy_firebug) == "function")
                        alert(msg);
                    else
                        console.error(msg);
                    return;
                }
            }
        }

        if(typeof(ins) != "object") {
            alert("Instance not defined type:"+typeof(ins)+" id:"+id);
            return;
        }

        while(ins.i < ins.sequence.length) {
            if(ins.i == null) {
                next_action = ACTION_LOAD_NEXT;
                ins.i = -1;
            } else {
                file = ins.sequence[ins.i];
                if(typeof(file) == "object" &&
                    typeof(file.loaded) == "function") {
                    if(file.loaded(file.module)) {
                        console.info("Loaded module "+file.module);
                        if(typeof(file.finish) == "function") {
                            file.finish();
                        }
                        next_action = ACTION_LOAD_NEXT;
                    } else {
                        next_action = ACTION_WAIT_FILE;
                    }
                } else {
                    next_action = ACTION_LOAD_NEXT;
                }
            }

            switch(next_action) {
                case ACTION_LOAD_NEXT:
                    var new_load = false;
                    while(!new_load && ins.i < ins.sequence.length) {
                        ins.i++;
                        ins.time = 0;
                        file = ins.sequence[ins.i];
                        if(ins.i < ins.sequence.length &&
                            typeof(file) == "object") {
                            if(typeof(file.loaded) != "function"
                                || !file.loaded(file.module)) {
                                this.DOMAddScript(file.path);
                                new_load = true;
                            } else {
                                if(typeof(file.finish) == "function")
                                    file.finish();
                                console.info("Refreshing module "+file.module);
                            }
                        }
                    }
                    break;
                case ACTION_WAIT_FILE:
                    if(ins.time < max_wait) {
                        ins.time += wait_slope;
                        setTimeout("awe.sequentialLoad("+id+", true)",
                            wait_slope);
                        return;
                    } else {
                        ins.i = null;
                        msg = "Error: Can't load " + file.path +
                            ". Please try again later";
                        if(typeof(console.dummy_firebug) == "function")
                            alert(msg);
                        else
                            console.error(msg);
                        return;
                    }
                    break;
                default:
                    alert("error!!!");
                    return;
            }
        }

        // Finished sequence
        ins.i = INDEX_DONE;
        // If all instances done, clear load history
        var alldone = true;
        for(instance_id in _instances) {
            if(_instances[instance_id].i != INDEX_DONE) {
                alldone = false;
                break;
            }
        }

        if (alldone) {
            _showUpdating(false);
            _instances = null;
        }
    };

    /**
     Check if object has own properties or not
     @memberOf awe
     @returns {boolean} result
     */
    this.objectIsEmpty = function(object)
    {
        for(var prop in object) {
            if(Object.prototype.hasOwnProperty.call(object, prop))
                return false;
        }
        return true;
    };

    /**
     * Loads external framework classes, internaly called from register function
     * @param dependencies
     */
    this.loadExtDependencies = function(dependencies) {
        console.assert(dependencies instanceof Array);

        var sequence = [];
        var finish_function = (typeof(arguments[1]) === "function") ?
            arguments[1] :
            null;
        var last_index = dependencies.length - 1;

        for(var dependencies_i in dependencies) {
            var dependency = dependencies[dependencies_i];
            var dependency_path =
                // replace dots for subdirectories for inclusion
                dependencies[dependencies_i].replace(/\./g, "/");
            if(!_extConstructorLoaded(dependency)
                && !_alreadyInSequence(dependency)) {
                var sequence_item = {
                    module: dependency,
                    path: awe.config.path.lib+dependency_path+".js",
                    loaded: _extConstructorLoaded
                };
                if (finish_function && dependencies_i == last_index) {
                    sequence_item["finish"] = finish_function;
                }
                sequence.push(sequence_item);
            } else {
                console.log("Already loaded " + dependency_path.module);
                continue;
            }
        }
        if (sequence.length) {
            // console.log("sequential load");
            awe.instanceSequentialLoad(sequence);
        }
    };

    /**
     * Valida la carga de una dependencia en awe.ext
     * @param dependency
     * @returns {boolean}
     */
    function _extConstructorLoaded(dependency) {
        var parts = dependency.split(".");

        for (var i = 0, len = parts.length, obj = window.awe.ext; i < len; i++) {
            obj = obj[parts[i]];
            if (typeof(obj) == "undefined") {
                return false;
            }
        }

        return true;
    }

    /**
     * Prototype object for ext constructors provides read-only not enumerable
     * no redefinible __id property after calling getNewId from inside new
     * object Also registerAweId and receiveCode functions
     */
    var _extConstructorPrototype = new function() {
        var _last_id = 0;

        Object.defineProperty(this, "registerAweId", {
                /**
                 * Assigns a new Id and registers it in awe object
                 */
                value: function() {
                    _last_id++;
                    Object.defineProperty(this, "__id", {
                        value: _last_id
                    });
                    console.info("New __id: " + this.__id);
                    awe.registerSignalCodeReceptor(this);
                    if (this.__castEvents) {
                        awe.registerCastCodeReceptor(this, Object.keys(this.__castEvents));
                    }
                }
            }
        );

        Object.defineProperty(this, "receiveCode", {
                /**
                 * Receives awe's castCode signal
                 * @param {String|Number} code
                 * @param {Object} parameters
                 */
                value: function(code, parameters) {
                    if (this.__ownEvents &&
                        this.__ownEvents[code] instanceof Function) {
                        return this.__ownEvents[code](parameters);
                    } else if (this.__castEvents &&
                        this.__castEvents[code] instanceof Function) {
                        return this.__castEvents[code](parameters);
                    } else {
                        console.warn("No valid receiver for code: " + code);
                    }
                }
            }
        );
    };

    /**
     Registers a new prototype used by all framework extensions to autoregister
     @memberOf awe
     @param {string} name Constructor name
     @param {function} prototype Constructor function
     @param {array} dependencies Required constructors
     */
    this.registerExtConstructor = function(name, constructor, dependencies) {

        console.assert(typeof name == "string");
        console.assert(typeof constructor == "function");

        var ext_obj_slope = window.awe.ext;

        constructor.prototype = _extConstructorPrototype;

        if(_extConstructorLoaded(name)) {
            console.info("Ext constructor "+name+" already loaded");
        } else {
            if (name.indexOf(".")) {
                var name_part = name.split(".");
                for (var i = 0, len = name_part.length; i < len-1; i++) {
                    var name_part_item = name_part[i];
                    if (typeof ext_obj_slope[name_part_item] != "object") {
                        ext_obj_slope[name_part_item] = {};
                    }
                    ext_obj_slope = ext_obj_slope[name_part_item];
                }
                ext_obj_slope[name_part[i]] = constructor;

            } else {
                ext_obj_slope[name] = constructor;
            }

            if(dependencies) {
                awe.loadExtDependencies(dependencies);
            }
        }
    };

    /**
     Duplicates an object
     @memberOf awe
     @param {object} object to clone
     */
    this.clone = function(object) {
        function OneShotConstructor() {}
        OneShotConstructor.prototype = object;
        return new OneShotConstructor();
    };

    /**
     Checks if script is already loaded in DOM
     @memberOf awe
     @returns {boolean} result
     */
    this.DOMCheckScriptLoaded = function(script)
    {
        if(typeof(script) == "string") {
            var full_path_script = (script[0] == "/") ?
                "http://"+location.host+script :
                "http://"+location.host+location.pathname+script;
            var headID = document.getElementsByTagName("head")[0];
            var scripts_readed = headID.getElementsByTagName("script");
            for(var i in scripts_readed) {
                if(scripts_readed[i] instanceof HTMLScriptElement)
                    if(scripts_readed[i].src == full_path_script)
                        return true;
            }
        }

        return false;
    }

    /**
     Adds a javascript script reference into current DOM
     @memberOf awe
     @param {string} script Script file name
     @param {boolean} check_loaded Test if script is already loaded before add
     */
    this.DOMAddScript = function(script, check_loaded)
    {
        if(typeof check_loaded != "undefined" &&
            check_loaded &&
            this.DOMCheckScriptLoaded(script))
            return;

        var headID = document.getElementsByTagName("head")[0];
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.src = script;
        headID.appendChild(newScript);
    }

    /**
     Adds a CSS link into current DOM
     @memberOf awe
     @param {string} href CSS file name
     @param {boolean} check_loaded Test if CSS is already loaded before adding
     */
    this.DOMAddCSS = function(href, check_loaded)
    {
        if(typeof check_loaded != "undefined" &&
            check_loaded &&
            this.DOMCheckScriptLoaded(script))
            return;

        var headID = document.getElementsByTagName("head")[0];
        var cssNode = document.createElement('link');
        cssNode.type = 'text/css';
        cssNode.rel = 'stylesheet';
        cssNode.href = href;
        cssNode.media = 'screen';
        headID.appendChild(cssNode);
    }

    /**
     Clean spaces from both sides of a string
     @memberOf awe
     @param {string} target string
     @returns {string} result
     */
    this.trim = function(str)
    {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    /**
     Formats an object according to the structure defined in defaults parameter.
     This function asumes that all the valid parameters are in defaults object
     @memberOf awe
     @param {object} input Input object
     @param {object} defaults Defaults object containing valid structure and
     default values
     */
    this.checkDefaults = function(input, defaults)
    {
        var i,
            input_type = typeof(input),
            defaults_type = typeof(defaults),
            output = {};

        if(defaults_type === "undefined") {
            console.error("Bad parameters");
            return false;
        }

        if(input_type === "undefined")
            return defaults;
        // Maldito fallo del lenguaje de considerar null como un objeto
        else if(defaults_type !== "object" || defaults === null)
            return input;

        for(i in defaults) {
            if(typeof(input[i]) === "object" &&
                typeof(defaults[i]) === "object") {
                // Recursive call
                output[i] = this.checkDefaults(input[i], defaults[i]);
            } else {
                output[i] = typeof(input[i]) !== "undefined" ?
                    input[i] :
                    defaults[i];
            }
        }

        return output;
    };

    /**
     * Makes an httpRequest call
     * @memberOf awe
     * @param {object} input Input object parameter, containing this structure
     * (*fields required):
     * <ul>
     * <li><b>*url:</b> calling address</li>
     * <li><b>async:</b> work asyncronously</li>
     * <li><b>data:</b> to send</li>
     * <li><b>hold:</b> data to send to the receiver function (f.e. to pass
     * an object)</li>
     * <li><b>receiver:</b> function to call on a valid answer (defaults this.ajax_answer property)</li>
     * <li><b>user:</b> usuario</li>
     * <li><b>password:</b> password </li>
     * <li><b>type:</b> "POST", "GET", etc</li>
     * @todo Mime type stuff and other events?
     **/
    this.ajax = function(arg_in)
    {
        var url_data_tail = "", url_data_join = "", send_data = "";
        var arg_default = {
            url: null,
            async: true,
            data: null,
            hold: null,
            receiver: null,
            user: null,
            password: null,
            type: "GET",
            extra_receivers: null
        };
        var arg = awe.checkDefaults(arg_in || {}, arg_default);

        if(arg.url && arg.url.constructor === String) {
            // First send-data call
            if(arg.data) {
                if(arg.data && arg.data.constructor == String) {
                    send_data = arg.data;
                } else if(arg.data.constructor instanceof Object) {
                    for(var i in arg.data) {
                        if(arg.data.hasOwnProperty(i)) {
                            send_data += url_data_join+i+"="+
                                         encodeURIComponent(arg.data[i]);
                            url_data_join = "&";
                        }
                    }
                }
            }

            // First call to XMLHttpRequest
            if(arg.data && arg.type == "GET") {
                url_data_tail = "?"+send_data;
                send_data = null;
            }

            _ajax_request = null;
            _ajax_receiver = arg.receiver;
            _ajax_hold = arg.hold;
            if (arg.extra_receivers) {
                _ajax_extra_receivers = arg.extra_receivers;
            }

            // Find valid method for AJAX call
            if(window.XMLHttpRequest) {
                // Mozilla, Safari, IE >= 7, etc
                _showUpdating(true);
                _ajax_request = new XMLHttpRequest();
                _ajax_request.open(arg.type,
                    arg.url+url_data_tail, arg.async);
            } else if(window.ActiveXObject) {
                // IE < 7
                _ajax_request = new ActiveXObject('Microsoft.XMLHTTP');
                if(_ajax_request) {
                    _showUpdating(true);

                    // Avoid AJAX cache on explorer
                    // Also possible adding a Math.random() tail
                    _ajax_request.open(arg.type, arg.url+url_data_tail,
                        arg.async, user, password);
                    _ajax_request.setRequestHeader("If-Modified-Since",
                        "Sat, 1 Jan 2000 00:00:00 GMT");
                    _ajax_request.setRequestHeader("Cache-Control",
                        "no-cache");
                } else {
                    console.error("Not valid method for XMLHttpRequest call");
                    return false;
                }
            }

            // Send the proper header information along with the request
            if(_ajax_request) {
                _ajax_request.onreadystatechange = awe.ajax;
                if(arg.type != "GET" && arg.data) {
                    _ajax_request.setRequestHeader("Content-type",
                        "application/x-www-form-urlencoded");
//                    http_request.setRequestHeader("Content-length",
//                        send_data.length);
//                    http_request.setRequestHeader("Connection", "close");
                }
                _ajax_request.send(send_data);
            }
        } else {

            // Recieve data reentry, collect information and send to
            // final receiver
            if (_ajax_request && _ajax_request.readyState &&
                _ajax_request.readyState == 4) {

                var last_request = _ajax_request;
                var last_receiver = _ajax_receiver;
                var last_hold = _ajax_hold;
                var response_headers_array =
                    _ajax_request.getAllResponseHeaders().split('\n');
                var response_headers = {};
                for (var i = 0, len = response_headers_array.length; i < len; i++) {
                    var response_split = response_headers_array[i].split(":");
                    if (response_split[0] && response_split[0].length &&
                        response_split[1] && response_split[1].length) {
                        response_headers[response_split[0]] = response_split[1].split('\r')[0];
                    }
                }

                _ajax_request =
                    _ajax_receiver =
                    _ajax_hold = null;

                if (last_request.status == 200) {
                    if (last_receiver instanceof Function) {
                        last_receiver(last_request.responseText,
                                      last_hold, response_headers);
                    } else {
                        // this.ajax_answer = last_request.responseText;
                        console.error("No valid receiver!");
                    }
                } else {
                    if (_ajax_extra_receivers &&
                        last_request.status in _ajax_extra_receivers &&
                        _ajax_extra_receivers[last_request.status] instanceof Function) {
                        _ajax_extra_receivers[last_request.status](last_request.statusText);
                    } else {
                        console.log("Bad status " + last_request.status +
                                    " in answer: " + last_request.statusText);
                    }
                }
                _ajax_extra_receivers = null;
                _showUpdating(false);
            }
        }
    };

    /**
     checks if current browser is Internet Explorer
     @memberOf awe
     @returns {float} browser's version
     */
    this.isIExplorer = function()
    {
        // Return value assumes failure
        var rv = false;
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");

        if(re.exec(ua) !== null) {
            rv = parseFloat( RegExp.$1 );
        }
        return rv;
    };

    /**
     Returns object's class
     http://www.openjs.com/scripts/data/json_encode.php
     @memberOf awe
     @param {object} obj Object to encode
     @returns {string} object class (undefined when no object)
     */
    this.getObjectClass = function(obj)
    {
        if (obj && obj.constructor && obj.constructor.toString) {
            var arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return arr[1];
            }
        }

        return undefined;
    }

    /**
     Replaces variables delimitied with brackets in a string
     @memberOf awe
     @param {string} source Object to encode
     @param {object} replaces
     @returns {string} JSON encoded object or array
     */
    this.replace = function(source, replaces, regexp_flags, alt_brackets)
    {
        var out, re, replace_i;
        var open;
        var close;

        if(alt_brackets instanceof Array &&
            alt_brackets[0].constructor === String &&
            alt_brackets[1].constructor === String) {
            open = alt_brackets[0];
            close = alt_brackets[1];
        } else {
            open = "{";
            close = "}";
        }

        if(typeof source != "string") {
            console.log("Source parameter not defined (type:" +
                typeof(source) + ")");
            return false;
        }

        if(typeof replaces != "object")
            return source;

        if(typeof regexp_flags == "undefined" || regexp_flags == null)
            regexp_flags = "g";

        out = source;
        for(replace_i in replaces) {
            // @TODO: Es esto necesario? Detiene la busqueda en propiedades heredadas
//            if(replaces.hasOwnProperty(replace_i)) {
                re = new RegExp(open + replace_i + close, regexp_flags);
                out = out.replace(re, replaces[replace_i]);
//            }
        }

        return out;
    };

    /**
     Returns week from a date object
     @memberOf awe
     @param {date} selectedDate Date to extract the week number
     @param {integer} fdow First day of week
     @returns {object} object, properties: week number (week) and
     corresponding year (year) of the week
     */
    this.getWeek = function(selectedDate, fdow)
    {
        var y = selectedDate.getFullYear(), m = selectedDate.getMonth()+1,
            d = selectedDate.getDay() + 1 - fdow;
        if(d == 0) d = 7;
        var y_leap, prev_y_leap, doy, jan1weekday, weekday;
        var iy, iw, i, j, NYD, res;

        NYD = new Date(y, 0, 1);
        jan1weekday = NYD.getDay() + 1 - fdow;
        if(jan1weekday == 0) jan1weekday = 7;
        y_leap = new Date(y,1,29).getDate() == 29;
        prev_y_leap = new Date(y-1,1,29).getDate() == 29;
        doy = (selectedDate - NYD) / 86400000 + 1;

        if(y_leap && m > 2) {
            doy++;
        }
        weekday = selectedDate.getDay() + 1 - fdow; // day of week
        if(weekday == 0) weekday = 7;
        if (jan1weekday == 0) jan1weekday = 7;
        // Find if Y M D falls in YearNumber Y-1, WeekNumber 52 or 53
        if (doy <= (8 - jan1weekday) && jan1weekday > 4) {
            iy = y - 1;
            if (jan1weekday == 5 || (jan1weekday == 6 && prev_y_leap)) {
                iw = 53;
            } else {
                iw = 52;
            }
        } else {
            iy = y;
        }
        // Find if Y M D falls in YearNumber Y+1, WeekNumber 1
        if (iy == y) {
            i = y_leap ? 366 : 365;
            if ((i - (doy - y_leap)) < (4 - weekday)) {
                iy = y + 1;
                iw = 1;
                res = { week:Math.round(iw), year:iy };
                return res;
            }
        }
        // Find if Y M D falls in YearNumber Y, WeekNumber 1 through 53
        if (iy == y) {
            j = doy + (7 - weekday) + (jan1weekday - 1);
            iw = j / 7;
            if (jan1weekday > 4) {
                iw -= 1;
            }
        }
        res = { week:Math.round(iw), year:iy };
        return res;
    };

    /**
     Number of properties in an object (no recursive)
     @memberOf awe
     @param {object} object
     @returns {integer} number of properties
     */
    this.objectLength = function(object)
    {
        var object_i, count = 0;

        if(typeof(object) === "object") {
            for (object_i in object) {
                count++;
            }
            return count;
        } else
            return null;
    };

    /**
     Check if some module dependency is already queued in _instances
     @memberOf awe
     @param {string} module
     @returns {boolean} found or not
     */
    function _alreadyInSequence(module)
    {
        var found = false;

        if (this && _instances) {
            for(var instance_i in _instances) {
                var sequence = _instances[instance_i].sequence;
                for(var sequence_i in sequence) {
                    if(sequence[sequence_i].module == module) {
                        found = true;
                        break;
                    }
                }
            }
        }

        return found;
    }

    /**
     Show configured div indicating an update
     @param {boolean} updating_state State of update advice
     @memberOf awe
     */
    function _showUpdating(updating_state, state_msg) {

        if (updating_state == _updating_state) {
            return;
        }

        if (typeof state_msg == "undefined") {
            state_msg = "Actualizando..."
        }

        var elementUpdating = document.getElementById("dynamic_update");

        if(updating_state) {
            if(elementUpdating &&
                elementUpdating.style.display != "inline") {
                elementUpdating.innerHTML = state_msg;
                elementUpdating.style.display = "inline";
            }
            _updating_state = true;
        } else {
            if(elementUpdating && elementUpdating.style.display != "none") {
                elementUpdating.style.display = "none";
            }
            _updating_state = false;
        }
    }

    /**
     * Splits scripts and text from an HTML chunk, returns both separately
     * @param text
     * @returns {{scripts: string, html: *}}
     */
    this.splitHtmlParts = function(text) {

        var scripts, stylesheets, html, html_chunks;

        stylesheets = html = html_chunks = scripts = '';

        var cleaned = text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
            scripts += arguments[1] + '\n';
            return '';
        });

        var cleaned2 = cleaned.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, function(){
            stylesheets += arguments[1] + '\n';
            return '';
        });

//        cleaned = cleaned2.replace(/<script.*text\/html.*[^>]*>([\s\S]*?)<\/script>/gi, function(){
//            html_chunks += arguments[1] + '\n';
//            return '';
//        });

        return {
            html: cleaned,
            scripts: scripts,
            css: stylesheets
//            html_chunks: html_chunks
        };
    };

    /**
     * Decodes HTML entities
     * @param str
     * @returns {*}
     */
    var _decodeEntitiesElement = document.createElement('div');
    this.decodeHTMLEntities = function(str) {
        if(str && typeof str === 'string') {
            // strip script/html tags
            str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
            str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
            _decodeEntitiesElement.innerHTML = str;
            str = _decodeEntitiesElement.textContent;
            _decodeEntitiesElement.textContent = '';
        }

        return str;
    };
};
