/**
 * Comprehensive Type Definitions for Psychoeducation Module Content Data
 */

export type TechniqueFormat = 'A' | 'B' | 'C'; // A = normal interactive, B = guided with guardrail, C = reference-only

export interface ModuleTechnique {
  code: string; // e.g. 'A1', 'A2', 'A5', 'B1', 'C1'
  approach: string; // e.g. 'CBT', 'CFT', 'ACT'
  format: TechniqueFormat;
  name: string;
  source: string;
  what: string;
  how: string;
  why: string;
  guardrail?: boolean;
  guardrailNote?: string;
  professionalNote?: string; // Present on format 'C' techniques
}

export interface ModuleMechanism {
  key: string; // 'A', 'B', 'C'
  name: string;
  short: string;
  def: string;
  need: string;
  contrast: {
    who: string;
    text: string;
  };
  techniques: ModuleTechnique[];
}

export interface ModuleBrief {
  moduleName: string;
  tier: string;
  mechanisms: ModuleMechanism[];
  scenarioSource: string;
  escalation: {
    tier1: string;
    tier2: string;
  };
}

export interface IntroScreen {
  eyebrow: string;
  title: string;
  body: string[];
  cta: string;
  consent?: boolean;
  crisisButton?: boolean;
  theory?: boolean;
}

export interface TouchTapOption {
  label: string;
  isTarget: boolean;
  explain: string;
}

export interface TouchRelate {
  text: string[];
}

export interface TouchThink {
  mode: 'tap' | 'open';
  prompt: string;
  options?: TouchTapOption[];
  whyPrompt?: string;
  placeholder?: string;
}

export interface TouchApply {
  scenario: string;
  prompt: string;
  placeholder: string;
  intensityPrompt?: string;
  intensityOptions?: string[];
}

export interface TouchReveal {
  text: string;
}

export interface TouchRemember {
  prompt: string;
  placeholder: string;
}

export interface ModuleTouch {
  id: string; // e.g. 'w1t1'
  title: string;
  role: string;
  noDelayed?: boolean;
  delayedRef?: string;
  delayedPrompt?: string;
  relate: TouchRelate;
  think: TouchThink;
  apply: TouchApply;
  reveal: TouchReveal;
  remember: TouchRemember;
  guardrail?: boolean;
  distressPrompt?: string;
  transferTest?: boolean;
}

export interface RetrievalCheck {
  prompt1: string;
  prompt2: string;
  reveal: string;
}

export interface ModuleWeek {
  num: number; // 1 to 7
  title: string;
  mechanism: string; // 'A', 'B', 'C', 'both'
  kind: 'blocked' | 'technique' | 'integration';
  retrievalCheck: RetrievalCheck | null;
  hasReferenceCard?: boolean;
  touches: ModuleTouch[];
  summary: string | null;
}

export interface ReinforcementBankRep {
  code: string; // e.g. 'A1', 'A4', 'B1', 'B2'
  rep: number;
  type: 'reflection';
  scenario: string;
  prompt: string;
  reveal: string;
}

export interface ToolData {
  code: string;
  title: string;
  mechShort: string;
  kind: 'log_single' | 'upsert' | 'upsert_plus_log' | 'log_multi';
  intro: string;
  logLabel?: string;
  firstPlaceholder?: string;
  placeholder: string;
  firstUseExample?: string;
  revisitTip?: string;
}

export interface MhpiQuestion {
  id: string;
  label?: string;
  prompt: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  reverse?: boolean;
}

export interface MhpiConfig {
  baselineQuestions: MhpiQuestion[];
  weeklyQuestions: MhpiQuestion[];
  endExtraQuestions: MhpiQuestion[];
  endChoice: {
    id: string;
    prompt: string;
    options: string[];
  };
}

export interface EscalationConfig {
  tier1: string;
  tier2: string;
  systemPrompt: string;
  tier1FallbackWords: string[];
  tier2FallbackWords: string[];
}

export interface OpenQuestion {
  area: string;
  text: string;
}

export interface ModuleContent {
  moduleId: string;
  brief: ModuleBrief;
  introScreens: IntroScreen[];
  weeks: ModuleWeek[];
  reinforcementBank: ReinforcementBankRep[];
  toolsData: Record<string, ToolData>;
  mhpiConfig: MhpiConfig;
  escalationConfig: EscalationConfig;
  openQuestions: OpenQuestion[];
}
