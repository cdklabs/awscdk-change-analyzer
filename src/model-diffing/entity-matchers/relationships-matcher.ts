import { Relationship } from "../../infra-model";
import { EntitiesMatcher } from "./entities-matcher";
import { stringSimilarity } from "../../utils";

/**
 * Matches relationships based on their class and type similarity 
 */
export class RelationshipsMatcher extends EntitiesMatcher<Relationship> {

    protected calcEntitySimilarity(a: Relationship, b: Relationship): number {
        if(!(b instanceof a.constructor)){
            return 0;
        }
        return stringSimilarity(a.type, b.type);
    }
}