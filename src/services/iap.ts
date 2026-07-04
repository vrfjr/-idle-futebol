// Web stub. For React Native: use react-native-iap
export const products = ["remove_ads","pack_premium","pack_legendary"];
export async function initIAP(): Promise<void> {}
export async function buyProduct(productId: string): Promise<boolean> {
  console.log("buyProduct:", productId);
  return true;
}
// RN usage (commented for reference):
// import * as RNIap from "react-native-iap";
// export async function initIAP() { await RNIap.initConnection(); }
// export async function buyProduct(id:string) { await RNIap.requestPurchase(id); }
