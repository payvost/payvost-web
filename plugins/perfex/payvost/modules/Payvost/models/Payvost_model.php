<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Payvost_model extends App_Model
{
    public function __construct()
    {
        parent::__construct();
        $this->load->helper('payvost/payvost');
    }

    public function mark_invoice_paid($invoiceId, $amount, $paymentMethod = 'Payvost')
    {
        // Minimal example using Perfex Payments
        $this->load->model('payments_model');
        $payment = [
            'amount'        => $amount,
            'invoiceid'     => $invoiceId,
            'paymentmode'   => $paymentMethod,
            'transactionid' => 'pv_' . time(),
            'note'          => 'Payvost auto-verified payment',
        ];
        return $this->payments_model->add($payment);
    }

    public function api_request($method, $path, $body = [])
    {
        $apiBase = get_option('payvost_api_base') ?: 'https://api.payvost.com';
        $apiKey  = get_option('payvost_api_key');
        if (!$apiKey) {
            return ['error' => 'API key missing'];
        }
        $url = rtrim($apiBase, '/') . '/' . ltrim($path, '/');
        $headers = [
            'Authorization: Bearer ' . $apiKey,
            'Accept: application/json',
            'Content-Type: application/json',
        ];

        $attempts = 0;
        $maxAttempts = 3;
        $delayMs = 200; // initial backoff
        do {
            $attempts++;
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            if (strtoupper($method) !== 'GET') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
            $response = curl_exec($ch);
            $errNo    = curl_errno($ch);
            $err      = curl_error($ch);
            $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($errNo || $status >= 500) {
                // transient error -> retry
                $this->add_log('error', 'API request failed', json_encode(['url' => $url, 'error' => $err, 'status' => $status]));
                usleep($delayMs * 1000);
                $delayMs *= 2;
                continue;
            }

            $data = json_decode($response, true);
            if ($status >= 400 || $data === null) {
                $this->add_log('error', 'API request error', json_encode(['url' => $url, 'status' => $status, 'response' => $response]));
                return ['error' => 'API responded with error', 'status' => $status, 'response' => $response];
            }
            return $data;
        } while ($attempts < $maxAttempts);

        return ['error' => 'API request failed after retries'];
    }

    public function add_log($level, $message, $payload = null)
    {
        $this->db->insert(db_prefix() . 'payvost_logs', [
            'level'   => $level,
            'message' => $message,
            'payload' => $payload,
        ]);
    }
}
