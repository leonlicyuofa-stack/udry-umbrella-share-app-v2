// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.googleServices) apply false
}

subprojects {
    val compileSdkVersion by project.extra(providers.gradleProperty("compileSdkVersion"))

    plugins.withId("com.android.application") {
        extensions.getByType<com.android.build.api.dsl.ApplicationExtension>().apply {
            compileSdk = compileSdkVersion.toInt()
        }
    }
    plugins.withId("com.android.library") {
        extensions.getByType<com.android.build.api.dsl.LibraryExtension>().apply {
            compileSdk = compileSdkVersion.toInt()
        }
    }
}
