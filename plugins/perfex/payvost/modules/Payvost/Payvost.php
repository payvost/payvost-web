<?php
defined('BASEPATH') or exit('No direct script access allowed');

// Payvost module bootstrap for Perfex CRM

// Register activation/deactivation hooks
register_activation_hook('payvost', 'payvost_module_activation_hook');
register_deactivation_hook('payvost', 'payvost_module_deactivation_hook');

hooks()->add_action('admin_init', 'payvost_module_init_menu_items');
hooks()->add_action('app_admin_head', 'payvost_module_admin_head');
hooks()->add_action('admin_init', 'payvost_module_add_utilities_menu');

// Load language files
register_language_files('payvost', ['payvost']);

/**
 * Module activation: create options and tables
 */
function payvost_module_activation_hook()
{
    $CI = &get_instance();
    require_once(__DIR__ . '/install.php');
    payvost_install();
}

/**
 * Module deactivation: no-op (keep data)
 */
function payvost_module_deactivation_hook()
{
    // Intentionally left blank. Consider cleanup in uninstall.
}

/**
 * Add Payvost to the Setup -> Settings menu
 */
function payvost_module_init_menu_items()
{
    if (!is_admin()) {
        return;
    }

    // Add settings link under Setup -> Settings
    $CI = &get_instance();
    $CI->app_menu->add_settings_menu_item('payvost-settings', [
        'name'     => _l('payvost_settings_menu'),
        'href'     => admin_url('payvost/settings'),
        'position' => 60,
    ]);
}

/**
 * Add custom CSS/JS if needed in admin area
 */
function payvost_module_admin_head()
{
    // echo '<style>.payvost-badge{background:#111;color:#fff;padding:2px 6px;border-radius:3px;}</style>';
}

/**
 * Add logs page under Utilities
 */
function payvost_module_add_utilities_menu()
{
    if (!is_admin()) {
        return;
    }
    $CI = &get_instance();
    if (method_exists($CI->app_menu, 'add_utilities_menu_item')) {
        $CI->app_menu->add_utilities_menu_item('payvost-logs', [
            'name'     => 'Payvost Logs',
            'href'     => admin_url('payvost/logs'),
            'position' => 60,
        ]);
    }
}
