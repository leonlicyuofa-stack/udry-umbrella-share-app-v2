// Top-level build file where you can add configuration options common to all sub-projects/modules.

// Defines the versions of plugins and libraries used in the project
// In a Kotlin DSL file (.kts), you use `val` to declare variables.
val kotlinVersion = "1.9.22"
val activityVersion = "1.8.2"
val appcompatVersion = "1.6.1"
val coordinatorlayoutVersion = "1.2.0"
val coreSplashScreenVersion = "1.0.1"
val espressoCoreVersion = "3.5.1"
val extJunitVersion = "1.1.5"
val junitVersion = "4.13.2"
val materialVersion = "1.11.0"
val webkitVersion = "1.10.0"

plugins {
    id("com.android.application") version "8.2.1" apply false
    id("com.android.library") version "8.2.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
