import { componentList } from "@core/components/masks";

class BitwiseTrieNode<T extends { componentsMask: bigint }> {
  children: Partial<Record<0 | 1, BitwiseTrieNode<T>>> = {};
  entities: Set<T> = new Set();

  remove(entity: T) {
    this.entities.delete(entity);
    this.children[0]?.remove(entity);
    this.children[1]?.remove(entity);
  }
}

export class BitwiseTrie<T extends { componentsMask: bigint }> {
  private root: BitwiseTrieNode<T>;
  private bitLength = componentList.length;

  constructor() {
    this.root = new BitwiseTrieNode();
  }

  insert(entity: T) {
    let node = this.root;
    for (let i = 0; i < this.bitLength; i++) {
      const bit = (entity.componentsMask >> BigInt(i)) & 1n ? 1 : 0;
      if (!node.children[bit]) {
        node.children[bit] = new BitwiseTrieNode();
      }
      node = node.children[bit]!;
    }
    node.entities.add(entity);
  }

  remove(entity: T) {
    this.root.remove(entity);
  }

  *search(mask: bigint): IterableIterator<T> {
    const stack: { node: BitwiseTrieNode<T>; bitPosition: number }[] = [
      { node: this.root, bitPosition: 0 },
    ];

    while (stack.length > 0) {
      const { node, bitPosition } = stack.pop()!;
      if (bitPosition === this.bitLength) {
        for (const entity of node.entities) {
          yield entity;
        }
        continue;
      }

      const bit = (mask >> BigInt(bitPosition)) & 1n ? 1 : 0;
      if (node.children[bit]) {
        stack.push({ node: node.children[bit]!, bitPosition: bitPosition + 1 });
      }
      if (!bit && node.children[1]) {
        stack.push({
          node: node.children[1]!,
          bitPosition: bitPosition + 1,
        });
      }
    }
  }

  clear() {
    this.root = new BitwiseTrieNode();
  }
}
