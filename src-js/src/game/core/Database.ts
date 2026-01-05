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

    /**
     * Remove all relations of a specific type
     * Port of RemRelation() from C
     */
    removeAllRelationsOfType(type: RelationType): void {
        this.relations = this.relations.filter(rel => rel.type !== type);
    }

    /**
     * Add a relation type (placeholder for C's AddRelation)
     * In the C code, this initializes a relation type
     */
    addRelationType(type: RelationType): void {
        // In TypeScript, relation types are just numbers
        // This is a no-op but kept for API compatibility
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

    /**
     * Get all objects of a specific type that have a relation with the given object
     * Port of hasAll() from C
     * 
     * @param ownerId - Owner object ID
     * @param relationType - Type of relation (e.g., Has, Knows)
     * @param objectType - Type of objects to find
     * @returns Array of objects
     */
    getRelatedObjects(
        ownerId: ObjectId,
        relationType: RelationType,
        objectType?: ObjectType
    ): GameObject[] {
        const relatedIds = this.getRelations(ownerId, relationType)
            .map(rel => rel.rightId);
        
        const objects = relatedIds
            .map(id => this.getObject(id))
            .filter((obj): obj is GameObject => obj !== undefined);

        if (objectType !== undefined) {
            return objects.filter(obj => obj.type === objectType);
        }

        return objects;
    }

    /**
     * Get all objects that owner "has"
     * Convenience wrapper for getRelatedObjects with Has relation
     */
    hasAll(ownerId: ObjectId, objectType?: ObjectType): GameObject[] {
        return this.getRelatedObjects(ownerId, RelationType.Has, objectType);
    }

    /**
     * Get all objects that person "knows"
     * Convenience wrapper for getRelatedObjects with Knows relation
     */
    knowsAll(personId: ObjectId, objectType?: ObjectType): GameObject[] {
        return this.getRelatedObjects(personId, RelationType.Knows, objectType);
    }

    /**
     * Check if person lives in location
     * Port of livesIn() from C
     */
    livesIn(locationId: ObjectId, personId: ObjectId): boolean {
        return this.hasRelation(personId, locationId, RelationType.LivesIn);
    }

    /**
     * Get object by name
     * Useful for looking up objects by their name
     */
    getObjectByName(name: string): GameObject | undefined {
        return Array.from(this.objects.values()).find(obj => obj.name === name);
    }

    /**
     * Get objects by name pattern (case-insensitive)
     */
    getObjectsByNamePattern(pattern: string): GameObject[] {
        const lowerPattern = pattern.toLowerCase();
        return Array.from(this.objects.values())
            .filter(obj => obj.name.toLowerCase().includes(lowerPattern));
    }

    /**
     * Sort objects by name (for display lists)
     */
    sortObjectsByName(objects: GameObject[]): GameObject[] {
        return [...objects].sort((a, b) => a.name.localeCompare(b.name));
    }
}

export const db = new Database();
