import {Config} from '@remotion/cli/config';
import fs from 'fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Use the pre-installed Chromium headless shell when available (Claude Code
// remote environment). Elsewhere (the Higgsfield sandbox, a Mac) Remotion
// downloads its own headless shell automatically.
const preinstalled = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(preinstalled)) {
  Config.setBrowserExecutable(preinstalled);
}
