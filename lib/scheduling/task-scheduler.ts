/**
 * Background Task Scheduler
 *
 * Manages scheduled tasks with priority levels and page visibility awareness.
 *
 * Features:
 * - Priority-based task scheduling (low, normal, high)
 * - Respects page visibility (pauses when hidden)
 * - Concurrent task limiting (max 3 simultaneous)
 * - Uses requestIdleCallback for low-priority tasks
 * - setTimeout for normal/high priority tasks
 *
 * @module scheduling/task-scheduler
 */

import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  callback: () => Promise<void>;
  runAt: Date;
  priority: TaskPriority;
}

export interface ScheduledTask extends Task {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: number;
  startedAt: number | null;
  completedAt: number | null;
  error: Error | null;
  timeoutId: NodeJS.Timeout | number | null;
}

interface SchedulerState {
  tasks: Map<string, ScheduledTask>;
  runningTasks: Set<string>;
  maxConcurrent: number;
  isPaused: boolean;
  isVisible: boolean;
}

// ============================================================================
// STATE
// ============================================================================

const state: SchedulerState = {
  tasks: new Map(),
  runningTasks: new Set(),
  maxConcurrent: 3,
  isPaused: false,
  isVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Execute a task and update its status
 */
async function executeTask(taskId: string): Promise<void> {
  const task = state.tasks.get(taskId);
  if (!task || task.status !== 'queued') {
    return;
  }

  // Mark as running
  task.status = 'running';
  task.startedAt = Date.now();
  state.runningTasks.add(taskId);

  secureLog.log(`[Scheduler] Executing task: ${taskId} (priority: ${task.priority})`);

  try {
    await task.callback();
    task.status = 'completed';
    task.completedAt = Date.now();
    secureLog.log(`[Scheduler] Task completed: ${taskId}`);
  } catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error : new Error(String(error));
    task.completedAt = Date.now();
    secureLog.error(`[Scheduler] Task failed: ${taskId}`, error);
  } finally {
    state.runningTasks.delete(taskId);
    // Try to run next task
    processQueue();
  }
}

/**
 * Schedule a task using appropriate mechanism based on priority
 */
function scheduleTaskExecution(task: ScheduledTask): void {
  const delay = Math.max(0, task.runAt.getTime() - Date.now());

  if (task.priority === 'low') {
    // Use requestIdleCallback for low priority tasks
    if (typeof requestIdleCallback !== 'undefined') {
      const idleCallbackId = requestIdleCallback(
        () => {
          if (delay > 0) {
            // Still need to wait, schedule with setTimeout
            task.timeoutId = setTimeout(() => {
              executeTask(task.id).catch((err) => {
                secureLog.error('[Scheduler] Task execution error:', err);
              });
            }, delay);
          } else {
            executeTask(task.id).catch((err) => {
              secureLog.error('[Scheduler] Task execution error:', err);
            });
          }
        },
        { timeout: delay > 0 ? delay : 1000 }
      );
      task.timeoutId = idleCallbackId;
    } else {
      // Fallback to setTimeout if requestIdleCallback not available
      task.timeoutId = setTimeout(() => {
        executeTask(task.id).catch((err) => {
          secureLog.error('[Scheduler] Task execution error:', err);
        });
      }, delay);
    }
  } else {
    // Use setTimeout for normal/high priority
    task.timeoutId = setTimeout(() => {
      executeTask(task.id).catch((err) => {
        secureLog.error('[Scheduler] Task execution error:', err);
      });
    }, delay);
  }

  secureLog.log(
    `[Scheduler] Scheduled task: ${task.id} (priority: ${task.priority}, delay: ${delay}ms)`
  );
}

/**
 * Process the task queue and run eligible tasks
 */
