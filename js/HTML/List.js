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
 * @constructor HTML.List
 * @param labels
 * @param rows
 * @param arg_in
 */
awe.registerExtConstructor("HTML.List", function(columns, rows, arg_in)
{
    var _sorted, _rows, _columns, _arg;
    var _arg_defaults = {
        headers_function: null, row_css_cycle: null,
        columns_functions: null, buttons_html: "", filters_html: "",
        title: null, columns: null, rows_tags_function: null,
        functions_arg: {}, selects: null, sublist: null,
        id: null, module: null, hide_nulls:true,
        limit_offset: null, limit_count: null,
        show_headers: true, sort: null,
        css_classes_table: {
            title: "list_title",
            buttons_html: "list_buttons",
            filters: "list_filters",
            head: "head"
        }
    };

    /**
     * Sets list to initial state
     * @param columns
     * @param rows
     * @param arg
     */
    this.reset = function(columns, rows, arg) {
        _sorted = null;
        _columns = columns;
        _rows = rows;


        if (!_columns && rows && rows[0]) {
            _columns = Object.keys(rows[0]);
        }

        if(arg) {
            _arg = awe.checkDefaults(arg, _arg_defaults);
        } else if(!_arg) {
            _arg = _arg_defaults;
        }
    };

    /**
     * Updates one or more arguments
     * @param arg
     */
    this.updateArg = function(arg)  {
        for (var arg_index in arg) {
            var arg_item = arg[arg_index];
            _arg[arg_index] = arg_item;
        }
    };

    /**
     * Reinicio de rows
     */
    this.resetRows = function(rows) {
        _rows = rows;
    };

    /**
     * Sorts one column
     * @param arg_in
     */
    this.sort = function(arg_in) {
        console.log("@TODO");
        //var arg_defaults = { column:null, reverse:false };
        //var arg = awe.checkDefaults(arg_in, arg_defaults);
        //console.assert(_columns);
        //console.assert(arg.column);
        //if(arg.column !== null)
        //    console.assert(
        //        typeof(_columns[arg.column]) !== "undefined");
        //
        //var sort_column = _columns[arg.column];
        //var r = (arg.reverse) ? [-1,1] : [1,-1];
        //_rows.sort(function(a,b)
        //{
        //    var a1n = Number(a[sort_column]);
        //    var b1n = Number(b[sort_column]);
        //    var a1 = isNaN(a1n) ? a[sort_column] : a1n;
        //    var b1 = isNaN(b1n) ? b[sort_column] : b1n;
        //    return a1 > b1 ? r[0] : a1 < b1 ? r[1] : 0;
        //});
        //_sorted = arg;
    };

    /**
     * Returns list's HTML
     * @returns {string}
     */
    this.getHTML = function() {
        var column;
        var title = _arg.title || "List";
        var out = "";

        console.assert(_columns);

        if (_arg.buttons_html) {
            // HTML generation
            out += "<h3><span class=\""+
            _arg.css_classes_table.buttons_html+
            "\">"+
            _arg.buttons_html+
            "</span><span class=\""+
            _arg.css_classes_table.title+
            "\">"+
            title+
            "</span><span class=\""+
            _arg.css_classes_table.filters+
            "\">"+
            _arg.filters_html+"</span></h3>";
        }

        out += "<table style=\"width: 100%\" summary=\""+title+"\"><tbody>";

        // console.log("lista arg:");
        // console.log(_arg);

        // Table headers
        if (_arg.show_headers) {
            out += "<tr class=\""+_arg.css_classes_table.head+"\">";
            var sort_link_head = "<a href='javascript:void(0)' onclick='awe.castCode(" +
                "\"APP_LOAD_DATA\"" +
                ", { sort: \"";
            var limit_paramers = "";
            if (_arg.limit_offset) {
                limit_paramers += ", limit_offset: " + _arg.limit_offset;
            }
            if (_arg.limit_count) {
                limit_paramers += ", limit_count: " + _arg.limit_count;
            }
            var sort_link_tail = " })'>";

            for(column in _columns) {
                var column_name = (_arg.headers_function) ?
                    _arg.headers_function(column, _sorted) :
                    column;

                // debugger;
                // console.log("arg.sort: " + _arg.sort);
                var sort_sign = "";
                if ( _arg.sort &&
                    (_arg.sort == _columns[column] ||
                    _arg.sort == _columns[column] + " desc")) {
                    sort_sign = " &#9652;";
                }

                var sort_sense = _columns[column];
                if ( _arg.sort && _arg.sort == _columns[column] ) {
                        sort_sense = _arg.sort + " desc";
                    sort_sign = " &#9662;";
                }


                var column_header = typeof(_columns[column]) == "string" ?
                        // Column is direct table's column, add sort link
                        sort_link_head +
                        sort_sense +
                        "\"" +
                        limit_paramers +
                        sort_link_tail +
                        column +
                        sort_sign +
                        "</a>"
                    :
                        // No direct table's column, just put text
                        column ;
                out += "<th>" + column_header + "</th>";
            }
            // @TODO: sublistas
            //if(_arg.sublist !== null) {
            //    for(var i = 0; i < _arg.sublist.length; i++) {
            //        out += "<th></th>";
            //    }
            //}
            out += "</tr>";
        }

        // table rows
        for (var rows_i in _rows) {
            var idx = _arg.functions_arg.i = Number(rows_i) + 1;
            out += (typeof(_arg.rows_tags_function) == "function") ?
                   "<tr " +
                   _arg.rows_tags_function(_rows[rows_i],
                                           _arg.functions_arg) +
                   "'" :
                "<tr";
            var css_class = _arg.row_css_cycle ?
                _arg.row_css_cycle[(idx % _arg.row_css_cycle.length)] :
                null;
            out += (css_class === null) ? ">" : " class="+css_class+">";
            if(_rows.hasOwnProperty(rows_i)) {
                out += this.drawRow(_rows[rows_i], {i:rows_i});
            }
            out += "</tr>";
        }
        out += "</tbody></table>";

        return out;
    };

    /**
     * Public method needed in AJAX answer
     * @param row
     * @param arg_in
     * @returns {string}
     */
    this.drawRow = function(row, arg_in) {
        var arg = awe.checkDefaults(arg_in, { i: null,
            columns: _columns });
        var out = "", column_out;
        var columns_functions_arg = { i:Number(arg_in.i)+1,
            columns: arg.columns };


        if(_arg.functions_arg) {
            for(var functions_arg_i in _arg.functions_arg) {
                columns_functions_arg[functions_arg_i] =
                    _arg.functions_arg[functions_arg_i];
            }
        }

        for(var columns_i in arg.columns) {
            if(_arg.columns_functions &&
                typeof _arg.columns_functions[columns_i] == "function") {
                columns_functions_arg.columns_i = columns_i;
                column_out = _arg.columns_functions[columns_i](row,
                    columns_functions_arg,
                    arg.columns[columns_i],
                    _arg.selects);
            } else {
                column_out = row[arg.columns[columns_i]];
                if(column_out == null)
                    column_out = "&nbsp;";
            }

            out += "<td";
            if(typeof column_out == "object") {
                for(var tag in column_out) {
                    if(tag != "content") {
                        out += " "+tag+"="+column_out[tag];
                    }
                }
                out += ">";
                if(typeof column_out.content != "undefined") {
                    var done = false;
                    // Look for a "select" concordance
                    if(_arg.selects !== null &&
                        arg.columns[columns_i] in _arg.selects) {
                        var selects = _arg.selects[arg.columns[columns_i]];
                        if (selects[column_out.content]) {
                            out += selects[column_out.content];
                            done = true;
                        }
                    }
                    if(!done) {
// @TODO: sublistas
//                        if(_arg.sublist !== null) {
//                            console.assert(_arg.id !== null);
//                            console.assert(_arg.module !== null);
//                            for(var sublist_i in _arg.sublist) {
//                                if (_arg.sublist[sublist_i] ==
//                                    arg.columns[columns_i]) {
////                                    @TODO: Adaptar esto a nuevo formato eventos
////                                    out += column_out.content;
////                                    out += "</td><td onclick=\"window.awe.modules['"+
////                                        _arg.module+"'].event('"+_arg.id+
////                                        "_toggle', {sublist:'"+
////                                        _arg.sublist[sublist_i]+
////                                        "', i:"+arg.i+", id:'"+
////                                        _arg.id+"'})\">[+]";
//                                    done = true;
//                                    break;
//                                }
//                            }
//                        }
                    }
                    if(!done) {
                        if (!_arg.hide_nulls ||
                            (column_out.content != null &&
                            column_out.content != 0)) {
                            out += column_out.content;
                        }
                    }
                }
                out += "</td>";
            } else {
                if (column_out != "null" ||
                    column_out != 0) {
                    out += ">" + column_out + "</td>";
                }
            }
        }

        return out;
    };

    //region::initialization {{{
    this.reset(columns, rows, arg_in);
    //}}} endregion

});
