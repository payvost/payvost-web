<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="row">
      <div class="col-md-12">
        <div class="panel_s">
          <div class="panel-body">
            <h4 class="tw-font-semibold">Payvost Logs</h4>
            <hr/>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Level</th>
                    <th>Message</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($logs as $log): ?>
                    <tr>
                      <td><?php echo (int)$log['id']; ?></td>
                      <td><?php echo html_escape($log['date']); ?></td>
                      <td><?php echo html_escape($log['level']); ?></td>
                      <td><?php echo html_escape($log['message']); ?></td>
                      <td><pre style="white-space:pre-wrap;word-wrap:break-word;max-width:600px;"><?php echo html_escape($log['payload']); ?></pre></td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php init_tail(); ?>
