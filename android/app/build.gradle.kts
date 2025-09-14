plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.google.services)
}

val compileSdkVersion: String by project
val minSdkVersion: String by project
val targetSdkVersion: String by project
val versionCode: String by project
val versionName: String by project

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

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    signingConfigs {
        create("release") {
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
                println("Warning: Keystore not found at path: $keystorePath. Using debug signing for release build.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor.community.bluetooth.le"))
    implementation(project(":capacitor.community.sqlite"))
    implementation(project(":capacitor-status-bar"))
}
