# Proguard rules for CaraBase SDK
# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /home/gamer/android-sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

# Ktor-specific rules if needed
-keep class io.ktor.** { *; }

# Serialization
-keepattributes *Annotation*, EnclosingMethod, Signature
-keepnames class kotlinx.serialization.json.** { *; }
