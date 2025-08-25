
import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
}

android {
    namespace = "com.getcapacitor.myapp" // You can change this to your app's package name
    compileSdk = 34
    defaultConfig {
        applicationId = "com.getcapacitor.app" // Must match value in string.xml and AndroidManifest.xml
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
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
     buildFeatures {
        // Note: If you have data binding, view binding, etc., you would enable them here.
        // For this Capacitor project, they are typically not needed.
    }
}

dependencies {
    implementation(project(":capacitor-android"))
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.coordinatorlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation(project(":capacitor-cordova-android-plugins"))
}

// Read properties from local.properties file
val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localProperties.load(FileInputStream(localPropertiesFile))
}

// Define dependencies in a version catalog (libs)
val libs = extensions.getByType<VersionCatalogsExtension>().named("libs")

apply(from = "../../node_modules/@capacitor/android/capacitor.build.gradle.kts")
