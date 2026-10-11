// The ga4-report edge function's payloads (supabase/functions/ga4-report/reports.ts
// shapes them). Kept in step by hand — the function runs on Deno and cannot
// share an import with the app.

export interface Totals {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  screenPageViews: number;
  userEngagementDuration: number;
  bounceRate: number;
  eventCount: number;
  keyEvents: number;
  averageSessionDuration: number;
}

export interface DailyRow {
  date: string; // YYYY-MM-DD
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  screenPageViews: number;
  userEngagementDuration: number;
  eventCount: number;
  keyEvents: number;
}

export interface Traffic {
  sessions: number;
  activeUsers: number;
  newUsers: number;
  engagedSessions: number;
  userEngagementDuration: number;
  screenPageViews: number;
  keyEvents: number;
}

export type Audience = Traffic;

/** A row run over [current, previous]: current metrics on top, previous under `prev`. */
export type WithPrev<D, M> = D & M & { prev: M };

export interface Heat { sessions: number[][]; engaged: number[][] }

export interface Suspect {
  country: string;
  countryId?: string;
  sessions: number;
  users: number;
  engagementRate: number;
  secondsPerUser: number;
}

export interface PageRow {
  pagePath: string;
  pageTitle: string;
  screenPageViews: number;
  activeUsers: number;
  newUsers: number;
  userEngagementDuration: number;
  engagedSessions: number;
  sessions: number;
  eventCount: number;
  keyEvents: number;
  scrolls: number;
  prevViews: number;
  prevUsers: number;
}

export interface Cohort { start: string; end: string; size: number; active: Array<number | null> }

export interface Quota {
  hourRemaining: number | null;
  hourConsumed: number | null;
  dayRemaining: number | null;
  dayConsumed: number | null;
  projectHourRemaining: number | null;
}

export type CompareMode = "previous" | "year" | "none";

interface Common {
  success: true;
  generated_at: string;
  cached?: boolean;
  quality: { excluded: boolean; suspects: Suspect[] };
  errors: Array<{ report: string; message: string }>;
  range: { startDate: string; endDate: string; days: number };
  compare: { startDate: string; endDate: string; mode: "previous" | "year" } | null;
  totals: { current: Totals; previous: Totals | null };
  daily: { current: DailyRow[]; previous: DailyRow[] };
}

export interface Report extends Common {
  mode: "report";
  timeZone: string;
  quota: Quota | null;
  heatmap: { property: Heat; kst: Heat };
  userType: Array<WithPrev<{ newVsReturning: string }, { activeUsers: number; sessions: number; engagedSessions: number; userEngagementDuration: number; screenPageViews: number }>>;
  channels: Array<WithPrev<{ sessionDefaultChannelGroup: string }, Traffic>>;
  channelDaily: Array<{ date: string; sessionDefaultChannelGroup: string; sessions: number; engagedSessions: number }>;
  sources: Array<WithPrev<{ sessionSource: string; sessionMedium: string }, Traffic>>;
  campaigns: Array<Traffic & { sessionCampaignName: string; sessionSource: string; sessionMedium: string }>;
  firstUser: Array<{ firstUserDefaultChannelGroup: string; newUsers: number; engagedSessions: number }>;
  pages: PageRow[];
  landing: Array<WithPrev<{ landingPage: string }, Traffic>>;
  search: Array<{ searchTerm: string; eventCount: number; totalUsers: number }>;
  countries: Array<WithPrev<{ country: string; countryId: string }, Audience>>;
  cities: Array<{ city: string; country: string; activeUsers: number; sessions: number; engagedSessions: number; userEngagementDuration: number }>;
  devices: Array<WithPrev<{ deviceCategory: string }, Audience>>;
  os: Array<{ operatingSystem: string; activeUsers: number; sessions: number; engagedSessions: number }>;
  browsers: Array<{ browser: string; activeUsers: number; sessions: number; engagedSessions: number }>;
  languages: Array<{ language: string; activeUsers: number; sessions: number; engagedSessions: number }>;
  age: Array<{ userAgeBracket: string; activeUsers: number }>;
  gender: Array<{ userGender: string; activeUsers: number }>;
  events: Array<WithPrev<{ eventName: string }, { eventCount: number; totalUsers: number; keyEvents: number }>>;
  outbound: Array<WithPrev<{ linkDomain: string }, { eventCount: number; totalUsers: number }>>;
  outboundPages: Array<{ pagePath: string; linkDomain: string; eventCount: number; totalUsers: number }>;
  hosts: Array<{ hostName: string; sessions: number; activeUsers: number; engagedSessions: number }>;
  cohorts: Cohort[];
}

export interface DrillReport extends Common {
  mode: "drill";
  drill: { dimension: DrillDimension; value: string };
  pages: Array<{ pagePath: string; pageTitle: string; screenPageViews: number; activeUsers: number; userEngagementDuration: number }>;
  landing: Array<{ landingPage: string; sessions: number; engagedSessions: number }>;
  sources: Array<{ sessionSource: string; sessionMedium: string; sessions: number; engagedSessions: number; activeUsers: number }>;
  countries: Array<{ country: string; countryId: string; activeUsers: number; sessions: number; engagedSessions: number }>;
  devices: Array<{ deviceCategory: string; activeUsers: number; sessions: number; engagedSessions: number }>;
  events: Array<{ eventName: string; eventCount: number; totalUsers: number }>;
  outbound: Array<{ linkDomain: string; eventCount: number; totalUsers: number }>;
}

export interface Realtime {
  success: true;
  generated_at: string;
  cached?: boolean;
  activeUsers: number;
  minutes: number[]; // index = minutes ago
  pages: Array<{ unifiedScreenName: string; activeUsers: number; screenPageViews: number }>;
  countries: Array<{ country: string; activeUsers: number }>;
  devices: Array<{ deviceCategory: string; activeUsers: number }>;
  events: Array<{ eventName: string; eventCount: number }>;
}

export type DrillDimension =
  | "pagePath" | "landingPage" | "sessionDefaultChannelGroup" | "sessionSourceMedium"
  | "sessionCampaignName" | "country" | "deviceCategory" | "eventName" | "newVsReturning";

export interface DrillTarget { dimension: DrillDimension; value: string; label?: string }

export interface RangeParams {
  days?: number;
  start?: string;
  end?: string;
  compare: CompareMode;
  excludeBots: boolean;
}
