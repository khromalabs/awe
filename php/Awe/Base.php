<?php
/**
 * formalist 2
 *
 * @copyright copyright (c) 2012-2018 rubén gómez agudo (https://www.khromalabs.com)
 * @license gnu general public license version 3
 * @version $id$
 */

namespace Awe;

/**
 * Class Base
 *
 * Common ground for all Awe classes.
 * Tasks:
 *  - Define functions used to object data interchange, based on common keys
 */
class Base {
    /**
     * @var Base[] Objects registered listening events generated from current object
     * @example array("log" => & Base object, "logging" => & Base object ...)
     */
    private $peerListeners;

    /**
     * @var array Local functions attached to keys
     * @example array("log" => function(), "logging" => function() ...)
     */
    private $dispatchCallbacks = null;


    /**
     * Registers a new listener for sending data
     * @param Base $listener
     */
    public function registerPeerListener(Base $listener)
    {
        $keys = $listener->getListenKeys();
        if (!is_array($keys)) {
            trigger_error("No keys defined in listener!");
            return;
        }

        foreach ($keys as $keys_item) {
            if (!isset($this->peerListeners[$keys_item])) {
                $this->peerListeners[$keys_item] = [];
            }

            $listeners_array = & $this->peerListeners[$keys_item];
            // Push method reference at keys entry
            array_push($listeners_array, $listener);
        }
    }

    /**
     * Receives data from sender
     * @param array $keys
     * @param       $data
     */
    public function receive($key, $data)
    {
        $answer = null;

        if (isset($this->dispatchCallbacks[$key])) {
            $dispatcher = & $this->dispatchCallbacks[$key];
            if (is_callable($dispatcher)) {
                $answer = $this->dispatchCallbacks[$key]($data);
            } else {
                trigger_error("Can't call dispatcher on key $key");
            }
        }

        return $answer;
    }

    /**
     * Sends data to objects registered in $keys
     * @param $key
     * @param $data
     */
    protected function cast($key, $data=null)
    {
        $answers = null;

        if (isset($this->peerListeners[$key])) {
            $keys_listeners = $this->peerListeners[$key];
            /** @var Base $keys_listener */
            foreach ($keys_listeners as $keys_listener) {
                // @var $keys_listener Base
                $answer = $keys_listener->receive($key, $data);
                if ($answer) {
                    $answers[] = $answer;
                }
            }
        }

        return $answers;
    }

    /**
     * Returns keys listened by this object, if any
     * @return array|null
     */
    protected function getListenKeys()
    {
        $keys = null;

        foreach ($this->dispatchCallbacks as $key => $dispatcher) {
            $keys[] = $key;
        }

        return $keys;
    }

    /**
     * Setup object dispatchers
     * @param array $dispatchers
     */
    protected function setupDispatchCallbacks(array $dispatchers)
    {
        if ($this->dispatchCallbacks === null) {
            $this->dispatchCallbacks = $dispatchers;
        } else {
            trigger_error("Dispatchers already initialized!");
        }
    }
}
