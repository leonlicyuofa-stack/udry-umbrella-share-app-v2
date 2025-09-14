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

rootProject.name = "android"
include(":app")
include(":capacitor-android")
include(":capacitor-app")
include(":capacitor-camera")
include(":capacitor-community-bluetooth-le")
include(":capacitor-community-sqlite")
include(":capacitor-cordova-android-plugins")
include(":capacitor-status-bar")
