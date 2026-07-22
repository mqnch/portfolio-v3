import type { Metadata } from "next";
import { experience } from "@/app/scenes";

export const metadata: Metadata = {
  title: "work",
  description: "where i've worked",
};

export default function WorkPage() {
  return (
    <div className="space-y-3 text-lg">
      <p className="text-muted leading-relaxed">where i&apos;ve worked:</p>
      <ul className="space-y-3">
        {experience.map((item) => {
          const logo = item.logoScale ? (
            <span className="inline-block h-[1.05em] w-[1.05em] overflow-hidden rounded-sm">
              <img
                src={item.logo}
                alt=""
                className={`h-full w-full object-cover opacity-90 ${item.logoScale}`}
              />
            </span>
          ) : (
            <img
              src={item.logo}
              alt=""
              className="h-[1.05em] w-[1.05em] rounded-sm object-cover opacity-90"
            />
          );
          const company = item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {item.company}
            </a>
          ) : (
            <span>{item.company}</span>
          );
          return (
            <li
              key={item.company}
              className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-1.5 gap-y-0.5"
            >
              <div className="self-start pt-[0.12em]">{logo}</div>
              <div>{company}</div>
              <span className="text-faint text-base text-right">{item.period}</span>
              <p className="text-muted col-span-2 col-start-1 text-base leading-snug">
                {item.role}
              </p>
              <span className="text-faint text-base text-right">{item.location}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
