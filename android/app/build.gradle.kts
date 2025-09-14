import com.android.build.api.dsl.ApplicationExtension
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension

// Reading properties from gradle.properties
val compileSdkVersion = providers.gradleProperty("compileSdkVersion").get().toInt()
val minSdkVersion = providers.gradleProperty("minSdkVersion").get().toInt()
val targetSdkVersion = providers.gradleProperty("targetSdkVersion").get().toInt()
val buildToolsVersion = providers.gradleProperty("buildToolsVersion").get()
val androidXAppCompatVersion = "1.6.1"

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
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
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    lint {
        abortOnError = false
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            
            // This block will configure signing for the 'release' build type
            val storeFile = System.getenv("UDRY_KEYSTORE_PATH")?.let { rootProject.file(it) }
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (storeFile != null && storeFile.exists() && storePassword != null && keyAlias != null && keyPassword != null) {
                signingConfigs.create("release") {
                    this.storeFile = storeFile
                    this.storePassword = storePassword
                    this.keyAlias = keyAlias
                    this.keyPassword = keyPassword
                }
                signingConfig = signingConfigs.getByName("release")
            } else {
                println("Release signing config not found. Building with debug signing config.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation("androidx.appcompat:appcompat:$androidXAppCompatVersion")
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(libs.espresso.core)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(project(":capacitor-status-bar"))

    // Firebase
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
}
