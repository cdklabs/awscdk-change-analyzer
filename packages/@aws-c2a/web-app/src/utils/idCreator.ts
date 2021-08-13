import { useState } from 'react';

export class ObjIdAssigner {
  map = new WeakMap();
  counter = 0;

  get(obj: any): any {
    if(obj === undefined) return obj;
    let id = this.map.get(obj);
    if (!id) {
      id = this.counter++;
      this.map.set(obj, id);
    }
    return id;
  }
}

export function useIdAssignerHook(): ObjIdAssigner {
  const [isOnline] = useState(new ObjIdAssigner());
  return isOnline;
}