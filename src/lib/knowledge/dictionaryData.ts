export const FAMILIES = [
  {name:"Sadness",  group:"difficult", color:"#378ADD", bg:"#E6F1FB", icon:"ti-cloud-rain",    desc:"Loss · longing · heaviness",             emotions:["Sadness","Grief","Loneliness"]},
  {name:"Fear",     group:"difficult", color:"#7F77DD", bg:"#EEEDFE", icon:"ti-alert-circle",  desc:"Worry · dread · pressure",               emotions:["Anxiety","Fear","Overwhelm"]},
  {name:"Anger",    group:"difficult", color:"#E24B4A", bg:"#FCEBEB", icon:"ti-flame",         desc:"Injustice · frustration · bitterness",   emotions:["Anger","Frustration","Resentment"]},
  {name:"Shame",    group:"difficult", color:"#D85A30", bg:"#FAECE7", icon:"ti-eye-off",       desc:"Honour · guilt · unworthiness",          emotions:["Shame","Guilt","Remorse"]},
  {name:"Joy",      group:"positive",  color:"#639922", bg:"#EAF3DE", icon:"ti-sun",           desc:"Happiness · aliveness · delight",        emotions:["Joy","Contentment","Gratitude","Excitement"]},
  {name:"Warmth",   group:"positive",  color:"#E07B3A", bg:"#FDF0E6", icon:"ti-heart-filled",  desc:"Love · pride · closeness · relief",      emotions:["Love","Pride","Relief"]},
  {name:"Peace",    group:"positive",  color:"#3A9E8A", bg:"#E2F5F1", icon:"ti-wave-square",   desc:"Stillness · hope · wonder",              emotions:["Serenity","Awe","Hope","Anticipation"]},
];

