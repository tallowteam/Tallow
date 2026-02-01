# Tallow Mobile ProGuard Rules
# Keep these rules for production builds

#-------------------------------------------------
# Flutter specific rules
#-------------------------------------------------
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

#-------------------------------------------------
# Dart/Flutter generated code
#-------------------------------------------------
-keep class **.GeneratedPluginRegistrant { *; }

#-------------------------------------------------
# WebRTC
#-------------------------------------------------
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

#-------------------------------------------------
# Cryptography libraries
#-------------------------------------------------
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

# Keep crypto key classes
-keep class * extends java.security.Key { *; }
-keep class * extends java.security.PrivateKey { *; }
-keep class * extends java.security.PublicKey { *; }
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }

#-------------------------------------------------
# ML-KEM / liboqs (if using native library)
#-------------------------------------------------
-keep class org.openquantumsafe.** { *; }
-dontwarn org.openquantumsafe.**

#-------------------------------------------------
# Flutter Secure Storage
#-------------------------------------------------
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-keep class androidx.security.crypto.** { *; }

#-------------------------------------------------
# Socket.IO Client
#-------------------------------------------------
-keep class io.socket.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

#-------------------------------------------------
# mDNS / Network Service Discovery
#-------------------------------------------------
-keep class android.net.nsd.** { *; }

#-------------------------------------------------
# JSON serialization
#-------------------------------------------------
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod

# Keep Gson (if used)
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

# Keep any data classes used for JSON
-keep class * implements java.io.Serializable { *; }

#-------------------------------------------------
# Sentry
#-------------------------------------------------
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# Keep Sentry event processor classes
-keep class * extends io.sentry.EventProcessor { *; }
-keep class * extends io.sentry.Integration { *; }

#-------------------------------------------------
# QR Code libraries
#-------------------------------------------------
-keep class com.google.zxing.** { *; }
-dontwarn com.google.zxing.**

#-------------------------------------------------
# File picker
#-------------------------------------------------
-keep class com.mr.flutter.plugin.filepicker.** { *; }

#-------------------------------------------------
# Permissions handler
#-------------------------------------------------
-keep class com.baseflow.permissionhandler.** { *; }

#-------------------------------------------------
# Device info
#-------------------------------------------------
-keep class dev.fluttercommunity.plus.device_info.** { *; }

#-------------------------------------------------
# Connectivity
#-------------------------------------------------
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

#-------------------------------------------------
# Share Plus
#-------------------------------------------------
-keep class dev.fluttercommunity.plus.share.** { *; }

#-------------------------------------------------
# Path Provider
#-------------------------------------------------
-keep class io.flutter.plugins.pathprovider.** { *; }

#-------------------------------------------------
# General Android rules
#-------------------------------------------------
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

#-------------------------------------------------
# Prevent obfuscation of classes accessed via reflection
#-------------------------------------------------
-keepattributes InnerClasses
-keep class **.R
-keep class **.R$* {
    <fields>;
}

#-------------------------------------------------
# Optimization settings
#-------------------------------------------------
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose
-allowaccessmodification
-repackageclasses ''

#-------------------------------------------------
# Debug info for stack traces (remove in production for smaller APK)
#-------------------------------------------------
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
