# Current Supabase Schema Audit

Retrieved at: 2026-06-19T07:37:08.120Z

## Table: `otp_verifications`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `phone_number` | string | `character varying` | Yes | `` |  |
| `otp_hash` | string | `character varying` | Yes | `` |  |
| `salt` | string | `character varying` | Yes | `` |  |
| `attempts_count` | integer | `integer` | Yes | `0` |  |
| `resend_count` | integer | `integer` | Yes | `1` |  |
| `last_resend_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `expires_at` | string | `timestamp with time zone` | Yes | `` |  |
| `verified_at` | string | `timestamp with time zone` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `ai_failures`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `entry_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `prompt` | string | `text` | Yes | `` |  |
| `raw_response` | string | `text` | No | `` |  |
| `parsing_error` | string | `text` | No | `` |  |
| `timestamp` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `cycles`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `number` | integer | `integer` | Yes | `` |  |
| `started_at` | string | `date` | Yes | `` |  |
| `ended_at` | string | `date` | No | `` |  |
| `status` | string | `text` | Yes | `active` |  |
| `total_days` | integer | `integer` | Yes | `30` |  |
| `insight` | string | `text` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `weekly_summaries`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `week_number` | integer | `integer` | Yes | `` |  |
| `day_start` | integer | `integer` | Yes | `` |  |
| `day_end` | integer | `integer` | Yes | `` |  |
| `body` | string | `text` | No | `` |  |
| `open_question` | string | `text` | No | `` |  |
| `status` | string | `text` | Yes | `pending` |  |
| `is_pinned` | boolean | `boolean` | Yes | `true` |  |
| `generated_at` | string | `timestamp with time zone` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `consents`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `consent_type` | string | `character varying` | Yes | `` |  |
| `version` | string | `character varying` | Yes | `` |  |
| `consented_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `ip_address` | string | `character varying` | Yes | `` |  |

## Table: `profiles`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `` | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `phone_number` | string | `character varying` | Yes | `` |  |
| `full_name` | string | `character varying` | No | `` |  |
| `avatar_url` | string | `text` | No | `` |  |
| `consent_completed` | boolean | `boolean` | Yes | `false` |  |
| `profile_completed` | boolean | `boolean` | Yes | `false` |  |
| `notifications_completed` | boolean | `boolean` | Yes | `false` |  |
| `orientation_completed` | boolean | `boolean` | Yes | `false` |  |
| `assessment_completed` | boolean | `boolean` | Yes | `false` |  |
| `onboarding_completed` | boolean | `boolean` | Yes | `false` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `crisis_log`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `crisis_type` | string | `text` | Yes | `` |  |
| `timestamp` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `vocab_words`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `entry_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `word` | string | `text` | Yes | `` |  |
| `count` | integer | `integer` | Yes | `1` |  |
| `written_at` | string | `timestamp with time zone` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `exercises`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `cycle_day` | integer | `integer` | Yes | `` |  |
| `template_id` | string | `text` | Yes | `` | Note:
This is a Foreign Key to `exercise_templates.id`.<fk table='exercise_templates' column='id'/> |
| `surfaced_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `completed_at` | string | `timestamp with time zone` | No | `` |  |
| `response_encrypted` | string | `text` | No | `` |  |
| `response_iv` | string | `text` | No | `` |  |
| `insight_note` | string | `text` | No | `` |  |
| `status` | string | `text` | Yes | `pending` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `entry_scores`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `entry_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `reflection_ei` | number | `numeric` | No | `` |  |
| `reflection_pr` | number | `numeric` | No | `` |  |
| `reflection_sa` | number | `numeric` | No | `` |  |
| `new_entry_ei` | number | `numeric` | No | `` |  |
| `new_entry_pr` | number | `numeric` | No | `` |  |
| `new_entry_sa` | number | `numeric` | No | `` |  |
| `day_ei` | number | `numeric` | No | `` |  |
| `day_pr` | number | `numeric` | No | `` |  |
| `day_sa` | number | `numeric` | No | `` |  |
| `confidence_flag` | boolean | `boolean` | No | `false` |  |
| `confidence_reason` | string | `text` | No | `` |  |
| `scoring_status` | string | `character varying` | Yes | `pending` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `arc_scoring_applied` | boolean | `boolean` | No | `false` |  |

