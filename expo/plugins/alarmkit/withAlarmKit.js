const {
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SWIFT = 'AlarmKitManager.swift';
const BRIDGE = 'AlarmKitBridge.m';
const SOUNDS = [
  'classic_alarm', 'retro_bell', 'goat_bleat', 'angry_cat', 'sad_trombone',
  'cow_moo', 'scottish_man', 'indian_auntie', 'french_man',
];
const USAGE =
  'CloQ uses alarms to wake you reliably even when your phone is on silent or in Focus.';

// 1. Info.plist usage description (required for AlarmKit authorization).
function withUsage(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSAlarmKitUsageDescription = USAGE;
    return cfg;
  });
}

// 2. Copy the native source + bundled sounds into the generated iOS project.
function withFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      const srcDir = path.join(projectRoot, 'plugins', 'alarmkit', 'native');
      const destDir = path.join(platformProjectRoot, projectName);
      const soundsDest = path.join(destDir, 'sounds');
      fs.mkdirSync(soundsDest, { recursive: true });
      fs.copyFileSync(path.join(srcDir, SWIFT), path.join(destDir, SWIFT));
      fs.copyFileSync(path.join(srcDir, BRIDGE), path.join(destDir, BRIDGE));
      for (const s of SOUNDS) {
        fs.copyFileSync(
          path.join(srcDir, 'sounds', `${s}.caf`),
          path.join(soundsDest, `${s}.caf`),
        );
      }
      return cfg;
    },
  ]);
}

// 3. Register the source files (main target) and sounds (resources) in the
//    Xcode project.
function withProject(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const target = proj.getFirstTarget().uuid;
    const groupKey =
      proj.findPBXGroupKey({ name: projectName }) ||
      proj.findPBXGroupKey({ path: projectName });

    for (const f of [SWIFT, BRIDGE]) {
      const rel = `${projectName}/${f}`;
      if (!proj.hasFile(rel)) {
        proj.addSourceFile(rel, { target }, groupKey);
      }
    }

    // addResourceFile's path-correction needs a PBXGroup named "Resources".
    if (!proj.pbxGroupByName('Resources')) {
      proj.addPbxGroup([], 'Resources');
    }
    for (const s of SOUNDS) {
      const rel = `${projectName}/sounds/${s}.caf`;
      if (!proj.hasFile(rel)) {
        proj.addResourceFile(rel, { target }, groupKey);
      }
    }

    return cfg;
  });
}

// 4. Preserve the Apple development team across prebuild regenerations so the
//    app target keeps signing (prebuild --clean otherwise drops it). The target
//    bundle id is read from app.json (ios.bundleIdentifier) rather than
//    hardcoded, so signing follows the configured id and never drifts.
const DEVELOPMENT_TEAM = 'RHK2L34N73';

function withSigning(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const appBundleId = cfg.ios && cfg.ios.bundleIdentifier;
    if (!appBundleId) return cfg;
    const configs = proj.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const entry = configs[key];
      if (typeof entry !== 'object' || !entry.buildSettings) continue;
      const bid = entry.buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
      if (bid && String(bid).replace(/"/g, '') === appBundleId) {
        entry.buildSettings.DEVELOPMENT_TEAM = DEVELOPMENT_TEAM;
        entry.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      }
    }
    return cfg;
  });
}

module.exports = function withAlarmKit(config) {
  config = withUsage(config);
  config = withFiles(config);
  config = withProject(config);
  config = withSigning(config);
  return config;
};
