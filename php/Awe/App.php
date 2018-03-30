<?php
/**
 * AWE Framework
 *
 * @copyright Copyright (c) 2012-2018 Rubén Gómez Agudo (http://www.khromalabs.com)
 * @license GNU General Public License version 3
 * @version $Id$
 * @author Rubén Gómez Agudo
 */

namespace Awe;

/**
 * Class App
 *
 * This class serves a controller for all Awe widget and container components
 * orquestating load, validation and configuration
 */
class App extends Base
{
    const VALIDATION_SCHEMA_FILE = "app.json";

    /**
     * Local configuration
     * @var array
     */
    private $config;

    /**
     * Closure function to call for schema validation
     * @var callable
     */
    private $schemaValidator;

    /**
     * App schema
     * @var object
     */
    private $schema;


    /**
     * @param array $config
     * @param callable|null $schemaValidator
     */
    function __construct(Array $config, callable $schemaValidator = null)
    {
        $this->config = $config;

        if ($schemaValidator) {
            $this->schemaValidator = $schemaValidator;
        }
    }

    /**
     * Decode app schema, optionaly validating it
     * @param $app_schema
     * @param $validate
     * @return bool
     * @internal param $schema
     */
    function setSchema($app_schema, $validate)
    {
        if ($validate) {
            $validation_schema_file = $this->config['path-schemas'] .
                                      DIRECTORY_SEPARATOR .
                                      self::VALIDATION_SCHEMA_FILE;
            if (!file_exists($validation_schema_file)) {
                trigger_error("Validation schema file '$validation_schema_file' doesn't exists",
                              E_USER_ERROR);
                return false;
            }
            $validation_schema =
                json_decode(file_get_contents($validation_schema_file));

            if(!is_object($validation_schema)) {
                trigger_error("Formalist schema isn't an object", E_USER_ERROR);
                return false;
            }

            if ($validate) {
                if (!is_callable($this->schemaValidator)) {
                    trigger_error("Can't call validator!");
                }
                if (!call_user_func($this->schemaValidator, $app_schema,
                                    $validation_schema)) {
                    trigger_error("App schema validation failed", E_USER_ERROR);
                    return false;
                }
            }
        }

        $this->schema = $app_schema;
        return true;
    }

    /**
     * Returns a copy of the appSchema object
     * @return object
     */
    function getSchemaCopy()
    {
        return clone $this->schema;
    }
}
