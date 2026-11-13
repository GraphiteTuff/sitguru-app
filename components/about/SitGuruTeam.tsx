"use client";

import Image from "next/image";
import { ArrowRight, Heart, PawPrint, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { sitguruTeam, type SitGuruTeamMember } from "./teamData";
import styles from "./SitGuruTeam.module.css";

const HOVER_DELAY = 170;
const LEAVE_DELAY = 270;
const PEEK_WIDTH = 340;
const PEEK_HEIGHT = 300;

function Avatar({ person, large = false }: { person: SitGuruTeamMember; large?: boolean }) {
  return (
    <span className={`${styles.avatar} ${large ? styles.avatarLarge : ""}`}>
      {person.image ? (
        <Image
          src={person.image}
          alt={`${person.name} — ${person.role}`}
          fill
          sizes={large ? "200px" : "(max-width: 600px) 42vw, (max-width: 1200px) 28vw, 190px"}
          className={styles.portrait}
        />
      ) : (
        <span className={styles.photoPending} aria-label="Photo coming soon">
          <PawPrint size={large ? 38 : 32} strokeWidth={2.5} aria-hidden="true" />
          <span>Photo<br />Coming Soon</span>
        </span>
      )}
    </span>
  );
}

export default function SitGuruTeam() {
  const [peekSlug, setPeekSlug] = useState<string | null>(null);
  const [peekPosition, setPeekPosition] = useState({ left: 16, top: 16 });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    enterTimerRef.current = null;
    leaveTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!peekSlug) return;
    const dismiss = () => setPeekSlug(null);
    window.addEventListener("scroll", dismiss, { passive: true, capture: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [peekSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const oldOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
      if (dialog.open) dialog.close();
    };
  }, [selectedSlug]);

  const openProfile = (slug: string, target?: HTMLElement) => {
    clearTimers();
    setPeekSlug(null);
    openerRef.current = target ?? (document.activeElement as HTMLElement | null);
    setSelectedSlug(slug);
  };

  const closeProfile = () => dialogRef.current?.close();

  const handleDialogClose = () => {
    setSelectedSlug(null);
    openerRef.current?.focus({ preventScroll: true });
  };

  const onHoverStart = (slug: string, element: HTMLElement, pointerType: string) => {
    if (
      pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches
    ) return;
    clearTimers();
    const rect = element.getBoundingClientRect();
    let top = rect.bottom + 16;
    if (top + PEEK_HEIGHT > window.innerHeight - 12) {
      top = Math.max(12, rect.top - PEEK_HEIGHT - 16);
    }
    const left = Math.max(12, Math.min(window.innerWidth - PEEK_WIDTH - 12, rect.left + rect.width / 2 - PEEK_WIDTH / 2));
    enterTimerRef.current = setTimeout(() => {
      setPeekPosition({ top, left });
      setPeekSlug(slug);
    }, HOVER_DELAY);
  };

  const onHoverEnd = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = null;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setPeekSlug(null), LEAVE_DELAY);
  };

  const peek = sitguruTeam.find((person) => person.slug === peekSlug);
  const selected = sitguruTeam.find((person) => person.slug === selectedSlug);

  return (
    <section className={styles.teamSection} id="meet-the-team" aria-labelledby="sitguru-team-heading">
      <div className={styles.cornerTop} aria-hidden="true" />
      <div className={styles.cornerBottom} aria-hidden="true" />
      <Heart className={styles.heartDoodle} size={52} strokeWidth={2.2} aria-hidden="true" />
      <PawPrint className={styles.pawDoodle} size={82} strokeWidth={2} aria-hidden="true" />
      <div className={styles.teamInner}>
        <header className={styles.heading}>
          <p className={styles.kicker}><span>Meet the Team</span></p>
          <h2 id="sitguru-team-heading">The Talent Behind <span>Your Success</span></h2>
          <p className={styles.tagline}>
            Technology, community, creativity, and a love for pets bring<br className={styles.desktopBreak} /> Pet Parents and Gurus together.
          </p>
        </header>

        <div className={styles.teamGrid}>
          {sitguruTeam.map((person) => (
            <article
              key={person.slug}
              className={`${styles.member} ${peekSlug === person.slug ? styles.memberActive : ""}`}
              onPointerEnter={(event) => onHoverStart(person.slug, event.currentTarget, event.pointerType)}
              onPointerLeave={onHoverEnd}
            >
              <button
                type="button"
                className={styles.avatarButton}
                onClick={(event) => openProfile(person.slug, event.currentTarget)}
                aria-label={`Meet ${person.name}, ${person.role}`}
                aria-haspopup="dialog"
              >
                <Avatar person={person} />
              </button>
              <h3>{person.name}</h3>
              <p className={styles.role}>{person.role}</p>
              <div className={styles.divider} aria-hidden="true"><span /><PawPrint size={19} fill="currentColor" /><span /></div>
              <button
                type="button"
                className={styles.meetButton}
                onClick={(event) => openProfile(person.slug, event.currentTarget)}
                aria-label={`Read about ${person.name}`}
                aria-haspopup="dialog"
              >
                Meet {person.name.split(" ")[0]} <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        <p className={styles.footnote}>Real people. Real pets. One growing community. <Heart size={14} fill="currentColor" aria-hidden="true" /></p>
      </div>

      {peek && typeof document !== "undefined" && createPortal(
        <aside
          className={styles.peek}
          style={{ left: peekPosition.left, top: peekPosition.top }}
          aria-label={`Preview of ${peek.name}`}
          onPointerEnter={() => { if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current); }}
          onPointerLeave={onHoverEnd}
        >
          <div className={styles.peekTop}>
            <span>Meet the pack</span>
            <button type="button" onClick={() => setPeekSlug(null)} aria-label="Close preview"><X size={16} /></button>
          </div>
          <h3>{peek.name}</h3>
          <p className={styles.peekRole}>{peek.role}</p>
          <p className={styles.peekIntro}>{peek.intro}</p>
          <p className={styles.peekBio}>{peek.bio}</p>
          <button type="button" className={styles.readMore} onClick={(event) => openProfile(peek.slug, event.currentTarget)}>
            Read full profile <ArrowRight size={16} aria-hidden="true" />
          </button>
        </aside>,
        document.body
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="sitguru-person-name"
        aria-describedby="sitguru-person-bio"
        onClose={handleDialogClose}
        onClick={(event) => { if (event.target === dialogRef.current) closeProfile(); }}
      >
        {selected && (
          <div className={styles.dialogContent}>
            <button type="button" className={styles.closeButton} onClick={closeProfile} aria-label="Close team profile"><X size={22} /></button>
            <div className={styles.dialogHeader}>
              <Avatar person={selected} large />
              <div className={styles.dialogIdentity}>
                <p className={styles.dialogEyebrow}>Meet the pack</p>
                <h2 id="sitguru-person-name">{selected.name}</h2>
                <p className={styles.dialogRole}>{selected.role}</p>
              </div>
            </div>
            <div className={styles.dialogBody}>
              <h3>Get to know {selected.name.split(" ")[0]}</h3>
              <p id="sitguru-person-bio">{selected.bio}</p>
              <h3>What they do at SitGuru</h3>
              <ul>{selected.focus.map((item) => <li key={item}>{item}</li>)}</ul>
              <button type="button" className={styles.backButton} onClick={closeProfile}>Back to the team</button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
