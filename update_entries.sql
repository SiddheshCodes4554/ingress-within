-- Ingress Within - Entry scoring, reflections, and vocabulary restoration SQL script
BEGIN;

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 9, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 9, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000016';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '271b46a9-c761-4948-865a-ff9b33172516', 
  '10000000-0000-4000-a000-000000000016', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You mentioned feeling a great release of physical tension and stress, but you didn''t say what you were releasing it from.', 
  'groq', 
  'What were you feeling stressed about before playing football?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["physical exercise","stress relief","fun"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000016';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'exhausting', 
  'exhausting', 
  'It was exhausting but so much fun!', 
  0.9, 
  'Physically or mentally draining.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'fun', 
  'fun', 
  'It was exhausting but so much fun!', 
  0.85, 
  'Enjoyable or entertaining.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'energetic', 
  'energetic', 
  'The physical exercise made me feel energetic, playful, and alive.', 
  0.95, 
  'Having or showing a lot of energy or enthusiasm.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'playful', 
  'playful', 
  'The physical exercise made me feel energetic, playful, and alive.', 
  0.9, 
  'Showing a lighthearted or humorous attitude.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'alive', 
  'alive', 
  'The physical exercise made me feel energetic, playful, and alive.', 
  0.95, 
  'Full of energy, enthusiasm, or vitality.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000016', 
  NULL, 
  'release', 
  'release', 
  'I feel a great release of physical tension and stress.', 
  0.9, 
  'A feeling of letting go of tension or stress.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 4, 
  day_sa = 4, 
  new_entry_ei = 6, 
  new_entry_pr = 4, 
  new_entry_sa = 4, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000001';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '5f3055f0-979a-4f3e-b761-664a4aca7d2f', 
  '10000000-0000-4000-a000-000000000001', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re talking about needing to establish boundaries and healthy habits, but you''re not actually saying what''s stopping you from doing that.', 
  'groq', 
  'What''s holding you back from setting those boundaries and habits?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["overwhelm","pressure","growth","boundaries"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000001';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'feeling heavy', 
  'feel heavy', 
  'I woke up feeling heavy and sad today.', 
  0.95, 
  'A sense of emotional burden, sadness or fatigue.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'sad', 
  'sadness', 
  'I woke up feeling heavy and sad today.', 
  0.92, 
  'A negative emotional state characterized by feelings of sorrow or grief.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'pressure', 
  'stress', 
  'There is so much pressure at the office about my career project,', 
  0.88, 
  'A feeling of being overwhelmed or burdened by demands or expectations.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'overwhelmed', 
  'overwhelm', 
  'I feel overwhelmed.', 
  0.98, 
  'A feeling of being overwhelmed or unable to cope with a situation or task.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'establish better boundaries', 
  'boundary setting', 
  'I need to establish better boundaries and healthy habits to support my growth,', 
  0.96, 
  'The process of setting and maintaining healthy limits with others to protect one''s emotional and physical well-being.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'healthy habits', 
  'self-care', 
  'I need to establish better boundaries and healthy habits to support my growth,', 
  0.94, 
  'Practices and behaviors that promote physical, emotional, and mental well-being.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000001', 
  NULL, 
  'hard', 
  'difficulty', 
  'but it feels so hard to start.', 
  0.85, 
  'A sense of challenge or struggle in achieving a goal or overcoming an obstacle.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 2, 
  day_sa = 2, 
  new_entry_ei = 6, 
  new_entry_pr = 2, 
  new_entry_sa = 2, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000006';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  'c0fb8052-d0d8-4205-82e3-03db0e52f9a9', 
  '10000000-0000-4000-a000-000000000006', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''just'' when describing your dinner.', 
  'groq', 
  'What did you do instead of going out or doing something you enjoy after work?', 
  'Flat', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["exhaustion","emptiness","low energy"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000006';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000006', 
  NULL, 
  'tired', 
  'tired', 
  'I am feeling so tired and drained tonight.', 
  0.98, 
  'A state of physical or mental fatigue.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000006', 
  NULL, 
  'drained', 
  'drained', 
  'I am feeling so tired and drained tonight.', 
  0.98, 
  'Emotionally or physically exhausted.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000006', 
  NULL, 
  'exhaustion', 
  'exhaustion', 
  'The exhaustion is physical as well as mental.', 
  0.95, 
  'A state of extreme physical or mental fatigue.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000006', 
  NULL, 
  'empty', 
  'empty', 
  'I feel a bit empty and low.', 
  0.92, 
  'A feeling of emotional or psychological void.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000006', 
  NULL, 
  'low', 
  'low', 
  'I feel a bit empty and low.', 
  0.9, 
  'A state of emotional depression or sadness.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 4, 
  day_sa = 5, 
  new_entry_ei = 8, 
  new_entry_pr = 4, 
  new_entry_sa = 5, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000011';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '5fb9cbcb-2f02-4d33-af17-7da60f004202', 
  '10000000-0000-4000-a000-000000000011', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re using ''trying'' to describe your deep breathing, which suggests you''re not entirely convinced it''s working.', 
  'groq', 
  'What''s the worst that could happen if you let go of the need for deep breathing to work?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["anxiety","self-doubt","performance pressure"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000011';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000011', 
  NULL, 
  'overthinking', 
  'overthink', 
  'I am overthinking everything.', 
  0.98, 
  'Engaging in excessive or repetitive thinking, often leading to anxiety or indecision.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000011', 
  NULL, 
  'racing', 
  'race', 
  'My thoughts are racing,', 
  0.92, 
  'Moving quickly or uncontrollably, often describing a racing mind or thoughts.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000011', 
  NULL, 
  'anxious', 
  'anxiety', 
  'I feel anxious and tense in my shoulders.', 
  0.99, 
  'Experiencing feelings of worry, nervousness, or apprehension.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000011', 
  NULL, 
  'tense', 
  'tension', 
  'I feel anxious and tense in my shoulders.', 
  0.95, 
  'Experiencing physical or emotional strain, often describing a sense of unease or discomfort.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000011', 
  NULL, 
  'dread', 
  'dread', 
  'the dread is strong.', 
  0.97, 
  'Experiencing a strong feeling of fear, anxiety, or apprehension, often describing a sense of impending doom.'
);

