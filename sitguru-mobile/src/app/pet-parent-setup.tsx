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

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;
type PetType = 'Dog' | 'Cat' | 'Other';
type PetSize = 'Small' | 'Medium' | 'Large' | 'Extra Large';

type SetupStep = {
  step: StepNumber;
  shortTitle: string;
  title: string;
  description: string;
  usedFor: string;
};

type PetForm = {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: string;
  size: PetSize | '';
  notes: string;
};

const setupSteps: SetupStep[] = [
  {
    step: 1,
    shortTitle: 'Basic Info',
    title: 'Basic Info',
    description:
      'Add your name, email, phone number, and profile photo so SitGuru and your Guru can recognize and contact you.',
    usedFor:
      'Bookings, messages, dashboard, profile, support, and Guru booking context.',
  },
  {
    step: 2,
    shortTitle: 'Location',
    title: 'Service Location',
    description:
      'Add your street address, city, state, and ZIP code so SitGuru can match you with Gurus who serve your area.',
    usedFor:
      'Find Care, Guru radius filtering, maps, search results, booking location, and local matching.',
  },
  {
    step: 3,
    shortTitle: 'Pets',
    title: 'Pet Passports',
    description:
      'Add one or more pets so Gurus understand each pet’s routine, type, size, needs, and care notes.',
    usedFor:
      'Booking requests, Guru preparation, care details, messages, Pet Parent dashboard, and Pet Passport cards.',
  },
  {
    step: 4,
    shortTitle: 'Care Notes',
    title: 'Care Notes',
    description:
      'Share routines, feeding notes, medication details, anxiety triggers, access notes, and anything your Guru should know.',
    usedFor:
      'Booking details, Guru booking view, care instructions, messages, visit prep, and support context.',
  },
  {
    step: 5,
    shortTitle: 'Emergency',
    title: 'Emergency Contact',
    description:
      'Add a backup contact and veterinary details so SitGuru and your Guru know who to contact if something urgent comes up.',
    usedFor:
      'Safety workflows, booking support, emergency context, admin support, and Guru confidence.',
  },
  {
    step: 6,
    shortTitle: 'Notifications',
    title: 'Notifications',
    description:
      'Choose how you want to receive messages, booking reminders, care updates, PawReport™ alerts, and support messages.',
    usedFor:
      'Booking reminders, care updates, support alerts, message notifications, and account communication.',
  },
];

const zipLookup: Record<string, { city: string; state: string }> = {
  '18951': { city: 'Quakertown', state: 'PA' },
  '18018': { city: 'Bethlehem', state: 'PA' },
  '18101': { city: 'Allentown', state: 'PA' },
  '19103': { city: 'Philadelphia', state: 'PA' },
  '08030': { city: 'Camden', state: 'NJ' },
};

const petTypes: PetType[] = ['Dog', 'Cat', 'Other'];
const petSizes: PetSize[] = ['Small', 'Medium', 'Large', 'Extra Large'];

const dogBreeds = [
  'Mixed Breed',
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'French Bulldog',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'Dachshund',
  'German Shorthaired Pointer',
  'Other',
];

const catBreeds = [
  'Domestic Shorthair',
  'Domestic Longhair',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'Bengal',
  'Persian',
  'Russian Blue',
  'Sphynx',
  'Other',
];

const otherBreeds = [
  'Bird',
  'Rabbit',
  'Guinea Pig',
  'Hamster',
  'Reptile',
  'Fish',
  'Farm Animal',
  'Other',
];

const ageOptions = [
  'Under 1 year',
  '1 year',
  '2 years',
  '3 years',
  '4 years',
  '5 years',
  '6 years',
  '7 years',
  '8 years',
  '9 years',
  '10 years',
  '11 years',
  '12+ years',
  'Senior',
  'Unknown',
];

function createPet(index: number): PetForm {
  return {
    id: `pet-${Date.now()}-${index}`,
    name: '',
    type: 'Dog',
    breed: '',
    age: '',
    size: '',
    notes: '',
  };
}

function getBreedOptions(type: PetType) {
  if (type === 'Dog') return dogBreeds;
  if (type === 'Cat') return catBreeds;
  return otherBreeds;
}

function extractZipCode(value: string) {
  const match = value.match(/\b\d{5}(?:-\d{4})?\b/);
  return match?.[0]?.slice(0, 5) || '';
}

