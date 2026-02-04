<?php 
declare(strict_types=1);

namespace PelemanChatbot\adminPage\Views;

class Peleman_Chatbot_Menu {
    private string $page_slug;
	private string $title;
	private string $option_group;

    public function __construct() {
        $this->page_slug = 'peleman-chatbot-control-panel';
        $this->title = 'Peleman Chatbot Settings';
        $this->option_group = 'peleman_options_group';
    }
	
	public function get_title() {
		return $this->title;
	}

	public function render_menu(?string $page_slug = null): void {
        // Form wrapper is handled by Peleman_Menu, we just render the content
        settings_fields($this->option_group);
        do_settings_sections($this->page_slug);
        submit_button();
    }

    public function register_settings(): void {
        register_setting($this->option_group, 'peleman_gemini_api_key', array(
            'type' => 'string',
            'description' => 'Gemini API Key for Peleman Chatbot',
            'sanitize_callback' => 'sanitize_text_field',
            'show_in_rest' => false,
            'default' => ''
        ));
        
        $this->add_menu_components();
    }

    private function add_menu_components(): void {
        add_settings_section(
            $this->option_group,
            "",
            [$this, 'render_chatbot_info_section'],
            $this->page_slug,
        );
        
        add_settings_field(
            'peleman_gemini_api_key',
            __('Gemini API Key', 'peleman-chatbot'),
            array($this, 'text_property_callback'),
            $this->page_slug,
            $this->option_group,
            array(
                'option' => 'peleman_gemini_api_key',
                'placeholder' => '',
                'description' => __('Enter your Google Gemini API key', 'peleman-chatbot'),
            )
        );
        
        add_settings_field(
            'peleman_catalog_update',
            __('Catalog Cache Management', 'peleman-chatbot'),
            array($this, 'catalog_management_callback'),
            $this->page_slug,
            $this->option_group,
            array()
        );
    }
	
	public function render_chatbot_info_section() {
		?>
		<div class="peleman-chatbot-settings">
			<h1>Peleman AI Chatbot</h1>
			<h3>Current Version: 1.0.0</h3>
			<hr>
			<p>Adds a React-based Gemini AI chatbot to the footer of the website.</p>
			<p>The chatbot provides intelligent product recommendations and customer support.</p>
			<hr>
		</div>
		<?php
	}
	
	public function text_property_callback(array $args): void {
        $option = $args['option'];
        $value = get_option($option);
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';
        $description = isset($args['description']) ? $args['description'] : '';

        $classArray = isset($args['classes']) ? $args['classes'] : [];
        $classArray[] = 'regular-text';
        $classes = implode(" ", $classArray);
    ?>
        <input type="text" id="<?php echo esc_attr($option); ?>" name="<?php echo esc_attr($option); ?>" value="<?php echo esc_attr($value); ?>" placeholder="<?php echo esc_attr($placeholder); ?>" class="<?php echo esc_attr($classes); ?>" size=40 />
    <?php
        if ($description) {
            echo wp_kses_post("<p class='description'>{$description}</p>");
        }
    }
	
	public function catalog_management_callback(array $args): void {
		$languages = ['en' => 'English', 'fr' => 'French', 'es' => 'Spanish', 'nl' => 'Dutch'];
		?>
		<div class="catalog-cache-management">
			<p>Catalog data is automatically updated daily for all languages (EN, FR, ES, NL). You can manually update all languages at once if needed.</p>
			<p><strong>Note:</strong> Catalog language matches your site's language. Chatbot conversation language is detected automatically from user's messages.</p>
			
			<p>
				<button type="button" class="button button-primary peleman-update-all-catalogs">
					<?php _e('Update All Catalogs Now', 'peleman-chatbot'); ?>
				</button>
				<span class="peleman-update-status" style="margin-left: 10px; display: none;"></span>
			</p>
			
			<h3><?php _e('Last Updated Times', 'peleman-chatbot'); ?></h3>
			<table class="form-table">
				<?php foreach ($languages as $lang_code => $lang_name): 
					$timestamp = get_option('peleman_catalog_cache_timestamp_' . $lang_code, 0);
					// Ensure timestamp is integer
					$timestamp = is_numeric($timestamp) ? (int) $timestamp : 0;
					$last_updated = $timestamp > 0 ? date('Y-m-d H:i:s', $timestamp) : 'Never';
				?>
				<tr>
					<th scope="row"><?php echo esc_html($lang_name); ?> (<?php echo esc_html(strtoupper($lang_code)); ?>)</th>
					<td>
						<span class="description">
							<?php _e('Last updated:', 'peleman-chatbot'); ?> <strong><?php echo esc_html($last_updated); ?></strong>
						</span>
					</td>
				</tr>
				<?php endforeach; ?>
			</table>
		</div>
		
		<script>
		jQuery(document).ready(function($) {
			$('.peleman-update-all-catalogs').on('click', function() {
				var $button = $(this);
				var $status = $('.peleman-update-status');
				
				$button.prop('disabled', true).text('<?php _e('Updating all catalogs...', 'peleman-chatbot'); ?>');
				$status.show().text('').removeClass('error success');
				
				$.ajax({
					url: ajaxurl,
					type: 'POST',
					data: {
						action: 'peleman_update_catalog'
					},
					success: function(response) {
						if (response.success) {
							$status.html('✓ <?php _e('All catalogs updated successfully!', 'peleman-chatbot'); ?><br><?php _e('Timestamps:', 'peleman-chatbot'); ?> ' + JSON.stringify(response.data.timestamps)).addClass('success').css('color', 'green');
							setTimeout(function() {
								location.reload();
							}, 2000);
						} else {
							var msg = '✗ <?php _e('Update failed', 'peleman-chatbot'); ?>';
							if (response.data && response.data.failed) {
								msg += ' (<?php _e('Failed:', 'peleman-chatbot'); ?> ' + response.data.failed.join(', ') + ')';
							}
							$status.text(msg).addClass('error').css('color', 'red');
						}
					},
					error: function() {
						$status.text('✗ <?php _e('Update failed', 'peleman-chatbot'); ?>').addClass('error').css('color', 'red');
					},
					complete: function() {
						$button.prop('disabled', false).text('<?php _e('Update All Catalogs Now', 'peleman-chatbot'); ?>');
					}
				});
			});
		});
		</script>
		<?php
	}
}
