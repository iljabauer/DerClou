/**
 * Game object database - simplified port of database.c
 */

import { GameObject, ObjectId, ObjectType, Relation, RelationType } from '../types/GameTypes';

export class Database {
    private objects: Map<ObjectId, GameObject> = new Map();
    private relations: Relation[] = [];
    private nextId: ObjectId = 1;

    addObject(obj: GameObject): ObjectId {
        if (!obj.id) {
            obj.id = this.nextId++;
        }
        this.objects.set(obj.id, obj);
        return obj.id;
    }

    getObject(id: ObjectId): GameObject | undefined {
        return this.objects.get(id);
    }

    getObjectsByType(type: ObjectType): GameObject[] {
        return Array.from(this.objects.values()).filter(obj => obj.type === type);
    }

    deleteObject(id: ObjectId): void {
        this.objects.delete(id);
        this.relations = this.relations.filter(
            rel => rel.leftId !== id && rel.rightId !== id
        );
    }

    addRelation(leftId: ObjectId, rightId: ObjectId, type: RelationType, parameter: number = 0): void {
        this.relations.push({ leftId, rightId, type, parameter });
    }

    hasRelation(leftId: ObjectId, rightId: ObjectId, type: RelationType): boolean {
        return this.relations.some(
            rel => rel.leftId === leftId && rel.rightId === rightId && rel.type === type
        );
    }

    getRelations(leftId: ObjectId, type: RelationType): Relation[] {
        return this.relations.filter(rel => rel.leftId === leftId && rel.type === type);
    }

    removeRelation(leftId: ObjectId, rightId: ObjectId, type: RelationType): void {
        this.relations = this.relations.filter(
            rel => !(rel.leftId === leftId && rel.rightId === rightId && rel.type === type)
        );
    }

    clear(): void {
        this.objects.clear();
        this.relations = [];
        this.nextId = 1;
    }

    getObjectCount(): number {
        return this.objects.size;
    }

    getRelationCount(): number {
        return this.relations.length;
    }

    getAllObjects(): GameObject[] {
        return Array.from(this.objects.values());
    }

    getAllRelations(): Relation[] {
        return [...this.relations];
    }
}

export const db = new Database();
