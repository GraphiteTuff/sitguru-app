import { listPeriodsNeedingAttention } from "@/lib/staff-time/queries";

export type ContractorAttentionCounts = {
  hoursAwaitingApproval: number;
  awaitingPayment: number;
  needsCorrection: number;
  available: boolean;
};

export async function contractorAttentionCounts(): Promise<ContractorAttentionCounts> {
  try {
    const items = await listPeriodsNeedingAttention();
    return {
      hoursAwaitingApproval: items.filter((item) => item.period.status === "submitted")
        .length,
      awaitingPayment: items.filter((item) =>
        ["approved", "ready_for_payment", "processing"].includes(item.period.status),
      ).length,
      needsCorrection: items.filter((item) => item.period.status === "needs_correction")
        .length,
      available: true,
    };
  } catch (error) {
    console.warn("[staff-time] contractorAttentionCounts", error);
    return {
      hoursAwaitingApproval: 0,
      awaitingPayment: 0,
      needsCorrection: 0,
      available: false,
    };
  }
}
