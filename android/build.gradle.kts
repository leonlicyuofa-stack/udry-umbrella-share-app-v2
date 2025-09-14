// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

// Define versions in a central place
val compileSdkVersion = 34
val minSdkVersion = 23
val targetSdkVersion = 34
val buildToolsVersion = "34.0.0"

subprojects {
    project.plugins.whenPluginAdded {
        if (project.extensions.findByName("android") is com.android.build.gradle.BaseExtension) {
            project.extensions.configure<com.android.build.gradle.BaseExtension> {
                compileSdkVersion(compileSdkVersion)
                buildToolsVersion(buildToolsVersion)
                defaultConfig {
                    minSdk = minSdkVersion
                    targetSdk = targetSdkVersion
                    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
                }
                lint {
                    abortOnError = false
                }
                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_17
                    targetCompatibility = JavaVersion.VERSION_17
                }
            }
        }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
