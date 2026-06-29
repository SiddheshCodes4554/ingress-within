import './load-env';
import { supabase } from '../src/lib/db';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

async function restore() {
  console.log('=== PROGRAMMATIC SANDBOX RESTORE STARTING ===');

  // 1. Clean up
  console.log('Cleaning up existing vocabulary and entry tables...');
  
  const cleanExtractions = await supabase.from('vocab_extractions').delete().eq('user_id', userId);
  if (cleanExtractions.error) console.warn('Clean extractions warn:', cleanExtractions.error.message);
  
  const cleanWords = await supabase.from('vocab_words').delete().eq('user_id', userId);
  if (cleanWords.error) console.warn('Clean words warn:', cleanWords.error.message);
  
  const cleanClusters = await supabase.from('vocab_clusters').delete().eq('user_id', userId);
  if (cleanClusters.error) console.warn('Clean clusters warn:', cleanClusters.error.message);
  
  const cleanConcepts = await supabase.from('vocab_concepts').delete().eq('user_id', userId);
  if (cleanConcepts.error) console.warn('Clean concepts warn:', cleanConcepts.error.message);
  
  const cleanResponses = await supabase.from('thread_responses').delete().eq('user_id', userId);
  if (cleanResponses.error) console.warn('Clean responses warn:', cleanResponses.error.message);
  
  const cleanThreads = await supabase.from('threads').delete().eq('user_id', userId);
  if (cleanThreads.error) console.warn('Clean threads warn:', cleanThreads.error.message);
  
  const cleanReflections = await supabase.from('reflections').delete().eq('cycle_id', cycleId);
  if (cleanReflections.error) console.warn('Clean reflections warn:', cleanReflections.error.message);
  
  const cleanEntries = await supabase.from('entries').delete().eq('user_id', userId);
  if (cleanEntries.error) console.warn('Clean entries warn:', cleanEntries.error.message);

  // 2. Align cycle start date to June 12
  console.log('Aligning cycle start date...');
  const cycleUpdate = await supabase
    .from('cycles')
    .update({ start_date: '2026-06-12' })
    .eq('id', cycleId);
    
  if (cycleUpdate.error) {
    throw new Error(`Failed to update cycle: ${cycleUpdate.error.message}`);
  }

  // Data payloads for 17 days
  const data = [
    {
      day: 1,
      date: '2026-06-12',
      content: 'I woke up feeling heavy and sad today. There is so much pressure at the office about my career project, and I feel overwhelmed. I need to establish better boundaries and healthy habits to support my growth, but it feels so hard to start.',
      observation: 'You are experiencing significant work-related stress and feeling a lack of personal boundaries. Your focus on growth shows a desire for change, but it is currently overshadowed by a feeling of heaviness.',
      question: 'What is one small boundary you can set at the office tomorrow to give yourself some breathing room?',
      answer: 'I decided to turn off my work notifications after 6 PM today. It was difficult and I felt anxious, but I stuck to it.'
    },
    {
      day: 2,
      date: '2026-06-13',
      content: 'Today was a peaceful and relaxing Saturday. I went for a long walk in nature, and the fresh air made me feel grounded and calm. It was a nice relief from the stress of the past week. I feel quiet and clear.',
      observation: 'Nature walks and quiet reflection are helping you regulate your nervous system after a highly stressful week. You feel a sense of calm and relief.',
      question: 'How can you bring a small piece of this peaceful Saturday energy into your weekday routine?',
      answer: 'I want to try taking a 10-minute quiet walk during my lunch break at work.'
    },
    {
      day: 3,
      date: '2026-06-14',
      content: 'I met up with an old friend for coffee today. We talked for hours, laughed so much, and shared warm memories of our college days. I felt so happy and connected. It reminded me of who I am outside of my career.',
      observation: 'Reconnecting with long-time friends brings a strong sense of joy and belonging, reminding you of your identity beyond work.',
      question: 'What is it about your connection with this friend that makes you feel most like yourself?',
      answer: 'They knew me before I had all this career pressure. With them, I don\'t have to prove anything, I can just be.'
    },
    {
      day: 4,
      date: '2026-06-15',
      content: 'Back to work, and the Monday backlog is overwhelming. I feel rushed and stressed already. I have so many meetings and a tight deadline that makes me feel tense and tired. I feel depleted before the week has even fully started.',
      observation: 'The abrupt transition from a peaceful weekend to a demanding Monday backlog is triggering physical tension and mental exhaustion.',
      question: 'When the backlog starts to feel overwhelming, what is your default reaction, and how can you pause?',
      answer: 'My default is to rush and work faster, which makes me more anxious. I need to force myself to pause and take deep breaths.'
    },
    {
      day: 5,
      date: '2026-06-16',
      content: 'I solved a very difficult technical problem at work today! I spent hours focused on it, and when the solution finally worked, I felt so confident and motivated. I feel capable, clear, and proud of my progress.',
      observation: 'Overcoming a challenging task has boosted your confidence and re-ignited your sense of competence and career drive.',
      question: 'What does this breakthrough tell you about your ability to handle difficult challenges in the future?',
      answer: 'It shows that if I give myself the time to focus and think deeply, I can solve complex problems.'
    },
    {
      day: 6,
      date: '2026-06-17',
      content: 'I am feeling so tired and drained tonight. The exhaustion is physical as well as mental. I didn\'t have any energy left after work, so I just ate a quiet dinner and stayed in bed. I feel a bit empty and low.',
      observation: 'You are experiencing mid-week depletion, where physical fatigue is beginning to drag down your emotional state.',
      question: 'What does your body need most right now to recover from this level of exhaustion?',
      answer: 'It just needs quiet, rest, and no screens. I need to go to sleep early tonight.'
    },
    {
      day: 7,
      date: '2026-06-18',
      content: 'I had a quiet evening to reflect. I am learning to pay attention to my energy levels and accept that I cannot do everything. I feel hopeful about the changes I am making. Establishing boundaries is hard, but I am making progress.',
      observation: 'You are developing a mindful relationship with your energy levels and showing self-compassion for your progress.',
      question: 'As you learn to accept your limits, what is one thing you are ready to let go of?',
      answer: 'I am ready to let go of the expectation that I must please everyone and say yes to every work request.'
    },
    {
      day: 8,
      date: '2026-06-19',
      content: 'It is a rainy Friday night and I feel quite sad and lonely. I am missing my family and feeling very alone in this apartment. The silence in the room feels heavy, and I have a low-grade ache in my chest.',
      observation: 'A quiet weekend start combined with rainy weather has brought feelings of loneliness and a sense of isolation.',
      question: 'How can you show kindness to yourself when the silence of the room feels heavy?',
      answer: 'I called my mom for a short talk, which helped ease the ache a bit and made me feel connected.'
    },
    {
      day: 9,
      date: '2026-06-20',
      content: 'I completed a major personal project milestone today! I worked on it all morning and it turned out beautifully. I feel so joyful, inspired, and proud of my consistency. It is satisfying to create something of my own.',
      observation: 'Completing a personal creative milestone brings a deep sense of satisfaction, inspiration, and intrinsic pride.',
      question: 'How does the joy of working on your own project compare to your day job?',
      answer: 'It feels voluntary and meaningful. It feeds my soul rather than just paying my bills.'
    },
    {
      day: 10,
      date: '2026-06-21',
      content: 'I had a minor setback today and felt so frustrated and irritated. A tool I was using crashed and I lost an hour of work. I felt angry and tense. I need to restore my balance and not let small things ruin my day.',
      observation: 'A sudden loss of progress has triggered irritability, exposing a vulnerability to losing control over your time.',
      question: 'How can you gently let go of the lost hour without carrying the frustration forward?',
      answer: 'I took a break, drank some tea, and accepted that setbacks are part of the process. I rebuilt it quickly.'
    },
    {
      day: 11,
      date: '2026-06-22',
      content: 'I have a big presentation tomorrow and I am overthinking everything. My thoughts are racing, and I feel anxious and tense in my shoulders. I am trying to use deep breathing to stay grounded, but the dread is strong.',
      observation: 'Performance anxiety is triggering physical tension and cognitive overthinking before a significant work event.',
      question: 'If you could tell your anxious mind one comforting truth about tomorrow, what would it be?',
      answer: 'I am well-prepared, and even if I make a mistake, it will not define my worth or my career.'
    },
    {
      day: 12,
      date: '2026-06-23',
      content: 'The presentation went really well! The feedback was positive, and I feel a huge wave of relief. I feel grounded and relaxed now. The dread is gone, and I realize I was worrying far too much. I can finally breathe.',
      observation: 'The successful completion of your presentation has released your accumulated anxiety, leaving you with relief and relaxation.',
      question: 'What did you learn from this cycle of dread and relief that you can apply to the next big event?',
      answer: 'I learned that my anticipation of the event is always much worse than the actual reality.'
    },
    {
      day: 13,
      date: '2026-06-24',
      content: 'A colleague sent me a very kind message today thanking me for my help on their task. It was unexpected and made me feel so warm and supported. I feel grateful for the good relationships I have here.',
      observation: 'Receiving appreciation from a peer has fostered a sense of belonging and enhanced your career satisfaction.',
      question: 'How does it feel to know that your contribution has a positive impact on others?',
      answer: 'It makes the work feel more human and collaborative. It reminds me that I am part of a team.'
    },
    {
      day: 14,
      date: '2026-06-25',
      content: 'I spent the afternoon writing code and brainstorming a new design. I was in a complete flow state, where time just flew by. I felt creative, inspired, and excited. This is the kind of work that makes me feel alive.',
      observation: 'Achieving a state of flow while engaged in creative problem solving is bringing you a high level of mental stimulation.',
      question: 'What conditions in your environment today helped you enter that effortless flow state?',
      answer: 'I blocked off my calendar, closed my messaging apps, and put on some focus music. No distractions.'
    },
    {
      day: 15,
      date: '2026-06-26',
      content: 'It is Friday evening and I feel very content and relaxed. I had a busy week, but I managed my boundaries well. I am winding down now, watching a film, and looking forward to the weekend. I feel peaceful.',
      observation: 'Successful boundary management during a busy week has enabled you to transition into a relaxed and content weekend state.',
      question: 'What was the most successful boundary you maintained this week?',
      answer: 'I refused to take on an extra last-minute task on Thursday afternoon, saying I would handle it on Monday.'
    },
    {
      dayNum: 16,
      date: '2026-06-27',
      content: 'I played football with some colleagues today. It was exhausting but so much fun! The physical exercise made me feel energetic, playful, and alive. I feel a great release of physical tension and stress.',
      observation: 'Physical exercise and social play are acting as a powerful outlet for stress release, boosting your vitality.',
      question: 'How does physical movement change the quality of your thoughts?',
      answer: 'It gets me completely out of my head and into my body. The mental chatter stops entirely.'
    },
    {
      dayNum: 17,
      date: '2026-06-28',
      content: 'Today was a quiet Sunday of peaceful solitude. I read a book, prepared my meals, and organized my space for the next week. I feel calm, serene, and ready for whatever comes. I am in a good place.',
      observation: 'A Sunday of nesting and preparation is providing you with a sense of order, serenity, and mental readiness.',
      question: 'As you look ahead to the new week, what intention do you want to carry with you?',
      answer: 'I want to carry the intention of pacing myself, protecting my mornings, and not rushing.'
    }
  ];

  const aiProvider = process.env.AI_PROVIDER || 'groq';

  // Insert loop
  for (const item of data) {
    const day = item.dayNum || item.day!;
    const entryId = `10000000-0000-4000-a000-0000000000${day < 10 ? '0' + day : day}`;
    const reflId = `20000000-0000-4000-a000-0000000000${day < 10 ? '0' + day : day}`;
    const threadId = `30000000-0000-4000-a000-0000000000${day < 10 ? '0' + day : day}`;
    const respId = `40000000-0000-4000-a000-0000000000${day < 10 ? '0' + day : day}`;
    const timestamp = `${item.date}T09:00:00.000Z`;
    const respTimestamp = `${item.date}T18:00:00.000Z`;

    console.log(`Inserting Day ${day} (${item.date})...`);

    // A. Entry
    const entryRes = await supabase.from('entries').insert({
      id: entryId,
      user_id: userId,
      cycle_id: cycleId,
      cycle_day: day,
      content: item.content,
      word_count: item.content.split(/\s+/).length,
      entry_type: 'new_only',
      created_at: timestamp,
      written_at: timestamp,
      client_id: `50000000-0000-4000-a000-0000000000${day < 10 ? '0' + day : day}`,
      mode: 'fresh',
      vocab_processed: false
    });
    if (entryRes.error) {
      throw new Error(`Failed to insert entry for day ${day}: ${entryRes.error.message}`);
    }

    // B. Reflection
    const reflRes = await supabase.from('reflections').insert({
      id: reflId,
      entry_id: entryId,
      user_id: userId,
      cycle_id: cycleId,
      reflection_text: item.observation,
      closing_question: item.question,
      reflection_answer: item.answer,
      status: 'completed',
      provider: aiProvider,
      confidence: 'high',
      generated_at: timestamp,
      created_at: timestamp
    });
    if (reflRes.error) {
      throw new Error(`Failed to insert reflection for day ${day}: ${reflRes.error.message}`);
    }

    // C. Thread
    const threadRes = await supabase.from('threads').insert({
      id: threadId,
      user_id: userId,
      cycle_id: cycleId,
      reflection_id: reflId,
      closing_question: item.question,
      status: 'Answered',
      created_at: timestamp,
      answered_at: respTimestamp
    });
    if (threadRes.error) {
      throw new Error(`Failed to insert thread for day ${day}: ${threadRes.error.message}`);
    }

    // D. Thread Response
    const respRes = await supabase.from('thread_responses').insert({
      id: respId,
      thread_id: threadId,
      user_id: userId,
      response_text: item.answer,
      created_at: respTimestamp,
      used_for_scoring: true,
      vocab_processed: false
    });
    if (respRes.error) {
      throw new Error(`Failed to insert thread response for day ${day}: ${respRes.error.message}`);
    }
  }

  console.log('=== Programmatic Sandbox Restore Completed! ===');
}

restore().catch(console.error);
