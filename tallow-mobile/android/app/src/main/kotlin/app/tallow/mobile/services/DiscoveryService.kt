package app.tallow.mobile.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import app.tallow.mobile.R
import app.tallow.mobile.TallowApplication

/**
 * Foreground service for mDNS discovery
 * Keeps discovery running when app is in background
 */
class DiscoveryService : Service() {

    private lateinit var nsdManager: NsdManager
    private var registrationListener: NsdManager.RegistrationListener? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var isRegistered = false
    private var isDiscovering = false

    override fun onCreate() {
        super.onCreate()
        nsdManager = getSystemService(Context.NSD_SERVICE) as NsdManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForegroundService()
                startServiceRegistration()
                startServiceDiscovery()
            }
            ACTION_STOP -> {
                stopServiceDiscovery()
                stopServiceRegistration()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundService() {
        val notification = NotificationCompat.Builder(this, TallowApplication.DISCOVERY_CHANNEL_ID)
            .setContentTitle("Tallow")
            .setContentText("Discovering devices on local network")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun startServiceRegistration() {
        if (isRegistered) return

        val serviceInfo = NsdServiceInfo().apply {
            serviceName = "Tallow-${Build.MODEL}"
            serviceType = SERVICE_TYPE
            port = SERVICE_PORT
        }

        registrationListener = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(info: NsdServiceInfo) {
                Log.i(TAG, "Service registered: ${info.serviceName}")
                isRegistered = true
            }

            override fun onRegistrationFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.e(TAG, "Registration failed: $errorCode")
            }

            override fun onServiceUnregistered(info: NsdServiceInfo) {
                Log.i(TAG, "Service unregistered")
                isRegistered = false
            }

            override fun onUnregistrationFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.e(TAG, "Unregistration failed: $errorCode")
            }
        }

        try {
            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register service", e)
        }
    }

    private fun stopServiceRegistration() {
        if (!isRegistered) return

        try {
            registrationListener?.let { nsdManager.unregisterService(it) }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unregister service", e)
        }
    }

    private fun startServiceDiscovery() {
        if (isDiscovering) return

        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery start failed: $errorCode")
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery stop failed: $errorCode")
            }

            override fun onDiscoveryStarted(serviceType: String) {
                Log.i(TAG, "Discovery started")
                isDiscovering = true
            }

            override fun onDiscoveryStopped(serviceType: String) {
                Log.i(TAG, "Discovery stopped")
                isDiscovering = false
            }

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                Log.d(TAG, "Service found: ${serviceInfo.serviceName}")
                resolveService(serviceInfo)
            }

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {
                Log.d(TAG, "Service lost: ${serviceInfo.serviceName}")
                // Notify Flutter about lost service
            }
        }

        try {
            nsdManager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start discovery", e)
        }
    }

    private fun stopServiceDiscovery() {
        if (!isDiscovering) return

        try {
            discoveryListener?.let { nsdManager.stopServiceDiscovery(it) }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop discovery", e)
        }
    }

    private fun resolveService(serviceInfo: NsdServiceInfo) {
        nsdManager.resolveService(serviceInfo, object : NsdManager.ResolveListener {
            override fun onResolveFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.e(TAG, "Resolve failed: $errorCode")
            }

            override fun onServiceResolved(info: NsdServiceInfo) {
                Log.i(TAG, "Resolved: ${info.serviceName} at ${info.host}:${info.port}")
                // Send to Flutter via method channel
            }
        })
    }

    override fun onDestroy() {
        stopServiceDiscovery()
        stopServiceRegistration()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "DiscoveryService"
        private const val NOTIFICATION_ID = 42002
        private const val SERVICE_TYPE = "_tallow._tcp."
        private const val SERVICE_PORT = 42000

        const val ACTION_START = "app.tallow.mobile.action.START_DISCOVERY"
        const val ACTION_STOP = "app.tallow.mobile.action.STOP_DISCOVERY"

        fun start(context: Context) {
            val intent = Intent(context, DiscoveryService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, DiscoveryService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