## Table: `ai_jobs`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `job_type` | string | `character varying` | Yes | `` |  |
| `payload` |  | `jsonb` | Yes | `` |  |
| `status` | string | `character varying` | Yes | `pending` |  |
| `attempts` | integer | `integer` | Yes | `0` |  |
| `max_attempts` | integer | `integer` | Yes | `3` |  |
| `last_error` | string | `text` | No | `` |  |
| `run_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `completed_at` | string | `timestamp with time zone` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `entries`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `content` | string | `text` | Yes | `` |  |
| `word_count` | integer | `integer` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `session_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `daily_sessions.id`.<fk table='daily_sessions' column='id'/> |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `client_id` | string | `uuid` | No | `` |  |
| `cycle_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `cycle_day` | integer | `integer` | No | `` |  |
| `reflection_text_encrypted` | string | `text` | No | `` |  |
| `reflection_text_iv` | string | `text` | No | `` |  |
| `new_entry_text_encrypted` | string | `text` | No | `` |  |
| `new_entry_text_iv` | string | `text` | No | `` |  |
| `entry_type` | string | `text` | No | `new_only` |  |
| `written_at` | string | `timestamp with time zone` | No | `CURRENT_TIMESTAMP` |  |
| `synced_at` | string | `timestamp with time zone` | No | `CURRENT_TIMESTAMP` |  |
| `mode` | string | `text` | No | `` |  |
| `thread_response` | boolean | `boolean` | No | `false` |  |
| `open_thread_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `open_threads.id`.<fk table='open_threads' column='id'/> |
| `exercise_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `exercises.id`.<fk table='exercises' column='id'/> |
| `reflection_ei` | number | `numeric` | No | `` |  |
| `reflection_pr` | number | `numeric` | No | `` |  |
| `reflection_sa` | number | `numeric` | No | `` |  |
| `new_entry_ei` | number | `numeric` | No | `` |  |
| `new_entry_pr` | number | `numeric` | No | `` |  |
| `new_entry_sa` | number | `numeric` | No | `` |  |
| `day_ei` | number | `numeric` | No | `` |  |
| `day_pr` | number | `numeric` | No | `` |  |
| `day_sa` | number | `numeric` | No | `` |  |
| `confidence_flag` | boolean | `boolean` | No | `false` |  |
| `confidence_reason` | string | `text` | No | `` |  |
| `scoring_status` | string | `text` | No | `pending` |  |
| `crisis_flag` | boolean | `boolean` | No | `false` |  |
| `crisis_type` | string | `text` | No | `` |  |
| `crisis_flagged_at` | string | `timestamp with time zone` | No | `` |  |
| `reflection_suppressed` | boolean | `boolean` | No | `false` |  |
| `risk_language_quote` | string | `text` | No | `` |  |
| `crisis_checked` | boolean | `boolean` | No | `false` |  |
| `arc_scoring_applied` | boolean | `boolean` | No | `false` |  |

## Table: `patterns`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `name` | string | `text` | Yes | `` |  |
| `first_seen_cycle` | integer | `integer` | Yes | `` |  |
| `first_seen_at` | string | `timestamp with time zone` | Yes | `` |  |
| `orientation` | string | `text` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `exercise_templates`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `text` | Yes | `` | Note:
This is a Primary Key.<pk/> |
| `title` | string | `text` | Yes | `` |  |
| `prompt` | string | `text` | Yes | `` |  |
| `type` | string | `text` | Yes | `` |  |
| `theme_tags` | array | `text[]` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `notification_preferences`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `sms_reminders` | boolean | `boolean` | Yes | `true` |  |
| `whatsapp_reminders` | boolean | `boolean` | Yes | `false` |  |
| `digest_frequency` | string | `character varying` | Yes | `daily` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `open_threads`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `source_summary_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `weekly_summaries.id`.<fk table='weekly_summaries' column='id'/> |
| `question` | string | `text` | Yes | `` |  |
| `origin_context` | string | `text` | Yes | `` |  |
| `status` | string | `text` | Yes | `open` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `addressed_at` | string | `timestamp with time zone` | No | `` |  |
| `addressed_entry_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |

## Table: `daily_sessions`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `day_number` | integer | `integer` | Yes | `` |  |
| `exercise_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `exercises.id`.<fk table='exercises' column='id'/> |
| `journal_entry_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `status` | string | `character varying` | Yes | `start` |  |
| `session_data` |  | `jsonb` | Yes | `` |  |
| `completed_at` | string | `timestamp with time zone` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `ai_observability`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `entry_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `provider` | string | `character varying` | Yes | `` |  |
| `raw_provider_response` | string | `text` | No | `` |  |
| `parsed_response` |  | `jsonb` | No | `` |  |
| `validation_result` |  | `jsonb` | No | `` |  |
| `processing_time` | integer | `integer` | Yes | `` |  |
| `retry_count` | integer | `integer` | Yes | `0` |  |
| `error_reason` | string | `text` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `vocab_clusters`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `anchor_word` | string | `text` | Yes | `` |  |
| `related_words` | array | `text[]` | Yes | `` |  |
| `insight` | string | `text` | No | `` |  |
| `total_count` | integer | `integer` | Yes | `0` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `reflections`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `entry_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `entries.id`.<fk table='entries' column='id'/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `reflection_text` | string | `text` | Yes | `` |  |
| `provider` | string | `text` | Yes | `` |  |
| `confidence` | string | `text` | Yes | `` |  |
| `themes` | array | `text[]` | Yes | `` |  |
| `status` | string | `text` | Yes | `ready` |  |
| `generated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `monthly_scores`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `assessment_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `assessments.id`.<fk table='assessments' column='id'/> |
| `month_number` | integer | `integer` | Yes | `` |  |
| `window_start` | string | `date` | Yes | `` |  |
| `window_end` | string | `date` | Yes | `` |  |
| `ei_score` | number | `numeric` | Yes | `` |  |
| `pr_score` | number | `numeric` | Yes | `` |  |
| `sa_score` | number | `numeric` | Yes | `` |  |
| `dt_score` | number | `numeric` | Yes | `` |  |
| `ei_delta` | number | `numeric` | No | `` |  |
| `pr_delta` | number | `numeric` | No | `` |  |
| `sa_delta` | number | `numeric` | No | `` |  |
| `dt_delta` | number | `numeric` | No | `` |  |
| `primary_dimension` | string | `text` | Yes | `` |  |
| `routing_action` | string | `text` | Yes | `` |  |
| `professional_nudge_active` | boolean | `boolean` | Yes | `false` |  |
| `consecutive_worsening_count` | integer | `integer` | Yes | `0` |  |
| `consecutive_improvement_count` | integer | `integer` | Yes | `0` |  |
| `flag_spike_recovery` | boolean | `boolean` | Yes | `false` |  |
| `entry_count` | integer | `integer` | Yes | `` |  |
| `generation_status` | string | `text` | Yes | `pending` |  |
| `report_text` | string | `text` | No | `` |  |
| `generated_at` | string | `timestamp with time zone` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `auth_accounts`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `email` | string | `text` | Yes | `` |  |
| `password_hash` | string | `text` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `users`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `phone_number` | string | `character varying` | Yes | `` |  |
| `name` | string | `character varying` | No | `` |  |
| `is_active` | boolean | `boolean` | Yes | `true` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `updated_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `timezone` | string | `text` | Yes | `Asia/Kolkata` |  |
| `onboarding_done` | boolean | `boolean` | Yes | `false` |  |
| `crisis_flag_active` | boolean | `boolean` | Yes | `false` |  |
| `crisis_flagged_at` | string | `timestamp with time zone` | No | `` |  |
| `ocean_openness` | number | `numeric` | No | `` |  |
| `ocean_conscientiousness` | number | `numeric` | No | `` |  |
| `ocean_extraversion` | number | `numeric` | No | `` |  |
| `ocean_agreeableness` | number | `numeric` | No | `` |  |
| `ocean_neuroticism` | number | `numeric` | No | `` |  |
| `personality_profile_json` |  | `jsonb` | No | `` |  |
| `personality_summary_text` | string | `text` | No | `` |  |
| `patterns_summary_text` | string | `text` | No | `` |  |
| `reports_last_viewed_at` | string | `timestamp with time zone` | No | `` |  |
| `sustained_distress_flag` | boolean | `boolean` | No | `false` |  |
| `sustained_distress_since` | string | `date` | No | `` |  |
| `sustained_distress_cleared_at` | string | `date` | No | `` |  |

