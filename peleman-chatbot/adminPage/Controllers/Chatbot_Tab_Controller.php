<?php 
declare(strict_types=1);

namespace PelemanChatbot\adminPage\Controllers;

use PelemanChatbot\adminPage\Views\Peleman_Chatbot_Menu;

class Chatbot_Tab_Controller {
    public function __construct() {
        add_action('admin_init', [$this, 'register_settings'], 20);
        add_filter(
            'WSPPE_get_admin_menu_tabs',
            array($this, 'add_chatbot_panel'),
            10,
            1
        );
    }
	
	public function register_settings() {
		$chatbot_menu = new Peleman_Chatbot_Menu;
		$chatbot_menu->register_settings();
	}
    
    public function add_chatbot_panel(array $tabs) {
		if (!isset($tabs['Chatbot'])) {
			$tabs['Chatbot'] = new Peleman_Chatbot_Menu;
		}
		return $tabs;
    }
}
