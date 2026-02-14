// Shared types for landing page components

export interface HeroContent {
  title: string;
  subtitle: string;
  subtitleEn: string;
  sectors: string;
  badge: string;
}

export interface NoNoiseContent {
  title: string;
  subtitle: string;
  swagger: string;
  closing: string;
}

export interface ClaimsContent {
  tag: string;
  title: string;
  subtitle: string;
  items: string[];
}

export interface PersonaContent {
  role: string;
  before: string;
  after: string;
}

export interface PromiseContent {
  tag: string;
  title: string;
  subtitle: string;
  personas: PersonaContent[];
}

export interface ModeContent {
  title: string;
  desc: string;
}

export interface PlatformContent {
  tag: string;
  title: string;
  subtitle: string;
  modes: ModeContent[];
}

export interface LayerContent {
  name: string;
  desc: string;
}

export interface EngineContent {
  title: string;
  desc: string;
}

export interface ArchitectureContent {
  tag: string;
  title: string;
  intro: string;
  layers: LayerContent[];
  engines: EngineContent[];
}

export interface BetaFormContent {
  tag: string;
  title: string;
  subtitle: string;
  note: string;
  form: {
    name: string;
    email: string;
    org: string;
    role: string;
    roleOptions: string[];
    submit: string;
  };
}
