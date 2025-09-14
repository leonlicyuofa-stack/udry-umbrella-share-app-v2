plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.googleServices)
}

android {
    namespace = "com.udry.app"
    compileSdk = providers.gradleProperty("compileSdkVersion").map { it.toInt() }.get()

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = providers.gradleProperty("minSdkVersion").map { it.toInt() }.get()
        targetSdk = providers.gradleProperty("targetSdkVersion").map { it.toInt() }.get()
        versionCode = providers.gradleProperty("versionCode").map { it.toInt() }.get()
        versionName = providers.gradleProperty("versionName").get()

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            // These are read from environment variables for security.
            // Do not hardcode them here. The build command provides them.
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
                println("Release keystore not found at path specified by UDRY_KEYSTORE_PATH. Release builds may not be signed.")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Correctly assign the release signing config
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
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(project(":capacitor-status-bar"))
}
