export type IGCharacteristicValue =  string | number | boolean;

export interface IsomorphicGroup<T> {
    entities: Set<T>,
    characteristics: Record<string, IGCharacteristicValue>
}