// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

// Read versions from gradle.properties
val compileSdkVersion: Int = (findProperty("compileSdkVersion") as String).toInt()
val minSdkVersion: Int = (findProperty("minSdkVersion") as String).toInt()
val targetSdkVersion: Int = (findProperty("targetSdkVersion") as String).toInt()
val buildToolsVersion: String = findProperty("buildToolsVersion") as String

subprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin("com.android.application") || project.plugins.hasPlugin("com.android.library")) {
            project.extensions.configure<com.android.build.api.dsl.CommonExtension<*, *, *, *, *, *>>("android") {
                setCompileSdkVersion(compileSdkVersion)
                buildToolsVersion = this@subprojects.buildToolsVersion

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
