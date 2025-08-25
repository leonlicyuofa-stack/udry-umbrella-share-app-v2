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
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "android"
include(":app")
include(":capacitor-android")
project(":capacitor-android").projectDir = file("capacitor-android")
include(":capacitor-community-sqlite")
project(":capacitor-community-sqlite").projectDir = file("capacitor-cordova-android-plugins/src/main/java/com/getcapacitor/community/database/sqlite/capacitor-community-sqlite")
