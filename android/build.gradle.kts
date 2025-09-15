// Top-level build file where you can add configuration options common to all sub-projects/modules.
import com.android.build.api.dsl.ApplicationExtension
import com.android.build.api.dsl.LibraryExtension

plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.googleServices) apply false
}

val compileSdkVersion by extra { "34" }

subprojects {
    project.plugins.withId("com.android.application") {
        configure<ApplicationExtension> {
            compileSdk = providers.gradleProperty("compileSdkVersion").get().toInt()
        }
    }
    project.plugins.withId("com.android.library") {
        configure<LibraryExtension> {
            compileSdk = providers.gradleProperty("compileSdkVersion").get().toInt()
        }
    }
}
