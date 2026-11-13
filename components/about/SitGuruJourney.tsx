"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, CalendarDays, Camera, CheckCircle2, Clock3,
  Compass, Flag, Globe2, Handshake, Heart, Laptop, Lightbulb, Megaphone,
  PawPrint, Rocket, Sparkles, UsersRound, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  journeyFeatures, journeyMilestones,
  type JourneyCategory, type JourneyFeature, type JourneyIcon,
  type JourneyMilestone, type JourneyStatus,
} from "./journeyData";
import styles from "./SitGuruJourney.module.css";

type Filter = JourneyCategory | "all";

const filterOptions: readonly { id: Filter; label: string; icon: LucideIcon; accent: string }[] = [
  { id: "all", label: "All Milestones", icon: PawPrint, accent: "#0b6154" },
  { id: "platform", label: "Platform & Features", icon: Laptop, accent: "#058da5" },
  { id: "team", label: "Team & Community", icon: UsersRound, accent: "#8b3eae" },
  { id: "guru", label: "Guru Growth", icon: PawPrint, accent: "#ea7418" },
  { id: "pet-parent", label: "Pet Parent Growth", icon: Heart, accent: "#399640" },
  { id: "programs", label: "Programs & Partnerships", icon: Handshake, accent: "#177a98" },
];

const milestoneIcons: Record<JourneyIcon, LucideIcon> = {
  idea: Lightbulb,
  founders: Flag,
  care: PawPrint,
  team: UsersRound,
  community: BookOpen,
  scale: Rocket,
  future: Globe2,
};

const featureIcons: Record<JourneyFeature["icon"], LucideIcon> = {
  parents: Heart,
  gurus: PawPrint,
  ambassadors: Megaphone,
  partners: Handshake,
  reads: BookOpen,
  studio: Camera,
};

const categoryColors: Record<JourneyCategory, string> = {
  platform: "#058da5",
  team: "#8b3eae",
  guru: "#dc7519",
  "pet-parent": "#368d38",
  programs: "#177a98",
};

const statusText: Record<JourneyStatus, string> = {
  completed: "Milestone",
  evolving: "Growing now",
  planned: "Future plan",
};

const HOVER_DELAY_MS = 160;
const LEAVE_DELAY_MS = 260;
const PEEK_WIDTH = 350;
const PEEK_HEIGHT = 315;

function toneStyle(accent: string): CSSProperties {
  return { "--journey-accent": accent } as CSSProperties;
}

