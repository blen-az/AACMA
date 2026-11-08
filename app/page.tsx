import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Camera,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Recycle,
  Scale,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { AssistantTrigger } from "@/components/site/AssistantTrigger";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Skyline } from "@/components/site/Skyline";
import { MAIN_NAV } from "@/content/site";

const card =
  "group rounded-lg border border-line bg-surface p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand-blue-text/40";

function SectionTitle({ title, intro, id }: { title: string; intro?: string; id?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center" data-reveal>
      <h2 id={id} className="text-3xl text-brand-blue-text">{title}</h2>
      {intro && <p className="mt-3 text-slate-400">{intro}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader nav={MAIN_NAV} />
      <main>
        {/* Hero */}
        <section id="home" className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_10%,rgb(16_118_189/0.35),transparent_70%),radial-gradient(45%_40%_at_85%_20%,rgb(28_142_99/0.25),transparent_70%)]" />
          <Skyline className="absolute inset-x-0 bottom-0 -z-10 h-[70%] w-full" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(15_23_42/0.55),rgb(15_23_42/0.92))]" />

          <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
            <div className="animate-fade-up">
              <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                <Sparkles className="size-3.5 text-brand-green-text" aria-hidden /> AI services in English &amp; Amharic
              </p>
              <h1 className="mt-6 text-[2.6rem] leading-tight text-balance uppercase tracking-tight text-white sm:text-6xl md:text-7xl">
                Together for a
                <span className="block text-brand-blue-text">Cleaner Addis</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
                Get answers about cleansing services, report a problem in your neighbourhood with a photo, and learn
                how to keep our city clean.
              </p>
            </div>

            <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:120ms] sm:flex-row">
              <AssistantTrigger
                mode="question"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-7 py-3.5 text-white transition-colors hover:bg-brand-blue-hover sm:w-auto"
              >
                <MessageCircle className="size-5" aria-hidden /> Ask the AI assistant
              </AssistantTrigger>
              <AssistantTrigger
                mode="complaint"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 text-white transition-colors hover:border-brand-blue-text hover:text-brand-blue-text sm:w-auto"
              >
                <Camera className="size-5" aria-hidden /> Report a cleansing problem
              </AssistantTrigger>
            </div>
            <Link
              href="/training"
              className="mt-5 inline-flex animate-fade-up items-center gap-1.5 text-sm text-brand-green-text transition-colors [animation-delay:200ms] hover:text-white"
            >
              <GraduationCap className="size-4" aria-hidden /> Visit the Virtual Training Centre
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <ul className="mx-auto mt-16 grid max-w-3xl animate-fade-up grid-cols-3 gap-4 [animation-delay:280ms]">
              {[
                { icon: Languages, label: "English & Amharic" },
                { icon: Camera, label: "Report with a photo" },
                { icon: GraduationCap, label: "Learn online" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 text-sm text-slate-300">
                  <Icon className="size-7 text-brand-blue-text" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services */}
        <section className="py-20" aria-labelledby="services">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle id="services" title="Online Services" intro="Everything starts with the AI assistant — no forms to fill in." />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div data-reveal>
                <AssistantTrigger mode="complaint" className={`${card} h-full w-full`}>
                  <TriangleAlert className="size-10 text-brand-blue-text" aria-hidden />
                  <h3 className="mt-5 text-lg text-white">Report a cleansing problem</h3>
                  <p className="mt-2 text-sm text-slate-400">Uncollected garbage or a dirty street? Send a photo and the location in a short chat.</p>
                </AssistantTrigger>
              </div>
              <div data-reveal style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
                <AssistantTrigger mode="question" className={`${card} h-full w-full`}>
                  <MessagesSquare className="size-10 text-brand-blue-text" aria-hidden />
                  <h3 className="mt-5 text-lg text-white">Ask about cleansing services</h3>
                  <p className="mt-2 text-sm text-slate-400">Ask in your own words, in English or Amharic, and get answers based on published guidance.</p>
                </AssistantTrigger>
              </div>
              <div data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
                <AssistantTrigger mode="question" className={`${card} h-full w-full`}>
                  <Recycle className="size-10 text-brand-blue-text" aria-hidden />
                  <h3 className="mt-5 text-lg text-white">Waste sorting &amp; recycling</h3>
                  <p className="mt-2 text-sm text-slate-400">Not sure how to separate household waste? Ask the assistant what the guidance says.</p>
                </AssistantTrigger>
              </div>
              <div data-reveal style={{ "--reveal-delay": "180ms" } as React.CSSProperties}>
                <Link href="/training" className={`${card} block h-full`}>
                  <GraduationCap className="size-10 text-brand-green-text" aria-hidden />
                  <h3 className="mt-5 text-lg text-white">Virtual Training Centre</h3>
                  <p className="mt-2 text-sm text-slate-400">Learning for staff, residents and high-school students about a cleaner city.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How reporting works */}
        <section className="border-y border-slate-800 bg-deep/60 py-20" aria-labelledby="how">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle id="how" title="How Reporting Works" intro="Four short steps inside the assistant. You can review and correct everything before you confirm." />
            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Camera, title: "Add a photo", text: "Take a picture or choose one from your phone." },
                { icon: MapPin, title: "Share the location", text: "Use your current location, or describe another place." },
                { icon: UserRound, title: "Describe & add contact", text: "A short description, your name and phone number." },
                { icon: ClipboardCheck, title: "Review & confirm", text: "Check every detail, edit anything, then confirm." },
              ].map(({ icon: Icon, title, text }, i) => (
                <li key={title} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties} className="relative rounded-lg border border-line bg-surface/60 p-6">
                  <span className="absolute right-5 top-4 text-4xl text-slate-700">{i + 1}</span>
                  <Icon className="size-8 text-brand-blue-text" aria-hidden />
                  <h3 className="mt-4 text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center" data-reveal>
              <AssistantTrigger mode="complaint" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-3 text-white transition-colors hover:bg-brand-blue-hover">
                Start a report <ArrowRight className="size-4" aria-hidden />
              </AssistantTrigger>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-20" aria-labelledby="about">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div data-reveal>
              <h2 id="about" className="text-3xl text-brand-blue-text">About AACMA</h2>
              {/* CONFIRM: about text drafted from the Meleph director pitch; replace with approved agency copy. */}
              <p className="mt-5 leading-relaxed text-slate-300">
                The agency works with sub-cities, woredas and residents to keep Addis Ababa clean — through solid-waste
                management, house-to-house awareness, training and community participation.
              </p>
              <p className="mt-4 leading-relaxed text-slate-400">
                These digital services support that work, in line with the city&apos;s Smart City direction and the Digital
                Ethiopia 2030 strategy: easier access to information, simpler reporting, and learning that reaches more people.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2" data-reveal>
              {[
                { icon: MessageCircle, title: "AI assistant", text: "Answers questions in English and Amharic." },
                { icon: Camera, title: "Photo reporting", text: "Report a problem with a photo and location in minutes." },
                { icon: GraduationCap, title: "Virtual training", text: "Courses for staff, residents and students." },
                { icon: Megaphone, title: "Public awareness", text: "Short messages that lead to useful information." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-lg border border-line bg-surface p-5">
                  <Icon className="size-6 text-brand-green-text" aria-hidden />
                  <h3 className="mt-3 text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* News & updates */}
        <section className="border-t border-slate-800 bg-deep/60 py-20" aria-labelledby="news">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle id="news" title="News & Updates" intro="What's new in AACMA's digital services." />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Languages, tag: "Assistant", title: "Ask in English or Amharic", text: "The AI assistant understands both languages and you can switch at any time during a conversation.", from: "from-brand-blue/40" },
                { icon: GraduationCap, tag: "Coming soon", title: "Virtual Training Centre", text: "Online courses on waste separation, community cleanliness and school participation are being prepared.", from: "from-brand-green/40" },
                { icon: Megaphone, tag: "Coming soon", title: "Digital awareness programme", text: "Short educational messages that lead residents to the assistant and the Training Centre.", from: "from-brand-blue/30" },
              ].map(({ icon: Icon, tag, title, text, from }, i) => (
                <article key={title} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties} className="overflow-hidden rounded-lg border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-brand-blue-text/40">
                  <div className={`grid h-36 place-items-center bg-gradient-to-br ${from} to-deep`}>
                    <Icon className="size-14 text-white/80" aria-hidden />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-brand-blue-text">{tag}</p>
                    <h3 className="mt-1.5 text-white">{title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Publications */}
        <section className="py-20" aria-labelledby="publications">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle id="publications" title="Publications" intro="Guidance the AI assistant draws on. The public library is being prepared." />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Scale, title: "Laws & directives", text: "Solid-waste regulations and directives in force." },
                { icon: Recycle, title: "Sorting & recycling guides", text: "How to separate household waste at source." },
                { icon: BookOpen, title: "Awareness materials", text: "Leaflets and lessons for residents and schools." },
                { icon: FileText, title: "Service information", text: "How cleansing services and reporting work." },
              ].map(({ icon: Icon, title, text }, i) => (
                <div key={title} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties} className="rounded-lg border border-line bg-surface p-6">
                  <Icon className="size-8 text-brand-blue-text" aria-hidden />
                  <h3 className="mt-4 text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{text}</p>
                  <p className="mt-4 inline-block rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">Library in preparation</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact — no unconfirmed contact details are shown (WEB-02) */}
        <section className="border-t border-slate-800 bg-deep/60 py-20" aria-labelledby="contact">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6" data-reveal>
            <h2 id="contact" className="text-3xl text-brand-blue-text">Contact</h2>
            <p className="mt-4 text-slate-300">
              Have a question about cleansing services? The AI assistant can help right away, in English or Amharic.
            </p>
            <p className="mt-2 text-sm text-slate-400">Official office contact details will be published here.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <AssistantTrigger mode="question" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-3 text-white transition-colors hover:bg-brand-blue-hover">
                <MessageCircle className="size-5" aria-hidden /> Ask the AI assistant
              </AssistantTrigger>
              <AssistantTrigger mode="complaint" className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3 text-slate-200 transition-colors hover:border-brand-blue-text hover:text-brand-blue-text">
                <Camera className="size-5" aria-hidden /> Report a cleansing problem
              </AssistantTrigger>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
