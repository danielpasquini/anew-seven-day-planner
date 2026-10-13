const fs = require("node:fs")
const path = require("node:path")
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins")

module.exports = function withBackupPolicy(config) {
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application?.[0]
    if (!app) throw new Error("Anew backup policy: application manifest is missing")
    app.$["android:allowBackup"] = "false"
    app.$["android:fullBackupContent"] = "@xml/anew_backup_rules"
    app.$["android:dataExtractionRules"] = "@xml/anew_data_extraction_rules"
    return mod
  })
  return withDangerousMod(config, ["android", async mod => {
    const directory = path.join(mod.modRequest.platformProjectRoot, "app/src/main/res/xml")
    fs.mkdirSync(directory, { recursive: true })
    const excludes = ["root", "file", "database", "sharedpref", "external", "device_root", "device_file", "device_database", "device_sharedpref"].map(domain => `    <exclude domain="${domain}" path="." />`).join("\n")
    fs.writeFileSync(path.join(directory, "anew_backup_rules.xml"), `<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n${excludes}\n</full-backup-content>\n`)
    fs.writeFileSync(path.join(directory, "anew_data_extraction_rules.xml"), `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup disableIfNoEncryptionCapabilities="true">\n${excludes}\n  </cloud-backup>\n  <device-transfer>\n${excludes}\n  </device-transfer>\n</data-extraction-rules>\n`)
    return mod
  }])
}
