import {
    ComponentOperation,
    PropertyComponentOperation,
} from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const propertyPathV1IGModule = new EqualityIGModule(
    'Property Path Before',
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation) return cOp.pathTransition.v1 ? JSON.stringify(cOp.pathTransition.v1) : 'Unknown';
        return 'Unknown';
    } 
);

export const propertyPathV2IGModule = new EqualityIGModule(
    'Property Path After',
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation) return cOp.pathTransition.v2 ? JSON.stringify(cOp.pathTransition.v2) : 'Unknown';
        return 'Unknown';
    } 
);