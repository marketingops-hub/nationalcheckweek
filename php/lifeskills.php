<?php

namespace ElementorPro\Modules\Forms\Actions;

use Elementor\Controls_Manager;
use ElementorPro\Core\Utils;
use ElementorPro\Modules\Forms\Classes\Action_Base;
use Exception;

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// First define the ZoomAPI class
class ZoomAPI
{
    private $baseUrl = 'https://api.zoom.us/v2';
    private $accessToken = null;
    private $tokenExpiry = 0;

    private function authenticate()
    {
        try {
            $client_id = defined('ZOOM_CLIENT_ID') ? ZOOM_CLIENT_ID : null;
            $client_secret = defined('ZOOM_CLIENT_SECRET') ? ZOOM_CLIENT_SECRET : null;
            $account_id = defined('ZOOM_ACCOUNT_ID') ? ZOOM_ACCOUNT_ID : null;

            if (!$client_id || !$client_secret || !$account_id) {
                error_log(
                    'Zoom credentials missing: ' .
                        'client_id=' . ($client_id ? 'yes' : 'no') .
                        ', client_secret=' . ($client_secret ? 'yes' : 'no') .
                        ', account_id=' . ($account_id ? 'yes' : 'no')
                );
                return false;
            }

            $auth_token = base64_encode("$client_id:$client_secret");

            error_log('Attempting Zoom authentication...');

            $response = wp_remote_post('https://zoom.us/oauth/token', [
                'headers' => [
                    'Authorization' => "Basic {$auth_token}",
                    'Content-Type' => 'application/x-www-form-urlencoded'
                ],
                'body' => [
                    'grant_type' => 'account_credentials',
                    'account_id' => $account_id
                ]
            ]);

            if (is_wp_error($response)) {
                error_log('Zoom authentication failed: ' . $response->get_error_message());
                return false;
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            error_log('Zoom auth response: ' . print_r($body, true));

            if (empty($body['access_token']) || empty($body['expires_in'])) {
                error_log('Invalid Zoom response: ' . print_r($body, true));
                return false;
            }

            $this->accessToken = $body['access_token'];
            $this->tokenExpiry = time() + $body['expires_in'];

            return true;
        } catch (Exception $e) {
            error_log('Zoom authentication error: ' . $e->getMessage());
            return false;
        }
    }

    private function checkAuth()
    {
        if (!$this->accessToken || time() >= $this->tokenExpiry) {
            return $this->authenticate();
        }
        return true;
    }

    public function registerForWebinar($webinarId, $participant)
    {
        try {
            if (!$this->checkAuth()) {
                throw new Exception('Failed to authenticate with Zoom');
            }

            // Validate required fields
            if (empty($participant['email'])) {
                throw new Exception('Email is required for webinar registration');
            }

            error_log('Attempting webinar registration - Webinar ID: ' . $webinarId .
                ', Email: ' . $participant['email']);

            $response = wp_remote_post("{$this->baseUrl}/webinars/{$webinarId}/registrants", [
                'headers' => [
                    'Authorization' => "Bearer {$this->accessToken}",
                    'Content-Type' => 'application/json'
                ],
                'body' => json_encode([
                    'email' => $participant['email'],
                    'first_name' => $participant['first_name'] ?? 'Guest',
                    'last_name' => $participant['last_name'] ?? 'User'
                ])
            ]);

            if (is_wp_error($response)) {
                throw new Exception('Webinar registration failed: ' . $response->get_error_message());
            }

            $response_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);

            error_log('Zoom registration response code: ' . $response_code);
            error_log('Zoom registration response body: ' . $response_body);

            $body = json_decode($response_body, true);

            if ($response_code !== 201 && $response_code !== 200) {
                throw new Exception('Zoom API Error: ' . ($body['message'] ?? 'Unknown error'));
            }

            return $body;
        } catch (Exception $e) {
            error_log('Webinar registration error: ' . $e->getMessage());
            throw $e;
        }
    }
}

// Then define your main form action class
class LifeSkillsFormAction extends Action_Base
{
    public function get_name()
    {
        return 'lifeskills';
    }

    public function get_label()
    {
        return __('Life Skills', 'elmformaction');
    }

