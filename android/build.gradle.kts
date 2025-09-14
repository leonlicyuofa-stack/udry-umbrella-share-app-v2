// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.googleServices) apply false
}

// Define common variables for all subprojects
subprojects {
    // This block applies configuration to each subproject (like :app, :capacitor-android, etc.)
    afterEvaluate {
        // We check if the subproject has the Android plugin applied to it
        if (project.plugins.hasPlugin("com.android.application") || project.plugins.hasPlugin("com.android.library")) {
            // The 'android' extension is available only after the plugin has been applied
            extensions.configure<com.android.build.api.dsl.CommonExtension<*, *, *, *, *, *>> {
                compileSdk = 34
                defaultConfig {
                    minSdk = 22
                }
                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_1_8
                    targetCompatibility = JavaVersion.VERSION_1_8
                }
            }
        }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
