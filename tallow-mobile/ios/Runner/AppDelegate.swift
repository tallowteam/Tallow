import UIKit
import Flutter
import BackgroundTasks

@main
@objc class AppDelegate: FlutterAppDelegate {

    private var backgroundChannel: FlutterMethodChannel?
    private var deepLinkChannel: FlutterMethodChannel?
    private var pendingLink: String?

    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Register Flutter plugins
        GeneratedPluginRegistrant.register(with: self)

        // Setup method channels
        if let controller = window?.rootViewController as? FlutterViewController {
            setupMethodChannels(controller: controller)
        }

        // Register background tasks
        registerBackgroundTasks()

        // Handle deep link from cold start
        if let url = launchOptions?[.url] as? URL {
            pendingLink = url.absoluteString
        }

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // MARK: - Method Channels

    private func setupMethodChannels(controller: FlutterViewController) {
        // Background transfer channel
        backgroundChannel = FlutterMethodChannel(
            name: "app.tallow.mobile/background_transfer",
            binaryMessenger: controller.binaryMessenger
        )
        backgroundChannel?.setMethodCallHandler(handleBackgroundMethod)

        // Deep link channel
        deepLinkChannel = FlutterMethodChannel(
            name: "app.tallow.mobile/deeplink",
            binaryMessenger: controller.binaryMessenger
        )
        deepLinkChannel?.setMethodCallHandler(handleDeepLinkMethod)
    }

    private func handleBackgroundMethod(call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "scheduleTransfer":
            guard let args = call.arguments as? [String: Any],
                  let transferId = args["transferId"] as? String,
                  let fileName = args["fileName"] as? String,
                  let fileSize = args["fileSize"] as? Int,
                  let peerId = args["peerId"] as? String,
                  let direction = args["direction"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "Invalid arguments", details: nil))
                return
            }

            scheduleBackgroundTransfer(
                transferId: transferId,
                fileName: fileName,
                fileSize: fileSize,
                peerId: peerId,
                direction: direction
            )
            result(transferId)

        case "cancelTransfer":
            guard let args = call.arguments as? [String: Any],
                  let transferId = args["transferId"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "Invalid arguments", details: nil))
                return
            }

            cancelBackgroundTransfer(transferId: transferId)
            result(nil)

        case "getTransferStatus":
            guard let args = call.arguments as? [String: Any],
                  let transferId = args["transferId"] as? String else {
                result(FlutterError(code: "INVALID_ARGS", message: "Invalid arguments", details: nil))
                return
            }

            let status = getTransferStatus(transferId: transferId)
            result(status)

        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func handleDeepLinkMethod(call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "getInitialLink":
            result(pendingLink)
            pendingLink = nil
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        // Register background processing task
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "app.tallow.mobile.transfer",
            using: nil
        ) { task in
            self.handleBackgroundTransferTask(task: task as! BGProcessingTask)
        }

        // Register background refresh task
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "app.tallow.mobile.refresh",
            using: nil
        ) { task in
            self.handleBackgroundRefreshTask(task: task as! BGAppRefreshTask)
        }
    }

    private func scheduleBackgroundTransfer(
        transferId: String,
        fileName: String,
        fileSize: Int,
        peerId: String,
        direction: String
    ) {
        let request = BGProcessingTaskRequest(identifier: "app.tallow.mobile.transfer")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false

        // Store transfer info in UserDefaults for background task
        let transferInfo: [String: Any] = [
            "transferId": transferId,
            "fileName": fileName,
            "fileSize": fileSize,
            "peerId": peerId,
            "direction": direction
        ]
        UserDefaults.standard.set(transferInfo, forKey: "pendingTransfer_\(transferId)")

        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background transfer scheduled: \(transferId)")
        } catch {
            print("Failed to schedule background transfer: \(error)")
        }
    }

    private func cancelBackgroundTransfer(transferId: String) {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: "app.tallow.mobile.transfer")
        UserDefaults.standard.removeObject(forKey: "pendingTransfer_\(transferId)")
    }

    private func getTransferStatus(transferId: String) -> [String: Any]? {
        // Check if transfer is pending
        if let info = UserDefaults.standard.dictionary(forKey: "pendingTransfer_\(transferId)") {
            return [
                "transferId": transferId,
                "state": "enqueued",
                "progress": 0.0
            ]
        }
        return nil
    }

    private func handleBackgroundTransferTask(task: BGProcessingTask) {
        // Set expiration handler
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        // Find pending transfer
        let keys = UserDefaults.standard.dictionaryRepresentation().keys.filter { $0.hasPrefix("pendingTransfer_") }

        guard let firstKey = keys.first,
              let transferInfo = UserDefaults.standard.dictionary(forKey: firstKey) else {
            task.setTaskCompleted(success: true)
            return
        }

        // Execute transfer (actual WebRTC logic is in Dart)
        // This just ensures the app stays alive
        DispatchQueue.main.async {
            self.backgroundChannel?.invokeMethod("onBackgroundTransferStarted", arguments: transferInfo)
        }

        // Mark complete after timeout (actual completion is handled by Dart)
        DispatchQueue.main.asyncAfter(deadline: .now() + 25) {
            task.setTaskCompleted(success: true)
        }
    }

    private func handleBackgroundRefreshTask(task: BGAppRefreshTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        // Schedule next refresh
        scheduleBackgroundRefresh()

        task.setTaskCompleted(success: true)
    }

    private func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "app.tallow.mobile.refresh")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background refresh: \(error)")
        }
    }

    // MARK: - Deep Links

    override func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        deepLinkChannel?.invokeMethod("onDeepLink", arguments: url.absoluteString)
        return true
    }

    override func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            deepLinkChannel?.invokeMethod("onDeepLink", arguments: url.absoluteString)
            return true
        }
        return false
    }

    // MARK: - Local Network

    override func applicationDidBecomeActive(_ application: UIApplication) {
        super.applicationDidBecomeActive(application)
        // Trigger local network permission prompt if needed
        triggerLocalNetworkPermission()
    }

    private func triggerLocalNetworkPermission() {
        // This triggers the local network permission dialog on iOS 14+
        let endpoint = NWEndpoint.hostPort(host: "255.255.255.255", port: 42000)
        let connection = NWConnection(to: endpoint, using: .udp)
        connection.start(queue: .global())
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            connection.cancel()
        }
    }
}

// MARK: - Network Framework Import
import Network
