import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

/// Share Extension for receiving files from other apps
class ShareViewController: UIViewController {

    private let appGroupId = "group.app.tallow.mobile"

    override func viewDidLoad() {
        super.viewDidLoad()
        handleSharedContent()
    }

    private func handleSharedContent() {
        guard let extensionContext = extensionContext,
              let inputItems = extensionContext.inputItems as? [NSExtensionItem] else {
            completeRequest(success: false)
            return
        }

        var sharedFiles: [[String: Any]] = []
        let group = DispatchGroup()

        for inputItem in inputItems {
            guard let attachments = inputItem.attachments else { continue }

            for attachment in attachments {
                group.enter()
                processAttachment(attachment) { fileInfo in
                    if let info = fileInfo {
                        sharedFiles.append(info)
                    }
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) { [weak self] in
            if !sharedFiles.isEmpty {
                self?.saveSharedFiles(sharedFiles)
                self?.openMainApp()
            }
            self?.completeRequest(success: !sharedFiles.isEmpty)
        }
    }

    private func processAttachment(
        _ attachment: NSItemProvider,
        completion: @escaping ([String: Any]?) -> Void
    ) {
        // Check for file types
        let typeIdentifiers = [
            UTType.data.identifier,
            UTType.item.identifier,
            UTType.content.identifier,
            UTType.image.identifier,
            UTType.movie.identifier,
            UTType.audio.identifier,
            UTType.pdf.identifier,
            UTType.text.identifier,
            UTType.url.identifier
        ]

        for typeIdentifier in typeIdentifiers {
            if attachment.hasItemConformingToTypeIdentifier(typeIdentifier) {
                attachment.loadItem(forTypeIdentifier: typeIdentifier) { [weak self] item, error in
                    guard error == nil else {
                        completion(nil)
                        return
                    }

                    self?.handleLoadedItem(item, typeIdentifier: typeIdentifier, completion: completion)
                }
                return
            }
        }

        completion(nil)
    }

    private func handleLoadedItem(
        _ item: NSSecureCoding?,
        typeIdentifier: String,
        completion: @escaping ([String: Any]?) -> Void
    ) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else {
                completion(nil)
                return
            }

            if let url = item as? URL {
                // File URL
                if let fileInfo = self.copyFileToAppGroup(url: url) {
                    completion(fileInfo)
                } else {
                    completion(nil)
                }
            } else if let image = item as? UIImage {
                // Image data
                if let imageInfo = self.saveImageToAppGroup(image: image) {
                    completion(imageInfo)
                } else {
                    completion(nil)
                }
            } else if let data = item as? Data {
                // Raw data
                if let dataInfo = self.saveDataToAppGroup(data: data, typeIdentifier: typeIdentifier) {
                    completion(dataInfo)
                } else {
                    completion(nil)
                }
            } else if let text = item as? String {
                // Text content (including URLs)
                if typeIdentifier == UTType.url.identifier, let url = URL(string: text) {
                    completion([
                        "type": "url",
                        "url": url.absoluteString
                    ])
                } else {
                    completion([
                        "type": "text",
                        "text": text
                    ])
                }
            } else {
                completion(nil)
            }
        }
    }

    private func copyFileToAppGroup(url: URL) -> [String: Any]? {
        guard let containerUrl = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            return nil
        }

        let sharedDir = containerUrl.appendingPathComponent("shared", isDirectory: true)
        try? FileManager.default.createDirectory(at: sharedDir, withIntermediateDirectories: true)

        let fileName = url.lastPathComponent
        let destUrl = sharedDir.appendingPathComponent(UUID().uuidString + "_" + fileName)

        do {
            _ = url.startAccessingSecurityScopedResource()
            defer { url.stopAccessingSecurityScopedResource() }

            try FileManager.default.copyItem(at: url, to: destUrl)

            let attributes = try FileManager.default.attributesOfItem(atPath: destUrl.path)
            let fileSize = attributes[.size] as? Int ?? 0

            return [
                "type": "file",
                "path": destUrl.path,
                "name": fileName,
                "size": fileSize,
                "mimeType": mimeType(for: url)
            ]
        } catch {
            print("Failed to copy file: \(error)")
            return nil
        }
    }

    private func saveImageToAppGroup(image: UIImage) -> [String: Any]? {
        guard let containerUrl = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ),
              let imageData = image.jpegData(compressionQuality: 0.9) else {
            return nil
        }

        let sharedDir = containerUrl.appendingPathComponent("shared", isDirectory: true)
        try? FileManager.default.createDirectory(at: sharedDir, withIntermediateDirectories: true)

        let fileName = UUID().uuidString + ".jpg"
        let destUrl = sharedDir.appendingPathComponent(fileName)

        do {
            try imageData.write(to: destUrl)

            return [
                "type": "file",
                "path": destUrl.path,
                "name": fileName,
                "size": imageData.count,
                "mimeType": "image/jpeg"
            ]
        } catch {
            print("Failed to save image: \(error)")
            return nil
        }
    }

    private func saveDataToAppGroup(data: Data, typeIdentifier: String) -> [String: Any]? {
        guard let containerUrl = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            return nil
        }

        let sharedDir = containerUrl.appendingPathComponent("shared", isDirectory: true)
        try? FileManager.default.createDirectory(at: sharedDir, withIntermediateDirectories: true)

        let ext = UTType(typeIdentifier)?.preferredFilenameExtension ?? "dat"
        let fileName = UUID().uuidString + "." + ext
        let destUrl = sharedDir.appendingPathComponent(fileName)

        do {
            try data.write(to: destUrl)

            return [
                "type": "file",
                "path": destUrl.path,
                "name": fileName,
                "size": data.count,
                "mimeType": UTType(typeIdentifier)?.preferredMIMEType ?? "application/octet-stream"
            ]
        } catch {
            print("Failed to save data: \(error)")
            return nil
        }
    }

    private func saveSharedFiles(_ files: [[String: Any]]) {
        guard let containerUrl = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            return
        }

        let metadataUrl = containerUrl.appendingPathComponent("shared_files.json")

        do {
            let data = try JSONSerialization.data(withJSONObject: files)
            try data.write(to: metadataUrl)
        } catch {
            print("Failed to save metadata: \(error)")
        }
    }

    private func openMainApp() {
        // Open main app with shared files
        guard let url = URL(string: "tallow://share/files") else { return }
        var responder: UIResponder? = self

        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                return
            }
            responder = responder?.next
        }

        // Fallback: use selector
        let selector = NSSelectorFromString("openURL:")
        var response: UIResponder? = self
        while response != nil {
            if response!.responds(to: selector) {
                response!.perform(selector, with: url)
                return
            }
            response = response?.next
        }
    }

    private func completeRequest(success: Bool) {
        if success {
            extensionContext?.completeRequest(returningItems: nil)
        } else {
            let error = NSError(domain: "app.tallow.mobile", code: 0, userInfo: nil)
            extensionContext?.cancelRequest(withError: error)
        }
    }

    private func mimeType(for url: URL) -> String {
        if let utType = UTType(filenameExtension: url.pathExtension) {
            return utType.preferredMIMEType ?? "application/octet-stream"
        }
        return "application/octet-stream"
    }
}
