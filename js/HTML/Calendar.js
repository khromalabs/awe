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

awe.registerExtConstructor("HTML.Calendar", function(params) {
    // Private properties
    var _colorizeGroups = [];
    var _date = (params && params.time) ? new Date(params.time) :
        (params && params.date) ? params.date : new Date();
    var _days = (params && params.days) ?
        params.days : [1, 2, 3, 4, 5, 6, 7];
    var _days_mini = (params && params.days_mini) ?
        params.days_mini : _days;
    var _divId = (params && params.div_id) ?
        params.div_id : null;
    var _fdow = (params && typeof(params.fdow)!="undefined") ?
        params.fdow : 1;
    var _title = (params && params.title) ? params.title : "calendar";


    // @note I'm using calendar_head_week[N] as IDs of cells
    //       of weeks calendars (1-6)
    this.highlightWeek = function(dateNow) {
        var month_week, tdElement, i, weekNowData, weekFirstMonthDay;
        var weekLastMonthDay, tdElement;
        var dateFirstDayOfMonth = new Date(_date.getFullYear(),
            _date.getMonth(), 1);
        var dateLastDayOfMonth = new Date(_date.getFullYear(),
            _date.getMonth()+1, 0);

        if(typeof dateNow == "undefined") {
            dateNow = _date;
        }

        // Get first week day of the week of dateNow and dateFirstDayOfMonth
        var date_now_weekday = dateNow.getDay() + 1 - _fdow;
        if(date_now_weekday == 0) date_now_weekday = 7;
        var first_month_day_weekday = dateFirstDayOfMonth.getDay() + 1 -
            _fdow;
        if(first_month_day_weekday == 0) first_month_day_weekday = 7;

        var weekStartDateNow = new Date(dateNow.getFullYear(),
            dateNow.getMonth(),
            dateNow.getDate() - date_now_weekday + 1);
        var weekStartFirstDay = new Date(dateFirstDayOfMonth.getFullYear(),
            dateFirstDayOfMonth.getMonth(),
            dateFirstDayOfMonth.getDate() - first_month_day_weekday +
                1);
        var week_start_datenow_absolute = weekStartDateNow.getTime() /
            604800000;
        var week_start_first_day_absolute = weekStartFirstDay.getTime() /
            604800000;

        month_week = Math.round(week_start_datenow_absolute -
            week_start_first_day_absolute) + 1;

        if(month_week >= 1 && month_week <= 6) {
            for(i = 1; i <= 6; i++) {
                if(i != month_week) {
                    tdElement =
                        document.getElementById("calendar_head_week" + i);
                    if(tdElement) {
                        tdElement.className = "weeks";
                    }
                }
            }

            var tdElement = document.getElementById("calendar_head_week" +
                month_week);
            if(tdElement)
                tdElement.className = "weeks_highlight";
            else
                console.error("Element not found");
        } else {
            console.warning("week of specified date isn't within current month");
        }
    };


    this.setDate = function(date)
    {
        _date = (typeof(date) == "object" && date instanceof Date) ?
            _date = date :
            (date) ? new Date(date) : new Date();
    };


    // @nota I'm using topleft, days, pre, post y now as CSS classes
    // I'm using calendar_head_week[N] as ID of week's headers cells
    this.getHTML = function(url_template)
    {
        var i = j = 0; // General propouse indexers
        var cells = [], cell;

        // Unixtime at day 1 of month
        var month_date = new Date(_date.getFullYear(),
            _date.getMonth(), 1);
        // First Week Day Of Month (0:first, sunday corrected by property)
        var fwdom = month_date.getDay()-_fdow;
        if(fwdom < 0) fwdom = 7 + fwdom;

        // Writes previous month cells (ldopm=Last Day Of Previous Month)
        if(fwdom > 0) {
            var ldopm = new Date(month_date.getFullYear(),
                month_date.getMonth(), 0).getDate();
            for(i=0, j=ldopm-fwdom+1; j<=ldopm; i++, j++) {
                cells[i] = -j;
            }
        }

        // Writes current month cells
        var month_days = new Date(month_date.getFullYear(),
            month_date.getMonth()+1, 0).getDate();
        for(j=1; j<=month_days; i++, j++) {
            cells[i]=j;
        }

        // Writes next month cells (lwdom=Last Week Day Of Month)
        var lwdom = (i-1) % 7;
        if(lwdom < 6) {
            for(var k=101,j=lwdom+1; j<=6; i++, j++, k++) {
                cells[i]=k;
            }
        }

        var year = _date.getFullYear();
        var weeks_date = new Date(month_date.getFullYear(),
            month_date.getMonth(), -fwdom+_fdow+3);
        var weekData = awe.getWeek(weeks_date, _fdow);
        var week = weekData.week;
        var week_time = weeks_date.getTime();
        var week_cur_year = weekData.year; //weeks_date.getFullYear();
        var calendar_weeks = i / 7 + 1;
        var out, cell_class, x, y;

        out = (_divId) ? "<div id=\""+_divId+"\">" : "";
        out += "<table summary=\""+_title+"\"><tbody>";

        for(i = 0, y = 0; y < calendar_weeks; y++) {
            out += "<tr>";
            for(x = 0; x < 8; x++) {
                if(y == 0 && x == 0) {
                    out += "<td class=\"topleft\">&nbsp;</td>";
                } else if(x==0) {
                    var week_text = (typeof url_template != "undefined") ?
                        "<a href='" + awe.replace(url_template,
                            {time:week_time-(86400*3*1000)+
                                // for posible daylight (0AM or 1AM)
                                (60*60*1000)}, null,
                            [ "1", "2" ]) + "'>" + week + "</a>" :
                        week;
                    out += "<td id=\"calendar_head_week" + y +
                        "\" class=\"weeks\">" + week_text +
                        "</td>";
                    week_time += 604800000; // 1000*60*60*24*7
                    if(week_cur_year < new Date(week_time).getFullYear()) {
                        week=1;
                        week_cur_year++;
                    } else {
                        week++;
                    }
                } else if(y == 0) {
                    out += "<td class=\"days\"><span title=\""+_days[x-1]+
                        "\">"+_days_mini[x-1]+"</span></td>";
                } else {
                    if(cells[i] < 0) {
                        cell_class = "pre";
                        cell = -cells[i];
                    } else if(cells[i] > 100) {
                        cell_class = "post";
                        cell = cells[i] - 100;
                    } else {
                        cell_class = (cells[i] in _colorizeGroups) ?
                            _colorizeGroups[cells[i]] :
                            "now";
                        cell = cells[i];
                    }
                    out += "<td class=\""+cell_class+"\">"+cell+"</td>";
                    i++;
                }
            }
            out += "</tr>";
        }
        out += "</tbody></table>";
        if(_divId) {
            out += "</div>";
        }
        return out;
    };


    this.colorize = function(patterns)
    {
        _colorizeGroups = (typeof(patterns) == "object" &&
            patterns instanceof Array) ?
            patterns :
            Array(patterns);
    };

});
