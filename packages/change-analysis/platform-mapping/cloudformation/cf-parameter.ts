import { Component, ComponentPropertyPrimitive, InfraModel } from 'cdk-change-analyzer-models';
import { CFEntity } from './cf-entity';

export class CFParameter extends CFEntity {

  protected generateComponent(name: string, definition: Record<string, any>): Component {
    const component = new Component(name, 'Parameter', {subtype: definition.Type, properties: this.cfDefinitionToComponentProperty(definition)});

    const propertiesRecord = component.properties.getRecord();
    if(this.parserArgs.parameterValues && this.parserArgs.parameterValues[name] !== undefined && propertiesRecord){
      propertiesRecord.parameter_value = new ComponentPropertyPrimitive(this.parserArgs.parameterValues[name]);
    }

    return component;
  }

  public populateModel(
    model: InfraModel,
    nodes: Record<string, CFEntity>,
    externalParameters?: Record<string, CFEntity[]>,
  ): void {

    super.populateModel(model, nodes);
    const externalParameterRelationships = externalParameters?.[this.component.name]
      ? externalParameters[this.component.name].map(c =>
        this.createDependencyRelationship(c.component, 'nested-parameter'))
      : [];
    model.relationships.push(...externalParameterRelationships);
  }

}