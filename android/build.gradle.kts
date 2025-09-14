// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    // We apply the plugins here at the root level.
    // The versions are now managed centrally in the project's version catalog (`libs.versions.toml`).
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.googleServices) apply false
}
