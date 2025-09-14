// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

// Define versions in a central place
val compileSdkVersion = libs.versions.androidxAppCompat.get().substringBefore('.').toIntOrNull() ?: 34
val minSdkVersion = 23
val targetSdkVersion = 34
val buildToolsVersion = "34.0.0"

subprojects {
    afterEvaluate {
        val androidPlugin = project.plugins.findPlugin("com.android.base")
        if (androidPlugin != null) {
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
            }
        }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
