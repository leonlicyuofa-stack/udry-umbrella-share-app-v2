import com.android.build.api.dsl.ApplicationExtension
import org.jetbrains.kotlin.storage.ExceptionOccurredException

// Reading properties from gradle.properties
val compileSdkVersion = providers.gradleProperty("compileSdkVersion").get().toInt()
val minSdkVersion = providers.gradleProperty("minSdkVersion").get().toInt()
val targetSdkVersion = providers.gradleProperty("targetSdkVersion").get().toInt()
val buildToolsVersion = providers.gradleProperty("buildToolsVersion").get()

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.udry.app"
    compileSdk = compileSdkVersion

    defaultConfig {
        applicationId = "com.udry.app"
        minSdk = minSdkVersion
        targetSdk = targetSdkVersion
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildToolsVersion = buildToolsVersion

    signingConfigs {
        create("release") {
            // These environment variables are now read correctly by Gradle
            val keystorePath = System.getenv("UDRY_KEYSTORE_PATH")
            val storePass = System.getenv("UDRY_STORE_PASSWORD")
            val alias = System.getenv("UDRY_KEY_ALIAS")
            val keyPass = System.getenv("UDRY_KEY_PASSWORD")
            
            if (keystorePath != null && storePass != null && alias != null && keyPass != null) {
                storeFile = file(keystorePath)
                storePassword = storePass
                keyAlias = alias
                keyPassword = keyPass
            } else {
                println("Release signing config not found. Using debug signing.")
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // This now correctly references the "release" signing config we created above.
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    lint {
        abortOnError = false
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.core:core-splashscreen:1.0.1")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    implementation(project(":capacitor-app"))
    implementation(project(":capacitor-camera"))
    implementation(project(":capacitor-status-bar"))
    implementation(project(":capacitor-community-bluetooth-le"))
    implementation(project(":capacitor-community-sqlite"))
}
