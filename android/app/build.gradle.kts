import com.android.build.api.dsl.ApplicationExtension
import org.jetbrains.kotlin.storage.ExceptionOccurredException

// Reading properties and converting them to the correct types
val compileSdkVersion: Int = (findProperty("compileSdkVersion") as? String)?.toInt() ?: 34
val minSdkVersion: Int = (findProperty("minSdkVersion") as? String)?.toInt() ?: 23
val targetSdkVersion: Int = (findProperty("targetSdkVersion") as? String)?.toInt() ?: 34
val versionCode: Int = (findProperty("versionCode") as? String)?.toInt() ?: 1
val versionName: String = findProperty("versionName") as? String ?: "1.0"
val buildToolsVersion: String = findProperty("buildToolsVersion") as? String ?: "34.0.0"

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.googleServices)
}

android {
    namespace = "com.udry.app"
    compileSdk = compileSdkVersion
    buildToolsVersion = buildToolsVersion

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = minSdkVersion
        targetSdk = targetSdkVersion
        versionCode = versionCode
        versionName = versionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    lint {
        abortOnError = false
    }

    signingConfigs {
        create("release") {
            // These are read from environment variables for security
            storeFile = file(System.getenv("UDRY_KEYSTORE_PATH") ?: "app/my-release-key.keystore")
            storePassword = System.getenv("UDRY_STORE_PASSWORD")
            keyAlias = System.getenv("UDRY_KEY_ALIAS")
            keyPassword = System.getenv("UDRY_KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    implementation(libs.androidx.test.ext.junit)
    implementation(libs.espresso.core)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    testImplementation(libs.junit)
}
