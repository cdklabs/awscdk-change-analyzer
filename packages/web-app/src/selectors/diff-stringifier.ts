import { ComponentPropertyValue } from "cdk-change-analyzer-models/infra-model";
import { arraysEqual, isDefined } from "cdk-change-analyzer-models/utils";

export enum DiffHighlightType {
    Insert = 'Insert',
    Remove = 'Remove',
    Update = 'Update / Move',
};

export type Highlights<T> = {
    [type in DiffHighlightType]?: T[]
}

export type DiffStringChunk<T> = {str: string, highlights: Highlights<T>, path: (string | number)[]} | DiffStringChunk<T>[]
export type DiffStringOutput<T> = DiffStringChunk<T>[]

export type ChangesResolver<T> = (obj: any, path: (string | number)[]) => NodeChanges<T>

type NodeStructure<T> = {content: any, highlights: Highlights<T>}

type NodeChanges<T> = {
    renamedFrom?: string | number,
    structures: NodeStructure<T>[]
}

export class DiffStringifier<T> {

    private readonly indentationSpaces: number = 4

    constructor(
        private readonly newObj: any,
        private readonly additionalStructures?: {path: (string | number)[], structure: NodeStructure<T>}[],
        private readonly changesResolver: ChangesResolver<T> = ((obj: any) => ({structures: [{content: obj, highlights: {}}]})),
    ){}

    build(){
        return this.buildDiffString(this.newObj, 0, [], {});
    };

    private buildDiffString(
        current: any,
        currentIndentation: number,
        path: (string | number)[],
        activeHighlights: Highlights<T>
    ): DiffStringOutput<T> {
        const content = typeof current.toJSON === 'function' ? current.toJSON() : current
        const additionalStructuresInPath = this.additionalStructures?.filter(s => arraysEqual(s.path.slice(0,-1), path)) ?? []
        const result: DiffStringOutput<T> = [];
        if(Array.isArray(content)) {
            const entries = [
                ...additionalStructuresInPath?.flatMap(({path, structure: {content: obj, highlights}}, i) => ({obj, path, highlights})),
                ...content.flatMap((obj, i) => ({path: [...path, i], obj}))
            ];
            return this.buildArray(entries, activeHighlights, currentIndentation, path);
        } else if(typeof content === 'object' && content !== null){
            const entries = [
                ...additionalStructuresInPath?.flatMap(({path, structure: {content: obj, highlights}}, i) => ({obj, path, highlights})),
                ...Object.entries(content).flatMap(([k, obj]) => ({path: [...path, k], obj}))
            ];
            return this.buildObject(entries, activeHighlights, currentIndentation, path);
        } else if(typeof content === 'string') {
            return [{str: `"${content.split('"').join('\\"')}"`, highlights: activeHighlights, path}];
        } else {
            return [{str: `${content}`, highlights: activeHighlights, path}];
        }
    }

    private indent = (indentation: number) => `${new Array(indentation*this.indentationSpaces + 1).join(' ')}`;

    private buildArray(
        entries: {obj: any, path: (string | number)[], highlights?: Highlights<T>}[],
        activeHighlights: Highlights<T>,
        currentIndentation: number,
        path: (string | number)[]
    ): DiffStringOutput<T> {
        const newIndentation = currentIndentation + 1;
        const terminationComma = {str: `,\n`, highlights: activeHighlights};
        const indentationStr = {str: `${this.indent(newIndentation)}`, highlights: activeHighlights, path};
        const resultingStrings = entries.map(({obj, path: entryPath, highlights = {}}): DiffStringChunk<T>[] => [
            indentationStr,
            ...this.changesResolver(obj, entryPath).structures.flatMap(({content, highlights: resolvedHighlights}) =>
                this.buildDiffString(content, newIndentation, entryPath, this.joinHighlights([activeHighlights, highlights, resolvedHighlights]))),
            {...terminationComma, path: entryPath}
        ]);
        if(resultingStrings.length) {
            resultingStrings[resultingStrings.length - 1].pop();
            return [
                {str: `[\n`, highlights: activeHighlights, path},
                ...resultingStrings, //remove additional comma
                {str: `${this.indent(currentIndentation)}]`, highlights: activeHighlights, path},
            ]
        }
        return [{str: `[]`, highlights: activeHighlights, path}];
    }

    private buildObject(
        entries: {obj: any, path: (string | number)[], highlights?: Highlights<T>}[],
        activeHighlights: Highlights<T>,
        currentIndentation: number,
        path: (string | number)[]
    ): DiffStringOutput<T>{
        const newIndentation = currentIndentation + 1;
        const terminationComma = {str: `,\n`, highlights: activeHighlights};
        const resultingStrings = entries.map(({obj, path: entryPath, highlights = {}}): DiffStringChunk<T>[] => {
            const resolvedChanges = this.changesResolver(obj, entryPath);
            return [
                ...(resolvedChanges.renamedFrom !== undefined) ? [{str: resolvedChanges.renamedFrom.toString(), highlights: this.addHighlights(activeHighlights, [DiffHighlightType.Remove]), path: entryPath}] : [],
                {str: `${this.indent(newIndentation)}${entryPath.slice(-1)}: `, highlights: this.addHighlights(activeHighlights, (resolvedChanges.renamedFrom !== undefined) ? [DiffHighlightType.Insert] : []), path: entryPath},
                ...resolvedChanges.structures.flatMap(({content, highlights: resolvedHighlights}) =>
                    this.buildDiffString(content, newIndentation, entryPath, this.joinHighlights([activeHighlights, highlights, resolvedHighlights]))),
                {...terminationComma, path: entryPath}
            ];
        });
        if(resultingStrings.length){
            resultingStrings[resultingStrings.length - 1].pop();
            return [
                {str: `{\n`, highlights: activeHighlights, path},
                ...resultingStrings, //remove additional comma
                {str: `${this.indent(currentIndentation)}}`, highlights: activeHighlights, path},
            ]
        }
        return [{str: `{}`, highlights: activeHighlights, path}];
    }

    private joinHighlights(highlightsArr: Highlights<T>[]) {
        const keys = [...new Set(highlightsArr.flatMap(h => Object.keys(h)))] as DiffHighlightType[];
        return Object.fromEntries(keys.map(k => [k, highlightsArr.flatMap(h => h[k])]));
    }

    private addHighlights(activeHighlights: Highlights<T>, types: DiffHighlightType[]) {
        const newActiveHighlights = {...activeHighlights};
        types.forEach(t => newActiveHighlights[t] = [...newActiveHighlights[t] ?? []]);
        return newActiveHighlights;
    }
}