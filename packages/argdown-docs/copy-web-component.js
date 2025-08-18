const fs = require("fs");

// destination.txt will be created or overwritten by default.
fs.copyFile(
  "../argdown-web-components/dist/argdown-map.js",
  "./docs/.vuepress/public/argdown-map.js",
  err => {
    if (err) throw err;
  }
);
fs.copyFile(
  "../argdown-web-components/dist/argdown-map.css",
  "./docs/.vuepress/public/argdown-map.css",
  err => {
    if (err) throw err;
  }
);
