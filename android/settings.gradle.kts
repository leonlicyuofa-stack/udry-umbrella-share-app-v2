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

project(":capacitor-android").projectDir = file("../node_modules/@capacitor/android/capacitor")
project(":capacitor-app").projectDir = file("../node_modules/@capacitor/app/android")
project(":capacitor-camera").projectDir = file("../node_modules/@capacitor/camera/android")
project(":capacitor-community-bluetooth-le").projectDir = file("../node_modules/@capacitor-community/bluetooth-le/android")
project(":capacitor-community-sqlite").projectDir = file("../node_modules/@capacitor-community/sqlite/android")
project(":capacitor-status-bar").projectDir = file("../node_modules/@capacitor/status-bar/android")
