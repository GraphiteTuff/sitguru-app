export type ReadsPageSearch = Record<string, string | string[] | undefined>;

export function readSearchParam(
  params: ReadsPageSearch,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}
