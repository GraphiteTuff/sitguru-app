import { StyleSheet, View } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

export type SitGuruIconName =
  | 'account'
  | 'availability'
  | 'booking'
  | 'calendar'
  | 'care'
  | 'checklist'
  | 'community'
  | 'compass'
  | 'home'
  | 'lead'
  | 'lock'
  | 'message'
  | 'outreach'
  | 'paw'
  | 'payment'
  | 'perks'
  | 'payout'
  | 'profile'
  | 'reply'
  | 'request'
  | 'reward'
  | 'roles'
  | 'search'
  | 'service'
  | 'training'
  | 'trust'
  | 'visit';

type SitGuruIconBadgeTone = 'neutral' | 'primary' | 'warning' | 'danger' | 'dark';
type SitGuruIconBadgeSize = 'small' | 'medium' | 'large';

type SitGuruIconBadgeProps = {
  name: SitGuruIconName;
  size?: SitGuruIconBadgeSize;
  tone?: SitGuruIconBadgeTone;
};

export default function SitGuruIconBadge({
  name,
  size = 'medium',
  tone = 'neutral',
}: SitGuruIconBadgeProps) {
  const color = toneStyles[tone].iconColor;
  const glyphSize = sizeStyles[size].glyphSize;

  return (
    <View style={[styles.badge, sizeStyles[size].badge, toneStyles[tone].badge]}>
      <SitGuruGlyph color={color} name={name} size={glyphSize} />
    </View>
  );
}

function SitGuruGlyph({
  color,
  name,
  size,
}: {
  color: string;
  name: SitGuruIconName;
  size: number;
}) {
  switch (name) {
    case 'account':
    case 'profile':
      return <ProfileGlyph color={color} size={size} />;
    case 'availability':
    case 'booking':
    case 'calendar':
      return <CalendarGlyph color={color} size={size} />;
    case 'care':
    case 'paw':
      return <PawGlyph color={color} size={size} />;
    case 'checklist':
      return <ChecklistGlyph color={color} size={size} />;
    case 'community':
    case 'lead':
      return <NetworkGlyph color={color} size={size} />;
    case 'compass':
    case 'visit':
      return <CompassGlyph color={color} size={size} />;
    case 'home':
    case 'service':
      return <HomeGlyph color={color} size={size} />;
    case 'outreach':
      return <PinGlyph color={color} size={size} />;
    case 'lock':
      return <LockGlyph color={color} size={size} />;
    case 'message':
      return <ReplyGlyph color={color} size={size} />;
    case 'payment':
      return <PaymentGlyph color={color} size={size} />;
    case 'perks':
    case 'reward':
      return <RewardGlyph color={color} size={size} />;
    case 'payout':
      return <PayoutGlyph color={color} size={size} />;
    case 'reply':
      return <ReplyGlyph color={color} size={size} />;
    case 'request':
      return <InboxGlyph color={color} size={size} />;
    case 'roles':
      return <RolesGlyph color={color} size={size} />;
    case 'search':
      return <SearchGlyph color={color} size={size} />;
    case 'training':
      return <BookGlyph color={color} size={size} />;
    case 'trust':
      return <ShieldGlyph color={color} size={size} />;
    default:
      return <PawGlyph color={color} size={size} />;
  }
}

function Dot({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: color,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
        style,
      ]}
    />
  );
}

function PawGlyph({ color, size }: { color: string; size: number }) {
  const toe = size * 0.18;

  return (
    <View style={{ height: size, width: size }}>
      <Dot color={color} size={toe} style={{ left: size * 0.19, position: 'absolute', top: size * 0.18 }} />
      <Dot color={color} size={toe} style={{ left: size * 0.41, position: 'absolute', top: size * 0.1 }} />
      <Dot color={color} size={toe} style={{ left: size * 0.63, position: 'absolute', top: size * 0.18 }} />
      <View
        style={{
          backgroundColor: color,
          borderRadius: size * 0.22,
          height: size * 0.32,
          left: size * 0.29,
          position: 'absolute',
          top: size * 0.47,
          width: size * 0.42,
        }}
      />
    </View>
  );
}

function HomeGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          backgroundColor: color,
          borderRadius: 999,
          height: 2,
          left: size * 0.17,
          position: 'absolute',
          top: size * 0.35,
          transform: [{ rotate: '-32deg' }],
          width: size * 0.42,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 999,
          height: 2,
          position: 'absolute',
          right: size * 0.17,
          top: size * 0.35,
          transform: [{ rotate: '32deg' }],
          width: size * 0.42,
        }}
      />
      <View
        style={{
          borderColor: color,
          borderRadius: 3,
          borderWidth: 2,
          height: size * 0.42,
          left: size * 0.25,
          position: 'absolute',
          top: size * 0.43,
          width: size * 0.5,
        }}
      />
    </View>
  );
}

