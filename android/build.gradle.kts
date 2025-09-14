// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}

// Define versions in a central place to be used by sub-projects
ext {
    set("compileSdkVersion", 34)
    set("minSdkVersion", 22)
    set("targetSdkVersion", 34)
    set("buildToolsVersion", "34.0.0")
}
