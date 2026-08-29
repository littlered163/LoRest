// Deterministic daily context: simulated weather + per-trimester advice.
// Both are derived from the calendar date (same seed pattern as history.ts)
// and the user's pregnancy week, so they never require external APIs.

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface SimWeather {
  temp: number;
  humidity: number;
  labelZh: string;
  labelEn: string;
}

export function simWeatherFor(date: Date): SimWeather {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  // Season-aware base temp (northern China approximation, months 1-12)
  const baseTemps = [4, 7, 12, 18, 23, 28, 30, 29, 24, 18, 11, 5];
  const base = baseTemps[date.getMonth()];
  const temp = Math.round(base + (seededRand(seed + 11) - 0.5) * 6);
  const humidity = 45 + Math.round(seededRand(seed + 17) * 35);
  const weatherIdx = Math.floor(seededRand(seed + 23) * 4);
  const labels = [
    { zh: "晴", en: "Sunny" },
    { zh: "多云", en: "Cloudy" },
    { zh: "小雨", en: "Light rain" },
    { zh: "阴", en: "Overcast" },
  ];
  const label = labels[weatherIdx];
  return { temp, humidity, labelZh: label.zh, labelEn: label.en };
}

interface AdviceEntry {
  pillZh: string;
  pillEn: string;
  bodyZh: (temp: number, weather: string) => string;
  bodyEn: (temp: number, weather: string) => string;
}

// Early trimester (weeks 4-13): nausea, rest, hydration
const EARLY: AdviceEntry[] = [
  {
    pillZh: "休息日",
    pillEn: "Rest day",
    bodyZh: (t, w) => `今日${w}，约 ${t}℃。孕早期多休息，试试左侧卧，让身体慢慢放松下来。`,
    bodyEn: (t, w) => `${w}, ~${t}℃. Early pregnancy — rest well and try left-side lying to ease tension.`,
  },
  {
    pillZh: "轻缓日",
    pillEn: "Gentle day",
    bodyZh: (t, w) => `今日${w}，${t}℃。保持室内通风，白天多补水，睡前一小时少喝，减少夜醒。`,
    bodyEn: (t, w) => `${w}, ${t}℃. Keep the room aired, stay hydrated through the day and ease off fluids before bed.`,
  },
];

// Mid trimester (weeks 14-27): positioning, walking, nap
const MID: AdviceEntry[] = [
  {
    pillZh: "轻缓日",
    pillEn: "Gentle day",
    bodyZh: (t, w) => `今日${w}，${t}℃。午后散步 15 分钟有助于血液循环，今晚左侧卧效果更好。`,
    bodyEn: (t, w) => `${w}, ${t}℃. A 15-min afternoon walk boosts circulation — try left-side sleeping tonight.`,
  },
  {
    pillZh: "安静日",
    pillEn: "Calm day",
    bodyZh: (t, w) => `今日${w}，约 ${t}℃。午后小憩 20 分钟，可以缓解水肿和腿部疲劳，晚上早点准备入睡。`,
    bodyEn: (t, w) => `${w}, ~${t}℃. A 20-min afternoon nap eases swelling and leg fatigue — wind down early tonight.`,
  },
];

// Late trimester (weeks 28-40): side sleep, leg elevation, breathing
const LATE: AdviceEntry[] = [
  {
    pillZh: "安心日",
    pillEn: "Restful day",
    bodyZh: (t, w) => `今日${w}，${t}℃。孕晚期侧卧时双腿间夹个枕头，能有效缓解腰背压力，睡得更稳。`,
    bodyEn: (t, w) => `${w}, ${t}℃. Late pregnancy — a pillow between your knees while side-sleeping eases lower back pressure.`,
  },
  {
    pillZh: "轻缓日",
    pillEn: "Gentle day",
    bodyZh: (t, w) => `今日${w}，${t}℃。今晚试试床垫腿部抬高功能，有助于缓解腿部酸胀，更快入睡。`,
    bodyEn: (t, w) => `${w}, ${t}℃. Try the mattress leg elevation tonight — it can ease leg tiredness and help you fall asleep faster.`,
  },
];

export interface DailyContext {
  temp: number;
  humidity: number;
  pillZh: string;
  pillEn: string;
  adviceZh: string;
  adviceEn: string;
}

export function getDailyContext(week: number, date: Date): DailyContext {
  const weather = simWeatherFor(date);
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const pool = week <= 13 ? EARLY : week <= 27 ? MID : LATE;
  const entry = pool[Math.floor(seededRand(seed + 99) * pool.length)];
  return {
    temp: weather.temp,
    humidity: weather.humidity,
    pillZh: entry.pillZh,
    pillEn: entry.pillEn,
    adviceZh: entry.bodyZh(weather.temp, weather.labelZh),
    adviceEn: entry.bodyEn(weather.temp, weather.labelEn),
  };
}
