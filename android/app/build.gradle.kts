// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.google.services) apply false
}

subprojects {
    afterEvaluate {
        if (plugins.hasPlugin("com.android.application") || plugins.hasPlugin("com.android.library")) {
            android {
                val compileSdkVersion: String by project
                compileSdk = compileSdkVersion.toInt()

                // Other common configurations can go here
                defaultConfig {
                     val minSdkVersion: String by project
                     minSdk = minSdkVersion.toInt()
                }

                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_1_8
                    targetCompatibility = JavaVersion.VERSION_1_8
                }
            }
        }
    }
}