function NetworkGlyph({ color, size }: { color: string; size: number }) {
  const dot = size * 0.2;

  return (
    <View style={{ height: size, width: size }}>
      <View style={[styles.line, { backgroundColor: color, left: size * 0.3, top: size * 0.38, transform: [{ rotate: '24deg' }], width: size * 0.42 }]} />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.3, top: size * 0.58, transform: [{ rotate: '-24deg' }], width: size * 0.42 }]} />
      <Dot color={color} size={dot} style={{ left: size * 0.11, position: 'absolute', top: size * 0.4 }} />
      <Dot color={color} size={dot} style={{ left: size * 0.66, position: 'absolute', top: size * 0.2 }} />
      <Dot color={color} size={dot} style={{ left: size * 0.66, position: 'absolute', top: size * 0.62 }} />
    </View>
  );
}

function SearchGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: size * 0.28,
          borderWidth: 2,
          height: size * 0.56,
          left: size * 0.16,
          position: 'absolute',
          top: size * 0.12,
          width: size * 0.56,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 999,
          height: 2,
          left: size * 0.58,
          position: 'absolute',
          top: size * 0.68,
          transform: [{ rotate: '45deg' }],
          width: size * 0.3,
        }}
      />
    </View>
  );
}

function CalendarGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        borderColor: color,
        borderRadius: 5,
        borderWidth: 2,
        height: size * 0.72,
        marginTop: size * 0.12,
        width: size * 0.76,
      }}
    >
      <View style={{ backgroundColor: color, height: 2, marginTop: size * 0.2, width: '100%' }} />
      <View style={{ flexDirection: 'row', gap: 3, marginLeft: size * 0.16, marginTop: size * 0.14 }}>
        <Dot color={color} size={3} />
        <Dot color={color} size={3} />
        <Dot color={color} size={3} />
      </View>
    </View>
  );
}

function ProfileGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View style={{ borderColor: color, borderRadius: size * 0.16, borderWidth: 2, height: size * 0.32, width: size * 0.32 }} />
      <View style={{ borderColor: color, borderRadius: size * 0.22, borderWidth: 2, height: size * 0.28, marginTop: size * 0.08, width: size * 0.62 }} />
    </View>
  );
}

function ChecklistGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ gap: size * 0.14, height: size, justifyContent: 'center', width: size }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ alignItems: 'center', flexDirection: 'row', gap: size * 0.11 }}>
          <View style={{ borderColor: color, borderRadius: 2, borderWidth: 2, height: size * 0.18, width: size * 0.18 }} />
          <View style={{ backgroundColor: color, borderRadius: 999, height: 2, width: size * 0.5 }} />
        </View>
      ))}
    </View>
  );
}

function ShieldGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: size * 0.22,
          borderWidth: 2,
          height: size * 0.72,
          left: size * 0.2,
          position: 'absolute',
          top: size * 0.1,
          width: size * 0.6,
        }}
      />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.34, top: size * 0.48, transform: [{ rotate: '42deg' }], width: size * 0.2 }]} />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.46, top: size * 0.44, transform: [{ rotate: '-42deg' }], width: size * 0.32 }]} />
    </View>
  );
}

function RolesGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <Dot color={color} size={size * 0.22} style={{ left: size * 0.12, position: 'absolute', top: size * 0.2 }} />
      <Dot color={color} size={size * 0.22} style={{ left: size * 0.58, position: 'absolute', top: size * 0.2 }} />
      <Dot color={color} size={size * 0.22} style={{ left: size * 0.35, position: 'absolute', top: size * 0.58 }} />
    </View>
  );
}

function InboxGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          borderBottomWidth: 2,
          borderColor: color,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderTopWidth: 0,
          borderRadius: 4,
          height: size * 0.42,
          left: size * 0.18,
          position: 'absolute',
          top: size * 0.42,
          width: size * 0.64,
        }}
      />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.32, top: size * 0.24, transform: [{ rotate: '45deg' }], width: size * 0.28 }]} />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.5, top: size * 0.24, transform: [{ rotate: '-45deg' }], width: size * 0.28 }]} />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.49, top: size * 0.18, transform: [{ rotate: '90deg' }], width: size * 0.42 }]} />
    </View>
  );
}

function CompassGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View style={{ borderColor: color, borderRadius: size * 0.36, borderWidth: 2, height: size * 0.72, width: size * 0.72 }} />
      <View style={[styles.line, { backgroundColor: color, position: 'absolute', transform: [{ rotate: '-42deg' }], width: size * 0.48 }]} />
    </View>
  );
}

function PinGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View style={{ borderColor: color, borderRadius: size * 0.22, borderWidth: 2, height: size * 0.44, width: size * 0.44 }} />
      <View style={[styles.line, { backgroundColor: color, marginTop: -2, transform: [{ rotate: '90deg' }], width: size * 0.34 }]} />
    </View>
  );
}

function BookGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ flexDirection: 'row', height: size * 0.72, marginTop: size * 0.14, width: size * 0.76 }}>
      <View style={{ borderColor: color, borderRadius: 4, borderWidth: 2, flex: 1 }} />
      <View style={{ backgroundColor: color, marginHorizontal: -1, width: 2 }} />
      <View style={{ borderColor: color, borderRadius: 4, borderWidth: 2, flex: 1 }} />
    </View>
  );
}

function RewardGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', height: size, width: size }}>
      <View style={{ borderColor: color, borderRadius: size * 0.25, borderWidth: 2, height: size * 0.5, marginTop: size * 0.08, width: size * 0.5 }} />
      <View style={{ flexDirection: 'row', gap: 4, marginTop: -1 }}>
        <View style={{ backgroundColor: color, borderRadius: 2, height: size * 0.28, transform: [{ rotate: '14deg' }], width: 2 }} />
        <View style={{ backgroundColor: color, borderRadius: 2, height: size * 0.28, transform: [{ rotate: '-14deg' }], width: 2 }} />
      </View>
    </View>
  );
}

function ReplyGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <View style={{ borderColor: color, borderRadius: 6, borderWidth: 2, height: size * 0.5, left: size * 0.18, position: 'absolute', top: size * 0.18, width: size * 0.64 }} />
      <View style={[styles.line, { backgroundColor: color, left: size * 0.28, top: size * 0.72, transform: [{ rotate: '-36deg' }], width: size * 0.24 }]} />
    </View>
  );
}

function PaymentGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, justifyContent: 'center', width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: 5,
          borderWidth: 2,
          height: size * 0.58,
          width: size * 0.82,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            height: 2,
            marginTop: size * 0.17,
            width: '100%',
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: 999,
            height: 2,
            marginLeft: size * 0.12,
            marginTop: size * 0.14,
            width: size * 0.26,
          }}
        />
      </View>
    </View>
  );
}

function PayoutGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ height: size, justifyContent: 'center', width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: 6,
          borderWidth: 2,
          height: size * 0.58,
          width: size * 0.78,
        }}
      >
        <View
          style={{
            borderColor: color,
            borderRadius: 4,
            borderWidth: 2,
            height: size * 0.25,
            position: 'absolute',
            right: -2,
            top: size * 0.16,
            width: size * 0.34,
          }}
        />
        <Dot
          color={color}
          size={size * 0.09}
          style={{ position: 'absolute', right: size * 0.1, top: size * 0.24 }}
        />
      </View>
    </View>
  );
}

function LockGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: size * 0.18,
          borderWidth: 2,
          height: size * 0.38,
          marginBottom: -2,
          width: size * 0.46,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 5,
          height: size * 0.44,
          width: size * 0.68,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  line: {
    borderRadius: 999,
    height: 2,
    position: 'absolute',
  },
});

const sizeStyles = {
  small: {
    badge: {
      borderRadius: 10,
      height: 32,
      width: 32,
    },
    glyphSize: 18,
  },
  medium: {
    badge: {
      borderRadius: 14,
      height: 42,
      width: 42,
    },
    glyphSize: 22,
  },
  large: {
    badge: {
      borderRadius: 18,
      height: 56,
      width: 56,
    },
    glyphSize: 28,
  },
};

const toneStyles = {
  neutral: {
    badge: {
      backgroundColor: SitGuruColors.surfaceSoft,
      borderColor: SitGuruColors.border,
    },
    iconColor: SitGuruColors.primary,
  },
  primary: {
    badge: {
      backgroundColor: SitGuruColors.surfaceSoft,
      borderColor: SitGuruColors.primaryLight,
    },
    iconColor: SitGuruColors.primary,
  },
  warning: {
    badge: {
      backgroundColor: 'rgba(181, 71, 8, 0.08)',
      borderColor: 'rgba(181, 71, 8, 0.22)',
    },
    iconColor: SitGuruColors.warning,
  },
  danger: {
    badge: {
      backgroundColor: 'rgba(180, 35, 24, 0.07)',
      borderColor: 'rgba(180, 35, 24, 0.18)',
    },
    iconColor: SitGuruColors.danger,
  },
  dark: {
    badge: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    iconColor: '#FFFFFF',
  },
};
