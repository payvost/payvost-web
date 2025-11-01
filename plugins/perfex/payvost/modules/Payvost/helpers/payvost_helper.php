<?php
defined('BASEPATH') or exit('No direct script access allowed');

if (!function_exists('payvost_get_api_base')) {
    function payvost_get_api_base()
    {
        return get_option('payvost_api_base') ?: 'https://api.payvost.com';
    }
}
