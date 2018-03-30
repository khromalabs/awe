<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (https://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

namespace Awe;

/**
 * Log and monitorize application at selected level
 */
class Log extends Base
{
    /**
     * @var boolean
     */
    private $log_call_stack;

    function __construct($config) {
        $dispatchCallbacks = array(
            "LOG" => function($data) { $this->log($data); }
        );
        Base::setupDispatchCallbacks($dispatchCallbacks);

        if ($config['log_call_stack']) {
            $this->log_callstack = true;
        }
    }

    private function log($message) {
        error_log($message, 0);
        if ($this->log_call_stack) {
            error_log("Call stack: ", print_r(xdebug_get_function_stack(), true));
        }
    }
}
