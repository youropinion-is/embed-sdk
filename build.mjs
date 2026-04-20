import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";

const isWatch = process.argv.includes("--watch");

// Collect all CSS from mode files (injected via injectStyles at runtime)
// The SDK injects styles at runtime, so we don't need a separate CSS build step.
// However, for users who want to import CSS separately in ESM:

const sharedConfig = {
    entryPoints: ["src/embed.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ["es2020", "chrome80", "firefox80", "safari14", "edge80"],
    platform: "browser",
    logLevel: "info",
};

async function build() {
    // ESM build
    await esbuild.build({
        ...sharedConfig,
        outfile: "dist/embed.esm.js",
        format: "esm",
    });

    // UMD/IIFE build (exposes window.yo)
    await esbuild.build({
        ...sharedConfig,
        outfile: "dist/embed.umd.js",
        format: "iife",
        globalName: "YoEmbed",
        footer: {
            js: "if(typeof window!=='undefined'){window.yo=YoEmbed.yo;}",
        },
    });

    // React bindings (ESM only, React is external)
    await esbuild.build({
        ...sharedConfig,
        entryPoints: ["src/react.tsx"],
        outfile: "dist/react.esm.js",
        format: "esm",
        external: ["react"],
        jsx: "automatic",
    });

    // Generate a minimal CSS file that users can optionally import
    // (styles are also auto-injected at runtime by each mode)
    writeFileSync(
        "dist/embed.css",
        "/* @youropinion/embed - Styles are auto-injected at runtime. This file is intentionally minimal. */\n"
    );

    const esmStats = readFileSync("dist/embed.esm.js");
    const umdStats = readFileSync("dist/embed.umd.js");
    const reactStats = readFileSync("dist/react.esm.js");
    console.log(`\n📦 Build complete:`);
    console.log(`   ESM:   ${(esmStats.length / 1024).toFixed(1)} KB`);
    console.log(`   UMD:   ${(umdStats.length / 1024).toFixed(1)} KB`);
    console.log(`   React: ${(reactStats.length / 1024).toFixed(1)} KB`);
}

if (isWatch) {
    const ctx = await esbuild.context({
        ...sharedConfig,
        outfile: "dist/embed.esm.js",
        format: "esm",
    });
    await ctx.watch();
    console.log("👀 Watching for changes...");
} else {
    await build();
}