    public function register_settings_section($widget)
    {
        $widget->start_controls_section(
            'section_lifeskills',
            [
                'label' => __('Life Skills', 'elmformaction'),
                'condition' => [
                    'submit_actions' => $this->get_name(),
                ],
            ]
        );

        // Sentral Redirects
        $widget->add_control(
            'sentral_success_redirect',
            [
                'label' => __('Sentral Success Redirect URL', 'elmformaction'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://your-success-url.com',
                'label_block' => true,
                'separator' => 'before',
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $widget->add_control(
            'sentral_failure_redirect',
            [
                'label' => __('Sentral Failure Redirect URL', 'elmformaction'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://your-failure-url.com',
                'label_block' => true,
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // School Bytes Redirects
        $widget->add_control(
            'schoolbytes_success_redirect',
            [
                'label' => __('School Bytes Success Redirect URL', 'elmformaction'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://your-success-url.com',
                'label_block' => true,
                'separator' => 'before',
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $widget->add_control(
            'schoolbytes_failure_redirect',
            [
                'label' => __('School Bytes Failure Redirect URL', 'elmformaction'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://your-failure-url.com',
                'label_block' => true,
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // Book a Meeting URL
        $widget->add_control(
            'book_meeting_url',
            [
                'label' => __('Book a Meeting URL', 'elmformaction'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://calendly.com/your-link',
                'label_block' => true,
                'separator' => 'before',
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // Thank You Messages
        $widget->add_control(
            'custom_thank_you',
            [
                'label' => __('Custom Thank You Message', 'elmformaction'),
                'type' => Controls_Manager::WYSIWYG,
                'default' => __('Thank you for your submission!', 'elmformaction'),
                'label_block' => true,
                'separator' => 'before',
            ]
        );

        $widget->add_control(
            'redirect_thank_you',
            [
                'label' => __('Pre-Redirect Thank You Message', 'elmformaction'),
                'type' => Controls_Manager::WYSIWYG,
                'default' => __('Thank you! You will be redirected shortly...', 'elmformaction'),
                'label_block' => true,
            ]
        );

        // Original form ID control
        $widget->add_control(
            'lifeskills_form_id',
            [
                'label' => __('Form ID', 'elmformaction'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => '123456789',
                'ai' => [
                    'active' => false,
                ],
                'label_block' => true,
                'separator' => 'before',
                'description' => __('Enter the HubSpot form ID that will receive the user\'s data.', 'elmformaction') . ' ' . sprintf('<a href="%s" target="_blank">%s</a>.', 'https://slack.com/apps/A0F7XDUAZ-incoming-webhooks/', __('Click here for Instructions', 'elmformaction')),
                'render_type' => 'none',
                'classes' => 'elementor-control-direction-ltr',
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        // Add this after the book_meeting_url control
        $widget->add_control(
            'go_email_valid',
            [
                'label' => __('Allow Life Skills GO Email Addresses as Successful Submissions', 'elmformaction'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'elmformaction'),
                'label_off' => __('No', 'elmformaction'),
                'default' => '',
                'label_block' => true,
                'separator' => 'before',
                'description' => __('Enable this to allow @lifeskillsgroup.com email addresses to be considered valid.', 'elmformaction'),
            ]
        );

        $widget->end_controls_section();
    }

    public function on_export($element)
    {
        unset(
            $element['lifeskills_form_id'],
            $element['sentral_success_redirect'],
            $element['sentral_failure_redirect'],
            $element['schoolbytes_success_redirect'],
            $element['schoolbytes_failure_redirect'],
            $element['book_meeting_url'],
            $element['custom_thank_you'],
            $element['redirect_thank_you'],
            $element['go_email_valid']
        );

        return $element;
    }

    public function run($record, $ajax_handler)
    {
        $settings = $record->get('form_settings');
        $form_data = $record->get('sent_data');
        $response = [];

        try {
            // Your existing logic for determining redirect and messages
            $is_sentral = $form_data['sis_provider'] == 'Sentral';
            $is_schoolbytes = $form_data['sis_provider'] == 'School Bytes';
            $is_go_requested = $form_data['go_access'] == 'true'; // Replace with your actual logic
            $is_go_email_valid = $settings['go_email_valid'] == 'yes';
            $role = $form_data['role'];
            $isQualifiedEmail = strpos($form_data['email'], '.edu.au') !== false ||
                strpos($form_data['email'], '.gov.au') !== false ||
                (strpos($form_data['email'], 'lifeskillsgroup.com') !== false && $is_go_email_valid) ||
                strpos($form_data['email'], '.school.nz') !== false;
            $isQualifiedRole = in_array(strtolower($role), ['principal', 'assistant principal', 'teacher', 'learning support', 'wellbeing professional']);
            $is_success = $isQualifiedEmail && $isQualifiedRole;
            $response = [
                'success' => $is_success,
                'message' => '',
                'redirect' => '',
                'debug' => [
                    'form_data' => $form_data,
                    'form_fields' => array_keys($form_data),
                    'vars' => [
                        'is_sentral' => $is_sentral,
                        'is_schoolbytes' => $is_schoolbytes,
                        'is_go_requested' => $is_go_requested,
                        'is_success' => $is_success,
                        'is_go_email_valid' => $is_go_email_valid,
                        'is_qualified_email' => $isQualifiedEmail,
                        'is_qualified_role' => $isQualifiedRole,
                        'go_access' => $form_data['go_access'],
                        'subscribe_to_newsletter' => $form_data['newsletter_opt_in'],
                        'event_subscription' => $form_data['event_subscription'],
                    ],
                ]
            ];

            // Determine which redirect to use
            if ($is_sentral) {
                if ($is_success && !empty($settings['sentral_success_redirect']['url'])) {
                    $response['redirect'] = $settings['sentral_success_redirect']['url'];
                } elseif (!$is_success && !empty($settings['sentral_failure_redirect']['url'])) {
                    $response['redirect'] = $settings['sentral_failure_redirect']['url'];
                }
            } elseif ($is_schoolbytes) { // Changed 'else if' to 'elseif'
                if ($is_success && !empty($settings['schoolbytes_success_redirect']['url'])) {
                    $response['redirect'] = $settings['schoolbytes_success_redirect']['url'];
                } elseif (!$is_success && !empty($settings['schoolbytes_failure_redirect']['url'])) {
                    $response['redirect'] = $settings['schoolbytes_failure_redirect']['url'];
                }
            } else {
                // If it's a "book a meeting" scenario
                if (!empty($settings['book_meeting_url']['url'])) {
                    $response['redirect'] = $settings['book_meeting_url']['url'];
                }
            }

            // Determine which message to use
            if (!$is_go_requested) {
                $response['redirect'] = '';
                if (!empty($settings['custom_thank_you'])) {
                    $response['message'] = $settings['custom_thank_you'];
                }
            } else {
                if (!empty($settings['redirect_thank_you'])) {
                    $response['message'] = $settings['redirect_thank_you'];
                }
            }

            // Default message if none set
            if (empty($response['message'])) {
                $response['message'] = __('Thank you for your submission!', 'elmformaction');
            }

            // // HubSpot form submission
            $hubspot_portal_id = defined('HUBSPOT_PORTAL_ID') ? HUBSPOT_PORTAL_ID : null;
            $hubspot_form_id = $settings['lifeskills_form_id'];
            $hubspot_url = "https://api.hsforms.com/submissions/v3/integration/submit/{$hubspot_portal_id}/{$hubspot_form_id}";


            $response['debug']['hubspot'] = [
                'portal_id' => $hubspot_portal_id,
                'form_id' => $hubspot_form_id,
                'hutk' => $_COOKIE['hubspotutk'] ?? null,
                'page_uri' => $_SERVER['HTTP_REFERER'] ?? '',
                'url' => $hubspot_url
            ];



            // // Add this before the HubSpot submission code
            $field_mapping = [
                'email' => 'email',
                'first_name' => 'firstname',
                'last_name' => 'lastname',
                'sis_provider' => 'school_sis___sms_provider',
                'role' => 'role',
                'go_access' => 'lsgo_access_pref',
                'event_subscription' => 'bulk_zoom_registration',
                'school_id' => 'lsgo_associated_company',
                'manual_school' => 'school_name_2023',
                'newsletter_opt_in' => 'subscribe_to_newsletter'
            ];

            $fields = [];
            foreach ($form_data as $field_id => $value) {
                // Check if we have a mapping for this field
                $hubspot_field = $field_mapping[$field_id] ?? $field_id;

                // Handle array values (like multiple checkboxes)
                $field_value = is_array($value) ? implode(';', $value) : $value;

                $fields[] = [
                    'name' => $hubspot_field,
                    'value' => $field_value
                ];
            }

            // // Prepare the request body
            $hubspot_data = [
                'fields' => $fields,
                'context' => [
                    'pageUri' => $_SERVER['HTTP_REFERER'] ?? '',
                    'pageName' => get_the_title() ?? '',
                    'hutk' => $_COOKIE['hubspotutk'] ?? null
                ]
            ];

            // // Make the API call to HubSpot
            $hubspot_response = wp_remote_post($hubspot_url, [
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => json_encode($hubspot_data),
                'timeout' => 15
            ]);

            // // Check if HubSpot submission was successful
            if (is_wp_error($hubspot_response)) {
                throw new Exception('HubSpot form submission failed: ' . $hubspot_response->get_error_message());
            }

            $hubspot_body = json_decode(wp_remote_retrieve_body($hubspot_response), true);

            $response['debug']['hubspot_response'] = $hubspot_body;

            if (wp_remote_retrieve_response_code($hubspot_response) !== 200) {
                throw new Exception('HubSpot form submission failed: ' . ($hubspot_body['message'] ?? 'Unknown error'));
            }

            // // Log success
            error_log('HubSpot form submission successful. Form ID: ' . $hubspot_form_id);

            // Add Zoom registration if event subscription is present
            if (!empty($form_data['event_subscription'])) {
                try {
                    $zoom = new ZoomAPI();
                    $webinar_registrations = [];

                    $webinar_ids = is_array($form_data['event_subscription'])
                        ? $form_data['event_subscription']
                        : [$form_data['event_subscription']];

                    foreach ($webinar_ids as $index => $webinar_id) {
                        $current = $index + 1;
                        $total = count($webinar_ids);
                        error_log("\n--- Processing Webinar {$current}/{$total} ---");
                        error_log("Webinar ID: {$webinar_id}");

                        try {
                            $participant_data = [
                                'email' => $form_data['email'],
                                'first_name' => $form_data['firstname'],
                                'last_name' => $form_data['lastname']
                            ];
                            error_log("Attempting registration with data: " . print_r($participant_data, true));

                            $registration = $zoom->registerForWebinar($webinar_id, $participant_data);

                            $webinar_registrations[$webinar_id] = $registration;
                            error_log("✓ Successfully registered for webinar {$webinar_id}");
                        } catch (Exception $webinar_error) {
                            error_log("❌ Failed to register for webinar {$webinar_id}");
                            error_log("Error message: " . $webinar_error->getMessage());
                            error_log("Error code: " . $webinar_error->getCode());
                            error_log("Stack trace: " . $webinar_error->getTraceAsString());

                            $webinar_registrations[$webinar_id] = [
                                'error' => $webinar_error->getMessage(),
                                'code' => $webinar_error->getCode(),
                                'timestamp' => date('c')
                            ];
                        }
                    }

                    error_log("=== Webinar Registration Summary ===");
                    $successful_count = count(array_filter($webinar_registrations, function ($reg) {
                        return !isset($reg['error']);
                    }));
                    $failed_count = count(array_filter($webinar_registrations, function ($reg) {
                        return isset($reg['error']);
                    }));

                    error_log(print_r([
                        'total_webinars' => count($webinar_ids),
                        'successful' => $successful_count,
                        'failed' => $failed_count,
                        'registrations' => $webinar_registrations
                    ], true));

                    $response['debug']['zoom_responses'] = $webinar_registrations;
                } catch (Exception $e) {
                    error_log('Zoom registration error: ' . $e->getMessage());
                    $response['debug']['zoom_error'] = $e->getMessage();
                }
            }

            // Send the final response
            $ajax_handler->add_response_data('success', true);
            $ajax_handler->add_response_data('data', $response);
        } catch (Exception $e) {
            error_log('Form submission error: ' . $e->getMessage());
            $ajax_handler->add_error_message('Form submission failed: ' . $e->getMessage());
        }
    }
}
