| table_name                 | column_name              | data_type                | is_nullable | column_default                                                                                |
| -------------------------- | ------------------------ | ------------------------ | ----------- | --------------------------------------------------------------------------------------------- |
| mi_admin_profiles          | id                       | uuid                     | NO          | null                                                                                          |
| mi_admin_profiles          | display_name             | text                     | YES         | null                                                                                          |
| mi_admin_profiles          | role                     | text                     | YES         | 'admin'::text                                                                                 |
| mi_admin_profiles          | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_analytics_events        | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_analytics_events        | event_type               | text                     | NO          | null                                                                                          |
| mi_analytics_events        | product_id               | uuid                     | YES         | null                                                                                          |
| mi_analytics_events        | order_id                 | uuid                     | YES         | null                                                                                          |
| mi_analytics_events        | session_id               | text                     | YES         | null                                                                                          |
| mi_analytics_events        | customer_id              | uuid                     | YES         | null                                                                                          |
| mi_analytics_events        | metadata                 | jsonb                    | YES         | '{}'::jsonb                                                                                   |
| mi_analytics_events        | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_auto_import_suggestions | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_auto_import_suggestions | batch_id                 | text                     | NO          | null                                                                                          |
| mi_auto_import_suggestions | cj_pid                   | text                     | NO          | null                                                                                          |
| mi_auto_import_suggestions | product_name             | text                     | NO          | null                                                                                          |
| mi_auto_import_suggestions | product_image            | text                     | YES         | null                                                                                          |
| mi_auto_import_suggestions | cj_category              | text                     | YES         | null                                                                                          |
| mi_auto_import_suggestions | cj_price                 | numeric                  | NO          | null                                                                                          |
| mi_auto_import_suggestions | shipping_cost            | numeric                  | YES         | null                                                                                          |
| mi_auto_import_suggestions | retail_price             | numeric                  | YES         | null                                                                                          |
| mi_auto_import_suggestions | margin_percent           | numeric                  | YES         | null                                                                                          |
| mi_auto_import_suggestions | warehouse                | text                     | YES         | 'US'::text                                                                                    |
| mi_auto_import_suggestions | us_stock                 | integer                  | YES         | 0                                                                                             |
| mi_auto_import_suggestions | variant_count            | integer                  | YES         | 0                                                                                             |
| mi_auto_import_suggestions | ai_score                 | integer                  | YES         | null                                                                                          |
| mi_auto_import_suggestions | ai_reasoning             | text                     | YES         | null                                                                                          |
| mi_auto_import_suggestions | ai_season_ok             | boolean                  | YES         | true                                                                                          |
| mi_auto_import_suggestions | ai_brand_fit             | boolean                  | YES         | true                                                                                          |
| mi_auto_import_suggestions | ai_quality_ok            | boolean                  | YES         | true                                                                                          |
| mi_auto_import_suggestions | status                   | text                     | YES         | 'pending'::text                                                                               |
| mi_auto_import_suggestions | imported_product_id      | uuid                     | YES         | null                                                                                          |
| mi_auto_import_suggestions | error_message            | text                     | YES         | null                                                                                          |
| mi_auto_import_suggestions | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_auto_import_suggestions | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_carts                   | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_carts                   | customer_id              | uuid                     | YES         | null                                                                                          |
| mi_carts                   | session_id               | text                     | YES         | null                                                                                          |
| mi_carts                   | email                    | text                     | YES         | null                                                                                          |
| mi_carts                   | items                    | jsonb                    | YES         | '[]'::jsonb                                                                                   |
| mi_carts                   | subtotal                 | numeric                  | YES         | 0                                                                                             |
| mi_carts                   | is_abandoned             | boolean                  | YES         | false                                                                                         |
| mi_carts                   | abandoned_email_sent_at  | timestamp with time zone | YES         | null                                                                                          |
| mi_carts                   | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_carts                   | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_categories              | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_categories              | name                     | text                     | NO          | null                                                                                          |
| mi_categories              | slug                     | text                     | NO          | null                                                                                          |
| mi_categories              | parent_id                | uuid                     | YES         | null                                                                                          |
| mi_categories              | description              | text                     | YES         | null                                                                                          |
| mi_categories              | image_url                | text                     | YES         | null                                                                                          |
| mi_categories              | icon_name                | text                     | YES         | null                                                                                          |
| mi_categories              | icon_color               | text                     | YES         | null                                                                                          |
| mi_categories              | icon_gradient            | text                     | YES         | null                                                                                          |
| mi_categories              | sort_order               | integer                  | YES         | 0                                                                                             |
| mi_categories              | product_count            | integer                  | YES         | 0                                                                                             |
| mi_categories              | is_active                | boolean                  | YES         | true                                                                                          |
| mi_categories              | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_categories              | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_categories              | faq_json                 | jsonb                    | YES         | null                                                                                          |
| mi_category_pricing        | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_category_pricing        | category_slug            | text                     | NO          | null                                                                                          |
| mi_category_pricing        | category_name            | text                     | NO          | null                                                                                          |
| mi_category_pricing        | min_price                | numeric                  | YES         | NULL::numeric                                                                                 |
| mi_category_pricing        | target_margin            | numeric                  | YES         | NULL::numeric                                                                                 |
| mi_category_pricing        | markup_override          | numeric                  | YES         | NULL::numeric                                                                                 |
| mi_category_pricing        | is_active                | boolean                  | YES         | true                                                                                          |
| mi_category_pricing        | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_category_pricing        | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_customer_addresses      | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_customer_addresses      | customer_id              | uuid                     | NO          | null                                                                                          |
| mi_customer_addresses      | label                    | text                     | YES         | 'Home'::text                                                                                  |
| mi_customer_addresses      | name                     | text                     | NO          | null                                                                                          |
| mi_customer_addresses      | line1                    | text                     | NO          | null                                                                                          |
| mi_customer_addresses      | line2                    | text                     | YES         | ''::text                                                                                      |
| mi_customer_addresses      | city                     | text                     | NO          | null                                                                                          |
| mi_customer_addresses      | state                    | text                     | NO          | null                                                                                          |
| mi_customer_addresses      | postal_code              | text                     | NO          | null                                                                                          |
| mi_customer_addresses      | country                  | text                     | YES         | 'US'::text                                                                                    |
| mi_customer_addresses      | is_default               | boolean                  | YES         | false                                                                                         |
| mi_customer_addresses      | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_customer_addresses      | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_customers               | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_customers               | auth_user_id             | uuid                     | NO          | null                                                                                          |
| mi_customers               | email                    | text                     | NO          | null                                                                                          |
| mi_customers               | full_name                | text                     | YES         | ''::text                                                                                      |
| mi_customers               | phone                    | text                     | YES         | ''::text                                                                                      |
| mi_customers               | default_shipping_address | jsonb                    | YES         | null                                                                                          |
| mi_customers               | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_customers               | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_discount_code_usage     | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_discount_code_usage     | discount_code_id         | uuid                     | YES         | null                                                                                          |
| mi_discount_code_usage     | code                     | text                     | NO          | null                                                                                          |
| mi_discount_code_usage     | order_id                 | uuid                     | YES         | null                                                                                          |
| mi_discount_code_usage     | order_number             | text                     | YES         | null                                                                                          |
| mi_discount_code_usage     | customer_email           | text                     | YES         | null                                                                                          |
| mi_discount_code_usage     | discount_amount          | numeric                  | YES         | 0                                                                                             |
| mi_discount_code_usage     | order_subtotal           | numeric                  | YES         | 0                                                                                             |
| mi_discount_code_usage     | order_total              | numeric                  | YES         | 0                                                                                             |
| mi_discount_code_usage     | influencer_payout        | numeric                  | YES         | 0                                                                                             |
| mi_discount_code_usage     | payout_status            | text                     | YES         | 'pending'::text                                                                               |
| mi_discount_code_usage     | used_at                  | timestamp with time zone | YES         | now()                                                                                         |
| mi_discount_codes          | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_discount_codes          | code                     | text                     | NO          | null                                                                                          |
| mi_discount_codes          | type                     | text                     | NO          | null                                                                                          |
| mi_discount_codes          | value                    | numeric                  | NO          | null                                                                                          |
| mi_discount_codes          | min_order_amount         | numeric                  | YES         | null                                                                                          |
| mi_discount_codes          | max_uses                 | integer                  | YES         | null                                                                                          |
| mi_discount_codes          | used_count               | integer                  | YES         | 0                                                                                             |
| mi_discount_codes          | is_active                | boolean                  | YES         | true                                                                                          |
| mi_discount_codes          | expires_at               | timestamp with time zone | YES         | null                                                                                          |
| mi_discount_codes          | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_discount_codes          | code_type                | text                     | YES         | 'general'::text                                                                               |
| mi_discount_codes          | influencer_name          | text                     | YES         | null                                                                                          |
| mi_discount_codes          | influencer_email         | text                     | YES         | null                                                                                          |
| mi_discount_codes          | influencer_platform      | text                     | YES         | null                                                                                          |
| mi_discount_codes          | payout_per_use           | numeric                  | YES         | null                                                                                          |
| mi_discount_codes          | payout_percent           | numeric                  | YES         | null                                                                                          |
| mi_discount_codes          | total_uses               | integer                  | YES         | 0                                                                                             |
| mi_discount_codes          | total_revenue            | numeric                  | YES         | 0                                                                                             |
| mi_discount_codes          | total_discount_given     | numeric                  | YES         | 0                                                                                             |
| mi_discount_codes          | starts_at                | timestamp with time zone | YES         | null                                                                                          |
| mi_discount_codes          | notes                    | text                     | YES         | null                                                                                          |
| mi_discount_codes          | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_email_subscribers       | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_email_subscribers       | email                    | text                     | NO          | null                                                                                          |
| mi_email_subscribers       | source                   | text                     | YES         | 'popup'::text                                                                                 |
| mi_email_subscribers       | subscribed_at            | timestamp with time zone | YES         | now()                                                                                         |
| mi_email_subscribers       | is_active                | boolean                  | YES         | true                                                                                          |
| mi_landing_pages           | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_landing_pages           | name                     | text                     | NO          | null                                                                                          |
| mi_landing_pages           | slug                     | text                     | NO          | null                                                                                          |
| mi_landing_pages           | headline                 | text                     | YES         | null                                                                                          |
| mi_landing_pages           | subheadline              | text                     | YES         | null                                                                                          |
| mi_landing_pages           | hero_image_url           | text                     | YES         | null                                                                                          |
| mi_landing_pages           | product_ids              | ARRAY                    | YES         | '{}'::uuid[]                                                                                  |
| mi_landing_pages           | faq                      | jsonb                    | YES         | '[]'::jsonb                                                                                   |
| mi_landing_pages           | is_active                | boolean                  | YES         | true                                                                                          |
| mi_landing_pages           | views                    | integer                  | YES         | 0                                                                                             |
| mi_landing_pages           | conversions              | integer                  | YES         | 0                                                                                             |
| mi_landing_pages           | meta_title               | text                     | YES         | null                                                                                          |
| mi_landing_pages           | meta_description         | text                     | YES         | null                                                                                          |
| mi_landing_pages           | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_landing_pages           | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_order_items             | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_order_items             | order_id                 | uuid                     | NO          | null                                                                                          |
| mi_order_items             | product_id               | uuid                     | YES         | null                                                                                          |
| mi_order_items             | variant_id               | uuid                     | YES         | null                                                                                          |
| mi_order_items             | name                     | text                     | NO          | null                                                                                          |
| mi_order_items             | variant_name             | text                     | YES         | null                                                                                          |
| mi_order_items             | quantity                 | integer                  | NO          | 1                                                                                             |
| mi_order_items             | unit_price               | numeric                  | NO          | null                                                                                          |
| mi_order_items             | cj_price                 | numeric                  | YES         | null                                                                                          |
| mi_order_items             | total                    | numeric                  | NO          | null                                                                                          |
| mi_order_items             | image_url                | text                     | YES         | null                                                                                          |
| mi_order_items             | warehouse                | text                     | YES         | null                                                                                          |
| mi_orders                  | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_orders                  | order_number             | text                     | NO          | concat('MI-', to_char(now(), 'YYYYMMDD'::text), '-', substr((gen_random_uuid())::text, 1, 8)) |
| mi_orders                  | customer_id              | uuid                     | YES         | null                                                                                          |
| mi_orders                  | email                    | text                     | YES         | null                                                                                          |
| mi_orders                  | shipping_address         | jsonb                    | NO          | '{}'::jsonb                                                                                   |
| mi_orders                  | shipping_method          | text                     | YES         | null                                                                                          |
| mi_orders                  | subtotal                 | numeric                  | NO          | 0                                                                                             |
| mi_orders                  | shipping_total           | numeric                  | YES         | 0                                                                                             |
| mi_orders                  | discount_total           | numeric                  | YES         | 0                                                                                             |
| mi_orders                  | tax_total                | numeric                  | YES         | 0                                                                                             |
| mi_orders                  | total                    | numeric                  | NO          | 0                                                                                             |
| mi_orders                  | stripe_payment_id        | text                     | YES         | null                                                                                          |
| mi_orders                  | stripe_session_id        | text                     | YES         | null                                                                                          |
| mi_orders                  | payment_status           | text                     | YES         | 'pending'::text                                                                               |
| mi_orders                  | fulfillment_status       | text                     | YES         | 'unfulfilled'::text                                                                           |
| mi_orders                  | cj_order_id              | text                     | YES         | null                                                                                          |
| mi_orders                  | tracking_number          | text                     | YES         | null                                                                                          |
| mi_orders                  | tracking_url             | text                     | YES         | null                                                                                          |
| mi_orders                  | carrier                  | text                     | YES         | null                                                                                          |
| mi_orders                  | discount_code            | text                     | YES         | null                                                                                          |
| mi_orders                  | notes                    | text                     | YES         | null                                                                                          |
| mi_orders                  | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_orders                  | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_orders                  | paid_at                  | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | shipped_at               | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | delivered_at             | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | customer_email           | text                     | YES         | null                                                                                          |
| mi_orders                  | stripe_payment_intent_id | text                     | YES         | null                                                                                          |
| mi_orders                  | discount_amount          | numeric                  | YES         | 0                                                                                             |
| mi_orders                  | shipping_cost            | numeric                  | YES         | 0                                                                                             |
| mi_orders                  | cj_order_number          | text                     | YES         | null                                                                                          |
| mi_orders                  | cj_status                | text                     | YES         | null                                                                                          |
| mi_orders                  | email_sent_at            | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | shipping_email_sent_at   | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | refund_status            | text                     | YES         | null                                                                                          |
| mi_orders                  | refunded_at              | timestamp with time zone | YES         | null                                                                                          |
| mi_orders                  | stripe_refund_id         | text                     | YES         | null                                                                                          |
| mi_product_variants        | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_product_variants        | product_id               | uuid                     | NO          | null                                                                                          |
| mi_product_variants        | cj_vid                   | text                     | YES         | null                                                                                          |
| mi_product_variants        | name                     | text                     | NO          | null                                                                                          |
| mi_product_variants        | sku                      | text                     | YES         | null                                                                                          |
| mi_product_variants        | color                    | text                     | YES         | null                                                                                          |
| mi_product_variants        | size                     | text                     | YES         | null                                                                                          |
| mi_product_variants        | cj_price                 | numeric                  | YES         | null                                                                                          |
| mi_product_variants        | retail_price             | numeric                  | YES         | null                                                                                          |
| mi_product_variants        | stock_count              | integer                  | YES         | 0                                                                                             |
| mi_product_variants        | image_url                | text                     | YES         | null                                                                                          |
| mi_product_variants        | sort_order               | integer                  | YES         | 0                                                                                             |
| mi_product_variants        | is_active                | boolean                  | YES         | true                                                                                          |
| mi_product_variants        | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_product_variants        | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_products                | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_products                | cj_pid                   | text                     | YES         | null                                                                                          |
| mi_products                | name                     | text                     | NO          | null                                                                                          |
| mi_products                | slug                     | text                     | NO          | null                                                                                          |
| mi_products                | description              | text                     | YES         | null                                                                                          |
| mi_products                | category_id              | uuid                     | YES         | null                                                                                          |
| mi_products                | images                   | ARRAY                    | YES         | '{}'::text[]                                                                                  |
| mi_products                | cj_price                 | numeric                  | YES         | null                                                                                          |
| mi_products                | shipping_cost            | numeric                  | YES         | 0                                                                                             |
| mi_products                | stripe_fee               | numeric                  | YES         | 0                                                                                             |
| mi_products                | total_cost               | numeric                  | YES         | 0                                                                                             |
| mi_products                | markup_multiplier        | numeric                  | YES         | 2.0                                                                                           |
| mi_products                | retail_price             | numeric                  | NO          | null                                                                                          |
| mi_products                | compare_at_price         | numeric                  | YES         | null                                                                                          |
| mi_products                | margin_dollars           | numeric                  | YES         | 0                                                                                             |
| mi_products                | margin_percent           | numeric                  | YES         | 0                                                                                             |
| mi_products                | stock_count              | integer                  | YES         | 0                                                                                             |
| mi_products                | warehouse                | text                     | YES         | 'CN'::text                                                                                    |
| mi_products                | delivery_time            | text                     | YES         | null                                                                                          |
| mi_products                | shipping_days            | text                     | YES         | null                                                                                          |
| mi_products                | rating                   | numeric                  | YES         | 0                                                                                             |
| mi_products                | review_count             | integer                  | YES         | 0                                                                                             |
| mi_products                | sales_count              | integer                  | YES         | 0                                                                                             |
| mi_products                | status                   | text                     | YES         | 'pending'::text                                                                               |
| mi_products                | badge                    | text                     | YES         | null                                                                                          |
| mi_products                | meta_title               | text                     | YES         | null                                                                                          |
| mi_products                | meta_description         | text                     | YES         | null                                                                                          |
| mi_products                | last_synced_at           | timestamp with time zone | YES         | null                                                                                          |
| mi_products                | cj_raw_data              | jsonb                    | YES         | null                                                                                          |
| mi_products                | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_products                | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_products                | average_rating           | numeric                  | YES         | 0                                                                                             |
| mi_products                | delivery_cycle_days      | text                     | YES         | null                                                                                          |
| mi_products                | available_warehouses     | jsonb                    | YES         | '[]'::jsonb                                                                                   |
| mi_products                | shipping_estimate        | text                     | YES         | null                                                                                          |
| mi_products                | digital_file_path        | text                     | YES         | null                                                                                          |
| mi_products                | price_drift_flagged      | boolean                  | NO          | false                                                                                         |
| mi_products                | price_drift_details      | jsonb                    | YES         | null                                                                                          |
| mi_reviews                 | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_reviews                 | product_id               | uuid                     | NO          | null                                                                                          |
| mi_reviews                 | customer_id              | uuid                     | YES         | null                                                                                          |
| mi_reviews                 | customer_name            | text                     | YES         | null                                                                                          |
| mi_reviews                 | rating                   | integer                  | NO          | null                                                                                          |
| mi_reviews                 | title                    | text                     | YES         | null                                                                                          |
| mi_reviews                 | body                     | text                     | YES         | null                                                                                          |
| mi_reviews                 | is_verified              | boolean                  | YES         | false                                                                                         |
| mi_reviews                 | is_approved              | boolean                  | YES         | false                                                                                         |
| mi_reviews                 | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_reviews                 | cj_comment_id            | bigint                   | YES         | null                                                                                          |
| mi_reviews                 | images                   | jsonb                    | YES         | '[]'::jsonb                                                                                   |
| mi_reviews                 | reviewer_country         | text                     | YES         | null                                                                                          |
| mi_reviews                 | source                   | text                     | YES         | 'customer'::text                                                                              |
| mi_reviews                 | verified_purchase        | boolean                  | YES         | false                                                                                         |
| mi_reviews                 | reviewer_email           | text                     | YES         | null                                                                                          |
| mi_reviews                 | order_id                 | text                     | YES         | null                                                                                          |
| mi_reviews                 | status                   | text                     | YES         | 'approved'::text                                                                              |
| mi_scout_watchlist         | id                       | uuid                     | NO          | gen_random_uuid()                                                                             |
| mi_scout_watchlist         | cj_pid                   | text                     | NO          | null                                                                                          |
| mi_scout_watchlist         | cj_product_name          | text                     | NO          | null                                                                                          |
| mi_scout_watchlist         | cj_thumbnail             | text                     | YES         | null                                                                                          |
| mi_scout_watchlist         | cj_wholesale_price       | numeric                  | YES         | null                                                                                          |
| mi_scout_watchlist         | calculated_retail_price  | numeric                  | YES         | null                                                                                          |
| mi_scout_watchlist         | calculated_margin        | numeric                  | YES         | null                                                                                          |
| mi_scout_watchlist         | us_stock_at_save         | integer                  | YES         | null                                                                                          |
| mi_scout_watchlist         | variant_count            | integer                  | YES         | null                                                                                          |
| mi_scout_watchlist         | notes                    | text                     | YES         | null                                                                                          |
| mi_scout_watchlist         | status                   | text                     | YES         | 'watching'::text                                                                              |
| mi_scout_watchlist         | imported_product_id      | uuid                     | YES         | null                                                                                          |
| mi_scout_watchlist         | created_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_scout_watchlist         | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_settings                | key                      | text                     | NO          | null                                                                                          |
| mi_settings                | value                    | jsonb                    | NO          | '{}'::jsonb                                                                                   |
| mi_settings                | updated_at               | timestamp with time zone | YES         | now()                                                                                         |
| mi_wishlists               | id                       | uuid                     | NO          | uuid_generate_v4()                                                                            |
| mi_wishlists               | customer_id              | uuid                     | NO          | null                                                                                          |
| mi_wishlists               | product_id               | uuid                     | NO          | null                                                                                          |
| mi_wishlists               | created_at               | timestamp with time zone | YES         | now()                                                                                         |