export const DICTIONARY_EMOTIONS: Record<string, any> = {
  "Sadness": {
    fam: "Sadness",
    depth: 1,
    color: "#E6F1FB",
    ic: "#0C447C",
    icon: "ti-cloud",
    aka: "low · heavy · weighed down",
    plain: "A response to loss, disappointment, or something that didn't go the way you hoped. It slows you down deliberately — your mind needs time to sit with what has changed. Sadness is often named indirectly here: 'my heart feels heavy', 'nothing feels good right now.'",
    body: ["Heaviness in chest", "No energy to do things", "Eyes that feel full", "Wanting to be still"],
    rl: [
      { s: "After an argument with a parent you love", f: "You're not angry anymore — just heavy. You didn't want it to go that way, and neither did they, and both of you are sitting in separate rooms carrying it." },
      { s: "When your life doesn't look like you imagined at this age", f: "Friends are getting settled, promotions are happening around you, and somewhere a quiet sadness settles in for what hasn't come yet." },
      { s: "Missing home after moving cities for work", f: "The hostel or PG is fine. The work is fine. But at night there's a specific ache that has no clean word for it." }
    ],
    cw: [
      { n: "Depression", d: "Sadness comes and goes, usually tied to something. Depression stays — it flattens everything, including good days." },
      { n: "Grief", d: "Grief is sadness with a specific loss attached. It's bigger and more complex — it can include anger, relief, and longing all at once." }
    ],
    patterns: ["Emotional suppression through duty", "Withdrawal"]
  },

  "Grief": {
    fam: "Sadness",
    depth: 3,
    color: "#E6F1FB",
    ic: "#0C447C",
    icon: "ti-heart-broken",
    aka: "loss · mourning · heartache",
    plain: "A response to significant loss — and this includes not just death but unfulfilled expectations, a life path closed off, or a version of yourself that was slowly set aside for the family's sake. Grief here is often rushed past: 'what's done is done, move on.'",
    body: ["Physical aching", "Exhaustion even without doing much", "Crying that comes without warning", "Not wanting to eat or eating too much"],
    rl: [
      { s: "After the death of a parent or grandparent", f: "The house feels different. The sounds are different. Some part of you keeps expecting them to walk in." },
      { s: "When a relationship ends that your family never knew about", f: "You're grieving alone. You can't explain why you're sad because the relationship was never real to them. The loss is real to you." },
      { s: "Letting go of a dream career for a stable one", f: "You took the job. It's sensible. You tell yourself you're okay with it. But something in you is still mourning what didn't happen." }
    ],
    cw: [
      { n: "Sadness", d: "Sadness is an emotion. Grief is a process — it moves through stages and doesn't follow a schedule." },
      { n: "Depression", d: "Grief has a source you can name. Depression is more pervasive and often has no clear origin." }
    ],
    patterns: ["Emotional suppression through duty", "Withdrawal"]
  },

  "Loneliness": {
    fam: "Sadness",
    depth: 2,
    color: "#E6F1FB",
    ic: "#0C447C",
    icon: "ti-user-off",
    aka: "isolation · disconnected",
    plain: "Not about being physically alone — you can be surrounded by people and still lonely. It's the gap between the connections you have and the ones where you feel truly seen. You can be in a joint family of twelve and feel this.",
    body: ["A hollow feeling even in company", "Low energy around people you're supposed to enjoy", "Feeling like you're performing rather than present", "Ache for someone who just gets it"],
    rl: [
      { s: "In a joint family where everyone is busy with each other", f: "The house is full. your sister-in-law is cooking, your father-in-law is watching TV, kids are running around. And you're sitting in the middle of it, invisible." },
      { s: "When you can't talk to your parents about what's actually going on", f: "They love you. They'd worry. So you edit yourself. And the editing creates a distance you didn't choose." },
      { s: "After coming back from a gathering where you smiled the whole time", f: "You played the part — asked after everyone's children, laughed at the right moments. On the drive home you feel hollowed out." }
    ],
    cw: [
      { n: "Introversion", d: "Introverts need solitude to recharge and can enjoy it. Loneliness is painful disconnection — it's unwanted." },
      { n: "Sadness", d: "Sadness is usually about something. Loneliness is specifically about the absence of genuine connection." }
    ],
    patterns: ["Withdrawal", "Emotional suppression through duty"]
  },

  "Anxiety": {
    fam: "Fear",
    depth: 1,
    color: "#EEEDFE",
    ic: "#3C3489",
    icon: "ti-wave-sine",
    aka: "tension · worry · unease",
    plain: "Your mind's alarm system running on overdrive — scanning for what could go wrong, what someone might think, what will happen if you fail. This is often referred to simply as 'tension', worn as a badge of how much responsibility one carries.",
    body: ["Tightness in chest or throat", "Restless — can't sit still or focus", "Replaying conversations in your head", "Stomach that tightens before difficult situations"],
    rl: [
      { s: "Before a result, an interview, or a board exam", f: "You've prepared. You know you've prepared. And yet the mind keeps finding ways it might go wrong." },
      { s: "When you've made a decision your parents don't fully approve of", f: "Even if you believe in it, there's a low hum of 'what if they're right' that doesn't quite leave." },
      { s: "At a family function where you'll be asked about your job, marriage, or future", f: "It's not the event you dread — it's the questions. You start preparing answers in advance." }
    ],
    cw: [
      { n: "Fear", d: "Fear is about something present and specific. Anxiety is usually about something that hasn't happened yet." },
      { n: "Stress", d: "Stress is about an external load — too much to do. Anxiety is internal — the mind creating threats even without them." }
    ],
    patterns: ["Catastrophizing", "Avoidance", "Comparison spiral"]
  },

  "Fear": {
    fam: "Fear",
    depth: 2,
    color: "#EEEDFE",
    ic: "#3C3489",
    icon: "ti-alert-circle",
    aka: "terror · dread · fright",
    plain: "A direct response to a real or perceived threat. Fear is useful — it alerts you. But in environments of high pressure and high consequence, the fear response can stay on long after the threat has passed.",
    body: ["Racing heart", "Difficulty breathing normally", "Urge to freeze or escape", "Everything feels urgent"],
    rl: [
      { s: "Being called into the manager's cabin without reason", f: "Your mind has run through six possible disasters before you've even reached the door." },
      { s: "A parent's health scare", f: "Suddenly everything you were worried about before seems small. The fear is sharp and very specific." },
      { s: "Speaking up in a meeting or family discussion", f: "You know what you want to say. But there's a fear of being dismissed, embarrassed, or getting it wrong in front of people whose opinion matters." }
    ],
    cw: [
      { n: "Anxiety", d: "Anxiety is future-facing and often without a clear object. Fear is immediate and tied to something specific." },
      { n: "Overwhelm", d: "Overwhelm is about too much on your plate. Fear is about a specific threat you're trying to respond to." }
    ],
    patterns: ["Avoidance", "Catastrophizing"]
  },

  "Overwhelm": {
    fam: "Fear",
    depth: 2,
    color: "#EEEDFE",
    ic: "#3C3489",
    icon: "ti-stack-2",
    aka: "too much at once · can't cope",
    plain: "The point where the demands being made of you — from family, work, society — exceed what you can realistically hold. This often doesn't get named, because handling it all is seen as the default expectation, especially for the eldest child, the only son, or the daughter managing home and career.",
    body: ["A frozen feeling — don't know where to start", "Headache or body tension from carrying it", "Snapping at people for small things", "Crying without knowing exactly why"],
    rl: [
      { s: "Managing ageing parents while handling a demanding job", f: "Both are real needs. Neither can wait. And nobody is asking if you're okay with carrying both." },
      { s: "Wedding season in the family", f: "Guest lists, caterers, relatives with opinions. Even if it's not your wedding, somehow it's on you." },
      { s: "When everyone at home needs something from you at the same time", f: "The phone is ringing, someone needs a form filled, dinner hasn't been started. Each thing is manageable. All of them at once is not." }
    ],
    cw: [
      { n: "Anxiety", d: "Anxiety is about anticipated threat. Overwhelm is about actual capacity being exceeded right now." },
      { n: "Burnout", d: "Overwhelm is acute and situational. Burnout is chronic — it builds over months of not having enough, and rest alone doesn't fix it." }
    ],
    patterns: ["Familial obligation overwhelm", "Avoidance", "Emotional suppression through duty"]
  },

  "Anger": {
    fam: "Anger",
    depth: 1,
    color: "#FCEBEB",
    ic: "#791F1F",
    icon: "ti-flame",
    aka: "rage · irritation · fury",
    plain: "A signal that something feels unfair, violated, or disrespected. Anger is information about your values and your limits. It's often not allowed to be direct — especially for women, younger family members, or those in subordinate roles. It gets redirected.",
    body: ["Heat in the face or chest", "Jaw tight, hands tense", "Voice gets louder or cuts off completely", "Urge to say something or leave"],
    rl: [
      { s: "When your opinion is ignored in a family decision that affects you", f: "They heard you. They just didn't count it. The anger is about being present but not included." },
      { s: "When credit for your work goes to someone else", f: "You did the work. Someone else got the appreciation. The anger has nowhere clean to go." },
      { s: "When you're told 'this is how it's always been done'", f: "The tradition is presented as a reason. You're left with the feeling that your question doesn't matter." }
    ],
    cw: [
      { n: "Frustration", d: "Frustration is milder — about a blocked path. Anger involves a sense that something unjust has happened." },
      { n: "Resentment", d: "Resentment is anger that was suppressed and has now settled in as a permanent background feeling." }
    ],
    patterns: ["Emotional suppression through duty", "Rumination", "Comparison spiral"]
  },

  "Frustration": {
    fam: "Anger",
    depth: 1,
    color: "#FCEBEB",
    ic: "#791F1F",
    icon: "ti-barrier-block",
    aka: "irritation · exasperation · being blocked",
    plain: "The feeling of being blocked — when effort doesn't lead where you expected it to. Frustration often comes with a side of helplessness: the sense that the system, the family, or the situation won't move regardless of what you do.",
    body: ["Sighing more than usual", "Restlessness — can't settle", "Tension in neck or shoulders", "Short with people you normally like"],
    rl: [
      { s: "Trying to explain something to a parent who won't hear it", f: "You've tried different ways. You've been patient. And they come back to the same position. The frustration is hitting a wall again." },
      { s: "Government systems, paperwork, queues", f: "You did everything correctly. And you're back at the start because one stamp is in the wrong place." },
      { s: "When hard work doesn't translate to visible results", f: "You see peers moving ahead. You're doing the right things. The gap between effort and outcome is demoralising." }
    ],
    cw: [
      { n: "Anger", d: "Anger is about injustice or violation. Frustration is about a goal being blocked — it's less personal." },
      { n: "Hopelessness", d: "Frustration still has energy in it — it wants a different path. Hopelessness has given up on there being one." }
    ],
    patterns: ["Rumination", "Avoidance", "Comparison spiral"]
  },

  "Resentment": {
    fam: "Anger",
    depth: 3,
    color: "#FCEBEB",
    ic: "#791F1F",
    icon: "ti-clock-pause",
    aka: "bitterness · a quiet grudge",
    plain: "Anger that was never allowed to be expressed and has now calcified. In families where saying no is not safe, where sacrifice is the expected currency, resentment is almost inevitable. It often masks itself as indifference or as a sharp tongue.",
    body: ["A heaviness when certain people are around", "Replaying old incidents without intending to", "Sarcasm that doesn't feel like a choice", "Emotional flatness with people you used to feel warmly about"],
    rl: [
      { s: "Being the child who always adjusted, never asked for more", f: "You never said anything. You were 'the good one.' Now when they need something you say yes — and feel nothing." },
      { s: "Doing more than your share in the household for years", f: "No one asked you to. No one acknowledged it either. The tally ran quietly, and now it colours everything." },
      { s: "Watching a sibling receive the treatment you never got", f: "You don't begrudge them. But there's something there you can't quite shake." }
    ],
    cw: [
      { n: "Anger", d: "Anger is immediate and direct. Resentment is anger that was suppressed so many times it became a permanent layer." },
      { n: "Sadness", d: "Resentment can look like sadness from the outside, but underneath there's a 'it shouldn't have been this way' — which is closer to anger." }
    ],
    patterns: ["Emotional suppression through duty", "Rumination", "People pleasing"]
  },

  "Shame": {
    fam: "Shame",
    depth: 3,
    color: "#FAECE7",
    ic: "#712B13",
    icon: "ti-eye-off",
    aka: "disgrace · loss of face · a question of honour",
    plain: "The belief that something is fundamentally wrong with you — not what you did, but who you are. Shame is often collective here: your failure reflects on the family, which makes it heavier and harder to separate from. The instinct to avoid disgrace and protect the family's honour is baked into social life from childhood.",
    body: ["Wanting to disappear or not be seen", "Heaviness in the face and chest", "Avoiding eye contact", "Burning feeling in the body"],
    rl: [
      { s: "Scoring low in an exam that everyone knew you were taking", f: "It's not just your result. It becomes a family event. Relatives hear. Comparisons are made. The shame has an audience." },
      { s: "Doing something that goes against family expectations", f: "Even if you believe it was right, the awareness of how it reflects on them sits heavy. Their disappointment feels like a verdict on you." },
      { s: "Being unmarried 'at your age'", f: "It starts as a question at family functions. It becomes a background hum you carry into daily life. The shame isn't yours, but you're the one wearing it." }
    ],
    cw: [
      { n: "Guilt", d: "Guilt says 'I did something wrong.' Shame says 'I am wrong.' Guilt is about the action. Shame is about the self." },
      { n: "Embarrassment", d: "Embarrassment is momentary and social. Shame is deeper, more private, and lingers long after the moment." }
    ],
    patterns: ["Withdrawal", "People pleasing", "Overcompensation"]
  },

  "Guilt": {
    fam: "Shame",
    depth: 2,
    color: "#FAECE7",
    ic: "#712B13",
    icon: "ti-scale",
    aka: "regret · self-blame",
    plain: "The feeling of having violated your own values — or more commonly, the values your family or society expected of you. Guilt here is often about not giving enough: enough time, enough money, enough obedience, enough sacrifice.",
    body: ["Stomach knot", "Replaying the moment over and again", "Difficulty sleeping", "Urge to make it right immediately"],
    rl: [
      { s: "Not being present when a parent needed you", f: "You had work. You had deadlines. And now you carry the knowledge that you weren't there." },
      { s: "Spending money on yourself when the family has needs", f: "You earned it. You deserve it. And yet there's a voice that says it was the wrong use of it." },
      { s: "Choosing your own path over what was expected", f: "The career switch, the city move, the relationship they don't fully accept. You know it's right for you. You still feel guilty for the burden it puts on them." }
    ],
    cw: [
      { n: "Shame", d: "Guilt is about what you did. Shame is about who you are. Guilt can motivate repair — shame usually just makes you want to hide." },
      { n: "Regret", d: "Regret is about an outcome. Guilt is about moral responsibility — the sense that you did something wrong, not just something that went wrong." }
    ],
    patterns: ["Rumination", "People pleasing", "Emotional suppression through duty"]
  },

  "Remorse": {
    fam: "Shame",
    depth: 3,
    color: "#FAECE7",
    ic: "#712B13",
    icon: "ti-arrow-back",
    aka: "deep regret · contrition",
    plain: "Deep sorrow specifically about harm you caused to someone you care about. Unlike guilt — which can be about rules or appearances — remorse is grounded in genuine care for the other person's pain.",
    body: ["Heavy chest", "Stomach ache", "Can't stop thinking about the moment", "Difficulty sleeping or eating normally"],
    rl: [
      { s: "Saying something cruel to a parent in a moment of frustration", f: "You didn't mean all of it. But some of it you did. And now you can't unsee their expression." },
      { s: "Letting a friend down when they needed you", f: "You were caught up in your own life. You told yourself they'd understand. They said they did. You're not sure they do." },
      { s: "Realising, years later, how you treated someone", f: "With the distance of time you can see it clearly. And the clarity is its own kind of pain." }
    ],
    cw: [
      { n: "Guilt", d: "Guilt can be about rules or appearances. Remorse is specifically about caring that you hurt someone — it's outward-facing." },
      { n: "Shame", d: "Shame turns inward: 'I am bad.' Remorse faces the other person: 'I hurt them.' They feel different in the body." }
    ],
    patterns: ["Rumination"]
  },

  "Joy": {
    fam: "Joy",
    depth: 1,
    color: "#EAF3DE",
    ic: "#27500A",
    icon: "ti-sun",
    aka: "happiness · delight",
    plain: "A genuine sense that things are good right now. Joy often arrives in small, collective moments — a family meal that went well, a festival, news that someone got through an exam. Noticing and staying in it, rather than moving immediately to what's next, is a practice.",
    body: ["Lightness in the chest", "Relaxed face and shoulders", "Energy that doesn't feel forced", "Wanting to share it with someone"],
    rl: [
      { s: "When a family member's big thing finally works out", f: "The relief and the happiness arrive together. It was their achievement, but you carried it too." },
      { s: "A genuinely good meal with people you love", f: "Nothing else matters for the length of that meal. It's full and simple and enough." },
      { s: "When something you worked hard at actually comes through", f: "Not relief that it's over — something warmer. A sense that the effort was not misplaced." }
    ],
    cw: [
      { n: "Excitement", d: "Excitement is anticipatory — about what's coming. Joy is present — it's about right now." },
      { n: "Contentment", d: "Contentment is quieter and more stable. Joy is brighter but can be brief." }
    ],
    patterns: []
  },

  "Contentment": {
    fam: "Joy",
    depth: 1,
    color: "#EAF3DE",
    ic: "#27500A",
    icon: "ti-leaf",
    aka: "settled · enough as it is",
    plain: "A quiet sense that what you have is enough for right now. In a culture that prizes ambition and more, contentment is often confused with complacency. It isn't. It's a settled quality — warm, grounded, sustainable.",
    body: ["Slow even breathing", "Softness in the face", "No particular urgency", "A feeling of enough"],
    rl: [
      { s: "A Sunday afternoon with nothing that needs doing", f: "The pressure is absent. There's tea. There's sunlight. There's nothing wrong right now." },
      { s: "After finishing something that genuinely stretched you", f: "Not relief exactly — more like: I was capable of this. That's enough." },
      { s: "Watching someone you love be okay", f: "You don't need anything else in this moment. This is sufficient." }
    ],
    cw: [
      { n: "Joy", d: "Joy can be bright and brief. Contentment is quieter and lasts longer — it's a state, not a moment." },
      { n: "Giving up", d: "Contentment is a genuine okayness with what is. Giving up is resignation — these feel very different in the body." }
    ],
    patterns: []
  },

  "Gratitude": {
    fam: "Joy",
    depth: 2,
    color: "#EAF3DE",
    ic: "#27500A",
    icon: "ti-heart",
    aka: "thankfulness · appreciation",
    plain: "The recognition that something good in your life arrived — at least in part — because of another person. Gratitude is often embedded in practice: touching feet, saying words of thanks, acknowledging what others gave up for you. Sometimes it can tip into obligation. When it's clean, it's freely felt.",
    body: ["Warmth in the chest", "Face softens", "Sometimes a tightness behind the eyes", "Openness — feeling less defended"],
    rl: [
      { s: "Realising what your parents gave up for your education", f: "You knew it intellectually. At some point it becomes real — the sacrifices were actual things, not abstract." },
      { s: "When someone shows up for you without being asked", f: "They didn't have to. You didn't ask. And they came. That lands differently." },
      { s: "Getting through a hard year", f: "Looking back: it was difficult and you are still here. Something or someone made that possible." }
    ],
    cw: [
      { n: "Indebtedness", d: "Indebtedness feels like you owe — it carries weight and obligation. Gratitude is freely felt and doesn't demand repayment." },
      { n: "Relief", d: "Relief is about something difficult ending. Gratitude is about recognising something good that was given." }
    ],
    patterns: []
  },

  "Excitement": {
    fam: "Joy",
    depth: 1,
    color: "#EAF3DE",
    ic: "#27500A",
    icon: "ti-rocket",
    aka: "high energy · looking forward",
    plain: "High-energy anticipation about something ahead. This often comes mixed with anxiety — before a result, a new job, a wedding — because the thing you're excited about also has stakes.",
    body: ["Restless energy", "Difficult to sleep the night before", "Talking about it more than usual", "Butterflies"],
    rl: [
      { s: "The night before a result you've been waiting months for", f: "You're excited and terrified in equal measure. The body doesn't distinguish." },
      { s: "Moving to a new city for a job or college", f: "Everything could be different. Everything could go wrong. Both feel simultaneously true." },
      { s: "A trip finally confirmed after months of planning", f: "It becomes real the moment the ticket is booked. The anticipation has its own pleasure." }
    ],
    cw: [
      { n: "Anxiety", d: "Both use the same physiological response. The difference is whether you're interpreting what's ahead as a possibility or a threat." },
      { n: "Joy", d: "Joy is present-tense. Excitement is about something coming — it has a target in the future." }
    ],
    patterns: []
  },

  "Love": {
    fam: "Warmth",
    depth: 3,
    color: "#FDF0E6",
    ic: "#7A3A10",
    icon: "ti-heart-filled",
    aka: "affection · attachment",
    plain: "A deep orientation toward someone else's wellbeing. Love is often expressed through action rather than words here — feeding, providing, sacrificing — which means it can be real and present even when it doesn't look like what you expected.",
    body: ["Warmth in the chest", "Wanting to be near", "Softness in how you look at them", "Fierce protectiveness"],
    rl: [
      { s: "Watching a parent grow old", f: "Something reverses. The person who held everything together now needs holding. The love intensifies even as the roles shift." },
      { s: "A friendship that has lasted through different cities and different lives", f: "You don't talk every day. When you do, nothing has changed. That kind of continuity is its own form of love." },
      { s: "A partner who sees you accurately — including the difficult parts", f: "Being known fully and still chosen is a specific feeling. It is not small." }
    ],
    cw: [
      { n: "Attachment", d: "Attachment can include fear of losing someone, control, or anxiety. Love at its clearest is more open — it can hold the possibility of loss." },
      { n: "Duty", d: "Duty is obligation — you do it because you must. Love is chosen, even when it's expressed through the same actions." }
    ],
    patterns: []
  },

  "Pride": {
    fam: "Warmth",
    depth: 2,
    color: "#FDF0E6",
    ic: "#7A3A10",
    icon: "ti-award",
    aka: "dignity · self-respect",
    plain: "The feeling of having met your own standards — or witnessing someone you love meet theirs. Pride is often collective here: a family member's achievement is shared. The personal version — pride in yourself, for yourself — is sometimes harder to access.",
    body: ["Standing a little taller", "Warmth in the face", "Energy without effort", "A quiet certainty"],
    rl: [
      { s: "Your child or sibling getting into a good college or job", f: "You feel it almost more than they do. The pride is real and a little fierce." },
      { s: "Doing something you were told you couldn't", f: "Not to prove them wrong — though that's there too. More that you proved something to yourself." },
      { s: "Standing by a decision that wasn't easy", f: "You didn't do the comfortable thing. You know why. That knowledge carries its own quiet satisfaction." }
    ],
    cw: [
      { n: "Arrogance", d: "Pride holds its own worth without needing to diminish others. Arrogance requires comparison — someone has to be lesser." },
      { n: "Relief", d: "Relief is about something ending. Pride is about what you or someone else did or became." }
    ],
    patterns: []
  },

  "Relief": {
    fam: "Warmth",
    depth: 1,
    color: "#FDF0E6",
    ic: "#7A3A10",
    icon: "ti-circle-check",
    aka: "exhale · letting go",
    plain: "The release of tension when something you feared doesn't happen, or something difficult finally ends. In high-pressure environments — board results, medical reports, family decisions — relief can be one of the most physical emotions.",
    body: ["A long exhale", "Muscles releasing — you didn't know they were held", "Sometimes unexpected tears", "Lightheadedness"],
    rl: [
      { s: "Results come and they're okay", f: "You didn't realise how tightly you were holding until you could let go." },
      { s: "A difficult family conversation that went better than feared", f: "You dreaded it for days. It happened. You're still standing." },
      { s: "Medical news that is not bad news", f: "The waiting was its own kind of suffering. When it lifts, the body notices before the mind does." }
    ],
    cw: [
      { n: "Joy", d: "Joy comes from something genuinely good arriving. Relief comes from something feared not arriving — or ending." },
      { n: "Contentment", d: "Contentment is stable. Relief is transitional — it follows tension and eventually settles into something quieter." }
    ],
    patterns: []
  },

  "Serenity": {
    fam: "Peace",
    depth: 3,
    color: "#E2F5F1",
    ic: "#1A6657",
    icon: "ti-wave-square",
    aka: "stillness · inner quiet",
    plain: "A deep settled quiet inside — not the absence of problems, but the absence of internal conflict about them. In many spiritual traditions, this quiet is the explicit goal of practice. In daily life it arrives in unexpected moments.",
    body: ["Slow deep breathing without effort", "Nothing feels urgent", "A warmth that isn't heat", "Stillness that isn't emptiness"],
    rl: [
      { s: "Early morning before the house wakes up", f: "For a few minutes the world is yours and it asks nothing of you." },
      { s: "After a long period of difficulty that finally resolved", f: "Not happiness exactly. Something quieter. An exhale that takes several days." },
      { s: "Certain moments in prayer or meditation", f: "The thoughts don't stop, but they pass through without sticking. There's something beneath them that holds." }
    ],
    cw: [
      { n: "Numbness", d: "Serenity is warm and aware. Numbness is the absence of feeling — it's not peace, it's disconnection." },
      { n: "Contentment", d: "Contentment is about the present being enough. Serenity is deeper — it's a relationship with life as it is, including the hard parts." }
    ],
    patterns: []
  },

  "Awe": {
    fam: "Peace",
    depth: 3,
    color: "#E2F5F1",
    ic: "#1A6657",
    icon: "ti-stars",
    aka: "wonder · something bigger than you",
    plain: "The feeling of encountering something so vast it briefly dissolves the self. It's embedded in landscapes, landscapes, temples — but awe is also available in ordinary moments: a child's question, a sudden view, a piece of music.",
    body: ["Stillness — you forget to move", "Goosebumps", "A feeling of smallness that isn't diminishing", "Breath slows or pauses"],
    rl: [
      { s: "A sunrise from a hill or a rooftop", f: "You've seen the sun rise before. This time it registers. For a moment your problems are the right size." },
      { s: "Watching a crowded festival from above", f: "Thousands of people who all have full, complicated lives. You're one. The scale of it quiets something." },
      { s: "When a child says something that cuts right to the heart of things", f: "They didn't mean to be profound. They just described what was happening. And it lands completely." }
    ],
    cw: [
      { n: "Joy", d: "Joy is warm and personal. Awe is impersonal — it's about something larger than any one relationship or moment." },
      { n: "Gratitude", d: "Gratitude is relational — toward a person or a moment. Awe is often directionless, toward existence itself." }
    ],
    patterns: []
  },

  "Hope": {
    fam: "Peace",
    depth: 2,
    color: "#E2F5F1",
    ic: "#1A6657",
    icon: "ti-sunrise",
    aka: "possibility · looking ahead",
    plain: "The belief that something good is still possible, even when evidence is thin. Hope doesn't require certainty — only the willingness to keep the future open. In difficult family or social situations, hope can be the quiet refusal to accept that nothing will ever change.",
    body: ["A lightening in the chest", "Energy that returns after a low period", "Ability to think about the future again", "Something that functions like warmth"],
    rl: [
      { s: "After a long difficult patch, something small shifts", f: "It's not solved. But something moved. And suddenly you can imagine it being different." },
      { s: "When someone younger in the family starts finding their own way", f: "You see in them the possibility you wanted for yourself. It isn't bitter — it's hopeful by proxy." },
      { s: "Starting over after something ended", f: "You could have stayed stopped. You didn't. The choice to begin again is hope as action." }
    ],
    cw: [
      { n: "Optimism", d: "Optimism is a disposition — you tend toward positive expectations. Hope is a state — it appears even in people who are not naturally optimistic." },
      { n: "Denial", d: "Denial refuses to see what is difficult. Hope sees it and chooses to stay open anyway." }
    ],
    patterns: []
  },

  "Anticipation": {
    fam: "Peace",
    depth: 1,
    color: "#E2F5F1",
    ic: "#1A6657",
    icon: "ti-clock-hour-4",
    aka: "the wait · looking forward",
    plain: "The pleasurable state of expecting something good. Anticipation often has as much pleasure in it as the event itself — sometimes more. It's the texture of festivals in the weeks before, of exam results on the way, of a trip being planned.",
    body: ["Restless energy", "Thinking about it even when doing other things", "Slight physical buzz", "Smiling to yourself unexpectedly"],
    rl: [
      { s: "The weeks before Diwali or Eid when the house is being prepared", f: "The festival hasn't arrived yet. The preparation is its own happiness." },
      { s: "Waiting for someone you love to come home after a long time", f: "You keep looking at the time. The waiting has a texture to it that isn't unpleasant." },
      { s: "The day before something you've planned for", f: "Even ordinary plans have this quality — the day before holds all the possibility." }
    ],
    cw: [
      { n: "Anxiety", d: "Both involve thinking about what's coming. Anticipation frames it as good. Anxiety frames it as threatening." },
      { n: "Excitement", d: "Excitement is more intense and physical. Anticipation is quieter — a sustained looking forward." }
    ],
    patterns: []
  }
};

