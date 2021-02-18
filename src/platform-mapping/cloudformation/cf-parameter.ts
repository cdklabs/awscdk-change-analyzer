import { Component, InfraModel } from "../../infra-model";
import { CFEntity } from "./cf-entity";

export class CFParameter extends CFEntity {

    protected generateComponent(name: string, definition: Record<string, any>): Component {
        const component = new Component(name, 'parameter', {subtype: definition.Type, properties: definition});

        if(this.parserArgs.parameterValues && this.parserArgs.parameterValues[name] !== undefined){
            component.properties.parameter_value = this.parserArgs.parameterValues[name];
        }

        return component;
    }

    public populateModel(model: InfraModel, nodes: Record<string, CFEntity>, externalParameters?: Record<string, CFEntity[]>): void {

        super.populateModel(model, nodes);

        const externalParameterRelationships = 
            (externalParameters && (externalParameters)[this.component.name])
            ? externalParameters[this.component.name].map(c => this.createDependencyRelationship(c.component, 'nested-parameter'))
            : [];

        model.relationships.push(...externalParameterRelationships);
    }

}