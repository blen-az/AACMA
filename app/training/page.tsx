import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpenText,
  Briefcase,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Clock,
  GraduationCap,
  Home,
  Lock,
  PlayCircle,
  School,
  TrendingUp,
} from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TRAINING_NAV } from "@/content/site";

export const metadata: Metadata = {
  title: "Virtual Training Centre",
  description: "Online learning about waste separation, community cleanliness and sanitation for staff, residents and students.",
};

const AUDIENCES = [
  {
    key: "staff",
    icon: Briefcase,
    title: "Agency & woreda / sub-city staff",
    text: "Consistent, up-to-date guidance for field and awareness staff — take assigned training at your own pace.",
    band: "bg-brand-blue",
    label: "Staff",
  },
  {
    key: "residents",
    icon: Home,
    title: "Residents",
    text: "Practical lessons on separating waste at home, keeping your street clean and taking part in community efforts.",
    band: "bg-brand-green",
    label: "Residents",
  },
  {
    key: "students",
    icon: School,
    title: "High-school students",
    text: "Engaging lessons and activities that bring cleanliness and recycling into schools and clubs.",
    band: "bg-amber-500",
    label: "Students",
  },
] as const;

type Audience = (typeof AUDIENCES)[number]["key"];

// Illustrative course titles (spec TR-03): conceptual until AACMA-approved material exists.
const COURSES: { title: string; category: string; audience: Audience; lessons: number; minutes: number }[] = [
  { title: "Separating household waste at source", category: "Waste segregation", audience: "residents", lessons: 6, minutes: 45 },
  { title: "Recycling basics for families", category: "Waste segregation", audience: "residents", lessons: 5, minutes: 35 },
  { title: "Organising a neighbourhood clean-up", category: "Community cleanliness", audience: "residents", lessons: 4, minutes: 30 },
  { title: "House-to-house awareness facilitation", category: "Community cleanliness", audience: "staff", lessons: 8, minutes: 70 },
  { title: "Field sanitation awareness essentials", category: "Field sanitation awareness", audience: "staff", lessons: 7, minutes: 60 },
  { title: "Clean school, green school", category: "School participation", audience: "students", lessons: 5, minutes: 40 },
];

const FEATURES = [
  { icon: PlayCircle, title: "Lesson videos", text: "Short video lessons you can watch on a phone." },
  { icon: BookOpenText, title: "Reading materials", text: "Guides and manuals to read alongside each lesson." },
  { icon: CircleHelp, title: "In-lesson questions", text: "Quick questions that check understanding as you go." },
  { icon: ClipboardList, title: "Final exam", text: "An end-of-course assessment for each course." },
  { icon: TrendingUp, title: "Progress tracking", text: "See where you left off and what is left to finish." },
  { icon: Award, title: "Digital certificate", text: "A certificate of completion for finished courses." },
];

const audienceOf = (k: Audience) => AUDIENCES.find((a) => a.key === k)!;

