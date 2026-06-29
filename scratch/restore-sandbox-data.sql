-- Ingress Within Database Restore Script - 17 Days of Journaling History
-- Target User: f36d91ed-d484-4ecb-9078-1dfba35ff7c7
-- Target Cycle: e92a52a6-fa6a-4b7b-bcd6-0ad622e422da
-- =========================================================================

BEGIN;

-- 1. Clean up existing records for this user to prevent unique constraints or duplication
DELETE FROM public.vocab_extractions WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.vocab_words WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.vocab_clusters WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.vocab_concepts WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.thread_responses WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.threads WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
DELETE FROM public.reflections WHERE cycle_id = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';
DELETE FROM public.entries WHERE user_id = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

-- 2. Align the cycle start date to June 12th so the timeline is continuous and day-matched
UPDATE public.cycles 
SET started_at = '2026-06-12' 
WHERE id = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

-- 3. Insert Entries
-- Day 1: June 12
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000001',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    1,
    'I woke up feeling heavy and sad today. There is so much pressure at the office about my career project, and I feel overwhelmed. I need to establish better boundaries and healthy habits to support my growth, but it feels so hard to start.',
    38,
    'new_only',
    '2026-06-12 09:00:00+00',
    '2026-06-12 09:00:00+00',
    '50000000-0000-4000-a000-000000000001',
    'fresh'
);

-- Day 2: June 13
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000002',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    2,
    'Today was a peaceful and relaxing Saturday. I went for a long walk in nature, and the fresh air made me feel grounded and calm. It was a nice relief from the stress of the past week. I feel quiet and clear.',
    39,
    'new_only',
    '2026-06-13 09:00:00+00',
    '2026-06-13 09:00:00+00',
    '50000000-0000-4000-a000-000000000002',
    'fresh'
);

-- Day 3: June 14
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000003',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    3,
    'I met up with an old friend for coffee today. We talked for hours, laughed so much, and shared warm memories of our college days. I felt so happy and connected. It reminded me of who I am outside of my career.',
    39,
    'new_only',
    '2026-06-14 09:00:00+00',
    '2026-06-14 09:00:00+00',
    '50000000-0000-4000-a000-000000000003',
    'fresh'
);

-- Day 4: June 15
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000004',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    4,
    'Back to work, and the Monday backlog is overwhelming. I feel rushed and stressed already. I have so many meetings and a tight deadline that makes me feel tense and tired. I feel depleted before the week has even fully started.',
    40,
    'new_only',
    '2026-06-15 09:00:00+00',
    '2026-06-15 09:00:00+00',
    '50000000-0000-4000-a000-000000000004',
    'fresh'
);

-- Day 5: June 16
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000005',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    5,
    'I solved a very difficult technical problem at work today! I spent hours focused on it, and when the solution finally worked, I felt so confident and motivated. I feel capable, clear, and proud of my progress.',
    37,
    'new_only',
    '2026-06-16 09:00:00+00',
    '2026-06-16 09:00:00+00',
    '50000000-0000-4000-a000-000000000005',
    'fresh'
);

-- Day 6: June 17
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000006',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    6,
    'I am feeling so tired and drained tonight. The exhaustion is physical as well as mental. I didn''t have any energy left after work, so I just ate a quiet dinner and stayed in bed. I feel a bit empty and low.',
    41,
    'new_only',
    '2026-06-17 09:00:00+00',
    '2026-06-17 09:00:00+00',
    '50000000-0000-4000-a000-000000000006',
    'fresh'
);

-- Day 7: June 18
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000007',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    7,
    'I had a quiet evening to reflect. I am learning to pay attention to my energy levels and accept that I cannot do everything. I feel hopeful about the changes I am making. Establishing boundaries is hard, but I am making progress.',
    40,
    'new_only',
    '2026-06-18 09:00:00+00',
    '2026-06-18 09:00:00+00',
    '50000000-0000-4000-a000-000000000007',
    'fresh'
);

-- Day 8: June 19
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000008',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    8,
    'It is a rainy Friday night and I feel quite sad and lonely. I am missing my family and feeling very alone in this apartment. The silence in the room feels heavy, and I have a low-grade ache in my chest.',
    39,
    'new_only',
    '2026-06-19 09:00:00+00',
    '2026-06-19 09:00:00+00',
    '50000000-0000-4000-a000-000000000008',
    'fresh'
);

-- Day 9: June 20
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000009',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    9,
    'I completed a major personal project milestone today! I worked on it all morning and it turned out beautifully. I feel so joyful, inspired, and proud of my consistency. It is satisfying to create something of my own.',
    37,
    'new_only',
    '2026-06-20 09:00:00+00',
    '2026-06-20 09:00:00+00',
    '50000000-0000-4000-a000-000000000009',
    'fresh'
);

