const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");

const STATES = [
  "happy",
  "crying",
  "angry",
  "lonely",
  "furious",
  "please",
  "waiting",
  "heartbroken",
  "sleeping",
  "missed",
];

const ALIASES = {
  happy: "PandaHappyAlias",
  crying: "PandaCryingAlias",
  angry: "PandaAngryAlias",
  lonely: "PandaLonelyAlias",
  furious: "PandaFuriousAlias",
  please: "PandaPleaseAlias",
  waiting: "PandaWaitingAlias",
  heartbroken: "PandaHeartbrokenAlias",
  sleeping: "PandaSleepingAlias",
  missed: "PandaMissedAlias",
};

function addPermission(manifest, name) {
  manifest["uses-permission"] = manifest["uses-permission"] || [];
  const exists = manifest["uses-permission"].some(
    (item) => item.$ && item.$["android:name"] === name
  );
  if (!exists) {
    manifest["uses-permission"].push({ $: { "android:name": name } });
  }
}

function isLauncherIntentFilter(filter) {
  const actions = filter.action || [];
  const categories = filter.category || [];
  const hasMain = actions.some(
    (item) => item.$?.["android:name"] === "android.intent.action.MAIN"
  );
  const hasLauncher = categories.some(
    (item) => item.$?.["android:name"] === "android.intent.category.LAUNCHER"
  );
  return hasMain && hasLauncher;
}

function withTrackerManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    addPermission(manifest, "android.permission.PACKAGE_USAGE_STATS");
    addPermission(manifest, "android.permission.READ_CALL_LOG");
    addPermission(manifest, "android.permission.READ_CONTACTS");

    const application = manifest.application?.[0];
    if (!application) {
      throw new Error("Procrastination tracker: Android application node was not found.");
    }

    application.activity = application.activity || [];
    const mainActivity = application.activity.find((activity) => {
      const name = activity.$?.["android:name"] || "";
      return name === ".MainActivity" || name.endsWith(".MainActivity");
    });

    if (!mainActivity) {
      throw new Error("Procrastination tracker: MainActivity was not found.");
    }

    const mainActivityName = mainActivity.$["android:name"];
    mainActivity["intent-filter"] = (mainActivity["intent-filter"] || []).filter(
      (filter) => !isLauncherIntentFilter(filter)
    );

    const aliasNames = new Set(Object.values(ALIASES).map((name) => `.${name}`));
    application["activity-alias"] = (application["activity-alias"] || []).filter(
      (alias) => !aliasNames.has(alias.$?.["android:name"])
    );

    for (const state of STATES) {
      application["activity-alias"].push({
        $: {
          "android:name": `.${ALIASES[state]}`,
          "android:targetActivity": mainActivityName,
          "android:enabled": state === "happy" ? "true" : "false",
          "android:exported": "true",
          "android:label": "@string/app_name",
          "android:icon": `@mipmap/panda_${state}`,
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.intent.action.MAIN" } },
            ],
            category: [
              {
                $: {
                  "android:name": "android.intent.category.LAUNCHER",
                },
              },
            ],
          },
        ],
      });
    }

    const listenerName =
      "expo.modules.procrastinationtracker.WhatsAppCallNotificationListener";
    application.service = (application.service || []).filter(
      (service) => service.$?.["android:name"] !== listenerName
    );
    application.service.push({
      $: {
        "android:name": listenerName,
        "android:label": "French Made Simple - call tracker",
        "android:exported": "false",
        "android:permission":
          "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
      },
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name":
                  "android.service.notification.NotificationListenerService",
              },
            },
          ],
        },
      ],
    });

    return config;
  });
}

function withPandaIcons(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = config.modRequest.platformProjectRoot;
      const sourceDir = path.join(projectRoot, "assets", "panda-icons");
      const destinationDir = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "res",
        "mipmap-xxxhdpi"
      );

      fs.mkdirSync(destinationDir, { recursive: true });
      for (const state of STATES) {
        const source = path.join(sourceDir, `${state}.png`);
        const destination = path.join(destinationDir, `panda_${state}.png`);
        if (!fs.existsSync(source)) {
          throw new Error(`Missing Panda icon: ${source}`);
        }
        fs.copyFileSync(source, destination);
      }

      return config;
    },
  ]);
}

module.exports = function withProcrastinationTracker(config) {
  config = withTrackerManifest(config);
  config = withPandaIcons(config);
  return config;
};