export const WORD_INDEX: Record<string, any> = {
  "stressed": { hint: "The all-purpose word for pressure", matches: ["Anxiety", "Overwhelm"] },
  "tense": { hint: "Bracing for something coming", matches: ["Anxiety"] },
  "under pressure": { hint: "Something specific is bearing down", matches: ["Overwhelm", "Anxiety"] },
  "overwhelmed": { hint: "Too much at once, no clear order", matches: ["Overwhelm"] },
  "on edge": { hint: "Short fuse from sustained pressure", matches: ["Anxiety", "Anger"] },
  "worried": { hint: "Concern about something specific", matches: ["Anxiety", "Fear"] },
  "frustrated": { hint: "Blocked, but it could still change", matches: ["Frustration"] },
  "irritated": { hint: "Small and passing, but present", matches: ["Frustration", "Anger"] },
  "annoyed": { hint: "Mild, surface-level displeasure", matches: ["Frustration"] },
  "angry": { hint: "Direct and immediate", matches: ["Anger"] },
  "resentful": { hint: "Anger that has settled and stayed", matches: ["Resentment"] },
  "bitter": { hint: "Resentment that has become an outlook", matches: ["Resentment"] },
  "fed up": { hint: "Patience specifically run out", matches: ["Frustration", "Resentment"] },
  "sad": { hint: "Direct and simple", matches: ["Sadness"] },
  "heavy": { hint: "Weight without a clear name", matches: ["Sadness", "Grief"] },
  "heartbroken": { hint: "Grief tied to a relationship", matches: ["Grief", "Sadness"] },
  "down": { hint: "Mild and usually temporary", matches: ["Sadness"] },
  "hollow": { hint: "Sadness with the feeling thinned out", matches: ["Sadness", "Loneliness"] },
  "grieving": { hint: "Carrying a specific loss", matches: ["Grief"] },
  "numb": { hint: "Feeling nothing where you'd expect to", matches: ["Sadness", "Loneliness"] },
  "empty": { hint: "A quiet absence rather than pain", matches: ["Sadness", "Loneliness"] },
  "disconnected": { hint: "Present, but not really there", matches: ["Loneliness"] },
  "detached": { hint: "Watching your own life happen", matches: ["Loneliness", "Sadness"] },
  "checked out": { hint: "Functionally present, mentally elsewhere", matches: ["Loneliness", "Overwhelm"] },
  "guilty": { hint: "About something specific, done or not", matches: ["Guilt"] },
  "ashamed": { hint: "About who you are, not just what you did", matches: ["Shame"] },
  "embarrassed": { hint: "Social and momentary", matches: ["Shame"] },
  "obligated": { hint: "Doing something out of duty, not desire", matches: ["Guilt"] },
  "torn": { hint: "Caught between duty and what you want", matches: ["Guilt", "Anxiety"] },
  "indebted": { hint: "Feeling like you owe someone", matches: ["Guilt", "Gratitude"] },
  "self-conscious": { hint: "Aware of being watched or judged", matches: ["Shame", "Anxiety"] },
  "scared": { hint: "Direct fear about something specific", matches: ["Fear"] },
  "nervous": { hint: "Performance-specific, before something", matches: ["Anxiety"] },
  "uneasy": { hint: "Something's off, hard to name why", matches: ["Anxiety"] },
  "insecure": { hint: "About your own worth or standing", matches: ["Shame", "Anxiety"] },
  "apprehensive": { hint: "Dread about something specific ahead", matches: ["Anxiety", "Fear"] },
  "on guard": { hint: "Braced for judgement, ready to defend", matches: ["Fear", "Anxiety"] },
  "rattled": { hint: "Thrown off by something sudden", matches: ["Fear"] },
  "isolated": { hint: "Cut off, often by circumstance", matches: ["Loneliness"] },
  "invisible": { hint: "Your needs aren't registering", matches: ["Loneliness"] },
  "unseen": { hint: "Your effort isn't being acknowledged", matches: ["Loneliness"] },
  "left out": { hint: "Excluded from something specific", matches: ["Loneliness"] },
  "misunderstood": { hint: "Trying to explain yourself, not landing", matches: ["Loneliness"] },
  "fine": { hint: "The reflexive answer that hides the rest", matches: ["Overwhelm", "Sadness", "Anxiety"] },
  "managing": { hint: "Not okay, but not asking for help", matches: ["Overwhelm", "Sadness"] },
  "adjusting": { hint: "Accepting a compromise, repeatedly", matches: ["Resentment", "Overwhelm"] },
  "calm": { hint: "Steady, not necessarily happy", matches: ["Serenity", "Contentment"] },
  "content": { hint: "Enough, without needing more", matches: ["Contentment"] },
  "at peace": { hint: "Resolved, not just quiet", matches: ["Serenity"] },
  "grounded": { hint: "Stable regardless of the noise around you", matches: ["Serenity", "Contentment"] },
  "happy": { hint: "Genuinely good right now", matches: ["Joy", "Contentment"] },
  "grateful": { hint: "Recognising what was given to you", matches: ["Gratitude"] },
  "proud": { hint: "You met your own standard", matches: ["Pride"] },
  "relieved": { hint: "A weight just lifted", matches: ["Relief"] },
  "hopeful": { hint: "Something good still feels possible", matches: ["Hope"] },
  "tired": { hint: "Low on energy, plain and simple", matches: ["Overwhelm", "Sadness"] },
  "exhausted": { hint: "Past the point rest alone fixes", matches: ["Overwhelm"] },
  "drained": { hint: "Someone or something took it out of you", matches: ["Overwhelm"] },
  "worn out": { hint: "Wear from a long stretch, not one day", matches: ["Overwhelm", "Sadness"] },
  "depleted": { hint: "Nothing left to give", matches: ["Overwhelm"] }
};

