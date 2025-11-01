<?php
defined('BASEPATH') or exit('No direct script access allowed');

// Admin settings
$route['admin/payvost/settings'] = 'payvost/settings';
$route['admin/payvost/logs']     = 'payvost/logs';

// Webhook/callback endpoint (public)
$route['payvost/callback'] = 'payvost/callback';
$route['payvost/init/(:num)'] = 'payvost/init/$1';
