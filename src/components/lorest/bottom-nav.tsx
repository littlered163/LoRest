"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Circle, Leaf, Moon, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/utils";

const TABS = [
  { href: "/", key: "today", Icon: Circle, el: "nav-today" },
  { href: "/pregnancy", key: "pregnancy", Icon: Leaf, el: "nav-pregnancy" },
  { href: "/companion", key: "companion", Icon: Moon, el: "nav-companion" },
  { href: "/me", key: "me", Icon: User, el: "nav-me" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgba(120,98,86,0.1)]"
      style={{
        paddingTop: 10,
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "max(18px, env(safe-area-inset-left))",
        paddingRight: "max(18px, env(safe-area-inset-right))",
        background: "rgba(250,247,242,.72)",
        backdropFilter: "blur(22px)",
      }}
      aria-label={t("nav.today")}
      data-el="bottom-nav"
    >
      <div className="mx-auto grid w-full max-w-[440px] grid-cols-4 gap-1">
        {TABS.map(({ href, key, Icon, el }) => {
          const active = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              data-el={el}
              className={cn(
                "grid place-items-center gap-1 rounded-[18px] px-1 py-2 transition-colors",
                active ? "text-[#8E6A5E]" : "text-[#9A908A]",
              )}
              style={active ? { background: "rgba(156,183,154,.22)" } : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              <span className="text-[11px]">{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
