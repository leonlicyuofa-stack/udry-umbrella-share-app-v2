// Top-level build file where you can add configuration options common to all sub-projects/modules.

// Apply the allprojects block to configure all projects in the build
allprojects {
    // Repositories for all projects
    repositories {
        google()
        mavenCentral()
    }
}

// Configure sub-projects (including Capacitor plugins)
subprojects {
    // This block applies configurations after each sub-project has been evaluated.
    afterEvaluate {
        // Check if the sub-project has the 'android' extension (i.e., is an Android module)
        if (project.extensions.findByName("android") is com.android.build.gradle.api.AndroidBasePlugin) {
            // Apply common Android settings
            project.extensions.configure<com.android.build.gradle.api.AndroidBasePlugin>("android") {
                val compileSdkVersion: String by project
                val buildToolsVersion: String by project

                compileSdkVersion(compileSdkVersion)
                buildToolsVersion(buildToolsVersion)

                // Common lint options for all Android modules
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
