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

awe.registerExtConstructor("HTML.Weekly", function(params) {
    // Private properties
    var _currentDate = (params && params.time) ? new Date(params.time) :
        (params && params.date) ? params.date : new Date();
    var _days = (params && params.days) ?
        params.days : [1, 2, 3, 4, 5, 6, 7];
    var _days_mini = (params && params.days_mini) ?
        params.days_mini : _days;
    var _fdow = (params && typeof params.fdow != "undefined") ?
        params.fdow : 1;
    var _div_id = (params && params.div_id) ? params.div_id : null;
    var _title = (params && params.title) ? params.title : "weekly";
    var _rows;
    var _current_week_first_day_epoch, _current_week_last_day_epoch;

    // Constructor
    getCurrentDayData();

    // Private methods
    function getCurrentDayData()
    {
        var number_day_week;

        number_day_week = _currentDate.getDay() - _fdow;
        if(number_day_week < 0)
            number_day_week = 7 + number_day_week;
        _current_week_first_day_epoch = new Date(
            _currentDate.getFullYear(),
            _currentDate.getMonth(),
            _currentDate.getDate()-number_day_week).getTime() /
            86400000;
        _current_week_last_day_epoch = _current_week_first_day_epoch + 6;
    }


    function getUndrawEventAtDay(rowDaysWeekEvents, day)
    {
        var days_i, events_i, dayEvents;

        for(days_i in rowDaysWeekEvents) {
            if(rowDaysWeekEvents.hasOwnProperty(days_i) &&
                day == days_i) {
                dayEvents = rowDaysWeekEvents[days_i];
                for(events_i = 0; events_i < dayEvents.length; events_i++) {
                    if(dayEvents[events_i] != -1) {
                        return dayEvents[events_i];
                    }
                }
            }
        }
        return -1;
    }


    function clearDayEvent(dayEvents, id_event)
    {
        var events_i;

        if(typeof(dayEvents) != "object")
            return;

        for(events_i = 0; events_i <= dayEvents.length; events_i++) {
            if(dayEvents[events_i] == id_event) {
                dayEvents[events_i] = -1;
                return;
            }
        }
    }


    function currentEventAtDay(rowDaysWeekEvents, day, id_event)
    {
        var days_i, events_i, dayEvents;

        for(days_i in rowDaysWeekEvents) {
            if(rowDaysWeekEvents.hasOwnProperty(days_i) &&
                day == days_i) {
                dayEvents = rowDaysWeekEvents[days_i];
                for(events_i = 0; events_i < dayEvents.length; events_i++) {
                    if(dayEvents[events_i] == id_event) {
                        return true;
                    }
                }
            }
        }

        return false;
    }


    this.getDate = function(date)
    {
        return _currentDate;
    };


    this.setDate = function(date)
    {
        _currentDate = (typeof(date) == "object" && date instanceof Date) ?
            _currentDate = date : (date) ? new Date(date) : new Date();
        getCurrentDayData();
    };


    this.getFirstWeekDate = function()
    {
        return new Date(_current_week_first_day_epoch*24*60*60*1000);
    };


    this.dateFits = function(eventStartDate, event_days_length)
    {
        var event_start_day_epoch, event_end_day_epoch;

        event_start_day_epoch = eventStartDate.getTime() /
            86400000; // 1000*60*60*24
        event_end_day_epoch = event_start_day_epoch + (event_days_length-1);

        return (event_start_day_epoch >= _current_week_first_day_epoch &&
            event_end_day_epoch <= _current_week_last_day_epoch)
            ||
            (event_end_day_epoch >= _current_week_first_day_epoch &&
                event_end_day_epoch <= _current_week_last_day_epoch);
    };


    this.getEventWeekDays = function(event, weekDaysEvents)
    {
        var event_start_day_epoch, event_end_day_epoch, week_day_epoch;
        var day_i, weekDays = {};

        event_start_day_epoch = event.date.getTime() /
            86400000; // 1000ms*60s*60m*24h
        event_end_day_epoch = event_start_day_epoch + (event.len-1);

        for(day_i = 0; day_i < 7; day_i++) {
            week_day_epoch = _current_week_first_day_epoch + day_i;
            if(event_start_day_epoch <= week_day_epoch &&
                event_end_day_epoch >= week_day_epoch) {
                if(typeof(weekDaysEvents[day_i]) == "undefined") {
                    weekDaysEvents[day_i] = [event.id];
                } else {
                    weekDaysEvents[day_i].push(event.id);
                }
            }
        }
    };


    // @param rows
    // @description
    // Array key by row or event common attribute (place, hour, etc):
    // * id: Unique cell identification code
    // * len: Cells' size counter
    // * msg: Event's name
    // * date: Date object of event
    // * href: Hypertext reference
    // * msg: Text inside cell
    this.getHTML = function(rows)
    {
        var i, y;
        var row_i, out, rowDaysWeekEvents;
        var row_day_max_concurrent_events;
        var row_total_events, day, day_i, event_i, event_i2, events;
        var rowDayEvents, subrow_rowspan_html_attribute, rows_done;
        var event_name, event_days, event_found, id_current_event;


        out = (_div_id) ? "<div id=\""+_div_id+"\">" : "";
        out += "<table summary=\""+_title+"\"><tbody>";

        // Draw first row - days' headers
        out += "<tr><td class=\"topleft\">&nbsp;</td>";
        for(y = 1; y < 8; y++) {
            var dom = new Date((_current_week_first_day_epoch+y-1)*
                24*60*60*1000).getDate();
            out += "<td class=\"days\"><span title=\""+_days[y-1]+
                "\">"+_days_mini[y-1]+" "+dom+"</span></td>";
        }

        // Draw rows data
        for(row_i in rows) {
            if(rows.hasOwnProperty(row_i)) {
                events = rows[row_i];
                rowDaysWeekEvents = {};

                // Get object with events per day
                for(event_i in events) {
                    if(events.hasOwnProperty(event_i)) {
                        this.getEventWeekDays(events[event_i],
                            rowDaysWeekEvents);
                    }
                }
                row_day_max_concurrent_events = 0;
                row_total_events = 0;
                for(day_i in rowDaysWeekEvents) {
                    if(rowDaysWeekEvents.hasOwnProperty(day_i)) {
                        rowDayEvents = rowDaysWeekEvents[day_i];
                        if(rowDayEvents.length >
                            row_day_max_concurrent_events) {
                            row_day_max_concurrent_events =
                                rowDayEvents.length;
                        }
                        row_total_events += rowDayEvents.length;
                    }
                }

                // console.log(row_i);
                // console.log(rowDaysWeekEvents);

                if(row_day_max_concurrent_events > 1) {
                    subrow_rowspan_html_attribute = " rowspan=" +
                        row_day_max_concurrent_events;
                } else {
                    subrow_rowspan_html_attribute = "";
                }

                out += "<tr>";
                out += "<td class=\"rowhead\"" +
                    subrow_rowspan_html_attribute + ">" + row_i + "</td>";
                rows_done = 0;
                do {
                    for(event_days = 1, id_current_event = -1, day_i = 0;
                        day_i < 7; day_i++) {
                        if(id_current_event == -1) {
                            id_current_event = getUndrawEventAtDay(
                                rowDaysWeekEvents, day_i);
                            if(id_current_event == -1) {
                                out += "<td></td>";
                            } else {
                                out += "<td";
                                clearDayEvent(rowDaysWeekEvents[day_i],
                                    id_current_event);
                            }
                        } else {
                            if(currentEventAtDay(rowDaysWeekEvents,
                                day_i, id_current_event)) {
                                event_days++;
                                clearDayEvent(rowDaysWeekEvents[day_i],
                                    id_current_event);
                            } else {
                                event_name = "error en id:" +
                                    id_current_event;
                                event_found = false;
                                for(event_i2 in events) {
                                    if(events.hasOwnProperty(event_i2) &&
                                        events[event_i2].id ==
                                            id_current_event) {
                                        event_name = events[event_i2].msg;
                                        event_found = true;
                                        break;
                                    }
                                }
                                if(!event_found)
                                    console.error("no eventos");
                                out += " class=\"event\" colspan=\"" +
                                    event_days + "\">" + event_name +
                                    "</td>";
                                id_current_event = -1;
                                event_days = 1;
                                // Process again this day for cell open
                                day_i--;
                            }
                        }
                    }
                    out += "</tr>";
                    rows_done++;
                } while(rows_done < row_day_max_concurrent_events)
                // out += "</tr>";
            }
        }

        out += "</tbody></table>";
        if(_div_id) {
            out += "</div>";
        }
        return out;
    };

});