export const SURFACE = {
  neg: [
    { word: "Tensed", hint: "Pressure building up", matches: ["Anxiety", "Overwhelm", "Frustration"], icon: "ti-bolt", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Disturbed", hint: "Something is unsettling you", matches: ["Anxiety", "Sadness", "Shame"], icon: "ti-ripple", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Low", hint: "Can't explain it but it's there", matches: ["Sadness", "Grief", "Loneliness"], icon: "ti-cloud", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Irritated", hint: "Everything is annoying", matches: ["Frustration", "Anger", "Overwhelm"], icon: "ti-wave-sine", gc: "rgba(224,168,152,0.15)", ic: "#E0A898" },
    { word: "Burdened", hint: "Too much on your shoulders", matches: ["Overwhelm", "Guilt", "Resentment"], icon: "ti-stack-2", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Guilty", hint: "Feeling like you've let someone down", matches: ["Guilt", "Shame", "Remorse"], icon: "ti-scale", gc: "rgba(224,168,152,0.15)", ic: "#E0A898" },
    { word: "Lonely", hint: "Alone even around people", matches: ["Loneliness", "Grief", "Sadness"], icon: "ti-user-off", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Scared", hint: "Dreading something ahead", matches: ["Fear", "Anxiety", "Overwhelm"], icon: "ti-alert-circle", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Confused", hint: "Don't know what you want", matches: ["Overwhelm", "Anxiety", "Grief"], icon: "ti-question-mark", gc: "rgba(184,168,212,0.15)", ic: "#B8A8D4" },
    { word: "Trapped", hint: "No way out feels visible", matches: ["Shame", "Resentment", "Fear"], icon: "ti-lock", gc: "rgba(224,168,152,0.15)", ic: "#E0A898" }
  ],
  pos: [
    { word: "Okay", hint: "Holding up, nothing more", matches: ["Contentment", "Relief", "Gratitude"], icon: "ti-circle-check", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Happy", hint: "Genuinely good right now", matches: ["Joy", "Contentment", "Gratitude"], icon: "ti-sun", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Proud", hint: "Something went right", matches: ["Pride", "Joy", "Gratitude"], icon: "ti-award", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Grateful", hint: "Someone came through for you", matches: ["Gratitude", "Joy", "Relief"], icon: "ti-heart", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Peaceful", hint: "Unusually settled inside", matches: ["Serenity", "Contentment", "Relief"], icon: "ti-leaf", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Hopeful", hint: "Something good ahead", matches: ["Hope", "Anticipation", "Joy"], icon: "ti-sunrise", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Excited", hint: "Looking forward to something", matches: ["Excitement", "Anticipation", "Joy"], icon: "ti-rocket", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Moved", hint: "Touched by something", matches: ["Awe", "Gratitude", "Love"], icon: "ti-stars", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Connected", hint: "Close to someone today", matches: ["Love", "Gratitude", "Joy"], icon: "ti-link", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" },
    { word: "Relieved", hint: "A weight just lifted", matches: ["Relief", "Contentment", "Gratitude"], icon: "ti-wind", gc: "rgba(141,191,180,0.15)", ic: "#8DBFB4" }
  ]
};

export const PATTERNS = [
  {id:"avoidance",name:"Avoidance",sub:"Steering away from discomfort",icon:"ti-arrows-minimize",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Systematically avoiding situations, conversations, or feelings that feel too difficult. This often looks like not bringing something up with parents, not addressing a conflict in the family, or keeping something secret 'to avoid drama.' Short-term it works. Long-term the avoided thing grows.",signs:"Not starting a difficult conversation you've been meaning to have · Staying busy to avoid thinking · Saying 'it'll sort itself out' when it won't · Physically leaving situations that feel loaded",emotions:["Anxiety","Fear","Shame","Overwhelm"],actions:["Name the thing you're avoiding — write it down without trying to solve it","Identify what specifically you're afraid will happen if you face it","Take one small step toward it — not the whole conversation, just the first sentence","Notice that the anxiety before is usually worse than the thing itself"]},
  {id:"rumination",name:"Rumination",sub:"Replaying the same thoughts on a loop",icon:"ti-rotate-clockwise",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Going over the same incident, conversation, or worry repeatedly without resolution. In families where things are often not said directly, rumination frequently fills the gaps — 'what did they mean by that', 'what should I have said', 'what will happen next'.",signs:"Replaying a conversation in your head for hours · Going to sleep thinking about the same thing you woke up thinking about · 'What if' questions that lead to more questions · Difficulty being present because your mind is elsewhere",emotions:["Sadness","Resentment","Guilt","Anxiety"],actions:["Write the thought down once, completely — then close it","Set a 15-minute window each day to worry intentionally, then stop","Ask: is this problem-solving or just replaying? They feel different","Physical activity — walk, cook, clean — to move the body out of the loop"]},
  {id:"catastrophizing",name:"Catastrophizing",sub:"Assuming the worst will happen",icon:"ti-alert-triangle",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"Taking a situation and jumping to the worst possible outcome — and treating it as inevitable. In high-stakes environments like competitive exams, job insecurity, or family pressure, catastrophizing is almost a trained response. The mind learns to prepare for disaster.",signs:"'If I fail this I'm finished' · Imagining the worst-case response from parents or society before anything has happened · Sleeping badly because of something that hasn't occurred yet · Can't enjoy good news because 'something will go wrong'",emotions:["Anxiety","Fear","Shame"],actions:["Write the catastrophe out fully — then write the realistic outcome alongside it","Ask: what is the actual evidence this will happen?","Track how often your feared outcome actually occurred","Talk to one person who can reflect reality back to you"]},
  {id:"withdrawal",name:"Withdrawal",sub:"Pulling away from people around you",icon:"ti-user-off",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Reducing contact with others when things get difficult — which in joint family settings can be impossible to do physically, so it happens emotionally: you're present but absent. You stop sharing, stop responding, go through the motions.",signs:"Being physically present but emotionally checked out · Short answers, less conversation · Missing calls or messages you'd normally reply to · Staying in your room more than usual",emotions:["Sadness","Loneliness","Shame","Grief"],actions:["Distinguish between genuine rest and hiding — they feel different","Identify one person who costs you nothing to be around — start there","Set a soft re-entry: one message, not a full conversation","Notice if the withdrawal is protecting you or just prolonging the pain"]},
  {id:"people-pleasing",name:"People pleasing",sub:"Putting others first to keep the peace",icon:"ti-heart-handshake",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"Consistently suppressing your own needs, opinions, or limits to avoid conflict or disapproval. In many family structures this is not really a choice — it's the expectation, especially for daughters-in-law, younger siblings, or anyone in a role where deference is built in. Over time it builds resentment.",signs:"Saying yes when you mean no · Not having an opinion when asked, or immediately adjusting to the room's opinion · Feeling angry after agreeing to something · Over-apologising",emotions:["Anxiety","Fear","Resentment","Shame"],actions:["Practice the pause: 'Let me think about it and come back to you'","Identify one low-stakes situation this week to say no or disagree","Notice the anxiety before — and that it usually passes after you hold the line","Track how you feel after people-pleasing vs. after being honest about what you need"]},
  {id:"overcompensation",name:"Overcompensation",sub:"Achieving to cover what hurts inside",icon:"ti-trophy",gc:"rgba(141,191,180,0.15)",ic:"#8DBFB4",desc:"Working harder, achieving more, or performing competence to cover an underlying feeling of inadequacy. Common in first-generation college-goers, high achievers from modest backgrounds, or anyone who learned that their value was conditional on performance.",signs:"Never feeling like enough no matter what you achieve · Difficulty resting without guilt · Dismissing your own accomplishments before others can · Needing to be the most capable person in the room",emotions:["Shame","Guilt","Anxiety","Fear"],actions:["Notice when the drive to do more is coming from fear rather than genuine desire","Allow one imperfection this week — intentionally, not by accident","Ask someone you trust what they see in you that has nothing to do with achievement","Consider: what would change if you stopped performing?"]},
  {id:"comparison-spiral",name:"Comparison spiral",sub:"Measuring yourself against others constantly",icon:"ti-arrows-transfer-up",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"The habit of measuring your worth, progress, or happiness against others — often relatives, classmates, colleagues, or people on social media. This gets reinforced structurally: marks are ranked, salaries are discussed at family functions, wedding timelines are compared. The spiral begins when the comparison becomes the measure of your own value.",signs:"Feeling bad about your life after family gatherings · Checking what others are doing on social media and feeling worse · 'Why am I not there yet' when you were okay before the comparison · Parents' comparisons replaying in your head",emotions:["Shame","Anxiety","Sadness","Resentment"],actions:["Notice the trigger: what specifically prompted the comparison?","Ask: was I okay before I looked? Usually yes — the discomfort came from the comparison, not your actual life","Write down three things about your path that are specific to you and can't be ranked","Reduce the inputs: the people and content that consistently trigger the spiral"]},
  {id:"familial-obligation-overwhelm",name:"Familial obligation overwhelm",sub:"Carrying more than your share of family",icon:"ti-users-group",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"The weight of being responsible — financially, emotionally, logistically — for family members in ways that exceed what you chose or agreed to. Common for eldest children, only children, NRIs sending money home, or anyone in the family who 'figured it out.' The obligation is real. So is the cost of carrying it alone.",signs:"Agreeing to family responsibilities without being asked · Feeling guilty when you do something for yourself · Never fully present even on your own time · Anger or resentment that you can't justify to yourself because 'they need me'",emotions:["Overwhelm","Resentment","Guilt","Anxiety"],actions:["Name what you're actually carrying — write it as a list, not in your head","Identify which parts were chosen and which parts were assumed by default","Have one conversation about redistributing one responsibility — start small","Notice the difference between help that feels good and help that feels like survival"]},
  {id:"emotional-suppression",name:"Emotional suppression through duty",sub:"Swallowing feelings in the name of responsibility",icon:"ti-lock",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Suppressing difficult emotions — anger, sadness, fear — because expressing them feels irresponsible, selfish, or dangerous to family harmony. The unspoken family rule — what happens at home stays at home — captures it: the feelings don't get to leave the house. The emotions don't disappear — they surface as physical symptoms, irritability, or numbness.",signs:"'I'm fine' when you are not · Difficulty identifying what you feel · Physical tension or illness that doesn't have a clear cause · Feeling numb in situations where you'd expect to feel something",emotions:["Sadness","Anger","Grief","Loneliness"],actions:["Write what you feel before deciding whether to express it — for yourself first","Name the emotion out loud, even privately: 'I am angry about this'","Identify one safe person or space where feelings are allowed to exist","Notice what you're protecting by not feeling — is that protection still necessary?"]},
  {id:"joy-blocking",name:"Joy blocking",sub:"Cutting short your own good feelings",icon:"ti-mood-sad",gc:"rgba(141,191,180,0.15)",ic:"#8DBFB4",desc:"Dismissing, deflecting, or prematurely ending positive emotions — through guilt ('I don't deserve this when others are struggling'), superstition ('something bad will follow'), or self-deprecation. Common in environments where individual happiness is seen as selfish or tempting fate.",signs:"The evil-eye superstition — the fear that saying good news aloud will jinx it · Downplaying achievements before others can acknowledge them · Feeling guilty for being happy when family members are not · 'It's nothing, anyone could have done it'",emotions:["Joy","Pride","Contentment","Gratitude"],actions:["Allow 60 seconds to just receive the good thing — no analysis, no 'but'","Say the good thing out loud to someone, as a statement not a question","Notice the thought that tries to cut it short — where did you learn that?","Practice: 'this is good and I am allowed to feel that'"]},
];

export const SITUATIONS = [
  {id:"parent-pressure",title:"I feel crushed by what my parents expect from me",hint:"Career, marriage, marks, behaviour — the list never ends.",glyph:"ti-home",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"This kind of expectation is rarely malicious — it usually comes from genuine care and real anxiety about your future. But the weight of it lands regardless of the intention. When every life decision feels like it has to pass through their approval first, the pressure becomes its own thing.",patterns:["People pleasing","Familial obligation overwhelm","Avoidance"],what:["Write down what you actually want, separately from what they want — the gap is important information","Notice if you've never clearly said what you need, or if you've said it and been dismissed — these need different responses","Find one small area where you make a decision entirely on your own, even if it doesn't matter much","Consider: is the fear about disappointing them, or about losing their love? These are different things"]},
  {id:"log-kya-kahenge",title:"I'm living for what people will think, not for myself",hint:"Family reputation, relatives' opinions, society's gaze.",glyph:"ti-eye",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"'What will people say' can quietly become one of the most powerful forces shaping a life. It steers careers, marriages, and daily choices from the background. At a point, the external gaze becomes so internalised that you can no longer locate what you actually want.",patterns:["Comparison spiral","People pleasing","Avoidance"],what:["Write down a decision you're facing and ask: whose criteria am I using to evaluate it?","Identify one choice in your life that was entirely yours — notice what that felt like","Ask: ten years from now, whose opinion will I actually remember?","Consider that the imagined audience is largely occupied with worrying about what people will think of them"]},
  {id:"comparison-relatives",title:"I feel like I'm always behind compared to everyone around me",hint:"Cousins, colleagues, classmates, neighbours.",glyph:"ti-arrows-transfer-up",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"The comparison is often structural, not incidental — marks get ranked, achievements get announced at family gatherings, group chats carry everyone's good news before you've had a chance to process your own week. The result is a continuous awareness of where you sit relative to others, which is exhausting and often inaccurate.",patterns:["Comparison spiral","Rumination","Catastrophizing"],what:["Notice when you were okay before the comparison — the discomfort came from the input, not your actual situation","Track what specifically triggers the comparison: certain people, certain events, certain apps","Write down three aspects of your path that are genuinely yours and can't be ranked","Reduce the inputs that consistently produce this feeling — this is not avoidance, it's maintenance"]},
  {id:"cant-say-no",title:"I always say yes even when I mean no",hint:"To parents, in-laws, colleagues, friends.",glyph:"ti-hand-stop",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"Saying no — especially to elders, authority figures, or people whose opinion you depend on — hasn't always felt safe. Over time, saying yes becomes automatic. The resentment builds quietly. The yes becomes more and more hollow.",patterns:["People pleasing","Avoidance","Emotional suppression through duty"],what:["Practice the pause: 'Let me think about it and get back to you' — this buys time without requiring a hard no","Notice how you feel two hours after saying yes to something you didn't want — track this","Start with low-stakes nos: declining something that costs you little","Identify where the fear actually lives: is it about conflict, disapproval, or something deeper?"]},
  {id:"joint-family-tension",title:"Living with family is taking something from me",hint:"No privacy, no space, no quiet. It adds up.",glyph:"ti-building-community",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Joint family living has genuine gifts: support, continuity, connection. It also has real costs: privacy, autonomy, the ability to be in a bad mood without it becoming a family event. When the costs exceed the gifts and there's no name for it, the feeling becomes a vague corrosive drain.",patterns:["Withdrawal","Familial obligation overwhelm","Emotional suppression through duty"],what:["Name specifically what's being taken — space, time, quiet, privacy, autonomy — precision helps","Identify one small boundary that is genuinely possible in the current arrangement","Find a physical space or time of day that is yours, even briefly","Notice the difference between adjusting (adaptive) and disappearing (costly)"]},
  {id:"career-vs-passion",title:"I chose the safe path and I'm not sure I'm okay with it",hint:"Engineering, medicine, finance — not what you actually wanted.",glyph:"ti-road",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"Plenty of career decisions get made based on what is safe, what is respected, and what the family can explain to others — not what you actually want. Years in, the choice can feel final even when it isn't. The grief for the other path doesn't always announce itself clearly.",patterns:["Rumination","Emotional suppression through duty","Comparison spiral"],what:["Acknowledge the grief — the path not taken is a real loss and doesn't need to be rationalised away","Separate 'I regret the choice' from 'I am a failure' — these are different statements","Identify if there are elements of what you wanted that can exist within or alongside the current path","Ask: is this a permanent feeling or is it a season? Both are valid, but they need different responses"]},
  {id:"marriage-pressure",title:"The pressure around marriage is becoming too much",hint:"Age, eligibility, family expectations, your own uncertainty.",glyph:"ti-rings",gc:"rgba(224,168,152,0.15)",ic:"#E0A898",desc:"Marriage can stop being a private decision fairly quickly — it becomes a family event with social stakes attached. The pressure often begins before you've had the chance to understand what you want in a partner, or whether you want that particular life at all. The timeline gets imposed from outside.",patterns:["People pleasing","Comparison spiral","Avoidance"],what:["Separate what you actually want from what you've absorbed as expectation — this is harder than it sounds","Notice if the pressure is louder than your own voice on this — that gap is worth examining","Identify one person in your circle with whom you can be honest about this, without them escalating it","Ask: what would I choose if no one was watching?"]},
  {id:"invisible-at-home",title:"I feel unseen by the people I live with",hint:"Your needs, opinions, and feelings don't seem to register.",glyph:"ti-eye-off",gc:"rgba(184,168,212,0.15)",ic:"#B8A8D4",desc:"In families where hierarchy is strong and roles are defined, certain people become invisible as individuals — they are seen in their role (daughter-in-law, youngest child, the responsible one) but not in themselves. This produces a specific kind of loneliness.",patterns:["Withdrawal","Emotional suppression through duty","People pleasing"],what:["Name specifically what you wish they saw — vague 'I feel unseen' is harder to work with than 'I wish they asked how I was doing'","Identify one person in the family to whom you could show a slightly more real version of yourself","Notice if you've stopped showing yourself — sometimes invisibility is partly a response to past attempts that didn't land","Consider whether the unseen-ness is situational or a long pattern — both need different responses"]},
];
