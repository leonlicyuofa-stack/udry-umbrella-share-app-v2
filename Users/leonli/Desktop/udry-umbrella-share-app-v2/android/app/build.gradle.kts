import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.googleServices)
}

// Read properties from gradle.properties
val gradleProperties = Properties()
val propertiesFile = project.rootProject.file("gradle.properties")
if (propertiesFile.exists()) {
    gradleProperties.load(FileInputStream(propertiesFile))
}

val compileSdkVersion: Int = (gradleProperties.getProperty("compileSdkVersion") ?: "34").toInt()
val minSdkVersion: Int = (gradleProperties.getProperty("minSdkVersion") ?: "22").toInt()
val targetSdkVersion: Int = (gradleProperties.getProperty("targetSdkVersion") ?: "34").toInt()
val versionCode: Int = (gradleProperties.getProperty("versionCode") ?: "1").toInt()
val versionName: String = gradleProperties.getProperty("versionName") ?: "1.0"

android {
    namespace = "com.udry.app"
    compileSdk = compileSdkVersion

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = minSdkVersion
        targetSdk = targetSdkVersion
        versionCode = versionCode
        versionName = versionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            // Use environment variables for security, matching your run command
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && keystoreFile.isFile) {
                storeFile = file(keystorePath)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            } else {
                println("Release signing config not found. Using debug signing.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Correctly apply the signing config
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)

    implementation(project(":capacitor-android"))
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(project(":capacitor-cordova-android-plugins"))
    implementation(project(":capacitor-status-bar"))
}
