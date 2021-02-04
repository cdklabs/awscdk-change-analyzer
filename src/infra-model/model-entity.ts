export abstract class ModelEntity {

    properties: Record<string, any>

    constructor(properties?: Record<string, any>){
        this.properties = properties ?? {}
    }
}