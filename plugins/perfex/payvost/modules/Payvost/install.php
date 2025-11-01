<?php
defined('BASEPATH') or exit('No direct script access allowed');

function payvost_install()
{
    $CI = &get_instance();

    // Options
    add_option('payvost_api_key', '');
    add_option('payvost_environment', 'production');
    add_option('payvost_api_base', 'https://api.payvost.com');
    add_option('payvost_webhook_secret', '');

    // Example table for logs
    if (!$CI->db->table_exists(db_prefix() . 'payvost_logs')) {
        $CI->db->query('CREATE TABLE `' . db_prefix() . 'payvost_logs` (
            `id` INT(11) NOT NULL AUTO_INCREMENT,
            `level` VARCHAR(20) NULL,
            `message` TEXT NULL,
            `payload` LONGTEXT NULL,
            `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=' . $CI->db->char_set . ';');
    }
}
