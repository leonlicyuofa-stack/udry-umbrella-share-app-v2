plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.googleServices) apply false
}

val compileSdkVersion: String by project

subprojects {
    project.plugins.withId("com.android.application") {
        the<com.android.build.api.dsl.ApplicationExtension>().apply {
            compileSdk = providers.gradleProperty("compileSdkVersion").get().toInt()
        }
    }
    project.plugins.withId("com.android.library") {
        the<com.android.build.gradle.api.dsl.LibraryExtension>().apply {
            compileSdk = providers.gradleProperty("compileSdkVersion").get().toInt()
        }
    }
}