export default function SitGuruJourney() {
  const [filter, setFilter] = useState<Filter>("all");
  const [peekId, setPeekId] = useState<string | null>(null);
  const [peekPosition, setPeekPosition] = useState({ top: 12, left: 12 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimer.current !== null) clearTimeout(enterTimer.current);
    if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
    enterTimer.current = null;
    leaveTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!peekId) return;
    const dismiss = () => setPeekId(null);
    window.addEventListener("scroll", dismiss, { passive: true, capture: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [peekId]);

  useEffect(() => {
    if (!selectedId) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const originalOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      if (dialog.open) dialog.close();
    };
  }, [selectedId]);

  const showHover = (event: ReactPointerEvent<HTMLButtonElement>, milestone: JourneyMilestone) => {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches
    ) return;
    clearTimers();
    const rect = event.currentTarget.getBoundingClientRect();
    const desiredTop = rect.bottom + 14;
    const top = desiredTop + PEEK_HEIGHT < window.innerHeight - 12
      ? desiredTop
      : Math.max(12, rect.top - PEEK_HEIGHT - 14);
    const left = Math.max(
      12,
      Math.min(window.innerWidth - PEEK_WIDTH - 12, rect.left + rect.width / 2 - PEEK_WIDTH / 2),
    );
    enterTimer.current = setTimeout(() => {
      setPeekPosition({ top, left });
      setPeekId(milestone.id);
    }, HOVER_DELAY_MS);
  };

  const hideHover = () => {
    if (enterTimer.current !== null) clearTimeout(enterTimer.current);
    enterTimer.current = null;
    if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setPeekId(null), LEAVE_DELAY_MS);
  };

  const openMilestone = (id: string, opener?: HTMLElement) => {
    clearTimers();
    setPeekId(null);
    focusReturn.current = opener ?? (document.activeElement as HTMLElement | null);
    setSelectedId(id);
  };

  const closeMilestone = () => dialogRef.current?.close();

  const onDialogClose = () => {
    setSelectedId(null);
    focusReturn.current?.focus({ preventScroll: true });
  };

  const changeFilter = (next: Filter) => {
    clearTimers();
    setPeekId(null);
    setFilter(next);
  };

  const visibleMilestones = journeyMilestones.filter((milestone) =>
    filter === "all" || milestone.categories.includes(filter),
  );
  const peek = journeyMilestones.find((milestone) => milestone.id === peekId);
  const selected = journeyMilestones.find((milestone) => milestone.id === selectedId);

  return (
    <section id="our-growth-journey" className={styles.section} aria-labelledby="journey-title">
      <div className={styles.hero}>
        <div className={styles.heroArt}>
          <Image
            src="/images/hero/sitguru-dog-walking-hero.jpg"
            alt="A Guru walking dogs outdoors"
            fill
            sizes="(max-width: 720px) 100vw, 320px"
            className={styles.walkerImage}
          />
        </div>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}><PawPrint size={15} aria-hidden="true" /> Our Story, One Pawprint at a Time</span>
          <h2 id="journey-title">Our <span>Growth</span> Journey</h2>
          <p>
            From an idea to a growing pet care community — see the people,
            features, and moments that help SitGuru bring the pack together.
          </p>
          <div className={styles.statusLegend} aria-label="Milestone status key">
            <span><CheckCircle2 size={15} aria-hidden="true" /> Milestones</span>
            <span><Sparkles size={15} aria-hidden="true" /> Growing now</span>
            <span><Clock3 size={15} aria-hidden="true" /> Future plans</span>
          </div>
        </div>
        <PawPrint className={styles.heroPaw} size={82} aria-hidden="true" />
      </div>

      <div className={styles.filterBar} role="group" aria-label="Filter journey milestones">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              type="button"
              key={option.id}
              className={styles.filterButton + (filter === option.id ? " " + styles.filterSelected : "")}
              style={toneStyle(option.accent)}
              aria-pressed={filter === option.id}
              onClick={() => changeFilter(option.id)}
            >
              <Icon size={18} aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={styles.timeline} aria-live="polite">
        {filter === "all" && (
          <svg className={styles.trail} viewBox="0 0 1200 105" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 15 55 C 180 6 285 92 440 46 S 740 12 890 55 S 1080 78 1185 18" fill="none" stroke="#ffffff" strokeWidth="30" strokeLinecap="round" />
            <path d="M 15 55 C 180 6 285 92 440 46 S 740 12 890 55 S 1080 78 1185 18" fill="none" stroke="#b6de80" strokeWidth="18" strokeLinecap="round" />
            <path d="M 15 55 C 180 6 285 92 440 46 S 740 12 890 55 S 1080 78 1185 18" fill="none" stroke="#0c6d64" strokeWidth="4" strokeLinecap="round" strokeDasharray="13 16" />
          </svg>
        )}
        <ol className={styles.milestoneGrid + (filter !== "all" ? " " + styles.filteredGrid : "")}>
          {visibleMilestones.map((milestone) => {
            const Icon = milestoneIcons[milestone.icon];
            return (
              <li key={milestone.id} className={styles.milestoneCell} style={toneStyle(milestone.accent)}>
                <button
                  type="button"
                  className={styles.milestone + (peekId === milestone.id ? " " + styles.milestoneActive : "") + (milestone.status === "planned" ? " " + styles.milestonePlanned : "")}
                  aria-haspopup="dialog"
                  aria-label={"Explore " + milestone.date + ": " + milestone.title}
                  onPointerEnter={(event) => showHover(event, milestone)}
                  onPointerLeave={hideHover}
                  onClick={(event) => openMilestone(milestone.id, event.currentTarget)}
                >
                  <span className={styles.dateLabel}><CalendarDays size={16} aria-hidden="true" /> {milestone.date}</span>
                  <span className={styles.milestoneTitle}>{milestone.title}</span>
                  <span className={styles.milestoneSummary}>{milestone.summary}</span>
                  <span className={styles.milestoneFoot}>
                    {milestone.status === "planned" ? <Clock3 size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                    {statusText[milestone.status]}
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                  <span className={styles.pawMarker}><Icon size={25} aria-hidden="true" /></span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className={styles.exploreHint}><Sparkles size={19} aria-hidden="true" /> Hover or click a milestone to explore. On mobile, tap a pawprint or card.</p>

      <div className={styles.featureIntro}>
        <div>
          <span className={styles.featureEyebrow}>Built for every part of the pack</span>
          <h3>More ways to connect, care & grow</h3>
        </div>
        <span className={styles.featureNote}>Explore the SitGuru experiences behind the milestones.</span>
      </div>
      <div className={styles.featureGrid}>
        {journeyFeatures.map((feature) => {
          const Icon = featureIcons[feature.icon];
          return (
            <article
              className={styles.featureCard}
              key={feature.title}
              style={toneStyle(categoryColors[feature.category])}
            >
              <div className={styles.featureTitle}><Icon size={23} aria-hidden="true" /><h4>{feature.title}</h4></div>
              <p className={styles.featureSubtitle}>{feature.subtitle}</p>
              <ul>
                {feature.points.map((point) => <li key={point}><CheckCircle2 size={15} aria-hidden="true" />{point}</li>)}
              </ul>
              <Link href={feature.href} className={styles.featureLink}>
                {feature.cta} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
      <div className={styles.footerNote}><Heart size={22} aria-hidden="true" /> A Growing Community of Pet People <PawPrint size={21} aria-hidden="true" /></div>

      {peek && typeof document !== "undefined" && createPortal(
        <aside
          className={styles.peek}
          style={{ ...toneStyle(peek.accent), left: peekPosition.left, top: peekPosition.top }}
          aria-label={"Milestone preview: " + peek.title}
          onPointerEnter={() => {
            if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
          }}
          onPointerLeave={hideHover}
        >
          <div className={styles.peekTop}>
            <span><CalendarDays size={14} aria-hidden="true" /> {peek.date}</span>
            <button type="button" onClick={() => setPeekId(null)} aria-label="Close milestone preview"><X size={17} /></button>
          </div>
          <h3>{peek.title}</h3>
          <span className={styles.peekStatus}>{statusText[peek.status]}</span>
          <p>{peek.story}</p>
          <button type="button" className={styles.peekAction} onClick={(event) => openMilestone(peek.id, event.currentTarget)}>
            Explore the milestone <ArrowRight size={16} aria-hidden="true" />
          </button>
        </aside>,
        document.body
      )}

      <dialog
        className={styles.dialog}
        ref={dialogRef}
        aria-labelledby="journey-dialog-title"
        aria-describedby="journey-dialog-story"
        onClose={onDialogClose}
        onClick={(event) => { if (event.target === dialogRef.current) closeMilestone(); }}
      >
        {selected && (
          <div className={styles.dialogContent} style={toneStyle(selected.accent)}>
            <button className={styles.dialogClose} type="button" onClick={closeMilestone} aria-label="Close milestone"><X size={22} /></button>
            <div className={styles.dialogHeading}>
              <span className={styles.dialogDate}><CalendarDays size={17} aria-hidden="true" /> {selected.date}</span>
              <span className={styles.dialogStatus}>
                {selected.status === "planned" ? <Clock3 size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                {statusText[selected.status]}
              </span>
              <h2 id="journey-dialog-title">{selected.title}</h2>
            </div>
            <div className={styles.dialogImage}>
              <Image
                src={selected.image}
                alt={selected.imageAlt}
                fill
                sizes="(max-width: 720px) 100vw, 620px"
                className={selected.id === "founded" ? styles.imageContain : styles.imageCover}
              />
            </div>
            {selected.id === "beyond" && <p className={styles.dialogImageCaption}>Our vision: stronger local communities, connected through a wider network. This is an illustration, not a map of current coverage.</p>}
            <div className={styles.dialogBody}>
              <p id="journey-dialog-story" className={styles.dialogStory}>{selected.story}</p>
              <h3>{selected.status === "planned" ? "What we're working toward" : "Milestone highlights"}</h3>
              <ul className={styles.achievementList}>
                {selected.achievements.map((item) => (
                  <li key={item}>
                    {selected.status === "planned" ? <Compass size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {selected.links && selected.links.length > 0 && (
                <div className={styles.dialogLinks}>
                  {selected.links.map((link) => <Link key={link.href} href={link.href}>{link.label} <ArrowRight size={15} aria-hidden="true" /></Link>)}
                </div>
              )}
              <button type="button" className={styles.backButton} onClick={closeMilestone}>Back to the journey</button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
