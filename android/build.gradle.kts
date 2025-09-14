// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.google.services) apply false
}

// Define project-wide versions as extra properties
val compileSdkVersion by extra(34)
val buildToolsVersion by extra("34.0.0")
val minSdkVersion by extra(22)
val targetSdkVersion by extra(34)
val kotlinVersion by extra("1.9.22")

// Apply repositories to all projects (root and sub-projects)
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Apply Android-specific configurations ONLY to sub-projects (like :app and capacitor plugins)
subprojects {
    // Check if the sub-project has an Android plugin before trying to configure it
    plugins.withId("com.android.base") {
        extensions.configure<com.android.build.gradle.api.AndroidBasePlugin> {
            compileSdkVersion(34)
            buildToolsVersion("34.0.0")

            defaultConfig {
                minSdk = 22
                targetSdk = 34
                testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
            }

            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
    }
}


tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
