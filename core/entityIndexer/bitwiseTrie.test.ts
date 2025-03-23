import { BitwiseTrie } from "./bitwiseTrie";

describe("bitwiseTrie", () => {
  let e1: { componentsMask: bigint };
  let e2: { componentsMask: bigint };
  let e3: { componentsMask: bigint };
  let trie: BitwiseTrie<{ componentsMask: bigint }>;

  beforeEach(() => {
    e1 = { componentsMask: 0b001n };
    e2 = { componentsMask: 0b010n };
    e3 = { componentsMask: 0b110n };

    trie = new BitwiseTrie();
    trie.insert(e1);
    trie.insert(e2);
    trie.insert(e3);
  });

  it("should be able to insert entities", () => {
    const result1 = trie.search(0b001n);
    expect(result1.next().value).toBe(e1);
    expect(result1.next().done).toBe(true);

    const result2 = trie.search(0b010n);
    expect(result2.next().value).toBe(e3);
    expect(result2.next().value).toBe(e2);
    expect(result2.next().done).toBe(true);

    const result3 = trie.search(0b100n);
    expect(result3.next().value).toBe(e3);
    expect(result3.next().done).toBe(true);
  });

  it("should be able to remove entities 1", () => {
    trie.remove(e1);

    const result1 = trie.search(0b001n);
    expect(result1.next().done).toBe(true);

    const result2 = trie.search(0b010n);
    expect(result2.next().value).toBe(e3);
    expect(result2.next().value).toBe(e2);
    expect(result2.next().done).toBe(true);

    const result3 = trie.search(0b100n);
    expect(result3.next().value).toBe(e3);
    expect(result3.next().done).toBe(true);
  });

  it("should be able to remove entities 2", () => {
    trie.remove(e2);

    const result1 = trie.search(0b001n);
    expect(result1.next().value).toBe(e1);
    expect(result1.next().done).toBe(true);

    const result2 = trie.search(0b010n);
    expect(result2.next().value).toBe(e3);
    expect(result2.next().done).toBe(true);

    const result3 = trie.search(0b100n);
    expect(result3.next().value).toBe(e3);
    expect(result3.next().done).toBe(true);
  });

  it("should be able to remove entities 3", () => {
    trie.remove(e3);

    const result1 = trie.search(0b001n);
    expect(result1.next().value).toBe(e1);
    expect(result1.next().done).toBe(true);

    const result2 = trie.search(0b010n);
    expect(result2.next().value).toBe(e2);
    expect(result2.next().done).toBe(true);

    const result3 = trie.search(0b100n);
    expect(result3.next().done).toBe(true);
  });
});
