<?php
defined('BASEPATH') or exit('No direct script access allowed');

function payvost_uninstall()
{
    // Keep options and data by default. Uncomment to remove.
    // delete_option('payvost_api_key');
    // delete_option('payvost_environment');
    // delete_option('payvost_api_base');

    // $CI = &get_instance();
    // $CI->db->query('DROP TABLE IF EXISTS `' . db_prefix() . 'payvost_logs`');
}
