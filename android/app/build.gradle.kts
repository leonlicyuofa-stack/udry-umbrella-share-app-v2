import java.io.FileInputStream
import java.util.Properties

// Apply the necessary plugins for an Android application.
// Versions are now managed centrally, so we don't specify them here.
plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.googleServices)
}

// Keystore properties setup
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

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

    // --- Temporarily removed for baseline testing ---
    // buildTypes {
    //     getByName("release") {
    //         isMinifyEnabled = false
    //         proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    //     }
    // }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(project(":capacitor-status-bar"))
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
}
