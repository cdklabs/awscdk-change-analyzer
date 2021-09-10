import { classToDeserializer } from './deserializer-mapping';
import { JSONSerializable, Serialized } from './json-serializable';
import { SerializationID } from './json-serializer';


export class JSONDeserializer<T extends JSONSerializable> {

  private readonly deserializedObjects: Map<SerializationID, any> = new Map();
  private objects: {class: string, content: Serialized}[];

  public deserialize(str: string): T {
    const obj = JSON.parse(str);
    if(typeof obj !== 'object' || obj === null || Array.isArray(obj)){
      throw Error('Cannot deserialize string as it does not represent an object');
    } else if(typeof obj.entryPointId !== 'number'){
      throw Error('Cannot deserialize: entry point id not found');
    }
    this.objects = obj.objects;
    return this.deserializeObject(obj.entryPointId) as T;
  }

  private deserializeObject(id: SerializationID): JSONSerializable {
    let createdObj = this.deserializedObjects.get(id);

    if(!createdObj){
      if(this.objects.length <= id){
        throw Error('SerializationID could not be found');
      }

      const objectDeserializer = classToDeserializer[this.objects[id].class];
      if(!objectDeserializer)
        throw Error(`Object deserializer for class ${this.objects[id].class} is not configured`);


      createdObj = objectDeserializer(this.objects[id].content, this.deserializeObject.bind(this));
      this.deserializedObjects.set(id, createdObj);
    }
    return createdObj;
  }
}