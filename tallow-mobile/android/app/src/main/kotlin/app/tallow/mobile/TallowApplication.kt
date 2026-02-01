package app.tallow.mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import io.flutter.app.FlutterApplication
import androidx.work.Configuration
import androidx.work.WorkManager

class TallowApplication : FlutterApplication(), Configuration.Provider {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Transfer progress channel
            val transferChannel = NotificationChannel(
                TRANSFER_CHANNEL_ID,
                "File Transfers",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows progress of file transfers"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(transferChannel)

            // Transfer complete channel
            val completeChannel = NotificationChannel(
                COMPLETE_CHANNEL_ID,
                "Transfer Complete",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifies when file transfers complete"
            }
            notificationManager.createNotificationChannel(completeChannel)

            // Discovery channel
            val discoveryChannel = NotificationChannel(
                DISCOVERY_CHANNEL_ID,
                "Device Discovery",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Device discovery service"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(discoveryChannel)
        }
    }

    companion object {
        const val TRANSFER_CHANNEL_ID = "tallow_transfer"
        const val COMPLETE_CHANNEL_ID = "tallow_complete"
        const val DISCOVERY_CHANNEL_ID = "tallow_discovery"
    }
}
