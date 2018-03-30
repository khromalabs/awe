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

class Dummy extends Base implements Cache
{
    function __construct($config=null) { }

    public function put($key, $data, $timeout=0, $etc=null) { return false; }
    public function delete($key, $etc=null) { return false; }
    public function get($key, &$data, $etc=null) { return false; }
}
