<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2014 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 */

namespace Awe;

/**
 * Example usage:
 * @code
 * $this->load->library('uri');
 * // gets third segment from URI
 * $this->uri->segment(3);
 * // get key/val associative array starting with the third segment
 * $uri = $this->uri->uri_to_assoc(3);
 * // assign params to an indexed array, starting with third segment
 * $uri = $this->uri->uri_to_array(3);
 * @endcode
 **/
class Uri extends Base {

    private $path = null;

    function __construct()
    {
        if(!empty($_SERVER['REQUEST_URI'])) {
            $this->path = explode('/',$_SERVER['REQUEST_URI']);
            $this->path = array_slice($this->path,1);
        }
    }

    function segment($index)
    {
        if(!empty($this->path[$index-1]))
            return $this->path[$index-1];
        else
            return false;
    }

    function toAssoc($index)
    {
        $assoc = array();
        for($x = count($this->path), $y=$index-1; $y<$x; $y+=2)
        {
            $assoc_idx = $this->path[$y];
            $assoc[$assoc_idx] = isset($this->path[$y+1]) ? $this->path[$y+1] : null;
        }
        return $assoc;
    }

    function toArray($index=0)
    {
        if(is_array($this->path))
            return array_slice($this->path,$index);
        else
            return false;
    }

}