-- Day 10: June 21
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000010',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    10,
    'I had a minor setback today and felt so frustrated and irritated. A tool I was using crashed and I lost an hour of work. I felt angry and tense. I need to restore my balance and not let small things ruin my day.',
    41,
    'new_only',
    '2026-06-21 09:00:00+00',
    '2026-06-21 09:00:00+00',
    '50000000-0000-4000-a000-000000000010',
    'fresh'
);

-- Day 11: June 22
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000011',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    11,
    'I have a big presentation tomorrow and I am overthinking everything. My thoughts are racing, and I feel anxious and tense in my shoulders. I am trying to use deep breathing to stay grounded, but the dread is strong.',
    38,
    'new_only',
    '2026-06-22 09:00:00+00',
    '2026-06-22 09:00:00+00',
    '50000000-0000-4000-a000-000000000011',
    'fresh'
);

-- Day 12: June 23
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000012',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    12,
    'The presentation went really well! The feedback was positive, and I feel a huge wave of relief. I feel grounded and relaxed now. The dread is gone, and I realize I was worrying far too much. I can finally breathe.',
    39,
    'new_only',
    '2026-06-23 09:00:00+00',
    '2026-06-23 09:00:00+00',
    '50000000-0000-4000-a000-000000000012',
    'fresh'
);

-- Day 13: June 24
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000013',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    13,
    'A colleague sent me a very kind message today thanking me for my help on their task. It was unexpected and made me feel so warm and supported. I feel grateful for the good relationships I have here.',
    37,
    'new_only',
    '2026-06-24 09:00:00+00',
    '2026-06-24 09:00:00+00',
    '50000000-0000-4000-a000-000000000013',
    'fresh'
);

-- Day 14: June 25
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000014',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    14,
    'I spent the afternoon writing code and brainstorming a new design. I was in a complete flow state, where time just flew by. I felt creative, inspired, and excited. This is the kind of work that makes me feel alive.',
    39,
    'new_only',
    '2026-06-25 09:00:00+00',
    '2026-06-25 09:00:00+00',
    '50000000-0000-4000-a000-000000000014',
    'fresh'
);

-- Day 15: June 26
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000015',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    15,
    'It is Friday evening and I feel very content and relaxed. I had a busy week, but I managed my boundaries well. I am winding down now, watching a film, and looking forward to the weekend. I feel peaceful.',
    37,
    'new_only',
    '2026-06-26 09:00:00+00',
    '2026-06-26 09:00:00+00',
    '50000000-0000-4000-a000-000000000015',
    'fresh'
);

-- Day 16: June 27
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000016',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    16,
    'I played football with some colleagues today. It was exhausting but so much fun! The physical exercise made me feel energetic, playful, and alive. I feel a great release of physical tension and stress.',
    35,
    'new_only',
    '2026-06-27 09:00:00+00',
    '2026-06-27 09:00:00+00',
    '50000000-0000-4000-a000-000000000016',
    'fresh'
);

-- Day 17: June 28
INSERT INTO public.entries (id, user_id, cycle_id, cycle_day, content, word_count, entry_type, created_at, written_at, client_id, mode)
VALUES (
    '10000000-0000-4000-a000-000000000017',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    17,
    'Today was a quiet Sunday of peaceful solitude. I read a book, prepared my meals, and organized my space for the next week. I feel calm, serene, and ready for whatever comes. I am in a good place.',
    37,
    'new_only',
    '2026-06-28 09:00:00+00',
    '2026-06-28 09:00:00+00',
    '50000000-0000-4000-a000-000000000017',
    'fresh'
);


-- 4. Insert Reflections
-- Day 1
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000001',
    '10000000-0000-4000-a000-000000000001',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'You are experiencing significant work-related stress and feeling a lack of personal boundaries. Your focus on growth shows a desire for change, but it is currently overshadowed by a feeling of heaviness.',
    'What is one small boundary you can set at the office tomorrow to give yourself some breathing room?',
    'completed',
    '2026-06-12 10:00:00+00',
    '2026-06-12 10:00:00+00'
);

-- Day 2
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000002',
    '10000000-0000-4000-a000-000000000002',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Nature walks and quiet reflection are helping you regulate your nervous system after a highly stressful week. You feel a sense of calm and relief.',
    'How can you bring a small piece of this peaceful Saturday energy into your weekday routine?',
    'completed',
    '2026-06-13 10:00:00+00',
    '2026-06-13 10:00:00+00'
);

