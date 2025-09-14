// build.gradle.kts
import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

// Diagnostic: Print environment variables as soon as the script is evaluated
println("--> [DIAGNOSTIC_ENV] Reading Keystore Path: " + System.getenv("UDRY_KEYSTORE_PATH"))
println("--> [DIAGNOSTIC_ENV] Reading Store Password: " + System.getenv("UDRY_STORE_PASSWORD"))
println("--> [DIAGNOSTIC_ENV] Reading Key Alias: " + System.getenv("UDRY_KEY_ALIAS"))
println("--> [DIAGNOSTIC_ENV] Reading Key Password: " + System.getenv("UDRY_KEY_PASSWORD"))


android {
    namespace = "com.udry.app"
    compileSdk = 34

    signingConfigs {
        create("release") {
            // Read signing credentials securely from environment variables
            val storeFile = System.getenv("UDRY_KEYSTORE_PATH")?.let { rootProject.file(it) }
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            // This block will only execute if all environment variables are present
            if (storeFile != null && storeFile.exists() && storePassword != null && keyAlias != null && keyPassword != null) {
                this.storeFile = storeFile
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
                
                // Final Diagnostic Check before signing
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] Store File Path: '${this.storeFile}'")
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] Store Password Loaded: '${this.storePassword != null}'")
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] Key Alias: '${this.keyAlias}'")
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] Key Password Loaded: '${this.keyPassword != null}'")

            } else {
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] One or more signing variables are null or keystore does not exist.")
                println("--> [DIAGNOSTIC_SIGNING_CONFIG] storeFile exists: ${storeFile?.exists()}")
            }
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
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Associate the signing config with the release build type
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
    implementation("androidx.core:core-ktx:1.13.1")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    implementation(platform("com.google.firebase:firebase-bom:33.0.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-functions")
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-status-bar"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
}
