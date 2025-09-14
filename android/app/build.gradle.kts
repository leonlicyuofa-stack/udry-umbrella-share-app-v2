// Top-level build file for the app module, using Kotlin DSL

// 1. APPLY PLUGINS
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.google.services)
    kotlin("android")
}

// 2. ANDROID CONFIGURATION
android {
    namespace = "com.udry.app"
    
    // Read properties safely using the providers API
    compileSdk = providers.gradleProperty("compileSdkVersion").map { it.toInt() }.get()

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = providers.gradleProperty("minSdkVersion").map { it.toInt() }.get()
        targetSdk = providers.gradleProperty("targetSdkVersion").map { it.toInt() }.get()
        versionCode = providers.gradleProperty("versionCode").map { it.toInt() }.get()
        versionName = providers.gradleProperty("versionName").get()

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // 3. SIGNING CONFIGURATIONS
    signingConfigs {
        create("release") {
            // Use environment variables for security
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && File(keystorePath).exists()) {
                storeFile = file(keystorePath)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            } else {
                println("Release keystore not found at path: $keystorePath. Using debug signing for release build.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    // 4. BUILD TYPES
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Correctly assign the release signing configuration
            signingConfig = signingConfigs.getByName("release")
        }
    }

    // 5. COMPILE OPTIONS
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // 6. BUILD FEATURES
    buildFeatures {
        viewBinding = true
    }
}

// 7. DEPENDENCIES
dependencies {
    // Standard Android dependencies
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)

    // Firebase Bill of Materials (BoM) - manages versions for Firebase libraries
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    
    // Capacitor
    implementation(project(":capacitor-android"))

    // Testing dependencies
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
}
