// Web stub. For React Native: use react-native-google-mobile-ads
export function showRewardAd(onReward: ()=>void): void {
  setTimeout(()=>onReward(), 500);
}
// RN usage (commented for reference):
// import { RewardedAd, AdEventType } from "react-native-google-mobile-ads";
// const rewarded = RewardedAd.createForAdRequest("YOUR_AD_UNIT_ID");
// rewarded.load();
// rewarded.addAdEventListener(AdEventType.LOADED, ()=>rewarded.show());
// rewarded.addAdEventListener(AdEventType.EARNED_REWARD, ()=>onReward());
