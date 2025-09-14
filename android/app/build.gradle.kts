import java.util.Properties
import java.io.FileInputStream

// Read properties from the root gradle.properties
val properties = Properties()
val propertiesFile = rootProject.file("gradle.properties")
if (propertiesFile.exists()) {
    properties.load(FileInputStream(propertiesFile))
}

// Define variables by reading from the properties, providing default values
val compileSdkVersion: String = properties.getProperty("compileSdkVersion", "34")
val minSdkVersion: String = properties.getProperty("minSdkVersion", "23")
val targetSdkVersion: String = properties.getProperty("targetSdkVersion", "34")
val buildToolsVersion: String = properties.getProperty("buildToolsVersion", "34.0.0")


plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.googleServices)
}

android {
    namespace = "com.udry.app"
    compileSdk = compileSdkVersion.toInt()
    buildToolsVersion = buildToolsVersion

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = minSdkVersion.toInt()
        targetSdk = targetSdkVersion.toInt()
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && File(keystorePath).exists()) {
                storeFile = File(keystorePath)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            } else {
                println("Release keystore not found at path specified by UDRY_KEYSTORE_PATH. Using debug signing.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    lint {
        abortOnError = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.firebase.bom)
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-status-bar"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
}
