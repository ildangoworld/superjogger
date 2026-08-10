-- Allow editable AI prompt texts in app_settings

alter table public.app_settings
  drop constraint app_settings_key_known;

alter table public.app_settings
  add constraint app_settings_key_known check (
    key in (
      'ai_model',
      'ai_daily_limit',
      'ai_base_url',
      'ai_system_prompt',
      'ai_detail_rule_detailed',
      'ai_detail_rule_light',
      'ai_user_instruction'
    )
  );

insert into public.app_settings (key, value) values
  ('ai_system_prompt', '""'::jsonb),
  ('ai_detail_rule_detailed', '""'::jsonb),
  ('ai_detail_rule_light', '""'::jsonb),
  ('ai_user_instruction', '""'::jsonb)
on conflict (key) do nothing;
