import * as THREE from 'three';

/**
 * Quadtree implementation for spatial partitioning
 */

export type Boundary = { 
    x: number; 
    y: number; 
    width: number; 
    height: number 
};

export interface QuadPoint<T> {
    x: number;
    y: number;
    data: T;
}

export interface GeometryCache {
  geometry: THREE.BufferGeometry;
  lastUsed: number;
}

export interface ColorCache {
  colors: Float32Array;
  lastUsed: number;
}

export interface HeightCache {
  heights: Float32Array;
  lastUsed: number;
}

export class BiomeCache {
    private cache: Map<string, { value: string; lastAccess: number }> = new Map();
    private cellSize: number;
    private terrainWidth: number;
    private terrainHeight: number;
    private offset: THREE.Vector3;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(cellSize: number, terrainWidth: number, terrainHeight: number, offset: THREE.Vector3) {
        this.cellSize = cellSize;
        this.terrainWidth = terrainWidth;
        this.terrainHeight = terrainHeight;
        this.offset = offset;
    }

    getCellKey(worldX: number, worldZ: number): string {
        const cellX = Math.floor((worldX - this.offset.x) / this.cellSize);
        const cellZ = Math.floor((worldZ - this.offset.z) / this.cellSize);
        return `${cellX},${cellZ}`;
    }

    getBiome(worldX: number, worldZ: number, biomeLookup: (x: number, z: number) => string): string {
        const key = this.getCellKey(worldX, worldZ);
        const now = Date.now();
        
        if (!this.cache.has(key)) {
            // Sample biome at the center of the cell for better accuracy
            const cellCenterX = (Math.floor((worldX - this.offset.x) / this.cellSize) * this.cellSize) + 
                               (this.cellSize / 2) + this.offset.x;
            const cellCenterZ = (Math.floor((worldZ - this.offset.z) / this.cellSize) * this.cellSize) + 
                               (this.cellSize / 2) + this.offset.z;
            
            const value = biomeLookup(cellCenterX, cellCenterZ);
            this.cache.set(key, { value, lastAccess: now });
            return value;
        }
        
        const entry = this.cache.get(key)!;
        entry.lastAccess = now; // Update last access time
        return entry.value;
    }

    clear(): void {
        this.cache.clear();
    }
    
    cleanupOldEntries(maxAgeMs: number = 60000): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.lastAccess > maxAgeMs) {
                this.cache.delete(key);
            }
        }
    }
    
    startCleanupInterval(intervalMs: number = 60000): void {
        // Clear any existing interval
        this.stopCleanupInterval();
        
        // Start new interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldEntries(intervalMs);
        }, intervalMs);
    }
    
    stopCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

export class Quadtree<T> {
    boundary: Boundary;
    capacity: number;
    points: QuadPoint<T>[];
    divided: boolean;
    northeast: Quadtree<T> | null;
    northwest: Quadtree<T> | null;
    southeast: Quadtree<T> | null;
    southwest: Quadtree<T> | null;

    constructor(boundary: Boundary, capacity: number) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }

    contains(x: number, y: number): boolean {
        return (
            x >= this.boundary.x &&
            x < this.boundary.x + this.boundary.width &&
            y >= this.boundary.y &&
            y < this.boundary.y + this.boundary.height
        );
    }

    intersects(range: Boundary): boolean {
        return !(
            range.x > this.boundary.x + this.boundary.width ||
            range.x + range.width < this.boundary.x ||
            range.y > this.boundary.y + this.boundary.height ||
            range.y + range.height < this.boundary.y
        );
    }

    subdivide() {
        const { x, y, width, height } = this.boundary;
        const halfW = width / 2;
        const halfH = height / 2;
        this.northeast = new Quadtree({ x: x + halfW, y: y, width: halfW, height: halfH }, this.capacity);
        this.northwest = new Quadtree({ x: x, y: y, width: halfW, height: halfH }, this.capacity);
        this.southeast = new Quadtree({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, this.capacity);
        this.southwest = new Quadtree({ x: x, y: y + halfH, width: halfW, height: halfH }, this.capacity);
        this.divided = true;
    }

    insert(point: QuadPoint<T>): boolean {
        if (!this.contains(point.x, point.y)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }


        if (!this.divided) {
            this.subdivide();
        }
        return (
            this.northeast!.insert(point) ||
            this.northwest!.insert(point) ||
            this.southeast!.insert(point) ||
            this.southwest!.insert(point)
        );
    }

    query(range: Boundary, found: QuadPoint<T>[] = []): QuadPoint<T>[] {
        if (!this.intersects(range)) {
            return found;
        }

        for (const p of this.points) {
            if (
                p.x >= range.x &&
                p.x < range.x + range.width &&
                p.y >= range.y &&
                p.y < range.y + range.height
            ) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northeast!.query(range, found);
            this.northwest!.query(range, found);
            this.southeast!.query(range, found);
            this.southwest!.query(range, found);
        }

        return found;
    }
}
