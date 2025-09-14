plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

// Read properties from gradle.properties
val compileSdkVersion: String by project
val minSdkVersion: String by project
val targetSdkVersion: String by project
val versionCode: String by project
val versionName: String by project

android {
    namespace = "com.udry.app"
    compileSdk = compileSdkVersion.toInt()

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = minSdkVersion.toInt()
        targetSdk = targetSdkVersion.toInt()
        versionCode = project.findProperty("versionCode")?.toString()?.toIntOrNull() ?: 1
        versionName = project.findProperty("versionName")?.toString() ?: "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            // Use environment variables for security, matching your build command
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && keystorePath.isNotEmpty()) {
                storeFile = file(keystorePath)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            } else {
                println("Release keystore information not found in environment variables. Using debug signing.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Correctly assign the release signing config
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
    implementation(project(":capacitor-android"))
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-status-bar"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(libs.androidx.appcompat)
    implementation(platform(libs.firebase.bom))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
}
