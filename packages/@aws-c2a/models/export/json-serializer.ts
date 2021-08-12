import { JSONSerializable, Serialized } from './json-serializable';

export type SerializationID = number;

export class JSONSerializer {

  private readonly encodedReferences: Map<JSONSerializable, SerializationID> = new Map();
  private readonly objectsToWrite: Serialized[] = [];

  public add(obj: JSONSerializable): SerializationID {
    const id = this.encodedReferences.get(obj);
    if(!id){ //for performance. Would not want to serialize the object if it already exists
      return this.addCustom(obj, obj.getSerializationClass(), obj.toSerialized(this.add.bind(this), this.addCustom.bind(this)));
    }
    return id;
  }

  public addCustom(obj: any, serializerClass: string, serialized: Serialized): SerializationID {
    let id = this.encodedReferences.get(obj);
    if(!id){
      id = this.objectsToWrite.length;
      this.encodedReferences.set(obj, id);
      this.objectsToWrite.push({
        class: serializerClass,
        content: serialized,
      });
    }
    return id;
  }

  public serialize(obj: JSONSerializable): string{
    const entryPointId = this.add(obj);
    return JSON.stringify({entryPointId, objects: this.objectsToWrite});
  }
}