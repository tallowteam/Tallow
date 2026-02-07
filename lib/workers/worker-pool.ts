/**
 * Worker Pool Manager
 * Manages a pool of Web Workers for efficient parallel processing.
 * Provides load balancing, error handling, and automatic worker restart.
 */

interface WorkerTask {
    id: string;
    message: unknown;
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timestamp: number;
}

interface PooledWorker {
    worker: Worker;
    busy: boolean;
    taskCount: number;
    errors: number;
    lastUsed: number;
}

interface WorkerPoolOptions {
    maxRetries?: number;
    taskTimeout?: number;
    strategy?: 'round-robin' | 'least-busy';
}

export class WorkerPool {
    private workers: PooledWorker[] = [];
    private taskQueue: WorkerTask[] = [];
    private pendingTasks = new Map<string, WorkerTask>();
    private currentIndex = 0;
    private workerUrl: string;
    private poolSize: number;
    private options: Required<WorkerPoolOptions>;
    private isTerminated = false;

    constructor(workerUrl: string, poolSize: number, options: WorkerPoolOptions = {}) {
        this.workerUrl = workerUrl;
        this.poolSize = poolSize;
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            taskTimeout: options.taskTimeout ?? 30000,
            strategy: options.strategy ?? 'least-busy'
        };

        this.initialize();
    }

    /**
     * Initialize worker pool
     */
    private initialize(): void {
        for (let i = 0; i < this.poolSize; i++) {
            this.createWorker();
        }
    }

    /**
     * Create a new worker and add it to the pool
     */
    private createWorker(): void {
        try {
            const worker = new Worker(this.workerUrl, { type: 'module' });

            const pooledWorker: PooledWorker = {
                worker,
                busy: false,
                taskCount: 0,
                errors: 0,
                lastUsed: Date.now()
            };

            worker.onmessage = (event: MessageEvent) => {
                this.handleWorkerMessage(pooledWorker, event);
            };

            worker.onerror = (error: ErrorEvent) => {
                this.handleWorkerError(pooledWorker, error);
            };

            this.workers.push(pooledWorker);
        } catch (error) {
            console.error('Failed to create worker:', error);
        }
    }

    /**
     * Handle messages from worker
     */
    private handleWorkerMessage(pooledWorker: PooledWorker, event: MessageEvent): void {
        const { type, id, success, result, error } = event.data;

        // Handle ready signal
        if (type === 'ready') {
            return;
        }

        // Handle progress updates
        if (type === 'progress') {
            // Forward progress to pending task if it has a progress handler
            return;
        }

        // Handle task completion
        const task = this.pendingTasks.get(id);
        if (!task) {
            return;
        }

        this.pendingTasks.delete(id);
        pooledWorker.busy = false;
        pooledWorker.taskCount++;
        pooledWorker.lastUsed = Date.now();

        if (success) {
            task.resolve(result);
        } else {
            task.reject(new Error(error || 'Worker task failed'));
        }

        // Process next task in queue
        this.processQueue();
    }

    /**
     * Handle worker errors
     */
    private handleWorkerError(pooledWorker: PooledWorker, error: ErrorEvent): void {
        console.error('Worker error:', error);

        pooledWorker.errors++;

        // Find and reject all pending tasks for this worker
        for (const [id, task] of this.pendingTasks.entries()) {
            task.reject(new Error(`Worker error: ${error.message}`));
            this.pendingTasks.delete(id);
        }

        pooledWorker.busy = false;

        // Restart worker if error threshold exceeded
        if (pooledWorker.errors >= this.options.maxRetries) {
            this.restartWorker(pooledWorker);
        }
    }

    /**
     * Restart a worker
     */
    private restartWorker(pooledWorker: PooledWorker): void {
        const index = this.workers.indexOf(pooledWorker);
        if (index === -1) {
            return;
        }

        // Terminate old worker
        try {
            pooledWorker.worker.terminate();
        } catch (error) {
            console.error('Failed to terminate worker:', error);
        }

        // Remove from pool
        this.workers.splice(index, 1);

        // Create new worker
        this.createWorker();
    }

    /**
     * Get next available worker using configured strategy
     */
    private getNextWorker(): PooledWorker | null {
        if (this.workers.length === 0) {
            return null;
        }

        if (this.options.strategy === 'round-robin') {
            return this.getRoundRobinWorker();
        } else {
            return this.getLeastBusyWorker();
        }
    }

    /**
     * Get worker using round-robin strategy
     */
    private getRoundRobinWorker(): PooledWorker | null {
        for (let i = 0; i < this.workers.length; i++) {
            this.currentIndex = (this.currentIndex + 1) % this.workers.length;
            const worker = this.workers[this.currentIndex];

            if (!worker.busy) {
                return worker;
            }
        }

        return null;
    }

    /**
     * Get worker using least-busy strategy
     */
    private getLeastBusyWorker(): PooledWorker | null {
        let leastBusy: PooledWorker | null = null;
        let minTaskCount = Infinity;

        for (const worker of this.workers) {
            if (!worker.busy && worker.taskCount < minTaskCount) {
                leastBusy = worker;
                minTaskCount = worker.taskCount;
            }
        }

        return leastBusy;
    }

    /**
     * Process next task in queue
     */
    private processQueue(): void {
        if (this.taskQueue.length === 0 || this.isTerminated) {
            return;
        }

        const worker = this.getNextWorker();
        if (!worker) {
            return;
        }

        const task = this.taskQueue.shift();
        if (!task) {
            return;
        }

        this.executeTask(worker, task);
    }

    /**
     * Execute a task on a worker
     */
    private executeTask(pooledWorker: PooledWorker, task: WorkerTask): void {
        pooledWorker.busy = true;
        this.pendingTasks.set(task.id, task);

        // Set timeout for task
        setTimeout(() => {
            if (this.pendingTasks.has(task.id)) {
                this.pendingTasks.delete(task.id);
                pooledWorker.busy = false;
                task.reject(new Error('Task timeout'));
                this.processQueue();
            }
        }, this.options.taskTimeout);

        // Send task to worker
        pooledWorker.worker.postMessage(task.message);
    }

    /**
     * Execute a task in the worker pool
     * Returns a promise that resolves with the result
     */
    public execute<T = unknown>(message: unknown): Promise<T> {
        if (this.isTerminated) {
            return Promise.reject(new Error('Worker pool has been terminated'));
        }

        return new Promise((resolve, reject) => {
            const task: WorkerTask = {
                id: this.generateTaskId(),
                message,
                resolve: resolve as (value: unknown) => void,
                reject,
                timestamp: Date.now()
            };

            const worker = this.getNextWorker();

            if (worker) {
                this.executeTask(worker, task);
            } else {
                // All workers busy, add to queue
                this.taskQueue.push(task);
            }
        });
    }

    /**
     * Generate unique task ID
     */
    private generateTaskId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get pool statistics
     */
    public getStats(): {
        poolSize: number;
        busyWorkers: number;
        queuedTasks: number;
        totalTasksProcessed: number;
        totalErrors: number;
    } {
        const busyWorkers = this.workers.filter(w => w.busy).length;
        const totalTasksProcessed = this.workers.reduce((sum, w) => sum + w.taskCount, 0);
        const totalErrors = this.workers.reduce((sum, w) => sum + w.errors, 0);

        return {
            poolSize: this.workers.length,
            busyWorkers,
            queuedTasks: this.taskQueue.length,
            totalTasksProcessed,
            totalErrors
        };
    }

    /**
     * Terminate all workers and clean up
     */
    public terminate(): void {
        this.isTerminated = true;

        // Reject all pending tasks
        for (const task of this.pendingTasks.values()) {
            task.reject(new Error('Worker pool terminated'));
        }
        this.pendingTasks.clear();

        // Reject all queued tasks
        for (const task of this.taskQueue) {
            task.reject(new Error('Worker pool terminated'));
        }
        this.taskQueue = [];

        // Terminate all workers
        for (const pooledWorker of this.workers) {
            try {
                pooledWorker.worker.terminate();
            } catch (error) {
                console.error('Failed to terminate worker:', error);
            }
        }

        this.workers = [];
    }
}

/**
 * Create a worker pool
 * Factory function for easier instantiation
 */
export function createWorkerPool(
    workerUrl: string,
    poolSize: number = navigator.hardwareConcurrency || 4,
    options?: WorkerPoolOptions
): WorkerPool {
    return new WorkerPool(workerUrl, poolSize, options);
}
