
// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.2.1" apply false
}

buildscript {
    ext {
        // App dependencies
        val appCompatVersion by extra("1.6.1")
        val coreVersion by extra("1.12.0")
        val junitVersion by extra("4.13.2")
        val espressoVersion by extra("3.5.1")
        val testExtJunitVersion by extra("1.1.5")
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
