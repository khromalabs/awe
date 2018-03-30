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
 * @namespace awe.ext
 * @constructor HTML.Form
 */
awe.registerExtConstructor("HTML.Form", function() {
    /**
     * Default argument
     * @type {Object}
     * @private
     */
    var _getHTML_arg_default = {
            action: "", method: "POST", submit: "Submit", types: null,
            reset: "Reset", input_layout: "ul", inputs: null,
            container: "div", container_id: null, id: "HTML.Form",
            post_input_html: null, post_html: null, data: null,
            name: "HTML.Form", title: null, events: null, selects: null,
            styles: null, ajax_query_url: null, extra_buttons: null,
            clean_zeros: false, statical: null
        },
        _input_text_def = { type: "text", label: null, value: null, tail: "",
            companion: false },
        _input_radio_def = { type: "radio", label: null, values: null,
            value: null, tail: "", companion: false },
        _input_select_def = { type: "select", label: null, values: null,
            value: null, allow_null: false, tail: "", companion: false },
        _input_textarea_def = { type: "textarea", label: null, value: null,
            tail: "", companion: false },
        _input_query_def = { type: "textarea", label: null, value: null,
            tail: "", companion: false };

    var _ajax_query_url;
    var _ajax_id_tail = "_query_";
    var _query_windows = {};
    var _query_lists = {};
    var _query_companion_windows = {};
    var _query_companion_lists = {};
    var _ssid = null;
    var _selects;
    var _arg;

    Object.defineProperty(this, "__ownEvents", {
        value: {
            "QUERY_FIELD": _queryField,
            "COMPANION_FIELD": _queryCompanionField
        }
    });

    /**
     * Renders formulary as HTML
     * @param arg_in
     * @returns {string}
     */
    this.getHTML = function (arg_in) {
        var out = "",
            arg = awe.checkDefaults(arg_in, _getHTML_arg_default);

        _ssid = awe.castCode("APP_GET_SSID");
        _ajax_query_url = arg.ajax_query_url;
        _selects = arg.selects;
        _arg = arg;

        if (arg.title !== null) {
            out += "<DIV><H3>" + arg.title + "</H3></DIV>";
        }
        if (arg.container !== null) {
            out += "<" + arg.container;
            out += (arg.container_id === null) ?
                   ">" :
                   " id=\"" + arg.container_id + "\">";
        }
        out += "<FORM name=\"" +
               arg.name +
               "\"action=\"" +
               arg.action +
               "\" method=\"" +
               arg.method +
               "\" id=" +
               arg.id +
               " " +
               arg.events +
               ">";
        if (arg.input_layout === "ul") {
            out += "<UL>";
        }

        out += _processInputs(arg.inputs, arg.input_layout,
                              arg.post_input_html, arg.data, arg.styles);

        if (arg.submit !== null || arg.reset != null || arg.extra_buttons != null) {
            out += "<DIV>";
            if (typeof(arg.submit) !== null) {
                out += "<INPUT type=\"submit\" value=\"" + arg.submit + "\">";
            }
            if (arg.reset != null) {
                out += "<INPUT type=\"reset\" value=\"" +
                       arg.reset +
                       "\" " +
                       "onclick='if(typeof(awe.flags.modified." +
                       arg.id +
                       ") != \"undefined\") awe.flags.modified." +
                       arg.id +
                       " = false'" +
                       ">";
            }
            if (arg.extra_buttons !== null) {
                out += arg.extra_buttons;
            }
            out += "</DIV>";
        }
        if (arg.post_html !== null) {
            out += arg.post_html;
        }
        if (arg.input_layout === "ul") {
            out += "</UL>";
        }

        var declared_tiny_editor = false;

        // add HTML field script code if any HTML field exists
        if (arg.types) {
            for (var types_index in arg.types) {
                var types_item = arg.types[types_index];

                if (types_item == "HTML") {
                    if (!declared_tiny_editor && !window.TINY) {
                        out += "<SCRIPT type=\"text/javascript\">" +
                               "CKEDITOR.config.toolbar = [['Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Undo', 'Redo' ]];";
                        declared_tiny_editor = true;
                    }
                    out += "window.CKEDITOR.replace( '"+types_index+"', {" +
                           "uiColor : '#ffffff', skin: 'kama', padding: 0 } );"
                }
            }
            if (declared_tiny_editor) {
                out += "</SCRIPT>";
            }
        }

        out += "</FORM>";

        if (arg.container !== null) {
            out += "</" + arg.container + ">";
        }

        return out;
    };

    /**
     * Process one input declaration, renders HTML
     * @param inputs
     * @param input_layout
     * @param post_input_html
     * @param data
     * @param styles
     * @returns {string}
     * @private
     */
    function _processInputs(inputs, input_layout, post_input_html, data, styles) {
        var out = "", close_span = false,
            input, input_i, value, value_i, style;

        for (input_i in inputs) {
            if (typeof(inputs[input_i]) === "undefined") {
                console.error("Void input " + input_i);
                continue;
            }
            if (typeof(inputs[input_i].label) === "undefined" &&
                typeof(inputs[input_i].type) === "undefined") {
                out += "<FIELDSET><LEGEND>" +
                       input_i +
                       "</LEGEND>";
                out += _processInputs(inputs[input_i], input_layout,
                    post_input_html, data, styles);
                out += "</FIELDSET>";

            } else {

                if (_arg.types && input_i in _arg.types) {
                    if (_arg.types[input_i] == "statical") {
                        if (!_arg.statical[input_i]) {
                            console.error("statical value not defined for " +
                                          input_i);
                            continue;
                        } else {
                            inputs[input_i].type = "hidden";
                            data[input_i] = _arg.statical[input_i];
                        }
                    }
                }

                style = (styles && styles[input_i]) ?
                        " style=\"" + styles[input_i] + "\"" :
                        "";

                if (input_layout === "ul" && inputs[input_i].type !== "hidden") {
                    out += "<LI>";
                }

                var companion_event = "";

                if (!inputs[input_i].type ||
                    inputs[input_i].type === "text" ||
                    inputs[input_i].type === "password" ||
                    inputs[input_i].type === "date" ||
                    inputs[input_i].type === "time" ||
                    inputs[input_i].type === "datetime") {

                    input = awe.checkDefaults(inputs[input_i], _input_text_def);
                    var type = input.type;

                    if (input.companion) {
                        companion_event = "onkeyup=\"" +
                                          "awe.signalCode(" +
                                          __id +
                                          ", 'COMPANION_FIELD', { name: '" +
                                          input_i +
                                          "' });\"";
                    }

                    if (typeof(input.label) !== null) {
                        out += "<LABEL for=\"" +
                               input_i +
                               "\">" +
                               input.label +
                               ": </LABEL>";
                    }

                    if (input.value) {
                        value = " value=\"" + input.value + "\"";
                    } else {
                        if (!_arg.clean_zeros || data[input_i] != 0) {
                            value = data && data[input_i] ?
                                    " value=\"" + data[input_i] + "\" " :
                                    "";
                        } else {
                            value = "";
                        }
                    }
                    out += "<SPAN><INPUT type=\"" + type + "\" name=\"" +
                           input_i +
                           "\" " +
                           " id=\"" +
                           input_i +
                           "\" " +
                           value +
                           style +
                           companion_event +
                           input.tail +
                           "/>";
                    close_span = true;
                } else {
                    switch (inputs[input_i].type) {
                        case "hidden":
                            value = data && data[input_i] ?
                                    " value=\"" + data[input_i] + "\" " :
                                    "";
                            out += "<INPUT type=\"hidden\" name=\"" +
                                   input_i +
                                   "\"" +
                                   value + ">";
                            break;
                        case "checkbox":
                            input = awe.checkDefaults(inputs[input_i],
                                                      _input_text_def);
                            if (input.label !== null) {
                                out += "<SPAN><LABEL for=\"" +
                                       input_i +
                                       "\">" +
                                       input.label +
                                       ": </LABEL>";
                            }
                            value = (data && Number(data[input_i])) ?
                                    " checked " : "";
                            out += "<INPUT type=\"checkbox\" name=\"" +
                                   input_i +
                                   "\"" +
                                   value +
                                   style +
                                   ">";
                            close_span = true;
                            break;
                        case "radio":
                            input = awe.checkDefaults(inputs[input_i],
                                _input_radio_def);
                            if (input.label !== null) {
                                out += "<LABEL for=\"" +
                                       input_i +
                                       "\">" +
                                       input.label +
                                       ": ";
                            }
                            var i = 0;
                            for (value_i in input.values) {
                                i++;
                                value = (data && data[input_i] &&
                                         Number(value_i) ===
                                         Number(data[input_i])) ?
                                        " checked " : "";
                                out += "<LABEL for=\"" +
                                       input_i +
                                       i +
                                       "\">" +
                                       "<INPUT type=\"radio\" id=\"" +
                                       input_i +
                                       i +
                                       "\" name=\"" +
                                       input_i +
                                       "\" value=\"" +
                                       value_i +
                                       "\" " +
                                       value +
                                       style +
                                       " \">" +
                                       input.values[value_i] +
                                       "</LABEL>";
                            }
                            out += "</LABEL>";
                            break;
                        case "select":
                            input = awe.checkDefaults(inputs[input_i],
                                _input_select_def);
                            if (input.label !== null) {
                                out += "<LABEL for=\"" +
                                       input_i +
                                       "\">" +
                                       input.label +
                                       ": </LABEL>";
                            }
                            out += "<SPAN><SELECT name=\"" +
                                   input_i +
                                   "\" id=\"" +
                                   input_i +
                                   "\"" +
                                   style +
                                   ">";
                            if (input.allow_null) {
                                var desc = input.label || "select";
                                out += "<OPTION value=\"\">["+desc+"]</OPTION>";
                            }

                            var keys = Object.keys(input.values);
                            keys.sort(function(a,b){
                                var x = input.values[a].toLowerCase();
                                var y = input.values[b].toLowerCase();
                                return x < y ? -1 : x > y ? 1 : 0;
                            });
                            var len = keys.length;

                            for (var i = 0; i < len; i++) {
                                value_i = keys[i];
                                value = (data && data[input_i] &&
                                         value_i ===
                                         data[input_i]) ?
                                        " selected " : "";
                                out += "<OPTION value=\"" +
                                       value_i +
                                       "\"" +
                                       value +
                                       ">" +
                                       input.values[value_i] +
                                       "</OPTION>";
                            }
                            out += "</SELECT>";
                            close_span = true;
                            break;
                        case "textarea":
                            input = awe.checkDefaults(inputs[input_i],
                                                      _input_textarea_def);
                            if (input.label !== null) {
                                out += "<LABEL for=\"" +
                                       input_i +
                                        "\">" +
                                       input.label +
                                       ": </LABEL>";
                            }
                            value = data && data[input_i] ? data[input_i] : "";
                            out += "<SPAN><TEXTAREA id=\"" +
                                   input_i +
                                   "\" name=\"" +
                                   input_i +
                                   "\">" +
                                   value +
                                   style +
                                   "</TEXTAREA>";
                            close_span = true;
                            break;
                        case "query":
                            input = awe.checkDefaults(inputs[input_i],
                                                      _input_query_def);

                            if (typeof(input.label) !== null) {
                                out += "<LABEL for=\"" +
                                       input_i +
                                       "\">" +
                                       input.label +
                                       ": </LABEL><SPAN>";
                            }

                            value = data && data[input_i] ?
                                    " value=\"" + data[input_i] + "\" " :
                                    "";
                            var value_shown =
                                (data && data["_linked_" + input_i + "_label_"]) ?
                                " value=\"" + data["_linked_" + input_i + "_label_"] + "\" " :
                                "";

                            out += "<INPUT id=\"" +
                                   input_i +
                                   _ajax_id_tail +
                                   "\" " +
                                   "type=\"text\" name=\"" +
                                   input_i +
                                   "_select_\" " +
                                   value_shown +
                                   style +
                                   "onkeyup=\"" +
                                   "awe.signalCode("+
                                   __id +
                                   ", 'QUERY_FIELD', { name: '" +
                                   input_i +
                                   "', companion: " +
                                   input.companion +
                                   " }); \"" +
                                   "/>";
                            out += "<INPUT type=\"hidden\" id=\"" +
                                   input_i +
                                   "\" " +
                                   " name=\"" +
                                   input_i +
                                   "\"" +
                                   value +
                                   style +
                                   "/>";

                            close_span = true;
                            break;
                    }
                }

                if (post_input_html) {
                    if (typeof(post_input_html[input_i]) !== "undefined") {
                        out += post_input_html[input_i];
                    }
                    if (typeof(post_input_html["__ALL__"]) !== "undefined") {
                        out += post_input_html["__ALL__"];
                    }
                }

                if (close_span) {
                    out += "</SPAN>";
                    close_span = false;
                }
                if (input_layout === "ul" && inputs[input_i].type !== "hidden") {
                    out += "</LI>";
                } else if (input_layout === "br") {
                    out += "<BR/>";
                }
            }
        }

        return out;
    }

    /**
     * Ajax query a field
     * @param {{ name: String }} arg Field description
     * @private
     */
    function _queryField(arg) {

        var element = document.getElementById(arg.name + _ajax_id_tail);
        var url_tail = "/" + arg.name + "/" + element.value;
        var ssid_tail;

        if (_ssid) {
            ssid_tail = "?ssid=" + _ssid;
        }

        awe.ajax({
            url: _ajax_query_url + url_tail + ssid_tail,
            hold: {
                windows: _query_windows,
                lists: _query_lists,
                input_hidden_id: arg.name,
                input_visible_id: arg.name + _ajax_id_tail,
                companion: arg.companion
            },
            receiver: function (answer, hold) {
                var json = JSON.parse(answer);
                var rows = json.result.rows;
                var columns = json.result.columns;
                var windows = hold.windows;
                var lists = hold.lists;
                var id_key = columns[0];
                var columns_functions = {};

                columns_functions[0] = function(row, arg) {
                    var keys = Object.keys(row);
                    var onclick_end = "";
                    if (hold.companion) {
                        onclick_end = "; awe.signalCode(" +
                            __id +
                            ", \"COMPANION_FIELD\", { name: \"" +
                            hold.input_hidden_id +
                            "\" });"
                    } else {
                        onclick_end = "";
                    }
                    return {
                        content: row[keys[1]],
                        onclick: "'javascript:document.getElementById(\"" +
                                 hold.input_visible_id +
                                 "\").value = \"" +
                                 row[keys[1]] +
                                 "\"; document.getElementById(\"" +
                                 hold.input_hidden_id +
                                 "\").value = \"" +
                                 row[keys[0]] +
                                 "\"" +
                                 onclick_end +
                                 "'"
                    };
                }

                if (!windows[id_key]) {
                    windows[id_key] = new awe.ext.HTML.Window();
                    columns.shift();
                    lists[id_key] = new awe.ext.HTML.List(columns, rows, {
                        show_headers: false,
                        columns_functions: columns_functions,
                        row_css_cycle: [ "field_query_even", "field_query_odd" ]
                    });
                } else {
                    lists[id_key].resetRows(rows);
                }

                if (!rows || rows.length < 1) {
                    windows[id_key].close();

                    return;
                }

                windows[id_key].initialize({
                    id_prefix: id_key,
                    content: lists[id_key].getHTML(),
                    sibling: document.getElementById(hold.input_visible_id),
                    default_style: false,
                    close_on_click: true,
                    css_class: "field_query_window",
                    style: {
                        position: "absolute",
                        overflow: "auto",
                        cursor: "pointer",
                        margin: "0",
                        padding: "0"
                    }
                });
                windows[id_key].show();
            }
        });
    }

    function _queryCompanionField(arg) {

        var element = document.getElementById(arg.name);
        var url_tail = "/" + arg.name + "/" + element.value;
        var ssid_tail;

        if (_ssid) {
            ssid_tail = "?ssid=" + _ssid + "&companion=1";
        }

        awe.ajax({
            url: _ajax_query_url + url_tail + ssid_tail,
            hold: {
                windows: _query_companion_windows,
                lists: _query_companion_lists,
                input_id: arg.name,
                selects: _selects
            },
            receiver: function (answer, hold) {
                var json = JSON.parse(answer);
                var rows = json.result.rows;

                if (!(rows instanceof Array) || rows.length < 1) {
                   return;
                } else if (rows.length === 1) {
                    var row = rows[0];
                    var keys = Object.keys(row);

                    var onclick_event = "";
                    for (var row_index in row) {
                        var row_item = row[row_index];
                        var element = document.getElementById(row_index) ||
                                      document.getElementById(row_index + row_item) ||
                                      null;

                        if(element) {
                            // Here we'd modify different types
                            if (element.type === "radio") {
                                element.checked = true;
                            } else {
                                element.value = row_item;
                            }
                        } else {
                            console.debug("element " + row_index + " not defined!");
                        }
                    }

                    return;
                }

                var columns = [ "no_head" ];
                var windows = hold.windows;
                var lists = hold.lists;
                var id_key = arg.name;
                var columns_functions = {};

                columns_functions[0] = function(row, arg) {
                    var keys = Object.keys(row);
                    // Replace in template label fields already existent in
                    // selects
                    var row2 = awe.clone(row);
                    if (hold.selects) {
                        for (var row2_index in row2) {
                            var row2_item = row2[row2_index];
                            if (
                                hold.selects.hasOwnProperty(row2_index) &&
                                hold.selects[row2_index].hasOwnProperty(row2_item)
                            ) {
                                row2[row2_index] = hold.selects[row2_index][row2_item];
                            }
                        }
                    }
                    var output = awe.replace(json.result.template, row2);
                    var onclick_event = "";
                    for (var row_index in row) {
                        onclick_event += "document.getElementById(\"" +
                                         row_index +
                                         "\").value = \"" +
                                         row[row_index] +
                                         "\";";
                    }
                    return {
                        content: output,
                        onclick: "'javascript:" + onclick_event + "'"
                    };
                }

                if (!windows[id_key]) {
                    windows[id_key] = new awe.ext.HTML.Window();
                    lists[id_key] = new awe.ext.HTML.List(columns, rows, {
                        show_headers: false,
                        columns_functions: columns_functions,
                        row_css_cycle: [ "field_query_even", "field_query_odd" ]
                    });
                } else {
                    lists[id_key].resetRows(rows);
                }

                if (!rows || rows.length < 1) {
                    windows[id_key].close();

                    return;
                }

                windows[id_key].initialize({
                    id_prefix: id_key,
                    content: lists[id_key].getHTML(),
                    sibling: document.getElementById(hold.input_id),
                    default_style: false,
                    close_on_click: true,
                    css_class: "field_query_window",
                    style: {
                        position: "absolute",
                        overflow: "auto",
                        cursor: "pointer",
                        margin: "0",
                        padding: "0"
                    }
                });
                windows[id_key].show();
            }
        });
    }


    this.registerAweId();
    var __id = this.__id;
});
