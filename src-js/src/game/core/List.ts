/**
 * List data structure - ported from src/list/list.h
 * 
 * Classic doubly-linked list implementation used throughout the game
 * for managing objects, nodes, and various game entities.
 */

export class Node {
    public succ: Node | null = null;
    public pred: Node | null = null;
    public name: string = '';
    public size: number = 0;

    constructor(name: string = '', size: number = 0) {
        this.name = name;
        this.size = size;
    }
}

export class List {
    public head: Node | null = null;
    public tail: Node | null = null;
    public tpred: Node | null = null;
    public size: number = 0;

    constructor() {
        // Initialize empty list
        this.head = null;
        this.tail = null;
        this.tpred = null;
        this.size = 0;
    }

    /**
     * Check if list is empty
     */
    isEmpty(): boolean {
        return this.tpred === null;
    }

    /**
     * Add node to the tail of the list
     */
    addTail(node: Node): Node {
        if (this.isEmpty()) {
            this.head = node;
            this.tail = node;
            this.tpred = node;
            node.pred = null;
            node.succ = null;
        } else {
            node.pred = this.tpred;
            node.succ = null;
            if (this.tpred) {
                this.tpred.succ = node;
            }
            this.tpred = node;
            this.tail = node;
        }
        this.size++;
        return node;
    }

    /**
     * Add node to the head of the list
     */
    addHead(node: Node): Node {
        if (this.isEmpty()) {
            this.head = node;
            this.tail = node;
            this.tpred = node;
            node.pred = null;
            node.succ = null;
        } else {
            node.succ = this.head;
            node.pred = null;
            if (this.head) {
                this.head.pred = node;
            }
            this.head = node;
        }
        this.size++;
        return node;
    }

    /**
     * Remove node from the list
     */
    remove(node: Node): Node | null {
        if (node.pred) {
            node.pred.succ = node.succ;
        } else {
            this.head = node.succ;
        }

        if (node.succ) {
            node.succ.pred = node.pred;
        } else {
            this.tpred = node.pred;
            this.tail = node.pred;
        }

        this.size--;
        return node;
    }

    /**
     * Remove head node from the list
     */
    removeHead(): Node | null {
        if (this.isEmpty()) {
            return null;
        }
        const node = this.head;
        if (node) {
            this.remove(node);
        }
        return node;
    }

    /**
     * Remove tail node from the list
     */
    removeTail(): Node | null {
        if (this.isEmpty()) {
            return null;
        }
        const node = this.tpred;
        if (node) {
            this.remove(node);
        }
        return node;
    }

    /**
     * Get node by name
     */
    getNode(name: string): Node | null {
        let node = this.head;
        while (node) {
            if (node.name === name) {
                return node;
            }
            node = node.succ;
        }
        return null;
    }

    /**
     * Get nth node (0-indexed)
     */
    getNthNode(nth: number): Node | null {
        let node = this.head;
        let count = 0;
        while (node && count < nth) {
            node = node.succ;
            count++;
        }
        return node;
    }

    /**
     * Get number of nodes in the list
     */
    getCount(): number {
        return this.size;
    }

    /**
     * Get node number by address
     */
    getNodeNr(node: Node): number {
        let current = this.head;
        let count = 0;
        while (current) {
            if (current === node) {
                return count;
            }
            current = current.succ;
            count++;
        }
        return -1;
    }

    /**
     * Get node number by name
     */
    getNodeNrByName(name: string): number {
        let current = this.head;
        let count = 0;
        while (current) {
            if (current.name === name) {
                return count;
            }
            current = current.succ;
            count++;
        }
        return -1;
    }

    /**
     * Iterate over all nodes and call a function for each
     */
    forEach(callback: (node: Node) => void): void {
        let node = this.head;
        while (node) {
            callback(node);
            node = node.succ;
        }
    }

    /**
     * Clear all nodes from the list
     */
    clear(): void {
        this.head = null;
        this.tail = null;
        this.tpred = null;
        this.size = 0;
    }
}
