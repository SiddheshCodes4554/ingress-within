import { ModuleContent } from '../../../types/moduleContent';

function opt(label: string, isTarget: boolean, explain: string) {
  return { label, isTarget, explain };
}

export const MODULE_2_CONTENT: ModuleContent = {
  moduleId: 'M2',
  slug: 'perfectionism-avoidance',
  name: 'Perfectionism & Avoidance',
  tier: 'Core · ₹349 · Self domain',
  duration_weeks: 5,
  brief: {
    moduleName: 'Perfectionism & Avoidance',
    tier: 'Core · ₹349 · Self domain',
    mechanisms: [
      {
        key: 'A',
        name: 'Rigid Standard-Setting',
        short: 'Perfectionism',
        def: "A personal standard set so high that meeting it is nearly impossible, paired with all-or-nothing self-evaluation — a task is either flawless or it doesn't count.",
        need: 'Competence, Control',
        contrast: {
          who: 'Karan',
          text: 'reviews his client presentation once, tweaks two slides that genuinely needed it, and sends it by 7pm. He goes to bed.'
        },
        techniques: [
          {
            code: 'A1',
            approach: 'CBT',
            format: 'A',
            name: 'Cost-Benefit Analysis of Perfectionistic Standards',
            source: 'Beck-style CBT',
            what: 'Writing out, side by side, what a rigid standard actually gets you versus what it costs you — not as a lecture on why perfectionism is bad, but as your own honest ledger.',
            how: 'Rigid standards survive partly because they only ever get credited for their upside (safety, quality, approval) and never billed for their real cost (time, exhaustion, missed deadlines). Writing both columns out, in your own words, makes the actual trade visible.',
            why: "Sets up everything after it — once the standard's real cost is visible on paper, the other three techniques have something concrete to work against, rather than an abstract sense that 'perfectionism is bad.'"
          },
          {
            code: 'A2',
            approach: 'CBT-P',
            format: 'B',
            guardrail: true,
            name: '“Deliberate Imperfection” Behavioural Experiments',
            source: "Roz Shafran's CBT-for-clinical-perfectionism protocol",
            what: "Deliberately submitting or sharing one piece of work below your usual standard — on purpose — to test whether the catastrophe you're predicting actually happens.",
            how: "The redoing itself is what prevents the 'what if I stopped early' question from ever getting a real answer. Actually doing it once, and checking the real outcome against the predicted one, gives disconfirming evidence no amount of thinking-it-through can produce.",
            why: 'This is the one technique in the module that asks someone to deliberately sit with real, live discomfort rather than reflect on it after the fact — which is exactly why it ships as [B]: guided, with guardrails, not a plain worksheet.',
            guardrailNote: 'Per the taxonomy delivery-format requirement: self-selected intensity (a smaller or bigger version, chosen by the user), a built-in distress check-in right after the exercise, and an automatic escalation prompt if that check-in shows real distress — not something that waits for a worrying sentence to be typed elsewhere.'
          },
          {
            code: 'A3',
            approach: 'ACT',
            format: 'A',
            name: 'Values-Based “Good Enough” Goal Setting',
            source: 'Hayes, ACT',
            what: "Setting the standard for a task by asking what would actually serve your real values here — being a reliable colleague, a present parent, a person who finishes things — rather than an abstract sense of 'good enough.'",
            how: "A standard set in the abstract ('good enough') has nothing to anchor to, so it quietly drifts back toward 'flawless.' A standard set against a real value ('reliable' beats 'impressive') gives you something concrete to check the task against.",
            why: 'Cost-benefit analysis shows the standard is costly; this technique gives a genuine alternative to replace it with, rather than just removing a rule and leaving a gap.'
          },
          {
            code: 'A4',
            approach: 'CFT',
            format: 'A',
            name: 'Self-Compassion Practice for Post-Task Self-Criticism',
            source: 'Gilbert, CFT',
            what: 'Responding to a perceived mistake or an imperfect outcome with a compassionate, still-honest inner voice instead of a harshly critical one.',
            how: 'Harsh self-criticism activates a threat response, which narrows thinking and raises the urge to over-fix. A soothing, affiliative tone lowers that response — which, counterintuitively, makes clear-headed correction easier, not harder.',
            why: "Perfectionism here is partly maintained by fear of self-judgement, not just external judgement — this is the technique that speaks to the inner critic directly, especially useful right after trying A2."
          }
        ]
      },
      {
        key: 'B',
        name: 'Avoidance-Based Procrastination',
        short: 'Procrastination',
        def: 'Delaying a task to escape the discomfort it brings up (fear of judgement, fear of not being good enough) — the delay works immediately, which is exactly what keeps it going.',
        need: 'Emotional safety',
        contrast: {
          who: 'Meera',
          text: "moves her Sunday cleaning to Monday evening because she's genuinely exhausted — she knows exactly when she'll do it, and Monday evening, she does it."
        },
        techniques: [
          {
            code: 'B1',
            approach: 'Behavioural Activation',
            format: 'A',
            name: 'Graded Task Breakdown & Scheduling',
            source: 'Lewinsohn; manualized by Martell, Dimidjian & Jacobson',
            what: 'Breaking the avoided task into one small, scheduled, almost trivially doable first step — and putting just that first step on the calendar, not the whole task.',
            how: 'Avoidance is fed by the size of the task as imagined, not the real size of the first step. Shrinking the visible task removes most of the resistance, and starting tends to reduce the dread that follows.',
            why: "Often the block isn't the whole task — it's the size of the first step in the person's head. This resizes exactly that."
          },
          {
            code: 'B2',
            approach: 'BA adaptation',
            format: 'A',
            name: 'Five-Minute Rule / Micro-Commitment',
            source: 'Behavioural Activation adaptation',
            what: 'Committing to just five minutes on the avoided task — with explicit permission to stop after five minutes if you want to.',
            how: 'The five-minute frame lowers the activation barrier by making the commitment small enough that avoidance has nothing real to argue against. In practice, starting is usually what was hard — once five minutes are in motion, stopping becomes the less natural choice.',
            why: 'A companion to B1, not a replacement — B1 shrinks the task, this shrinks the time commitment, and either can be the easier lever depending on the task.'
          },
          {
            code: 'B3',
            approach: 'CBT',
            format: 'A',
            name: 'Implementation-Intention “If-Then” Planning',
            source: 'Gollwitzer, 1999',
            what: "A very specific plan made in advance — ‘If [situation X happens], then I will [do Y]’ — that pre-decides the first move before the avoidance moment arrives.",
            how: "Procrastination usually wins in a single moment: the moment you're supposed to start. Deciding what you'll do in that moment ahead of time, tied to a concrete cue, turns starting into a near-automatic response instead of a fresh decision avoidance gets to relitigate every time.",
            why: "Procrastination isn't a knowledge problem — people usually know what to do. It's an initiation problem, and this targets exactly that moment."
          },
          {
            code: 'B4',
            approach: 'Motivational Interviewing',
            format: 'A',
            name: 'Exploring Ambivalence About Starting',
            source: 'Miller & Rollnick, MI',
            what: 'A structured way of weighing the real costs and benefits of continuing to avoid a task against the costs and benefits of starting it — written in your own words, not argued at you.',
            how: "MI's core insight is that people are moved more by hearing their own reasons for change than by being told reasons. Writing both sides out in your own language tends to surface motivation a lecture wouldn't.",
            why: "Useful specifically when the block isn't 'I don't know how to start' but 'I'm honestly not sure I want to yet' — ambivalence, not just initiation mechanics, which is what separates this from B1–B3."
          }
        ]
      }
    ],
    scenarioSource: 'Pan-India, English-medium context',
    escalation: {
      tier1: "Any statement connecting perceived failure or inadequacy to intent or a plan to end one's life or self-harm (“if I fail this I don't want to be here”, “I'd rather hurt myself than let people down”).",
      tier2: "Persistent hopeless or worthless framing tied to task performance (“I'm worthless because I can't finish anything”, “I'm a burden to everyone”), or real signs of functional collapse — a job or degree genuinely at risk from prolonged avoidance, not just discomfort."
    }
  },
  introScreens: [
    {
      eyebrow: 'Before we begin',
      title: "What's stored, and who can see it",
      body: [
        'Your open-text answers in this module are saved to your journal.',
        "The only person who can ever see them is your assigned practitioner, if you've connected one — never other users, never shown anywhere public.",
        "If something you write suggests you might be in real danger, we show you support resources right away. That's the only thing that happens automatically — nothing gets sent anywhere without you knowing.",
        'Your answers stay saved and reviewable by you for 12 months from purchase, extended automatically if you renew.',
        'You can turn this module off in Settings at any time.'
      ],
      cta: 'I understand — continue',
      consent: true
    },
    {
      eyebrow: "What this is — and isn't",
      title: 'Between-session support, not a replacement',
      body: [
        "This module is designed to sit between therapy sessions, or to be useful on its own — either way, it isn't therapy, and it doesn't diagnose you with anything.",
        "If you're in crisis right now, don't wait for this module to help. Reach out immediately — the button below is always here if you need it."
      ],
      cta: 'Continue',
      crisisButton: true
    },
    {
      eyebrow: 'Why this module',
      title: "Why we're suggesting this one",
      body: [
        "You told us you're dealing with getting stuck on tasks you want to get right — either redoing them past the point they needed it, or putting them off until the deadline is breathing down your neck.",
        "This module is built for exactly that — not a general ‘manage your time better’ module, but the two specific patterns underneath it."
      ],
      cta: 'Continue'
    },
    {
      eyebrow: 'What to expect',
      title: 'The next 5 weeks',
      body: [
        'Short term: a new touch on weekdays, a few minutes each, real scenarios close to your own week — your own words, not a quiz to pass or fail. Weekends bring a short summary, not new content.',
        "Long term, honestly: this won't make perfectionism or procrastination disappear. What it can realistically offer is eight specific, evidence-based tools — four per pattern — and enough practice noticing each pattern that you reach for the right tool sooner. That's the actual promise here, not more than that."
      ],
      cta: 'Continue'
    },
    {
      eyebrow: 'Theory grounding',
      title: 'The eight ideas everything here is built on',
      body: [
        'Your taxonomy lists more than one therapy approach for each pattern — so instead of blending them into one vague idea, each approach gets its own tool and its own touch.',
        "You won't use any of these eight in Weeks 1–2 — those two weeks are just about being able to spot each pattern clearly, on its own, before any tool gets layered on top. Weeks 3–4 bring these eight back, one at a time, matched to exactly what you will have just learned to recognise."
      ],
      theory: true,
      cta: 'Start Week 1'
    }
  ],
  weeks: [
    // WEEK 1
    {
      num: 1,
      title: 'Perfectionism: recognising the pattern',
      mechanism: 'A',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w1t1',
          title: 'Recognition — a personal task',
          role: 'Recognition #1',
          noDelayed: true,
          relate: {
            text: [
              "Quick note before we start: this week and next aren't about any of the eight tools from before — none of them show up yet. First, you need to be able to spot the pattern clearly, on its own. The tools come in Weeks 3–4, matched one at a time to what you will have learned to recognise here.",
              'This week’s pattern has a name: <b>rigid standard-setting</b>. In simple terms: the standard keeps moving, no matter how good the work already is — because what you’re really chasing isn’t a finished task, it’s a feeling of being sure it’s right.',
              "Here’s what that looks like in one person’s week. <b class='who'>Ananya</b> freelances as a graphic designer out of Bengaluru. On Monday, she’s designing her cousin’s wedding invitation. By 6pm she has a genuinely good draft — clean, warm, exactly the brief, every detail the couple asked for. Then she keeps going anyway: nudging the font size, re-picking colours, redoing the border twice, telling herself she’ll know it’s right once it finally *feels* right. By midnight, the printer’s cutoff has passed. The version she eventually sends is barely different from the one she had six hours earlier — same layout, same colours, same words, just … touched, again and again."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "Which of these actually explains Ananya's four extra hours? Read all three before you pick — more than one will sound reasonable.",
            options: [
              opt("She wanted to feel certain it was right, even though it already matched everything the couple had asked for", true, "Right — she wasn't fixing something broken or missing. She was chasing a feeling of certainty, and re-touching the same finished thing was never going to produce that feeling. That's the pattern this whole module is about."),
              opt("She genuinely wanted her cousin's big day to have something special", false, "That's true of almost anyone doing a favour like this — wanting it to be good isn't the problem, and it's not unique to this pattern. The actual tell is that it already met the brief, and she kept going regardless."),
              opt("She kept noticing small real flaws each time she looked at it again", false, "If genuinely new flaws kept turning up, that would just be normal, careful revision — nothing wrong with that. But the story doesn't describe new flaws being found; it describes the same finished invite being re-touched by a feeling that hadn't settled yet.")
            ],
            whyPrompt: "In a few words — what's the actual giveaway that it's the first one, and not the other two?"
          },
          apply: {
            scenario: "Same pattern, a different person: Rohit's job application is due tomorrow morning. His resume has been ready since yesterday — a recruiter friend even read it and said it looked solid — but he's rewriting the summary line for the sixth time, convinced it still doesn't sound impressive enough.",
            prompt: "Same thing happening here. In two or three sentences: what would you actually say to Rohit right now, and why would you say it that way?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “A recruiter already told you it looked solid — that's more real evidence than most people ever get. The summary was probably fine at attempt two. This isn't about the words anymore, it's about not trusting ‘good enough’ to actually be enough.” Same pattern as Ananya: the goal quietly shifted from ‘a resume that reads well’ to ‘feeling sure about it’ — and rewriting never actually settles a feeling, no matter how many times you do it."
          },
          remember: {
            prompt: "Think of a real moment this applies to you. In a sentence or two: what were you actually chasing — a feeling of being sure, or something you could genuinely check off and be done with?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t2',
          title: 'Recognition — a work task',
          role: 'Recognition #2',
          delayedRef: 'w1t1_apply',
          delayedPrompt: "Last touch, on Rohit's resume, you wrote this:",
          relate: {
            text: [
              "Same Ananya, two days later — but this time it isn't a wedding invite, it's client work. She's finishing a one-page project update for a startup, due by 6pm. The numbers have been final since 2pm, and her contact at the startup already replied ‘looks good, send whenever.’ She spends the next three hours reformatting the same table for the fourth time anyway, insisting it ‘needs to look cleaner.’",
              "Notice what's carried over from Monday: the standard was never really about invites, or fonts, or tables. It follows her into whatever she's working on."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "Which of these is actually going on? More than one will sound like a fair explanation.",
            options: [
              opt("She's chasing a feeling of ‘clean enough,’ not fixing an actual problem with the table", true, "Right — the client already said it looked fine. There's no real gap left to close, only a feeling that hasn't caught up to that."),
              opt("Startup clients often expect very polished formatting, so she's just matching their standards", false, "Maybe true in general — but this specific client already approved it. Matching a real external bar and chasing a feeling past that bar look similar, but they're not the same thing."),
              opt("She's genuinely a detail-oriented person who cares about good formatting", false, "Probably also true, and not a bad trait on its own — the tell isn't that she cares, it's that she kept going after the person she was doing it for had already said yes.")
            ],
            whyPrompt: "In a few words — what makes this the same pattern as Monday, just at work?"
          },
          apply: {
            scenario: "A different person, same shape of afternoon: a college assignment's cover page has been redone six times — font, spacing, a border — while the actual essay inside hasn't been opened since it was finished two days ago, and a friend already skimmed it and said it reads well.",
            prompt: "In two or three sentences: what's really being avoided here, and why might the cover page be an easier place to put the energy than the essay itself?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “It's not the cover page — it's a safer place to keep ‘working’ than sitting with the essay actually being done and open to judgement. As long as the cover page isn't finished, the essay doesn't have to face anyone yet either.”"
          },
          remember: {
            prompt: "In a sentence or two: where does this show up for you — personal tasks, work ones, or both — and what's usually the ‘safer’ thing you redo instead of sending the real thing?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t3',
          title: 'What the redoing is really for',
          role: 'Functional logic',
          delayedRef: 'w1t2_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Between Monday's invite and Wednesday's report, there's a pattern worth naming honestly: the redoing feels like it's protecting Ananya from something. Not from a worse invite, or a messier table — from the discomfort of not being sure it's good enough, and from being judged if it isn't.",
              "What it actually costs is different from what it protects against: time, deadlines, and — ironically — the one thing it claims to be building. Confidence that ‘good enough’ can be trusted never gets earned, because it never gets tested."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the redoing actually trying to prevent? Think carefully — these are close.",
            options: [
              opt("The discomfort of being uncertain whether it's good enough", true, "This is the real target — an internal feeling, not an external outcome. The redoing is aimed at the uncertainty itself, which is exactly why finishing the task doesn't make it stop."),
              opt("Real, specific mistakes that a client or reader might actually catch", false, "If that were the target, a fixed checklist would eventually satisfy it. This kind of redoing usually keeps going well past the point any real mistake would've been caught."),
              opt("Wasting the client's time by sending something rushed", false, "A caring motive, and a real one — but notice the client here already approved it. The worry has outlived the thing it was supposedly protecting.")
            ],
            whyPrompt: "In a few words — why doesn't more redoing actually settle the uncertainty?"
          },
          apply: {
            scenario: "Someone on the startup's team, watching Ananya reformat the table a fourth time, finally asks: ‘What's actually wrong with the third version?’ She goes quiet for a second, then says, ‘Nothing, I guess. It just didn't feel done.’",
            prompt: "That's usually the tell. In two or three sentences: think about the last time you redid something well past the point it needed it — if someone had asked you the same question, what would your honest answer have been?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the tell is whether what you named is a feeling (judgement, doubt, embarrassment) rather than an actual, measurable flaw someone could point to."
          },
          remember: {
            prompt: "In a sentence or two: what does that feeling usually feel like for you — physically, or in your head — right before you catch yourself redoing something?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t4',
          title: 'What healthy standards look like',
          role: 'Contrast / boundary case',
          delayedRef: 'w1t3_apply',
          delayedPrompt: "Last touch, you named this:",
          relate: {
            text: [
              "Here's what the same kind of moment looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Karan</b>, on a different team, has his own client deliverable due that same week — a presentation, not a report, but the same shape of task as Ananya's. He finishes a solid draft, reviews it once, notices two slides where the data was genuinely a version behind, fixes exactly those two, and sends it by 7pm. He goes to bed without a second thought.",
              "This is the module's one contrast case: real effort, real review, and a stopping point that isn't dictated by anxiety. Worth holding onto — everything else this week is about noticing when that stopping point goes missing."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Karan's one review different from Ananya's fourth reformat? All three of these can look identical from the outside.",
            options: [
              opt("His stop was based on the work meeting a real, checkable bar; hers kept moving because the bar was a feeling", true, "That's the real difference — not effort, confidence, or how the person seems on the outside, but what actually decided when to stop."),
              opt("He's simply a more confident person than she is", false, "Confidence is often the story people tell themselves afterward, but it doesn't explain the mechanism — someone can feel anxious and still stop at a real bar, or feel calm and still chase a feeling past it."),
              opt("His task was genuinely simpler than hers", false, "Both were client deliverables with real stakes — task difficulty isn't what decided the outcome here; what decided it was whether ‘done’ was defined by the work or by a feeling.")
            ],
            whyPrompt: "In a few words — how would you know, in the moment, which one you're doing?"
          },
          apply: {
            scenario: "A friend asks Karan how he knew the presentation was actually finished. He shrugs: ‘The two slides that needed fixing got fixed. The rest already worked — I checked it against the brief, not against a feeling.’",
            prompt: "In two or three sentences: think of a time you met a real standard and actually stopped — what specifically told you it was actually done?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful pattern is naming something concrete and external (a checklist met, a person confirmed it worked, the brief was satisfied) rather than a feeling of certainty."
          },
          remember: {
            prompt: "In a sentence or two: name a real signal you could use next time — something outside your own head that would tell you a task is actually done.",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t5',
          title: 'What actually happened',
          role: 'Reinforcing rep',
          delayedRef: 'w1t4_apply',
          delayedPrompt: "Last touch, your ‘done’ signal was:",
          relate: {
            text: [
              'One more, and then a small piece of what actually happened to Ananya.',
              "On Thursday, she finally sent that startup report — the fourth version, no different from the third. Nobody said anything about the formatting. Nobody noticed. The client replied within the hour: ‘Thanks, this is clear.’ The only thing that had changed since 2pm was that she'd lost an evening, and gained nothing she could point to.",
              'That’s not a coincidence, and it’s the whole idea behind the tool coming in Week 3: most of the fear a rigid standard runs on has never actually been tested. Ananya just accidentally tested hers — and it held.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does Ananya's Thursday actually show? All three sound like fair readings of the same event.",
            options: [
              opt("The redoing was protecting against a reaction that was never going to happen anyway", true, "Exactly — the feared reaction (someone noticing, someone judging the formatting) simply wasn't out there to begin with. That's testable on purpose, which is what Week 3 turns into a real tool."),
              opt("She just got lucky this one time — a stricter client might have reacted differently", false, "Possible in theory, but notice this wasn't the first time she's sent early drafts to careful clients — the pattern of ‘nobody notices’ tends to repeat, which is exactly why it's worth testing on purpose instead of writing it off as luck."),
              opt("The report genuinely was better because of the extra three hours, even if no one mentioned it", false, "If it were meaningfully better, that would show up somewhere — in the client's response, in something concrete. Nothing here suggests the fourth version did anything the first one didn't.")
            ],
            whyPrompt: "In a few words — why might the same result happen again, on purpose, not just by luck?"
          },
          apply: {
            scenario: "A different domain again, further from Ananya's work entirely: Priya has been reworking her sister's wedding speech for three weeks. It's already warm and clearly from the heart — she read an early version to a cousin, who teared up — but she keeps rewriting the opening line anyway.",
            prompt: "In two or three sentences: what would actually tell Priya it's ready, using what you now know about the difference between a real signal and a feeling?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “It already made someone tear up when she read it aloud once — that's the real signal, a reaction from an actual person, not whether the opening line still bothers her in her own head.”"
          },
          remember: {
            prompt: "In a sentence or two: name one task this week where you could apply the same check — and what real signal you'd look for instead of a feeling.",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: the mechanism was rigid standard-setting — a standard that keeps moving so nothing can clear it. You followed it through one person's week (personal, then work), its functional logic, the one contrast case for the whole module, and a real outcome that previews Week 3's tool. No new teaching in this summary. Next week: the same shape, for procrastination."
    },

    // WEEK 2
    {
      num: 2,
      title: 'Procrastination: recognising the pattern',
      mechanism: 'B',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w2t1',
          title: 'Recognition — pending admin',
          role: 'Recognition #1',
          delayedRef: 'w1t5_apply',
          delayedPrompt: 'Last week, you named this task:',
          relate: {
            text: [
              'This week’s pattern has a different name: <b>avoidance-based procrastination</b>. In simple terms: you delay a task to escape the discomfort it brings up right now — and the delay actually works, in the short term, which is exactly why it keeps happening.',
              "Here’s what that looks like. <b class='who'>Arjun</b> works in operations at a mid-size firm in Pune. ‘Start ITR filing’ has been on his list for three weeks. Every morning he tells himself he’ll start ‘after this meeting’ or ‘tomorrow, once things are calmer’ — and every day, something else quietly takes that slot instead. The form sits untouched in a browser tab he hasn’t closed in three weeks, as if closing it would mean admitting he’s not doing it today either."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually going on? More than one of these will sound believable.",
            options: [
              opt("He keeps delaying because starting brings up a discomfort he'd rather not feel right now", true, "Right — notice the tab's still open. He hasn't forgotten, and it's not really about time. The delay is about not wanting to feel whatever starting brings up."),
              opt("He genuinely has a packed schedule every single day for three weeks straight", false, "Possible some days — but three weeks running is a long streak of ‘genuinely no time.’ When one specific task keeps losing to everything else, every day, the schedule usually isn't the real story."),
              opt("He's disorganised and has simply forgotten it's on his list", false, "If he'd forgotten, the tab wouldn't still be sitting there, unclosed, for three weeks — that's someone very aware of the task, not someone who's lost track of it.")
            ],
            whyPrompt: "In a few words — what's the giveaway that it's the first one, not the other two?"
          },
          apply: {
            scenario: "Same pattern, a different person: Kavya has been avoiding a hard conversation with her flatmate about rent for two weeks. She keeps telling herself she'll bring it up ‘when the moment feels right’ — though she sees her flatmate most evenings, and the moment never quite arrives.",
            prompt: "Same thing happening here. In two or three sentences: what's actually going on, and why might ‘when the moment feels right’ never actually show up on its own?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “ ‘When the moment feels right’ isn't a plan — it's a condition that never arrives on its own, because the discomfort of raising it doesn't get smaller just by waiting. That's what makes it avoidance rather than a genuine reschedule.”"
          },
          remember: {
            prompt: "In a sentence or two: name a real moment this applies to you — what discomfort are you actually avoiding by delaying, not the task itself, but the feeling underneath it?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t2',
          title: 'Recognition — a work task',
          role: 'Recognition #2',
          delayedRef: 'w2t1_apply',
          delayedPrompt: "Last touch, on Kavya's rent conversation, you wrote this:",
          relate: {
            text: [
              "Same Arjun, a different kind of task. At work, he's meant to send a proposal to a client who pushed back hard on the last one. He opens his laptop each morning and does everything except open the document — clears his inbox, reorganises desktop icons, replies to Slack messages that could easily wait until afternoon.",
              'Notice what’s carried over from the ITR form: the avoidance was never really about tax filing or proposals. It follows him into whatever specifically makes him brace a little.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's the function of all that other activity? These are close — read carefully.",
            options: [
              opt("It looks like productivity, which is exactly what lets the avoidance go unnoticed — including by him", true, "Right — busy-looking avoidance is often the hardest kind to catch. Clearing an inbox feels like work; it just isn't the work that actually matters."),
              opt("He's genuinely prioritising more urgent things first", false, "Worth asking honestly — but if the same task keeps losing to the same low-stakes things every single morning, ‘more urgent’ stops being a believable explanation."),
              opt("The proposal isn't actually that important to him", false, "If it didn't matter, there'd be no discomfort in opening the document. The fact that he braces at all is a sign it matters plenty — maybe too much.")
            ],
            whyPrompt: "In a few words — why is this kind of avoidance easier to miss than obviously doing nothing?"
          },
          apply: {
            scenario: "A different person, same shape of evening: a student has ‘start exam revision’ on their list. Each night they open their notes app, then spend twenty minutes reorganising folders and colour-coding subjects — the material itself never actually gets opened.",
            prompt: "In two or three sentences: what is the folder-reorganising actually doing for them, and why might it feel like progress even though nothing about the exam has changed?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “It creates the feeling of having engaged with revision, without the discomfort of actually testing what they don't know yet. Organising the folders can't tell you that you're behind — opening the notes might.”"
          },
          remember: {
            prompt: "In a sentence or two: what's your version of ‘looks productive, isn't the task’ — what do you tend to tidy or organise instead of starting the real thing?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t3',
          title: 'What the delay is actually buying you',
          role: 'Functional logic',
          delayedRef: 'w2t2_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Between the ITR form and the client proposal, there's a pattern worth naming honestly: the delay isn't laziness — it's working. The moment Arjun avoids either task, the discomfort drops immediately, and that relief is real. It's exactly what teaches the brain to avoid again tomorrow.",
              "What it costs is different from what it buys: the task doesn't get smaller by waiting, the deadline gets closer, and the dread quietly compounds underneath — while the relief only ever lasts until the next time he has to face it."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the delay actually doing? These are close — think it through.",
            options: [
              opt("Removing discomfort right now, at the real cost of the task — and the dread — still being there tomorrow", true, "That trade — relief now, cost later — is exactly what keeps the loop going, and it's a real trade, not an illusion."),
              opt("Making the task genuinely smaller or easier over time", false, "The task rarely gets smaller. The dread around starting it usually gets bigger instead, since it's had longer to build."),
              opt("Buying him time to prepare properly before actually starting", false, "That would be true if the extra time were spent preparing — but nothing about the task itself is getting more ready. The time is just passing, not being used.")
            ],
            whyPrompt: "In a few words — why does short-term relief make the next delay more likely, not less?"
          },
          apply: {
            scenario: "Arjun's colleague, noticing the proposal still hasn't gone out, asks casually: ‘What's actually holding it up?’ He starts to answer, then realises he doesn't have a real reason — just a vague sense of ‘not yet.’",
            prompt: "That's usually the tell. In two or three sentences: think of a task you're currently avoiding — what relief does putting it off actually give you, and what is it quietly costing you?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the pattern to notice is naming a real, specific relief (not thinking about it yet, not feeling judged yet) against a real, specific cost (growing dread, less time, quiet guilt building underneath)."
          },
          remember: {
            prompt: "In a sentence or two: which of those two — the relief or the cost — do you actually notice more in the moment, and which one only shows up later?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t4',
          title: 'What a real delay looks like',
          role: 'Contrast / boundary case',
          delayedRef: 'w2t3_apply',
          delayedPrompt: "Last touch, you wrote this:",
          relate: {
            text: [
              "Here's what the same kind of moment looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Meera</b> has ‘clean the house’ on her Sunday list. She's genuinely exhausted from a rough week, so on Sunday morning she moves it to Monday evening — a specific day, a specific time she already knows she'll be free. Monday evening, she does it. No drama, no lingering guilt.",
              "This is the contrast case for procrastination: a real, specific reschedule for a real reason, with a landing point that actually gets kept — not an escape with nowhere to land."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Meera's move different from Arjun's ITR delay? All three can look similar from the outside.",
            options: [
              opt("Hers has a specific new time attached, and she actually follows through on it", true, "That's the real difference — a genuine reschedule names when, and keeps that appointment with itself."),
              opt("Hers is a smaller, less important task overall", false, "Task size isn't the tell — both small and large tasks can be genuinely rescheduled, or endlessly avoided."),
              opt("She's simply a more disciplined person than Arjun", false, "Tempting, but it doesn't hold up — the actual difference is structural, not a matter of character. Anyone can do either, depending on the moment and the specificity of the plan.")
            ],
            whyPrompt: "In a few words — how would you tell the two apart in your own week, in the moment?"
          },
          apply: {
            scenario: "A friend asks Meera how she knew Monday evening would actually happen. She says: ‘I didn't leave it vague — I already knew exactly what time I'd be home and free.’",
            prompt: "In two or three sentences: think of a task you've moved on your own calendar recently — was it a real reschedule or an avoidance with no landing point? How do you know?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful check is whether the new time was specific and was actually kept, versus vague and repeatedly re-moved without ever quite arriving."
          },
          remember: {
            prompt: "In a sentence or two: what's one task on your list right now that needs an honest answer to that question?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w2t5',
          title: 'What actually happened',
          role: 'Reinforcing rep',
          delayedRef: 'w2t4_apply',
          delayedPrompt: 'Last touch, you asked yourself this about:',
          relate: {
            text: [
              'One more, and then a small piece of what actually happened to Arjun.',
              "On Thursday, almost by accident, he finally opened the ITR tab — just to see how bad it looked. Filling in his name and PAN number took four minutes. The dread, it turned out, had built up around an unopened tab far more than around the actual form, which was mostly pre-filled already.",
              "That's not a coincidence either, and it previews the tools coming in Week 4: most of the dread around starting has very little to do with the real size of the task. Arjun just accidentally found that out. Week 4 turns it into something you can do on purpose."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does Arjun's Thursday actually show? All three sound like fair readings of the same event.",
            options: [
              opt("The dread was about the size of the task in his head, not the real first step", true, "Exactly — and that gap is testable on purpose, which is what Week 4 turns into a real tool."),
              opt("He just happened to get an easier form this time", false, "Maybe partly true of this specific form — but the proposal, the client call, and the revision folders all showed the same gap between the dread and the real first step. That's a repeating shape, not one lucky form."),
              opt("Starting only worked because he finally felt ‘in the mood’", false, "He wasn't in the mood — he opened the tab almost by accident, mid-dread. That's the actual insight: you don't need the mood to shift first.")
            ],
            whyPrompt: "In a few words — why might the same result happen again, on purpose, not just by accident?"
          },
          apply: {
            scenario: "A different domain again: Vikram has ‘call the visa office’ on his list for ten days. Each morning the thought of the call makes his stomach drop, so he opens Instagram instead — and feels better for twenty minutes, until the same dread returns the next morning, unchanged.",
            prompt: "In two or three sentences: what's the very first honest step here — not the whole call, just the smallest possible next move — and why might naming just that first step matter more than steeling himself for the whole conversation?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “Opening the dialer and finding the number — nothing about actually making the call yet. The whole call is what's dreadful; finding a number is almost nothing, and it's the only part that actually needs doing right now.”"
          },
          remember: {
            prompt: "In a sentence or two: what's your version of ‘just open the dialer’ for the task you're avoiding — the smallest real first step, not the whole thing?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: "This week: the mechanism was avoidance-based procrastination — a delay that buys real relief now at a real cost later. You followed it through one person's week (personal admin, then work), its functional logic, the one contrast case for procrastination, and a real outcome that previews Week 4's tools. No new teaching in this summary. Next week: the first of two technique weeks."
    },

    // WEEK 3
    {
      num: 3,
      title: 'Perfectionism: four tools, and a plan',
      mechanism: 'A',
      kind: 'technique',
      retrievalCheck: {
        prompt1: 'In your own words — what is rigid standard-setting, and what does the redoing actually protect against?',
        prompt2: 'And what is avoidance-based procrastination — what does the delay actually buy, and at what cost?',
        reveal: 'Rigid standard-setting is a standard set so high it cannot be cleared, which keeps redoing feeling necessary — it protects against the discomfort of uncertainty, not against real errors. Avoidance-based procrastination is delaying a task to escape the discomfort it brings up — it buys immediate relief at the cost of the task (and the dread) still being there, usually worse, tomorrow.'
      },
      touches: [
        {
          id: 'w3t1',
          title: 'Cost-Benefit Analysis',
          role: 'Technique A1 · CBT (Beck-style)',
          delayedRef: 'w2t5_apply',
          delayedPrompt: 'Last week, your first step was:',
          relate: {
            text: [
              'This is the first of the four tools for perfectionism from your theory grounding screen before Week 1 — the one labelled CBT (Beck-style): a <b>cost-benefit analysis</b> of the standard itself.',
              "Remember Ananya's wedding invite, and her startup report? This is the tool that would have actually stopped her three hours earlier — not by telling her to relax, but by making her write down, honestly, what the redoing was buying her against what it was costing her.",
              'The exercise itself is simple: two columns. What this standard gets you. What it actually costs you. Not a lecture on why perfectionism is bad — your own honest ledger, in your own words.'
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Why might writing the cost down change something that just noticing it in your head does not?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Think of a standard you're currently holding yourself to that's costing you real time or peace of mind this week — maybe the same one you named back in Week 1.",
            prompt: 'In two or three sentences, write two honest columns: what this standard actually gets you, and what it is actually costing you right now.',
            placeholder: 'Gets me: ... / Costs me: ...'
          },
          reveal: {
            text: "There's no single right answer here — the tell is whether the cost column is as concrete and honest as the benefit column, not just a token line added to seem balanced."
          },
          remember: {
            prompt: 'In a sentence or two: which column was harder to write honestly, and why do you think that is?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w3t2',
          title: '“Deliberate Imperfection”',
          role: 'Technique A2 · CBT-P (Shafran) — guided',
          guardrail: true,
          delayedRef: 'w3t1_apply',
          delayedPrompt: 'Last touch, your two columns were:',
          relate: {
            text: [
              "The second tool from that same list, and this one's different from the others, on purpose: <b>deliberate imperfection</b>.",
              "This is exactly what happened to Ananya by accident on that Thursday — sending the report she still believed was lacking, and discovering nothing bad came of it. This tool takes that accident and turns it into something you choose to do, on purpose, with a real prediction attached beforehand.",
              'You pick one real task, and deliberately send or submit it below your usual standard — to actually test whether the bad thing you are predicting happens, instead of just thinking about it.',
              'Because this asks you to sit with real discomfort while you do it, not just reflect on it afterward, this touch checks in with you directly partway through — not just by reading what you type.'
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might actually doing this once tell you something a hundred reassuring thoughts can't?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Pick one real task you'd normally over-polish this week — something with a real deadline, not a hypothetical one.",
            intensityPrompt: 'First, choose how big a version of this you want to try:',
            intensityOptions: ['Smaller version — a fairly low-stakes task', 'Bigger version — something that actually worries me a bit'],
            prompt: 'In two or three sentences: name the task, the good-enough version you will actually send or submit, and the specific bad outcome you are predicting.',
            placeholder: 'Task: ... / What I will actually send: ... / What I predict will happen: ...'
          },
          distressPrompt: "You've just committed to a real version of this. Before we continue — how are you feeling right now?",
          reveal: {
            text: "Something like: “If I send the good-enough version, I predict [specific bad outcome] — and I'll actually check whether that happens, at whichever intensity I chose. Ananya's version of this, by accident, was sending a report she thought was unfinished — and finding out the client never noticed at all.”"
          },
          remember: {
            prompt: 'In a sentence or two: what did choosing the intensity feel like, and why did you pick that one over the other?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w3t3',
          title: 'Values-Based “Good Enough” Goal Setting',
          role: 'Technique A3 · ACT (Hayes)',
          delayedRef: 'w3t2_apply',
          delayedPrompt: 'Last touch, your prediction was:',
          relate: {
            text: [
              "The third tool from your theory grounding screen, for what replaces the standard once it's loosened: <b>values-based goal setting</b>.",
              'Remember Karan, from Week 1? ‘The two slides that needed fixing got fixed. The rest already worked.’ Without naming it that way, he was already checking his work against something like a value — reliable, on-brief — rather than a feeling of certainty. This tool makes that explicit and deliberate, on purpose, instead of something a few people just happen to do naturally.',
              "Instead of aiming at an abstract ‘good enough,’ aim at what a real value — reliable, present, thorough — actually asks of this task. A value gives you something concrete to check against; ‘good enough’ alone tends to drift back toward ‘flawless’ the moment you're unsure."
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Why might ‘reliable’ or ‘present’ work better as a target here than ‘good enough’?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Pick a task you're currently over-polishing — could be the same one from earlier this week, or a new one that's come up since.",
            prompt: 'In two or three sentences: name the real value underneath this task, and what that value — not perfection — would actually ask of you here.',
            placeholder: 'The value: ... / What it actually asks: ...'
          },
          reveal: {
            text: "Something like: “The value is being a reliable teammate, not an impressive one — which asks for on-time and clear, not flawless. Notice how different that target feels to aim at than ‘make it as good as possible.’”"
          },
          remember: {
            prompt: "In a sentence or two: does aiming at that value change what ‘done’ actually looks like for this task?",
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w3t4',
          title: 'Self-Compassion Practice',
          role: 'Technique A4 · CFT (Gilbert)',
          delayedRef: 'w3t3_apply',
          delayedPrompt: 'Last touch, the value you named was:',
          relate: {
            text: [
              'The fourth and final tool for this pattern, for the inner voice itself: <b>self-compassion practice</b>.',
              "Whatever happened when you tried Touch 2's exercise — even if it went completely fine — there's usually a harsher voice waiting somewhere in the process, ready to point out what still wasn't quite right. This tool is for that voice specifically.",
              'Harsh self-criticism triggers a threat response — the same system that reacts to real danger — which narrows thinking and raises the urge to over-fix. A soothing, still-honest tone lowers that response, which tends to make the actual correction clearer, not softer.'
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Why might a harsh inner voice make the redoing worse, rather than better?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Think of something you did recently that wasn't perfect — maybe from Touch 2's exercise, maybe something else — something you'd normally be harsh with yourself about.",
            prompt: 'In two or three sentences: write a compassionate-but-corrective line to yourself about it — kind, but still honest about what actually needs fixing.',
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "Something like: “That part genuinely needed fixing, and you're capable of fixing it — none of that requires deciding you're bad at this.” Notice this doesn't skip the correction — it just removes the self-attack around it."
          },
          remember: {
            prompt: 'In a sentence or two: how did that land, compared to your usual inner voice in a moment like this?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w3t5',
          title: 'How did it go, and a plan for next time',
          role: 'Check-in + pre-commitment',
          delayedRef: 'w3t4_apply',
          delayedPrompt: 'Last touch, your compassionate line was:',
          relate: {
            text: [
              'No new idea this touch — two quick things before we move to procrastination.',
              "First, a real check-in on the four tools from this week — the same four that started with Ananya's invite and report back in Week 1. Then, a plan built now, while nothing is actually on fire — deciding in advance which tool you will reach for works better than deciding mid-redo, when the pull to keep going is strongest."
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Which of the four did you actually reach for this week, if any — and what happened when you did?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: 'Pick whichever of the four tools felt most useful this week.',
            prompt: "In two or three sentences, write an if-then plan for using it: ‘If [specific cue], then I will [specific tool, specifically applied].’",
            placeholder: 'If [specific cue], then I will...'
          },
          reveal: {
            text: "Something like: “If I've rewritten the same line twice, then I'll name the value underneath the task before touching it again.”"
          },
          remember: {
            prompt: 'In a sentence or two: say the plan back to yourself — does it actually sound doable on a real, busy day?',
            placeholder: 'Your answer...'
          }
        }
      ],
      summary: 'This week: four named tools for perfectionism — cost-benefit analysis, deliberate imperfection (guided, with a built-in check-in), values-based goal-setting, and self-compassion practice — a real check-in on trying them, and a plan built while calm. No new teaching in this summary. Next week: the same shape, for procrastination.'
    },

    // WEEK 4
    {
      num: 4,
      title: 'Procrastination: four tools, and a plan',
      mechanism: 'B',
      kind: 'technique',
      retrievalCheck: null,
      touches: [
        {
          id: 'w4t1',
          title: 'Graded Task Breakdown & Scheduling',
          role: 'Technique B1 · Behavioural Activation',
          delayedRef: 'w3t5_apply',
          delayedPrompt: 'Last week, your if-then plan was:',
          relate: {
            text: [
              'The first of the four tools for procrastination from your theory grounding screen — for when the task itself feels huge: <b>graded task breakdown</b>.',
              "Remember Arjun's ITR form, sitting in an unclosed tab for three weeks? The dread was about the whole form as one giant, unopened thing. This tool works by refusing to look at the whole thing at all — you shrink the task down to one ridiculously small first step, and schedule only that. ‘Open the form’ is a first step. ‘Finish the ITR filing’ isn't."
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Why does resizing the first step matter more than resizing the whole task?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Pick one task you've been putting off — something with real weight to it, not a trivial errand.",
            prompt: 'In two or three sentences: break it into one small first step, and name exactly when you will do it.',
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "Something like: “First step: open the tab and log in — nothing else. Tomorrow, 9am, right after chai.” Notice this is almost exactly what actually got Arjun's form moving, once he stopped aiming at ‘finish it’ and aimed at ‘open it.’"
          },
          remember: {
            prompt: 'In a sentence or two: did shrinking it change how it felt to even think about?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w4t2',
          title: 'Five-Minute Rule',
          role: 'Technique B2 · BA adaptation',
          delayedRef: 'w4t1_apply',
          delayedPrompt: 'Last touch, your first step was:',
          relate: {
            text: [
              "The second tool from that same list, for when even a small first step still feels sticky: the <b>five-minute rule</b>.",
              "Commit to just five minutes on the task — with explicit permission to stop after five minutes if you want to. Often the five minutes are the hard part; once you're in motion, stopping is the less natural choice. It's the client proposal problem from Week 2 again — once Arjun actually opened the document, the proposal itself wasn't what he'd been dreading."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why might explicit permission to stop actually make someone less likely to stop, not more?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Same task as before, or a different one you're currently avoiding.",
            prompt: "In two or three sentences: commit to five minutes on it — name exactly when you will do those five minutes, and what ‘done’ looks like at the five-minute mark.",
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "Something like: “Five minutes, tonight at 9pm, on just opening the document and reading the brief — and I'm allowed to stop after that if I want to.”"
          },
          remember: {
            prompt: 'In a sentence or two: did you actually stop at five minutes, or keep going — and what does that tell you?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w4t3',
          title: 'Implementation-Intention “If-Then” Planning',
          role: 'Technique B3 · CBT (Gollwitzer)',
          delayedRef: 'w4t2_apply',
          delayedPrompt: 'Last touch, your 5-minute commitment was:',
          relate: {
            text: [
              'The third tool, built for exactly the starting moment: an <b>implementation intention</b>, or ‘if-then plan.’',
              "‘If it's 9am and I've had my chai, then I open the ITR site and fill in just my name.’ Nothing about finishing — just starting, tied to a specific cue. This is the deliberate version of what actually got Arjun's form moving on that Thursday — except now the cue is chosen on purpose, ahead of time, instead of happening by accident."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Why does tying the plan to a specific cue matter more than just deciding to ‘start earlier’?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Pick one task you've been putting off — same or different from earlier this week.",
            prompt: "In two or three sentences: write your own if-then plan for starting it — be as specific as you can about the cue.",
            placeholder: 'If [specific cue], then I will...'
          },
          reveal: {
            text: "Something like: “If it's 8:30pm and I've closed my laptop for dinner, then I open the doctor's booking app and just pick a slot — nothing else.”"
          },
          remember: {
            prompt: "In a sentence or two: what's the cue you picked, and why that one specifically?",
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w4t4',
          title: 'Exploring Ambivalence About Starting',
          role: 'Technique B4 · Motivational Interviewing',
          delayedRef: 'w4t3_apply',
          delayedPrompt: 'Last touch, your if-then plan was:',
          relate: {
            text: [
              'The fourth and final tool for this pattern, for when the real block is motivation, not just starting: <b>exploring ambivalence</b>.',
              "The first three tools all assume you already want to do the task, and just need help starting. This one is for something different — when you're honestly not sure you want to yet. Two columns, in your own words: what avoiding this is actually costing you, and what starting it would actually give you — not what anyone else thinks it should give you."
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Why might writing your own reasons work better than someone else listing them for you?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Pick a task you're genuinely ambivalent about starting — not just procrastinating on out of habit, but one where some part of you isn't sure it's even worth doing.",
            prompt: "In two or three sentences: in your own words, what's avoiding it costing you, and what would starting actually give you?",
            placeholder: 'Costs of avoiding... / What starting gives me...'
          },
          reveal: {
            text: "There's no single model answer here — the useful check is whether both columns are in your own words, not borrowed ones you think you're supposed to write."
          },
          remember: {
            prompt: 'In a sentence or two: which column was easier to write — the cost of avoiding, or the benefit of starting — and what does that tell you?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w4t5',
          title: 'How did it go, and a plan for next time',
          role: 'Check-in + pre-commitment',
          delayedRef: 'w4t4_apply',
          delayedPrompt: 'Last touch, you wrote this:',
          relate: {
            text: [
              'No new idea this touch — two quick things before Week 5.',
              "First, a real check-in on this week's four tools — the same four that started with Arjun's ITR form back in Week 2. Then a plan built now, before the avoidance moment actually arrives — deciding calmly, in advance, is what actually closes the gap between intending something and doing it."
            ]
          },
          think: {
            mode: 'open',
            prompt: 'Which of the four did you actually try this week, and what happened?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: 'Pick whichever of the four tools felt most useful this week.',
            prompt: "In two or three sentences: write an if-then plan for using it: ‘If [specific cue], then I will [specific tool, specifically applied].’",
            placeholder: 'If [specific cue], then I will...'
          },
          reveal: {
            text: "Something like: “If I open my to-do list and feel my stomach drop at a task, then I'll write the two-column ambivalence exercise for it before doing anything else on the list.”"
          },
          remember: {
            prompt: 'In a sentence or two: say the plan back to yourself — does it actually sound doable on a real, busy day?',
            placeholder: 'Your answer...'
          }
        }
      ],
      summary: 'This week: four named tools for procrastination — graded task breakdown, the five-minute rule, an if-then plan, and exploring ambivalence — a real check-in, and a plan built while calm. No new teaching in this summary. Next week: both patterns together, and the one unscaffolded test.'
    },

    // WEEK 5
    {
      num: 5,
      title: 'Integration & review',
      mechanism: 'both',
      kind: 'integration',
      retrievalCheck: {
        prompt1: 'Name one tool for perfectionism and, in your own words, what it actually does.',
        prompt2: 'Name one tool for procrastination and, in your own words, what it actually does.',
        reveal: 'Any of the eight count here — what matters is whether the description is functional (what the tool actually does and why) rather than just the name repeated back.'
      },
      touches: [
        {
          id: 'w5t1',
          title: 'Both patterns, back to back',
          role: 'Integration',
          delayedRef: 'w4t5_apply',
          delayedPrompt: 'Last week, your if-then plan was:',
          relate: {
            text: [
              "<b class='who'>Sana</b> has been avoiding starting her thesis chapter for two weeks — opening the document, feeling her stomach drop, closing it again. When she finally forced herself to start yesterday, she spent the whole afternoon rewriting the first paragraph nine times, checked her email forty times in between, and closed the laptop at midnight having, in her own words, ‘made no progress.’"
            ]
          },
          think: {
            mode: 'open',
            prompt: "Both mechanisms showed up back to back here. Which one do you think is actually driving the other, in Sana's case — and why?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Same situation — Sana's thesis chapter.",
            prompt: 'In two or three sentences: what would you actually recommend Sana try first, and why that one, out of all eight tools you now know?',
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "There's a real case either way. Some would start with an if-then plan, since nothing happens until she starts — like Arjun's ITR tab. Others would say the redoing is what makes starting so unpleasant in the first place, so a cost-benefit ledger or deliberate imperfection comes first — like Ananya's report. Either is defensible — what matters is she picks one and actually runs it, not that she picks the ‘correct’ one."
          },
          remember: {
            prompt: "In a sentence or two: which would you have picked for yourself, in her position — and does that match your instinct across the module so far?",
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w5t2',
          title: 'Designing a full response',
          role: 'Integration',
          delayedRef: 'w5t1_apply',
          delayedPrompt: "Last touch, you said you'd recommend:",
          relate: {
            text: [
              "<b class='who'>Deepak</b> has a promotion review coming up. He's been avoiding drafting his self-review for a week — he knows roughly what he wants to say, he just hasn't opened the document. Last night he finally did, stayed up until 1am, and spent the whole time rewriting his one existing paragraph six times, second-guessing whether it sounded confident enough or arrogant instead."
            ]
          },
          think: {
            mode: 'open',
            prompt: "What's driving what, here — in your own words?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: "Same situation — Deepak's self-review.",
            prompt: 'In two or three sentences: design a full plan for Deepak — combine tools across both patterns if that’s what it takes, and be specific about what he does and when.',
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "Something like: “An if-then plan gets the first paragraph out of him at a set time tomorrow — then deliberate imperfection covers what happens after: he stops at a solid-not-polished version, sends it, and actually watches what the real outcome is, instead of guessing at it from inside a rewrite loop.”"
          },
          remember: {
            prompt: "In a sentence or two: which of the two patterns do you reach for tools on first, generally — and why do you think that's your instinct?",
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w5t3',
          title: "When it's the same task, both ways",
          role: 'Integration',
          delayedRef: 'w5t2_apply',
          delayedPrompt: 'Last touch, your plan for Deepak was:',
          relate: {
            text: [
              'A founder has been avoiding sending an investor pitch deck for two weeks — and the two evenings she did open it, she spent the whole time redesigning the same title slide, never getting past slide one to look at the rest.'
            ]
          },
          think: {
            mode: 'open',
            prompt: "What's happening across those two evenings — in your own words, not the module's?",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: 'Same situation — the investor deck.',
            prompt: "In two or three sentences: what would actually break this, and why that, not something else?",
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "There's no single right answer — the pattern worth noticing is that ‘open the deck and get past slide one’ and ‘stop redesigning slide one once you're there’ are two different problems that happen to share one task, and probably need two different tools, not one clever fix for both."
          },
          remember: {
            prompt: 'In a sentence or two: is there a task in your own life doing this same double act right now — avoided overall, but over-polished in the one part you do touch?',
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w5t4',
          title: 'One more, mixed',
          role: 'Integration',
          delayedRef: 'w5t3_apply',
          delayedPrompt: 'Last touch, you wrote this:',
          relate: {
            text: [
              'A student has been avoiding starting their part of a group project for over a week — and the one slide they did finish has been redesigned four times, while the rest of the deck, the parts that actually need starting, sit completely untouched.'
            ]
          },
          think: {
            mode: 'open',
            prompt: 'If you had to guess which pattern came first here, which would you guess — and what would you look for to check?',
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: 'Same situation — the group project.',
            prompt: "In two or three sentences: what's the one move that unblocks both parts of this, if there is one — and if there isn't, say so.",
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "Often the honest answer is that one move (a graded first step for the unstarted parts) doesn't automatically fix the other (the over-redesigned slide needs its own cost-benefit check or deliberate imperfection) — which is a fair thing to notice rather than force a single tidy fix that isn't really there."
          },
          remember: {
            prompt: "In a sentence or two: what's your instinct, generally — tackle the avoided part first, or the over-polished part first? What does that instinct usually cost you?",
            placeholder: 'Your answer...'
          }
        },
        {
          id: 'w5t5',
          title: 'Your own situation — nothing pre-walked',
          role: 'Transfer test',
          transferTest: true,
          delayedRef: 'w5t4_apply',
          delayedPrompt: 'Last touch, your instinct was:',
          relate: {
            text: [
              'This is the one part of the module built with no scaffolding at all.',
              "You've followed Ananya through a redone wedding invite and a redone report, and Arjun through an unopened tax form and an unopened proposal — and hopefully noticed the shape of both patterns showing up somewhere in your own week too, more than once.",
              "Now it's just yours. You've got a real situation right now — something you're either over-polishing or avoiding, maybe both, maybe you're not even sure which. Don't simplify it for us."
            ]
          },
          think: {
            mode: 'open',
            prompt: "Describe it in your own words — what's actually going on, as specifically as you can.",
            placeholder: 'Your answer...'
          },
          apply: {
            scenario: 'With nothing pre-walked this time.',
            prompt: "In two or three sentences: what's your actual next move, and why that one — which of the eight tools, and why not one of the others?",
            placeholder: 'Your answer...'
          },
          reveal: {
            text: "There's no single right answer here — this was the one part of the module deliberately built to have no signalled answer. What matters is whether your reasoning traces back to the eight tools from your theory grounding screen and Weeks 3–4, not whether it matches anyone else's."
          },
          remember: {
            prompt: 'In a sentence or two — what do you actually want to remember from this module, in your own words, not the module’s?',
            placeholder: 'Your answer...'
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
      scenario: "You've drafted a message to a group planning a friend's farewell. It says everything it needs to — you even had someone glance at it and say it read fine. You've still reopened it four times to reword the second line.",
      prompt: 'In two or three sentences: write two short columns — what redoing this gets you, and what it is actually costing you right now.',
      reveal: "The cost column is usually the thin one at first — time, a missed moment, the doubt itself lingering longer than the redoing ever resolves it. If it's genuinely thin, that's information too."
    },
    {
      code: 'A1',
      rep: 2,
      type: 'reflection',
      scenario: "A cover letter has been ready for two days; you keep reopening it to swap one adjective for another, even though the role's deadline is tomorrow morning.",
      prompt: 'In two or three sentences: write the cost-benefit columns for holding this standard on the cover letter.',
      reveal: "Something like: “Gets me: a little more confidence sending it. Costs me: two days, and the deadline getting closer with each swap.”"
    },
    {
      code: 'B4',
      rep: 1,
      type: 'reflection',
      scenario: "You keep not signing up for a class you said you wanted to take for months now — the form takes two minutes, and you're not fully sure why you haven't just done it.",
      prompt: 'In two or three sentences: write your two-column exploration — what avoiding this costs you, what starting would give you.',
      reveal: 'Costs of not signing up: staying stuck, some quiet resentment. What signing up gives: something genuinely yours, not tied to anyone else’s schedule.'
    },
    {
      code: 'B4',
      rep: 2,
      type: 'reflection',
      scenario: "You've been putting off a conversation about splitting costs with a roommate for weeks, unsure if it's even worth raising over what might be a small amount of money.",
      prompt: 'In two or three sentences: write the exploration in your own words.',
      reveal: 'Costs of not raising it: quiet resentment building. Benefits of raising it: clarity either way, even if the conversation is a bit awkward.'
    }
  ],
  toolsData: {
    standing_rule: {
      code: 'B3',
      title: 'Standing Rule',
      mechShort: 'Procrastination',
      kind: 'upsert',
      intro: "Instead of planning for one specific task, set a standing rule you can reuse for any avoided task — not tied to today's to-do list. Set it once, sharpen it whenever it stops feeling specific.",
      placeholder: 'If [specific cue], then I will [smallest possible first step]...',
      firstUseExample: "To start, something like: “If I open my to-do list and feel my stomach drop at a task, then I do the smallest possible first step within 10 minutes — whichever task it is.”",
      revisitTip: "Come back and sharpen this whenever it starts feeling vague — a rule that's gone vague usually needs a more specific cue, tied to a time, a feeling, or an action, not just ‘when I'm procrastinating.’"
    },
    tracking_log: {
      code: 'B1',
      title: 'Targeted Tracking Log',
      mechShort: 'Procrastination',
      kind: 'log_multi',
      intro: 'Not a journal — just three things, logged each time you catch yourself avoiding a task. Add a new entry whenever it happens, no fixed number of entries.',
      fields: [
        { key: 'task', label: 'The task', firstPlaceholder: 'e.g. Renewing car insurance', placeholder: 'Your answer...' },
        { key: 'firstStep', label: 'The smallest first step', firstPlaceholder: 'e.g. Open the insurer’s website', placeholder: 'Your answer...' },
        { key: 'when', label: 'When you’ll do it', firstPlaceholder: 'e.g. Tonight, after dinner', placeholder: 'Your answer...' }
      ]
    },
    five_minute: {
      code: 'B2',
      title: 'Five-Minute Commitment',
      mechShort: 'Procrastination',
      kind: 'log_single',
      intro: 'A running log, not a worksheet — every time a task feels too big, commit to just five minutes on it, with permission to stop after. Log it in one line, as fast as the habit itself.',
      logLabel: 'What you committed to, and when',
      firstPlaceholder: 'e.g. Five minutes tonight, right after dinner, just opening the document',
      placeholder: 'Your answer...'
    },
    compassion: {
      code: 'A4',
      title: 'Compassionate Insertion',
      mechShort: 'Perfectionism',
      kind: 'upsert_plus_log',
      intro: "A one-line compassionate-but-corrective phrase you say to yourself the moment you're being harsh about something imperfect. Set your line once, then log it each time you actually use it — said in the moment, not written about afterward.",
      linePlaceholder: "e.g. ‘That genuinely needed fixing, and I'm capable of fixing it — that's all this means.’",
      firstUseExample: "To start, something like: “A typo isn't a character flaw — fix it if it matters, and let the replaying stop there.”",
      logLabel: 'Log a use — what happened when you said it?',
      logPlaceholder: 'What happened...'
    },
    values_anchor: {
      code: 'A3',
      title: 'Values Anchor',
      mechShort: 'Perfectionism',
      kind: 'upsert',
      intro: 'Set the value that actually matters for tasks like this — reliable, present, thorough — once. Then just glance at it against any task, instead of rewriting it each time.',
      placeholder: 'The value that matters here: ...',
      firstUseExample: "To start, something like: “Reliable, not impressive — which asks for on-time and clear, not flawless.”",
      revisitTip: 'Come back and adjust this whenever a task doesn’t quite match the value you set — values can be specific to a domain (work vs. family vs. friendships).'
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
      { id: 'w1', prompt: 'How much has this issue affected you this week?', min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely' },
      { id: 'w2', prompt: 'How confident do you feel managing this issue this week?', min: 0, max: 10, minLabel: 'Not confident', maxLabel: 'Extremely confident' },
      { id: 'w3', prompt: "On how many days did you practice this week's activities?", min: 0, max: 7, minLabel: '0 days', maxLabel: '7 days' }
    ],
    endExtraQuestions: [
      { id: 'e6', prompt: 'Overall, how helpful was this program?', min: 1, max: 5, minLabel: 'Not at all helpful', maxLabel: 'Extremely helpful' }
    ],
    endChoice: {
      id: 'e7',
      prompt: 'What would you like to do next?',
      options: ['Finish here', 'Continue with another program', 'Talk to a therapist']
    }
  },
  escalationConfig: {
    systemPrompt: `You are a safety classifier inside a mental-health support app used in India. Classify the user's message into exactly one of: NONE, TIER1, TIER2.

TIER1 definition: Any statement connecting perceived failure or inadequacy to intent or a plan to end one's life or self-harm (“if I fail this I don't want to be here”, “I'd rather hurt myself than let people down”).
TIER2 definition: Persistent hopeless or worthless framing tied to task performance (“I'm worthless because I can't finish anything”, “I'm a burden to everyone”), or real signs of functional collapse — a job or degree genuinely at risk from prolonged avoidance, not just discomfort.

Critical context: many people, especially in Indian English, use hyperbolic or idiomatic self-deprecating language that is NOT a genuine risk signal — for example "I could kill myself for forgetting that", "this deadline is literally killing me", "I could just die of embarrassment", "I'm such a failure lol". Do NOT classify ordinary hyperbole, jokes, or figures of speech as TIER1 or TIER2, even if they contain words like "kill", "die", or "worthless". Only classify as TIER1 if there is a genuine indication of intent, a plan, or serious risk to the person's life or safety. Only classify as TIER2 if there is genuine persistent hopelessness/worthlessness tied to the person's sense of self, or real functional collapse — not a single offhand remark.

When genuinely uncertain between hyperbole and a real signal, prefer the lower tier (or NONE) rather than over-triggering — but never downgrade language that includes a specific plan, method, or timeframe.

Respond with ONLY a raw JSON object, no markdown fences, no other text: {"tier": "NONE" | "TIER1" | "TIER2", "reason": "one short clause"}`,
    tier1FallbackWords: ["going to kill myself", "planning to end my life", "don't want to wake up tomorrow", "have a plan to end my life", "going to end it all tonight"],
    tier2FallbackWords: ["i am worthless", "i feel like a burden to everyone", "i hate who i am", "there is no point in trying anymore"]
  }
};
