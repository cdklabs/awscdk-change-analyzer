import { useState } from 'react';

export class ObjIdAssigner {
  map = new WeakMap();
  counter = 0;

  get(obj: any) {
    if(obj === undefined) return obj;
    let id = this.map.get(obj);
    if (!id) {
      id = this.counter++;
      this.map.set(obj, id);
    }
    return id;
  }
}

export function useIdAssignerHook() {
  const [isOnline] = useState(new ObjIdAssigner());
  return isOnline;
}