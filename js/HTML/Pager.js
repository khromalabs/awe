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
 * @constructor HTML.Pager
 */
awe.registerExtConstructor("HTML.Pager", function()
{
    /**
     * Returns pager's HTML
     * @param {{ count_rows, limit_offset, limit_count }} arg_in
     * @returns {string}
     */
    this.getHTML = function(arg_in) {
        var arg_defaults = {
            count_rows: null,
            limit_offset: null,
            limit_count: 35,
            limit_counts: [ 10, 25, 35, 100 ],
            limit_counts_text: "Resultados por página",
            button_first_page_hint: "Go to first page",
            button_last_page_hint: "Go to last page",
            button_previous_page_hint: "Go to previous page",
            button_next_page_hint: "Go to next page",
            input_current_page_hint: "Current page",
            total_pages_hint: "Total pages",
            update_event: "APP_LOAD_DATA",
            update_parameter_limit_offset: "limit_offset",
            update_parameter_limit_count: "limit_count",
            div_id: "pager",
            filter: null,
            module: null,
            submodule: null,
            fk: null,
            sort: null
        };
        var arg = awe.checkDefaults(arg_in, arg_defaults);
        var enable_back_buttons = (arg.limit_offset >= arg.limit_count);
        var enable_next_buttons = (arg.limit_offset < (arg.count_rows - arg.limit_count));
        var canonical_limit_offset = ((arg.limit_offset % arg.limit_count) == 0) ?
            arg.limit_offset :
            arg.limit_offset - (arg.limit_offset % arg.limit_count);
        var current_page = (canonical_limit_offset / arg.limit_count) + 1;

        var buttons_prev = [
            {
                hint: arg.button_first_page_hint,
                pointer: 0,
                enabled: enable_back_buttons,
                css_class: "icon_pager_first"
            },
            {
                hint: arg.button_previous_page_hint,
                pointer: canonical_limit_offset - arg.limit_count,
                enabled: enable_back_buttons,
                css_class: "icon_pager_previous"
            }
        ];

        var buttons_next = [
            {
                hint: arg.button_next_page_hint,
                pointer: Number(canonical_limit_offset) + Number(arg.limit_count),
                enabled: enable_next_buttons,
                css_class: "icon_pager_next"
            },
            {
                hint: arg.button_last_page_hint,
                pointer: arg.count_rows - (arg.count_rows % arg.limit_count),
                enabled: enable_next_buttons,
                css_class: "icon_pager_last"
            }
        ];

        var out = "<div id=\"pager\"><ul>";

        for (var buttons_prev_i in buttons_prev) {
            var buttons_prev_item = buttons_prev[buttons_prev_i];
            out += _get_button(buttons_prev_item, arg);
        }

        out += "<input type=\"text\" onkeypress='return ((event.charCode >= 48 && event.charCode <= 57) || event.charCode == 13)' value=\"" +
            current_page +
            "\"" +
            _get_update_click_event(
                arg.update_event,
                arg.update_parameter_limit_offset,
                "(this.value*"+arg.limit_count+") - " + arg.limit_count,
                arg.update_parameter_limit_count,
                parseInt(arg.limit_count),
                "onchange",
                arg.filter,
                arg.module,
                arg.submodule,
                arg.fk,
                arg.sort
            ) +
            " title=\"" +
            arg.input_current_page_hint +
            "\"> / <span title=\"" +
            arg.total_pages_hint +
            "\">" +
            Math.floor((arg.count_rows / arg.limit_count) + 1) +
            "</span>";

        for (var buttons_next_i in buttons_next) {
            var buttons_next_item = buttons_next[buttons_next_i];
            out += _get_button(buttons_next_item, arg);
        }

        out += "</ul>";
        out += "</div>";
        out += "<div id=\"counters\">";
        out += arg.limit_counts_text + ":";
        out += "<ul>";

        for (var limit_i in arg.limit_counts) {
            var limit_count = arg.limit_counts[limit_i];
            var css_class = limit_count == arg.limit_count ?
                "selected" :
                "";
            out += "<li class=\"" +
                css_class +
                "\"><a href=\"javascript:void(0)\"" +
                _get_update_click_event(
                    arg.update_event,
                    arg.update_parameter_limit_offset,
                    parseInt(arg.pointer) || 0,
                    arg.update_parameter_limit_count,
                    limit_count,
                    null,
                    arg.filter,
                    arg.module,
                    arg.submodule,
                    arg.fk,
                    arg.sort
                ) +
                " title=\"" +
                arg.hint +
                "\">" +
                limit_count +
                "</a></li>";
        }

        out += "</div>";

        out += "</div>";


        return out;
    }

    function _get_button(arg, parent_arg)
    {
        var css_class = (arg.enabled) ?
            "" :
            " disabled ";
        var page = arg.pointer / parent_arg.limit_count;

        css_class += arg.css_class;

        return "<li><a href=\"javascript:void(0)\"" +
            _get_update_click_event(
                parent_arg.update_event,
                parent_arg.update_parameter_limit_offset,
                parseInt(arg.pointer),
                parent_arg.update_parameter_limit_count,
                parseInt(parent_arg.limit_count),
                null,
                parent_arg.filter,
                parent_arg.module,
                parent_arg.submodule,
                parent_arg.fk,
                parent_arg.sort
            ) +
            " title=\"" +
            arg.hint +
            "\"" +
            " class=\"" +
            css_class +
            "\">" +
            page +
            "</a></li>";
    }

    function _get_update_click_event(event,
                                     limit_offset_token,
                                     limit_offset_value,
                                     limit_count_token,
                                     limit_count_value,
                                     jsevent,
                                     filter,
                                     module,
                                     submodule,
                                     fk,
                                     sort) {
        if (!jsevent) {
            jsevent = "onclick";
        }

        var filter_param = (filter) ?
            ", filters: '" + filter + "'" :
            "";
//        var module_param = module ?
//                     ", module: '" + module + "'" :
//                     "";
        var submodule_param = submodule ?
            ", submodule: '" + submodule + "'" :
            "";
        var fk_param = fk ?
            ", fk: " + fk + "" :
            "";
        var sort_param = sort ?
            ", sort: '" + sort + "'" :
            "";

        return " " +
               jsevent +
               "=\"" +
               "awe.castCode('" +
               event +
               "', { " +
               limit_offset_token +
               ": " +
               limit_offset_value +
               ", " +
               limit_count_token +
               ": " +
               limit_count_value +
               filter_param +
//               module_param +
               submodule_param +
               fk_param +
               sort_param +
               " })\"";
    }
});
