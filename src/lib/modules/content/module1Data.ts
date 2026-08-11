import { ModuleContent } from '../../../types/moduleContent';

function opt(label: string, isTarget: boolean, explain: string) {
  return { label, isTarget, explain };
}

export const MODULE_1_CONTENT: ModuleContent = {
  moduleId: 'M1',
  slug: 'self-worth-self-talk',
  name: 'Self-Worth & Self-Talk',
  duration_weeks: 7,
  brief: {
    moduleName: "Self-Worth & Self-Talk",
    tier: "Core · ₹349 · Self domain",
    mechanisms: [
      {
        key: 'A',
        name: "Self-Criticism & Shame",
        short: "Self-Criticism",
        def: "Harsh self-talk and a felt sense of being fundamentally inadequate — not just believing you did one thing wrong, but believing the mistake proves something permanent about who you are.",
        need: "Self-worth",
        contrast: {
          who: "Aditya",
          text: "misses a promotion he wanted, feels disappointed for an evening, then asks his manager directly what skills would help him get there next time."
        },
        techniques: [
          {
            code: 'A1',
            approach: "CBT",
            format: 'A',
            name: "Thought Records & Socratic Questioning",
            source: "Aaron Beck, CBT",
            what: "Writing down a harsh self-critical thought exactly as it occurred, then testing it with a short series of questions — what's the actual evidence, is there another explanation, what would you say to a friend who thought this about themselves.",
            how: "Harsh self-talk usually goes completely unexamined — it fires and is believed instantly, the same way a fact would be. Slowing it down into a written record and questioning it the way you'd question any other claim breaks that automatic believability.",
            why: "This is the foundational technique for this mechanism — most of the others assume you can already catch and name a harsh thought, which is exactly what this one trains."
          },
          {
            code: 'A2',
            approach: "CFT",
            format: 'A',
            name: "Compassionate-Mind Training & ‘Compassionate Self’ Imagery",
            source: "Paul Gilbert, CFT",
            what: "A guided imagery practice where you deliberately imagine responding to yourself the way a wise, warm, non-judgemental figure would — not to excuse anything, but to access a genuinely different tone than the critical one.",
            how: "Self-criticism runs on the brain's threat system, the same one that responds to real danger. Compassionate-mind training deliberately activates a different system — the soothing/affiliative one — which isn't just ‘thinking nicer thoughts,’ it's a different mode entirely.",
            why: "Thought records target what you believe; this targets the tone you say it in, which turns out to matter almost as much as the content."
          },
          {
            code: 'A3',
            approach: "ACT",
            format: 'A',
            name: "Cognitive Defusion",
            source: "Steven Hayes, ACT",
            what: "Noticing a self-critical thought as just a thought passing through — mentally prefacing it ‘I'm having the thought that…’ instead of treating it as a literal, authoritative fact about who you are.",
            how: "Fusion — treating a thought as identical to reality — is what gives ‘I'm not good enough’ its force. Defusion opens a small gap between the thought and your identity, so it stops functioning as a verdict.",
            why: "Useful specifically in the moment a thought is loud and immediate — when there isn't time or space to sit down and write a full thought record."
          },
          {
            code: 'A4',
            approach: "Self-compassion",
            format: 'A',
            name: "Written Self-Compassion Letter",
            source: "Kristin Neff",
            what: "Writing yourself a letter about a specific painful moment, from the perspective of someone who loves you unconditionally and wants the best for you — not to let yourself off the hook, but to practice a voice you may never have used on yourself before.",
            how: "Most people have a well-rehearsed critical voice and almost no practice with a compassionate one. Writing it out, in full sentences, builds the same kind of fluency the critical voice already has.",
            why: "The other three techniques interrupt or question the critical voice; this one actively builds the alternative, so there's something to reach for afterward."
          },
          {
            code: 'A5',
            approach: "Emotion-Focused Therapy",
            format: 'C',
            name: "The Two-Chair Self-Criticism Dialogue",
            source: "Leslie Greenberg, EFT",
            what: "A structured dialogue, normally done with a therapist, where you physically switch between two chairs — one voicing the self-critical part, one voicing the part being criticised — to work through the conflict between them directly.",
            how: "This works by surfacing real emotional material live, with a trained therapist able to notice and respond to what comes up — including material that could be distressing without that support in the room.",
            why: "Genuinely useful, real psychoeducation worth knowing about — but not something to attempt alone from an app.",
            professionalNote: "A licensed therapist trained in Emotion-Focused Therapy or a Gestalt-informed approach can guide this properly. If self-criticism feels like it involves genuinely separate, conflicting ‘voices’ or parts of yourself — not just a harsh thought, but something that feels like an internal argument — that's specifically worth raising with them."
          }
        ]
      },
      {
        key: 'B',
        name: "Duty-Driven Guilt",
        short: "Guilt",
        def: "Feeling excessively responsible for other people's feelings or expectations, especially tied to family duty — carrying blame for outcomes that were never fully yours to control.",
        need: "Acceptance, Belonging",
        contrast: {
          who: "Divya",
          text: "tells her parents she can't come home for a cousin's small function because of a work deadline — she feels a pang of guilt, says so honestly, and doesn't change her plan or dwell on it for days afterward."
        },
        techniques: [
          {
            code: 'B1',
            approach: "CBT",
            format: 'A',
            name: "Downward-Arrow Technique",
            source: "Aaron Beck / David Burns",
            what: "Starting from a guilty thought and repeatedly asking ‘and if that were true, what would that mean?’ — following it down until you reach the real underlying belief the guilt is actually protecting.",
            how: "Guilt about one specific choice is often standing in for a much bigger belief underneath. You can't examine a belief you haven't found yet — this technique finds it.",
            why: "This is the diagnostic technique for this mechanism — it tells you which belief the rest of the week's tools are actually working on."
          },
          {
            code: 'B2',
            approach: "CBT",
            format: 'A',
            name: "Responsibility-Pie Exercise",
            source: "David Burns",
            what: "Drawing a pie chart of everyone and everything that actually contributed to an outcome you feel guilty about, and honestly sizing each slice — including your own, which is usually smaller than it felt.",
            how: "Guilt tends to claim 100% of the pie by default, without checking. Seeing the other real slices — other people's choices, circumstances, timing — makes the true size of your own responsibility visible.",
            why: "A concrete, visual corrective to the all-or-nothing sense that if something went wrong, it must be entirely your fault."
          },
          {
            code: 'B3',
            approach: "CFT",
            format: 'A',
            name: "Self-Compassion Break for Excessive Responsibility",
            source: "Paul Gilbert, CFT",
            what: "A short, structured pause — naming the guilt, recognising it's a shared human experience, then offering yourself the same warmth you'd offer a friend carrying too much responsibility.",
            how: "Guilt this size usually comes with self-punishment layered on top. The break interrupts that second layer, so the original guilt can be looked at clearly instead of buried under shame about feeling guilty at all.",
            why: "Guilt and self-criticism often travel together — this is the direct bridge back to Week 1's mechanism when they show up at the same time."
          },
          {
            code: 'B4',
            approach: "ACT",
            format: 'A',
            name: "Values Clarification Worksheet",
            source: "Kelly Wilson, ACT",
            what: "Separating your own genuine values from obligations you've simply inherited without ever examining them — what do you actually care about here, versus what were you handed as an assumption.",
            how: "Guilt often borrows its force from an unexamined ‘should’ rather than a value you'd actually choose. Naming the difference in writing makes it possible to act from the real one.",
            why: "The diagnostic step before willingness — you need to know which value is actually yours before you can act on it despite guilt."
          },
          {
            code: 'B5',
            approach: "ACT",
            format: 'A',
            name: "Willingness Exercises",
            source: "Steven Hayes, ACT",
            what: "Practising acting in line with a real value while the guilt is still present, on purpose — not waiting for the guilt to disappear first before acting.",
            how: "Guilt often gets treated as a stop sign — something to resolve before acting. Willingness work treats it as weather instead: real, sometimes uncomfortable, but not something that has to control the decision.",
            why: "This is the module's answer to ‘but what do I actually do differently’ — taught right after Values Clarification, in the same touch, since acting on a value while guilt is present is the natural next step once the value itself is clear."
          }
        ]
      },
      {
        key: 'C',
        name: "Low Confidence & Self-Doubt",
        short: "Self-Doubt",
        def: "Doubting your own judgement or ability so much that you hold back from speaking or acting — even in situations where you're genuinely competent enough to.",
        need: "Competence",
        contrast: {
          who: "Nikhil",
          text: "raises a half-formed idea in a meeting anyway, prefacing it with ‘I might be off here, but’ — and finds the room takes it seriously regardless of the hedge."
        },
        techniques: [
          {
            code: 'C1',
            approach: "CBT (Behavioural Experiments)",
            format: 'B',
            guardrail: true,
            name: "Behavioural Experiments for Feared Outcomes",
            source: "Christine Padesky & James Bennett-Levy, CBT",
            what: "Deliberately doing the thing you're avoiding — speaking up, sharing an opinion — specifically to test whether the outcome you're predicting (being dismissed, sounding foolish) actually happens.",
            how: "Low confidence survives on predictions that never get tested, because avoiding the situation avoids the test too. Running the experiment for real, once, gives disconfirming evidence no amount of reassurance can.",
            why: "Because this asks you to do the actual feared thing in real time, it ships with the same guardrails as any [B] technique — a choice of intensity, and a check-in afterward.",
            guardrailNote: "Self-selected intensity (a smaller or bigger version of speaking up), a built-in distress check-in right after, and an automatic escalation prompt if that check-in shows real distress."
          },
          {
            code: 'C2',
            approach: "Behavioural Experiments",
            format: 'B',
            guardrail: true,
            name: "Graded Exposure Hierarchy for Assertive Behaviour",
            source: "Joseph Wolpe",
            what: "Listing several assertive moments you avoid, ranked from easiest to hardest, and deliberately practising the easier ones first — building up to the harder ones over time instead of attempting the scariest version first.",
            how: "Avoidance shrinks your world in small steps, so confidence needs to rebuild the same way — a graded climb, not a single leap, far more sustainable and far less likely to backfire into avoiding entirely.",
            why: "Where C1 tests one specific prediction, this builds a repeatable ladder. Also ships with guardrails, since it also asks for real, live practice — this module has two [B] techniques in the same mechanism, not one.",
            guardrailNote: "Same three-part guardrail as C1: self-selected starting rung on the ladder, a check-in after attempting it, and a direct escalation trigger if the check-in shows real distress."
          },
          {
            code: 'C3',
            approach: "Positive Psychology",
            format: 'A',
            name: "Strengths-Spotting (VIA Character Strengths)",
            source: "Christopher Peterson & Martin Seligman",
            what: "Identifying your own genuine character strengths using a validated framework, then deliberately noticing when you're already using one — rather than only noticing gaps and doubts.",
            how: "Low confidence narrows attention toward evidence of inadequacy by default. This technique redirects attention toward real, existing evidence of competence that's simply gone unnoticed.",
            why: "A lower-intensity entry point than the two behavioural experiments above — useful on days when testing a real feared outcome isn't where someone's at yet."
          },
          {
            code: 'C4',
            approach: "CBT (self-monitoring)",
            format: 'A',
            name: "Confidence Log",
            source: "Beck-style self-monitoring",
            what: "A running, dated record of specific moments you handled competently — not vague praise, but concrete evidence: what happened, what you did, what the actual outcome was.",
            how: "Self-doubt has a short memory for competence and a long one for mistakes. A written log corrects that asymmetry with real, checkable entries instead of relying on memory alone.",
            why: "The most naturally ongoing of the four — built to be added to for as long as it's useful, not just during this module."
          }
        ]
      }
    ],
    scenarioSource: "Pan-India, English-medium context (per product decision) — CA/competitive-exam stress, family expectations around career and marriage, workplace meetings, family financial discussions. Language is English-medium throughout; content has not yet been reviewed for phrasing that reads as metro-specific.",
    escalation: {
      tier1: "Any statement connecting self-worth, guilt, or self-doubt to intent or a plan to end one's life or self-harm (“I don't deserve to be here”, “my family would be better off without me”).",
      tier2: "Persistent worthlessness or hopelessness framing (“I'm fundamentally broken”, “I'll always let everyone down”), or real signs of functional collapse — withdrawing entirely from work, family, or relationships, not just low mood."
    }
  },
  introScreens: [
    {
      eyebrow: "Before we begin",
      title: "What's stored, and who can see it",
      body: [
        "Your open-text answers in this module are saved to your journal.",
        "The only person who can ever see them is your assigned practitioner, if you've connected one — never other users, never shown anywhere public.",
        "If something you write suggests you might be in real danger, we show you support resources right away. That's the only thing that happens automatically — nothing gets sent anywhere without you knowing.",
        "Your answers stay saved and reviewable by you for 12 months from purchase, extended automatically if you renew.",
        "You can turn this module off in Settings at any time."
      ],
      cta: "I understand — continue",
      consent: true
    },
    {
      eyebrow: "What this is — and isn't",
      title: "Between-session support, not a replacement",
      body: [
        "This module is designed to sit between therapy sessions, or to be useful on its own — either way, it isn't therapy, and it doesn't diagnose you with anything.",
        "One technique in this module (you'll see it marked clearly when it comes up) is explained but not practiced here — it genuinely works better with a licensed therapist in the room, and we say so rather than pretending otherwise.",
        "If you're in crisis right now, don't wait for this module to help. Reach out immediately — the button below is always here if you need it."
      ],
      cta: "Continue",
      crisisButton: true
    },
    {
      eyebrow: "Why this module",
      title: "Why we're suggesting this one",
      body: [
        "You told us you're dealing with a harsh inner voice, guilt around family duty, or holding back because you doubt your own judgement — maybe all three, maybe one that's loudest right now.",
        "This module is built for exactly that — three specific patterns, each with its own real evidence-based tools, not one blended ‘be kinder to yourself’ module."
      ],
      cta: "Continue"
    },
    {
      eyebrow: "What to expect",
      title: "The next 7 weeks",
      body: [
        "Short term: a new touch on weekdays, a few minutes each, real scenarios close to your own week — your own words, not a quiz to pass or fail. Weekends bring a short summary, not new content.",
        "Long term, honestly: this won't make self-criticism, guilt, or self-doubt disappear. What it can realistically offer is 13 specific, evidence-based tools — plus one more explained clearly but best explored with a professional — and enough practice noticing each pattern that you reach for the right tool sooner. That's the actual promise here, not more than that."
      ],
      cta: "Continue"
    },
    {
      eyebrow: "Theory grounding",
      title: "The tools everything here is built on",
      body: [
        "Your taxonomy lists more than one therapy approach for each pattern — so instead of blending them into one vague idea, each approach gets its own tool and its own touch.",
        "You won't use any of these in Weeks 1–3 — those three weeks are just about being able to spot each pattern clearly, on its own, before any tool gets layered on top. Weeks 4–6 bring these back, one at a time, matched to exactly what you'll have just learned to recognise. One technique below is marked differently — it's explained here, but the app won't walk you through practicing it alone."
      ],
      theory: true,
      cta: "Start Week 1"
    }
  ],
  weeks: [
    // WEEK 1
    {
      num: 1,
      title: "Self-criticism: recognising the pattern",
      mechanism: 'A',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w1t1',
          title: "Recognition — an exam result",
          role: "Recognition #1",
          noDelayed: true,
          relate: {
            text: [
              "Quick note before we start: this week and the next two aren't about any of the tools from before — none of them show up yet. First, you need to be able to spot each pattern clearly. The tools come in Weeks 4–6, matched one at a time to what you'll have learned to recognise.",
              "This week's pattern has a name: <b>self-criticism and shame</b>. In simple terms: harsh self-talk that treats one mistake as proof you're fundamentally inadequate — not evidence you got one thing wrong, but a verdict on who you are.",
              "Here's what that looks like. <b class='who'>Meher</b> has been preparing for her CA final exams for eight months. She fails one paper — Financial Reporting — by two marks. That evening, she doesn't think ‘I need to revise this topic again.’ She thinks: ‘I'm just not smart enough for this. I'm never going to clear it.’"
            ]
          },
          think: {
            mode: 'tap',
            prompt: "Which of these actually explains what's happening? More than one will sound reasonable.",
            options: [
              opt("She's treating one failed paper as proof she's fundamentally inadequate, not evidence she needs to revise differently", true, "Right — two marks is a specific, fixable gap. ‘I'm never going to clear it’ isn't about the marks anymore — it's a verdict on her as a person."),
              opt("She's being realistic — CA exams are genuinely hard, and failing a paper is common", false, "True, and worth remembering — but notice the leap from ‘I failed this paper’ to ‘I'll never clear it’ isn't about the exam's real difficulty. It's about her general worth."),
              opt("She's avoiding facing what actually went wrong with her preparation", false, "This sounds like a fair critique, but notice it's actually another harsh judgement in disguise — calling herself avoidant is just a different way of attacking her character instead of looking at the two marks.")
            ],
            whyPrompt: "In a few words — what's the giveaway that it's the first one, not the other two?"
          },
          apply: {
            scenario: "Same pattern, a different person: Karthik didn't get shortlisted after three rounds of interviews for a job he wanted. He tells a friend, ‘I'm just not good enough for this industry.’",
            prompt: "Same thing happening here. In two or three sentences: what would you actually say to Karthik right now?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “Three rounds is real progress, and one rejection is one data point, not a verdict on the whole industry. This isn't about your ability anymore — it's about not trusting that one setback is just a setback.”"
          },
          remember: {
            prompt: "In a sentence or two: think of a real moment this applies to you — what specific, fixable thing got turned into a verdict about you as a person?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t2',
          title: "Recognition — a family moment",
          role: "Recognition #2",
          delayedRef: 'w1t1_apply',
          delayedPrompt: "Last touch, on Karthik, you wrote this:",
          relate: {
            text: [
              "Same Meher, two days later. At Sunday family lunch, an aunt asks brightly, ‘So how did the exam go?’ Meher mumbles something vague and changes the subject, thinking: ‘Everyone's going to find out I failed. I've embarrassed the whole family.’",
              "Notice what's carried over: the harsh voice was never really about the exam. It followed her from a quiet evening alone straight into a room full of people who love her."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually happening at the lunch table? Read all three carefully.",
            options: [
              opt("She's assuming one failed paper will be read by her family as a complete verdict on her, the way she's reading it herself", true, "Right — there's no evidence anyone at that table would react that way. She's projecting her own harshest interpretation onto them."),
              opt("Indian families genuinely do sometimes react strongly to exam results", false, "Sometimes true in general — but notice she hasn't actually told anyone yet. She's reacting to a reaction that hasn't happened, based on her own self-judgement, not theirs."),
              opt("She's just being private about something personal, which is a reasonable choice", false, "Being private is reasonable — but ‘I've embarrassed the whole family’ isn't privacy, it's shame. The tell is the specific thought, not the choice to change the subject.")
            ],
            whyPrompt: "In a few words — what makes this the same pattern as the evening before, just in a different room?"
          },
          apply: {
            scenario: "A different person, same shape of moment: after a broken engagement, Ritika avoids a family WhatsApp group for weeks, convinced everyone is talking about her behind her back, though no one has said a single word about it to her directly.",
            prompt: "In two or three sentences: what's actually going on for Ritika, and why might the silence feel louder than it really is?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “The silence isn't proof of judgement — it's just silence. Ritika's own harshest voice is filling the gap with a story nobody else has actually told.”"
          },
          remember: {
            prompt: "In a sentence or two: where does this show up for you — in front of family, at work, or both — and whose reaction are you actually bracing for?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t3',
          title: "What the harsh voice is really for",
          role: "Functional logic",
          delayedRef: 'w1t2_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Between the exam and the lunch table, there's a pattern worth naming honestly: the harsh voice feels like it's protecting Meher from something. If she attacks herself first — ‘I'm not smart enough’ — then nobody else's judgement can catch her off guard. She's already braced for the worst.",
              "What it actually costs is different from what it protects against: it doesn't make the next attempt go better. If anything, the shame makes it harder to sit back down and actually study — which is the one thing that would help."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the harsh voice actually trying to do? These are close — think it through.",
            options: [
              opt("Get the worst judgement in first, so no one else's reaction can be a surprise", true, "That's the real function — it's a kind of pre-emptive bracing, not an accurate assessment. It feels like protection, but it's protection from a surprise, not from the actual outcome."),
              opt("Accurately assess how much work is genuinely still needed", false, "If it were doing that, it would produce a study plan, not a verdict. ‘I'll never clear it’ doesn't point toward the next revision session — it points nowhere."),
              opt("Motivate her to try harder next time through tough love", false, "A tempting idea, but notice what actually happened after the harsh thought: she avoided the topic, not her books. Shame tends to freeze people, not motivate them.")
            ],
            whyPrompt: "In a few words — why doesn't getting the harsh judgement in first actually make the real outcome any better?"
          },
          apply: {
            scenario: "A coursemate, noticing Meher hasn't opened her revision material in three days, asks gently, ‘Are you okay?’ Meher almost snaps back, then catches herself and says, ‘I don't even know why I can't just start again.’",
            prompt: "That's usually the tell. In two or three sentences: think of a time your own harsh self-talk didn't actually help you do better — what did it cost you instead?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the pattern to notice is naming a real cost (avoidance, lost days, a frozen feeling) rather than assuming the harshness was doing useful work."
          },
          remember: {
            prompt: "In a sentence or two: what does that frozen feeling usually feel like for you, right before you catch yourself avoiding the thing you're being harsh about?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t4',
          title: "What a healthier inner voice sounds like",
          role: "Contrast / boundary case",
          delayedRef: 'w1t3_apply',
          delayedPrompt: "Last touch, you named this:",
          relate: {
            text: [
              "Here's what the same kind of setback looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Aditya</b> doesn't get the promotion he wanted. He's genuinely disappointed — he doesn't pretend otherwise, and he lets himself feel that for the evening. The next morning, he asks his manager directly: ‘What would actually help me get there next cycle?’",
              "This is the module's contrast case for this pattern: a real setback, real disappointment, and a response aimed at the next step — not a verdict on his worth as a professional."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Aditya's response different from Meher's? All three of these can look similar from outside.",
            options: [
              opt("His disappointment stayed about the outcome; hers turned into a verdict about who she is", true, "That's the real difference — not whether either of them felt bad, but what the bad feeling was actually about."),
              opt("He's simply a more resilient person than she is", false, "Tempting, but it doesn't hold up as an explanation — resilience isn't a fixed trait some people have and others don't. What's different here is structural: what the disappointment attached itself to."),
              opt("His setback was genuinely less serious than hers", false, "A missed promotion and a failed professional exam are both real, high-stakes setbacks — severity isn't what decided the outcome here.")
            ],
            whyPrompt: "In a few words — how would you know, in the moment, which one you're doing?"
          },
          apply: {
            scenario: "A colleague asks Aditya how he's doing with the news. He says: ‘Disappointed, honestly. But I asked what I actually need to work on, and I've got a real answer now instead of just guessing.’",
            prompt: "In two or three sentences: think of a real setback of your own — did the disappointment stay about the outcome, or did it turn into something about you? What told you which one it was?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful pattern is noticing whether the follow-up thought was a question about the next step, or a statement about your worth."
          },
          remember: {
            prompt: "In a sentence or two: name one question you could ask, like Aditya's, next time a real setback happens.",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t5',
          title: "What actually happened",
          role: "Reinforcing rep",
          delayedRef: 'w1t4_apply',
          delayedPrompt: "Last touch, your question was:",
          relate: {
            text: [
              "One more, and then a small piece of what actually happened to Meher.",
              "A few nights later, half out of desperation, she wrote the thought down exactly as it came: ‘I'm never going to clear this exam.’ Then, almost as an experiment, she asked herself: ‘What's the actual evidence for that?’ The honest answer was: two marks, on one paper, in one attempt. Nothing about ‘never.’",
              "That's not a coincidence, and it previews the first tool coming in Week 4: most harsh self-judgements have never actually been questioned, just believed instantly. Meher just accidentally questioned hers — and it didn't hold up."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does this moment actually show? All three sound like fair readings of the same event.",
            options: [
              opt("The harsh thought couldn't survive being asked a direct, honest question about the evidence", true, "Exactly — and that's repeatable on purpose, which is what Week 4's first tool turns into a real practice."),
              opt("She just happened to feel better that particular evening", false, "Feelings do shift on their own sometimes — but notice this wasn't just a mood lift, it was a specific question producing a specific, checkable answer. That's a different thing from just feeling better."),
              opt("The thought was true, she just decided not to believe it anymore", false, "If it were true, asking for the evidence wouldn't have changed anything — the fact that a direct question dissolved it is itself evidence the thought wasn't accurate to begin with.")
            ],
            whyPrompt: "In a few words — why might the same result happen again, on purpose, not just by accident?"
          },
          apply: {
            scenario: "A different domain: after a difficult client call, Farah tells herself, ‘I'm terrible at this job, they probably think I'm useless.’ No one has actually said anything like that to her.",
            prompt: "In two or three sentences: what question could Farah ask herself, using what you now know, and what might the honest answer actually be?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “What's the actual evidence anyone thinks that? Probably: one difficult call, no direct feedback at all — which is a specific event, not proof she's terrible at her job.”"
          },
          remember: {
            prompt: "In a sentence or two: name one harsh thought you have on repeat, and the honest question you could ask it.",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: the mechanism was self-criticism and shame — a harsh voice that turns one mistake into a verdict on who you are. You followed it through one person's week (an exam, then a family lunch), its functional logic, the module's contrast case, and a real outcome that previews Week 4's first tool. No new teaching in this summary. Next week: the same shape, for guilt."
    },
    // WEEK 2
    {
      num: 2,
      title: "Guilt: recognising the pattern",
      mechanism: 'B',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w2t1',
          title: "Recognition — a hard no",
          role: "Recognition #1",
          delayedRef: 'w1t5_apply',
          delayedPrompt: "Last week, you named this thought:",
          relate: {
            text: [
              "This week's pattern has a different name: <b>duty-driven guilt</b>. In simple terms: feeling excessively responsible for other people's feelings or expectations — especially family duty — even in moments where honouring your own needs isn't actually wrong.",
              "Here's what that looks like. <b class='who'>Ishita</b> is a software engineer in Bengaluru. Her parents have been asking her to move back to their hometown — there's a stable local job on offer, and they miss her. She decides, after real thought, to stay in Bengaluru for her career. She knows it's the right call for her. She also feels crushing guilt about it for days, running the conversation over and over in her head."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually going on here? More than one of these will sound believable.",
            options: [
              opt("She's carrying full responsibility for her parents' disappointment, as if choosing her own path makes her the one at fault", true, "Right — notice she called it the right decision for her, and still feels like she's done something wrong. That gap is the pattern."),
              opt("She's being genuinely inconsiderate of her parents' wishes", false, "If that were true, the guilt would be pointing at something real to fix — but she already thought it through and believes it's the right decision. The guilt isn't tracking an actual wrong."),
              opt("Moving away from family is culturally a big deal, so of course she'd feel guilty", false, "The cultural weight is real and worth naming — but notice the guilt here isn't proportionate concern, it's ‘crushing.’ A real cultural tension and an inherited sense that any boundary equals betrayal can look similar, but they're not the same thing.")
            ],
            whyPrompt: "In a few words — what's the giveaway that this is the guilt pattern, not just normal difficulty with a hard decision?"
          },
          apply: {
            scenario: "Same pattern, a different person: Rahul turns down his uncle's request to invest in a family business venture he genuinely doesn't believe in. He knows it's the right call financially. He still feels like he's let the family down, and avoids his uncle's calls for a week afterward.",
            prompt: "Same thing happening here. In two or three sentences: what's actually going on for Rahul?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “He's treating a reasonable financial boundary as if it were a betrayal of the family itself — the guilt has attached itself to the whole relationship, not just the one decision.”"
          },
          remember: {
            prompt: "In a sentence or two: name a real decision where you felt guilty even though you believed it was the right call — what did the guilt seem to be accusing you of?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t2',
          title: "Recognition — a smaller version, at work",
          role: "Recognition #2",
          delayedRef: 'w2t1_apply',
          delayedPrompt: "Last touch, on Rahul, you wrote this:",
          relate: {
            text: [
              "Same Ishita, a smaller stakes version. A cousin's small get-together falls on the same evening as a genuine work deadline. She chooses the deadline — a completely reasonable call — and spends the whole evening only half-focused on work, running a private apology in her head to relatives who don't even know she's missing it yet.",
              "Notice what's carried over from the bigger decision: the guilt was never really about moving cities. It follows her into any moment where her own priority and family expectation don't perfectly line up."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's the function of the private apology she's rehearsing? Read all three carefully.",
            options: [
              opt("She's pre-emptively managing guilt about a mild, reasonable choice no one has even reacted to yet", true, "Right — nobody has expressed disappointment. She's bracing for a reaction that not only hasn't happened, but may never happen."),
              opt("She genuinely values her family a lot, which is a good thing", false, "Valuing family is good, and not in question here — the tell isn't the value itself, it's that a mild, reasonable trade-off is generating a full apology rehearsal instead of a simple, one-line explanation."),
              opt("Missing a family event really is a bigger deal than she's admitting to herself", false, "Worth checking honestly — but notice the imbalance: an entire evening's mental energy spent on a small gathering she can easily explain missing later, over one work deadline.")
            ],
            whyPrompt: "In a few words — why is this the same pattern as the bigger decision, just at a smaller scale?"
          },
          apply: {
            scenario: "A different person, same shape of evening: Priyanka skips her regular Sunday call with her mother because she's genuinely exhausted after a hard week, and spends the entire next day feeling like a bad daughter, even though she calls back the following evening as usual.",
            prompt: "In two or three sentences: what is the guilt actually doing here, and why might one missed call be carrying so much weight?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “One missed, rescheduled call isn't evidence of being a bad daughter — the guilt is treating a small, human moment of exhaustion as if it were a pattern of neglect.”"
          },
          remember: {
            prompt: "In a sentence or two: what's your version of a small, reasonable moment that somehow costs you a disproportionate amount of guilt?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t3',
          title: "What the guilt is actually protecting",
          role: "Functional logic",
          delayedRef: 'w2t2_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Between the big decision and the small one, there's a pattern worth naming honestly: the guilt feels like it's proving something — that Ishita is still a good daughter, still loyal, still connected — precisely because she feels bad about disappointing anyone at all.",
              "What it actually costs is different from what it protects: it doesn't make her a better daughter, and it doesn't actually strengthen the relationship. It mostly just makes ordinary, reasonable choices exhausting to make."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the guilt actually trying to do? These are close — think it through.",
            options: [
              opt("Prove to herself that she's still loyal and connected, by feeling bad whenever a choice doesn't perfectly align with family wishes", true, "That's the real function — the guilt is a kind of loyalty test she's putting herself through, not an accurate signal that she's actually done something wrong."),
              opt("Genuinely repair any real harm done to the relationship", false, "If it were doing that, it would fade once she'd explained herself or reconnected — instead it often lingers regardless of what actually happens afterward, which suggests it isn't tracking real repair."),
              opt("Warn her about a relationship that's actually at risk of breaking down", false, "Worth checking honestly case by case — but in Ishita's situation, nothing about the actual relationship is at risk. Her parents still call, still love her. The guilt isn't responding to a real threat.")
            ],
            whyPrompt: "In a few words — why doesn't feeling guilty actually make someone a better daughter or son?"
          },
          apply: {
            scenario: "A friend, watching Ishita replay the same conversation with her parents for the fifth time, finally asks: ‘Did they actually say they were upset, or are you just assuming?’ Ishita pauses. ‘They didn't really say that. I just feel like they must be.’",
            prompt: "That's usually the tell. In two or three sentences: think of a time you assumed guilt was warranted without actually checking — what did you assume, and was it ever confirmed?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the pattern to notice is whether the guilt is responding to something someone actually said or did, or to an assumption that's never been checked against reality."
          },
          remember: {
            prompt: "In a sentence or two: what does that guilty feeling usually feel like for you, physically or in your head, right before you start rehearsing an apology no one's asked for?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t4',
          title: "What a healthy boundary looks like",
          role: "Contrast / boundary case",
          delayedRef: 'w2t3_apply',
          delayedPrompt: "Last touch, you named this:",
          relate: {
            text: [
              "Here's what the same kind of moment looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Divya</b> tells her parents she can't come home for a cousin's small function — a real work deadline is in the way. She feels a genuine pang of guilt saying it out loud. She says it honestly anyway, doesn't over-explain or over-apologise, and by the next day she's not still turning it over in her head.",
              "This is the module's contrast case for this pattern: a real boundary, a real feeling about it, and a response that doesn't spiral — not the absence of guilt, but guilt that doesn't take over."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Divya's guilt different from Ishita's? All three can look similar in the moment.",
            options: [
              opt("Hers was a proportionate, passing feeling; Ishita's became a days-long, disproportionate one", true, "That's the real difference — not whether guilt showed up at all, but its size and how long it stayed."),
              opt("Divya's family is simply less demanding than Ishita's", false, "Possibly true in some cases, but this isn't really about how any particular family behaves — it's about how the guilt gets processed once it shows up, which is something a person carries into any family."),
              opt("Divya doesn't care as much about her family as Ishita does", false, "There's no evidence for that at all — caring deeply and having a proportionate response to a small trade-off aren't opposites. In fact, the ability to say a clean no and move on often comes from a secure, not indifferent, relationship.")
            ],
            whyPrompt: "In a few words — how would you know, in the moment, which one you're doing?"
          },
          apply: {
            scenario: "A friend asks Divya how she handles saying no to her parents without it eating at her for days. She says: ‘I let myself feel bad for about five minutes, tell them honestly, and then I actually let it go — I don't rehearse it after.’",
            prompt: "In two or three sentences: think of a time you said a reasonable no to family — did the guilt stay proportionate, or take over? What told you which one it was?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful pattern is noticing whether the guilt faded on its own timeline, or kept regenerating itself through replay and rehearsal."
          },
          remember: {
            prompt: "In a sentence or two: name one thing you could do, like Divya, to let a reasonable guilt actually pass instead of feeding it.",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t5',
          title: "What actually happened",
          role: "Reinforcing rep",
          delayedRef: 'w2t4_apply',
          delayedPrompt: "Last touch, your idea was:",
          relate: {
            text: [
              "One more, and then a small piece of what actually happened to Ishita.",
              "A week later, she finally told her parents honestly — not defensively, just plainly — that Bengaluru was the right call for her right now. Her mother was quiet for a moment, then said, ‘We just miss you. We're not angry.’ The guilt Ishita had been carrying had been answering a question nobody was actually asking.",
              "That's not a coincidence, and it previews the tools coming in Week 5: most duty-driven guilt is carrying a belief that's never actually been checked against what the other person really thinks or needs. Ishita just accidentally checked hers."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does this conversation actually show? All three sound like fair readings of the same event.",
            options: [
              opt("The guilt had been responding to an assumption about her parents' feelings, not their actual feelings", true, "Exactly — and that gap between assumption and reality is checkable on purpose, which is what Week 5's tools turn into a real practice."),
              opt("Her parents just happened to react better than most families would", false, "Maybe, in some other family that would go differently — but the actual insight isn't about guaranteeing a good reaction, it's that Ishita had never actually asked or checked what they felt before assuming the worst."),
              opt("The guilt was pointless all along, since her parents weren't upset", false, "Not quite pointless — the guilt was based on a real, understandable fear (disappointing people she loves). The issue wasn't that the fear was silly, it was that it had never been tested against reality.")
            ],
            whyPrompt: "In a few words — why might checking an assumption matter more than just trying to feel less guilty?"
          },
          apply: {
            scenario: "A different domain: Arnav has been putting off telling his parents he wants to switch careers away from the family business, assuming it will devastate them, though he's never actually raised it directly.",
            prompt: "In two or three sentences: using what you now know, what would actually tell Arnav whether his guilt is tracking something real?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “An honest, direct conversation — not a guess. Right now the guilt is answering a question he's never actually asked out loud.”"
          },
          remember: {
            prompt: "In a sentence or two: name one guilty assumption you're currently carrying that you've never actually checked against what the other person thinks.",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: the mechanism was duty-driven guilt — feeling responsible for others' feelings in a way that's disproportionate to what's actually happened. You followed it through one person's week (a big decision, then a small one), its functional logic, the module's contrast case, and a real outcome that previews Week 5's tools. No new teaching in this summary. Next week: the same shape, for self-doubt."
    },
    // WEEK 3
    {
      num: 3,
      title: "Self-doubt: recognising the pattern",
      mechanism: 'C',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w3t1',
          title: "Recognition — a meeting",
          role: "Recognition #1",
          delayedRef: 'w2t5_apply',
          delayedPrompt: "Last week, you named this assumption:",
          relate: {
            text: [
              "This week's pattern has a third name: <b>low confidence and self-doubt</b>. In simple terms: doubting your own judgement or ability so much that you hold back from speaking or acting — even in situations where you're genuinely competent enough to.",
              "Here's what that looks like. <b class='who'>Sameer</b> works in product at a mid-size company. In a planning meeting, he has a genuinely good idea about how to fix a recurring bug — he's actually the person on the team who understands that part of the system best. He stays quiet, thinking: ‘Someone smarter than me has probably already thought of this, and if I say it wrong I'll sound stupid.’ A more senior colleague raises the same idea twenty minutes later and gets credit for it."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually going on here? More than one of these will sound believable.",
            options: [
              opt("He's doubting a judgement he's genuinely well-placed to make, based on a fear of how it might land rather than any real evidence he's wrong", true, "Right — he actually understands that part of the system best. The doubt isn't tracking his competence, it's tracking a fear of embarrassment."),
              opt("He's being appropriately humble in a room with more senior people", false, "Humility is fine, but notice the actual thought wasn't ‘let me phrase this carefully’ — it was ‘I'll sound stupid,’ which is fear, not humility, and it cost him the idea entirely rather than just softening how he said it."),
              opt("The idea probably wasn't as good as he thought it was", false, "The evidence points the other way — a senior colleague raised the same idea twenty minutes later and it was taken seriously. The idea was good. What held Sameer back wasn't the idea's quality.")
            ],
            whyPrompt: "In a few words — what's the giveaway that this is self-doubt, not genuine uncertainty about the idea?"
          },
          apply: {
            scenario: "Same pattern, a different person: Anjali notices a mistake in a budget spreadsheet during a family financial discussion — she's the one with an actual finance background — but says nothing, assuming her father, who built the spreadsheet, must have already checked it.",
            prompt: "Same thing happening here. In two or three sentences: what's actually going on for Anjali?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “She's got real, relevant expertise and is deferring anyway — not because there's evidence she's wrong, but because speaking up feels riskier than staying quiet, even when the cost of staying quiet is a real, uncorrected mistake.”"
          },
          remember: {
            prompt: "In a sentence or two: think of a real moment you stayed quiet on something you actually knew well — what were you actually afraid would happen if you spoke?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w3t2',
          title: "Recognition — a family discussion",
          role: "Recognition #2",
          delayedRef: 'w3t1_apply',
          delayedPrompt: "Last touch, on Anjali, you wrote this:",
          relate: {
            text: [
              "Same Sameer, a different room. At a family discussion about his parents' retirement investments, he has real, relevant financial knowledge from his day job — more than anyone else at the table, honestly. He lets his uncle make the decisions instead, telling himself, ‘It's not really my place to say anything here.’",
              "Notice what's carried over from the meeting room: the self-doubt was never really about that one meeting. It follows him into any room where he's actually qualified to have an opinion."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually happening at the family table? Read all three carefully.",
            options: [
              opt("He's treating genuine relevant expertise as something that doesn't count, purely because of his role in the family rather than his actual knowledge", true, "Right — ‘not my place’ is about family role, not about whether he's actually qualified. His knowledge doesn't stop being real just because he's the younger relative in the room."),
              opt("He's respecting a genuine cultural norm around deferring to elders on family decisions", false, "There's a real norm worth naming here — but notice this isn't really about respect for elders in general. It's the same specific doubt from the meeting room, showing up again, just wearing a different, culturally acceptable justification."),
              opt("His uncle genuinely knows more about investments than he does", false, "Possibly true in some cases — but the scenario specifically says Sameer has more relevant financial knowledge here. This option assumes the opposite of what's actually given.")
            ],
            whyPrompt: "In a few words — why is this the same pattern as the meeting, just wearing a family justification?"
          },
          apply: {
            scenario: "A different person, same shape of table: Meenakshi, a doctor, stays quiet when her mother-in-law suggests a home remedy that could actually interact badly with a medication her father-in-law is on — she assumes it's not her place to correct an elder on a health matter.",
            prompt: "In two or three sentences: what is Meenakshi's silence actually costing here, and why might her deference feel safer than speaking up?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “Her silence is costing real, checkable safety — not just a missed opportunity to be right. Deference feels safer in the moment, but the actual risk she's avoiding by staying quiet isn't smaller than the risk of speaking up here.”"
          },
          remember: {
            prompt: "In a sentence or two: where does this show up for you — at work, with family, or both — and what expertise of yours tends to go quiet in those rooms?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w3t3',
          title: "What the silence is actually protecting",
          role: "Functional logic",
          delayedRef: 'w3t2_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Between the meeting and the family table, there's a pattern worth naming honestly: staying quiet feels like it's protecting Sameer from something — specifically, from the risk of being visibly, publicly wrong.",
              "What it actually costs is different from what it protects: he doesn't get credit for good ideas, his actual expertise goes unused, and over time, staying quiet becomes the default even in rooms where he genuinely has something valuable to add."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the silence actually trying to prevent? These are close — think it through.",
            options: [
              opt("The risk of being visibly wrong in front of other people, even when the odds of being wrong are actually low", true, "That's the real target — a social risk, not an accuracy problem. The silence isn't protecting the quality of the decisions being made; it's protecting him from a moment of possible embarrassment."),
              opt("Making sure only genuinely correct ideas get raised in the room", false, "If that were the goal, silence would be a strange strategy — staying quiet doesn't filter for correctness, it just removes his input from consideration entirely, correct or not."),
              opt("Avoiding taking credit that should really go to someone more senior", false, "A generous-sounding idea, but it doesn't match what actually happened — the senior colleague got full credit for Sameer's own idea. Nothing about staying quiet redirected credit fairly; it just meant Sameer got none.")
            ],
            whyPrompt: "In a few words — why doesn't staying quiet actually protect the quality of the outcome?"
          },
          apply: {
            scenario: "A colleague, noticing Sameer has gone quiet in yet another meeting, messages him afterward: ‘You had a good point earlier — why didn't you say it?’ Sameer types out a few different explanations before settling on: ‘I don't know, it just felt safer not to.’",
            prompt: "That's usually the tell. In two or three sentences: think of a time you stayed quiet and it cost you something real — what was actually being protected, and was it worth the cost?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the pattern to notice is naming a real social risk (looking wrong, being contradicted) rather than assuming the silence was protecting the actual outcome."
          },
          remember: {
            prompt: "In a sentence or two: what does that ‘safer to stay quiet’ feeling usually feel like for you, right before you decide not to speak?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w3t4',
          title: "What healthy confidence sounds like",
          role: "Contrast / boundary case",
          delayedRef: 'w3t3_apply',
          delayedPrompt: "Last touch, you named this:",
          relate: {
            text: [
              "Here's what the same kind of moment looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Nikhil</b>, in a similar planning meeting, raises a half-formed idea anyway — he isn't fully sure it's right. He prefaces it honestly: ‘I might be off here, but what if we tried…’ The room takes it seriously regardless of the hedge, and it turns into a real discussion.",
              "This is the module's contrast case for this pattern: real uncertainty, spoken anyway, with an honest hedge instead of silence — not false confidence, just confidence that doesn't require certainty first."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Nikhil's approach different from Sameer's silence? All three can sound similar.",
            options: [
              opt("He spoke despite genuine uncertainty, using an honest hedge instead of waiting to feel sure", true, "That's the real difference — not confidence in the sense of certainty, but willingness to speak while still uncertain."),
              opt("His idea was simply better thought-through than Sameer's usually are", false, "Nothing in the scenario suggests that — he explicitly says he ‘might be off here.’ The idea being half-formed is exactly the point, not a mark against this comparison."),
              opt("The room he was in was just more receptive than Sameer's usually is", false, "Worth checking honestly case by case — but notice Nikhil didn't know in advance how the room would react. He hedged and spoke anyway, before finding out.")
            ],
            whyPrompt: "In a few words — how would you know, in the moment, which one you're doing?"
          },
          apply: {
            scenario: "A colleague asks Nikhil how he manages to speak up even when he's not sure. He says: ‘I stopped waiting to feel certain — I just say what I actually think, and flag that I might be wrong. Most of the time nobody minds the hedge.’",
            prompt: "In two or three sentences: think of a moment you could have used a hedge like Nikhil's instead of staying silent — what would you have actually said?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful pattern is a real, specific sentence you could have said, honestly flagging uncertainty rather than defaulting to silence."
          },
          remember: {
            prompt: "In a sentence or two: write one hedge phrase you could actually use next time — something honest, not falsely confident.",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w3t5',
          title: "What actually happened",
          role: "Reinforcing rep",
          delayedRef: 'w3t4_apply',
          delayedPrompt: "Last touch, your hedge phrase was:",
          relate: {
            text: [
              "One more, and then a small piece of what actually happened to Sameer.",
              "In the next planning meeting, almost on impulse, he said: ‘This might already be obvious, but I think the recurring bug is actually in the caching layer, not the API.’ It wasn't obvious. It was right. Nobody reacted like it was a foolish thing to say — they just moved on to fixing it.",
              "That's not a coincidence, and it previews the tools coming in Week 6: most of the fear behind staying quiet has never actually been tested against a real room. Sameer just accidentally tested his — and it held up fine."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does this moment actually show? All three sound like fair readings of the same event.",
            options: [
              opt("The feared reaction — sounding foolish — wasn't out there waiting for him the way he'd assumed", true, "Exactly — and that gap between the fear and the real reaction is testable on purpose, which is what Week 6's tools turn into a real practice."),
              opt("He just happened to get it right this particular time", false, "Maybe partly true of this one bug — but notice the actual insight isn't really about being right. Even a wrong guess, said with an honest hedge, likely wouldn't have gotten the reaction he feared. The room reacted fine to the act of speaking up, not just to being correct."),
              opt("This only worked because his confidence had already fully recovered by then", false, "He said it ‘almost on impulse’ — not from a place of full confidence. That's the actual insight: you don't need the fear to be gone first to speak anyway.")
            ],
            whyPrompt: "In a few words — why might the same result happen again, on purpose, not just by impulse?"
          },
          apply: {
            scenario: "A different domain: Kavita has a genuinely useful suggestion during a family conversation about wedding planning, but holds back, assuming her opinion won't carry as much weight as her older sister's.",
            prompt: "In two or three sentences: using what you now know, what's the smallest honest version of speaking up Kavita could try, and why might it matter more than waiting to feel sure it'll be well received?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “Something like ‘I might be off, but what if we tried…’ — said once, honestly, without waiting to know in advance how it'll land. That's the only way to actually find out.”"
          },
          remember: {
            prompt: "In a sentence or two: name one real room this week where you could try speaking up once, even without feeling fully sure first.",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: the mechanism was low confidence and self-doubt — holding back from speaking or acting despite being genuinely competent enough to. You followed it through one person's week (a meeting, then a family table), its functional logic, the module's contrast case, and a real outcome that previews Week 6's tools. No new teaching in this summary. Next week: the first of three technique weeks."
    },
    // WEEK 4
    {
      num: 4,
      title: "Self-criticism: four tools, and a plan",
      mechanism: 'A',
      kind: 'technique',
      retrievalCheck: {
        prompt1: "In your own words — what is self-criticism and shame, and what does the harsh voice actually protect against?",
        prompt2: "And what is duty-driven guilt — what does it feel like it's proving, and at what cost?",
        reveal: "Self-criticism and shame turns one mistake into a verdict on your worth as a person — it protects against the discomfort of being surprised by judgement, not against real errors. Duty-driven guilt is feeling excessively responsible for others' feelings, especially family duty — it feels like it's proving loyalty, but it doesn't actually repair anything or make the relationship stronger; it mostly just makes reasonable choices exhausting."
      },
      hasReferenceCard: true,
      touches: [
        {
          id: 'w4t1',
          title: "Thought Records & Socratic Questioning",
          role: "Technique A1 · CBT (Beck)",
          delayedRef: 'w3t5_apply',
          delayedPrompt: "Last week, your real room was:",
          relate: {
            text: [
              "This is the first of the four tools for self-criticism from your theory grounding screen — the one labelled CBT: <b>thought records and Socratic questioning</b>.",
              "Remember Meher, asking herself ‘what's the actual evidence for that?’ by accident, late one night? This tool takes that accident and makes it a deliberate practice: write the harsh thought down exactly as it occurred, then question it — what's the actual evidence, is there another explanation, what would you say to a friend who thought this about themselves."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might writing the thought down first, before questioning it, matter?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a harsh thought you've had about yourself recently — maybe the one you named back in Week 1.",
            prompt: "In two or three sentences: write the thought exactly as it occurred, then answer one question — what's the actual evidence for it?",
            placeholder: "The thought: ... / The evidence: ..."
          },
          reveal: {
            text: "There's no single right answer here — the tell is whether the evidence you found is as specific and honest as the thought itself, not a vague reassurance."
          },
          remember: {
            prompt: "In a sentence or two: did writing it down change how loud the thought felt, even slightly?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w4t2',
          title: "Compassionate-Mind Training",
          role: "Technique A2 · CFT (Gilbert)",
          delayedRef: 'w4t1_apply',
          delayedPrompt: "Last touch, your evidence was:",
          relate: {
            text: [
              "The second tool from that same list: <b>compassionate-mind training</b> — imagining how a wise, warm figure who genuinely wants the best for you would respond, instead of your usual critical voice.",
              "This isn't about excusing anything — Aditya from Week 1 still wanted the promotion, still felt disappointed. The compassionate voice and honesty about a setback aren't opposites."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might imagining a specific, warm figure work better than just telling yourself to ‘be nicer’?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of the same harsh thought from the last touch, or a different recent one.",
            prompt: "In two or three sentences: imagine someone who genuinely wants the best for you hearing this thought — what would they actually say back?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “They'd probably say the mistake is real and worth fixing — and that it doesn't make you someone who fails at everything. Both things can be true at once.”"
          },
          remember: {
            prompt: "In a sentence or two: how did that voice feel, compared to your usual one?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w4t3',
          title: "Cognitive Defusion",
          role: "Technique A3 · ACT (Hayes)",
          delayedRef: 'w4t2_apply',
          delayedPrompt: "Last touch, the warmer voice said:",
          relate: {
            text: [
              "The third tool, for the moment a thought is loud and there's no time to sit down and write: <b>cognitive defusion</b>.",
              "Instead of ‘I'm not good enough,’ try ‘I'm having the thought that I'm not good enough.’ Same thought, different relationship to it — it stops being an instant verdict and becomes something you're just noticing pass through."
            ]
          },
          think: {
            mode: 'open',
            prompt: "What's the actual difference between a thought as a fact and a thought as something you're just having?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a self-critical thought you've had recently, ideally one that shows up often.",
            prompt: "In two or three sentences: rewrite it in the defused form, and notice whether it changes anything.",
            placeholder: "I'm having the thought that..."
          },
          reveal: {
            text: "There's no single model answer — the tell is whether the rewrite actually creates a small gap, versus just restating the same thought with an extra phrase glued on front."
          },
          remember: {
            prompt: "In a sentence or two: is this a tool you could reach for in the moment, when there's no time to write a full thought record?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w4t4',
          title: "Written Self-Compassion Letter",
          role: "Technique A4 · Kristin Neff",
          delayedRef: 'w4t3_apply',
          delayedPrompt: "Last touch, your defused thought was:",
          relate: {
            text: [
              "The fourth and final tool for this pattern: a <b>written self-compassion letter</b> — a full letter, in your own hand, from the perspective of someone who loves you unconditionally.",
              "Most people have years of practice with a critical voice and almost none with a compassionate one. This tool builds that fluency the slow way — in full sentences, not just a quick reframe."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might writing a full letter build something a quick mental reframe can't?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of one specific painful moment — the exam, a rejection, anything real — that you've been harsh with yourself about.",
            prompt: "In two or three sentences: write the opening of that letter, as if from someone who loves you and wants the best for you.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the tell is whether it sounds like a real, specific voice speaking to a real, specific moment, not a generic ‘don't be so hard on yourself.’"
          },
          remember: {
            prompt: "In a sentence or two: was this harder or easier to write than you expected — and why?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w4t5',
          title: "How did it go, and a plan for next time",
          role: "Check-in + pre-commitment",
          delayedRef: 'w4t4_apply',
          delayedPrompt: "Last touch, your letter opened with:",
          relate: {
            text: [
              "No new idea this touch — two quick things before we move to guilt.",
              "First, a real check-in on the four tools from this week — the same four that started with Meher's exam back in Week 1. Then, a plan built now, while nothing is actually on fire."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Which of the four did you actually reach for this week, if any — and what happened when you did?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Pick whichever of the four tools felt most useful this week.",
            prompt: "In two or three sentences, write an if-then plan for using it: ‘If [specific cue], then I will [specific tool, specifically applied].’",
            placeholder: "If [specific cue], then I will..."
          },
          reveal: {
            text: "Something like: “If I catch myself thinking ‘I'm not good enough’ twice in one day, then I'll write it down as a thought record and actually check the evidence.”"
          },
          remember: {
            prompt: "In a sentence or two: say the plan back to yourself — does it actually sound doable on a hard day?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: four named tools for self-criticism — thought records, compassionate-mind training, defusion, and a self-compassion letter — a real check-in, and a plan built while calm. There's also a fifth technique for this mechanism, the Two-Chair Dialogue, shown as a reference card rather than a touch — open it from this week's list if you're curious what it is and why it's not something the app walks you through directly. No new teaching in this summary. Next week: the same shape, for guilt."
    },
    // WEEK 5
    {
      num: 5,
      title: "Guilt: four tools, and a plan",
      mechanism: 'B',
      kind: 'technique',
      retrievalCheck: null,
      touches: [
        {
          id: 'w5t1',
          title: "Downward-Arrow Technique",
          role: "Technique B1 · CBT (Beck/Burns)",
          delayedRef: 'w4t5_apply',
          delayedPrompt: "Last week, your if-then plan was:",
          relate: {
            text: [
              "The first of the tools for guilt from your theory grounding screen: the <b>downward-arrow technique</b>.",
              "Remember Ishita's guilt about staying in Bengaluru? This tool digs underneath a guilty thought by repeatedly asking ‘and if that were true, what would that mean?’ — until you reach the real belief underneath. For Ishita, it might go: ‘I chose my career over my parents’ → ‘that means I put myself first’ → ‘that means I'm not a good daughter.’ That last line is the real belief worth examining."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might the real belief underneath be more useful to examine than the surface guilty thought?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of something you feel guilty about right now — maybe the one you named back in Week 2.",
            prompt: "In two or three sentences: run the downward arrow — ‘and if that were true, what would that mean?’ — at least twice, and write where you land.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the tell is whether you landed somewhere more general and identity-level (‘I'm not a good daughter/son’) than where you started (‘I missed one event’)."
          },
          remember: {
            prompt: "In a sentence or two: does that underlying belief actually sound true when you look at it directly, outside the guilty moment?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w5t2',
          title: "Responsibility-Pie Exercise",
          role: "Technique B2 · CBT (Burns)",
          delayedRef: 'w5t1_apply',
          delayedPrompt: "Last touch, the belief underneath was:",
          relate: {
            text: [
              "The second tool: the <b>responsibility-pie exercise</b> — drawing a pie chart of everyone and everything that actually contributed to an outcome you feel guilty about, sizing each slice honestly, including your own.",
              "Guilt tends to claim the whole pie by default. Seeing the other real slices — other people's choices, circumstances, timing — makes the true size of your responsibility visible."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why does guilt tend to claim 100% of the pie without actually checking?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a situation you feel guilty about, where more than one person or factor was actually involved.",
            prompt: "In two or three sentences: list the real slices of the pie — everyone and everything involved — and honestly size your own.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the tell is whether your own slice, once honestly sized next to the others, is smaller than the 100% guilt was claiming."
          },
          remember: {
            prompt: "In a sentence or two: which other slice surprised you most, once you actually named it?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w5t3',
          title: "Self-Compassion Break for Excessive Responsibility",
          role: "Technique B3 · CFT (Gilbert)",
          delayedRef: 'w5t2_apply',
          delayedPrompt: "Last touch, the slice that surprised you was:",
          relate: {
            text: [
              "The third tool: a <b>self-compassion break</b>, specifically for carrying too much responsibility — naming the guilt, recognising it's a shared human experience, then offering yourself the same warmth you'd offer a friend in the same spot.",
              "Guilt this size often comes with a second layer of self-punishment stacked on top. This break targets that second layer, so the original guilt can actually be looked at clearly."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might removing the self-punishment layer make the original guilt easier to actually examine?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Return to the same guilt from the last two touches.",
            prompt: "In two or three sentences: name the guilt out loud, then write what you'd say to a close friend carrying this exact same weight.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “Carrying this much guilt over a reasonable choice is a very human thing to do — it doesn't mean the choice was wrong, it means the guilt hasn't caught up to the decision yet.”"
          },
          remember: {
            prompt: "In a sentence or two: was it easier to write that for a friend than to actually believe it about yourself?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w5t4',
          title: "Values Clarification & Willingness",
          role: "Technique B4 & B5 · ACT (Wilson & Hayes)",
          delayedRef: 'w5t3_apply',
          delayedPrompt: "Last touch, you wrote this for a friend:",
          relate: {
            text: [
              "The fourth and fifth tools, taught together in one touch on purpose since they're natural companions in real ACT practice: <b>values clarification</b>, then <b>willingness</b>.",
              "First, separate your own genuine values from obligations you've simply inherited without ever examining them. Then practise willingness — acting in line with your real values even while the guilt is still present, not waiting for it to disappear first. Guilt is treated as weather here, not a stop sign."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might treating guilt as weather, rather than a stop sign, actually help you act?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a choice you've been putting off because of guilt — something you'd genuinely value doing, if the guilt weren't in the way.",
            prompt: "In two or three sentences: name the value underneath it, and one small action you could take this week despite the guilt still being present.",
            placeholder: "The value: ... / The action, guilt or no guilt: ..."
          },
          reveal: {
            text: "There's no single model answer here — the tell is whether the action is something you could genuinely do while still feeling guilty, not something that requires the guilt to be gone first."
          },
          remember: {
            prompt: "In a sentence or two: does that action still feel possible, even imagining the guilt showing up while you do it?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w5t5',
          title: "How did it go, and a plan for next time",
          role: "Check-in + pre-commitment",
          delayedRef: 'w5t4_apply',
          delayedPrompt: "Last touch, your action was:",
          relate: {
            text: [
              "No new idea this touch — two quick things before Week 6.",
              "First, a real check-in on this week's four tools — the same four that started with Ishita's decision back in Week 2. Then a plan built now, before the guilt actually shows up again."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Which of the four did you actually try this week, and what happened?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Pick whichever of the four tools felt most useful this week.",
            prompt: "In two or three sentences: write an if-then plan for using it: ‘If [specific cue], then I will [specific tool, specifically applied].’",
            placeholder: "If [specific cue], then I will..."
          },
          reveal: {
            text: "Something like: “If I catch myself rehearsing an apology no one's asked for, then I'll draw the responsibility pie before saying anything out loud.”"
          },
          remember: {
            prompt: "In a sentence or two: say the plan back to yourself — does it actually sound doable on a real, guilt-heavy day?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: four named tools for guilt — the downward-arrow technique, the responsibility pie, a self-compassion break, and values clarification paired with willingness — a real check-in, and a plan built while calm. (The taxonomy lists five separate techniques for this pattern — all five are here, just with the last two, Values Clarification and Willingness, sharing one touch since they're natural companions in real ACT practice.) No new teaching in this summary. Next week: the same shape, for self-doubt — including two guided techniques this time, not one."
    },
    // WEEK 6
    {
      num: 6,
      title: "Self-doubt: four tools, and a plan",
      mechanism: 'C',
      kind: 'technique',
      retrievalCheck: null,
      touches: [
        {
          id: 'w6t1',
          title: "Behavioural Experiments for Feared Outcomes",
          role: "Technique C1 · CBT (Padesky & Bennett-Levy) — guided",
          guardrail: true,
          distressPrompt: "You've just committed to a real version of this. Before we continue — how are you feeling right now?",
          delayedRef: 'w5t5_apply',
          delayedPrompt: "Last week, your if-then plan was:",
          relate: {
            text: [
              "The first tool for self-doubt, and this one's different from the others this week, on purpose: a <b>behavioural experiment</b> for a feared outcome.",
              "This is exactly what happened to Sameer by accident in that planning meeting — speaking up despite the fear, and finding out the feared reaction wasn't actually there. This tool turns that accident into something you choose to do, on purpose, with a real prediction attached beforehand.",
              "You pick one real moment where you'd normally hold back, and deliberately speak up or act instead — to test whether the outcome you're predicting (being dismissed, sounding foolish) actually happens.",
              "Because this asks you to do the real, feared thing in the moment, not just reflect on it afterward, this touch checks in with you directly partway through — not just by reading what you type."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might actually testing the fear once tell you something reassurance alone can't?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Pick one real moment coming up this week where you'd normally hold back — a meeting, a family conversation, anything real.",
            intensityPrompt: "First, choose how big a version of this you want to try:",
            intensityOptions: [
              "Smaller version — a fairly low-stakes room or moment",
              "Bigger version — something that actually worries me a bit"
            ],
            prompt: "In two or three sentences: name the moment, what you'll actually say or do, and the specific reaction you're predicting.",
            placeholder: "Moment: ... / What I'll actually do: ... / What I predict will happen: ..."
          },
          reveal: {
            text: "Something like: “If I speak up, I predict [specific bad outcome] — and I'll actually check whether that happens, at whichever intensity I chose. Sameer's version of this, by accident, was one honest sentence about a bug — and the room just moved on to fixing it.”"
          },
          remember: {
            prompt: "In a sentence or two: what did choosing the intensity feel like, and why did you pick that one over the other?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w6t2',
          title: "Graded Exposure Hierarchy for Assertive Behaviour",
          role: "Technique C2 · Wolpe — guided",
          guardrail: true,
          distressPrompt: "You've just committed to a real rung on your ladder. Before we continue — how are you feeling right now?",
          delayedRef: 'w6t1_apply',
          delayedPrompt: "Last touch, your prediction was:",
          relate: {
            text: [
              "The second tool, and this one is also guided — this pattern has two guided techniques, not one. A <b>graded exposure hierarchy</b> for assertive behaviour.",
              "Where the last touch tested one specific prediction, this one builds a repeatable ladder: list several assertive moments you avoid, ranked from easiest to hardest, and deliberately practise the easier ones first — building toward the harder ones over time, instead of attempting the scariest version first.",
              "Because this also asks for real, live practice — even starting at the easy end of the ladder — it carries the same check-in as the last touch."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might starting at the easiest rung of the ladder actually build more lasting confidence than attempting the hardest one first?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a few different assertive moments you currently avoid — could be at work, with family, or both.",
            intensityPrompt: "First, choose where to start:",
            intensityOptions: [
              "Start at the easiest rung on my ladder",
              "Start a bit higher — something moderately hard for me"
            ],
            prompt: "In two or three sentences: list at least two moments from easiest to hardest, and name the one you'll actually practise this week.",
            placeholder: "Easier: ... / Harder: ... / What I'll try this week: ..."
          },
          reveal: {
            text: "Something like: “Easier: speaking up in a small team meeting. Harder: raising a disagreement with a senior relative directly. This week, I'll try the easier one — the ladder only works if each step is genuinely manageable.”"
          },
          remember: {
            prompt: "In a sentence or two: does the rung you picked actually feel manageable, or did you pick something harder than you're ready for?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w6t3',
          title: "Strengths-Spotting (VIA Character Strengths)",
          role: "Technique C3 · Positive Psychology (Peterson & Seligman)",
          delayedRef: 'w6t2_apply',
          delayedPrompt: "Last touch, your rung was:",
          relate: {
            text: [
              "The third tool, a lower-intensity one for days when testing a real feared outcome isn't where you're at: <b>strengths-spotting</b>, using a validated framework of character strengths.",
              "Low confidence narrows attention toward gaps and doubts by default. This tool doesn't argue with that directly — it deliberately redirects attention toward real, existing evidence of competence that's simply gone unnoticed."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might deliberately noticing existing strengths work differently from just trying to ‘think positive’?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of a moment this week, even a small one, where you used a genuine strength — curiosity, fairness, judgement, honesty, anything real.",
            prompt: "In two or three sentences: name the strength and the specific moment you actually used it.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the tell is whether the moment is specific and real, not a vague ‘I'm generally a hard worker’ statement."
          },
          remember: {
            prompt: "In a sentence or two: was this harder to notice than a mistake would have been? What does that tell you about where your attention usually goes?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w6t4',
          title: "Confidence Log",
          role: "Technique C4 · Beck-style self-monitoring",
          delayedRef: 'w6t3_apply',
          delayedPrompt: "Last touch, your strength was:",
          relate: {
            text: [
              "The fourth and final tool, and the most naturally ongoing one: a <b>confidence log</b> — a running, dated record of specific moments you handled competently.",
              "Self-doubt has a short memory for competence and a long one for mistakes. A written log corrects that asymmetry with real, checkable entries — not vague praise, but what actually happened."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might a written, dated log correct self-doubt's memory better than just trying to remember your wins?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Think of one specific, real moment this month where you handled something competently — could be the strengths moment from the last touch, or a different one.",
            prompt: "In two or three sentences: write your first confidence log entry — what happened, what you did, what the actual outcome was.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the tell is whether it's specific enough that you could point to it later as real evidence, not just a feeling of having done fine."
          },
          remember: {
            prompt: "In a sentence or two: could you actually keep this log going after the module ends? What would make that realistic for you?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w6t5',
          title: "How did it go, and a plan for next time",
          role: "Check-in + pre-commitment",
          delayedRef: 'w6t4_apply',
          delayedPrompt: "Last touch, your log entry was:",
          relate: {
            text: [
              "No new idea this touch — two quick things before Week 7.",
              "First, a real check-in on this week's four tools — the same four that started with Sameer's meeting back in Week 3. Then a plan built now, before the next moment of self-doubt actually arrives."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Which of the four did you actually try this week, and what happened?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Pick whichever of the four tools felt most useful this week.",
            prompt: "In two or three sentences: write an if-then plan for using it: ‘If [specific cue], then I will [specific tool, specifically applied].’",
            placeholder: "If [specific cue], then I will..."
          },
          reveal: {
            text: "Something like: “If I catch myself staying quiet in a meeting out of fear of sounding foolish, then I'll say it anyway with an honest hedge — ‘I might be off here, but…’”"
          },
          remember: {
            prompt: "In a sentence or two: say the plan back to yourself — does it actually sound doable in a real room?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: four named tools for self-doubt — two guided behavioural experiments, strengths-spotting, and a confidence log — a real check-in, and a plan built while calm. No new teaching in this summary. Next week: all three patterns together, and the one unscaffolded test."
    },
    // WEEK 7
    {
      num: 7,
      title: "Integration & review",
      mechanism: 'both',
      kind: 'integration',
      retrievalCheck: {
        prompt1: "Name one tool for self-criticism and, in your own words, what it actually does.",
        prompt2: "Name one tool for guilt or self-doubt and, in your own words, what it actually does.",
        reveal: "Any of the thirteen count here — what matters is whether the description is functional (what the tool actually does and why) rather than just the name repeated back."
      },
      touches: [
        {
          id: 'w7t1',
          title: "When two patterns show up together",
          role: "Integration",
          delayedRef: 'w6t5_apply',
          delayedPrompt: "Last week, your if-then plan was:",
          relate: {
            text: [
              "Rohan has been putting off telling his manager he wants to move to a different team — partly out of self-doubt (‘what if they think I can't handle bigger things’), and partly out of guilt toward his current team (‘they need me, it would be selfish to leave now’)."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Both self-doubt and guilt showed up here. Which one do you think is actually driving the avoidance more, and why?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Same situation — Rohan and the team move.",
            prompt: "In two or three sentences: what would you actually recommend Rohan try first, and why that one, out of all thirteen tools you now know?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's a real case either way. Some would start with a behavioural experiment — actually raising it and testing what happens — since nothing changes until he speaks. Others would say the guilt needs a responsibility-pie check first, since it might be inflating his sense of how much the team truly depends on him specifically. Either is defensible — what matters is he picks one and actually runs it."
          },
          remember: {
            prompt: "In a sentence or two: which would you have picked for yourself, in his position?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w7t2',
          title: "Designing a full response",
          role: "Integration",
          delayedRef: 'w7t1_apply',
          delayedPrompt: "Last touch, you said you'd recommend:",
          relate: {
            text: [
              "Neha has been harshly criticising herself all week for a mistake in a client presentation — and underneath the self-criticism, she's also avoided telling her manager about it directly, assuming (without checking) that he'll be furious."
            ]
          },
          think: {
            mode: 'open',
            prompt: "What's driving what, here — in your own words?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Same situation — Neha's mistake.",
            prompt: "In two or three sentences: design a full plan for Neha — combine tools across patterns if that's what it takes.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “A thought record handles the self-criticism first — checking whether ‘I'm careless’ actually holds up against one mistake. Then a small behavioural experiment covers the avoided conversation: telling her manager directly, and actually finding out his real reaction instead of assuming it.”"
          },
          remember: {
            prompt: "In a sentence or two: which of the three patterns do you reach for tools on first, generally — and why do you think that's your instinct?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w7t3',
          title: "When all three show up at once",
          role: "Integration",
          delayedRef: 'w7t2_apply',
          delayedPrompt: "Last touch, your plan for Neha was:",
          relate: {
            text: [
              "Riya has been asked to lead a small project at work. She doubts she's qualified (self-doubt), feels guilty that a more senior colleague wanted the role (guilt), and has spent the week silently calling herself ‘not ready for this’ every time she opens the project plan (self-criticism)."
            ]
          },
          think: {
            mode: 'open',
            prompt: "All three patterns showed up here. In your own words, how do they seem to be feeding each other?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Same situation — Riya's project.",
            prompt: "In two or three sentences: what's the one move that would actually help the most right now, and why that one over the others?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single right answer — the pattern worth noticing is that all three can genuinely reinforce each other (self-doubt feeds self-criticism, which feeds guilt about ‘taking’ the role) without one single tool being able to untangle all three at once."
          },
          remember: {
            prompt: "In a sentence or two: is there a real situation in your own life right now where more than one of these three shows up together?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w7t4',
          title: "One more, mixed",
          role: "Integration",
          delayedRef: 'w7t3_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Vikram has been avoiding a conversation with his parents about not wanting an arranged introduction they've set up — he's doubted whether he has the right to say no (self-doubt about his own judgement), feels guilty about disappointing them (guilt), and has been telling himself ‘a good son wouldn't even hesitate to consider it’ (self-criticism) all in the same week."
            ]
          },
          think: {
            mode: 'open',
            prompt: "If you had to guess which pattern is actually the loudest here, which would you guess, and what would you look for to check?",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "Same situation — Vikram's conversation.",
            prompt: "In two or three sentences: what's the one move that unblocks the most here, if there is one — and if there isn't, say so.",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Often the honest answer is that no single tool resolves all three cleanly — values clarification might tell him what he actually wants, a downward-arrow might surface the belief under the guilt, and the conversation itself is still the thing that actually has to happen regardless."
          },
          remember: {
            prompt: "In a sentence or two: what's your instinct, generally — untangle the feelings first, or just have the hard conversation and let the feelings sort themselves out after?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w7t5',
          title: "Your own situation — nothing pre-walked",
          role: "Transfer test",
          transferTest: true,
          delayedRef: 'w7t4_apply',
          delayedPrompt: "Last touch, your instinct was:",
          relate: {
            text: [
              "This is the one part of the module built with no scaffolding at all.",
              "You've followed Meher through a failed exam, Ishita through a hard no to her parents, and Sameer through a quiet meeting — and hopefully noticed the shape of one or more of these patterns in your own week too, more than once.",
              "Now it's just yours. You've got a real situation right now — self-criticism, guilt, self-doubt, maybe more than one at once. Don't simplify it for us."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Describe it in your own words — what's actually going on, as specifically as you can.",
            placeholder: "Your answer..."
          },
          apply: {
            scenario: "With nothing pre-walked this time.",
            prompt: "In two or three sentences: what's your actual next move, and why that one — which of the thirteen tools, and why not one of the others?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single right answer here — this was the one part of the module deliberately built to have no signalled answer. What matters is whether your reasoning traces back to the tools from your theory grounding screen and Weeks 4–6, not whether it matches anyone else's."
          },
          remember: {
            prompt: "In a sentence or two — what do you actually want to remember from this module, in your own words, not the module's?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: null
    }
  ],
  reinforcementBank: [
    {
      code: 'A1',
      rep: 1,
      type: 'reflection',
      scenario: "You've been replaying a comment you made in a meeting two days ago, telling yourself it made you look incompetent, though no one has said anything about it since.",
      prompt: "In two or three sentences: write the thought exactly as it occurs to you, then ask — what's the actual evidence for it?",
      reveal: "The evidence column is usually thin — a feeling, not a fact. If it's genuinely thin, that itself is worth noticing."
    },
    {
      code: 'A1',
      rep: 2,
      type: 'reflection',
      scenario: "You made a small error in a family WhatsApp group — sent a message meant for someone else — and have been telling yourself you're careless and embarrassing, hours after everyone else has moved on.",
      prompt: "In two or three sentences: write the thought, then test it — is there another explanation besides ‘I'm careless’?",
      reveal: "Something like: “One mis-sent message in years of messaging isn't carelessness — it's a normal, human slip that everyone in that group has also made at some point.”"
    },
    {
      code: 'A4',
      rep: 1,
      type: 'reflection',
      scenario: "You've been harsh with yourself all week about a decision that didn't work out the way you hoped — the kind of thing you'd never actually say out loud to a friend in the same position.",
      prompt: "In two or three sentences: write the opening lines of a compassionate letter to yourself about it, from someone who loves you.",
      reveal: "There's no single model answer — the tell is whether it names the real disappointment honestly while still sounding warm, not dismissive of what actually happened."
    },
    {
      code: 'A4',
      rep: 2,
      type: 'reflection',
      scenario: "A friend confided in you recently about a mistake they made and felt terrible about — you were warm and reassuring without a second thought. You've been harder on yourself about a similar-sized mistake this week.",
      prompt: "In two or three sentences: write what you'd say to yourself, using the exact tone you used with your friend.",
      reveal: "Notice if the tone shifts the moment the letter is about you instead of them — that gap is usually exactly where the practice is needed most."
    },
    {
      code: 'B1',
      rep: 1,
      type: 'reflection',
      scenario: "You feel guilty for spending your Diwali bonus on something for yourself instead of contributing more to a family expense — even though you did contribute a fair, agreed-upon amount.",
      prompt: "In two or three sentences: run the downward arrow — ‘and if that were true, what would that mean?’ — at least twice.",
      reveal: "There's no single model answer — the tell is whether you land somewhere more general and identity-level than where you started."
    },
    {
      code: 'B1',
      rep: 2,
      type: 'reflection',
      scenario: "You feel guilty for not visiting an ailing relative as often as a cousin does, even though you live much further away and have a demanding job.",
      prompt: "In two or three sentences: run the downward arrow on this guilt and see where it actually leads.",
      reveal: "Often it leads somewhere like ‘if I don't visit as much, I'm not as devoted a family member’ — a belief worth examining directly, separate from the practical constraint of distance."
    },
    {
      code: 'B2',
      rep: 1,
      type: 'reflection',
      scenario: "A family event didn't go as smoothly as your relatives hoped, and you've quietly been carrying most of the blame for it, even though several other people and circumstances were clearly involved.",
      prompt: "In two or three sentences: draw the responsibility pie — name the other real slices, and size your own honestly.",
      reveal: "There's no single model answer — the tell is whether your own slice, once honestly sized, is smaller than the guilt was claiming."
    },
    {
      code: 'B2',
      rep: 2,
      type: 'reflection',
      scenario: "A group trip with friends had a scheduling conflict that caused some frustration, and you've been assuming it was mostly your fault for suggesting the dates in the first place.",
      prompt: "In two or three sentences: draw the pie for this situation and size each real contributor.",
      reveal: "Something like: “Suggesting dates that later didn't work for everyone isn't the same as causing the conflict — the pie usually has several genuine slices once actually drawn out.”"
    }
  ],
  toolsData: {
    compassionate_imagery: {
      code: 'A2',
      title: 'Compassionate-Mind Practice',
      mechShort: 'Self-Criticism',
      kind: 'log_single',
      intro: "A quick imagery practice — picture a wise, warm figure who genuinely wants the best for you, and imagine what they'd say right now. Log it each time you actually try it, whatever the moment.",
      logLabel: 'What did that figure say, and did it land?',
      firstPlaceholder: 'e.g. They said the mistake was real but fixable, and it actually softened the panic a little',
      placeholder: 'Your answer...'
    },
    defusion_practice: {
      code: 'A3',
      title: 'Defusion Practice',
      mechShort: 'Self-Criticism',
      kind: 'log_single',
      intro: "The moment a harsh thought fires, say ‘I'm having the thought that…’ before finishing it. Not a one-off exercise — log it each time you actually catch yourself doing it.",
      logLabel: 'What was the thought, and did the gap feel real?',
      firstPlaceholder: 'e.g. ‘I’m having the thought that I embarrassed myself’ — it took the edge off slightly',
      placeholder: 'Your answer...'
    },
    compassion_break: {
      code: 'B3',
      title: 'Self-Compassion Break',
      mechShort: 'Guilt',
      kind: 'log_single',
      intro: "When guilt shows up disproportionately, pause: name it, remember it's a shared human experience, then offer yourself real warmth. Log it whenever you actually use it.",
      logLabel: 'What guilt were you carrying, and how did the break go?',
      firstPlaceholder: 'e.g. Guilt about missing a call — naming it out loud actually helped more than expected',
      placeholder: 'Your answer...'
    },
    values_anchor: {
      code: 'B4',
      title: 'Values Anchor',
      mechShort: 'Guilt',
      kind: 'upsert',
      intro: "Set the value that actually matters to you — not the inherited obligation — once. Then just glance at it whenever guilt shows up about a related choice, instead of re-deciding from scratch each time.",
      placeholder: "The value that's actually mine here: ...",
      firstUseExample: "To start, something like: “Being present with the people I love, on my own terms — not being available on demand out of obligation.”",
      revisitTip: "Come back and adjust this whenever it stops feeling like your own value and starts sounding like someone else's expectation again."
    },
    willingness_log: {
      code: 'B5',
      title: 'Willingness Log',
      mechShort: 'Guilt',
      kind: 'log_single',
      intro: "Every time you act on a real value despite guilt still being present — not waiting for it to disappear first — log it. This is the log of doing it anyway, guilt and all.",
      logLabel: 'What did you do, and was the guilt still there while you did it?',
      firstPlaceholder: 'e.g. Said no to hosting a family gathering this month — guilt was there, I did it anyway',
      placeholder: 'Your answer...'
    },
    strengths_log: {
      code: 'C3',
      title: 'Strengths Log',
      mechShort: 'Self-Doubt',
      kind: 'log_single',
      intro: "Notice a real, specific moment you used a genuine strength — curiosity, fairness, judgement, honesty, anything real. Log it as it happens, not just when something goes wrong.",
      logLabel: 'What strength, and what was the specific moment?',
      firstPlaceholder: 'e.g. Fairness — pushed back gently when a decision at work felt unfair to someone else',
      placeholder: 'Your answer...'
    },
    confidence_log: {
      code: 'C4',
      title: 'Confidence Log',
      mechShort: 'Self-Doubt',
      kind: 'log_single',
      intro: "A running, dated record of moments you handled something competently — concrete evidence, not vague praise. Add to this for as long as it's useful, not just during this module.",
      logLabel: 'What happened, what did you do, what was the actual outcome?',
      firstPlaceholder: 'e.g. Client asked a hard question in a review — I answered clearly and they moved on satisfied',
      placeholder: 'Your answer...'
    }
  },
  mhpiConfig: {
    baselineQuestions: [
      { id: 'q1', label: 'Problem Severity', prompt: 'Overall, how much is this issue affecting you right now?', min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely', reverse: false },
      { id: 'q2', label: 'Functional Impact', prompt: 'How much is this issue interfering with your daily life (work, studies, relationships, or routine)?', min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely', reverse: false },
      { id: 'q3', label: 'Avoidance', prompt: 'Because of this issue, how often do you avoid situations you would otherwise want to face?', min: 0, max: 10, minLabel: 'Never', maxLabel: 'Always', reverse: false },
      { id: 'q4', label: 'Self-Efficacy', prompt: 'How confident are you that you can manage this issue effectively?', min: 0, max: 10, minLabel: 'Not confident', maxLabel: 'Extremely confident', reverse: true },
      { id: 'q5', label: 'Hope', prompt: 'How hopeful are you that this issue can improve?', min: 0, max: 10, minLabel: 'Not hopeful', maxLabel: 'Extremely hopeful', reverse: true }
    ],
    weeklyQuestions: [
      { id: 'w1', prompt: "How much has this issue affected you this week?", min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely' },
      { id: 'w2', prompt: "How confident do you feel managing this issue this week?", min: 0, max: 10, minLabel: 'Not confident', maxLabel: 'Extremely confident' },
      { id: 'w3', prompt: "On how many days did you practice this week's activities?", min: 0, max: 7, minLabel: '0 days', maxLabel: '7 days' }
    ],
    endExtraQuestions: [
      { id: 'e6', prompt: "Overall, how helpful was this program?", min: 1, max: 5, minLabel: 'Not at all helpful', maxLabel: 'Extremely helpful' }
    ],
    endChoice: {
      id: 'e7',
      prompt: "What would you like to do next?",
      options: ['Finish here', 'Continue with another program', 'Talk to a therapist']
    }
  },
  escalationConfig: {
    tier1: "Any statement connecting self-worth, guilt, or self-doubt to intent or a plan to end one's life or self-harm (“I don't deserve to be here”, “my family would be better off without me”).",
    tier2: "Persistent worthlessness or hopelessness framing (“I'm fundamentally broken”, “I'll always let everyone down”), or real signs of functional collapse — withdrawing entirely from work, family, or relationships, not just low mood.",
    systemPrompt: `You are a safety classifier inside a mental-health support app used in India. Classify the user's message into exactly one of: NONE, TIER1, TIER2.

TIER1 definition: Any statement connecting self-worth, guilt, or self-doubt to intent or a plan to end one's life or self-harm (“I don't deserve to be here”, “my family would be better off without me”).
TIER2 definition: Persistent worthlessness or hopelessness framing (“I'm fundamentally broken”, “I'll always let everyone down”), or real signs of functional collapse — withdrawing entirely from work, family, or relationships, not just low mood.

Critical context: many people, especially in Indian English, use hyperbolic or idiomatic self-deprecating language that is NOT a genuine risk signal — for example "I could kill myself for forgetting that", "this deadline is literally killing me", "I could just die of embarrassment", "I'm such a failure lol". Do NOT classify ordinary hyperbole, jokes, or figures of speech as TIER1 or TIER2, even if they contain words like "kill", "die", or "worthless". Only classify as TIER1 if there is a genuine indication of intent, a plan, or serious risk to the person's life or safety. Only classify as TIER2 if there is genuine persistent hopelessness/worthlessness tied to the person's sense of self, or real functional collapse — not a single offhand remark.

When genuinely uncertain between hyperbole and a real signal, prefer the lower tier (or NONE) rather than over-triggering — but never downgrade language that includes a specific plan, method, or timeframe.

Respond with ONLY a raw JSON object, no markdown fences, no other text: {"tier": "NONE" | "TIER1" | "TIER2", "reason": "one short clause"}`,
    tier1FallbackWords: [
      "going to kill myself",
      "planning to end my life",
      "don't want to wake up tomorrow",
      "have a plan to end my life",
      "going to end it all tonight"
    ],
    tier2FallbackWords: [
      "i am worthless",
      "i feel like a burden to everyone",
      "i hate who i am",
      "there is no point in trying anymore"
    ]
  },
  openQuestions: [
    { area: "Clinical", text: "All 13 practicable technique mappings, plus the one [C] reference-only technique's framing, are my synthesis of the taxonomy's named sources — not clinician-reviewed." },
    { area: "Clinical", text: "Tier 1/2 escalation definitions for this module (self-worth/guilt/self-doubt framing, distinct from Module 2's failure/avoidance framing) are a first draft, awaiting sign-off." },
    { area: "Clinical — guardrail specific", text: "This module has TWO [B] guardrailed techniques inside the same mechanism (C1 and C2, both in Low Confidence & Self-Doubt) — confirms the template's warning that guardrail count per module isn't always exactly one. Both need independent clinical review of their guardrail wording, not a shared review." },
    { area: "Clinical — new content type", text: "The [C] reference-only technique (Two-Chair Dialogue) is genuinely new — no module before this one exercised that pattern. The static-card treatment here is my proposed implementation per the template's §2.6, not something clinically reviewed or user-tested yet." },
    { area: "Template stress-test finding", text: "Guilt (mechanism B) has 5 practicable techniques, which doesn't fit ‘T techniques + check-in + pre-commitment ≤ 5 touches.’ Resolution used here: Values Clarification and Willingness Exercises (both ACT, both Kelly Wilson/Hayes-sourced, naturally sequential in real practice) were taught as one combined touch rather than excluding either technique. This preserves all 5 named techniques without cutting content — recommend adding this as a third resolution option in the template's §2.3, alongside ‘exclude one to the bank’ and ‘flag to product,’ specifically for cases where two techniques are natural companions." },
    { area: "Resolved", text: "Crisis helpline numbers reused from Module 2 (KIRAN, TeleMANAS, Vandrevala Foundation) — these are national, not module-specific, so no module-by-module re-sourcing needed; still needs periodic re-verification regardless of module." },
    { area: "Not yet started", text: "Same as Module 2: accessibility target, analytics schema, and a full copy/editorial pass have not been done for this module either." }
  ]
};
