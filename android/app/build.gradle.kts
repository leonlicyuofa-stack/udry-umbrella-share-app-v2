import com.android.build.api.dsl.ApplicationExtension
import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.googleServices)
}

// Read properties from gradle.properties
val gradleProperties = Properties()
val propertiesFile = project.rootProject.file("gradle.properties")
if (propertiesFile.exists()) {
    gradleProperties.load(FileInputStream(propertiesFile))
}

val compileSdkVersion: Int = (gradleProperties["compileSdkVersion"] as? String)?.toInt() ?: 34
val minSdkVersion: Int = (gradleProperties["minSdkVersion"] as? String)?.toInt() ?: 23
val targetSdkVersion: Int = (gradleProperties["targetSdkVersion"] as? String)?.toInt() ?: 34
val versionCode: Int = (gradleProperties["versionCode"] as? String)?.toInt() ?: 1
val versionName: String = gradleProperties["versionName"] as? String ?: "1.0"


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
            // Read signing properties from environment variables
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && storePassword != null && keyAlias != null && keyPassword != null) {
                storeFile = file(keystorePath)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            } else {
                println("Release signing config not found. Building with debug signing config.")
                signingConfigs.getByName("debug")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }

    lint {
        abortOnError = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-community.bluetooth.le"))
    implementation(project(":capacitor-community.sqlite"))
    implementation(project(":capacitor-status.bar"))
}
