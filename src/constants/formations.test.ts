import { fieldLayout } from "./formations";

describe("fieldLayout", () => {
  it("mantem o 5-3-2 dentro da area visual segura do campo tatico", () => {
    const height = 244;
    const slots = fieldLayout("5-3-2", true, 320, height);

    expect(slots).toHaveLength(11);
    slots.forEach(slot=>{
      expect(slot.y).toBeGreaterThanOrEqual(height*0.12);
      expect(slot.y).toBeLessThanOrEqual(height*0.88);
    });

    const centralDefenders = slots.filter(slot=>slot.role==="ZAG").sort((a,b)=>a.y-b.y);
    for(let i=1;i<centralDefenders.length;i++){
      expect(centralDefenders[i].y-centralDefenders[i-1].y).toBeGreaterThanOrEqual(40);
    }
  });
});
