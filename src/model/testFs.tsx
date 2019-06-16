let fs: any;
if (process.env.REACT_APP_MODE === "electron") {
  console.log(`REQUIRING fs-extra`);
  fs = require("fs-extra");
  //fs = require('fs');
}

export default function getDirectoryListing(props: any): string {
  if (process.env.REACT_APP_MODE === "electron" && props && props.length > 0) {
    var tempList: Array<string> = [];
    props.forEach((media: any) => {
      if (!media.isAnnotation) {
        tempList.push(media.name);
      }
    });
    tempList = tempList.sort();
    tempList.sort(function(a: string, b: string) {
      var nameA = a.toLowerCase(),
        nameB = b.toLowerCase();
      if (nameA < nameB)
        //sort string ascending
        return -1;
      if (nameA > nameB) return 1;
      return 0; //default return value (no sorting)
    });
    return tempList.join("\n");
  } else if (process.env.REACT_APP_MODE === "electron") {
    let files = fs.readdirSync(".");
    return JSON.stringify(files, null, 2);
  } else {
    return "Directory listing is not available in the browser.";
  }
}
