import { useEffect, useRef, useState } from "react";

export interface DeltaFlash { id:number; text:string; }

// Flashes a short-lived "+N" whenever `value` increases by at least `minDelta`.
// Used to surface real state jumps (ad reward, upgrade purchase) without
// reacting to routine passive ticks — callers tune minDelta to filter those out.
export function useDeltaFlash(
  value:number,
  minDelta=1,
  format:(diff:number)=>string = d=>`+${Math.round(d)}`,
): DeltaFlash|null {
  const prev = useRef(value);
  const [flash, setFlash] = useState<DeltaFlash|null>(null);

  useEffect(()=>{
    const diff = value - prev.current;
    prev.current = value;
    if(diff >= minDelta){
      const id = Date.now();
      setFlash({id, text:format(diff)});
      const t = setTimeout(()=>setFlash(f=>(f && f.id===id) ? null : f), 900);
      return ()=>clearTimeout(t);
    }
  }, [value, minDelta, format]);

  return flash;
}
