import { electronAPI } from '../utils/electronAPI';

export default async function getDirectoryListing(props: any): Promise<string> {
  if (process.env.REACT_APP_MODE === "electron" && props && props.length > 0) {
    let tempList: string[] = [];
    props.forEach((media: any) => {
      if (!media.isAnnotation) {
        tempList.push(media.name);
      }
    });
    tempList = tempList.sort();
    tempList.sort(function (a: string, b: string) {
      const nameA = a.toLowerCase();
      const nameB = b.toLowerCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) return 1;
      return 0; // default return value (no sorting)
    });
    return tempList.join("\n");
  } else if (process.env.REACT_APP_MODE === "electron") {
    // Use secure API to read current directory
    const cwd = await electronAPI.getCwd();
    const fileStats = await electronAPI.readDirectory(cwd);
    const files = fileStats.map(f => f.name);
    return JSON.stringify(files, undefined, 2);
  } else {
    return "Directory listing is not available in the browser.";
  }
}
