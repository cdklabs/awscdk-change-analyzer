import { arraysEqual } from "change-cd-iac-models/utils";

export enum DiffHighlightType {
    Insert = 'Insert',
    Remove = 'Remove',
    Update = 'Update',
};

export type DiffStringOutput = {str: string, highlights: DiffHighlightType[]}[]

export type ChangesResolver = (obj: any, path: (string | number)[]) => NodeChanges

type NodeStructure = {content: any, highlights: DiffHighlightType[]}

type NodeChanges = {
    renamedFrom?: string | number,
    structures: NodeStructure[]
}

export class DiffStringifier {

    private readonly indentationSpaces: number = 4

    constructor(
        private readonly newObj: any,
        private readonly additionalStructures?: {path: (string | number)[], structure: NodeStructure}[],
        private readonly changesResolver: ChangesResolver = ((obj: any) => ({structures: [{content: obj, highlights: []}]})),
    ){}

    build(){
        return this.buildDiffString(this.newObj, 0, [], []);
    };

    private buildDiffString(
        current: any,
        currentIndentation: number,
        currentPath: (string | number)[],
        activeHighlights: DiffHighlightType[]
    ): DiffStringOutput {

        // TODO handle update here and throw error on rename

        const content = typeof current.toJSON === 'function' ? current.toJSON() : current
        const additionalStructuresInPath = this.additionalStructures?.filter(s => arraysEqual(s.path.slice(0,-1), currentPath)) ?? []
        const result: DiffStringOutput = [];
        if(Array.isArray(content)) {
            const entries = [
                ...additionalStructuresInPath?.flatMap(({path, structure: {content: obj, highlights}}, i) => ({obj, path, highlights})),
                ...content.flatMap((obj, i) => ({path: [...currentPath, i], obj}))
            ];
            return this.buildArray(entries, activeHighlights, currentIndentation);
        } else if(typeof content === 'object' && content !== null){
            const entries = [
                ...additionalStructuresInPath?.flatMap(({path, structure: {content: obj, highlights}}, i) => ({obj, path, highlights})),
                ...Object.entries(content).flatMap(([k, obj]) => ({path: [...currentPath, k], obj}))
            ];
            return this.buildObject(entries, activeHighlights, currentIndentation);
        } else if(typeof content === 'string') {
            return [{str: `"${content}"`, highlights: activeHighlights}];
        } else {
            return [{str: `${content}`, highlights: activeHighlights}];
        }
    }

    private indent = (indentation: number) => `${new Array(indentation*this.indentationSpaces + 1).join(' ')}`;

    private buildArray(
        entries: {obj: any, path: (string | number)[], highlights?: DiffHighlightType[]}[],
        activeHighlights: DiffHighlightType[],
        currentIndentation: number
    ): DiffStringOutput {
        const newIndentation = currentIndentation + 1;
        const terminationComma = {str: `,\n${this.indent(newIndentation)}`, highlights: activeHighlights};
        const resultingStrings = entries.flatMap(({obj, path, highlights = []}) => [
            ...this.changesResolver(obj, path).structures.flatMap(({content, highlights: resolvedHighlights}) =>
                this.buildDiffString(content, newIndentation, path, [...activeHighlights, ...highlights, ...resolvedHighlights])),
            terminationComma
        ]);
        if(resultingStrings.length) return [
            {str: `[\n${this.indent(newIndentation)}`, highlights: activeHighlights},
            ...resultingStrings.slice(0,-1), //remove additional comma
            {str: `\n${this.indent(currentIndentation)}]`, highlights: activeHighlights},
        ]
        return [{str: `[]`, highlights: activeHighlights}];
    }

    private buildObject(
        entries: {obj: any, path: (string | number)[], highlights?: DiffHighlightType[]}[],
        activeHighlights: DiffHighlightType[],
        currentIndentation: number
    ): DiffStringOutput{
        const newIndentation = currentIndentation + 1;
        const terminationComma = {str: `,\n${this.indent(newIndentation)}`, highlights: activeHighlights};
        const resultingStrings = entries.flatMap(({obj, path, highlights = []}) => {
            const resolvedChanges = this.changesResolver(obj, path);
            return [
                ...(resolvedChanges.renamedFrom !== undefined) ? [{str: resolvedChanges.renamedFrom.toString(), highlights: [...activeHighlights, DiffHighlightType.Remove]}] : [],
                {str: `${path.slice(-1)}: `, highlights: [...activeHighlights, ...(resolvedChanges.renamedFrom !== undefined) ? [DiffHighlightType.Insert] : []]},
                ...resolvedChanges.structures.flatMap(({content, highlights: resolvedHighlights}) =>
                    this.buildDiffString(content, newIndentation, path, [...activeHighlights, ...highlights, ...resolvedHighlights])),
                terminationComma
            ];
        });
        if(resultingStrings.length) return [
            {str: `{\n${this.indent(newIndentation)}`, highlights: activeHighlights},
            ...resultingStrings.slice(0,-1), //remove additional comma
            {str: `\n${this.indent(currentIndentation)}}`, highlights: activeHighlights},
        ]
        return [{str: `{}`, highlights: activeHighlights}];
    }
}