-- Day 3
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000003',
    '10000000-0000-4000-a000-000000000003',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Reconnecting with long-time friends brings a strong sense of joy and belonging, reminding you of your identity beyond work.',
    'What is it about your connection with this friend that makes you feel most like yourself?',
    'completed',
    '2026-06-14 10:00:00+00',
    '2026-06-14 10:00:00+00'
);

-- Day 4
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000004',
    '10000000-0000-4000-a000-000000000004',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'The abrupt transition from a peaceful weekend to a demanding Monday backlog is triggering physical tension and mental exhaustion.',
    'When the backlog starts to feel overwhelming, what is your default reaction, and how can you pause?',
    'completed',
    '2026-06-15 10:00:00+00',
    '2026-06-15 10:00:00+00'
);

-- Day 5
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000005',
    '10000000-0000-4000-a000-000000000005',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Overcoming a challenging task has boosted your confidence and re-ignited your sense of competence and career drive.',
    'What does this breakthrough tell you about your ability to handle difficult challenges in the future?',
    'completed',
    '2026-06-16 10:00:00+00',
    '2026-06-16 10:00:00+00'
);

-- Day 6
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000006',
    '10000000-0000-4000-a000-000000000006',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'You are experiencing mid-week depletion, where physical fatigue is beginning to drag down your emotional state.',
    'What does your body need most right now to recover from this level of exhaustion?',
    'completed',
    '2026-06-17 10:00:00+00',
    '2026-06-17 10:00:00+00'
);

-- Day 7
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000007',
    '10000000-0000-4000-a000-000000000007',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'You are developing a mindful relationship with your energy levels and showing self-compassion for your progress.',
    'As you learn to accept your limits, what is one thing you are ready to let go of?',
    'completed',
    '2026-06-18 10:00:00+00',
    '2026-06-18 10:00:00+00'
);

-- Day 8
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000008',
    '10000000-0000-4000-a000-000000000008',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'A quiet weekend start combined with rainy weather has brought feelings of loneliness and a sense of isolation.',
    'How can you show kindness to yourself when the silence of the room feels heavy?',
    'completed',
    '2026-06-19 10:00:00+00',
    '2026-06-19 10:00:00+00'
);

-- Day 9
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000009',
    '10000000-0000-4000-a000-000000000009',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Completing a personal creative milestone brings a deep sense of satisfaction, inspiration, and intrinsic pride.',
    'How does the joy of working on your own project compare to your day job?',
    'completed',
    '2026-06-20 10:00:00+00',
    '2026-06-20 10:00:00+00'
);

-- Day 10
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000010',
    '10000000-0000-4000-a000-000000000010',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'A sudden loss of progress has triggered irritability, exposing a vulnerability to losing control over your time.',
    'How can you gently let go of the lost hour without carrying the frustration forward?',
    'completed',
    '2026-06-21 10:00:00+00',
    '2026-06-21 10:00:00+00'
);

-- Day 11
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000011',
    '10000000-0000-4000-a000-000000000011',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Performance anxiety is triggering physical tension and cognitive overthinking before a significant work event.',
    'If you could tell your anxious mind one comforting truth about tomorrow, what would it be?',
    'completed',
    '2026-06-22 10:00:00+00',
    '2026-06-22 10:00:00+00'
);

-- Day 12
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000012',
    '10000000-0000-4000-a000-000000000012',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'The successful completion of your presentation has released your accumulated anxiety, leaving you with relief and relaxation.',
    'What did you learn from this cycle of dread and relief that you can apply to the next big event?',
    'completed',
    '2026-06-23 10:00:00+00',
    '2026-06-23 10:00:00+00'
);

-- Day 13
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000013',
    '10000000-0000-4000-a000-000000000013',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Receiving appreciation from a peer has fostered a sense of belonging and enhanced your career satisfaction.',
    'How does it feel to know that your contribution has a positive impact on others?',
    'completed',
    '2026-06-24 10:00:00+00',
    '2026-06-24 10:00:00+00'
);

-- Day 14
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000014',
    '10000000-0000-4000-a000-000000000014',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Achieving a state of flow while engaged in creative problem solving is bringing you a high level of mental stimulation.',
    'What conditions in your environment today helped you enter that effortless flow state?',
    'completed',
    '2026-06-25 10:00:00+00',
    '2026-06-25 10:00:00+00'
);

-- Day 15
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000015',
    '10000000-0000-4000-a000-000000000015',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Successful boundary management during a busy week has enabled you to transition into a relaxed and content weekend state.',
    'What was the most successful boundary you maintained this week?',
    'completed',
    '2026-06-26 10:00:00+00',
    '2026-06-26 10:00:00+00'
);

