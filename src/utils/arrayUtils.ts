export function partitionArray<A>(arr: A[], isLeft: (x: A) => boolean): [A[], A[]] {
    return arr.reduce((acc, e) =>
        isLeft(e) 
            ? [[...acc[0], e], acc[1]]
            : [acc[0], [...acc[1], e]],
    [[], []] as [A[], A[]])
}