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

// @constructor Widget
// @description "Base" constructor for all widgets
awe.registerExtConstructor("Widget", function(element, labels, rows)
{
    var _widgets = {};

    if(typeof(awe.lastModule) == "string" && awe.lastModule) {
        // @property#string model PHP script for model (data) generation
        this.model = awe.config.path.modules+"/"+awe.lastModule+".php";
    } else {
        console.error("lastModule not defined");
    }

    // @property#string element HTML ID for Widget container</li>
    this.element = element || "HTML.Widget";

    this.event_Widget = function(event, arg, widgets)
    {
        console.assert(typeof(event) == "string");
        var low_hyphen_i = event.indexOf("_");

        if(low_hyphen_i != 1) {
            var widget = event.slice(0, low_hyphen_i);
            var widget_event = event.slice(low_hyphen_i+1, event.length);

            if(typeof(widgets) == "object" &&
                typeof(widgets[widget]) == "object") {
                if(typeof(widgets[widget].event) == "function") {
                    widgets[widget].event(widget_event, arg);

                    return true;
                }
            }
        }

        return false;
    }

    // @method update Base inherited function to update the view, calls
    // updateLocal in inherited object if exists
    this.update = function(labels, rows)
    {
        this.labels = labels || "";
        // @property#object rows Array of data recieved from model</li>
        if(rows) {
            this.rows = rows;
        }
        this.attributes = [];
        if(typeof(this.updateLocal) == "function") {
            this.updateLocal();
        }
    };

    this.update(labels, rows);
});