-- Day 16
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000016',
    '10000000-0000-4000-a000-000000000016',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'Physical exercise and social play are acting as a powerful outlet for stress release, boosting your vitality.',
    'How does physical movement change the quality of your thoughts?',
    'completed',
    '2026-06-27 10:00:00+00',
    '2026-06-27 10:00:00+00'
);

-- Day 17
INSERT INTO public.reflections (id, entry_id, cycle_id, observation, question, status, generated_at, created_at)
VALUES (
    '20000000-0000-4000-a000-000000000017',
    '10000000-0000-4000-a000-000000000017',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    'A Sunday of nesting and preparation is providing you with a sense of order, serenity, and mental readiness.',
    'As you look ahead to the new week, what intention do you want to carry with you?',
    'completed',
    '2026-06-28 10:00:00+00',
    '2026-06-28 10:00:00+00'
);


-- 5. Insert Threads
-- Day 1
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000001',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000001',
    'What is one small boundary you can set at the office tomorrow to give yourself some breathing room?',
    'Answered',
    '2026-06-12 10:00:00+00',
    '2026-06-12 18:00:00+00'
);

-- Day 2
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000002',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000002',
    'How can you bring a small piece of this peaceful Saturday energy into your weekday routine?',
    'Answered',
    '2026-06-13 10:00:00+00',
    '2026-06-13 18:00:00+00'
);

-- Day 3
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000003',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000003',
    'What is it about your connection with this friend that makes you feel most like yourself?',
    'Answered',
    '2026-06-14 10:00:00+00',
    '2026-06-14 18:00:00+00'
);

-- Day 4
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000004',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000004',
    'When the backlog starts to feel overwhelming, what is your default reaction, and how can you pause?',
    'Answered',
    '2026-06-15 10:00:00+00',
    '2026-06-15 18:00:00+00'
);

-- Day 5
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000005',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000005',
    'What does this breakthrough tell you about your ability to handle difficult challenges in the future?',
    'Answered',
    '2026-06-16 10:00:00+00',
    '2026-06-16 18:00:00+00'
);

-- Day 6
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000006',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000006',
    'What does your body need most right now to recover from this level of exhaustion?',
    'Answered',
    '2026-06-17 10:00:00+00',
    '2026-06-17 18:00:00+00'
);

-- Day 7
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000007',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000007',
    'As you learn to accept your limits, what is one thing you are ready to let go of?',
    'Answered',
    '2026-06-18 10:00:00+00',
    '2026-06-18 18:00:00+00'
);

-- Day 8
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000008',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000008',
    'How can you show kindness to yourself when the silence of the room feels heavy?',
    'Answered',
    '2026-06-19 10:00:00+00',
    '2026-06-19 18:00:00+00'
);

-- Day 9
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000009',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000009',
    'How does the joy of working on your own project compare to your day job?',
    'Answered',
    '2026-06-20 10:00:00+00',
    '2026-06-20 18:00:00+00'
);

-- Day 10
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000010',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000010',
    'How can you gently let go of the lost hour without carrying the frustration forward?',
    'Answered',
    '2026-06-21 10:00:00+00',
    '2026-06-21 18:00:00+00'
);

-- Day 11
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000011',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000011',
    'If you could tell your anxious mind one comforting truth about tomorrow, what would it be?',
    'Answered',
    '2026-06-22 10:00:00+00',
    '2026-06-22 18:00:00+00'
);

-- Day 12
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000012',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000012',
    'What did you learn from this cycle of dread and relief that you can apply to the next big event?',
    'Answered',
    '2026-06-23 10:00:00+00',
    '2026-06-23 18:00:00+00'
);

-- Day 13
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000013',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000013',
    'How does it feel to know that your contribution has a positive impact on others?',
    'Answered',
    '2026-06-24 10:00:00+00',
    '2026-06-24 18:00:00+00'
);

-- Day 14
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000014',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000014',
    'What conditions in your environment today helped you enter that effortless flow state?',
    'Answered',
    '2026-06-25 10:00:00+00',
    '2026-06-25 18:00:00+00'
);

-- Day 15
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000015',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000015',
    'What was the most successful boundary you maintained this week?',
    'Answered',
    '2026-06-26 10:00:00+00',
    '2026-06-26 18:00:00+00'
);

-- Day 16
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000016',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000016',
    'How does physical movement change the quality of your thoughts?',
    'Answered',
    '2026-06-27 10:00:00+00',
    '2026-06-27 18:00:00+00'
);

