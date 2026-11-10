import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import TouchTarget from '@/components/mobile/TouchTarget';
import { useTheme } from '@/hooks/use-theme';

const TIMES = [
  { value: '09:00', label: '9 AM' },
  { value: '12:00', label: 'Noon' },
  { value: '15:00', label: '3 PM' },
  { value: '18:00', label: '6 PM' },
] as const;

function dateAfter(today: string, offset: number) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

type Props = {
  publishAt: string;
  onPublishAt: (value: string) => void;
  petOfWeek: boolean;
  weekOf: string;
  onWeekOf: (value: string) => void;
  disabled?: boolean;
};

export default function CommunitySchedulePicker({ publishAt, onPublishAt, petOfWeek, weekOf, onWeekOf, disabled = false }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: 14 }, (_, index) => dateAfter(today, index));
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const mondays = Array.from({ length: 4 }, (_, index) => dateAfter(today, (8 - weekday) % 7 + index * 7));
  const selectedDate = publishAt.slice(0, 10);
  const selectedTime = publishAt.slice(11, 16);
  const future = (date: string, time: string) => Date.parse(`${date}T${time}:00Z`) > Date.now();
  const label = { color: colors.text };
  const selectedStyle = { backgroundColor: colors.primarySoft, borderColor: colors.primary };
  const unselectedStyle = { backgroundColor: colors.card, borderColor: colors.border };

  function chooseDate(date: string) {
    const time = TIMES.find((choice) => choice.value === selectedTime && future(date, choice.value))?.value
      || TIMES.find((choice) => future(date, choice.value))?.value;
    if (time) onPublishAt(`${date}T${time}:00.000Z`);
    setExpanded(false);
  }

  const selection = publishAt && Number.isFinite(Date.parse(`${publishAt.replace(/Z$/, '')}Z`))
    ? new Date(`${publishAt.replace(/Z$/, '')}Z`).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    : '';

  return <View style={styles.section}>
    <Text style={[styles.heading, label]}>Publication schedule</Text>
    <Text style={[styles.caption, { color: colors.textSecondary }]}>Choose a day and time. Publishing times are shown in UTC.</Text>
    <TouchTarget accessibilityRole="button" accessibilityState={{ expanded }} disabled={disabled} onPress={() => setExpanded(!expanded)} style={[styles.choice, styles.fullWidth, unselectedStyle]}>
      <Text style={[styles.choiceLabel, label]}>{selectedDate ? dateLabel(selectedDate) : 'Choose a publication day'} {expanded ? '▴' : '▾'}</Text>
    </TouchTarget>
    {expanded ? <View style={styles.grid}>{dates.map((date, index) => {
      const unavailable = !TIMES.some((time) => future(date, time.value));
      return <TouchTarget key={date} accessibilityRole="radio" accessibilityLabel={`${dateLabel(date)}${index === 0 ? ', today' : ''}`} accessibilityState={{ checked: selectedDate === date, disabled: unavailable || disabled }} disabled={unavailable || disabled} onPress={() => chooseDate(date)} style={[styles.choice, selectedDate === date ? selectedStyle : unselectedStyle, unavailable && styles.disabled]}>
        <Text style={[styles.choiceLabel, label]}>{index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}</Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</Text>
      </TouchTarget>;
    })}</View> : null}
    <View style={styles.grid}>{TIMES.map((time) => {
      const date = selectedDate || dateAfter(today, 1);
      const unavailable = !future(date, time.value);
      return <TouchTarget key={time.value} accessibilityRole="radio" accessibilityLabel={`${time.label} UTC`} accessibilityState={{ checked: selectedTime === time.value, disabled: unavailable || disabled }} disabled={unavailable || disabled} onPress={() => onPublishAt(`${date}T${time.value}:00.000Z`)} style={[styles.choice, selectedTime === time.value ? selectedStyle : unselectedStyle, unavailable && styles.disabled]}>
        <Text style={[styles.choiceLabel, label]}>{time.label} UTC</Text>
      </TouchTarget>;
    })}</View>
    {selection ? <Text accessibilityLiveRegion="polite" style={[styles.summary, { backgroundColor: colors.primarySoft, color: colors.text }]}>{selection} UTC</Text> : null}
    {petOfWeek ? <>
      <Text style={[styles.heading, label]}>Pet of the Week edition</Text>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>Select the Monday that starts this pet’s featured week.</Text>
      <View style={styles.grid}>{mondays.map((monday) => <TouchTarget key={monday} accessibilityRole="radio" accessibilityLabel={`Feature week starting ${dateLabel(monday)}`} accessibilityState={{ checked: weekOf === monday }} disabled={disabled} onPress={() => onWeekOf(monday)} style={[styles.choice, weekOf === monday ? selectedStyle : unselectedStyle]}>
        <Text style={[styles.choiceLabel, label]}>Week of {new Date(`${monday}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</Text>
      </TouchTarget>)}</View>
      {weekOf ? <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: colors.textSecondary }]}>Selected edition: {dateLabel(weekOf)}</Text> : null}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { fontSize: 15, fontWeight: '800' },
  caption: { fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 52, flexBasis: '46%', flexGrow: 1, borderWidth: 1, borderRadius: 14, gap: 3, paddingHorizontal: 10, paddingVertical: 10 },
  fullWidth: { flexBasis: 'auto', width: '100%' },
  choiceLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.4 },
  summary: { borderRadius: 12, padding: 12, fontSize: 13, fontWeight: '700', lineHeight: 20 },
});
