<?php
/**
 * Formalist 2
 *
 * @copyright Copyright (c) 2014 Rubén Gómez Agudo (https://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */
namespace Awe;

class Registry extends Base
{
    static private $elements = [];

    static function put($key, $object)
    {
        // if (is_string($key) && is_object($object)) {
        if (is_string($key)) {
            Registry::$elements[$key] = $object;
        } else {
            trigger_error("Can't store element in Registry");
        }
    }

    static function get($key)
    {
        if (is_string($key) && array_key_exists($key, self::$elements)) {
            return Registry::$elements[$key];
        } else {

            return false;
        }
    }

    static function exists($key)
    {
        return is_string($key) && array_key_exists($key, self::$elements);
    }
}