export default function TrainingPage() {
  return (
    <>
      <SiteHeader nav={TRAINING_NAV} title="Virtual Training Centre" subtitle="AACMA · Learning platform" accent="green" homeHref="/training" />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_80%_20%,rgb(28_142_99/0.35),transparent_70%),radial-gradient(40%_40%_at_10%_80%,rgb(16_118_189/0.25),transparent_70%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(148_163_184/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-28">
            <div className="animate-fade-up">
              <Link href="/" className="flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-brand-green-text">
                <ArrowLeft className="size-4" aria-hidden /> Back to the AACMA website
              </Link>
              <p className="mt-8 flex w-fit items-center gap-2 rounded-full border border-brand-green-text/30 bg-brand-green/10 px-3 py-1 text-xs uppercase tracking-wide text-brand-green-text">
                <GraduationCap className="size-3.5" aria-hidden /> Launching soon
              </p>
              <h1 className="mt-5 text-5xl uppercase tracking-tight text-white md:text-6xl">
                AACMA Virtual
                <span className="block text-brand-green-text">Training Centre</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Learn about waste separation, recycling and keeping Addis Ababa clean — at your own pace, from wherever you are.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="#courses" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green-button px-7 py-3.5 text-white transition-colors hover:bg-brand-green-button-hover">
                  Explore courses
                </Link>
                <Link href="#learners" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-7 py-3.5 text-white transition-colors hover:border-brand-green-text hover:text-brand-green-text">
                  Who it&apos;s for
                </Link>
              </div>
            </div>

            {/* Illustrative learner view — a picture of the planned platform, not a working course */}
            <figure className="animate-fade-up rounded-2xl border border-line bg-surface/90 p-5 shadow-2xl shadow-black/40 [animation-delay:150ms]" aria-label="Preview of the planned learning experience">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-green" /> Preview of the planned platform</span>
                <span className="rounded bg-white/5 px-2 py-0.5">Illustration</span>
              </div>
              <div className="mt-4 grid aspect-video place-items-center rounded-xl bg-gradient-to-br from-brand-green/40 via-base to-brand-blue/30">
                <PlayCircle className="size-16 text-white/85" aria-hidden />
              </div>
              <div className="mt-4">
                <p className="text-xs text-brand-green-text">Waste segregation · Lesson 2 of 6</p>
                <p className="mt-1 text-white">Separating household waste at source</p>
                <div className="mt-3 h-2 rounded-full bg-base" aria-hidden>
                  <div className="h-2 w-1/3 rounded-full bg-gradient-to-r from-brand-green to-brand-green-text" />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  { done: true, label: "Why separation matters" },
                  { done: false, current: true, label: "Organic, recyclable and other waste" },
                  { done: false, label: "Quick check: 3 questions" },
                ].map((l) => (
                  <li key={l.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${l.current ? "bg-brand-green/10 text-white" : "text-slate-400"}`}>
                    {l.done ? <CheckCircle2 className="size-4 text-brand-green-text" aria-hidden /> : l.current ? <PlayCircle className="size-4 text-brand-green-text" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                    {l.label}
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </section>

        {/* Learners */}
        <section className="border-y border-slate-800 bg-deep/60 py-20" aria-labelledby="learners">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center" data-reveal>
              <h2 id="learners" className="text-3xl text-brand-green-text">Who It&apos;s For</h2>
              <p className="mt-3 text-slate-400">One platform, with learning paths for three groups.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {AUDIENCES.map(({ key, icon: Icon, title, text, band }, i) => (
                <div key={key} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties} className="overflow-hidden rounded-lg border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-brand-green-text/40">
                  <div className={`h-1.5 ${band}`} />
                  <div className="p-6">
                    <Icon className="size-9 text-brand-green-text" aria-hidden />
                    <h3 className="mt-4 text-lg text-white">{title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Course catalogue — cards are previews and deliberately not links (TR-03, §8) */}
        <section className="py-20" aria-labelledby="courses">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end" data-reveal>
              <div>
                <h2 id="courses" className="text-3xl text-brand-green-text">Course Catalogue</h2>
                <p className="mt-3 max-w-xl text-slate-400">A first look at the planned courses. Titles are illustrative until the course material is approved.</p>
              </div>
              <ul className="flex flex-wrap gap-2 text-xs" aria-label="Course categories">
                {["Waste segregation", "Community cleanliness", "Field sanitation awareness", "School participation"].map((c) => (
                  <li key={c} className="rounded-full border border-line px-3 py-1.5 text-slate-300">{c}</li>
                ))}
              </ul>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {COURSES.map((c, i) => {
                const a = audienceOf(c.audience);
                return (
                  <article key={c.title} data-reveal style={{ "--reveal-delay": `${(i % 3) * 60}ms` } as React.CSSProperties} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
                    <div className={`h-1.5 ${a.band}`} />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-brand-green-text">{c.category}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">{a.label}</span>
                      </div>
                      <h3 className="mt-3 text-lg text-white">{c.title}</h3>
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><BookOpenText className="size-3.5" aria-hidden /> {c.lessons} lessons</span>
                        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> ~{c.minutes} min</span>
                      </div>
                      <div className="mt-5 flex items-center gap-3 text-slate-500" aria-label="Planned formats: video, reading, questions, certificate">
                        <PlayCircle className="size-4" aria-hidden />
                        <BookOpenText className="size-4" aria-hidden />
                        <CircleHelp className="size-4" aria-hidden />
                        <Award className="size-4" aria-hidden />
                      </div>
                      <div className="mt-auto pt-6">
                        <span className="inline-flex w-full cursor-default items-center justify-center rounded-lg border border-dashed border-line py-2.5 text-sm text-slate-400" aria-disabled="true">
                          Coming soon
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-800 bg-deep/60 py-20" aria-labelledby="features">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center" data-reveal>
              <h2 id="features" className="text-3xl text-brand-green-text">How Learning Will Work</h2>
              <p className="mt-3 text-slate-400">Planned features of the full platform.</p>
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }, i) => (
                <li key={title} data-reveal style={{ "--reveal-delay": `${(i % 3) * 60}ms` } as React.CSSProperties} className="flex gap-4 rounded-lg border border-line bg-surface p-6">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-green/15">
                    <Icon className="size-6 text-brand-green-text" aria-hidden />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white">{title}</h3>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">Planned</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-12 text-center" data-reveal>
              <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-line px-6 py-3 text-slate-200 transition-colors hover:border-brand-green-text hover:text-brand-green-text">
                <ArrowLeft className="size-4" aria-hidden /> Back to the AACMA website
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter accent="green" />
    </>
  );
}
