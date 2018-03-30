<?php

/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2014 Rubén Gómez Agudo (http://www.khromalabs\.com)
 * @version $Id$
 */

namespace Awe;


class Debug extends Base {

    private $enabled;

    function __construct($config)
    {
        $this->enabled = $config;
    }

    function dump($value)
    {
        if ($this->enabled) {
            var_dump($value);
        }
    }


    function dumpHtmlTable(array $array)
    {
        if ($this->enabled) {
            // start table
            $html = '<table>';
            // header row
            $html .= '<tr>';

            foreach($array[0] as $key=>$value) {
                $html .= '<th>' . $key . '</th>';
            }

            $html .= '</tr>';

            // data rows
            foreach($array as $key=>$value) {
                $html .= '<tr>';
                foreach($value as $key2=>$value2){
                    $html .= '<td>' . $value2 . '</td>';
                }

                $html .= '</tr>';
            }

            // finish table and return it
            $html .= '</table>';
            return $html;
        }
    }
}
