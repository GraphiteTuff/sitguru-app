import type { ReactElement } from 'react';

type SitGuruPaymentsProviderProps = {
  children: ReactElement | ReactElement[];
};

export default function SitGuruPaymentsProvider({
  children,
}: SitGuruPaymentsProviderProps) {
  return <>{children}</>;
}