export const capitalizeFirst = (value: string): string => {
  return `${value[0]!.toUpperCase()}${value.substring(1)}`;
};
