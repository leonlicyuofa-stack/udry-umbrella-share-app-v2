// Top-level build file where you can add configuration options common to all sub-projects/modules.
@Suppress("DSL_SCOPE_VIOLATION")
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

// Define versions in one place
val compileSdkVersion = libs.versions.compileSdk.get().toInt()
val minSdkVersion = libs.versions.minSdk.get().toInt()
val targetSdkVersion = libs.versions.targetSdk.get().toInt()
val buildToolsVersion = libs.versions.buildTools.get()

subprojects {
    project.plugins.withId("com.android.base") {
        project.extensions.configure<com.android.build.gradle.BaseExtension>("android") {
            compileSdkVersion(compileSdkVersion)
            buildToolsVersion(buildToolsVersion)

            defaultConfig {
                minSdk = minSdkVersion
                targetSdk = targetSdkVersion
                testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
            }

            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_1_8
                targetCompatibility = JavaVersion.VERSION_1_8
            }

            lint {
                abortOnError = false
            }
        }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
