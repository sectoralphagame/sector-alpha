/**
 * Base interface for any component. Due to serialization and deserialization
 * problems it's required for a component to be composed only of literal
 * (not class) objects.
 */
export type BaseComponent<T extends string> = { name: T };
