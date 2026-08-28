"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, Circle, Baby, Scale, Smile, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { TOTAL_WEEKS, WEEK_TIPS, weekInfo } from "@/lib/lorest/sleep";
import {
  fetchCheckups,
  fetchProfile,
  fetchTodos,
  saveProfile,
  toggleTodoApi,
  type CheckupDto,
  type PregnancyTodoDto,
} from "@/lib/api";

function EmptyHint({ text }: { text: string }) {
  return <p className="py-1 text-[13px] text-muted-foreground">{text}</p>;
}

export function PregnancyScreen() {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const { user } = useAuth();

  const [week, setWeek] = useState(24);
  const [weightKg, setWeightKg] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [todos, setTodos] = useState<PregnancyTodoDto[]>([]);
  const [checkups, setCheckups] = useState<CheckupDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([fetchProfile(), fetchTodos(), fetchCheckups()])
      .then(([p, td, ck]) => {
        if (!active) return;
        setWeek(p.week);
        setWeightKg(p.weightKg);
        setMood(p.mood);
        setTodos(td);
        setCheckups(ck);
      })
      .catch(() => undefined)
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [user]);

  const loading = Boolean(user) && !loaded;

  const info = weekInfo(week);
  const progress = Math.round((week / TOTAL_WEEKS) * 100);
  const weekWindow = [week - 1, week, week + 1, week + 2].filter((w) => w >= 4 && w <= TOTAL_WEEKS);

  async function chooseWeek(w: number) {
    setWeek(w);
    if (user) await saveProfile({ week: w }).catch(() => undefined);
  }

  async function onToggleTodo(id: string) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    if (user) await toggleTodoApi(id).catch(() => undefined);
  }

  return (
    <ScreenShell label="孕期旅程">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] tracking-wide text-muted-foreground">
            {t("pregnancy.dueCountdown", { days: info.daysToDue })}
          </div>
          <h1 className="font-heading mt-1.5 text-[28px] font-semibold leading-tight">
            {t("pregnancy.title")}
          </h1>
        </div>
        <LorestLangToggle />
      </header>

      {!user && (
        <a
          href="/login"
          data-el="pregnancy-sign-in"
          className="lorest-card mb-4 flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "rgba(156,183,154,.4)" }}>
            <UserRound className="h-5 w-5 text-[#8E6A5E]" aria-hidden />
          </span>
          <span className="text-[13px] leading-snug text-[#6E625C]">{t("me.signInTip")}</span>
        </a>
      )}

      <section className="lorest-card lorest-card-strong p-[18px]" data-el="pregnancy-baby">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full px-3 py-1.5 text-xs text-[#8E6A5E]" style={{ background: "rgba(156,183,154,.34)" }}>
            {t("pregnancy.weekBadge", { week })}
          </span>
          <span className="text-[13px] text-muted-foreground">{progress}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(174,194,206,.3)" }}>
          <i className="block h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#AEC2CE,#9CB79A)" }} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ background: "radial-gradient(circle,#fff,#E4CDA0 70%,#9CB79A)" }}>
            <Baby className="h-7 w-7 text-white/90" aria-hidden />
          </span>
          <div>
            <div className="text-[13px] text-muted-foreground">{t("pregnancy.sizeTitle")}</div>
            <div className="font-heading text-[18px]">
              {t("pregnancy.sizeCompare", { fruit: zh ? info.fruitZh : info.fruitEn })}
            </div>
            <div className="text-[13px] text-muted-foreground">
              {t("pregnancy.sizeDetail", { length: info.babyLengthCm, weight: info.babyWeightG })}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <div className="mb-2 text-[13px] text-muted-foreground">{t("pregnancy.weekSelector")}</div>
        <div className="flex gap-2 overflow-x-auto pb-1" data-el="pregnancy-week-selector" style={{ scrollbarWidth: "none" }}>
          {weekWindow.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => void chooseWeek(w)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm transition-colors"
              style={
                w === week
                  ? { background: "rgba(156,183,154,.5)", borderColor: "transparent", color: "#8E6A5E" }
                  : { background: "rgba(255,255,255,.4)", borderColor: "var(--border)", color: "#7D726D" }
              }
              aria-pressed={w === week}
            >
              {t("pregnancy.weekBadge", { week: w })}
            </button>
          ))}
        </div>
      </div>

      <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-tips">
        <h2 className="font-heading text-[17px]">{t("pregnancy.tipsTitle")}</h2>
        <div className="mt-3 grid gap-3">
          {WEEK_TIPS.map((tip) => (
            <div key={tip.id} className="rounded-2xl p-3.5" style={{ background: "rgba(255,252,247,.5)" }}>
              <div className="font-heading text-[15px]">{zh ? tip.titleZh : tip.titleEn}</div>
              <p className="mt-1 text-[13px] leading-[1.6] text-[#776C66]">{zh ? tip.bodyZh : tip.bodyEn}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-checkup">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-[#6E8390]" aria-hidden />
          <h2 className="font-heading text-[17px]">{t("pregnancy.checkupTitle")}</h2>
        </div>
        <div className="mt-3 grid gap-2.5">
          {(user ? checkups : []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 text-[14px]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full text-xs" style={{ background: c.done ? "rgba(127,154,166,.22)" : "rgba(156,183,154,.34)" }}>
                  {c.done ? <Check className="h-4 w-4 text-[#6E8390]" /> : <Circle className="h-3.5 w-3.5 text-[#B89A90]" />}
                </span>
                <span className={c.done ? "text-muted-foreground line-through" : "text-[#5F554F]"}>{c.label}</span>
              </div>
              <span className="text-[13px] text-muted-foreground">{c.dateLabel}</span>
            </div>
          ))}
          {!user && <EmptyHint text={t("me.signInTip")} />}
          {user && !loading && checkups.length === 0 && <EmptyHint text={t("common.loading")} />}
        </div>
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-todos">
        <h2 className="font-heading text-[17px]">{t("pregnancy.todoTitle")}</h2>
        <div className="mt-3 grid gap-2">
          {(user ? todos : []).map((td) => (
            <button
              key={td.id}
              type="button"
              onClick={() => void onToggleTodo(td.id)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px]"
              style={{ background: "rgba(255,252,247,.5)" }}
              data-el="pregnancy-todo-item"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full border" style={{ borderColor: td.done ? "transparent" : "var(--border)", background: td.done ? "rgba(156,183,154,.6)" : "transparent" }}>
                {td.done && <Check className="h-3.5 w-3.5 text-[#8E6A5E]" />}
              </span>
              <span className={td.done ? "text-muted-foreground line-through" : "text-[#5F554F]"}>{td.label}</span>
            </button>
          ))}
          {!user && <EmptyHint text={t("me.signInTip")} />}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3" data-el="pregnancy-log">
        <div className="lorest-card p-4">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Scale className="h-4 w-4" aria-hidden /> {t("pregnancy.recordWeight")}
          </div>
          <div className="mt-2 text-[20px] font-semibold">{weightKg ? `${weightKg} kg` : "—"}</div>
        </div>
        <div className="lorest-card p-4">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Smile className="h-4 w-4" aria-hidden /> {t("pregnancy.recordMood")}
          </div>
          <div className="mt-2 font-heading text-[20px]">{mood ?? "—"}</div>
        </div>
      </section>
    </ScreenShell>
  );
}
