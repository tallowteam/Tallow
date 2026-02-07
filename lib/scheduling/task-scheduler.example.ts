/**
 * Background Task Scheduler - Usage Examples
 *
 * Demonstrates how to use the task scheduler in your application.
 */

import {
  scheduleTask,
  cancelTask,
  getQueuedTasks,
  getAllTasks,
  clearCompletedTasks,
  getSchedulerStats,
  setMaxConcurrent,
  pause,
  resume,
} from './task-scheduler';

// ============================================================================
// EXAMPLE 1: Schedule a Low-Priority Task
// ============================================================================

/**
 * Schedule a cleanup task to run in 5 minutes
 */
export function example1_LowPriorityTask() {
  const taskId = scheduleTask({
    id: 'cleanup-temp-files',
    callback: async () => {
      console.log('Cleaning up temporary files...');
      // Simulate cleanup work
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Cleanup complete!');
    },
    runAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    priority: 'low',
  });

  console.log('Scheduled cleanup task:', taskId);
}

// ============================================================================
// EXAMPLE 2: Schedule a High-Priority Task
// ============================================================================

/**
 * Schedule an important task to run immediately
 */
export function example2_HighPriorityTask() {
  scheduleTask({
    id: 'sync-critical-data',
    callback: async () => {
      console.log('Syncing critical data...');
      // Simulate API call
      await fetch('/api/sync', { method: 'POST' });
    },
    runAt: new Date(), // Run immediately
    priority: 'high',
  });
}

// ============================================================================
// EXAMPLE 3: Schedule Multiple Tasks
// ============================================================================

/**
 * Schedule a series of tasks with different priorities
 */
export function example3_MultipleTasks() {
  const now = Date.now();

  // High priority - run in 10 seconds
  scheduleTask({
    id: 'notification-check',
    callback: async () => {
      console.log('Checking notifications...');
    },
    runAt: new Date(now + 10_000),
    priority: 'high',
  });

  // Normal priority - run in 1 minute
  scheduleTask({
    id: 'cache-refresh',
    callback: async () => {
      console.log('Refreshing cache...');
    },
    runAt: new Date(now + 60_000),
    priority: 'normal',
  });

  // Low priority - run in 5 minutes
  scheduleTask({
    id: 'analytics-report',
    callback: async () => {
      console.log('Generating analytics...');
    },
    runAt: new Date(now + 5 * 60_000),
    priority: 'low',
  });
}

// ============================================================================
// EXAMPLE 4: Cancel a Task
// ============================================================================

/**
 * Schedule and then cancel a task
 */
export function example4_CancelTask() {
  // Schedule task
  const taskId = scheduleTask({
    id: 'deferred-action',
    callback: async () => {
      console.log('This will never run');
    },
    runAt: new Date(Date.now() + 60_000),
    priority: 'normal',
  });

  // Cancel it
  setTimeout(() => {
    const cancelled = cancelTask(taskId);
    console.log('Task cancelled:', cancelled);
  }, 5000);
}

// ============================================================================
// EXAMPLE 5: Monitor Queue
// ============================================================================

/**
 * Check queued tasks
 */
export function example5_MonitorQueue() {
  const queued = getQueuedTasks();
  console.log(`${queued.length} tasks in queue:`);

  queued.forEach((task) => {
    const timeUntilRun = task.runAt.getTime() - Date.now();
    console.log(`- ${task.id}: runs in ${Math.round(timeUntilRun / 1000)}s`);
  });
}

// ============================================================================
// EXAMPLE 6: Scheduler Statistics
// ============================================================================

/**
 * Get scheduler statistics
 */
export function example6_Statistics() {
  const stats = getSchedulerStats();

  console.log('Scheduler Statistics:');
  console.log('  Total tasks:', stats.totalTasks);
  console.log('  Queued:', stats.queuedTasks);
  console.log('  Running:', stats.runningTasks);
  console.log('  Completed:', stats.completedTasks);
  console.log('  Failed:', stats.failedTasks);
  console.log('  Page visible:', stats.isVisible);
  console.log('  Paused:', stats.isPaused);
}

// ============================================================================
// EXAMPLE 7: Cleanup Completed Tasks
// ============================================================================

/**
 * Periodically clean up completed tasks
 */
export function example7_PeriodicCleanup() {
  setInterval(() => {
    const removed = clearCompletedTasks();
    if (removed > 0) {
      console.log(`Cleaned up ${removed} completed tasks`);
    }
  }, 60_000); // Every minute
}

// ============================================================================
// EXAMPLE 8: React Component Integration
// ============================================================================

/**
 * Example React hook for task scheduling
 */
export function useTaskScheduler() {
  // In a real React component:
  // useEffect(() => {
  //   // Schedule recurring task
  //   const taskId = scheduleTask({
  //     id: 'component-task',
  //     callback: async () => {
  //       console.log('Component task running');
  //     },
  //     runAt: new Date(Date.now() + 30_000),
  //     priority: 'normal',
  //   });
  //
  //   return () => {
  //     // Cancel on unmount
  //     cancelTask(taskId);
  //   };
  // }, []);
}

// ============================================================================
// EXAMPLE 9: Page Visibility Integration
// ============================================================================

/**
 * Tasks automatically pause when page is hidden
 */
export function example9_VisibilityAware() {
  // This task will pause if user switches tabs
  scheduleTask({
    id: 'visibility-aware-task',
    callback: async () => {
      console.log('This only runs when page is visible');
    },
    runAt: new Date(Date.now() + 60_000),
    priority: 'normal',
  });

  // You can also manually pause/resume
  setTimeout(() => {
    pause();
    console.log('Manually paused');
  }, 10_000);

  setTimeout(() => {
    resume();
    console.log('Manually resumed');
  }, 20_000);
}

// ============================================================================
// EXAMPLE 10: Concurrent Task Control
// ============================================================================

/**
 * Limit concurrent task execution
 */
export function example10_ConcurrentControl() {
  // Only allow 2 tasks to run simultaneously
  setMaxConcurrent(2);

  // Schedule 5 tasks - they'll be queued
  for (let i = 1; i <= 5; i++) {
    scheduleTask({
      id: `task-${i}`,
      callback: async () => {
        console.log(`Task ${i} starting`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.log(`Task ${i} completed`);
      },
      runAt: new Date(),
      priority: 'normal',
    });
  }

  // Only 2 will run at a time
}

// ============================================================================
// EXAMPLE 11: Error Handling
// ============================================================================

/**
 * Handle task failures
 */
export function example11_ErrorHandling() {
  scheduleTask({
    id: 'failing-task',
    callback: async () => {
      throw new Error('Task failed!');
    },
    runAt: new Date(),
    priority: 'normal',
  });

  // Check task status later
  setTimeout(() => {
    const allTasks = getAllTasks();
    const failedTask = allTasks.find((t) => t.id === 'failing-task');
    if (failedTask?.status === 'failed') {
      console.error('Task failed:', failedTask.error?.message);
    }
  }, 1000);
}

// ============================================================================
// EXAMPLE 12: Recurring Tasks
// ============================================================================

/**
 * Implement a recurring task pattern
 */
export function example12_RecurringTask() {
  function scheduleRecurringTask() {
    scheduleTask({
      id: 'recurring-health-check',
      callback: async () => {
        console.log('Health check running...');
        // Do health check
        await fetch('/api/health');

        // Schedule next run
        scheduleRecurringTask();
      },
      runAt: new Date(Date.now() + 5 * 60_000), // Every 5 minutes
      priority: 'normal',
    });
  }

  // Start the recurring task
  scheduleRecurringTask();
}