function processQueue(): void {
  // Don't process if paused or tab is hidden
  if (state.isPaused || !state.isVisible) {
    return;
  }

  // Don't exceed max concurrent tasks
  if (state.runningTasks.size >= state.maxConcurrent) {
    return;
  }

  // Get queued tasks sorted by priority and run time
  const queuedTasks = Array.from(state.tasks.values())
    .filter((task) => task.status === 'queued')
    .sort((a, b) => {
      // Sort by priority first (high > normal > low)
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // Then by run time (earlier first)
      return a.runAt.getTime() - b.runAt.getTime();
    });

  // Schedule tasks up to concurrent limit
  const slotsAvailable = state.maxConcurrent - state.runningTasks.size;
  const tasksToSchedule = queuedTasks.slice(0, slotsAvailable);

  tasksToSchedule.forEach((task) => {
    // Only schedule if not already scheduled
    if (task.timeoutId === null) {
      scheduleTaskExecution(task);
    }
  });
}

/**
 * Pause all scheduled tasks
 */
function pauseTasks(): void {
  secureLog.log('[Scheduler] Pausing tasks');
  state.isPaused = true;

  // Cancel all pending timeouts
  state.tasks.forEach((task) => {
    if (task.timeoutId !== null && task.status === 'queued') {
      if (typeof cancelIdleCallback !== 'undefined' && task.priority === 'low') {
        cancelIdleCallback(task.timeoutId as number);
      } else {
        clearTimeout(task.timeoutId as NodeJS.Timeout);
      }
      task.timeoutId = null;
    }
  });
}

/**
 * Resume all scheduled tasks
 */
function resumeTasks(): void {
  secureLog.log('[Scheduler] Resuming tasks');
  state.isPaused = false;
  processQueue();
}

// ============================================================================
// PAGE VISIBILITY HANDLING
// ============================================================================

function handleVisibilityChange(): void {
  const isVisible = document.visibilityState === 'visible';
  const wasVisible = state.isVisible;
  state.isVisible = isVisible;

  if (isVisible && !wasVisible) {
    secureLog.log('[Scheduler] Page became visible - resuming tasks');
    resumeTasks();
  } else if (!isVisible && wasVisible) {
    secureLog.log('[Scheduler] Page became hidden - pausing tasks');
    pauseTasks();
  }
}

// Setup visibility listener (browser only)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Schedule a task for execution
 *
 * @param task - Task configuration
 * @returns Task ID for tracking/cancellation
 *
 * @example
 * ```ts
 * const taskId = scheduleTask({
 *   id: 'cleanup-old-files',
 *   callback: async () => {
 *     await cleanupOldFiles();
 *   },
 *   runAt: new Date(Date.now() + 60000), // Run in 1 minute
 *   priority: 'low'
 * });
 * ```
 */
export function scheduleTask(task: Task): string {
  // Validate task
  if (!task.id || !task.callback || !task.runAt || !task.priority) {
    throw new Error('[Scheduler] Invalid task configuration');
  }

  // Check if task already exists
  if (state.tasks.has(task.id)) {
    secureLog.warn(`[Scheduler] Task ${task.id} already exists, replacing`);
    cancelTask(task.id);
  }

  // Create scheduled task
  const scheduledTask: ScheduledTask = {
    ...task,
    status: 'queued',
    scheduledAt: Date.now(),
    startedAt: null,
    completedAt: null,
    error: null,
    timeoutId: null,
  };

  state.tasks.set(task.id, scheduledTask);
  secureLog.log(`[Scheduler] Added task: ${task.id}`);

  // Process queue to potentially execute this task
  processQueue();

  return task.id;
}

/**
 * Cancel a scheduled task
 *
 * @param taskId - ID of task to cancel
 * @returns True if task was cancelled, false if not found or already running/completed
 *
 * @example
 * ```ts
 * cancelTask('cleanup-old-files');
 * ```
 */
