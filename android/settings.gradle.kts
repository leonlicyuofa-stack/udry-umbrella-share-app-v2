
// The settings.gradle.kts file is used to specify which sub-projects to include in a build.

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "udry-umbrella-share-app"
include(":app")
include(":capacitor-android")
project(":capacitor-android").projectDir = file("./capacitor-android")
