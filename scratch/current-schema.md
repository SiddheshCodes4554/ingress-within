# Current Supabase Schema Audit

Retrieved at: 2026-06-16T12:32:54.799Z

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

## Table: `thread_responses`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `thread_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `threads.id`.<fk table='threads' column='id'/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `response` | string | `text` | Yes | `` |  |
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

## Table: `threads`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `question` | string | `text` | Yes | `` |  |
| `origin` | string | `character varying` | Yes | `Self-Reflection` |  |
| `status` | string | `character varying` | Yes | `NEW` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |
| `closed_at` | string | `timestamp with time zone` | No | `` |  |

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

## Table: `daily_sessions`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `day_number` | integer | `integer` | Yes | `` |  |
| `exercise_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `user_exercises.id`.<fk table='user_exercises' column='id'/> |
| `journal_entry_id` | string | `uuid` | No | `` | Note:
This is a Foreign Key to `journal_entries.id`.<fk table='journal_entries' column='id'/> |
| `status` | string | `character varying` | Yes | `start` |  |
| `session_data` |  | `jsonb` | Yes | `` |  |
| `completed_at` | string | `timestamp with time zone` | No | `` |  |
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

## Table: `user_exercises`

| Column | Type | Format | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | string | `uuid` | Yes | `gen_random_uuid()` | Note:
This is a Primary Key.<pk/> |
| `user_id` | string | `uuid` | Yes | `` | Note:
This is a Foreign Key to `users.id`.<fk table='users' column='id'/> |
| `stressor_type` | string | `character varying` | Yes | `` |  |
| `reactive_thought` | string | `text` | Yes | `` |  |
| `reframed_thought` | string | `text` | Yes | `` |  |
| `clarity_score` | integer | `integer` | Yes | `` |  |
| `created_at` | string | `timestamp with time zone` | Yes | `CURRENT_TIMESTAMP` |  |

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

## Table: `journal_entries`

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

