plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

// Read properties from gradle.properties and provide default values
val compileSdkVersion: Int = (project.findProperty("compileSdkVersion") as? String ?: "34").toInt()
val minSdkVersion: Int = (project.findProperty("minSdkVersion") as? String ?: "22").toInt()
val targetSdkVersion: Int = (project.findProperty("targetSdkVersion") as? String ?: "34").toInt()
val buildToolsVersion: String = project.findProperty("buildToolsVersion") as? String ?: "34.0.0"

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
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePassword = System.getenv("UDRY_STORE_PASSWORD")
            val keyAlias = System.getenv("UDRY_KEY_ALIAS")
            val keyPassword = System.getenv("UDRY_KEY_PASSWORD")

            if (keystorePath != null && storePassword != null && keyAlias != null && keyPassword != null) {
                signingConfigs.create("release") {
                    storeFile = rootProject.file(keystorePath)
                    this.storePassword = storePassword
                    this.keyAlias = keyAlias
                    this.keyPassword = keyPassword
                }
                signingConfig = signingConfigs.getByName("release")
            } else {
                println("Release signing config not found, using debug signing.")
                signingConfig = signingConfigs.getByName("debug")
            }
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
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
}
