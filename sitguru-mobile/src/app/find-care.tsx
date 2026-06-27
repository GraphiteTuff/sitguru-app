import { router } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';
import {
  formatGuruLocation,
  formatGuruRate,
  getGuruPublicCta,
  guruDirectory,
  isGuruPubliclyListed,
  type GuruRow,
} from '@/constants/gurus';

type ServiceOption = {
  label: string;
  value: string;
};

const services: ServiceOption[] = [
  { label: 'Dog Walking', value: 'dog_walking' },
  { label: 'Pet Sitting', value: 'pet_sitting' },
  { label: 'Drop-In Visits', value: 'drop_in_visits' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'House Sitting', value: 'house_sitting' },
  { label: 'Doggy Day Care', value: 'doggy_day_care' },
  { label: 'Training Support', value: 'training_support' },
];

export default function FindCareScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [zipCode, setZipCode] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceOption>(
    services[0],
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);
  const hasValidZip = cleanZip.length === 5;
  const careAreaLabel = hasValidZip ? `ZIP ${cleanZip}` : 'your care area';
  const publicGurus = guruDirectory.filter(isGuruPubliclyListed);
  const matchingGurus = publicGurus.filter((guru) =>
    guru.services.includes(selectedService.label),
  );
  const displayedGurus = matchingGurus.length > 0 ? matchingGurus : publicGurus;

  function handleZipChange(value: string) {
    const nextZip = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(nextZip);
    setNoticeMessage('');
  }

  function handleSearch() {
    setHasSearched(true);

    if (hasValidZip) {
      setNoticeMessage(
        `Showing ${selectedService.label} options for ${careAreaLabel}.`,
      );
      return;
    }

    setNoticeMessage(
      `Showing ${selectedService.label} previews. Enter a ZIP code to narrow care by location.`,
    );
  }

  function handleUseLocation() {
    setNoticeMessage(
      'Location search will be available after phone location permission is enabled. For now, enter a care ZIP code.',
    );
  }

  function handleViewProfile(guru: GuruRow) {
    setNoticeMessage(`${guru.name} profile preview selected.`);
  }

  function handleMessageGuru(guru: GuruRow) {
    setNoticeMessage(
      `Message selected for ${guru.name}. Messaging will open from the Guru profile.`,
    );
  }

  function handlePublicCta(guru: GuruRow) {
    const cta = getGuruPublicCta(guru);

    if (cta.disabled) {
      return;
    }

    router.push('/request-booking');
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Home</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Open Care Search</Text>
            </View>

            <Text style={styles.title}>Find trusted local Gurus.</Text>

            <Text style={styles.subtitle}>
              Search by service and ZIP code, compare local Guru previews, and
              start with the care option that feels right.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleSearch}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Search Care</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/login')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Log In</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroPhotoIcon}>🐶</Text>
              <Text style={styles.heroPhotoTitle}>Care search photo area</Text>
              <Text style={styles.heroPhotoText}>
                Add a real pet, Guru, or local care lifestyle photo here.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Search nearby</Text>
              <Text style={styles.heroFloatingText}>
                Start with service, ZIP code, and a trusted profile.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={styles.searchEyebrow}>Search Gurus</Text>
              <Text style={styles.searchTitle}>What care do you need?</Text>
            </View>

            <Text style={styles.searchBadge}>Open search</Text>
          </View>

          <View style={styles.serviceGrid}>
            {services.map((service) => {
              const selected = selectedService.value === service.value;

              return (
                <Pressable
                  key={service.value}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedService(service);
                    setNoticeMessage('');
                  }}
                  style={[
                    styles.servicePill,
                    selected && styles.servicePillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.servicePillText,
                      selected && styles.servicePillTextSelected,
                    ]}
                  >
                    {service.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.zipPanel}>
            <View style={styles.zipInputWrap}>
              <Text style={styles.inputLabel}>Care ZIP code</Text>

              <TextInput
                keyboardType="number-pad"
                maxLength={5}
                onChangeText={handleZipChange}
                placeholder="18951"
                placeholderTextColor={SitGuruColors.textSoft}
                style={styles.zipInput}
                value={zipCode}
              />

              <Text style={styles.inputHelper}>
                Enter the ZIP code where care is needed.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleUseLocation}
              style={styles.locationButton}
            >
              <Text style={styles.locationButtonText}>Use my location</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleSearch}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>
              Search {selectedService.label}
            </Text>
          </Pressable>

          {noticeMessage ? (
            <View style={styles.noticePanel}>
              <Text style={styles.noticeText}>{noticeMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsEyebrow}>
              {hasSearched ? 'Search results' : 'Preview'}
            </Text>

            <Text style={styles.resultsTitle}>
              Gurus for {selectedService.label}
            </Text>

            <Text style={styles.resultsText}>
              {hasSearched
                ? `Showing local Guru previews for ${careAreaLabel}.`
                : 'Search is open. Enter a ZIP code or choose a service to preview local Guru matches.'}
            </Text>
          </View>
        </View>

        <View style={[styles.resultsGrid, isWide && styles.resultsGridWide]}>
          {displayedGurus.map((guru) => {
            const cta = getGuruPublicCta(guru);

            return (
              <View key={guru.id} style={styles.guruCard}>
                <View style={styles.guruPhotoSlot}>
                  <Text style={styles.guruPhotoIcon}>＋</Text>
                  <Text style={styles.guruPhotoText}>Guru photo</Text>
                </View>

                <View style={styles.guruContent}>
                  <View style={styles.guruTopRow}>
                    <View style={styles.guruAvatar}>
                      <Text style={styles.guruAvatarText}>
                        {guru.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part.charAt(0))
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.guruMeta}>
                      <Text style={styles.guruName}>{guru.name}</Text>
                      <Text style={styles.guruRole}>{guru.role}</Text>
                    </View>
                  </View>

                  <View style={styles.guruInfoRow}>
                    <Text style={styles.guruInfoText}>
                      ⌖ {formatGuruLocation(guru)}
                    </Text>
                    <Text style={styles.guruInfoText}>• ZIP {guru.service_zip}</Text>
                  </View>

                  <View style={styles.guruStatsRow}>
                    <View style={styles.guruStat}>
                      <Text style={styles.guruStatValue}>{guru.rating}</Text>
                      <Text style={styles.guruStatLabel}>Status</Text>
                    </View>

                    <View style={styles.guruStat}>
                      <Text style={styles.guruStatValue}>{formatGuruRate(guru)}</Text>
                      <Text style={styles.guruStatLabel}>Pricing</Text>
                    </View>
                  </View>

                  <View style={styles.servicesList}>
                    {guru.services.map((service) => (
                      <Text key={service} style={styles.guruServicePill}>
                        {service}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.badgeList}>
                    {guru.badges.map((badge) => (
                      <Text key={badge} style={styles.guruBadge}>
                        ✓ {badge}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.guruActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleViewProfile(guru)}
                      style={styles.viewButton}
                    >
                      <Text style={styles.viewButtonText}>View Profile</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleMessageGuru(guru)}
                      style={styles.messageButton}
                    >
                      <Text style={styles.messageButtonText}>Message</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: cta.disabled }}
                    disabled={cta.disabled}
                    onPress={() => handlePublicCta(guru)}
                    style={[
                      styles.bookButton,
                      cta.disabled && styles.bookButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bookButtonText,
                        cta.disabled && styles.bookButtonTextDisabled,
                      ]}
                    >
                      {cta.label}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.flowPanel}>
          <Text style={styles.flowEyebrow}>Simple booking flow</Text>
          <Text style={styles.flowTitle}>
            Search first. Message when ready. Request care with confidence.
          </Text>

          <View style={styles.flowSteps}>
            <View style={styles.flowStep}>
              <Text style={styles.flowStepNumber}>01</Text>
              <View style={styles.flowStepCopy}>
                <Text style={styles.flowStepTitle}>Search local Gurus</Text>
                <Text style={styles.flowStepText}>
                  Start with service type and care location.
                </Text>
              </View>
            </View>

            <View style={styles.flowDivider} />

            <View style={styles.flowStep}>
              <Text style={styles.flowStepNumber}>02</Text>
              <View style={styles.flowStepCopy}>
                <Text style={styles.flowStepTitle}>Review profiles</Text>
                <Text style={styles.flowStepText}>
                  Compare care style, services, location, and trust details.
                </Text>
              </View>
            </View>

            <View style={styles.flowDivider} />

            <View style={styles.flowStep}>
              <Text style={styles.flowStepNumber}>03</Text>
              <View style={styles.flowStepCopy}>
                <Text style={styles.flowStepTitle}>Message or request care</Text>
                <Text style={styles.flowStepText}>
                  Start the conversation or send dates, pets, and care notes.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={handleSearch}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>Search</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleUseLocation}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Near Me</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Login</Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
    paddingBottom: 14,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topLinkButton: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  topLinkText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  heroPanelWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 45,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
  },
  heroActions: {
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  heroPhotoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    minHeight: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  heroPhotoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  heroPhotoIcon: {
    fontSize: 44,
  },
  heroPhotoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 260,
    textAlign: 'center',
  },
  heroFloatingCard: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 22,
    bottom: 14,
    gap: 3,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  heroFloatingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  heroFloatingText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  searchPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 4,
    gap: 15,
    padding: 18,
  },
  searchHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  searchEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  searchTitle: {
    color: SitGuruColors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 32,
    marginTop: 3,
  },
  searchBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  servicePillSelected: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  servicePillText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  servicePillTextSelected: {
    color: '#FFFFFF',
  },
  zipPanel: {
    gap: 10,
  },
  zipInputWrap: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 7,
    padding: 14,
  },
  inputLabel: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  zipInput: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputHelper: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  locationButtonText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  noticePanel: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  resultsHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  resultsEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  resultsTitle: {
    color: SitGuruColors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  resultsText: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  resultsGrid: {
    gap: 12,
  },
  resultsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guruCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    minWidth: 240,
    overflow: 'hidden',
    padding: 12,
  },
  guruPhotoSlot: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderRadius: 24,
    gap: 6,
    height: 170,
    justifyContent: 'center',
    padding: 16,
  },
  guruPhotoIcon: {
    color: SitGuruColors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  guruPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  guruContent: {
    gap: 11,
    padding: 6,
    paddingTop: 12,
  },
  guruTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  guruAvatar: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  guruAvatarText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  guruMeta: {
    flex: 1,
    gap: 2,
  },
  guruName: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  guruRole: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  guruInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  guruInfoText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  guruStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guruStat: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  guruStatValue: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  guruStatLabel: {
    color: SitGuruColors.textSoft,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  guruServicePill: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeList: {
    gap: 6,
  },
  guruBadge: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  guruActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  viewButtonText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  messageButtonText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  bookButtonDisabled: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderWidth: 1,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  bookButtonTextDisabled: {
    color: SitGuruColors.textMuted,
  },
  flowPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 30,
    gap: 15,
    padding: 18,
  },
  flowEyebrow: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  flowTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  flowSteps: {
    gap: 0,
  },
  flowStep: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
  },
  flowStepNumber: {
    color: '#C9F26D',
    fontSize: 17,
    fontWeight: '900',
    width: 36,
  },
  flowStepCopy: {
    flex: 1,
    gap: 4,
  },
  flowStepTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  flowStepText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  flowDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    height: 1,
    marginLeft: 50,
  },
  bottomDockSpacer: {
    height: 88,
  },
  bottomDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 16,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 16,
    padding: 8,
    position: 'absolute',
    right: 16,
  },
  dockPrimaryAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  dockPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 78,
    paddingHorizontal: 12,
  },
  dockButtonText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});
