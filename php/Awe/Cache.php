<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 * @author Rubén Gómez <rgomez@khromalabs\.com>
 */

namespace Awe;

interface Cache
{
    public function put($key, $data, $timeout=0, $etc=null);
    public function delete($key, $etc=null);
    public function get($key, &$data, $etc=null);
}
