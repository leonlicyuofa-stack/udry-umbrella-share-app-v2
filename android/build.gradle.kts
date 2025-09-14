// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

val compileSdkVersion: Int by settings
val minSdkVersion: Int by settings
val targetSdkVersion: Int by settings
val buildToolsVersion: String by settings

subprojects {
    project.plugins.withId("com.android.base") {
        project.extensions.configure<com.android.build.gradle.BaseExtension>("android") {
            compileSdkVersion(this@subprojects.compileSdkVersion)
            buildToolsVersion(this@subprojects.buildToolsVersion)

            defaultConfig {
                minSdk = this@subprojects.minSdkVersion
                targetSdk = this@subprojects.targetSdkVersion

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

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
