import { IGCharacteristicValue, IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";

export type IGDescriptionCreator = {
    describesCharacteristics: string[],
    creatorFunction: (characteristics: Record<string, IGCharacteristicValue>) => string[]
}

export function addIGDescriptions<T>(
    igRoots: IsomorphicGroup<T>[], descriptionCreators: IGDescriptionCreator[]
): IsomorphicGroup<T>[]{
    const igStack: IsomorphicGroup<T>[] = [...igRoots];

    while(igStack.length){
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ig = igStack.pop()!;
        igStack.push(...ig?.subGroups ?? []);
        if(!ig.descriptions)
            ig.descriptions = [];
        const undescribedCharacteristics = new Set(Object.keys(ig.characteristics));
        ig.descriptions.push(...descriptionCreators.flatMap(creator => {
            creator.describesCharacteristics.forEach(c => undescribedCharacteristics.delete(c));
            return creator.creatorFunction(ig.characteristics);
        }));

        ig.descriptions.push(...[...undescribedCharacteristics].map(c => `${c}: ${ig.characteristics[c]}`));
    }

    return igRoots;
}