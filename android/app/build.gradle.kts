import java.util.Properties
import java.io.FileInputStream

// This is a Kotlin Gradle script (.kts), which is the modern standard for Android builds.

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

// Function to safely read environment variables or return null
fun env(name: String): String? = System.getenv(name)

android {
    namespace = "com.udry.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = 22
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // This block configures the app signing for release builds.
    // It reads credentials securely from environment variables.
    signingConfigs {
        create("release") {
            // These environment variables must be set on your local machine.
            // On macOS/Linux:
            // export UDRY_KEYSTORE_PATH=~/Desktop/udry-umbrella-share-app-v2/android/app/my-release-key.keystore
            // export UDRY_KEY_ALIAS=udry_alias
            // export UDRY_KEYSTORE_PASSWORD=udry-secret-password
            // export UDRY_KEY_PASSWORD=udry-secret-password
            storeFile = env("UDRY_KEYSTORE_PATH")?.let { rootProject.file(it) }
            storePassword = env("UDRY_KEYSTORE_PASSWORD")
            keyAlias = env("UDRY_KEY_ALIAS")
            keyPassword = env("UDRY_KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // This line links the release build type to our signing configuration.
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation(project(":capacitor-android"))
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-status-bar"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
}

// Applies the Capacitor Gradle plugin
apply(from = "capacitor.build.gradle")