## Table: `user_sessions`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `refresh_token_hash` | string | `character varying` | Yes | `` |  |
| `device_id` | string | `character varying` | Yes | `` |  |
| `device_name` | string | `character varying` | No | `` |  |
| `ip_address` | string | `character varying` | Yes | `` |  |
| `user_agent` | string | `text` | No | `` |  |
| `is_active` | boolean | `boolean` | Yes | `true` |  |
| `session_state` |  | `jsonb` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `expires_at` | string | `timestamp with time zone` | Yes | `` |  |
| `last_active_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `assessments`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `ei_avg` | number | `numeric` | Yes | `` |  |
| `pr_avg` | number | `numeric` | Yes | `` |  |
| `sa_avg` | number | `numeric` | Yes | `` |  |
| `dt_score` | number | `numeric` | Yes | `` |  |
| `normalised_sa` | number | `numeric` | Yes | `` |  |
| `risk_total` | integer | `integer` | Yes | `` |  |
| `path_assignment` | string | `text` | Yes | `` |  |
| `branch_assignment` | string | `text` | Yes | `` |  |
| `stability_gate_triggered` | boolean | `boolean` | Yes | `false` |  |
| `entry_count` | integer | `integer` | Yes | `` |  |
| `generation_status` | string | `text` | Yes | `pending` |  |
| `report_text` | string | `text` | No | `` |  |
| `unlocked_at` | string | `timestamp with time zone` | No | `` |  |
| `generated_at` | string | `timestamp with time zone` | No | `` |  |

## Table: `pattern_cycle_states`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `pattern_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `patterns.id`.<fk table='patterns' column='id'/> |
| `cycle_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `cycles.id`.<fk table='cycles' column='id'/> |
| `cycle_number` | integer | `integer` | Yes | `` |  |
| `status` | string | `text` | Yes | `` |  |
| `note` | string | `text` | Yes | `` |  |
| `connected_to` | array | `uuid[]` | Yes | `` |  |
| `entry_quote_1` | string | `text` | No | `` |  |
| `entry_quote_1_label` | string | `text` | No | `` |  |
| `entry_quote_2` | string | `text` | No | `` |  |
| `entry_quote_2_label` | string | `text` | No | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

## Table: `audit_logs`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `extensions.uuid_generate_v4()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `action` | string | `character varying` | Yes | `` |  |
| `ip_address` | string | `character varying` | Yes | `` |  |
| `user_agent` | string | `text` | No | `` |  |
| `metadata` |  | `jsonb` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

