import com.android.build.gradle.AppExtension
import com.android.build.gradle.LibraryExtension

// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.googleServices) apply false
}

subprojects {
    val compileSdkVersion = providers.gradleProperty("compileSdkVersion")

    project.plugins.withId("com.android.application") {
        the<AppExtension>().apply {
            compileSdk = compileSdkVersion.get().toInt()
        }
    }
    project.plugins.withId("com.android.library") {
        the<LibraryExtension>().apply {
            compileSdk = compileSdkVersion.get().toInt()
        }
    }
}
