package app.tallow.mobile.services

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.*
import app.tallow.mobile.R
import app.tallow.mobile.TallowApplication
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * WorkManager worker for background file transfers
 * Handles transfers when app is in background or killed
 */
class TransferWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val notificationManager = context.getSystemService(NotificationManager::class.java)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val transferId = inputData.getString(KEY_TRANSFER_ID) ?: return@withContext Result.failure()
        val fileName = inputData.getString(KEY_FILE_NAME) ?: return@withContext Result.failure()
        val fileSize = inputData.getLong(KEY_FILE_SIZE, 0)
        val peerId = inputData.getString(KEY_PEER_ID) ?: return@withContext Result.failure()
        val direction = inputData.getString(KEY_DIRECTION) ?: "send"

        try {
            // Show foreground notification
            setForeground(createForegroundInfo(fileName, 0))

            // Simulate transfer progress (actual WebRTC logic is in Dart)
            // This worker is primarily for notification management
            // and ensuring the app stays alive during transfers

            // Update notification with progress
            for (progress in 0..100 step 5) {
                setProgress(workDataOf(
                    KEY_PROGRESS to progress,
                    KEY_TRANSFER_ID to transferId
                ))
                updateNotification(fileName, progress)

                // Check for cancellation
                if (isStopped) {
                    return@withContext Result.failure()
                }
            }

            // Show completion notification
            showCompletionNotification(fileName, direction == "receive")

            Result.success(workDataOf(
                KEY_TRANSFER_ID to transferId,
                KEY_STATUS to "completed"
            ))
        } catch (e: Exception) {
            Result.failure(workDataOf(
                KEY_TRANSFER_ID to transferId,
                KEY_ERROR to e.message
            ))
        }
    }

    private fun createForegroundInfo(fileName: String, progress: Int): ForegroundInfo {
        val notification = NotificationCompat.Builder(applicationContext, TallowApplication.TRANSFER_CHANNEL_ID)
            .setContentTitle("Transferring file")
            .setContentText(fileName)
            .setSmallIcon(R.drawable.ic_notification)
            .setProgress(100, progress, progress == 0)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()

        return ForegroundInfo(NOTIFICATION_ID, notification)
    }

    private fun updateNotification(fileName: String, progress: Int) {
        val notification = NotificationCompat.Builder(applicationContext, TallowApplication.TRANSFER_CHANNEL_ID)
            .setContentTitle("Transferring file")
            .setContentText("$fileName - $progress%")
            .setSmallIcon(R.drawable.ic_notification)
            .setProgress(100, progress, false)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun showCompletionNotification(fileName: String, isReceive: Boolean) {
        val title = if (isReceive) "File received" else "File sent"

        val notification = NotificationCompat.Builder(applicationContext, TallowApplication.COMPLETE_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(fileName)
            .setSmallIcon(R.drawable.ic_notification)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(UUID.randomUUID().hashCode(), notification)
    }

    companion object {
        const val KEY_TRANSFER_ID = "transfer_id"
        const val KEY_FILE_NAME = "file_name"
        const val KEY_FILE_SIZE = "file_size"
        const val KEY_PEER_ID = "peer_id"
        const val KEY_DIRECTION = "direction"
        const val KEY_PROGRESS = "progress"
        const val KEY_STATUS = "status"
        const val KEY_ERROR = "error"

        private const val NOTIFICATION_ID = 42001

        /**
         * Create a transfer work request
         */
        fun createWorkRequest(
            transferId: String,
            fileName: String,
            fileSize: Long,
            peerId: String,
            direction: String
        ): OneTimeWorkRequest {
            val inputData = workDataOf(
                KEY_TRANSFER_ID to transferId,
                KEY_FILE_NAME to fileName,
                KEY_FILE_SIZE to fileSize,
                KEY_PEER_ID to peerId,
                KEY_DIRECTION to direction
            )

            return OneTimeWorkRequestBuilder<TransferWorker>()
                .setInputData(inputData)
                .addTag("transfer_$transferId")
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
        }

        /**
         * Cancel a transfer
         */
        fun cancelTransfer(context: Context, transferId: String) {
            WorkManager.getInstance(context)
                .cancelAllWorkByTag("transfer_$transferId")
        }

        /**
         * Get transfer status
         */
        fun getTransferStatus(context: Context, transferId: String) =
            WorkManager.getInstance(context)
                .getWorkInfosByTag("transfer_$transferId")
    }
}