UPDATE entries SET 
  day_ei = 4, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 4, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000017';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '12e241aa-4110-4425-8406-81001bf16433', 
  '10000000-0000-4000-a000-000000000017', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''peaceful'' to describe your day, but you didn''t mention anything that actually felt peaceful.', 
  'groq', 
  'What would happen if you looked closer at what''s making you feel calm and serene?', 
  'Flat', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["solitude","organization","calmness"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000017';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000017', 
  NULL, 
  'peaceful solitude', 
  'peaceful solitude', 
  'Today was a quiet Sunday of peaceful solitude.', 
  0.95, 
  'A state of being alone, yet feeling calm and serene.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000017', 
  NULL, 
  'calm', 
  'calm', 
  'I feel calm, serene, and ready for whatever comes.', 
  0.98, 
  'A state of being free from disturbance or turmoil.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000017', 
  NULL, 
  'serene', 
  'serene', 
  'I feel calm, serene, and ready for whatever comes.', 
  0.98, 
  'A state of being peaceful and tranquil.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000017', 
  NULL, 
  'good place', 
  'good place', 
  'I am in a good place.', 
  0.92, 
  'A state of being in a positive emotional state.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 6, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000002';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '94bdc51e-4933-404c-89fe-62ca860df7bf', 
  '10000000-0000-4000-a000-000000000002', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''relief'' to describe how you felt after your walk, but you didn''t mention what specifically was causing you stress in the past week.', 
  'groq', 
  'What''s been weighing on you that you''re taking a break from?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["nature","relaxation","stress"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000002';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'peaceful', 
  'peaceful', 
  'Today was a peaceful and relaxing Saturday.', 
  0.95, 
  'A state of being calm, serene, and free from disturbance.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'relaxing', 
  'relaxing', 
  'Today was a peaceful and relaxing Saturday.', 
  0.95, 
  'A state of being free from tension, anxiety, or stress.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'stress', 
  'stress', 
  'It was a nice relief from the stress of the past week.', 
  0.95, 
  'A state of mental or emotional strain or tension.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'grounded', 
  'grounded', 
  'the fresh air made me feel grounded and calm.', 
  0.9, 
  'A sense of being connected to one''s emotions, thoughts, or surroundings.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'calm', 
  'calm', 
  'the fresh air made me feel grounded and calm.', 
  0.95, 
  'A state of being peaceful, serene, and free from disturbance.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'quiet', 
  'quiet', 
  'I feel quiet and clear.', 
  0.9, 
  'A state of being still, silent, or free from disturbance.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000002', 
  NULL, 
  'clear', 
  'clear', 
  'I feel quiet and clear.', 
  0.9, 
  'A state of being free from confusion, uncertainty, or mental clutter.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 4, 
  day_sa = 7, 
  new_entry_ei = 6, 
  new_entry_pr = 4, 
  new_entry_sa = 7, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000007';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  'b5923aae-e9ef-4f15-8f11-44c18977e847', 
  '10000000-0000-4000-a000-000000000007', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re using the word ''hard'' to describe establishing boundaries, but you''re also saying you''re making progress. It sounds like there''s a bit of a struggle going on.', 
  'groq', 
  'What''s it like to acknowledge that you can''t do everything?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["self-care","boundaries","progress"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000007';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'quiet', 
  'quiet', 
  'I had a quiet evening to reflect.', 
  0.8, 
  'A peaceful and calm atmosphere.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'energy levels', 
  'energy level', 
  'I am learning to pay attention to my energy levels', 
  0.9, 
  'A person''s physical or mental vitality.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'accept', 
  'accept', 
  'I am learning to pay attention to my energy levels and accept that I cannot do everything.', 
  0.85, 
  'To acknowledge and tolerate a difficult situation or reality.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'hopeful', 
  'hopeful', 
  'I feel hopeful about the changes I am making.', 
  0.95, 
  'Feeling optimistic and positive about the future.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'hard', 
  'difficult', 
  'Establishing boundaries is hard, but I am making progress.', 
  0.9, 
  'Something that is challenging or demanding.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000007', 
  NULL, 
  'making progress', 
  'progress', 
  'Establishing boundaries is hard, but I am making progress.', 
  0.85, 
  'Advancement or improvement in a situation or activity.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000012';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '790ce560-ec81-417a-97cd-7ecaadcaf607', 
  '10000000-0000-4000-a000-000000000012', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re using words like ''huge wave of relief'' and ''grounded and relaxed'', but you''re not acknowledging the fact that you were ''worrying far too much'' - it''s like you''re glossing over the intensity of your anxiety.', 
  'groq', 
  'What are you afraid will happen if you look at how much you were actually worried?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["anxiety","relief","self-awareness"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000012';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'huge wave of relief', 
  'relief', 
  'I feel a huge wave of relief.', 
  0.98, 
  'A feeling of being freed from anxiety or stress.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'grounded', 
  'grounded', 
  'I feel grounded and relaxed now.', 
  0.95, 
  'A sense of being centered, calm, and connected to one''s emotions.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'relaxed', 
  'relaxed', 
  'I feel grounded and relaxed now.', 
  0.95, 
  'A state of being calm, serene, and free from tension.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'dread', 
  'dread', 
  'The dread is gone, and I realize I was worrying far too much.', 
  0.92, 
  'A feeling of intense anxiety or fear about a future event.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'worrying', 
  'worry', 
  'The dread is gone, and I realize I was worrying far too much.', 
  0.92, 
  'A state of anxiety or concern about a future event or situation.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000012', 
  NULL, 
  'breathe', 
  'breathe', 
  'I can finally breathe.', 
  0.85, 
  'A sense of being able to relax and feel calm, often after a period of stress or anxiety.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 6, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000013';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  'c85cd5df-4eac-4449-8cd1-03de41905e06', 
  '10000000-0000-4000-a000-000000000013', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re focusing on the positive relationships you have here, but you''re not mentioning any challenges or difficulties you might be facing.', 
  'groq', 
  'What''s it like to acknowledge the good relationships without also talking about the harder parts of your work or personal life?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["gratitude","positive relationships","appreciation"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000013';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000013', 
  NULL, 
  'kind', 
  'kind', 
  'A colleague sent me a very kind message today thanking me for my help on their task.', 
  0.95, 
  'Showing a genuine and generous concern for someone''s well-being.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000013', 
  NULL, 
  'warm', 
  'warm', 
  'It was unexpected and made me feel so warm and supported.', 
  0.95, 
  'Feeling a sense of comfort, security, and affection.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000013', 
  NULL, 
  'supported', 
  'supported', 
  'It was unexpected and made me feel so warm and supported.', 
  0.95, 
  'Providing emotional or psychological assistance to someone.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000013', 
  NULL, 
  'grateful', 
  'grateful', 
  'I feel grateful for the good relationships I have here.', 
  0.95, 
  'Feeling thankful and appreciative for something or someone.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000003';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  'f7812bc1-c69f-4bc5-b868-ef558a814f53', 
  '10000000-0000-4000-a000-000000000003', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You mentioned ''who I am outside of my career'', but you didn''t say what that means to you.', 
  'groq', 
  'What does it mean to you to be outside of your career?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["friendship","identity","happiness"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000003';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000003', 
  NULL, 
  'happy', 
  'happy', 
  'I felt so happy and connected.', 
  0.98, 
  'A positive emotional state, characterized by feelings of joy and contentment.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000003', 
  NULL, 
  'connected', 
  'connected', 
  'I felt so happy and connected.', 
  0.98, 
  'A sense of emotional closeness and bonding with others.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000003', 
  NULL, 
  'reminded me of who I am', 
  'self-identity', 
  'It reminded me of who I am outside of my career.', 
  0.92, 
  'A sense of self-awareness and understanding of one''s values, goals, and personality.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000003', 
  NULL, 
  'outside of my career', 
  'identity separation', 
  'It reminded me of who I am outside of my career.', 
  0.85, 
  'A distinction between one''s professional and personal life, highlighting the importance of maintaining a separate sense of self outside of work.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 2, 
  day_sa = 2, 
  new_entry_ei = 6, 
  new_entry_pr = 2, 
  new_entry_sa = 2, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000008';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  'd1176b3c-d81a-4953-9dae-5fc1ea480293', 
  '10000000-0000-4000-a000-000000000008', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re describing the physical sensations in your body, like the ache in your chest, but you''re not naming what''s causing those feelings.', 
  'groq', 
  'What''s the one thing you''re not saying about why you''re feeling so sad and lonely right now?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["loneliness","sadness","physical sensations"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000008';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'sad', 
  'sad', 
  'I feel quite sad and lonely.', 
  0.98, 
  'Experiencing a low mood or emotional pain.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'lonely', 
  'lonely', 
  'I feel quite sad and lonely.', 
  0.98, 
  'Feeling isolated or disconnected from others.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'missing', 
  'miss', 
  'I am missing my family.', 
  0.95, 
  'Experiencing a sense of longing or yearning for something or someone.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'alone', 
  'alone', 
  'I am feeling very alone in this apartment.', 
  0.97, 
  'Experiencing a sense of isolation or disconnection from others.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'heavy', 
  'heavy', 
  'The silence in the room feels heavy.', 
  0.96, 
  'A sense of emotional burden, sadness or fatigue.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000008', 
  NULL, 
  'ache', 
  'ache', 
  'I have a low-grade ache in my chest.', 
  0.94, 
  'Experiencing a physical or emotional pain.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 9, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 9, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000014';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '61176066-d4ee-470c-9f0a-e97c398a8438', 
  '10000000-0000-4000-a000-000000000014', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''complete'' to describe your flow state, which suggests a sense of wholeness or perfection.', 
  'groq', 
  'What''s one thing that might disrupt this feeling of being ''alive''?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["creativity","inspiration","flow state"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000014';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000014', 
  NULL, 
  'flow state', 
  'flow state', 
  'I was in a complete flow state, where time just flew by.', 
  0.98, 
  'A mental state of complete absorption and engagement in an activity.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000014', 
  NULL, 
  'creative', 
  'creative', 
  'I felt creative, inspired, and excited.', 
  0.92, 
  'Experiencing a sense of imagination and originality.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000014', 
  NULL, 
  'inspired', 
  'inspired', 
  'I felt creative, inspired, and excited.', 
  0.95, 
  'Feeling motivated and energized by a creative or intellectual pursuit.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000014', 
  NULL, 
  'excited', 
  'excited', 
  'I felt creative, inspired, and excited.', 
  0.97, 
  'Experiencing a strong positive emotional state, often accompanied by enthusiasm and eagerness.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000014', 
  NULL, 
  'alive', 
  'alive', 
  'This is the kind of work that makes me feel alive.', 
  0.99, 
  'Experiencing a sense of vitality, energy, and engagement in life.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 6, 
  day_sa = 3, 
  new_entry_ei = 8, 
  new_entry_pr = 6, 
  new_entry_sa = 3, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000004';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '8b8e98a8-d09e-4740-bbe5-dea18693b351', 
  '10000000-0000-4000-a000-000000000004', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''overwhelming'' to describe the backlog.', 
  'groq', 
  'What does the Monday backlog actually look like, in terms of tasks and responsibilities?', 
  'Flat', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["work stress","time management","productivity"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000004';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000004', 
  NULL, 
  'overwhelming', 
  'overwhelming', 
  'the Monday backlog is overwhelming', 
  0.98, 
  'A feeling of being completely dominated or consumed by a situation or task.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000004', 
  NULL, 
  'stressed', 
  'stressed', 
  'I feel rushed and stressed already', 
  0.96, 
  'A state of being anxious or overwhelmed, often due to external pressures.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000004', 
  NULL, 
  'tense', 
  'tense', 
  'a tight deadline that makes me feel tense and tired', 
  0.94, 
  'A state of being anxious or on edge, often due to anticipation or uncertainty.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000004', 
  NULL, 
  'tired', 
  'tired', 
  'a tight deadline that makes me feel tense and tired', 
  0.92, 
  'A state of physical or mental exhaustion, often due to lack of rest or emotional strain.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000004', 
  NULL, 
  'depleted', 
  'depleted', 
  'I feel depleted before the week has even fully started', 
  0.99, 
  'A state of being emotionally or physically drained, often due to prolonged stress or exhaustion.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 9, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 9, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000009';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '41a2fad0-20aa-492f-bc08-9700c356414b', 
  '10000000-0000-4000-a000-000000000009', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''consistency'' to describe your work, but it feels like you''re glossing over the fact that you''ve been struggling to stay motivated lately.', 
  'groq', 
  'What''s the real reason you''re feeling so proud of your consistency right now?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["motivation","creativity","self-discipline"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000009';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'joyful', 
  'joyful', 
  'I feel so joyful, inspired, and proud of my consistency.', 
  0.95, 
  'Experiencing a strong feeling of happiness and delight.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'inspired', 
  'inspired', 
  'I feel so joyful, inspired, and proud of my consistency.', 
  0.95, 
  'Feeling motivated and energized by a creative or intellectual pursuit.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'proud', 
  'proud', 
  'I feel so joyful, inspired, and proud of my consistency.', 
  0.95, 
  'Feeling a sense of satisfaction and self-worth due to one''s achievements.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'consistency', 
  'consistency', 
  'I feel so joyful, inspired, and proud of my consistency.', 
  0.85, 
  'Demonstrating reliability and dependability in one''s actions or behavior.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'satisfying', 
  'satisfying', 
  'It is satisfying to create something of my own.', 
  0.9, 
  'Experiencing a sense of fulfillment and pleasure due to a creative or intellectual pursuit.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000009', 
  NULL, 
  'create', 
  'create', 
  'It is satisfying to create something of my own.', 
  0.8, 
  'Engaging in a creative or intellectual activity that brings new ideas or products into existence.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 2, 
  day_sa = 8, 
  new_entry_ei = 6, 
  new_entry_pr = 2, 
  new_entry_sa = 8, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000015';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '0398cf79-fa6c-4505-a570-5eb97fcffaca', 
  '10000000-0000-4000-a000-000000000015', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You''re reporting on your feelings and actions, but you''re not really explaining what ''managed my boundaries well'' means to you. You''re also not saying what specifically made you feel content and relaxed.', 
  'groq', 
  'What does it mean to you to ''manage your boundaries well''?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["self-care","boundaries","relaxation"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000015';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000015', 
  NULL, 
  'content', 
  'content', 
  'I feel very content and relaxed.', 
  0.95, 
  'A state of being satisfied and happy with one''s life or situation.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000015', 
  NULL, 
  'relaxed', 
  'relaxed', 
  'I feel very content and relaxed.', 
  0.95, 
  'A state of being free from tension or stress.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000015', 
  NULL, 
  'boundaries', 
  'boundaries', 
  'I had a busy week, but I managed my boundaries well.', 
  0.85, 
  'Personal limits or rules that define one''s emotional and physical space.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000015', 
  NULL, 
  'winding down', 
  'winding down', 
  'I am winding down now, watching a film, and looking forward to the weekend.', 
  0.9, 
  'The process of gradually reducing stress or tension, often through relaxation techniques.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000015', 
  NULL, 
  'peaceful', 
  'peaceful', 
  'I feel peaceful.', 
  0.95, 
  'A state of being calm and serene, free from conflict or disturbance.'
);

UPDATE entries SET 
  day_ei = 8, 
  day_pr = 2, 
  day_sa = 9, 
  new_entry_ei = 8, 
  new_entry_pr = 2, 
  new_entry_sa = 9, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000005';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '27392f95-ee94-4f0d-b7ff-72f84e871652', 
  '10000000-0000-4000-a000-000000000005', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''finally'' to describe the solution working.', 
  'groq', 
  'What''s the sense of relief you felt when the solution worked, and what does that say about your expectations beforehand?', 
  'Open', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["confidence","motivation","problem-solving"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000005';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'difficult', 
  'difficult', 
  'I solved a very difficult technical problem at work today!', 
  0.9, 
  'A challenge or obstacle that requires effort to overcome.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'confident', 
  'confident', 
  'I felt so confident and motivated.', 
  0.95, 
  'Feeling sure of one''s abilities, judgment, or decision.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'motivated', 
  'motivated', 
  'I felt so confident and motivated.', 
  0.95, 
  'Having a strong desire or enthusiasm to achieve a goal or complete a task.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'capable', 
  'capable', 
  'I feel capable, clear, and proud of my progress.', 
  0.9, 
  'Having the ability or skill to do something.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'clear', 
  'clear', 
  'I feel capable, clear, and proud of my progress.', 
  0.8, 
  'Free from confusion or uncertainty.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000005', 
  NULL, 
  'proud', 
  'proud', 
  'I feel capable, clear, and proud of my progress.', 
  0.95, 
  'Feeling a sense of satisfaction or pleasure in one''s achievements or qualities.'
);

UPDATE entries SET 
  day_ei = 6, 
  day_pr = 4, 
  day_sa = 6, 
  new_entry_ei = 6, 
  new_entry_pr = 4, 
  new_entry_sa = 6, 
  scoring_status = 'scored', 
  vocab_processed = true, 
  entry_type = 'new_only',
  updated_at = NOW() 
WHERE id = '10000000-0000-4000-a000-000000000010';
INSERT INTO reflections (
  id, 
  entry_id, 
  user_id, 
  cycle_id, 
  reflection_text, 
  provider, 
  closing_question, 
  classification, 
  confidence, 
  status, 
  generated_at, 
  created_at, 
  themes
) VALUES (
  '3d56dd9f-9d99-4733-a9ff-ea022c56be8b', 
  '10000000-0000-4000-a000-000000000010', 
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  'You used the word ''minor'' to describe the setback.', 
  'groq', 
  'What does ''restore my balance'' mean to you in this moment?', 
  'Flat', 
  'high', 
  'ready', 
  NOW(), 
  NOW(), 
  '["frustration","anger","tension","balance"]'::jsonb
) ON CONFLICT (entry_id) DO UPDATE SET 
  reflection_text = EXCLUDED.reflection_text,
  closing_question = EXCLUDED.closing_question,
  themes = EXCLUDED.themes,
  classification = EXCLUDED.classification,
  status = 'ready';
DELETE FROM vocab_extractions WHERE entry_id = '10000000-0000-4000-a000-000000000010';
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'frustrated', 
  'frustrated', 
  'I had a minor setback today and felt so frustrated and irritated.', 
  0.95, 
  'A feeling of dissatisfaction or annoyance caused by being unable to achieve something.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'irritated', 
  'irritated', 
  'I had a minor setback today and felt so frustrated and irritated.', 
  0.95, 
  'A feeling of annoyance or displeasure, often caused by a minor or trivial thing.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'angry', 
  'angry', 
  'I felt angry and tense.', 
  0.9, 
  'A strong feeling of displeasure, hostility, or antagonism.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'tense', 
  'tense', 
  'I felt angry and tense.', 
  0.9, 
  'A state of physical or mental strain, often caused by anxiety or stress.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'restore', 
  'restore', 
  'I need to restore my balance and not let small things ruin my day.', 
  0.85, 
  'To regain a state of balance or equilibrium, often after a period of stress or disruption.'
);
INSERT INTO vocab_extractions (
  user_id, 
  cycle_id, 
  entry_id, 
  thread_response_id, 
  word, 
  normalized_word, 
  sentence, 
  confidence, 
  sentence_reasoning
) VALUES (
  'f36d91ed-d484-4ecb-9078-1dfba35ff7c7', 
  'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da', 
  '10000000-0000-4000-a000-000000000010', 
  NULL, 
  'balance', 
  'balance', 
  'I need to restore my balance and not let small things ruin my day.', 
  0.85, 
  'A state of equilibrium or stability, often achieved through emotional regulation or self-control.'
);

COMMIT;