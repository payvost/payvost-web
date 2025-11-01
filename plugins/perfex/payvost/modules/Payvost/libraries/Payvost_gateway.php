<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Payvost_gateway
{
    protected $CI;

    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->load->model('payvost/payvost_model');
    }

    // Initialize payment for an invoice and return redirect URL
    public function init_payment($invoiceId, $amount, $currency = 'USD')
    {
        $payload = [
            'invoice_id' => $invoiceId,
            'amount'     => $amount,
            'currency'   => $currency,
            'callback'   => site_url('payvost/callback'),
        ];
        $resp = $this->CI->payvost_model->api_request('POST', '/payments/create', $payload);
        if (isset($resp['error'])) {
            return ['error' => $resp['error']];
        }
        return $resp; // Expecting ['checkout_url' => '...']
    }

    // Verify payment after redirect/webhook
    public function verify($transactionId)
    {
        $resp = $this->CI->payvost_model->api_request('GET', '/payments/' . $transactionId, []);
        return $resp;
    }
}