export function cancelTask(taskId: string): boolean {
  const task = state.tasks.get(taskId);
  if (!task) {
    return false;
  }

  // Can't cancel running or completed tasks
  if (task.status !== 'queued') {
    return false;
  }

  // Cancel timeout
  if (task.timeoutId !== null) {
    if (typeof cancelIdleCallback !== 'undefined' && task.priority === 'low') {
      cancelIdleCallback(task.timeoutId as number);
    } else {
      clearTimeout(task.timeoutId as NodeJS.Timeout);
    }
  }

  task.status = 'cancelled';
  task.completedAt = Date.now();
  secureLog.log(`[Scheduler] Cancelled task: ${taskId}`);

  return true;
}

/**
 * Get all queued tasks
 *
 * @returns Array of pending tasks
 *
 * @example
 * ```ts
 * const pending = getQueuedTasks();
 * console.log(`${pending.length} tasks in queue`);
 * ```
 */
export function getQueuedTasks(): ScheduledTask[] {
  return Array.from(state.tasks.values())
    .filter((task) => task.status === 'queued')
    .sort((a, b) => a.runAt.getTime() - b.runAt.getTime());
}

/**
 * Get all tasks (any status)
 *
 * @returns Array of all tasks
 */
export function getAllTasks(): ScheduledTask[] {
  return Array.from(state.tasks.values());
}

/**
 * Get task by ID
 *
 * @param taskId - Task identifier
 * @returns Task if found, undefined otherwise
 */
export function getTask(taskId: string): ScheduledTask | undefined {
  return state.tasks.get(taskId);
}

/**
 * Clear completed and cancelled tasks
 *
 * @returns Number of tasks removed
 *
 * @example
 * ```ts
 * const removed = clearCompletedTasks();
 * console.log(`Cleared ${removed} completed tasks`);
 * ```
 */
export function clearCompletedTasks(): number {
  let removed = 0;
  state.tasks.forEach((task, id) => {
    if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'failed') {
      state.tasks.delete(id);
      removed++;
    }
  });
  secureLog.log(`[Scheduler] Cleared ${removed} completed tasks`);
  return removed;
}

/**
 * Get scheduler statistics
 *
 * @returns Current scheduler state and metrics
 */
export function getSchedulerStats(): {
  totalTasks: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  isPaused: boolean;
  isVisible: boolean;
  maxConcurrent: number;
} {
  const tasks = Array.from(state.tasks.values());
  return {
    totalTasks: tasks.length,
    queuedTasks: tasks.filter((t) => t.status === 'queued').length,
    runningTasks: state.runningTasks.size,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    failedTasks: tasks.filter((t) => t.status === 'failed').length,
    cancelledTasks: tasks.filter((t) => t.status === 'cancelled').length,
    isPaused: state.isPaused,
    isVisible: state.isVisible,
    maxConcurrent: state.maxConcurrent,
  };
}

/**
 * Set maximum concurrent tasks
 *
 * @param max - Maximum number of concurrent tasks (1-10)
 */
export function setMaxConcurrent(max: number): void {
  if (max < 1 || max > 10) {
    throw new Error('[Scheduler] Max concurrent must be between 1 and 10');
  }
  state.maxConcurrent = max;
  secureLog.log(`[Scheduler] Max concurrent set to ${max}`);
  processQueue();
}

/**
 * Manually pause task execution
 */
export function pause(): void {
  pauseTasks();
}

/**
 * Manually resume task execution
 */
export function resume(): void {
  resumeTasks();
}

// ============================================================================
// CLEANUP
// ============================================================================

// Auto-cleanup on module unload (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Cancel all pending tasks
    state.tasks.forEach((task) => {
      if (task.status === 'queued' && task.timeoutId !== null) {
        if (typeof cancelIdleCallback !== 'undefined' && task.priority === 'low') {
          cancelIdleCallback(task.timeoutId as number);
        } else {
          clearTimeout(task.timeoutId as NodeJS.Timeout);
        }
      }
    });
    state.tasks.clear();
    secureLog.log('[Scheduler] Cleaned up on unload');
  });
}
