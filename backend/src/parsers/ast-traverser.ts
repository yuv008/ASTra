import { ASTNode } from './base-parser';

// Visitor pattern for AST traversal
export type VisitorFunction = (node: ASTNode, parent: ASTNode | null, path: string[]) => void | boolean;

export interface Visitor {
  [nodeType: string]: VisitorFunction | {
    enter?: VisitorFunction;
    exit?: VisitorFunction;
  };
}

export class ASTTraverser {
  /**
   * Generic tree traversal for any AST (including Tree-sitter)
   */
  static traverse(
    node: ASTNode,
    visitor: Visitor,
    parent: ASTNode | null = null,
    path: string[] = []
  ): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    const currentPath = [...path, node.type];

    // Call enter visitor
    const visitorFn = visitor[node.type];
    let shouldSkip = false;

    if (visitorFn) {
      if (typeof visitorFn === 'function') {
        shouldSkip = visitorFn(node, parent, currentPath) === false;
      } else if (visitorFn.enter) {
        shouldSkip = visitorFn.enter(node, parent, currentPath) === false;
      }
    }

    // Call wildcard visitor
    if (visitor['*'] && typeof visitor['*'] === 'function') {
      visitor['*'](node, parent, currentPath);
    }

    // Traverse children if not skipped
    if (!shouldSkip) {
      this.traverseChildren(node, visitor, currentPath);
    }

    // Call exit visitor
    if (visitorFn && typeof visitorFn !== 'function' && visitorFn.exit) {
      visitorFn.exit(node, parent, currentPath);
    }
  }

  private static traverseChildren(node: ASTNode, visitor: Visitor, path: string[]): void {
    // Ignore certain non-AST properties
    const ignoreKeys = new Set(['loc', 'range', 'start', 'end', 'type', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'extra', 'tokens']);

    // Traverse all object properties
    for (const key in node) {
      if (ignoreKeys.has(key)) continue;

      const value = node[key];

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Traverse array of nodes
          for (const child of value) {
            if (child && typeof child === 'object' && child.type) {
              this.traverse(child, visitor, node, path);
            }
          }
        } else if (value.type) {
          // Traverse single node
          this.traverse(value, visitor, node, path);
        }
      }
    }
  }

  /**
   * Find all nodes of a specific type
   */
  static findNodes(ast: ASTNode, nodeType: string): ASTNode[] {
    const found: ASTNode[] = [];

    this.traverse(ast, {
      [nodeType]: (node) => {
        found.push(node);
      },
    });

    return found;
  }

  /**
   * Find first node matching predicate
   */
  static findNode(ast: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode | null {
    let result: ASTNode | null = null;

    this.traverse(ast, {
      '*': (node) => {
        if (result) return false; // Stop traversal
        if (predicate(node)) {
          result = node;
          return false; // Stop traversal
        }
      },
    });

    return result;
  }
}
