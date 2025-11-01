<?php
defined('BASEPATH') or exit('No direct script access allowed');

// Admin controller for Payvost module
class Payvost extends AdminController
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('payvost/payvost_model');
    }

    // Setup -> Settings -> Payvost
    public function settings()
    {
        if (!has_permission('settings', '', 'view')) {
            access_denied('settings');
        }

        if ($this->input->post()) {
            if (!has_permission('settings', '', 'edit')) {
                access_denied('settings');
            }
            $data = $this->input->post();
            update_option('payvost_api_key', trim($data['payvost_api_key'] ?? ''));
            update_option('payvost_environment', trim($data['payvost_environment'] ?? 'production'));
            update_option('payvost_webhook_secret', trim($data['payvost_webhook_secret'] ?? ''));
            set_alert('success', _l('settings_updated'));
            redirect(admin_url('payvost/settings'));
        }

        $data['title']               = _l('payvost_settings_title');
        $data['payvost_api_key']     = get_option('payvost_api_key');
        $data['payvost_environment'] = get_option('payvost_environment') ?: 'production';
        $data['payvost_webhook_secret'] = get_option('payvost_webhook_secret');
        $this->load->view('payvost/settings', $data);
    }

    // Public callback (webhook)
    public function callback()
    {
        // Read JSON body
        $rawBody = $this->input->raw_input_stream;
        $payload = json_decode($rawBody, true);
        if (!$payload || empty($payload['event'])) {
            return $this->output->set_status_header(400)->set_content_type('application/json')->set_output(json_encode(['error' => 'Invalid payload']));
        }

        // Validate signature/secret (HMAC SHA256). Header name may vary by provider.
        $secret = get_option('payvost_webhook_secret');
        $signature = $this->input->get_request_header('X-Payvost-Signature');
        if ($secret && $signature) {
            $computed = hash_hmac('sha256', $rawBody, $secret);
            if (!hash_equals($computed, $signature)) {
                log_activity('Payvost: Invalid webhook signature');
                return $this->output->set_status_header(401)->set_content_type('application/json')->set_output(json_encode(['error' => 'Invalid signature']));
            }
        }

        // Process events
        switch ($payload['event']) {
            case 'payment.completed':
                // Example: mark invoice as paid
                $invoiceId = $payload['data']['invoice_id'] ?? null;
                $amount    = $payload['data']['amount'] ?? null;
                if ($invoiceId) {
                    $this->payvost_model->mark_invoice_paid($invoiceId, $amount, 'Payvost');
                }
                break;
            case 'payment.failed':
                // Log failure
                log_activity('Payvost: Payment failed ' . json_encode($payload));
                break;
            default:
                log_activity('Payvost: Unknown webhook ' . json_encode($payload));
        }

        return $this->output->set_content_type('application/json')->set_output(json_encode(['success' => true]));
    }

    // Admin: view logs
    public function logs()
    {
        if (!has_permission('settings', '', 'view')) {
            access_denied('settings');
        }
        $this->db->order_by('id', 'DESC');
        $data['logs'] = $this->db->get(db_prefix() . 'payvost_logs')->result_array();
        $data['title'] = 'Payvost Logs';
        $this->load->view('payvost/logs', $data);
    }

    // Initialize payment for an invoice (admin)
    public function init($invoiceId)
    {
        if (!is_admin()) {
            show_404();
        }
        $this->load->model('invoices_model');
        $invoice = $this->invoices_model->get($invoiceId);
        if (!$invoice) {
            set_alert('danger', 'Invoice not found');
            return redirect(admin_url('invoices/list_invoices'));
        }
        $amountDue = $invoice->total - $invoice->total_paid;
        if ($amountDue <= 0) {
            set_alert('success', 'Invoice already paid');
            return redirect(admin_url('invoices/list_invoices')); 
        }
        $this->load->library('payvost/Payvost_gateway');
        $resp = $this->payvost_gateway->init_payment($invoiceId, $amountDue, $invoice->currency_name ?? 'USD');
        if (isset($resp['error'])) {
            set_alert('danger', 'Payvost error: ' . $resp['error']);
            return redirect(admin_url('invoices/list_invoices'));
        }
        if (isset($resp['checkout_url'])) {
            redirect($resp['checkout_url']);
        }
        set_alert('danger', 'Unexpected Payvost response');
        return redirect(admin_url('invoices/list_invoices'));
    }
}