export default function PetParentSetupScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  const [pets, setPets] = useState<PetForm[]>([createPet(1)]);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [ageDropdownOpen, setAgeDropdownOpen] = useState(false);

  const activeStep =
    setupSteps.find((step) => step.step === currentStep) || setupSteps[0];
  const activePet = pets[activePetIndex] || pets[0];
  const progressWidth = `${Math.round(
    (currentStep / setupSteps.length) * 100,
  )}%` as `${number}%`;

  function applyZipLookup(nextZip: string) {
    const location = zipLookup[nextZip];

    if (!location) {
      setLocationMessage(
        nextZip.length === 5
          ? 'ZIP entered. City and state can be confirmed when location services are connected.'
          : '',
      );
      return;
    }

    setCity(location.city);
    setStateValue(location.state);
    setLocationMessage(`ZIP found: ${location.city}, ${location.state}.`);
  }

  function handleStreetAddressChange(value: string) {
    setStreetAddress(value);

    const extractedZip = extractZipCode(value);

    if (extractedZip) {
      setZipCode(extractedZip);
      applyZipLookup(extractedZip);
    }
  }

  function handleZipChange(value: string) {
    const cleanZip = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(cleanZip);

    if (cleanZip.length === 5) {
      applyZipLookup(cleanZip);
      return;
    }

    setLocationMessage(
      'Enter a 5-digit ZIP code to auto-fill city and state when available.',
    );
  }

  function updatePet(petId: string, updates: Partial<PetForm>) {
    setPets((currentPets) =>
      currentPets.map((pet) => (pet.id === petId ? { ...pet, ...updates } : pet)),
    );
  }

  function addPet() {
    const nextPet = createPet(pets.length + 1);
    setPets((currentPets) => [...currentPets, nextPet]);
    setActivePetIndex(pets.length);
    setBreedDropdownOpen(false);
    setAgeDropdownOpen(false);
  }

  function removeActivePet() {
    if (pets.length <= 1) return;

    const nextPets = pets.filter((pet) => pet.id !== activePet.id);
    setPets(nextPets);
    setActivePetIndex(Math.max(0, Math.min(activePetIndex, nextPets.length - 1)));
    setBreedDropdownOpen(false);
    setAgeDropdownOpen(false);
  }

  function goBack() {
    if (currentStep === 1) {
      router.push('/role-selection');
      return;
    }

    setCurrentStep((currentStep - 1) as StepNumber);
  }

  function goNext() {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as StepNumber);
      return;
    }

    router.push('/find-care');
  }

  function goToDashboard() {
    router.push('/pet-parent-dashboard');
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.photoUploadCard}>
            <View style={styles.photoIconBox}>
              <Text style={styles.photoIcon}>＋</Text>
            </View>
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Profile photo</Text>
              <Text style={styles.photoText}>
                Add a clear profile photo later so Gurus can recognize you.
              </Text>
            </View>
          </View>

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field label="First name" placeholder="Alex" />
            <Field label="Last name" placeholder="Peterson" />
            <Field
              label="Email address"
              placeholder="alex@example.com"
              keyboardType="email-address"
            />
            <Field
              label="Phone number"
              placeholder="555-555-5555"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.locationHero}>
            <Text style={styles.locationIcon}>⌖</Text>
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Care happens at this location.</Text>
              <Text style={styles.locationText}>
                Enter a street address or ZIP code. City and state will auto-fill when available.
              </Text>
            </View>
          </View>

          <View style={styles.formGrid}>
            <Field
              label="Street address"
              onChangeText={handleStreetAddressChange}
              placeholder="123 Main Street"
              value={streetAddress}
            />

            <View style={[styles.formRow, isWide && styles.formRowWide]}>
              <Field
                label="City"
                onChangeText={setCity}
                placeholder="Quakertown"
                value={city}
              />
              <Field
                label="State"
                onChangeText={setStateValue}
                placeholder="PA"
                value={stateValue}
              />
              <Field
                keyboardType="number-pad"
                label="ZIP code"
                onChangeText={handleZipChange}
                placeholder="18951"
                value={zipCode}
              />
            </View>

            {locationMessage ? (
              <View style={styles.locationMessage}>
                <Text style={styles.locationMessageText}>{locationMessage}</Text>
              </View>
            ) : null}

            <Field
              label="Care location notes"
              placeholder="Gate code, parking, apartment entry, or helpful arrival notes"
              multiline
            />
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      const breedOptions = getBreedOptions(activePet.type);

      return (
        <View style={styles.stepBody}>
          <View style={styles.petTabsHeader}>
            <View>
              <Text style={styles.petTabsEyebrow}>Pet Passports</Text>
              <Text style={styles.petTabsTitle}>Add one or more pets.</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={addPet}
              style={styles.addPetButton}
            >
              <Text style={styles.addPetButtonText}>+ Add Pet</Text>
            </Pressable>
          </View>

          <View style={styles.petTabs}>
            {pets.map((pet, index) => {
              const active = index === activePetIndex;
              const petLabel = pet.name.trim() || `Pet ${index + 1}`;

              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setActivePetIndex(index);
                    setBreedDropdownOpen(false);
                    setAgeDropdownOpen(false);
                  }}
                  style={[styles.petTab, active && styles.petTabActive]}
                >
                  <Text style={styles.petTabIcon}>
                    {pet.type === 'Dog' ? '🐶' : pet.type === 'Cat' ? '🐱' : '🐾'}
                  </Text>
                  <Text style={[styles.petTabText, active && styles.petTabTextActive]}>
                    {petLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.petEditorCard}>
            <View style={styles.petPhotoCard}>
              <View style={styles.petPhotoIconBox}>
                <Text style={styles.petPhotoIcon}>
                  {activePet.type === 'Dog' ? '🐶' : activePet.type === 'Cat' ? '🐱' : '🐾'}
                </Text>
              </View>

              <View style={styles.petPhotoCopy}>
                <Text style={styles.petPhotoTitle}>
                  {activePet.name.trim() || 'Pet photo'}
                </Text>
                <Text style={styles.petPhotoText}>
                  Add a picture for this pet later so Gurus can quickly recognize them.
                </Text>
              </View>
            </View>

            <Field
              label="Pet name"
              onChangeText={(value) => updatePet(activePet.id, { name: value })}
              placeholder="Scout"
              value={activePet.name}
            />

            <View style={styles.petTypeGrid}>
              {petTypes.map((type) => {
                const selected = activePet.type === type;

                return (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    onPress={() => {
                      updatePet(activePet.id, { type, breed: '' });
                      setBreedDropdownOpen(false);
                    }}
                    style={[styles.petTypeButton, selected && styles.petTypeButtonActive]}
                  >
                    <Text style={styles.petTypeIcon}>
                      {type === 'Dog' ? '🐶' : type === 'Cat' ? '🐱' : '🐾'}
                    </Text>
                    <Text style={[styles.petTypeText, selected && styles.petTypeTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DropdownField
              label="Breed"
              onSelect={(value) => {
                updatePet(activePet.id, { breed: value });
                setBreedDropdownOpen(false);
              }}
              onToggle={() => {
                setBreedDropdownOpen((open) => !open);
                setAgeDropdownOpen(false);
              }}
              open={breedDropdownOpen}
              options={breedOptions}
              placeholder="Choose breed"
              value={activePet.breed}
            />

            <DropdownField
              label="Age"
              onSelect={(value) => {
                updatePet(activePet.id, { age: value });
                setAgeDropdownOpen(false);
              }}
              onToggle={() => {
                setAgeDropdownOpen((open) => !open);
                setBreedDropdownOpen(false);
              }}
              open={ageDropdownOpen}
              options={ageOptions}
              placeholder="Choose age"
              value={activePet.age}
            />

            <View style={styles.sizeSection}>
              <Text style={styles.fieldLabel}>Size</Text>

              <View style={styles.sizeGrid}>
                {petSizes.map((size) => {
                  const selected = activePet.size === size;

                  return (
                    <Pressable
                      key={size}
                      accessibilityRole="button"
                      onPress={() => updatePet(activePet.id, { size })}
                      style={[styles.sizeButton, selected && styles.sizeButtonActive]}
                    >
                      <Text
                        style={[
                          styles.sizeButtonText,
                          selected && styles.sizeButtonTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Field
              label="Pet notes"
              multiline
              onChangeText={(value) => updatePet(activePet.id, { notes: value })}
              placeholder="Personality, favorite toys, comfort needs, walking style, or anything your Guru should know"
              value={activePet.notes}
            />

            {pets.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                onPress={removeActivePet}
                style={styles.removePetButton}
              >
                <Text style={styles.removePetButtonText}>Remove this pet</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.formGrid}>
            <Field
              label="Feeding routine"
              placeholder="Meal times, food amount, treats, water needs, or feeding instructions"
              multiline
            />

            <Field
              label="Walk and potty routine"
              placeholder="Typical walk times, leash notes, potty habits, or yard instructions"
              multiline
            />

            <Field
              label="Medication or allergies"
              placeholder="Medication, allergies, restrictions, or health notes"
              multiline
            />

            <Field
              label="Behavior and comfort notes"
              placeholder="Anxiety, crate comfort, favorite spots, triggers, or handling preferences"
              multiline
            />
          </View>
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.stepBody}>
          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field label="Emergency contact name" placeholder="Emergency Contact" />
            <Field
              label="Emergency contact phone"
              placeholder="555-555-5555"
              keyboardType="phone-pad"
            />
            <Field label="Relationship" placeholder="Family, friend, neighbor" />
            <Field label="Veterinarian or clinic" placeholder="Clinic name" />
          </View>

          <Field
            label="Emergency notes"
            placeholder="Anything SitGuru or your Guru should know if urgent care is needed"
            multiline
          />
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.notificationGrid}>
          <NotificationCard
            title="Messages"
            detail="New Guru messages and support replies."
          />
          <NotificationCard
            title="Booking updates"
            detail="Care requests, accepted bookings, changes, and reminders."
          />
          <NotificationCard
            title="PawReport™"
            detail="Photos, care notes, visit timing, and care summaries."
          />
          <NotificationCard
            title="PawPerks"
            detail="Referral rewards and Pet Parent invite updates."
          />
        </View>

        <View style={styles.readyPanel}>
          <Text style={styles.readyEyebrow}>Ready when you are</Text>
          <Text style={styles.readyTitle}>Your Pet Parent setup is ready to continue.</Text>
          <Text style={styles.readyText}>
            You can find care now, continue improving your Pet Passports later, or return to your dashboard.
          </Text>

          <View style={[styles.readyActions, isWide && styles.readyActionsWide]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/find-care')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Find Care</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={goToDashboard}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/role-selection')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Roles</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Pet Parent setup</Text>
            </View>

            <Text style={styles.title}>Complete your care profile.</Text>

            <Text style={styles.subtitle}>
              Each step helps SitGuru organize care details, match by location,
              prepare Gurus, and keep bookings clear.
            </Text>

            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Step {currentStep} of 6</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((currentStep / setupSteps.length) * 100)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroPhotoIcon}>🐶</Text>
              <Text style={styles.heroPhotoTitle}>Pet care photo area</Text>
              <Text style={styles.heroPhotoText}>
                Add a Pet Parent, pet, home care, or Pet Passport image here later.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Care profile</Text>
              <Text style={styles.heroFloatingText}>
                Location, pets, care notes, emergency contact, and updates.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepsRail}>
          {setupSteps.map((step) => {
            const active = step.step === currentStep;
            const complete = step.step < currentStep;

            return (
              <Pressable
                key={step.step}
                accessibilityRole="button"
                onPress={() => setCurrentStep(step.step)}
                style={[
                  styles.stepPill,
                  active && styles.stepPillActive,
                  complete && styles.stepPillComplete,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillNumber,
                    active && styles.stepPillNumberActive,
                  ]}
                >
                  {complete ? '✓' : step.step}
                </Text>
                <Text
                  style={[
                    styles.stepPillText,
                    active && styles.stepPillTextActive,
                  ]}
                >
                  {step.shortTitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.activeStepPanel}>
          <View style={styles.stepHeader}>
            <View>
              <Text style={styles.stepEyebrow}>Step {activeStep.step}</Text>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
            </View>

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {currentStep === 6 ? 'Final step' : 'Required'}
              </Text>
            </View>
          </View>

          <Text style={styles.stepDescription}>{activeStep.description}</Text>

          <View style={styles.usedForCard}>
            <Text style={styles.usedForLabel}>Used for</Text>
            <Text style={styles.usedForText}>{activeStep.usedFor}</Text>
          </View>

          {renderStepContent()}
        </View>

        <View style={styles.helpGrid}>
          <View style={styles.helpCard}>
            <Text style={styles.helpEyebrow}>Why it helps</Text>
            <Text style={styles.helpTitle}>Gurus can prepare faster.</Text>
            <Text style={styles.helpText}>
              Clear care details help local Gurus understand routines, pets,
              location, and expectations before care starts.
            </Text>
          </View>

          <View style={styles.helpCard}>
            <Text style={styles.helpEyebrow}>Keep it current</Text>
            <Text style={styles.helpTitle}>Update details anytime.</Text>
            <Text style={styles.helpText}>
              Pet care changes. You can return to update profiles, notes, and
              contact details as needed.
            </Text>
          </View>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.dockSecondaryAction}
        >
          <Text style={styles.dockSecondaryText}>
            {currentStep === 1 ? 'Roles' : 'Back'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>
            {currentStep === 6 ? 'Find Care' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

function Field({
  label,
  placeholder,
  keyboardType,
  multiline = false,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  multiline?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState('');
  const isControlled = value !== undefined || onChangeText !== undefined;
  const inputValue = isControlled ? value ?? '' : localValue;

  function handleChangeText(nextValue: string) {
    if (onChangeText) {
      onChangeText(nextValue);
      return;
    }

    setLocalValue(nextValue);
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={SitGuruColors.textSoft}
        style={[styles.input, multiline && styles.multilineInput]}
        value={inputValue}
      />
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.dropdownWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={styles.dropdownButton}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !value && styles.dropdownButtonPlaceholder,
          ]}
        >
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onSelect(option)}
              style={styles.dropdownOption}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NotificationCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Pressable accessibilityRole="button" style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>✓</Text>
      </View>

      <View style={styles.notificationCopy}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationDetail}>{detail}</Text>
      </View>
    </Pressable>
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
  progressBlock: {
    gap: 8,
  },
  progressTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressPercent: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: SitGuruColors.background,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: '100%',
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
  stepsRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepPill: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepPillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  stepPillComplete: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  stepPillNumber: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  stepPillNumberActive: {
    color: '#FFFFFF',
  },
  stepPillText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  activeStepPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  stepHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  stepEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: SitGuruColors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
    marginTop: 2,
  },
  stepBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stepDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  usedForCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  usedForLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  usedForText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  stepBody: {
    gap: 12,
  },
  formGrid: {
    gap: 12,
  },
  formGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formRow: {
    gap: 12,
  },
  formRowWide: {
    flexDirection: 'row',
  },
  fieldWrap: {
    flex: 1,
    gap: 7,
    minWidth: 180,
  },
  fieldLabel: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '800',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  photoUploadCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  photoIconBox: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  photoIcon: {
    color: SitGuruColors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  photoCopy: {
    flex: 1,
    gap: 4,
  },
  photoTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  photoText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationHero: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  locationIcon: {
    color: '#C9F26D',
    fontSize: 28,
    fontWeight: '900',
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  locationText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationMessage: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  locationMessageText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  petTabsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  petTabsEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  petTabsTitle: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  addPetButton: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  petTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  petTab: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  petTabActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  petTabIcon: {
    fontSize: 14,
  },
  petTabText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  petTabTextActive: {
    color: '#FFFFFF',
  },
  petEditorCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  petPhotoCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  petPhotoIconBox: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  petPhotoIcon: {
    fontSize: 30,
  },
  petPhotoCopy: {
    flex: 1,
    gap: 4,
  },
  petPhotoTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  petPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  petTypeGrid: {
    flexDirection: 'row',
    gap: 9,
  },
  petTypeButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 13,
  },
  petTypeButtonActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  petTypeIcon: {
    fontSize: 23,
  },
  petTypeText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  petTypeTextActive: {
    color: '#FFFFFF',
  },
  dropdownWrap: {
    gap: 7,
  },
  dropdownButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  dropdownButtonPlaceholder: {
    color: SitGuruColors.textSoft,
  },
  dropdownChevron: {
    color: SitGuruColors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  dropdownMenu: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    borderBottomColor: SitGuruColors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sizeSection: {
    gap: 7,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeButton: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sizeButtonActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  sizeButtonText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  sizeButtonTextActive: {
    color: '#FFFFFF',
  },
  removePetButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  removePetButtonText: {
    color: SitGuruColors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  notificationGrid: {
    gap: 10,
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  notificationIconText: {
    color: SitGuruColors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationDetail: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  readyPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 10,
    padding: 16,
  },
  readyEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  readyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  readyText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  readyActions: {
    gap: 10,
    marginTop: 4,
  },
  readyActionsWide: {
    flexDirection: 'row',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  helpGrid: {
    gap: 10,
  },
  helpCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  helpEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  helpTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  helpText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
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
  dockSecondaryAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  dockSecondaryText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
});