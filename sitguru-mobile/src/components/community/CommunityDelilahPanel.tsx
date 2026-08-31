import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import {
  COMMUNITY_EVENT_FAQ_CHIPS,
  matchCommunityEventFaq,
} from '@/constants/community-event-faqs';
import { trackMobileEvent } from '@/lib/analytics/track';

type CommunityDelilahPanelProps = {
  eventSlug?: string;
  eventTitle?: string;
};

export default function CommunityDelilahPanel({
  eventSlug,
  eventTitle,
}: CommunityDelilahPanelProps) {
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);

  function handleChip(question: string) {
    const hit = matchCommunityEventFaq(question);
    setActiveAnswer(hit?.answer || null);

    void trackMobileEvent({
      eventName: 'community_delilah_faq',
      source: 'mobile_community_event',
      pagePath: eventSlug ? `/events/${eventSlug}` : '/events',
      metadata: {
        question,
        eventSlug,
        eventTitle,
        matched: Boolean(hit),
      },
    });
  }

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Sparkles color="#0D5C3A" size={18} />
        <Text style={styles.title}>Ask Delilah about this event</Text>
      </View>
      <Text style={styles.subtitle}>
        Quick answers about RSVPs, pet-friendly details, hosting, and joining
        SitGuru.
      </Text>

      <View style={styles.chips}>
        {COMMUNITY_EVENT_FAQ_CHIPS.map((chip) => (
          <Pressable
            key={chip.question}
            style={styles.chip}
            onPress={() => handleChip(chip.question)}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeAnswer ? <Text style={styles.answer}>{activeAnswer}</Text> : null}

      <Pressable
        style={styles.chatButton}
        onPress={() => {
          void trackMobileEvent({
            eventName: 'community_delilah_open',
            source: 'mobile_community_event',
            metadata: { eventSlug, eventTitle },
          });
          router.push({
            pathname: '/ai-companion',
            params: { id: 'delilah' },
          });
        }}
      >
        <Text style={styles.chatButtonText}>Chat with Delilah</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 18,
    color: '#0f172a',
  },
  subtitle: {
    fontFamily: AppFonts.medium,
    color: '#475569',
    lineHeight: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    color: '#0D5C3A',
  },
  answer: {
    fontFamily: AppFonts.medium,
    color: '#334155',
    lineHeight: 22,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
  },
  chatButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#0D5C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
});
