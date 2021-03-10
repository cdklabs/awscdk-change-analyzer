export const stringSimilarity = (a: string, b: string): number => {

    if (a.length < 2 || b.length < 2){
        return a === b ? 1 : 0;
    }
      
    const aBigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.substr(i, 2);
        aBigrams.set(bigram, (aBigrams.get(bigram) ?? 0) + 1);
    }
    
    let intersectionSize = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.substr(i, 2);
        const count = aBigrams.get(bigram) ?? 0;

        if (count > 0) {
            aBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }
      
    return 2 * intersectionSize / (a.length + b.length - 2);

};