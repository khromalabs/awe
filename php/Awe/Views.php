<?php
/**
 * Views processing class
 *
 * @packaged default
 * @license GNU General Public License version 3
 * @author Rubén Gómez Agudo (http://www.khromalabs.com)
 **/

namespace Awe;

class Views extends Base
{
    // Templates directory
    // @var string
    private $_path;
    private $_buffer;

    // Constructor
    // @return void
    function __construct($config)
    {
        $this->_path = $config["path"];
    }

    // Show view method
    // @return boolean
    public function load($file_arg)
    {
        $file = $this->_path.$file_arg;
        if(isset($_buffer[$file])) {
            return $_buffer[$file];
        } if(($ret = $this->getIncludeContents($file)) !== null) {
            $_buffer[$file] = $ret;
            return $ret;
        } else {
            trigger_error("View '$file_arg' not exists", E_USER_ERROR);
            return null;
        }
    }

    // Includes a file and return it as a string
    // @return string
    function getIncludeContents($filename)
    {
        if (is_file($filename)) {
            ob_start();
            include $filename;
            $contents = ob_get_contents();
            ob_end_clean();
            return $contents;
        }
        return null;
    }

} // END class AWE_Views
?>
