
export const isValidAddy = (wallet: string) => {
  return wallet.length === 42 && wallet.startsWith("0x");
};
