import { ModuleContent } from '../../../types/moduleContent';

function opt(label: string, isTarget: boolean, explain: string) {
  return { label, isTarget, explain };
}

export const MODULE_3_CONTENT: ModuleContent = {
  moduleId: 'M3',
  slug: 'anxiety-worry',
  name: 'Anxiety & Worry',
  tier: 'Common · ₹499 · Self domain',
  duration_weeks: 9,
  brief: {
    moduleName: 'Anxiety & Worry',
    tier: 'Common · ₹499 · Self domain',
    mechanisms: [
      {
        key: 'A',
        name: 'Overthinking & Rumination',
        short: 'Rumination',
        def: "Getting stuck replaying something that's already happened — a message, a conversation, a decision — turning it over and over without producing anything new. It feels like still working on the problem. Mostly it's just the same scene running again.",
        need: 'Mental rest, closure',
        contrast: {
          who: 'Priyanka',
          text: 'sends a slightly informal reply to a client, checks the thread once about twenty minutes later, and when there is no response, actually puts her phone down and moves to her next task — not because she stopped caring, but because one check was enough.'
        },
        techniques: [
          {
            code: 'A1',
            approach: 'CBT (stimulus control)',
            format: 'A',
            name: 'Scheduled Worry-Time',
            source: 'Thomas Borkovec',
            what: 'Setting a fixed, short daily window — same time, same length, maybe 15 minutes — as the only place worrying and replaying is allowed to happen. Outside that window, a ruminative thought gets noted and deliberately postponed to the window, not engaged with immediately.',
            how: 'Rumination feels urgent in the moment, like it has to be dealt with right now. Containing it to one predictable window breaks that false urgency — most thoughts that felt unbearable at 11pm feel much smaller by the next day’s window, and some don’t even show up again.',
            why: 'This is the foundational technique for this mechanism — it doesn’t stop rumination from starting, but it stops it from being allowed to run all day, which is what most of the other tools depend on having room to work.'
          },
          {
            code: 'A2',
            approach: 'MCT',
            format: 'B',
            guardrail: true,
            name: 'Attention Training Technique',
            source: 'Adrian Wells, Metacognitive Therapy',
            what: 'A structured listening exercise — deliberately shifting attention between different external sounds in the room, then dividing attention across all of them at once — practiced regularly, away from any specific worry.',
            how: "Rumination runs on attention being stuck internally, locked onto one's own thoughts. This technique trains attention itself to move on command, as a general skill — not by arguing with the content of any particular thought.",
            why: 'Taught together with Detached Mindfulness, directly below — this technique builds the raw attentional flexibility that the next one then applies specifically to ruminative thoughts.'
          },
          {
            code: 'A3',
            approach: 'MCT',
            format: 'B',
            guardrail: true,
            name: 'Detached Mindfulness',
            source: 'Adrian Wells, Metacognitive Therapy',
            what: "Noticing a ruminative thought arrive, and deliberately not engaging with it — not arguing with it, not trying to solve it, not pushing it away either. Just letting it be present and pass, the way you'd notice a sound outside without following it.",
            how: 'Rumination survives on engagement — every attempt to resolve, argue with, or suppress a thought keeps it active. Detached mindfulness removes the engagement itself, which is often what actually lets a thought fade.',
            why: 'Directly builds on the attentional control just practiced in the Attention Training Technique — taught in the same touch since MCT teaches them as one sequence, not two separate skills.'
          },
          {
            code: 'A4',
            approach: 'CBT',
            format: 'A',
            name: 'Thought Records for Ruminative Predictions',
            source: 'Aaron Beck',
            what: 'Writing down the specific prediction a bout of rumination is actually built on — “they’ll think I’m rude,” “she’s upset with me” — and then checking it against real, available evidence, the way you’d test any other claim.',
            how: 'Rumination often feels like careful thinking, but it rarely tests anything — it just repeats the same worry. Writing the actual prediction down and checking it against evidence does what the repetition never did.',
            why: 'Where scheduled worry-time contains rumination, this gives the contained time something productive to do, instead of just replaying the same loop inside the window too.'
          },
          {
            code: 'A5',
            approach: 'MBSR',
            format: 'A',
            name: 'Mindful Noting / Labelling',
            source: 'Jon Kabat-Zinn, MBSR',
            what: 'A quick, in-the-moment label — mentally saying “thinking, thinking” or “replaying, replaying” the instant a ruminative loop starts — rather than following where the thought’s content wants to take you.',
            how: 'Naming a thought as “just thinking” shifts you from being inside the loop to noticing the loop, which is often enough to interrupt it — without needing the time or space a full thought record takes.',
            why: 'The fastest tool of the five — useful the instant a loop starts, before there’s time to reach for anything else.'
          }
        ]
      },
      {
        key: 'B',
        name: 'Generalised Anxiety',
        short: 'GAD',
        def: 'A constant, diffuse “what if” running across many areas of life at once — health, money, family, work — rarely settling on one thing long enough to resolve it, and rarely staying quiet even when nothing is actually wrong right now.',
        need: 'Certainty, safety',
        contrast: {
          who: 'Rahul',
          text: 'notices a real worry about a client presentation going wrong, checks what he can actually control about it, prepares for that specific part, and then stops thinking about the parts that are genuinely out of his hands.'
        },
        techniques: [
          {
            code: 'B1',
            approach: 'CBT (worry-control)',
            format: 'A',
            name: 'The Worry Decision-Tree',
            source: "Thomas Borkovec's worry-control protocol",
            what: 'Sorting a worry into one of two categories — solvable right now, or not — and responding differently to each: solvable worries get one concrete next step; unsolvable ones get deliberately set aside, on purpose, not suppressed.',
            how: "GAD's “what if” chains treat every worry the same way, whether or not anything can actually be done about it. Sorting first stops energy from going into worries that no amount of thinking will resolve.",
            why: 'The diagnostic first step for this mechanism — it decides which of the other tools below is even the right one to reach for.'
          },
          {
            code: 'B2',
            approach: 'CBT (GAD model)',
            format: 'B',
            guardrail: true,
            name: 'Intolerance-of-Uncertainty Exercise',
            source: 'Michel Dugas & Robert Ladouceur',
            what: 'Deliberately sitting with a real, current “what if” — on purpose, without seeking reassurance, without researching it further, without trying to resolve it right now — to practice tolerating the uncertainty itself rather than eliminating it.',
            how: 'GAD is maintained less by the worries themselves and more by an underlying belief that uncertainty itself is intolerable and must be resolved. Practicing sitting with it, deliberately, is what actually weakens that belief.',
            why: 'Because this asks you to sit with real discomfort on purpose rather than resolve it, it ships with the same guardrails as any [B] technique — a choice of intensity, and a check-in afterward.'
          },
          {
            code: 'B3',
            approach: 'Applied Relaxation',
            format: 'A',
            name: 'Progressive Muscle Relaxation',
            source: "Lars-Göran Öst, building on Edmund Jacobson's original PMR",
            what: 'Systematically tensing and then releasing each major muscle group in turn, noticing the contrast between the two states — a physical routine practiced regularly, not just pulled out during a bad moment.',
            how: 'Chronic worry keeps the body in a low-grade state of physical tension most of the time, which itself feeds the sense that something is wrong. Regular practice lowers that baseline tension, independent of what’s being worried about.',
            why: 'The one tool here that works on the body directly rather than the thought — useful precisely because GAD often shows up as physical tension before it shows up as a specific worry.'
          },
          {
            code: 'B4',
            approach: 'ACT',
            format: 'A',
            name: 'Acceptance-of-Uncertainty & Defusion',
            source: 'Steven Hayes, ACT',
            what: "Noticing a “what if” thought as just a thought passing through — “I'm having the thought that something might go wrong” — and choosing to act on what actually matters anyway, without waiting for the uncertainty to resolve first.",
            how: 'GAD often waits for certainty before allowing action or rest. Defusion doesn’t try to remove the uncertainty — it changes the relationship to it, so it stops being a precondition for moving forward.',
            why: 'The tool for the worries the decision-tree sorts as genuinely unsolvable — not fixable, but livable alongside.'
          }
        ]
      },
      {
        key: 'C',
        name: 'Panic Attacks',
        short: 'Panic',
        def: 'A sudden surge of intense fear accompanied by real physical sensations — racing heart, breathlessness, dizziness — that gets catastrophically misread as a sign of imminent danger (a heart attack, fainting, losing control), which then makes the sensations themselves worse.',
        need: 'Physical safety',
        contrast: {
          who: 'Ananya',
          text: 'notices her heart racing and her hands going cold right before walking into a big presentation, recognises it as adrenaline doing exactly what adrenaline does before something high-stakes, and walks in anyway.'
        },
        techniques: [
          {
            code: 'C1',
            approach: 'Cognitive model of panic',
            format: 'A',
            name: 'Psychoeducation on the Panic Cycle',
            source: "David M. Clark's cognitive model of panic",
            what: 'Learning the actual mechanics of a panic attack — a bodily sensation gets catastrophically misread (“my heart’s racing, I must be having a heart attack”), the misreading itself produces more adrenaline, which produces more sensation, which confirms the fear — a self-feeding loop, not an actual medical emergency.',
            how: 'Panic feels like proof that something is going seriously wrong physically. Understanding the actual cycle — that the sensations are frightening but not dangerous — is often what stops the loop from feeding itself as hard the next time.',
            why: 'The foundational piece for this mechanism — the other two tools only work once the cycle itself is understood, not fought against as if it were a real medical crisis.'
          },
          {
            code: 'C2',
            approach: 'Panic Control Treatment',
            format: 'A',
            name: 'Diaphragmatic / Slow Breathing Retraining',
            source: 'David Barlow',
            what: 'Deliberately slowing and deepening breathing — breathing from the diaphragm rather than the chest — practiced regularly when calm, so it’s already familiar and available the moment a panic sensation starts.',
            how: 'Panic often includes real over-breathing, which itself produces sensations (dizziness, tingling, breathlessness) that get misread as danger. Slowing the breath directly interrupts that physical feedback loop, not just the fear about it.',
            why: 'The most immediately usable tool of the three — practiced daily so it’s already automatic by the time a real moment needs it.'
          },
          {
            code: 'C3',
            approach: 'Panic Control Treatment',
            format: 'B',
            guardrail: true,
            name: 'Situational Exposure to Avoided Triggers',
            source: 'David Barlow, PCT',
            what: 'Deliberately entering a real situation that’s currently being avoided because of panic fear — a crowded train, a lift, a queue — to test whether the feared outcome (fainting, losing control, a heart attack) actually happens.',
            how: 'Avoiding panic triggers shrinks what feels safe over time, and never actually tests whether the feared outcome is real. Deliberately entering the situation, once, gives disconfirming evidence avoidance never can.',
            why: 'Because this asks you to face a real avoided situation, not just reflect on it, it ships with the same guardrails as any [B] technique — a choice of intensity, and a check-in right after.'
          },
          {
            code: 'C4',
            approach: 'Panic Control Treatment',
            format: 'C',
            name: 'Interoceptive Exposure',
            source: 'David Barlow, PCT',
            what: 'A structured programme, normally run with a therapist, of deliberately inducing the physical sensations of panic on purpose — spinning in a chair to induce dizziness, breathing through a straw to induce breathlessness — to break the link between the sensation itself and the fear of it, independent of any real-world trigger.',
            how: 'This works by repeatedly proving, under controlled conditions, that the sensations themselves are not dangerous — which requires deliberately inducing real physical distress in a paced, monitored way.',
            why: "Genuinely effective for panic that's become sensitised to the sensations themselves, not just specific situations — but deliberately inducing panic-like sensations on purpose isn't something to attempt alone, without someone monitoring the response.",
            professionalNote: "A therapist trained in Panic Control Treatment (Barlow's protocol) can select and pace interoceptive exercises safely, and knows when a sensation crosses from 'uncomfortable but useful' into something to stop. If panic attacks are frequent, or fear of the sensations themselves (not just specific places) is the main problem, this is specifically worth raising with them."
          }
        ]
      },
      {
        key: 'D',
        name: 'Intrusive Thoughts (OCD-pattern)',
        short: 'Intrusive Thoughts',
        def: 'Unwanted, repetitive thoughts, images, or doubts — often about harm, contamination, or having made a serious mistake — that feel urgent and highly distressing specifically because they run against what the person actually wants, followed by checking or mental rituals meant to neutralise the doubt.',
        need: 'Certainty, moral safety',
        contrast: {
          who: 'Ritu',
          text: 'feels the same jolt of doubt — did I actually lock the door — checks it once on her way out, and then, notably, lets the thought go rather than replaying whether the one check was really thorough enough.'
        },
        techniques: [
          {
            code: 'D1',
            approach: 'Cognitive theory of OCD',
            format: 'A',
            name: 'Cognitive Restructuring of Inflated Responsibility',
            source: "Paul Salkovskis's cognitive theory of OCD",
            what: 'Directly examining the belief underneath a checking urge — usually some version of “if I don’t check, and something goes wrong, it’s entirely my fault” — and testing how much responsibility is actually yours to carry, versus how much the thought is claiming by default.',
            how: "The distress in this pattern usually isn't really about the doubt itself — it's about an inflated sense of personal responsibility for anything that could possibly go wrong. Naming and testing that belief directly is what the checking itself never resolves.",
            why: "The foundational tool for this mechanism — it targets the belief that's actually driving the checking, not just the checking behaviour itself."
          },
          {
            code: 'D2',
            approach: 'ACT',
            format: 'A',
            name: 'Defusion from Intrusive-Thought Content',
            source: 'Steven Hayes, ACT',
            what: 'Noticing an intrusive thought or image as just mental content passing through — not a signal, not a prediction, not a reflection of character — without needing to check whether it’s true, argue with it, or act on it in any way.',
            how: "Intrusive thoughts get their force from being treated as meaningful — as if having the thought says something real about intent or risk. Defusion doesn't try to make the thought stop; it changes what having it is taken to mean.",
            why: "Works alongside D1 from a different angle — D1 tests the responsibility belief with evidence, this one lowers the thought's grip without needing evidence at all, which matters because the content itself often can't be checked away."
          },
          {
            code: 'D3',
            approach: 'ERP',
            format: 'C',
            name: 'Exposure and Response Prevention with a Graded Hierarchy',
            source: "Edna Foa & Michael Kozak, building on Victor Meyer's original ERP work",
            what: 'A structured programme, normally run with a therapist, of deliberately facing triggers that provoke the intrusive thought — ranked from easiest to hardest — while resisting the urge to check or perform the neutralising ritual, until the urge itself weakens.',
            how: 'This works by breaking the link between the trigger and the relief that checking provides — which requires real, sustained exposure without the escape hatch, something that needs careful pacing and support to do safely.',
            why: "Genuinely the most effective known treatment for this pattern when it's frequent or disruptive — but deliberately resisting a strong urge, repeatedly, without support, isn't something to attempt alone from an app.",
            professionalNote: 'A licensed therapist trained in ERP (often within a broader CBT or OCD-specialist practice) can build and pace a hierarchy safely. If checking, mental reviewing, or reassurance-seeking is happening daily, or is costing real time or function, that’s specifically worth raising with them — this is a well-established, effective treatment, not a last resort.'
          },
          {
            code: 'D4',
            approach: 'ERP',
            format: 'C',
            name: 'Ritual / Compulsion Delay',
            source: "Edna Foa's ERP protocol",
            what: 'Deliberately delaying a checking or neutralising ritual for a set period after the urge appears — not refusing it outright, just postponing it — to weaken the automatic link between the urge and immediate relief-seeking.',
            how: 'Checking works because it provides fast relief, which reinforces checking again next time. A structured delay interrupts that fast reinforcement loop, but needs real practice and pacing to build up safely.',
            why: 'A gentler entry point than full ERP, but still something a professional should help pace — delaying alone, without guidance on how to handle the urge that shows up during the delay, can backfire into more distress rather than less.',
            professionalNote: 'Best introduced and paced by a professional experienced with OCD, often as an early step before or alongside a full ERP hierarchy.'
          }
        ]
      }
    ],
    scenarioSource: 'Pan-India, English-medium context',
    escalation: {
      tier1: "Any statement connecting rumination, worry, panic, or intrusive thoughts to intent or a plan to end one's life or self-harm (“I can't take this anymore, I want it to just stop for good”, “I have a way to end it”).",
      tier2: "Persistent hopelessness about the anxiety itself ever improving (“this is never going to get better, I can't live like this”), or real signs of functional collapse — not leaving the house at all, missing work repeatedly, checking rituals consuming hours a day — not just frequent worry or occasional avoidance."
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
        "Two techniques in this module (you'll see them marked clearly when they come up) are explained but not practiced here — they genuinely work better with a licensed therapist involved, and we say so rather than pretending otherwise.",
        "If you're in crisis right now, don't wait for this module to help. Reach out immediately — the button below is always here if you need it."
      ],
      cta: 'Continue',
      crisisButton: true
    },
    {
      eyebrow: 'Why this module',
      title: "Why we're suggesting this one",
      body: [
        "You told us you're dealing with a mind that won't stop replaying things, a constant low hum of ‘what if,’ panic that shows up in your body, unwanted thoughts you can't switch off — maybe all four, maybe one that's loudest right now.",
        "This module is built for exactly that — four specific patterns, each with its own real evidence-based tools, not one blended ‘manage your stress’ module."
      ],
      cta: 'Continue'
    },
    {
      eyebrow: 'What to expect',
      title: 'The next 9 weeks',
      body: [
        'Short term: a new touch on weekdays, a few minutes each, real scenarios close to your own week — your own words, not a quiz to pass or fail. Weekends bring a short summary, not new content.',
        "Long term, honestly: this won't make overthinking, worry, panic, or intrusive thoughts disappear. What it can realistically offer is 14 specific, evidence-based tools — plus two more explained clearly but best explored with a professional — and enough practice noticing each pattern that you reach for the right tool sooner. That's the actual promise here, not more than that."
      ],
      cta: 'Continue'
    },
    {
      eyebrow: 'Theory grounding',
      title: 'The tools everything here is built on',
      body: [
        'Each of these four patterns has more than one real, evidence-based approach behind it — so instead of blending them into one vague idea, each approach gets its own tool and its own touch.',
        'You won’t use any of these in Weeks 1–4 — those four weeks are just about being able to spot each pattern clearly, on its own, before any tool gets layered on top. Weeks 5–8 bring these back, one at a time, matched to exactly what you will have just learned to recognise. Two techniques below are marked differently — they’re explained here, but the app won’t walk you through practicing them alone.'
      ],
      theory: true,
      cta: 'Start Week 1'
    }
  ],
  weeks: [
    // WEEK 1
    {
      num: 1,
      title: 'Overthinking: recognising the pattern',
      mechanism: 'A',
      kind: 'blocked',
      retrievalCheck: null,
      touches: [
        {
          id: 'w1t1',
          title: 'Recognition — the client message',
          role: 'Recognition #1',
          noDelayed: true,
          relate: {
            text: [
              "Quick note before we start: this week and the next three aren't about any of the tools from before — none of them show up yet. First, you need to be able to spot each pattern clearly. The tools come in Weeks 5–8, matched one at a time to what you'll have learned to recognise.",
              'This week’s pattern has a name: <b>overthinking and rumination</b>. In simple terms: getting stuck replaying something that’s already happened, turning it over and over, mistaking the repetition itself for actually working on the problem.',
              "Here’s what that looks like. <b class='who'>Arjun</b> sends a slightly blunt message to a client late one evening — he was rushing to get it out before he lost the thread of his own thought. He then spends the next two hours re-reading it, imagining exactly how it landed, drafting and deleting three different ‘sorry if that came across wrong’ follow-ups without sending any of them."
            ]
          },
          think: {
            mode: 'tap',
            prompt: "Which of these actually explains what's happening? More than one will sound reasonable.",
            options: [
              opt("He's replaying something already sent and unchangeable, mistaking the repetition for actually fixing it", true, "Right — the message is already sent. Nothing about re-reading it changes what the client received. The two hours produced three unsent drafts, not one new piece of information."),
              opt("He's being conscientious — checking his tone with clients matters", false, "Checking tone before sending is genuinely reasonable. But the message is already gone — this isn't checking anymore, it's replaying something no longer in his control."),
              opt("He's being indecisive about whether to send a follow-up", false, "There's a real follow-up decision buried in here somewhere, but that's not actually what two hours of re-reading is doing — the loop isn't weighing send-or-not, it's just re-running the same scene.")
            ],
            whyPrompt: "In a few words — what's the giveaway that it's the first one, not the other two?"
          },
          apply: {
            scenario: "Same pattern, a different person: Divya texts her manager a slightly informal reply on a work thread, and spends her entire commute home replaying whether it read as too casual.",
            prompt: "Same thing happening here. In two or three sentences: what would you actually say to Divya right now?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “The reply's already sent — your manager either noticed the tone or didn't, and replaying it on the commute won't change which. If it's actually bothering you, one quick check tomorrow is worth more than an hour of guessing tonight.”"
          },
          remember: {
            prompt: "In a sentence or two: think of a real moment this applies to you — what's something you've replayed that was already finished and out of your hands?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t2',
          title: 'Recognition — a comment at home',
          role: 'Recognition #2',
          delayedRef: 'w1t1_apply',
          delayedPrompt: 'Last touch, on Divya, you wrote this:',
          relate: {
            text: [
              "Same Arjun, a few days later. At dinner, he offhandedly teases his mother about a dish being a bit too salty — she laughs it off in the moment, but he thinks he catches a half-second pause before she does. He spends the rest of the evening, and most of the next morning, replaying that half-second, turning it over from every angle.",
              'Notice what’s carried over: the replaying was never really about the message or the joke. It followed him from a screen at 11pm straight into a dinner table with people who love him.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What's actually happening at dinner? Read all three carefully.",
            options: [
              opt("He's treating one half-second pause as if reviewing it enough times will produce a definite verdict, when it can't", true, "Right — a half-second is genuinely ambiguous, and no amount of replaying manufactures certainty out of ambiguity. The loop isn't finding an answer; it's just running."),
              opt("Family reactions genuinely matter more, so it makes sense he's more bothered by this one", false, "Family moments can carry real weight — but notice that isn't actually what's driving two hours of replay here. The half-second pause itself is too small and ambiguous to be doing that much work."),
              opt("He should just apologise to his mother to be safe", false, "This sounds responsible, but notice it skips the actual question — whether there's anything to apologise for at all. Apologising for an ambiguous half-second is still reacting to the loop, not checking it.")
            ],
            whyPrompt: "In a few words — what makes this the same pattern as the message, just in a different room?"
          },
          apply: {
            scenario: "A different person, same shape of moment: Kunal makes a joke at a friend's expense during a group dinner — the friend laughs along at the time — and Kunal spends the drive home replaying whether the laugh was genuine or just polite.",
            prompt: "In two or three sentences: what's actually going on for Kunal, and why might one ambiguous laugh feel like it needs solving?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “A laugh in the moment isn't proof either way — it's just a laugh. Kunal's own replaying is trying to extract a verdict from something that was never detailed enough to give one.”"
          },
          remember: {
            prompt: "In a sentence or two: where does this show up for you — with family, at work, or both — and what small, ambiguous moment tends to get the replay treatment?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t3',
          title: 'What the replaying is actually for',
          role: 'Functional logic',
          delayedRef: 'w1t2_apply',
          delayedPrompt: 'Last touch, you wrote this:',
          relate: {
            text: [
              "Between the message and the dinner table, there's a pattern worth naming honestly: the replaying feels like it's still working on the problem — like careful thinking that just hasn't finished yet.",
              'What it actually produces is different from what it feels like it’s producing: no new information appears from replaying an already-finished moment. The scene is the same each time — only the time spent on it changes.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What is the replaying actually doing? These are close — think it through.",
            options: [
              opt("Running the same fixed scene again without generating any new information, while feeling like productive problem-solving", true, "That's the real function — it feels like diligence, but nothing changes between the first replay and the fiftieth. There's no new evidence to find in a scene that's already over."),
              opt("Helping him learn from the moment so it doesn't happen again", false, "Learning from a moment usually takes one honest look, not fifty replays of an unchanging scene. If anything is being learned here, it happened in the first few seconds — not the two hours after."),
              opt("Making sure he takes it seriously enough to actually care", false, "He clearly already cares — that's not in question. The replaying isn't proving how much it matters to him; it's just using up time without resolving anything.")
            ],
            whyPrompt: "In a few words — why doesn't replaying a finished moment actually produce anything new?"
          },
          apply: {
            scenario: "A friend watching Arjun re-read the client message for the sixth time finally asks: ‘Has anything about it changed since the first time you read it?’ Arjun pauses. ‘No. It's the exact same message.’",
            prompt: "That's usually the tell. In two or three sentences: think of something you've replayed recently — had anything about it actually changed by the tenth time you went over it?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer here — the pattern to notice is whether each replay produced something genuinely new, or whether it was the same fixed scene running again."
          },
          remember: {
            prompt: "In a sentence or two: what does the replaying usually feel like for you, right before you notice you've been doing it for a while?",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t4',
          title: 'What handling it differently looks like',
          role: 'Contrast / boundary case',
          delayedRef: 'w1t3_apply',
          delayedPrompt: 'Last touch, you named this:',
          relate: {
            text: [
              "Here's what the same kind of moment looks like for someone who isn't caught in the pattern.",
              "<b class='who'>Priyanka</b> sends a slightly informal reply to a client. About twenty minutes later, she checks the thread once, out of genuine curiosity about the response. There isn't one yet. She puts her phone down and moves to her next task.",
              'This is the module’s contrast case for this pattern: a real, brief moment of wondering how it landed, one check, and then an actual stop — not the absence of any concern at all, but concern that doesn’t loop.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What actually makes Priyanka's response different from Arjun's? All three can look similar in the moment.",
            options: [
              opt("Hers was one bounded check followed by a genuine stop; his kept replaying with no check at all, just internal review", true, "That's the real difference — not whether she wondered about it, but that wondering had a single, bounded action attached, and then it actually ended."),
              opt("She just doesn't care as much about how her messages land", false, "There's no evidence for that — she checked the thread specifically because she was curious how it landed. Caring and looping aren't the same thing; she cared and still stopped."),
              opt("Her message wasn't actually informal enough to be a real concern", false, "The scenario doesn't say that — she herself flagged it as slightly informal. The difference isn't how big the concern was; it's what she did with it afterward.")
            ],
            whyPrompt: "In a few words — how would you know, in the moment, which one you're doing?"
          },
          apply: {
            scenario: "A colleague asks Priyanka how she doesn't spiral after sending something slightly off. She says: ‘I check once if I'm actually curious, and if there's nothing new to see, I just... stop checking. There's nothing left to find.’",
            prompt: "In two or three sentences: think of a time you sent or said something and wondered how it landed — did you check once and stop, or keep going back to it? What told you which one it was?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "There's no single model answer — the useful pattern is noticing whether the checking had a clear end point, or kept regenerating itself with nothing new to actually check."
          },
          remember: {
            prompt: "In a sentence or two: name one thing you could do, like Priyanka, to let one check actually be the last one.",
            placeholder: "Your answer..."
          }
        },
        {
          id: 'w1t5',
          title: 'What actually happened',
          role: 'Reinforcing rep',
          delayedRef: 'w1t4_apply',
          delayedPrompt: 'Last touch, your idea was:',
          relate: {
            text: [
              'One more, and then a small piece of what actually happened to Arjun.',
              "The next morning, the client replied — completely unaffected, just answering the actual question in the message, no mention of tone at all. Two hours of replaying had been spent on a version of events that never happened outside Arjun's own head.",
              'That’s not a coincidence, and it previews the tools coming in Week 5: most rumination is running on a prediction that’s never actually been checked against what really happens. Arjun found out by accident — the tools ahead make that checking deliberate.'
            ]
          },
          think: {
            mode: 'tap',
            prompt: "What does the client's actual reply tell us about the two hours Arjun spent the night before?",
            options: [
              opt("The two hours were spent responding to an imagined version of events, not the real one", true, "Right — nothing in the client's actual reply matched what Arjun had been bracing for. The replaying was reacting to a scenario his own mind had built, not to anything real."),
              opt("Arjun got lucky this time, but the client could have reacted badly", false, "Possibly true in some other instance — but notice that's not actually what happened here, and the replaying wasn't tracking that real possibility either. It was running the same fixed worst-case, not weighing real odds."),
              opt("The client just didn't read the message carefully enough to notice the tone", false, "There's no evidence for that, and it's actually a way of keeping the original fear alive by reframing the good outcome as a fluke rather than the more likely one.")
            ],
            whyPrompt: "In a few words — why does an unchecked prediction do so much of rumination's work?"
          },
          apply: {
            scenario: "A different person, same shape of morning-after: Rohit spent an evening replaying an interview answer he gave, convinced it sounded unprepared — the recruiter emails the next day simply confirming the next round, with no mention of anything being off.",
            prompt: "In two or three sentences: what does Rohit's actual email tell him about the story he was replaying the night before?",
            placeholder: "Your answer..."
          },
          reveal: {
            text: "Something like: “The recruiter's email is responding to the real interview, not the version Rohit spent the evening replaying — and the two turned out to be quite different.”"
          },
          remember: {
            prompt: "In a sentence or two: think of a time a replayed worry turned out to not match what actually happened next — what was the gap?",
            placeholder: "Your answer..."
          }
        }
      ],
      summary: 'This week: overthinking and rumination — getting stuck replaying something already finished, mistaking the repetition for progress. Next week: a different pattern, generalised anxiety, which runs on the future instead of the past.'
    },

    // WEEKS 2 - 9 (Rendered dynamically from complete imported dataset structure)
    { num: 2, title: 'Generalised Anxiety: recognising the pattern', mechanism: 'B', kind: 'blocked', retrievalCheck: null, touches: [], summary: null },
    { num: 3, title: 'Panic Attacks: recognising the pattern', mechanism: 'C', kind: 'blocked', retrievalCheck: null, touches: [], summary: null },
    { num: 4, title: 'Intrusive Thoughts: recognising the pattern', mechanism: 'D', kind: 'blocked', retrievalCheck: null, touches: [], summary: null },
    { num: 5, title: 'Overthinking: five tools, and a plan', mechanism: 'A', kind: 'technique', retrievalCheck: { prompt1: 'Test prompt 1', prompt2: 'Test prompt 2', reveal: 'Test reveal' }, touches: [], summary: null },
    { num: 6, title: 'Generalised Anxiety: four tools, and a plan', mechanism: 'B', kind: 'technique', retrievalCheck: null, touches: [], summary: null },
    { num: 7, title: 'Panic Attacks: four tools, and a plan', mechanism: 'C', kind: 'technique', retrievalCheck: null, touches: [], summary: null },
    { num: 8, title: 'Intrusive Thoughts: four tools, and a plan', mechanism: 'D', kind: 'technique', retrievalCheck: null, touches: [], summary: null },
    { num: 9, title: 'Integration & transfer', mechanism: 'all', kind: 'integration', retrievalCheck: { prompt1: 'Test prompt 1', prompt2: 'Test prompt 2', reveal: 'Test reveal' }, touches: [], summary: null }
  ],
  reinforcementBank: [
    { code: 'A1', rep: 1, type: 'reflection', scenario: 'You catch yourself replaying a conversation with a coworker.', prompt: 'In two or three sentences, write two columns...', reveal: 'Notice the pattern...' },
    { code: 'A4', rep: 1, type: 'reflection', scenario: 'You are predicting someone is upset with you.', prompt: 'Write the prediction down...', reveal: 'Evidence shows...' },
    { code: 'B1', rep: 1, type: 'reflection', scenario: 'A worry about your health keeps recurring.', prompt: 'Use the worry decision tree...', reveal: 'Is it solvable right now?' },
    { code: 'B4', rep: 1, type: 'reflection', scenario: 'You are worried about an upcoming trip.', prompt: 'Write an acceptance line...', reveal: 'Defusion helps...' },
    { code: 'C1', rep: 1, type: 'reflection', scenario: 'Your heart beats fast before a talk.', prompt: 'Explain the panic cycle...', reveal: 'Adrenaline is normal...' },
    { code: 'C2', rep: 1, type: 'reflection', scenario: 'You feel breathless during a stressful meeting.', prompt: 'Log slow breathing practice...', reveal: 'Diaphragmatic breathing lowers tension...' },
    { code: 'D1', rep: 1, type: 'reflection', scenario: 'You feel an urge to check if you locked the door.', prompt: 'Test the responsibility belief...', reveal: 'Responsibility is shared...' },
    { code: 'D2', rep: 1, type: 'reflection', scenario: 'An unwanted image crosses your mind.', prompt: 'Apply defusion to the content...', reveal: 'Thoughts are not actions...' }
  ],
  toolsData: {
    worry_time: { code: 'A1', title: 'Scheduled Worry-Time', mechShort: 'Rumination', kind: 'upsert', intro: 'Set a 15-minute daily window...' },
    attention_training: { code: 'A2', title: 'Attention Training', mechShort: 'Rumination', kind: 'log_single', intro: 'Practice shifting attention...' },
    decision_tree: { code: 'B1', title: 'Worry Decision Tree', mechShort: 'GAD', kind: 'log_multi', intro: 'Sort worries into solvable vs unsolvable...' },
    pmr: { code: 'B3', title: 'Progressive Muscle Relaxation', mechShort: 'GAD', kind: 'log_single', intro: 'Routine muscle relaxation...' },
    panic_psychoeducation: { code: 'C1', title: 'Panic Cycle Model', mechShort: 'Panic', kind: 'upsert', intro: 'Understand the panic feedback loop...' },
    slow_breathing: { code: 'C2', title: 'Slow Breathing Retraining', mechShort: 'Panic', kind: 'log_single', intro: 'Diaphragmatic breathing routine...' },
    responsibility_restructuring: { code: 'D1', title: 'Inflated Responsibility Restructuring', mechShort: 'Intrusive Thoughts', kind: 'upsert', intro: 'Test the responsibility belief...' },
    thought_defusion: { code: 'D2', title: 'Thought Defusion', mechShort: 'Intrusive Thoughts', kind: 'log_single', intro: 'Notice thoughts as mental content...' },
    values_anchor: { code: 'B4', title: 'Values Anchor', mechShort: 'GAD', kind: 'upsert', intro: 'Anchor to core values...' }
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

TIER1 definition: Any statement connecting rumination, worry, panic, or intrusive thoughts to intent or a plan to end one's life or self-harm (“I can't take this anymore, I want it to just stop for good”, “I have a way to end it”).
TIER2 definition: Persistent hopelessness about the anxiety itself ever improving (“this is never going to get better, I can't live like this”), or real signs of functional collapse — not leaving the house at all, missing work repeatedly, checking rituals consuming hours a day — not just frequent worry or occasional avoidance.

Critical context 1: many people, especially in Indian English, use hyperbolic or idiomatic self-deprecating language that is NOT a genuine risk signal — for example "I could kill myself for forgetting that", "this deadline is literally killing me", "my heart is racing so much I feel like I'm going to die" (a panic-attack description, not a risk signal).
Critical context 2 (specific to this module): this module explicitly teaches recognition of unwanted, ego-dystonic intrusive thoughts — including thoughts about harm — as a normal anxiety pattern. A user describing a disturbing thought they do NOT want, are frightened BY, or are asking how to stop ("I had a horrible thought about swerving the car and it scared me") is the module working exactly as intended — classify as NONE.

Respond with ONLY a raw JSON object, no markdown fences, no other text: {"tier": "NONE" | "TIER1" | "TIER2", "reason": "one short clause"}`,
    tier1FallbackWords: ["going to kill myself", "planning to end my life", "don't want to wake up tomorrow", "have a plan to end my life", "going to end it all tonight"],
    tier2FallbackWords: ["i am worthless", "i feel like a burden to everyone", "i hate who i am", "there is no point in trying anymore", "i can't live like this"]
  }
};
