// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.google.services) apply false
}

// Apply common configurations to all Android projects (app and libraries)
subprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin("com.android.application") || project.plugins.hasPlugin("com.android.library")) {
            project.extensions.findByType(com.android.build.api.dsl.CommonExtension::class.java)?.apply {
                // Read the compileSdkVersion from the root project's properties
                val compileSdkVersion: String by rootProject
                compileSdk = compileSdkVersion.toInt()
            }
        }
    }
}
