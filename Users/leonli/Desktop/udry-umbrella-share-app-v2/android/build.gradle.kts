// Top-level build file where you can add configuration options common to all sub-projects/modules.
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
    afterEvaluate {
        // We can't use `pluginManager.withPlugin` here as it is too late in the lifecycle
        // Instead, we find the extension if it exists.
        project.extensions.findByName("android")?.let { androidExtension ->
            if (androidExtension is com.android.build.api.dsl.CommonExtension<*, *, *, *, *, *>) {
                androidExtension.apply {
                    setCompileSdkVersion(compileSdkVersion)
                    buildToolsVersion = this@subprojects.buildToolsVersion

                    defaultConfig {
                        minSdk = this@subprojects.minSdkVersion
                        targetSdk = this@subprojects.targetSdkVersion
                    }

                    lint {
                        abortOnError = false
                    }
                }
            }
        }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
