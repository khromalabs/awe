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
 * Derived and highly simplified from Monte Ohrt's TMVC_PDO class
 */
class Pdo extends Base
{
    /** @var \PDOStatement Query result handler*/
    private $result = null;

    // the results fetch mode
    private $fetchMode = \PDO::FETCH_ASSOC;

    // directory allocating querys
    private $pathSql = null;

    // buffer for querys readed from files
    private $queryBuffer = array();

    // PDO object handler
    private $pdo = null;

    // configuration
    private $config;

    const NO_FETCH = 0;
    const FETCH = 1;
    const FETCH_ALL = 2;

    // class constructor
    function __construct(array $config)
    {
        if(!class_exists('PDO')) {
            trigger_error('PHP PDO package is required', E_USER_ERROR);
        }

        // attempt to instantiate PDO object and database connection
        try {
            $this->pdo = new \PDO(
                $config['type'].':host='.$config['host'].';dbname='.
                $config['name'],
                $config['user'],
                $config['password'],
                array(\PDO::ATTR_PERSISTENT => $config['persistent']));

            if(empty($config['charset']))
                $config['charset'] = 'UTF8';

            $this->pdo->exec("SET CHARACTER SET {$config['charset']}");
        } catch (\PDOException $e) {
            trigger_error('Can\'t connect to PDO database'.$config['type'].
            "Error: ".$e->getMessage(), E_USER_ERROR);
        }

        // Check query directory if parameter exists
        if(isset($config['path-sql-querys'])) {
            if(is_dir($config['path-sql-querys'])) {
                $this->pathSql = $config['path-sql-querys'];
            } else {
                trigger_error('Specified directory for sql querys '.
                $config['path-sql-querys']. ' doesn\'t exists', E_USER_ERROR);
            }
        }

        // make PDO handle errors with exceptions
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->config = $config;
    }

    // destructor
    // @access private
    function __destruct()
    {
        $this->pdo = null;
    }

    function getConfig()
    {
        return $this->config;
    }

    /**
     * execute a database query
     * @access public
     * @param string $query query or file to read query
     * @param array $params an array of query params
     * @param int $fetch fetch first row
     */
    function query($query, $params=null, $fetch=self::NO_FETCH)
    {
        if(!is_string($query) || empty($query)) {
            trigger_error('No query parameter', E_USER_ERROR);
        }

        // If we have a query directory defined, check if parameter is a
        // filename or a SQL query expression
        if(is_string($this->pathSql)) {
            $file_name = $this->pathSql.DIRECTORY_SEPARATOR.$query;
            if(array_key_exists($file_name, $this->queryBuffer)) {
                $query = $this->queryBuffer[$file_name];
            } else if(is_file($file_name)) {
                // Not in cache, try to read
                if(!($handle = fopen($file_name, 'r')) ||
                    !($query = fread($handle, filesize($file_name)))) {
                    trigger_error('Can\'t read query file: '.$file_name,
                        E_USER_ERROR);
                }
                fclose($handle);
            }
        }

        // Prepare the query parameters
        try {
            $this->result = $this->pdo->prepare($query);
        } catch (\PDOException $e) {
            trigger_error('PDO Error: '.$e->getMessage().' Query: '.$query,
                E_USER_ERROR);
            return false;
        }

        // execute (with params) and process fetch if defined
        try {
            if (is_array($params)) {
                // bindParam needs $params_item reference
                foreach ($params as $params_key => &$params_item) {
                    $bind_param_type = is_numeric($params_item) ?
                        \PDO::PARAM_INT :
                        \PDO::PARAM_STR;

                    if (is_numeric($params_key)) {
                        $this->result->bindParam($params_key,
                            $params_item,
                            $bind_param_type
                        );
                    } else {
                        $length = strlen($params_item);
                        $this->result->bindParam(":" . $params_key,
                            $params_item,
                            $bind_param_type,
                            $length
                        );
                    }
                }
            }

            // ob_start();
            // $this->result->debugDumpParams();
            // error_log(ob_get_clean());
            $this->result->execute();
        } catch (\PDOException $e) {
            trigger_error('PDO Error: '.$e->getMessage().' Query: '.$query,
                E_USER_ERROR);
        }
        $this->result->setFetchMode($this->fetchMode);

        if ($fetch == self::NO_FETCH) {
            return true;
        } else {
            $res = ($fetch == self::FETCH_ALL) ?
                $this->result->fetchAll() :
                $this->result->fetch();
            $result = (sizeof($res) == 1) ?
                $res[0] :
                $res;
            return $result;
        }
    }

    // go to next record in result set
    // @access public
    // @param int $fetchMode the fetch formatting mode
    function fetch($fetchMode=\PDO::FETCH_ASSOC)
    {
        if($this->result instanceof \PDOStatement) {
            try {
                $this->result->setFetchMode($fetchMode);
                return $this->result->fetch();
            } catch (\PDOException $e) {
                trigger_error('PDO Error: '.$e->getMessage(), E_USER_ERROR);
            }
        } else {
            trigger_error('Can\'t fetch result no valid result object prepared',
                E_USER_ERROR);
        }
        return false;
    }


    // get last insert id from previous query
    // @access public
    // @return int $id
    function lastInsertId()
    {
        return $this->pdo->lastInsertId();
    }

    // get number of returned rows from previous select
    // @access public
    // @return int $id
    function numRows()
    {
        return $this->count();

//        switch($this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME)) {
//            case 'mysql':
//                if ($this->result instanceof \PDOStatement) {
//                    // ??? Convertir resultado a formato compatible con PDO?
//                    //return mysql_num_rows($this->result);
//                    trigger_error("MIRAR CODIGO");
//                }
//                break;
//        }
//
//        trigger_error('Not supported on current driver or bad result statement',
//            E_USER_ERROR);
//        return false;
    }

    // get number of affected rows from previous insert/update/delete
    // @access public
    // @return int $id
    function count()
    {
        return $this->result->rowCount();
    }

    function quote($arg)
    {
        return $this->pdo->quote($arg);
    }
}
