<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (https://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

namespace Awe\Cache;

use Awe\Cache;

/**
 * Class Apc
 */
class Apc extends \Awe\Base implements Cache
{
    private $config;

    /**
     * @param null $config
     */
    function __construct($config=null)
    {
        $this->config = $config;
        $dispatchCallbacks = array(
            'GET_CACHER' => function() { return $this; }
        );
        \Awe\Base::setupDispatchCallbacks($dispatchCallbacks);
    }

    /**
     * @param $key
     * @param $data
     * @param int $timeout
     * @param null $etc
     * @return bool
     */
    public function put($key, $data, $timeout=0, $etc=null)
    {
        if(!$timeout && isset($this->config['timeout'])) {
            $timeout = $this->config['timeout'];
        }
        \apcu_delete($key);
        return \apcu_add($key, $data, $timeout);
    }

    /**
     * @param $key
     * @param null $etc
     * @return bool|\string[]
     */
    public function delete($key, $etc=null)
    {
        return \apcu_delete($key);
    }

    /**
     * @param $key
     * @param $data
     * @param null $etc
     * @return bool|mixed
     */
    public function get($key, &$data, $etc=null)
    {
        $data = \apcu_fetch($key, $success);
        $retVal = ($success) ? $data : false;
        return $retVal;
    }
}
