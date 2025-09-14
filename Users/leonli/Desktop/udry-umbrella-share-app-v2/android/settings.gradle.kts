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
project(":capacitor-android").projectDir = file("../node_modules/@capacitor/android/capacitor")
include(":capacitor-app")
project(":capacitor-app").projectDir = file("../node_modules/@capacitor/app/android")
include(":capacitor-camera")
project(":capacitor-camera").projectDir = file("../node_modules/@capacitor/camera/android")
include(":capacitor-community-bluetooth-le")
project(":capacitor-community-bluetooth-le").projectDir = file("../node_modules/@capacitor-community/bluetooth-le/android")
include(":capacitor-community-sqlite")
project(":capacitor-community-sqlite").projectDir = file("../node_modules/@capacitor-community/sqlite/android")
include(":capacitor-cordova-android-plugins")
project(":capacitor-cordova-android-plugins").projectDir = file("./capacitor-cordova-android-plugins")
include(":capacitor-status-bar")
project(":capacitor-status-bar").projectDir = file("../node_modules/@capacitor/status-bar/android")
