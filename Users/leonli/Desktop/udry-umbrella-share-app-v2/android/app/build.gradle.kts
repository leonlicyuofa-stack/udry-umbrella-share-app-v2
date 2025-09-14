import java.util.Properties

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.udry.app"
    compileSdk = 34

    signingConfigs {
        create("release") {
            // --- DIAGNOSTIC PRINT STATEMENTS ---
            // This block will print the exact values read from the environment.
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            println("--> [DIAGNOSTIC] Read UDRY_KEYSTORE_PATH: $keystorePath")

            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            println("--> [DIAGNOSTIC] Read UDRY_STORE_PASSWORD: $storePassword")

            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            println("--> [DIAGNOSTIC] Read UDRY_KEY_ALIAS: $keyAlias")

            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")
            println("--> [DIAGNOSTIC] Read UDRY_KEY_PASSWORD: $keyPassword")
            // --- END DIAGNOSTIC BLOCK ---

            storeFile = if (keystorePath != null) rootProject.file(keystorePath) else null
            this.storePassword = storePassword
            this.keyAlias = keyAlias
            this.keyPassword = keyPassword
        }
    }

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = 22
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
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
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
    implementation(project(":capacitor-status-bar"))
}

apply(from = "../../node_modules/@capacitor/android/capacitor.build.gradle.kts")
