import org.gradle.api.initialization.resolve.RepositoriesMode

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    // Reverted to PREFER_SETTINGS to allow Capacitor's legacy build scripts to function.
    // This resolves the error where subprojects try to declare their own repositories.
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "android"
include(":app")

val capacitorProjectPath = settings.rootDir.parentFile
val nodeModulesPath = File(capacitorProjectPath, "node_modules")

include(":capacitor-android")
project(":capacitor-android").projectDir = File(nodeModulesPath, "@capacitor/android/capacitor")

include(":capacitor-app")
project(":capacitor-app").projectDir = File(nodeModulesPath, "@capacitor/app/android")

include(":capacitor-camera")
project(":capacitor-camera").projectDir = File(nodeModulesPath, "@capacitor/camera/android")

include(":capacitor-status-bar")
project(":capacitor-status-bar").projectDir = File(nodeModulesPath, "@capacitor/status-bar/android")

include(":capacitor-community-bluetooth-le")
project(":capacitor-community-bluetooth-le").projectDir = File(nodeModulesPath, "@capacitor-community/bluetooth-le/android")

include(":capacitor-community-sqlite")
project(":capacitor-community-sqlite").projectDir = File(nodeModulesPath, "@capacitor-community/sqlite/android")
