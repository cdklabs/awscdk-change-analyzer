import { Relationship } from "../../infra-model";
import { EntitiesMatcher } from "./entities-matcher";
import { stringSimilarity } from "../../utils";

/**
 * Matches relationships based on their class and type similarity
 * metadata is a boolean value that states if the relationship was changed or not
 */
export class RelationshipsMatcher extends EntitiesMatcher<Relationship, boolean> {

    protected calcEntitySimilarity(a: Relationship, b: Relationship): [number, boolean] | undefined {
        if(!(b instanceof a.constructor))
            return;

        const similarity = stringSimilarity(a.type, b.type);

        return [similarity, similarity < 1];
    }
}