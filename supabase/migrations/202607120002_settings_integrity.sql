alter table public.learning_preferences
  add column if not exists theme text not null default 'system',
  add column if not exists reduced_motion boolean not null default false,
  add column if not exists lesson_difficulty text not null default 'new_coder';

alter table public.learning_preferences
  drop constraint if exists learning_preferences_theme_check,
  add constraint learning_preferences_theme_check
    check (theme in ('system', 'light', 'dark')),
  drop constraint if exists learning_preferences_lesson_difficulty_check,
  add constraint learning_preferences_lesson_difficulty_check
    check (lesson_difficulty in ('new_coder', 'some_basics', 'building_projects', 'advanced')),
  drop constraint if exists learning_preferences_explanation_style_check,
  add constraint learning_preferences_explanation_style_check
    check (explanation_style in ('short', 'step_by_step', 'deep_dive'));

drop trigger if exists set_learning_preferences_updated_at on public.learning_preferences;
create trigger set_learning_preferences_updated_at
  before update on public.learning_preferences
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_privacy_preferences_updated_at on public.privacy_preferences;
create trigger set_privacy_preferences_updated_at
  before update on public.privacy_preferences
  for each row execute procedure public.set_updated_at();

drop policy if exists "Users can manage own learning preferences" on public.learning_preferences;
drop policy if exists "Users can read own learning preferences" on public.learning_preferences;
drop policy if exists "Users can insert own learning preferences" on public.learning_preferences;
drop policy if exists "Users can update own learning preferences" on public.learning_preferences;
create policy "Users can read own learning preferences" on public.learning_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning preferences" on public.learning_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning preferences" on public.learning_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own privacy preferences" on public.privacy_preferences;
drop policy if exists "Users can update own privacy preferences" on public.privacy_preferences;
drop policy if exists "Users can insert own privacy preferences" on public.privacy_preferences;
create policy "Users can read own privacy preferences" on public.privacy_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own privacy preferences" on public.privacy_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own privacy preferences" on public.privacy_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Correct answers must be served through protected assessment logic, not selected directly by browsers.
drop policy if exists "Published questions are readable" on public.questions;
