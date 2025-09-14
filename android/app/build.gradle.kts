plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.googleServices)
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
    
    // Defines the signing configuration for the release build.
    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            if (keystorePath != null && File(project.rootDir, keystorePath).exists()) {
                storeFile = File(project.rootDir, keystorePath)
                storePassword = System.getenv("UDRY_STORE_PASSWORD")
                keyAlias = System.getenv("UDRY_KEY_ALIAS")
                keyPassword = System.getenv("UDRY_KEY_PASSWORD")
            } else {
                 println("Warning: Keystore not found at $keystorePath. Release builds will not be signed.")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // This line tells the release build to use the signing config defined above.
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    buildFeatures {
      buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)

    // Capacitor
    implementation(project(":capacitor-android"))
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
