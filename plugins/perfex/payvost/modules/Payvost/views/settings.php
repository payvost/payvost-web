<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="row">
      <div class="col-md-12">
        <div class="panel_s">
          <div class="panel-body">
            <h4 class="tw-font-semibold"><?php echo _l('payvost_settings_title'); ?></h4>
            <hr/>
            <?php echo form_open(admin_url('payvost/settings')); ?>
            <div class="form-group">
              <label for="payvost_api_key" class="control-label"><?php echo _l('payvost_api_key'); ?></label>
              <input type="text" name="payvost_api_key" id="payvost_api_key" class="form-control" value="<?php echo html_escape($payvost_api_key); ?>" />
            </div>
            <div class="form-group">
              <label for="payvost_environment" class="control-label"><?php echo _l('payvost_environment'); ?></label>
              <select name="payvost_environment" id="payvost_environment" class="form-control">
                <option value="production" <?php echo $payvost_environment==='production'?'selected':''; ?>>Production</option>
                <option value="sandbox" <?php echo $payvost_environment==='sandbox'?'selected':''; ?>>Sandbox</option>
              </select>
            </div>
            <div class="form-group">
              <label for="payvost_webhook_secret" class="control-label"><?php echo _l('payvost_webhook_secret'); ?></label>
              <input type="text" name="payvost_webhook_secret" id="payvost_webhook_secret" class="form-control" value="<?php echo html_escape($payvost_webhook_secret); ?>" />
              <span class="help-block"><?php echo _l('payvost_webhook_secret_help'); ?></span>
            </div>
            <button type="submit" class="btn btn-primary"><?php echo _l('submit'); ?></button>
            <?php echo form_close(); ?>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php init_tail(); ?>
