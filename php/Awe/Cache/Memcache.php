<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

namespace Awe\Cache;

use Awe\Cache;

class Memcache extends \Awe\Base implements Cache
{
    private $config;

    function __construct($config=null)
    {
        $this->config = $config;
        $dispatchCallbacks = array(
            'GET_CACHER' => function() { return $this; }
        );
        \Awe\Base::setupDispatchCallbacks($dispatchCallbacks);
    }

    public function put($key, $data, $timeout=0, $etc=null)
    {
        if(!$timeout && isset($this->config['timeout'])) {
            $timeout = $this->config['timeout'];
        }
        Memcache::delete($key);
        return Memcache::add($key, $data, $etc, $timeout);
    }


    public function delete($key, $etc=null)
    {
        if(is_numeric($etc)) {
            return Memcache::delete($key, $etc); // etc is timeout
        } else {
            return Memcache::delete($key);
        }
    }


    public function get($key, &$data, $etc=null)
    {
        // Memcache accepts $key as an array, returning also an array
        $data = Memcache::get($key, $etc);
        return ($data !== false);
    }
}
