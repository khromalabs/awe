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

awe.registerExtConstructor("HTML.Window", function(input)
{
    var _arg, _mydoc, _win_id;
    var _me = this; // closure reference to "this"
    var _close_click_reentry_counter = 0;
    var _arg_default = {
        id_prefix: Math.random().toString(36).substr(2, 5),
        title: null,
        content: "window",
        mask_opacity: "0.7",
        frame: null,
//       @TODO: ¿Para que este id_modified?
        id_modified: "window_" + Math.random().toString(36).substr(2, 5),
        modal: false,
        container: null,
        sibling: null,
        style: null,
        default_style: true,
        css_class: null,
        close_on_click: false,
        closer: {
            text: "Close",
            css_class: "",
            msg_confirm_close: "Discard modifications?"
        }
    };


    function _onclick_closer_listener_onclick() {
        awe.flags.modified[_arg.id_modified] = false;
        _me.close(_onclick_closer_listener_onclick);
    }

    function _onclick_closer_listener(e) {
        if (awe.flags.ignore_closer) {
            // @TODO: Apaño para evitar el cierre, no debería ser necesario
            //  usado porque el input muestra parentNode como null ¿?¿?
            awe.flags.ignore_closer = false;

            return;
        }

        _close_click_reentry_counter++;
        if (_close_click_reentry_counter > 1) {
            for (var element = e.target; element; element = element.parentNode) {
                if (element.id === _arg.id_prefix + "_close") {

                    break;
                }
                if (element.id === _win_id) {

                    return;
                }
            }
            if (document.getElementById(_win_id) !== null) {
                if(_arg.id_modified === null ||
                   typeof(awe.flags.modified[_arg.id_modified]) === "undefined" ||
                   !awe.flags.modified[_arg.id_modified] ||
                   confirm(_arg.closer.msg_confirm_close)) {
                    awe.flags.modified[_arg.id_modified] = false;
                    _me.close(_onclick_closer_listener);
                }
            }
        }
    }

    function _get_title() {
        return "<DIV style=\"margin: auto; width:100%; padding: 0; \"><H3 id=\"" +
               _arg.id_prefix +
               "_title\"" +
               ">" +
               _arg.title +
               "</H3></DIV>";
    }


    this.getIdModified = function()
    {
        return _arg.id_modified;
    }

    this.initialize = function(input)
    {
        _arg = awe.checkDefaults(input, _arg_default);
        _win_id = _arg.id_prefix + "_window";

        if(_arg.frame) {
            if(top.frames[_arg.frame]) {
                _mydoc = top.frames[_arg.frame].document;
            } else {
                console.error("Specified frame doesn't exists");

                return false;
            }
        } else {
            _mydoc = document;
        }

        if (_arg.close_on_click) {
            _mydoc.addEventListener("click", _onclick_closer_listener_onclick);
        } else {
            _mydoc.addEventListener("click", _onclick_closer_listener);
        }
    };

    this.close = function(event_to_remove)
    {
        var node = document.getElementById(_arg.id_prefix + "_container");
        if (node) {
            node.parentNode.removeChild(node);
        } else {
            node = document.getElementById(_arg.id_prefix + "_window")
            if (node) {
                node.parentNode.removeChild(node);
            }
        }

        if (event_to_remove) {
            _mydoc.removeEventListener("click", event_to_remove);
        }

        var body = _mydoc.getElementsByTagName('body')[0];
        body.style.position = "static";
        body.style.overflowY = "auto";
    };

    this.refresh = function(content)
    {
        console.assert(typeof(content) == "string");
        document.getElementById(_win_id).innerHTML =
            _get_title() +
            content;
    };

    this.show = function()
    {
        var body = _mydoc.getElementsByTagName('body')[0];
        var container, window;

        if(!(window = _mydoc.getElementById(_arg.id_prefix+"_window"))) {
            // first show: initialize dom object, style and class
            window = _mydoc.createElement("div");
            window.id = _arg.id_prefix + "_window";
            if (_arg.style) {
                for (var arg_style_index in _arg.style) {
                    if (window.style.hasOwnProperty(arg_style_index)) {
                        window.style[arg_style_index] = _arg.style[arg_style_index];
                    }
                }
            }

            if (_arg.default_style) {
                window.style.position = "fixed";
                window.style.right = 0;
                window.style.left = 0;
                window.style.marginLeft = "auto";
                window.style.marginRight = "auto";
            }

            if (_arg.css_class) {
                window.className = _arg.css_class;
            }
        } else {
            // reshow: just clean inner html
            window.innerHTML = "";
        }

        _close_click_reentry_counter = 0;
        if (_arg.title) {
            window.innerHTML += _get_title();
//            window.style.marginTop = "0";
        }

        var scriptsAndHTML = awe.splitHtmlParts(_arg.content);
        window.innerHTML += scriptsAndHTML.html;

        var container_created = false;
        if(_arg.container) {
            _arg.container.appendChild(window);
        } else if (_arg.sibling) {
            _arg.sibling.insertAdjacentElement("afterEnd", window);
        } else {
            if(!(container = _mydoc.getElementById(_arg.id_prefix + "_container"))) {
                container = _mydoc.createElement("div");
                container.id = _arg.id_prefix + "_container";
                container.style.zIndex = 1000;
                container.style.top = 0;
                container.style.left = 0;
                container.style.position = "absolute";
                container.style.width = "100%";
                container.style.height = "100%";
                container.appendChild(window);

                body.style.position = "fixed";
                body.style.width = "100%";
                // overflow scroll muestra una segunda barra en forms largos
                body.style.overflowY = "hidden";
                body.appendChild(container);
                container_created = true;
            }
        }

        var mask;
        if (_arg.modal &&
            !(mask = _mydoc.getElementById(_arg.id_prefix + "_mask"))) {
            mask = _mydoc.createElement("div");
            mask.id = _arg.id_prefix+"_mask";
            mask.style.top = 0;
            mask.style.left = 0;
            mask.style.position = container.style.position;
            mask.style.width = container.style.width;
            mask.style.height = container.style.height;
            mask.style.MozOpacity = _arg.mask_opacity;
            mask.style.KhtmlOpacity = _arg.mask_opacity;
            mask.style.opacity = _arg.mask_opacity;
            mask.style.zIndex = -1000;
            mask.style.filter = "alpha(opacity=" + _arg.mask_opacity * 100 + ")";
            container.appendChild(mask);
        }

        if (container_created) {
            // If the user is running IE some hacks
            var ie_version;
            if((ie_version = awe.isIExplorer())) {
                if(ie_version < 7) {
                    // @note This will not work in Quirks Mode check with
                    // document.compatMode =? BackCompat | CSS1Compat
                    body.style.height = "100%";
                    body.style.overflowY = "auto";
                    if (mask) {
                        mask.style.position = container.style.position =
                        "absolute";
                    }
                    var html = _mydoc.getElementsByTagName('html')[0];
                    html.style.overflowX = "auto";
                    html.style.overflowY = "hidden";
                    body.style.overflowY = "scroll";
                }
            }
        }

        if (window.execScript) {
            window.execScript(scriptsAndHTML.scripts);
        } else {
            var head = document.getElementsByTagName('head')[0];
            var scriptElement = document.createElement('script');
            scriptElement.setAttribute('type', 'text/javascript');
            scriptElement.innerText = scriptsAndHTML.scripts;
            head.appendChild(scriptElement);
            head.removeChild(scriptElement);
        }
    };


    this.initialize(input);
});
