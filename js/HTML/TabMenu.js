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

/**
 * @namespace awe.ext.HTML
 * @class TabMenu
 * @param {elements: Array [, id: String, container: String, url_left: String, url_right:String]} arg
 */
awe.registerExtConstructor("HTML.TabMenu", function(arg) {
    var _selected, _arg,
        _arg_default = {
            elements: null,
            elements_pre: {},
            elements_tail: {},
            id: "menu",
            container: "menu",
            url_left: null,
            url_right: null
        };

//    Object.defineProperty(this, "__castEvents", {
//       value: {
//       }
//    });

    Object.defineProperty(this, "__ownEvents", {
        value: {
            "SET_SELECTED": _setSelected,
            "UPDATE": _update,
            "UPDATE_ELEMENT": _update_element
        }
    });


    /**
     * Updates selected element
     * @param element
     * @returns {boolean}
     * @private
     */
    function _setSelected(element) {
        if(typeof(_arg.elements[element]) === "string") {
            _selected = element;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns HTML
     * @returns {string}
     * @private
     */
    function _getHTML() {
        var css_class;
        var out = "<div id=\""+_arg.id+"\"><ul>";

        for(var elements_i in _arg.elements) {
            css_class = (_selected == elements_i) ? "class=selected" : "";
            var element_pre = _arg.elements_pre[elements_i] || "";
            var element_tail = _arg.elements_tail[elements_i] || "";
            out += "<li><a " +
                css_class +
                " href=\"javascript:void(0)\" onclick=\"" +
                _arg.url_left +
                element_pre +
                elements_i +
                element_tail +
                _arg.url_right +
                "\">" +
                _arg.elements[elements_i] +
                "</a></li>";
        }
        out += "</ul></div>";
        return out;
    }

    /**
     * Updates defined container
     * @private
     */
    function _update() {
        var element;
        if(element = document.getElementById(_arg.container)) {
            element.innerHTML = _getHTML();
        } else {
            console.error("Menu div container not defined!");
        }
    }

    /**
     * Updates element url (pre, tail and value)
     * @param arg
     * @private
     */
    function _update_element(arg) {
        if (_arg.elements[arg.index]) {
            if (arg.pre) {
                _arg.elements_pre[arg.index] = arg.pre;
            }
            if (arg.tail) {
                _arg.elements_tail[arg.index] = arg.tail;
            }
            if (arg.value) {
                _arg.elements[arg.index] = arg.value;
            }
        }
    }

    //region::initialization
    _arg = awe.checkDefaults(arg, _arg_default);
    this.registerAweId();
    //endregion
});
