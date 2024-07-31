//////////////////////////////////////////////////////////////////////////////////////////
//                    This file is part of the Dynamic Badges Action                    //
// It may be used under the terms of the MIT license. See the LICENSE file for details. //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import core from "@actions/core";
import { makeBadge } from "badge-maker";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const util = require('util');

const hostUrl = new URL(core.getInput("host"));

// This uses the method above to update a gist with the given data. The user agent is
// required as defined in https://developer.github.com/v3/#user-agent-required
async function updateBadge(body) {
  const headers = new Headers([
    ["Content-Type", "application/json"],
    ["Content-Length", new TextEncoder().encode(body).length],
    ["User-Agent", "gitea-dynamic-badges"],
    ["x-api-key", `${core.getInput("auth")}`],
  ]);

  let response = await fetch(hostUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    console.log("Returned: %j", response.body);
    console.log(`Fetching badge failed: ${console.log(util.inspect(response, false, null, true /* enable colors */))}`);
    if (response.status === 409) {
      // This means likely the badge already exists.  Try to patch
      response = await fetch(hostUrl, {
        method: 'PATCH',
        headers,
        body,
      });
      if (!response.ok) {
        core.setFailed(
          `Failed to create gist, response status code: ${response.status} ${response.statusText}`
        );
    
    
        return;
    }
    }
  }

  console.log("Success!");
}


// We wrap the entire action in a try / catch block so we can set it to "failed" if
// something goes wrong.
try {
  // This object will be stringified and uploaded to the gist. The schemaVersion, label
  // and message attributes are always required. All others are optional and added to the
  // content object only if they are given to the action.
  let data = {
    schemaVersion: 1,
    label: core.getInput("label"),
    message: core.getInput("message"),
  };


  // Compute the message color based on the given inputs.
  const color = core.getInput("color");
  const valColorRange = core.getInput("valColorRange");
  const minColorRange = core.getInput("minColorRange");
  const maxColorRange = core.getInput("maxColorRange");
  const invertColorRange = core.getInput("invertColorRange");
  const colorRangeSaturation = core.getInput("colorRangeSaturation");
  const colorRangeLightness = core.getInput("colorRangeLightness");

  if (minColorRange != "" && maxColorRange != "" && valColorRange != "") {
    const max = parseFloat(maxColorRange);
    const min = parseFloat(minColorRange);
    let val = parseFloat(valColorRange);

    if (val < min) val = min;
    if (val > max) val = max;

    let hue = 0;
    if (invertColorRange == "") {
      hue = Math.floor(((val - min) / (max - min)) * 120);
    } else {
      hue = Math.floor(((max - val) / (max - min)) * 120);
    }

    let sat = 100;
    if (colorRangeSaturation != "") {
      sat = parseFloat(colorRangeSaturation);
    }

    let lig = 40;
    if (colorRangeLightness != "") {
      lig = parseFloat(colorRangeLightness);
    }

    data.color = "hsl(" + hue + ", " + sat + "%, " + lig + "%)";
  } else if (color != "") {
    data.color = color;
  }

  // Get all optional attributes and add them to the content object if given.
  const labelColor = core.getInput("labelColor");
  const isError = core.getInput("isError");
  const namedLogo = core.getInput("namedLogo");
  const logoSvg = core.getInput("logoSvg");
  const logoColor = core.getInput("logoColor");
  const logoWidth = core.getInput("logoWidth");
  const logoPosition = core.getInput("logoPosition");
  const style = core.getInput("style");
  const cacheSeconds = core.getInput("cacheSeconds");

  if (labelColor != "") {
    data.labelColor = labelColor;
  }

  if (isError != "") {
    data.isError = isError;
  }

  if (namedLogo != "") {
    data.namedLogo = namedLogo;
  }

  if (logoSvg != "") {
    data.logoSvg = logoSvg;
  }

  if (logoColor != "") {
    data.logoColor = logoColor;
  }

  if (logoWidth != "") {
    data.logoWidth = parseInt(logoWidth);
  }

  if (logoPosition != "") {
    data.logoPosition = logoPosition;
  }

  if (style != "") {
    data.style = style;
  }

  if (cacheSeconds != "") {
    data.cacheSeconds = parseInt(cacheSeconds);
  }

  let content = "";

  content = JSON.stringify({ payload: { data } });

  console.log("Body of request: %s", content);

  updateBadge(content);
  
} catch (error) {
  core.setFailed(error);
}
