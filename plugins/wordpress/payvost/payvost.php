<?php
/*
Plugin Name: Payvost Payment Gateway
Plugin URI: https://payvost.com/
Description: Official Payvost plugin to accept payments and manage transactions via Payvost on your WordPress site.
Version: 1.0.0
Author: Payvost Team
Author URI: https://payvost.com/
License: GPL2
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define plugin constants
define('PAYVOST_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PAYVOST_PLUGIN_URL', plugin_dir_url(__FILE__));

define('PAYVOST_API_BASE', 'https://api.payvost.com'); // Update if self-hosted

define('PAYVOST_VERSION', '1.0.0');

// Load plugin textdomain for translations
function payvost_load_textdomain() {
    load_plugin_textdomain('payvost', false, dirname(plugin_basename(__FILE__)) . '/languages');
}
add_action('plugins_loaded', 'payvost_load_textdomain');

// Add settings link on plugin page
function payvost_plugin_action_links($links) {
    $settings_link = '<a href="admin.php?page=payvost-settings">Settings</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'payvost_plugin_action_links');

// Admin menu for Payvost settings
function payvost_admin_menu() {
    add_menu_page(
        __('Payvost', 'payvost'),
        'Payvost',
        'manage_options',
        'payvost-settings',
        'payvost_settings_page',
        'dashicons-admin-generic',
        56
    );
}
add_action('admin_menu', 'payvost_admin_menu');

function payvost_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('Payvost Settings', 'payvost'); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('payvost_settings_group');
            do_settings_sections('payvost-settings');
            submit_button();
            ?>
        </form>
        <form method="post">
            <input type="hidden" name="payvost_test_api" value="1" />
            <button type="submit" class="button button-secondary"><?php _e('Test API Connectivity', 'payvost'); ?></button>
        </form>
        <?php
        if (isset($_POST['payvost_test_api'])) {
            $api_key = esc_attr(get_option('payvost_api_key'));
            $result = payvost_test_api($api_key);
            if (is_wp_error($result)) {
                echo '<div class="notice notice-error"><p>' . esc_html($result->get_error_message()) . '</p></div>';
            } else {
                echo '<div class="notice notice-success"><p>' . __('API connectivity successful!', 'payvost') . '</p></div>';
            }
        }
        ?>
    </div>
    <?php
}
// Test API connectivity
function payvost_test_api($api_key) {
    $response = wp_remote_get(PAYVOST_API_BASE . '/ping', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/json',
        ],
        'timeout' => 10,
    ]);
    if (is_wp_error($response)) return $response;
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['success']) || !$data['success']) {
        return new WP_Error('payvost_api', __('API connectivity failed.', 'payvost'));
    }
    return true;
}

// Add submenu for transaction history
add_action('admin_menu', function() {
    add_submenu_page(
        'payvost-settings',
        __('Transaction History', 'payvost'),
        'Transaction History',
        'manage_options',
        'payvost-transactions',
        'payvost_transactions_page'
    );
});

function payvost_transactions_page() {
    $api_key = esc_attr(get_option('payvost_api_key'));
    echo '<div class="wrap"><h1>' . __('Payvost Transactions', 'payvost') . '</h1>';
    if (!$api_key) {
        echo '<p style="color:red">' . __('API Key not set.', 'payvost') . '</p></div>';
        return;
    }
    $transactions = payvost_fetch_transactions($api_key);
    if (is_wp_error($transactions)) {
        echo '<p style="color:red">' . esc_html($transactions->get_error_message()) . '</p></div>';
        return;
    }
    echo '<table class="widefat"><thead><tr><th>ID</th><th>Amount</th><th>Currency</th><th>Status</th><th>Date</th></tr></thead><tbody>';
    foreach ($transactions as $txn) {
        echo '<tr>';
        echo '<td>' . esc_html($txn['id']) . '</td>';
        echo '<td>' . esc_html($txn['amount']) . '</td>';
        echo '<td>' . esc_html($txn['currency']) . '</td>';
        echo '<td>' . esc_html($txn['status']) . '</td>';
        echo '<td>' . esc_html($txn['date']) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table></div>';
}

function payvost_fetch_transactions($api_key) {
    $response = wp_remote_get(PAYVOST_API_BASE . '/transactions', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/json',
        ],
        'timeout' => 15,
    ]);
    if (is_wp_error($response)) return $response;
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['transactions'])) {
        return new WP_Error('payvost_api', __('Invalid response from Payvost API.', 'payvost'));
    }
    return $data['transactions'];
}

// Register settings
function payvost_register_settings() {
    register_setting('payvost_settings_group', 'payvost_api_key');
    add_settings_section('payvost_main_section', __('API Settings', 'payvost'), null, 'payvost-settings');
    add_settings_field('payvost_api_key', __('API Key', 'payvost'), 'payvost_api_key_field', 'payvost-settings', 'payvost_main_section');
}
add_action('admin_init', 'payvost_register_settings');

function payvost_api_key_field() {
    $api_key = esc_attr(get_option('payvost_api_key'));
    echo '<input type="text" name="payvost_api_key" value="' . $api_key . '" class="regular-text" />';
}

// Example: Shortcode to display Payvost payment button
function payvost_payment_button_shortcode($atts) {
    $atts = shortcode_atts([
        'amount' => '10.00',
        'currency' => 'USD',
        'label' => 'Pay with Payvost',
        'style' => '',
        'redirect' => '',
    ], $atts, 'payvost_button');

    $api_key = esc_attr(get_option('payvost_api_key'));
    $button_id = uniqid('payvost_btn_');

    // KYC status check via Payvost API
    $kyc = payvost_check_kyc($api_key);
    if (is_wp_error($kyc)) {
        return '<span style="color:red">' . esc_html($kyc->get_error_message()) . '</span>';
    }
    if (!$kyc['verified']) {
        return '<span style="color:red">' . __('KYC not verified. Please complete KYC to use Payvost payments.', 'payvost') . '</span>';
    }

    // Validate currency against supported list from backend
    $supported = payvost_supported_currencies($api_key);
    if (is_wp_error($supported)) {
        return '<span style="color:red">' . esc_html($supported->get_error_message()) . '</span>';
    }
    if (!in_array($atts['currency'], $supported)) {
        return '<span style="color:red">' . __('Unsupported currency.', 'payvost') . '</span>';
    }

    $style = esc_attr($atts['style']);
    $redirect = esc_url($atts['redirect']);

    $html = '<button id="' . $button_id . '" class="payvost-payment-btn" style="' . $style . '">' . esc_html($atts['label']) . '</button>';
    $html .= '<script>
        document.getElementById("' . $button_id . '").onclick = function() {
            alert("Redirecting to Payvost for payment...");
            var url = "' . PAYVOST_API_BASE . '/pay?amount=' . urlencode($atts['amount']) . '&currency=' . urlencode($atts['currency']) . '";
            if ("' . $redirect . '") {
                window.location.href = "' . $redirect . '";
            } else {
                window.open(url, "_blank");
            }
        };
    </script>';
    return $html;
}

function payvost_check_kyc($api_key) {
    $response = wp_remote_get(PAYVOST_API_BASE . '/user/kyc', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/json',
        ],
        'timeout' => 10,
    ]);
    if (is_wp_error($response)) return $response;
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['verified'])) {
        return new WP_Error('payvost_api', __('Invalid response from Payvost API.', 'payvost'));
    }
    return $data;
}

function payvost_supported_currencies($api_key) {
    $response = wp_remote_get(PAYVOST_API_BASE . '/currencies', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/json',
        ],
        'timeout' => 10,
    ]);
    if (is_wp_error($response)) return $response;
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['currencies'])) {
        return new WP_Error('payvost_api', __('Invalid response from Payvost API.', 'payvost'));
    }
    return $data['currencies'];
}
add_shortcode('payvost_button', 'payvost_payment_button_shortcode');

// TODO: Add webhook handler, transaction sync, and more advanced features
// Register REST API endpoint for Payvost webhooks
add_action('rest_api_init', function () {
    register_rest_route('payvost/v1', '/webhook', array(
        'methods' => 'POST',
        'callback' => 'payvost_webhook_handler',
        'permission_callback' => '__return_true', // Optionally add secret validation
    ));
});

function payvost_webhook_handler($request) {
    $body = $request->get_body_params();
    // Example expected: ['event' => 'payment.completed', 'data' => [...]]
    if (empty($body['event']) || empty($body['data'])) {
        return new WP_REST_Response(['error' => 'Invalid payload'], 400);
    }

    // TODO: Validate webhook secret if required

    // Example: Update order/payment status based on event
    switch ($body['event']) {
        case 'payment.completed':
            // $transaction_id = $body['data']['transaction_id'];
            // $amount = $body['data']['amount'];
            // $currency = $body['data']['currency'];
            // $user_id = $body['data']['user_id'];
            // TODO: Find corresponding WP order/payment and mark as completed
            // For demo, just log event
            payvost_log_event('Payment completed webhook received', $body);
            break;
        case 'payment.failed':
            payvost_log_event('Payment failed webhook received', $body);
            break;
        // Add more event types as needed
        default:
            payvost_log_event('Unknown webhook event', $body);
            break;
    }

    return new WP_REST_Response(['success' => true], 200);
}

// Simple logger for webhook events (can be expanded later)
function payvost_log_event($message, $data = []) {
    $log_file = WP_CONTENT_DIR . '/payvost-webhook.log';
    $log = '[' . date('Y-m-d H:i:s') . "] Payvost: $message " . print_r($data, true) . "\n";
    file_put_contents($log_file, $log, FILE_APPEND);
}

// Display admin notices for errors
add_action('admin_notices', function() {
    $notices = get_option('payvost_admin_notices', []);
    if (!empty($notices)) {
        foreach ($notices as $notice) {
            echo '<div class="notice notice-error"><p>' . esc_html($notice) . '</p></div>';
        }
        update_option('payvost_admin_notices', []); // Clear after display
    }
});

function payvost_add_admin_notice($msg) {
    $notices = get_option('payvost_admin_notices', []);
    $notices[] = $msg;
    update_option('payvost_admin_notices', $notices);
}

// Example usage in API error situations
function payvost_handle_api_error($error) {
    payvost_log_event('API Error', ['error' => $error]);
    payvost_add_admin_notice('Payvost API Error: ' . $error);
}
