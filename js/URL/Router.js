/*
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 *
 * @license GNU General Public License version 3
 *
 *
 * Derivated from
 * http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
 */

"use strict";

console.assert(awe instanceof Object);
console.assert(awe.registerExtConstructor instanceof Function);

awe.registerExtConstructor("URL.Router", function(input)
{
    var routes = [];
    var mode = null;
    var interval = null;
    var root = '/';

    function config(options) {
        mode = options && options.mode && options.mode == 'history'
            && !!(history.pushState) ? 'history' : 'hash';
        root = options && options.root ? '/' +
            clearSlashes(options.root) + '/' : '/';
    };
    config(input);

    function getFragment() {
        var fragment = '';
        if(mode === 'history') {
            fragment = clearSlashes(decodeURI(location.pathname + location.search));
            fragment = fragment.replace(/\?(.*)$/, '');
            fragment = root != '/' ? fragment.replace(root, '') : fragment;
        } else {
            var match = window.location.href.match(/#(.*)$/);
            fragment = match ? match[1] : '';
        }
        return clearSlashes(fragment);
    };

    function clearSlashes(path) {
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
    };

    this.add = function(re, handler) {
        if(typeof re == 'function') {
            handler = re;
            re = '';
        }
        routes.push({ re: re, handler: handler});
    };

    this.remove = function(param) {
        for(var i=0, r; i < routes.length, r = routes[i]; i++) {
            if(r.handler === param || r.re.toString() === param.toString()) {
                routes.splice(i, 1);
                return this;
            }
        }
    };

    this.flush = function() {
        routes = [];
        mode = null;
        root = '/';
    };

    this.check = function(f, enviroment) {
        var fragment = f || getFragment();
        enviroment = enviroment || {};
        for(var i=0; i<routes.length; i++) {
            var match = fragment.match(routes[i].re);
            if(match) {
                match.shift();
                routes[i].handler.apply(enviroment, match);
                return this;
            }
        }
    };

    this.listen = function() {
        var self = this;
        var current = getFragment();
        var fn = function() {
            if(current !== getFragment()) {
                current = getFragment();
                this.check(current);
                console.log("listening...");
            }
        }
        clearInterval(interval);
        interval = setInterval(fn, 50);
    };

    this.navigate = function(path) {
        path = path ? path : '';
        if(mode === 'history') {
            history.pushState(null, null, root + clearSlashes(path));
        } else {
            window.location.href.match(/#(.*)$/);
            window.location.href =
                window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
    };
});