-- Day 17
INSERT INTO public.threads (id, user_id, cycle_id, reflection_id, closing_question, status, created_at, answered_at)
VALUES (
    '30000000-0000-4000-a000-000000000017',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da',
    '20000000-0000-4000-a000-000000000017',
    'As you look ahead to the new week, what intention do you want to carry with you?',
    'Answered',
    '2026-06-28 10:00:00+00',
    '2026-06-28 18:00:00+00'
);


-- 6. Insert Thread Responses
-- Day 1
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000001',
    '30000000-0000-4000-a000-000000000001',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I decided to turn off my work notifications after 6 PM today. It was difficult and I felt anxious, but I stuck to it.',
    '2026-06-12 18:00:00+00',
    true,
    false
);

-- Day 2
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000002',
    '30000000-0000-4000-a000-000000000002',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I want to try taking a 10-minute quiet walk during my lunch break at work.',
    '2026-06-13 18:00:00+00',
    true,
    false
);

-- Day 3
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000003',
    '30000000-0000-4000-a000-000000000003',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'They knew me before I had all this career pressure. With them, I don''t have to prove anything, I can just be.',
    '2026-06-14 18:00:00+00',
    true,
    false
);

-- Day 4
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000004',
    '30000000-0000-4000-a000-000000000004',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'My default is to rush and work faster, which makes me more anxious. I need to force myself to pause and take deep breaths.',
    '2026-06-15 18:00:00+00',
    true,
    false
);

-- Day 5
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000005',
    '30000000-0000-4000-a000-000000000005',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'It shows that if I give myself the time to focus and think deeply, I can solve complex problems.',
    '2026-06-16 18:00:00+00',
    true,
    false
);

-- Day 6
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000006',
    '30000000-0000-4000-a000-000000000006',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'It just needs quiet, rest, and no screens. I need to go to sleep early tonight.',
    '2026-06-17 18:00:00+00',
    true,
    false
);

-- Day 7
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000007',
    '30000000-0000-4000-a000-000000000007',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I am ready to let go of the expectation that I must please everyone and say yes to every work request.',
    '2026-06-18 18:00:00+00',
    true,
    false
);

-- Day 8
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000008',
    '30000000-0000-4000-a000-000000000008',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I called my mom for a short talk, which helped ease the ache a bit and made me feel connected.',
    '2026-06-19 18:00:00+00',
    true,
    false
);

-- Day 9
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000009',
    '30000000-0000-4000-a000-000000000009',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'It feels voluntary and meaningful. It feeds my soul rather than just paying my bills.',
    '2026-06-20 18:00:00+00',
    true,
    false
);

-- Day 10
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000010',
    '30000000-0000-4000-a000-000000000010',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I took a break, drank some tea, and accepted that setbacks are part of the process. I rebuilt it quickly.',
    '2026-06-21 18:00:00+00',
    true,
    false
);

-- Day 11
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000011',
    '30000000-0000-4000-a000-000000000011',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I am well-prepared, and even if I make a mistake, it will not define my worth or my career.',
    '2026-06-22 18:00:00+00',
    true,
    false
);

-- Day 12
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000012',
    '30000000-0000-4000-a000-000000000012',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I learned that my anticipation of the event is always much worse than the actual reality.',
    '2026-06-23 18:00:00+00',
    true,
    false
);

-- Day 13
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000013',
    '30000000-0000-4000-a000-000000000013',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'It makes the work feel more human and collaborative. It reminds me that I am part of a team.',
    '2026-06-24 18:00:00+00',
    true,
    false
);

-- Day 14
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000014',
    '30000000-0000-4000-a000-000000000014',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I blocked off my calendar, closed my messaging apps, and put on some focus music. No distractions.',
    '2026-06-25 18:00:00+00',
    true,
    false
);

-- Day 15
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000015',
    '30000000-0000-4000-a000-000000000015',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I refused to take on an extra last-minute task on Thursday afternoon, saying I would handle it on Monday.',
    '2026-06-26 18:00:00+00',
    true,
    false
);

-- Day 16
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000016',
    '30000000-0000-4000-a000-000000000016',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'It gets me completely out of my head and into my body. The mental chatter stops entirely.',
    '2026-06-27 18:00:00+00',
    true,
    false
);

-- Day 17
INSERT INTO public.thread_responses (id, thread_id, user_id, response_text, created_at, used_for_scoring, vocab_processed)
VALUES (
    '40000000-0000-4000-a000-000000000017',
    '30000000-0000-4000-a000-000000000017',
    'f36d91ed-d484-4ecb-9078-1dfba35ff7c7',
    'I want to carry the intention of pacing myself, protecting my mornings, and not rushing.',
    '2026-06-28 18:00:00+00',
    true,
    false
);

COMMIT;
