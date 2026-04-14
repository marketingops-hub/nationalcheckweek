<?php

namespace ElementorPro\Modules\Forms\Actions;

use Elementor\Controls_Manager;
use ElementorPro\Core\Utils;
use ElementorPro\Modules\Forms\Classes\Action_Base;
use Exception;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class LiveEventsFormAction extends Action_Base
{
    public function get_name()
    {
        return 'live-events';
    }

    public function get_label()
    {
        return __('Live Events', 'elmformaction');
    }

    public function register_settings_section($widget)
    {
        $widget->start_controls_section(
            'section_live_events',
            [
                'label' => __('Live Events', 'elmformaction'),
                'condition' => [
                    'submit_actions' => $this->get_name(),
                ],
            ]
        );

        // HubSpot Form ID
        $widget->add_control(
            'hubspot_form_id',
            [
                'label' => __('HubSpot Form ID', 'elmformaction'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => '123456789',
                'label_block' => true,
                'separator' => 'before',
                'description' => __('Enter the HubSpot form ID that will receive the form data.', 'elmformaction'),
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // Thank You Message
        $widget->add_control(
            'live_events_custom_thank_you',
            [
                'label' => __('Custom Thank You Message', 'elmformaction'),
                'type' => Controls_Manager::WYSIWYG,
                'default' => __('Thank you for registering!', 'elmformaction'),
                'label_block' => true,
                'separator' => 'before',
            ]
        );

        // Zoom Webinar ID
        $widget->add_control(
            'zoom_webinar_id',
            [
                'label' => __('Zoom Webinar ID', 'elmformaction'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => 'Enter Zoom Webinar ID',
                'label_block' => true,
                'separator' => 'before',
                'description' => __('Enter the Zoom Webinar ID associated with this event.', 'elmformaction'),
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // Zoom Registration Tag
        $widget->add_control(
            'zoom_registration_tag',
            [
                'label' => __('Zoom Registration Tag', 'elmformaction'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => 'Enter tag for bulk Zoom registration',
                'label_block' => true,
                'separator' => 'before',
                'description' => __('Enter a tag to be saved against the bulk_zoom_registration field.', 'elmformaction'),
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $widget->end_controls_section();
    }

    public function on_export($element)
    {
        unset(
            $element['hubspot_form_id'],
            $element['live_events_custom_thank_you']
        );

        return $element;
    }

    public function run($record, $ajax_handler)
    {
        $settings = $record->get('form_settings');
        $form_data = $record->get('sent_data');

        try {
            // Log initial form data
            error_log('Live Events - Initial form data received: ' . print_r($form_data, true));

            $hubspot_portal_id = defined('HUBSPOT_PORTAL_ID') ? HUBSPOT_PORTAL_ID : null;
            $hubspot_client_id = defined('HUBSPOT_CLIENT_ID') ? HUBSPOT_CLIENT_ID : null;
            $hubspot_client_secret = defined('HUBSPOT_CLIENT_SECRET') ? HUBSPOT_CLIENT_SECRET : null;
            $hubspot_refresh_token = defined('HUBSPOT_REFRESH_TOKEN') ? HUBSPOT_REFRESH_TOKEN : null;

            if (!$hubspot_client_id || !$hubspot_client_secret || !$hubspot_refresh_token) {
                throw new Exception('HubSpot OAuth credentials are not configured');
            }

            // Get access token using refresh token
            $token_url = 'https://api.hubapi.com/oauth/v1/token';
            $token_data = [
                'grant_type' => 'refresh_token',
                'client_id' => $hubspot_client_id,
                'client_secret' => $hubspot_client_secret,
                'refresh_token' => $hubspot_refresh_token
            ];

            $token_response = wp_remote_post($token_url, [
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded'
                ],
                'body' => $token_data
            ]);

            if (is_wp_error($token_response)) {
                throw new Exception('Failed to get HubSpot access token: ' . $token_response->get_error_message());
            }

            $token_body = json_decode(wp_remote_retrieve_body($token_response), true);
            $access_token = $token_body['access_token'];

            $hubspot_form_id = $settings['hubspot_form_id'];
            $main_hubspot_url = "https://api.hsforms.com/submissions/v3/integration/submit/{$hubspot_portal_id}/{$hubspot_form_id}";
            $create_contact_url = "https://api.hubapi.com/crm/v3/objects/contacts";

            // Map fields for main registrant
            $field_mapping = [
                'email' => 'email',
                'first_name' => 'firstname',
                'last_name' => 'lastname',
                'role' => 'role',
                'school_id' => 'lsgo_associated_company',
                'manual_school' => 'school_name_2023',
                'number_of_guests' => 'lsgo_number_of_additional_guests',
                'event_to_attend' => 'lsgo_form_event_to_attend',
                'dietary_requirements' => 'attendee_dietary_requirements',
                'allergy_details' => 'attendee_dietary_requirements_allergies',
                'other_dietary_details' => 'attendee_dietary_requirements_other'
            ];

            error_log('Live Events - Field mapping configuration: ' . print_r($field_mapping, true));

            $fields = [];
            foreach ($form_data as $field_id => $value) {
                // Skip guest fields
                if (strpos($field_id, 'guest_') === 0) {
                    continue;
                }

                error_log("Live Events - Processing field '{$field_id}' with value: " . print_r($value, true));

                // Check if we have a mapping for this field
                $hubspot_field = $field_mapping[$field_id] ?? $field_id;

                // Special handling for dietary requirements
                if ($field_id === 'dietary_requirements') {
                    $field_value = is_array($value) ? implode(';', $value) : $value;
                    error_log("Live Events - Processed dietary requirements: {$field_value}");
                } else {
                    $field_value = is_array($value) ? implode(';', $value) : $value;
                }

                $fields[] = [
                    'name' => $hubspot_field,
                    'value' => $field_value
                ];
            }

            // If the register_for_zoom_webinar checkbox is ticked, add last_zoom_webinar_registered field
            if (!empty($form_data['register_for_zoom_webinar']) && $form_data['register_for_zoom_webinar'] === 'yes') {
                $zoom_webinar_id = $settings['zoom_webinar_id'] ?? '';
                if (!empty($zoom_webinar_id)) {
                    $fields[] = [
                        'name' => 'last_zoom_webinar_registered_id__',
                        'value' => $zoom_webinar_id
                    ];
                }
            }

            // Save the Zoom registration tag to bulk_zoom_registration if set
            if (!empty($settings['zoom_registration_tag'])) {
                $fields[] = [
                    'name' => 'bulk_zoom_registration',
                    'value' => $settings['zoom_registration_tag']
                ];
            }

            // Prepare guest details summary
            $guest_details = [];
            $guest_count = isset($form_data['number_of_guests']) ? intval($form_data['number_of_guests']) : 0;

            for ($i = 1; $i <= $guest_count; $i++) {
                if (empty($form_data["guest_{$i}_email"])) {
                    continue;
                }

                $dietary_requirements = isset($form_data["guest_{$i}_dietary_requirements"])
                    ? implode(', ', $form_data["guest_{$i}_dietary_requirements"])
                    : 'None';

                $guest_details[] = sprintf(
                    "Guest %d:\n" .
                        "Name: %s %s\n" .
                        "Email: %s\n" .
                        "Role: %s\n" .
                        "School: %s\n" .
                        "Dietary Requirements: %s\n" .
                        "Allergy Details: %s\n" .
                        "Other Dietary Details: %s\n",
                    $i,
                    $form_data["guest_{$i}_first_name"] ?? '',
                    $form_data["guest_{$i}_last_name"] ?? '',
                    $form_data["guest_{$i}_email"] ?? '',
                    $form_data["guest_{$i}_role"] ?? '',
                    $form_data["guest_{$i}_school"] ?? $form_data["guest_{$i}_manual_school"] ?? '',
                    $dietary_requirements,
                    $form_data["guest_{$i}_allergy_details"] ?? 'None',
                    $form_data["guest_{$i}_other_dietary_details"] ?? 'None'
                );
            }

            // Add guest details to fields array
            if (!empty($guest_details)) {
                $fields[] = [
                    'name' => 'lsgo_additional_guest_details',
                    'value' => implode("\n---\n", $guest_details)
                ];
            }

            // Add the NCIW QLD event attendance
            $fields[] = [
                'name' => 'lsgo_form_event_to_attend',
                'value' => 'nciw_qld'
            ];

            error_log('Live Events - Prepared fields with guest details: ' . print_r($fields, true));

            // Submit main registrant to HubSpot form
            $hubspot_data = [
                'fields' => $fields,
                'context' => [
                    'pageUri' => $_SERVER['HTTP_REFERER'] ?? '',
                    'pageName' => get_the_title() ?? '',
                    'hutk' => $_COOKIE['hubspotutk'] ?? null
                ]
            ];

            error_log('Live Events - Submitting main registrant data to HubSpot: ' . print_r($hubspot_data, true));

            $main_response = wp_remote_post($main_hubspot_url, [
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => json_encode($hubspot_data),
                'timeout' => 15
            ]);

            if (is_wp_error($main_response)) {
                throw new Exception('Main registrant HubSpot submission failed: ' . $main_response->get_error_message());
            }

            $main_body = json_decode(wp_remote_retrieve_body($main_response), true);
            error_log('Live Events - Main registrant HubSpot response: ' . print_r($main_body, true));

            // Process additional guests as contacts
            $guest_count = isset($form_data['number_of_guests']) ? intval($form_data['number_of_guests']) : 0;
            error_log("Live Events - Processing {$guest_count} additional guests");

            for ($i = 1; $i <= $guest_count; $i++) {
                if (empty($form_data["guest_{$i}_email"])) {
                    error_log("Live Events - Skipping guest {$i} due to empty email");
                    continue;
                }

                $guest_email = $form_data["guest_{$i}_email"];
                error_log("Live Events - Processing guest {$i} data for email: {$guest_email}");

                // First, try to find if contact exists
                $search_contact_url = "https://api.hubapi.com/crm/v3/objects/contacts/search";
                $search_data = [
                    'filterGroups' => [[
                        'filters' => [[
                            'propertyName' => 'email',
                            'operator' => 'EQ',
                            'value' => $guest_email
                        ]]
                    ]]
                ];

                $search_response = wp_remote_post($search_contact_url, [
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Authorization' => 'Bearer ' . $access_token
                    ],
                    'body' => json_encode($search_data),
                    'timeout' => 15
                ]);

                if (is_wp_error($search_response)) {
                    error_log("Live Events - Failed to search for existing contact: " . $search_response->get_error_message());
                    continue;
                }

                $search_body = json_decode(wp_remote_retrieve_body($search_response), true);
                $contact_exists = !empty($search_body['results']);
                $contact_id = $contact_exists ? $search_body['results'][0]['id'] : null;

                // Prepare contact properties
                $contact_properties = [
                    'email' => $guest_email,
                    'firstname' => $form_data["guest_{$i}_first_name"] ?? '',
                    'lastname' => $form_data["guest_{$i}_last_name"] ?? '',
                    'role' => $form_data["guest_{$i}_role"] ?? '',
                    'lsgo_associated_company' => $form_data["guest_{$i}_school"] ?? $form_data["guest_{$i}_manual_school"] ?? $form_data['school_id'] ?? '',
                    'lsgo_form_event_to_attend' => 'nciw_qld',
                    'attendee_dietary_requirements' => isset($form_data["guest_{$i}_dietary_requirements"]) ?
                        implode(';', $form_data["guest_{$i}_dietary_requirements"]) : '',
                    'attendee_dietary_requirements_allergies' => $form_data["guest_{$i}_allergy_details"] ?? '',
                    'attendee_dietary_requirements_other' => $form_data["guest_{$i}_other_dietary_details"] ?? ''
                ];
                // If the register_for_zoom_webinar checkbox is ticked, set the guest's last_zoom_webinar_registered_id__ property
                if (!empty($form_data['register_for_zoom_webinar']) && $form_data['register_for_zoom_webinar'] === 'yes') {
                    $zoom_webinar_id = $settings['zoom_webinar_id'] ?? '';
                    if (!empty($zoom_webinar_id)) {
                        $contact_properties['last_zoom_webinar_registered_id__'] = $zoom_webinar_id;
                    }
                }
                // If the zoom_registration_tag is set, set the guest's bulk_zoom_registration property
                if (!empty($settings['zoom_registration_tag'])) {
                    $contact_properties['bulk_zoom_registration'] = $settings['zoom_registration_tag'];
                }

                error_log("Live Events - Prepared contact properties for guest {$i}: " . print_r($contact_properties, true));

                if ($contact_exists) {
                    // Update existing contact
                    error_log("Live Events - Updating existing contact for guest {$i} with ID: {$contact_id}");
                    $update_url = "https://api.hubapi.com/crm/v3/objects/contacts/{$contact_id}";
                    $guest_response = wp_remote_request($update_url, [
                        'method' => 'PATCH',
                        'headers' => [
                            'Content-Type' => 'application/json',
                            'Authorization' => 'Bearer ' . $access_token
                        ],
                        'body' => json_encode(['properties' => $contact_properties]),
                        'timeout' => 15
                    ]);
                } else {
                    // Create new contact
                    error_log("Live Events - Creating new contact for guest {$i}");
                    $guest_response = wp_remote_post($create_contact_url, [
                        'headers' => [
                            'Content-Type' => 'application/json',
                            'Authorization' => 'Bearer ' . $access_token
                        ],
                        'body' => json_encode(['properties' => $contact_properties]),
                        'timeout' => 15
                    ]);
                }

                if (is_wp_error($guest_response)) {
                    error_log("Live Events - Failed to " . ($contact_exists ? "update" : "create") .
                        " HubSpot contact for guest {$i}: " . $guest_response->get_error_message());
                    continue;
                }

                $guest_body = json_decode(wp_remote_retrieve_body($guest_response), true);
                error_log("Live Events - HubSpot response for guest {$i}: " . print_r($guest_body, true));

                $response['guest_responses'][] = [
                    'guest_number' => $i,
                    'action' => $contact_exists ? 'updated' : 'created',
                    'response' => $guest_body
                ];
            }

            // Initialize response structure
            $response = [
                'form_data' => $form_data,
                'form_fields' => array_keys($form_data),
                'hubspot_response' => [
                    'inlineMessage' => $main_body['inlineMessage'] ?? 'Thanks for submitting the form.'
                ]
            ];

            error_log('Live Events - Final response structure: ' . print_r($response, true));

            // Send the final response
            $ajax_handler->add_response_data('success', true);
            $ajax_handler->add_response_data('message', $response['message']);
            $ajax_handler->add_response_data('data', $response);
        } catch (Exception $e) {
            error_log('Live Events - Form submission error: ' . $e->getMessage());
            error_log('Live Events - Error trace: ' . $e->getTraceAsString());
            $ajax_handler->add_error_message('Form submission failed: ' . $e->getMessage());
        }
    }
}
